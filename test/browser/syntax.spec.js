import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { translate } from "../../web/i18n.js";

const rules =
  '# source text <img src=x onerror=alert(1)> unfinished "\nstart\ncapture "channel" {\n  either {\n    "AA"\n    2 digits\n  }\n}\nfollowed by {\n  word boundary\n}\nend';

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
}

test("diagnosed count and capture ranges are highlighted and selected completely", async ({
  page,
}) => {
  await ready(page);
  const editor = page.locator("#rules-input");
  const source = '# ignored 😀 \"\nstart\n  same as capture "\\u006dissing"\nend';
  const token = '"\\u006dissing"';
  for (const locale of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(locale);
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      for (const [rules, fault] of [
        [source, token],
        ["# comment\n  start -12 digits\nend", "-12"],
        ["digit\n  between 25 and 12 digits", "12"],
        ['capture "😀" {\n}', '"😀"'],
        ["start 1.5 digits", "1.5"],
      ]) {
        await editor.fill(rules);
        await expect(editor).toHaveAttribute("aria-invalid", "true");
        await expect(page.locator("#rules-syntax .syntax-invalid")).toHaveText(fault);
        await page
          .getByRole("button", { name: translate(locale, "Go to error"), exact: true })
          .click();
        expect(await editor.evaluate((el) => [el.selectionStart, el.selectionEnd])).toEqual([
          rules.indexOf(fault),
          rules.indexOf(fault) + fault.length,
        ]);
        await expect(editor).toHaveValue(rules);
      }
    }
  }
  await editor.fill("start\n3 digits\nend");
  await expect(editor).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#rules-syntax .syntax-invalid")).toHaveCount(0);
});

test("quoted escapes retain exact highlighting and error selection in every interface language", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  const editor = page.locator("#rules-input");
  for (const locale of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(locale);
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      for (const [line, fault] of [
        [String.raw`  start 2 "😀\q"`, String.raw`\q`],
        [String.raw`unicode property "\u12x4"`, String.raw`\u12x4`],
        [String.raw`"\u000😀"`, String.raw`\u000😀`],
        [String.raw`"\u12`, String.raw`\u12`],
      ]) {
        const source = `# ignored 😀 \"\n${line}`;
        await editor.fill(source);
        await expect(editor).toHaveAttribute("aria-invalid", "true");
        await expect(page.locator("#rules-syntax .syntax-source")).toHaveText(source, {
          useInnerText: false,
        });
        await expect(page.locator("#rules-syntax .syntax-invalid")).toHaveText(fault);
        await page
          .getByRole("button", { name: translate(locale, "Go to error"), exact: true })
          .click();
        expect(await editor.evaluate((el) => [el.selectionStart, el.selectionEnd])).toEqual([
          source.indexOf(fault),
          source.indexOf(fault) + fault.length,
        ]);
        await expect(editor).toHaveValue(source);
      }
    }
  }
  await editor.fill("start\n2 digits\nend");
  await page.locator("#test-list textarea").first().fill("42");
  await expect(editor).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#rules-syntax .syntax-invalid")).toHaveCount(0);
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  expect(errors).toEqual([]);
});

test("structured tokens preserve native editing, reject markup and follow actual compiler diagnostics", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  const editor = page.locator("#rules-input");
  const mirror = page.locator("#rules-syntax .syntax-source");
  await editor.fill(rules);
  await page.locator("#test-list textarea").first().fill("AA");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  await expect(mirror).toHaveText(rules, { useInnerText: false });
  expect(await mirror.textContent()).toBe(rules);
  expect(await page.locator("#rules-syntax").getAttribute("aria-hidden")).toBe("true");
  expect(
    await page.locator("#rules-syntax").evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe("none");
  await expect(mirror.locator("img,script")).toHaveCount(0);
  await expect(page.locator("#rule-count")).toHaveText("11 rules");
  for (const kind of [
    "keyword",
    "string",
    "capture",
    "quantifier",
    "assertion",
    "alternation",
    "comment",
  ])
    expect(await mirror.locator(`.syntax-${kind}`).count()).toBeGreaterThan(0);
  for (const theme of ["light", "dark"]) {
    await page.locator("#interface-theme").selectOption(theme);
    const contrast = await mirror.evaluate((node) => {
      const rgb = (value) =>
        value
          .match(/[0-9.]+/g)
          .slice(0, 3)
          .map(Number);
      const luminance = (value) =>
        rgb(value)
          .map((c) => c / 255)
          .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
          .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
      const root = getComputedStyle(document.documentElement);
      const backgrounds = ["--input-paper", "--rule-mark"].map((name) => {
        const probe = document.createElement("span");
        probe.style.color = root.getPropertyValue(name);
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return luminance(color);
      });
      return [...node.querySelectorAll("span")].flatMap((span) =>
        backgrounds.map((bg) => {
          const foreground = luminance(getComputedStyle(span).color);
          return (Math.max(foreground, bg) + 0.05) / (Math.min(foreground, bg) + 0.05);
        }),
      );
    });
    expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5);
    await expect(editor).toHaveValue(rules);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const positions = await page.evaluate(async () => {
      const positions = [];
      for (let frame = 0; frame < 3; frame++) {
        await new Promise(requestAnimationFrame);
        positions.push(scrollY);
      }
      return positions;
    });
    expect(positions).toEqual([0, 0, 0]);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await page.screenshot({ path: testInfo.outputPath(`syntax-${theme}.png`), fullPage: true });
  }
  const generated = await page.locator("#regex-output").textContent();
  await editor.evaluate((el) => {
    el.setSelectionRange(3, 12);
    el.scrollTop = 40;
  });
  for (const locale of ["zh-CN", "es", "fr", "en"]) {
    await page.locator("#interface-language").selectOption(locale);
    await expect(editor).toHaveValue(rules);
    expect(await mirror.textContent()).toBe(rules);
    await expect(page.locator("#regex-output")).toHaveText(generated);
    expect(await editor.evaluate((el) => [el.selectionStart, el.selectionEnd])).toEqual([3, 12]);
  }
  await editor.fill(rules.replace("2 digits", "frobulate"));
  await expect(mirror.locator(".syntax-invalid")).toHaveText("frobulate");
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#diagnostic")).toContainText("Line 6, column 5");
  await page.getByRole("button", { name: "Go to error", exact: true }).click();
  expect(await editor.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
    "f",
  );
  expect(await editor.evaluate((el) => el.selectionStart)).toBe(
    rules.replace("2 digits", "frobulate").indexOf("frobulate"),
  );
  await editor.fill(rules);
  await expect(mirror.locator(".syntax-invalid")).toHaveCount(0);
  await expect(editor).toHaveAttribute("aria-invalid", "false");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(errors).toEqual([]);
});

for (const width of [1280, 320])
  test(`mirror wraps and scrolls with the native field at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    const editor = page.locator("#rules-input");
    const mirror = page.locator("#rules-syntax .syntax-source");
    const source =
      '# tabs and multilingual literal\nstart\n\t"' +
      "😀 العربية אבג ABC ".repeat(20) +
      '"\n' +
      '# padding with quote "\n'.repeat(65) +
      "end\n";
    await editor.fill(source);
    await expect(editor).toHaveAttribute("aria-invalid", "false");
    await editor.evaluate((el) => {
      el.style.height = "275px";
      el.style.flex = "none";
    });
    expect(await mirror.textContent()).toBe(source);
    await expect
      .poll(() =>
        editor.evaluate((el) => {
          const pre = document.querySelector("#rules-syntax .syntax-source");
          return Math.abs(Math.max(pre.scrollHeight, el.clientHeight) - el.scrollHeight);
        }),
      )
      .toBeLessThanOrEqual(1);
    await expect
      .poll(() =>
        editor.evaluate((el) => {
          const pre = document.querySelector("#rules-syntax .syntax-source");
          return Math.abs(pre.getBoundingClientRect().width - el.clientWidth);
        }),
      )
      .toBeLessThanOrEqual(1);
    await editor.evaluate((el) => {
      el.scrollTop = 480;
    });
    await expect
      .poll(() =>
        editor.evaluate((el) => {
          const pre = document.querySelector("#rules-syntax .syntax-source");
          return new DOMMatrix(getComputedStyle(pre).transform).m42 + el.scrollTop;
        }),
      )
      .toBe(0);
    await editor.evaluate((el) => {
      const start = el.value.indexOf("😀");
      el.setSelectionRange(start, start + 2);
    });
    expect(await editor.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
      "😀",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath(`syntax-${width}.png`),
      fullPage: true,
    });
    for (const nextWidth of [width === 320 ? 1280 : 320, width]) {
      await page.setViewportSize({ width: nextWidth, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect
        .poll(() =>
          editor.evaluate((el) => {
            const pre = document.querySelector("#rules-syntax .syntax-source");
            return Math.abs(pre.getBoundingClientRect().width - el.clientWidth);
          }),
        )
        .toBeLessThanOrEqual(1);
    }
    await editor.fill("x".repeat(16385));
    await expect(page.locator("#rules-syntax")).toBeHidden();
    expect(await editor.evaluate((el) => getComputedStyle(el).color)).not.toBe("rgba(0, 0, 0, 0)");
    await editor.fill(rules);
    await expect(page.locator("#rules-syntax")).toBeVisible();
    expect(await mirror.textContent()).toBe(rules);
  });

test("forced colors retain the native readable text", async ({ page }) => {
  await ready(page);
  await page.locator("#rules-input").fill(rules);
  await page.emulateMedia({ forcedColors: "active" });
  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
  await expect(page.locator("#rules-syntax")).toBeHidden();
  expect(await page.locator("#rules-input").evaluate((el) => getComputedStyle(el).color)).not.toBe(
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator("#rules-input")).toHaveValue(rules);
});
