import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const { version } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
const versionLabel = version.includes("-") ? `DEV · ${version}` : `v${version}`;

for (const state of ["ready", "error"]) {
  test(`${state} workshop has no automatically detectable WCAG A/AA violation`, async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
    if (state === "error") {
      const editor = page.getByRole("textbox", { name: "Write your rules" });
      await editor.fill("unknown rule");
      await expect(editor).toHaveAttribute("aria-invalid", "true");
      await expect(editor).toHaveAttribute("aria-describedby", "rules-help recipe-note diagnostic");
      await expect(page.locator("#diagnostic")).toBeVisible();
    }
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      })),
    ).toEqual([]);
  });
}

test("keyboard can reach the editor, options, copy and test controls", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to workshop" })).toBeFocused();
  await page.getByRole("textbox", { name: "Write your rules" }).focus();
  await expect(page.getByRole("textbox", { name: "Write your rules" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /Read the syntax/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#ignore-case")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.locator("#ignore-case")).toBeChecked();
  await page.locator("#copy-button").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#copy-button")).toContainText("Copied");
  await page.locator("#match-mode").focus();
  await expect(page.locator("#match-mode")).toBeFocused();
});

test("generated regex is a named keyboard stop with native horizontal scrolling", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copiedPattern = text;
        },
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const output = page.getByRole("region", { name: "Generated JavaScript regex", exact: true });
  const copy = page.locator("#copy-button");
  const viewport = page.viewportSize();
  for (const literal of ["ABC", "x".repeat(4096)]) {
    const pattern = `/${literal}/u`;
    await page.locator("#rules-input").fill(JSON.stringify(literal));
    await expect(page.locator("#regex-output")).toHaveText(pattern);
    for (const width of [viewport.width, 320]) {
      await page.setViewportSize({ width, height: viewport.height });
      await page.locator("#dot-all").focus();
      await page.keyboard.press("Tab");
      await expect(output).toBeFocused();
      await expect(output).toHaveCSS("outline-style", "solid");
      expect(
        await output.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).outlineWidth),
        ),
      ).toBeGreaterThan(0);
      if (literal.length > 3) {
        expect(await output.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
          true,
        );
        const before = await output.evaluate((element) => element.scrollLeft);
        await page.keyboard.press("ArrowRight");
        await expect
          .poll(() => output.evaluate((element) => element.scrollLeft))
          .toBeGreaterThan(before);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.keyboard.press("Tab");
      await expect(copy).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(copy).toContainText("Copied");
      expect(await page.evaluate(() => window.copiedPattern)).toBe(pattern);
      await expect(copy).toBeFocused();
    }
  }
});

test("result panel keyboard focus contrasts with its surrounding background", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  await page.keyboard.press("Tab");
  for (const state of ["ready", "error"]) {
    if (state === "error") await page.locator("#rules-input").fill("unknown rule");
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
    const controls =
      state === "ready"
        ? [
            page.getByRole("region", { name: "Generated JavaScript regex", exact: true }),
            page.locator("#copy-button"),
            page.locator("#trace-list button").first(),
          ]
        : [page.getByRole("button", { name: "Go to error", exact: true })];
    for (const control of controls) {
      await control.focus();
      await expect(control).toBeFocused();
      await expect(control).toHaveCSS("outline-style", "solid");
      const indicator = await control.evaluate((element) => {
        const { Color, getContrast } = window.axe.commons.color;
        const style = getComputedStyle(element);
        const surrounding =
          Number.parseFloat(style.outlineOffset) < 0
            ? style
            : getComputedStyle(element.closest(".diagnostic, .result-panel"));
        const outline = new Color().parseString(style.outlineColor);
        const background = new Color().parseString(surrounding.backgroundColor);
        return {
          visible: element.matches(":focus-visible"),
          width: Number.parseFloat(style.outlineWidth),
          backgroundAlpha: background.alpha,
          contrast: getContrast(background, outline),
        };
      });
      expect(indicator.visible).toBe(true);
      expect(indicator.width).toBeGreaterThan(0);
      expect(indicator.backgroundAlpha).toBe(1);
      expect(indicator.contrast).toBeGreaterThanOrEqual(3);
    }
  }
});

test("a diagnostic can focus its exact source position from the keyboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const editor = page.locator("#rules-input");
  for (const [rules, marker] of [
    ['start "😀"\u2028  unexpected words', "unexpected"],
    ['start "😀"\n"bad\\q"', "\\q"],
    ['start "😀"\n"missing', null],
    ['start "😀"\n"missing   ', null],
    ['start 2 "missing\u00a0 ', null],
    ['start "😀"\none of: "missing   ', null],
    ['start "😀"\ntext without: a, "missing   ', null],
    ['start "😀"\nnone of: a, "bad\t ', "\t"],
  ]) {
    await editor.fill(rules);
    await page.getByRole("button", { name: "Go to error", exact: true }).press("Enter");
    await expect(editor).toBeFocused();
    const position = marker === null ? rules.length : rules.indexOf(marker);
    expect(
      await editor.evaluate((input) => ({ start: input.selectionStart, end: input.selectionEnd })),
    ).toEqual({ start: position, end: position + Number(marker !== null) });
  }
  const longRules = `${"digit\n".repeat(199)}unsupported words`;
  await editor.fill(longRules);
  await editor.evaluate((input) => {
    input.setSelectionRange(0, 0);
    input.scrollTop = 0;
  });
  await page.getByRole("button", { name: "Go to error", exact: true }).press("Enter");
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((input) => input.selectionStart)).toBe(
    longRules.indexOf("unsupported"),
  );
  await expect
    .poll(() =>
      editor.evaluate((input) => input.scrollHeight - input.clientHeight - input.scrollTop),
    )
    .toBeLessThanOrEqual(1);
  await editor.fill("digit");
  await expect(page.getByRole("button", { name: "Go to error", exact: true })).toHaveCount(0);
});

test("source navigation reveals wrapped and middle lines after the caret moves", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const editor = page.locator("#rules-input");
  const viewport = page.viewportSize();
  for (const width of [viewport.width, 320]) {
    await page.setViewportSize({ width, height: viewport.height });
    const prefix = `${"digit\n".repeat(20)}"${"x".repeat(2000)}"\n`;
    const rules = `${prefix}"TARGET"\n${"digit\n".repeat(30).trimEnd()}`;
    await editor.fill(rules);
    for (const [line, position, selected, followingLines] of [
      [22, prefix.length, '"TARGET"', 30],
      [52, rules.lastIndexOf("digit"), "digit", 0],
    ]) {
      await editor.evaluate((input) => {
        input.setSelectionRange(0, 0);
        input.scrollTop = 0;
      });
      await page.getByRole("button", { name: new RegExp(`^Rule on line ${line}:`) }).press("Enter");
      await expect(editor).toBeFocused();
      expect(await editor.evaluate((input) => [input.selectionStart, input.selectionEnd])).toEqual([
        position,
        position + selected.length,
      ]);
      await expect
        .poll(() =>
          editor.evaluate((input, following) => {
            const style = getComputedStyle(input);
            const height = Number.parseFloat(style.lineHeight);
            const top =
              input.scrollHeight -
              Number.parseFloat(style.paddingBottom) -
              (following + 1) * height;
            return (
              top >= input.scrollTop - 1 && top + height <= input.scrollTop + input.clientHeight + 1
            );
          }, followingLines),
        )
        .toBe(true);
      await expect(editor).toHaveValue(rules);
    }
    await page.getByRole("button", { name: /^Rule on line 1:/ }).press("Enter");
    await expect(editor).toBeFocused();
    expect(
      await editor.evaluate((input) => [input.selectionStart, input.selectionEnd, input.scrollTop]),
    ).toEqual([0, 5, 0]);
    const invalid = `"${"x".repeat(4000)}\\q"`;
    await editor.fill(invalid);
    await editor.evaluate((input) => {
      input.setSelectionRange(0, 0);
      input.scrollTop = 0;
    });
    await page.getByRole("button", { name: "Go to error", exact: true }).press("Enter");
    await expect(editor).toBeFocused();
    expect(await editor.evaluate((input) => input.selectionStart)).toBe(invalid.indexOf("\\q"));
    await expect
      .poll(() =>
        editor.evaluate((input) => input.scrollHeight - input.clientHeight - input.scrollTop),
      )
      .toBeLessThanOrEqual(1);
    await expect(editor).toHaveValue(invalid);
    await expect(page.locator("body > textarea")).toHaveCount(0);
  }
});

test("source navigation reveals its destination in the page viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const editor = page.locator("#rules-input");
  const viewport = page.viewportSize();
  for (const width of [viewport.width, 320]) {
    await page.setViewportSize({ width, height: viewport.height });
    for (const height of [null, 1200]) {
      await editor.evaluate((input, height) => {
        if (height === null) input.style.removeProperty("min-height");
        else input.style.minHeight = `${height}px`;
      }, height);
      for (const [last, name] of [
        ["unknown rule", "Go to error"],
        ['"TARGET"', /^Rule on line 91:/],
      ]) {
        const rules = `${"digit\n".repeat(90)}${last}`;
        await editor.fill(rules);
        await editor.evaluate((input) => {
          input.setSelectionRange(0, 0);
          input.scrollTop = 0;
        });
        await page.getByRole("button", { name }).press("Enter");
        await expect(editor).toBeFocused();
        expect(await editor.evaluate((input) => input.selectionStart)).toBe(rules.indexOf(last));
        await expect
          .poll(() =>
            editor.evaluate((input) => {
              const style = getComputedStyle(input);
              const lineHeight = Number.parseFloat(style.lineHeight);
              const top =
                input.getBoundingClientRect().top +
                Number.parseFloat(style.borderTopWidth) +
                Number.parseFloat(style.paddingTop) +
                90 * lineHeight -
                input.scrollTop;
              return top >= 0 && top + lineHeight <= window.innerHeight;
            }),
          )
          .toBe(true);
        await expect(editor).toHaveValue(rules);
      }
    }
  }
});

test("native resize grip enlarges the editor and retains its height through edits and recipes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const editor = page.locator("#rules-input");
  const original = await editor.inputValue();
  const viewport = page.viewportSize();
  async function resizeBy(delta) {
    await editor.evaluate((input) =>
      window.scrollBy({
        top: input.getBoundingClientRect().top - 50,
        behavior: "instant",
      }),
    );
    const box = await editor.boundingBox();
    const x = box.x + box.width - 8;
    const y = box.y + box.height - 8;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + delta, { steps: 10 });
    await page.mouse.up();
  }
  for (const width of [viewport.width, 320]) {
    await page.setViewportSize({ width, height: viewport.height });
    const before = await editor.evaluate((input) => ({
      height: input.clientHeight,
      width: input.clientWidth,
    }));
    await resizeBy(150);
    await expect
      .poll(() => editor.evaluate((input) => input.clientHeight))
      .toBeGreaterThan(before.height + 100);
    const enlarged = await editor.evaluate((input) => input.clientHeight);
    await expect(editor).toHaveValue(original);
    await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
    await editor.fill(original.replace("3 digits", "2 digits"));
    await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{2}$/u");
    await expect
      .poll(() => editor.evaluate((input) => input.clientHeight))
      .toBeGreaterThanOrEqual(enlarged - 1);
    await page.locator('[data-scenario="time-shape"]').click();
    await expect(page.locator("#regex-output")).toHaveText("/^\\d{2}:\\d{2}$/u");
    await expect(page.locator("#test-summary")).toHaveText("13 of 13 examples behave as expected");
    await expect
      .poll(() => editor.evaluate((input) => input.clientHeight))
      .toBeGreaterThanOrEqual(enlarged - 1);
    await page.locator('[data-scenario="prefixed-identifier"]').click();
    await expect(editor).toHaveValue(original);
    await resizeBy(-300);
    await expect
      .poll(() => editor.evaluate((input) => input.clientHeight))
      .toBeLessThanOrEqual(before.height + 2);
    expect(
      await editor.evaluate((input) => {
        const style = getComputedStyle(input);
        const border =
          Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);
        return input.clientHeight + border >= Number.parseFloat(style.minHeight);
      }),
    ).toBe(true);
    expect(await editor.evaluate((input) => input.clientWidth)).toBe(before.width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  }
});

test("example resize heights follow their identities when adding and removing rows", async ({
  page,
}) => {
  const viewport = page.viewportSize();
  for (const width of [viewport.width, 320]) {
    await page.setViewportSize({ width, height: viewport.height });
    await page.goto("/");
    await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const fields = page.locator("#test-list textarea");
    const text = "ABC12\nABC12";
    const heights = [];
    for (const [index, delta] of [
      [1, 120],
      [2, 180],
    ]) {
      const field = fields.nth(index);
      await field.fill(text);
      const before = await field.evaluate((input) => input.clientHeight);
      await field.evaluate((input) =>
        window.scrollBy({
          top: input.getBoundingClientRect().top - 50,
          behavior: "instant",
        }),
      );
      const box = await field.boundingBox();
      const x = box.x + box.width - 8;
      const y = box.y + box.height - 8;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y + delta, { steps: 10 });
      await page.mouse.up();
      await expect
        .poll(() => field.evaluate((input) => input.clientHeight))
        .toBeGreaterThan(before + 90);
      heights.push(await field.evaluate((input) => input.style.height));
    }
    expect(heights[0]).not.toBe(heights[1]);
    await page.locator("#add-example").click();
    await expect(fields).toHaveCount(5);
    await expect(fields.last()).toBeFocused();
    for (const [index, height] of heights.entries()) {
      expect(await fields.nth(index + 1).evaluate((input) => input.style.height)).toBe(height);
      await expect(fields.nth(index + 1)).toHaveValue(text);
    }
    await page.locator("#test-list select").last().selectOption("false");
    await expect(page.locator("#test-summary")).toHaveText("5 of 5 examples behave as expected");
    await page.getByRole("button", { name: "Remove example 1", exact: true }).click();
    await expect(fields).toHaveCount(4);
    await expect(fields.first()).toBeFocused();
    for (const [index, height] of heights.entries()) {
      expect(await fields.nth(index).evaluate((input) => input.style.height)).toBe(height);
      await expect(fields.nth(index)).toHaveAccessibleName(`Example ${index + 1} string`);
      await expect(fields.nth(index)).toHaveValue(text);
    }
    await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
    await page.getByRole("button", { name: "Remove example 1", exact: true }).click();
    expect(await fields.first().evaluate((input) => input.style.height)).toBe(heights[1]);
    await page.locator("#add-example").click();
    await fields.last().fill(text);
    await page.locator("#test-list select").last().selectOption("false");
    expect(await fields.last().evaluate((input) => input.style.height)).toBe("");
    await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
    await page.locator('[data-scenario="time-shape"]').click();
    expect(
      await fields.evaluateAll((inputs) => inputs.every((input) => input.style.height === "")),
    ).toBe(true);
    await expect(page.locator("#test-summary")).toHaveText("13 of 13 examples behave as expected");
  }
});

test("skip link focuses the workshop without resetting edited rules", async ({ page }) => {
  await page.goto("/?example=line-rule");
  const editor = page.getByRole("textbox", { name: "Write your rules" });
  await editor.fill('start "XYZ"\nend');
  await page.getByRole("link", { name: "Skip to workshop" }).press("Enter");
  await expect(page).toHaveURL(/\/\?example=line-rule#main$/u);
  await expect(page.locator("#main")).toBeFocused();
  await expect(editor).toHaveValue('start "XYZ"\nend');
  await page.keyboard.press("Tab");
  await expect(editor).toBeFocused();
});

test("example controls have distinct numbered accessible names after delayed recipes", async ({
  page,
}) => {
  let release;
  await page.route("**/product-scenarios.json?*", async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect.poll(() => typeof release).toBe("function");
    await expect(page.locator("#test-list .test-row")).toHaveCount(0);
    release();
    await expect
      .poll(() =>
        page
          .locator("#test-list .test-row")
          .evaluateAll((rows) =>
            rows.map((row) => [
              row.querySelector("textarea").getAttribute("aria-label"),
              row.querySelector("select").getAttribute("aria-label"),
              row.querySelector("button").getAttribute("aria-label"),
            ]),
          ),
      )
      .toEqual(
        [1, 2, 3, 4].map((number) => [
          `Example ${number} string`,
          `Expected match result for example ${number}`,
          `Remove example ${number}`,
        ]),
      );
  } finally {
    release?.();
  }
});

test("example length limits are visible and described for loaded, added and renumbered fields", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  const limits =
    "Up to 100 examples; 2,048 UTF-16 code units per string. Longer input is kept but cannot be tested. Leave a field blank to test an empty string.";
  await expect(page.locator("#example-limits")).toBeVisible();
  await expect(page.locator("#example-limits")).toHaveText(limits);
  for (const count of [4, 5, 4]) {
    if (count === 5) await page.locator("#add-example").press("Enter");
    else if ((await page.locator("#test-list textarea").count()) === 5)
      await page.getByRole("button", { name: "Remove example 2", exact: true }).press("Enter");
    const fields = page.locator("#test-list textarea");
    await expect(fields).toHaveCount(count);
    await expect(page.locator('#test-list .test-row[data-result="pending"]')).toHaveCount(0);
    for (let index = 0; index < count; index += 1) {
      const feedback = await page.locator("#test-list .test-result").nth(index).textContent();
      await expect(fields.nth(index)).toHaveAccessibleDescription(`${limits} ${feedback}`);
      await expect(fields.nth(index)).toHaveJSProperty("maxLength", -1);
      await expect(fields.nth(index)).toHaveAttribute("aria-invalid", "false");
    }
  }
});

test("example descriptions follow matching results and rule repairs", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const limits = await page.locator("#example-limits").textContent();
  const field = page.locator("#test-list textarea").first();
  const expected = page.locator("#test-list select").first();
  await expect(field).toHaveAccessibleDescription(`${limits} ✓ Matched "ABC123" at 0`);
  await expect(expected).toHaveAccessibleDescription('✓ Matched "ABC123" at 0');
  await field.fill("ABC12");
  await expect(field).toHaveAccessibleDescription(`${limits} ! No match`);
  await expect(expected).toHaveAccessibleDescription("! No match");
  await expected.focus();
  await expected.selectOption("false");
  await expect(expected).toHaveValue("false");
  await expect(expected).toBeFocused();
  await expect(field).toHaveAccessibleDescription(`${limits} ✓ No match`);
  await expect(expected).toHaveAccessibleDescription("✓ No match");
  const editor = page.locator("#rules-input");
  await editor.fill('"ABC"');
  await expect(field).toHaveAccessibleDescription(`${limits} ✓ Found "ABC", not the entire string`);
  await expect(expected).toHaveAccessibleDescription('✓ Found "ABC", not the entire string');
  await page.locator("#match-mode").selectOption("search");
  await expect(field).toHaveAccessibleDescription(`${limits} ! Matched "ABC" at 0`);
  await expect(expected).toHaveAccessibleDescription('! Matched "ABC" at 0');
  await editor.fill("unsupported words");
  await expect(field).toHaveAccessibleDescription(`${limits} Fix the rules to run this example`);
  await expect(expected).toHaveAccessibleDescription("Fix the rules to run this example");
  await editor.fill("");
  await expect(field).toHaveAccessibleDescription(`${limits} Write rules to run this example`);
  await expect(expected).toHaveAccessibleDescription("Write rules to run this example");
  await page.locator('[data-scenario="excluded-characters"]').click();
  await expect(field).toHaveAccessibleDescription(`${limits} ✓ Matched "xyz" at 0`);
  await expect(expected).toHaveAccessibleDescription('✓ Matched "xyz" at 0');
  await page.getByRole("button", { name: "Remove example 1", exact: true }).click();
  await expect(field).toHaveAccessibleName("Example 1 string");
  await expect(field).toHaveAccessibleDescription(`${limits} ✓ Matched "" at 0`);
  await expect(expected).toHaveAccessibleName("Expected match result for example 1");
  await expect(expected).toHaveAccessibleDescription('✓ Matched "" at 0');
  await page.locator("#add-example").click();
  await expect(page.locator("#test-list textarea").last()).toHaveAccessibleDescription(
    `${limits} ✓ Matched "" at 0`,
  );
  await expect(page.locator("#test-list select").last()).toHaveAccessibleDescription(
    '✓ Matched "" at 0',
  );
});

test("removing examples keeps keyboard focus in the example controls", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#test-list .test-row")).toHaveCount(4);
  let remaining = 4;
  for (const number of [2, 3, 2, 1]) {
    const remove = page.getByRole("button", { name: `Remove example ${number}`, exact: true });
    await remove.focus();
    await remove.press("Enter");
    remaining -= 1;
    await expect(page.locator("#test-list .test-row")).toHaveCount(remaining);
    const next =
      remaining === 0
        ? page.locator("#add-example")
        : page.getByRole("textbox", {
            name: `Example ${Math.min(number, remaining)} string`,
            exact: true,
          });
    await expect(next).toBeFocused();
  }
  await page.locator("#add-example").press("Enter");
  await expect(page.getByRole("textbox", { name: "Example 1 string", exact: true })).toBeFocused();
});

test("syntax guide is readable without horizontal overflow or detectable WCAG A/AA issues", async ({
  page,
}) => {
  const failedResponses = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/web/language.html");
  await expect(page.getByRole("heading", { name: /Say only/ })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(2);
  await expect(page.locator(".guide-table").first()).toContainText(
    "Longest text up to the next rule. s includes line breaks.",
  );
  await expect(page.locator(".guide-table").first()).toContainText(
    "One ASCII hexadecimal digit, in either letter case",
  );
  await expect(page.locator(".guide-table").first()).toContainText(
    "One or more hexadecimal digits; no prefix or separators",
  );
  await expect(page.getByRole("link", { name: /Back to the workshop/ }).last()).toHaveAttribute(
    "href",
    "../",
  );
  const viewport = page.viewportSize();
  for (const width of [viewport.width, 320]) {
    await page.setViewportSize({ width, height: viewport.height });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(
      await page
        .locator(".guide-table-wrap")
        .evaluateAll((tables) =>
          tables.every((element) => element.scrollWidth <= element.clientWidth),
        ),
    ).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  }
  expect(failedResponses).toEqual([]);
});

test("the tested build version is visible in the workshop and guide", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".build-label")).toBeVisible();
  await expect(page.locator(".build-label")).toHaveText(versionLabel);
  await page.goto("/web/language.html");
  await expect(page.locator(".build-label")).toBeVisible();
  await expect(page.locator(".build-label")).toHaveText(versionLabel);
});
