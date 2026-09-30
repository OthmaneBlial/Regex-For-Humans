import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";

const scenarios = JSON.parse(
  readFileSync(new URL("../fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

async function openBeforeWorkshopAppLoads(page) {
  let release;
  await page.route("**/web/app.js*", async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await expect.poll(() => typeof release).toBe("function");
  return release;
}

test("example testing uses the newline-normalized text displayed by native fields", async ({
  page,
}) => {
  await page.route("**/product-scenarios.json*", async (route) => {
    const response = await route.fetch();
    const recipes = await response.json();
    recipes.find(({ id }) => id === "filename-shape").negative.push("a\r\nb.txt");
    await route.fulfill({ response, json: recipes });
  });
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      postMessage(payload) {
        window.lastExampleTexts = payload.cases.map(({ text }) => text);
        super.postMessage(payload);
      }
    };
  });
  await page.goto("/?example=filename-shape");
  await expect(page.locator("#test-summary")).toHaveText("21 of 21 examples behave as expected");
  const inputs = page.locator("#test-list textarea");
  await expect(inputs.last()).toHaveValue("a\nb.txt");
  expect(await page.evaluate(() => window.lastExampleTexts)).toEqual(
    await inputs.evaluateAll((fields) => fields.map((field) => field.value)),
  );
  const field = page.getByRole("textbox", { name: "Example 15 string", exact: true });
  await expect(field).toHaveValue("a\nb.txt");
  await page.locator("#rules-input").fill('start\n"a\\nb.txt"\nend');
  await expect(page.locator("#test-list .test-result").nth(14)).toHaveText(
    '! Matched "a\\nb.txt" at 0',
  );
  await page
    .getByRole("combobox", { name: "Expected match result for example 15", exact: true })
    .selectOption("true");
  await expect(page.locator("#test-list .test-result").nth(14)).toHaveText(
    '✓ Matched "a\\nb.txt" at 0',
  );
  await page.locator("#add-example").click();
  await expect(page.locator("#test-list .test-result").nth(14)).toHaveText(
    '✓ Matched "a\\nb.txt" at 0',
  );
  expect(await page.evaluate(() => window.lastExampleTexts)).toEqual(
    await inputs.evaluateAll((fields) => fields.map((field) => field.value)),
  );
  await page.getByRole("button", { name: "Remove example 1", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Example 14 string", exact: true })).toHaveValue(
    "a\nb.txt",
  );
  await expect(page.locator("#test-list .test-result").nth(13)).toHaveText(
    '✓ Matched "a\\nb.txt" at 0',
  );
  expect(await page.evaluate(() => window.lastExampleTexts)).toEqual(
    await inputs.evaluateAll((fields) => fields.map((field) => field.value)),
  );
  await page.locator('[data-scenario="filename-shape"]').click();
  await expect(page.locator("#test-summary")).toHaveText("21 of 21 examples behave as expected");
  expect(await page.evaluate(() => window.lastExampleTexts)).toEqual(
    await inputs.evaluateAll((fields) => fields.map((field) => field.value)),
  );
});

test("spaces explains whitespace, supports count overrides and recovers from unsupported syntax", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedPattern = text;
        },
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const editor = page.locator("#rules-input");
  const first = page.locator("#test-list textarea").first();
  const feedback = page.locator("#test-list .test-result").first();
  await editor.fill("start\nspaces\nend");
  await expect(page.locator("#regex-output")).toHaveText("/^\\s+$/u");
  await expect(page.locator("#trace-list")).toContainText(
    "One or more whitespace characters, including line breaks.",
  );
  await first.fill(" \t\n");
  await expect(feedback).toContainText("✓ Matched");
  await first.fill("");
  await expect(feedback).toHaveText("! No match");
  await editor.fill("start\nbetween 0 and 2 spaces\nend");
  await expect(page.locator("#regex-output")).toHaveText("/^\\s{0,2}$/u");
  await expect(feedback).toHaveText('✓ Matched "" at 0');
  await first.fill("\t\t\t");
  await expect(feedback).toHaveText("! No match");
  await editor.fill("spaces 3 times");
  await expect(page.locator("#diagnostic")).toContainText(
    "Use `space` for one whitespace character or `spaces` for one or more, including line breaks.",
  );
  await expect(page.locator("#copy-button")).toBeDisabled();
  await editor.fill("start\n3 spaces\nend");
  await expect(page.locator("#regex-output")).toHaveText("/^\\s{3}$/u");
  await expect(page.locator("#diagnostic")).toBeHidden();
  await expect(feedback).toContainText("✓ Matched");
  await page.locator("#copy-button").click();
  await expect(page.locator("#copy-button")).toContainText("Copied");
  expect(await page.evaluate(() => window.copiedPattern)).toBe("/^\\s{3}$/u");
  const opened = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Read the syntax ↗", exact: true }).click();
  const guide = await opened;
  await expect(guide.getByRole("row").filter({ hasText: /^spaces/u })).toContainText(
    "One or more JavaScript whitespace characters, including tabs and line breaks",
  );
});

test("filename shape teaches exclusions, Unicode bounds and editable extensions", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedPattern = text;
        },
      },
    });
  });
  await page.goto("/?example=filename-shape");
  const recipe = scenarios.find(({ id }) => id === "filename-shape");
  const editor = page.locator("#rules-input");
  await expect(editor).toHaveValue(recipe.rules);
  await expect(page.locator("#recipe-note")).toHaveText(recipe.note);
  await expect(page.locator("#trace-list")).toContainText("Between 1 and 64 times (inclusive).");
  await expect(page.locator("#test-summary")).toHaveText("20 of 20 examples behave as expected");
  const first = page.locator("#test-list textarea").first();
  await first.fill(`${"📄".repeat(64)}.txt`);
  await expect(page.locator("#test-list .test-result").first()).toContainText("✓ Matched");
  await first.fill(`${"📄".repeat(65)}.txt`);
  await expect(page.locator("#test-list .test-result").first()).toHaveText("! No match");
  await editor.fill(recipe.rules.replace('".txt"', '".md"'));
  await expect(page.locator("#recipe-note")).toBeHidden();
  await expect(page.locator("#regex-output")).toHaveText(
    `/${recipe.source.replace("txt$", "md$")}/u`,
  );
  await first.fill("report.md");
  await expect(page.locator("#test-list .test-result").first()).toHaveText(
    '✓ Matched "report.md" at 0',
  );
  await page.locator("#copy-button").click();
  await expect(page.locator("#copy-button")).toContainText("Copied");
  expect(await page.evaluate(() => window.copiedPattern)).toBe(
    `/${recipe.source.replace("txt$", "md$")}/u`,
  );
  await page.locator('[data-scenario="filename-shape"]').click();
  await expect(editor).toHaveValue(recipe.rules);
  await expect(page.locator("#recipe-note")).toBeVisible();
  await expect(page.locator("#test-summary")).toHaveText("20 of 20 examples behave as expected");
});

test("empty literals explain how to match empty input and recover", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const editor = page.locator("#rules-input");
  for (const rules of ['""', '\n  start 3 ""', 'between 0 and 1 ""']) {
    await editor.fill(rules);
    await expect(page.locator("#diagnostic")).toContainText("A literal cannot be empty.");
    await expect(page.locator("#diagnostic")).toContainText(
      "Use `start` and `end` on separate lines to match an empty string.",
    );
    await expect(editor).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#copy-button")).toBeDisabled();
    await page.getByRole("button", { name: "Go to error", exact: true }).click();
    const position = rules.indexOf('""');
    expect(await editor.evaluate((input) => [input.selectionStart, input.selectionEnd])).toEqual([
      position,
      position + 1,
    ]);
  }
  await editor.fill("start\nend");
  await expect(page.locator("#regex-output")).toHaveText("/^$/u");
  await expect(page.locator("#diagnostic")).toBeHidden();
  await expect(editor).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#copy-button")).toBeEnabled();
  await page.locator("#test-list textarea").first().fill("");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  await expect(page.locator("#test-list .test-result").first()).toHaveText('✓ Matched "" at 0');
  await page.locator("#test-list textarea").first().fill("\n");
  await expect(page.locator("#test-list .test-result").first()).toHaveText("! No match");
});

test("phone shape teaches an optional plus and supports requiring it", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedPattern = text;
        },
      },
    });
  });
  await page.goto("/?example=phone-shape");
  const editor = page.locator("#rules-input");
  const rules = 'start\nbetween 0 and 1 "+"\nbetween 7 and 15 digits\nend';
  await expect(editor).toHaveValue(rules);
  await expect(page.locator("#recipe-note")).toContainText(
    "check country rules and number validity separately",
  );
  await expect(page.locator("#trace-list")).toContainText(
    'Literal text "+". Between 0 and 1 times (inclusive).',
  );
  await expect(page.locator("#test-summary")).toHaveText("17 of 17 examples behave as expected");
  await editor.fill(rules.replace("between 0 and 1", "between 1 and 1"));
  await expect(page.locator("#recipe-note")).toBeHidden();
  await expect(page.locator("#regex-output")).toHaveText("/^\\+{1,1}\\d{7,15}$/u");
  await expect(page.locator("#test-summary")).toHaveText("15 of 17 examples behave as expected");
  for (const index of [1, 3]) {
    await page.locator("#test-list select").nth(index).selectOption("false");
  }
  await expect(page.locator("#test-summary")).toHaveText("17 of 17 examples behave as expected");
  await page.locator("#copy-button").click();
  await expect(page.locator("#copy-button")).toContainText("Copied");
  expect(await page.evaluate(() => window.copiedPattern)).toBe("/^\\+{1,1}\\d{7,15}$/u");
  await page.locator('[data-scenario="phone-shape"]').click();
  await expect(editor).toHaveValue(rules);
  await expect(page.locator("#recipe-note")).toBeVisible();
  await expect(page.locator("#regex-output")).toHaveText("/^\\+{0,1}\\d{7,15}$/u");
  await expect(page.locator("#test-summary")).toHaveText("17 of 17 examples behave as expected");
});

for (const scenario of scenarios) {
  test(`${scenario.id} loads the same pattern and preserves every sample`, async ({ page }) => {
    const browserErrors = [];
    const remoteRequests = [];
    const failedResponses = [];
    const unversionedAssets = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("request", (request) => {
      if (!request.url().startsWith("http://127.0.0.1:4175/")) remoteRequests.push(request.url());
      const url = new URL(request.url());
      if (/\.(?:css|html|js|json|svg)$/u.test(url.pathname) && !url.searchParams.has("v")) {
        unversionedAssets.push(url.pathname);
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await page.goto(`/?example=${scenario.id}`);
    await expect(page.locator(".local-indicator")).toHaveText("Rules stay local");
    await expect(page.locator("noscript")).toBeHidden();
    await expect(page.locator("#rules-input")).toHaveValue(scenario.rules);
    await expect(page.locator("#recipe-note")).toBeVisible();
    await expect(page.locator("#recipe-note")).toHaveText(scenario.note);
    await expect(page.locator("#rules-input")).toHaveAccessibleDescription(
      `A controlled language, not a free-form prompt. Read the syntax ↗ ${scenario.note}`,
    );
    await expect(page.locator("#recipe-count")).toHaveText(
      `01—${String(scenarios.length).padStart(2, "0")}`,
    );
    const segments = compile(scenario.rules).segments;
    const trace = page.locator("#trace-list button");
    await expect(trace).toHaveCount(segments.length);
    for (const [index, segment] of segments.entries()) {
      await expect(trace.nth(index)).toHaveAccessibleName(
        `Rule on line ${segment.line}: ${segment.explanation} Select source line.`,
      );
    }
    if (scenario.id === "excluded-characters") {
      await expect(page.locator("#trace-list")).toContainText(
        'Longest text without "a", "b", "c", "d".',
      );
    }
    if (scenario.id === "line-rule") {
      await expect(page.locator("#trace-list")).toContainText(
        "Longest text up to the next rule, excluding line breaks.",
      );
      await expect(page.locator("#trace-list")).toContainText("Exactly 3 digits (0–9).");
    }
    if (scenario.id === "hex-color") {
      await expect(page.locator("#trace-list")).toContainText(
        "Exactly 6 hexadecimal digits (0–9, A–F, a–f).",
      );
    }
    if (scenario.id === "invoice-number") {
      await expect(page.locator("#trace-list")).toContainText(
        "Between 2 and 6 digits (0–9), inclusive.",
      );
    }
    if (scenario.id === "username-shape") {
      await expect(page.locator("#trace-list")).toContainText("One ASCII letter (A–Z, a–z).");
      await expect(page.locator("#trace-list")).toContainText(
        "Between 2 and 15 times (inclusive).",
      );
    }
    await expect(page.locator("#regex-output")).toHaveText(`/${scenario.source}/${scenario.flags}`);
    await expect(page.locator("#test-summary")).toHaveText(
      `${scenario.positive.length + scenario.negative.length} of ${scenario.positive.length + scenario.negative.length} examples behave as expected`,
    );
    await expect(page.locator("#match-mode")).toHaveValue(scenario.matchMode);
    const visibleSamples = await page
      .locator("#test-list textarea")
      .evaluateAll((elements) => elements.map((element) => element.value));
    // Textareas normalize CR and CRLF to LF; matching still uses the complete value.
    expect(visibleSamples).toEqual(
      [...scenario.positive, ...scenario.negative].map((sample) => sample.replace(/\r\n?/gu, "\n")),
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.setViewportSize({ width: 320, height: page.viewportSize().height });
    await expect(page.locator("#recipe-note")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(browserErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
    expect(remoteRequests).toEqual([]);
    expect(unversionedAssets).toEqual([]);
  });
}

test("time shape explains its limits and supports editing, expectation changes and copying", async ({
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
  await page.goto("/?example=time-shape");
  const scenario = scenarios.find(({ id }) => id === "time-shape");
  const count = scenario.positive.length + scenario.negative.length;
  const editor = page.locator("#rules-input");
  await expect(editor).toHaveValue(scenario.rules);
  await expect(page.locator("#recipe-note")).toHaveText(scenario.note);
  await expect(page.locator("#trace-list")).toContainText("Exactly 2 digits (0–9).");
  await page.locator("#test-list textarea").first().fill("25:99");
  await expect(page.locator("#test-summary")).toHaveText(
    `${count} of ${count} examples behave as expected`,
  );
  await page.locator("#copy-button").click();
  await expect(page.locator("#copy-button")).toContainText("Copied");
  expect(await page.evaluate(() => window.copiedPattern)).toBe("/^\\d{2}:\\d{2}$/u");
  const edited = scenario.rules.replace("2 digits", "between 1 and 2 digits");
  await editor.fill(edited);
  await expect(page.locator("#recipe-note")).toBeHidden();
  await expect(page.locator("#regex-output")).toHaveText("/^\\d{1,2}:\\d{2}$/u");
  await expect(page.locator("#test-summary")).toHaveText(
    `${count - 1} of ${count} examples behave as expected`,
  );
  const firstNegative = scenario.positive.length;
  await expect(page.locator("#test-list textarea").nth(firstNegative)).toHaveValue("9:30");
  await page.locator("#test-list select").nth(firstNegative).selectOption("true");
  await expect(page.locator("#test-summary")).toHaveText(
    `${count} of ${count} examples behave as expected`,
  );
  await expect(editor).toHaveValue(edited);
  await page.locator("#copy-button").click();
  await expect(page.locator("#copy-button")).toContainText("Copied");
  expect(await page.evaluate(() => window.copiedPattern)).toBe("/^\\d{1,2}:\\d{2}$/u");
  await page.locator('[data-scenario="time-shape"]').click();
  await expect(editor).toHaveValue(scenario.rules);
  await expect(page.locator("#recipe-note")).toHaveText(scenario.note);
  await expect(page.locator("#test-list textarea").first()).toHaveValue("09:30");
  await expect(page.locator("#test-summary")).toHaveText(
    `${count} of ${count} examples behave as expected`,
  );
});

test("unsupported quote styles explain the required delimiters and recover after repair", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const editor = page.locator("#rules-input");
  for (const [opening, closing] of [
    ["'", "'"],
    ["`", "`"],
    ["“", "”"],
    ["‘", "’"],
  ]) {
    for (const [prefix, letter, source] of [
      ["start ", "A", "^ABC\\d{3}$"],
      ["start\none of: ", "A", "^[A]BC\\d{3}$"],
      ["start\nnone of: ", "B", "^[^B]BC\\d{3}$"],
      ["start\ntext without: ", "B", "^[^B]*BC\\d{3}$"],
    ]) {
      const value = opening + letter + closing;
      const rules = `${prefix}${value}\n"BC"\n3 digits\nend`;
      await editor.fill(rules);
      await expect(page.locator("#diagnostic")).toContainText(
        'Use JSON double quotes for quoted text, such as `"A"`.',
      );
      await expect(page.locator("#regex-output")).toHaveText("No pattern generated");
      await expect(page.locator("#copy-button")).toBeDisabled();
      await expect(editor).toHaveAttribute("aria-invalid", "true");
      await page.getByRole("button", { name: "Go to error", exact: true }).press("Enter");
      await expect(editor).toBeFocused();
      await expect(editor).toHaveValue(rules);
      expect(
        await editor.evaluate((element) => [element.selectionStart, element.selectionEnd]),
      ).toEqual([rules.indexOf(value), rules.indexOf(value) + 1]);
      await editor.fill(rules.replace(value, JSON.stringify(letter)));
      await expect(page.locator("#regex-output")).toHaveText(`/${source}/u`);
      await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
      await expect(page.locator("#diagnostic")).toBeHidden();
      await expect(editor).toHaveAttribute("aria-invalid", "false");
      await expect(page.locator("#copy-button")).toBeEnabled();
    }
  }
});

test("editing rules reports errors without stale output and recovers", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const editor = page.getByRole("textbox", { name: "Write your rules" });
  await editor.fill("alphanumeric character");
  await expect(page.locator("#diagnostic")).toContainText(
    'Unsupported rule: "alphanumeric character".',
  );
  await expect(page.locator("#diagnostic")).toContainText(
    "Try `line start`, `any text` or `3 digits`.",
  );
  await expect(page.locator("#regex-output")).toHaveText("No pattern generated");
  await editor.fill("a digit");
  await expect(page.locator("#diagnostic")).toContainText('Unsupported rule: "a digit".');
  await expect(page.locator("#regex-output")).toHaveText("No pattern generated");
  await editor.fill("digit\n  unsupported words");
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(editor).toHaveAttribute("aria-describedby", "rules-help recipe-note diagnostic");
  await expect(page.locator("#diagnostic")).toContainText("Line 2, column 3");
  await expect(page.locator("#regex-output")).toHaveText("No pattern generated");
  await expect(page.getByRole("button", { name: /Copy regex/ })).toBeDisabled();
  await editor.fill("start\nstart\n3 digits");
  await expect(page.locator("#diagnostic")).toContainText(
    "Line 2, column 1: Use only one start anchor.",
  );
  await editor.fill("3 start");
  await expect(page.locator("#diagnostic")).toContainText(
    "Line 1, column 3: Counts apply to items, not anchors.",
  );
  await expect(page.locator("#diagnostic")).toContainText(
    "Remove the count or apply it to an item, such as `3 digits`.",
  );
  await editor.fill('start "A" extra');
  await expect(page.locator("#diagnostic")).toContainText("Line 1, column 11");
  await editor.fill('3 "A"  extra');
  await expect(page.locator("#diagnostic")).toContainText("Line 1, column 8");
  await editor.fill("3 one of: a, bc");
  await expect(page.locator("#diagnostic")).toContainText("Line 1, column 14");
  await editor.fill("\n".repeat(201));
  await expect(page.locator("#diagnostic")).toContainText(
    "Line 201, column 1: Input cannot exceed 200 lines.",
  );
  await editor.fill(" ".repeat(16_385));
  await expect(page.locator("#diagnostic")).toContainText(
    "Line 1, column 16385: Rules cannot exceed 16384 UTF-16 code units.",
  );
  await editor.fill(String.raw`"bad\q"`);
  await expect(page.locator("#diagnostic")).toContainText("Line 1, column 5: Invalid JSON escape.");
  await editor.fill('start "ABC"\n3 digits\nend');
  await expect(editor).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  await expect(page.locator("#diagnostic")).toBeHidden();
  await page.locator("#ignore-case").check();
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/iu");
  await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
});

test("numeric count errors focus their token and recover after a valid edit", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const editor = page.locator("#rules-input");
  for (const token of ["-1", "1.5", "1e2", "٣"]) {
    await editor.fill(`start ${token} digits\nend`);
    await expect(page.locator("#diagnostic")).toContainText(
      "Line 1, column 7: Counts must be nonnegative integers.",
    );
    await expect(page.locator("#diagnostic")).toContainText("Write counts with digits 0–9 only");
    await expect(editor).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#copy-button")).toBeDisabled();
    await expect(page.locator("#regex-output")).toHaveText("No pattern generated");
  }
  await page.getByRole("button", { name: "Go to error" }).click();
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((element) => element.selectionStart)).toBe(6);
  expect(
    await editor.evaluate((element) =>
      element.value.slice(element.selectionStart, element.selectionEnd),
    ),
  ).toBe("٣");
  await editor.fill("start 3");
  await expect(page.locator("#diagnostic")).toContainText(
    "Line 1, column 7: A count needs an item.",
  );
  await expect(page.locator("#diagnostic")).toContainText(
    "Use `3 digits`, with the count before the item.",
  );
  await editor.fill("start 3 +2 digits\nend");
  await expect(page.locator("#diagnostic")).toContainText(
    "Line 1, column 9: Put one exact count before the instruction.",
  );
  await editor.fill('start "ABC"\n3 digits\nend');
  await expect(editor).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#diagnostic")).toBeHidden();
  await expect(page.locator("#copy-button")).toBeEnabled();
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
});

test("manual edits clear the recipe highlight and reselecting restores its short rules", async ({
  page,
}) => {
  await page.goto("/?example=line-rule");
  const editor = page.locator("#rules-input");
  const recipe = page.locator('[data-scenario="line-rule"]');
  await expect(recipe).toHaveAttribute("aria-current", "true");
  await editor.fill("at the beginning of a line, I am looking for any character");
  await expect(recipe).toHaveAttribute("aria-current", "false");
  await expect(page.locator("#recipe-note")).toBeHidden();
  await expect(page.locator("#recipe-note")).toBeEmpty();
  await recipe.click();
  await expect(recipe).toHaveAttribute("aria-current", "true");
  await expect(editor).toHaveValue("line start\nany text\n3 digits\nline end");
  await expect(page.locator("#recipe-note")).toBeVisible();
  await expect(page.locator("#recipe-note")).toContainText("Entire string mode");
});

test("switching a recipe starts one worker for its current pattern and examples", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.workerStarts = 0;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        window.workerStarts += 1;
      }
    };
  });
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const initialStarts = await page.evaluate(() => window.workerStarts);
  await page.locator('[data-scenario="excluded-characters"]').click();
  await expect(page.locator("#regex-output")).toHaveText("/^[^abcd]*$/u");
  await expect(page.locator("#test-summary")).toHaveText("3 of 3 examples behave as expected");
  expect(await page.evaluate(() => window.workerStarts)).toBe(initialStarts + 1);
});

test("rules and options entered before the workshop app loads stay intact", async ({ page }) => {
  const release = await openBeforeWorkshopAppLoads(page);
  try {
    await expect(page.locator("#add-example")).toBeDisabled();
    const editor = page.locator("#rules-input");
    const rules = 'start "CUSTOM"\nend';
    await editor.fill(rules);
    await page.locator("#ignore-case").check();
    await page.locator("#dot-all").check();
    await page.locator("#match-mode").selectOption("search");
    release();
    await expect(page.locator("#example-list button")).toHaveCount(scenarios.length);
    await expect(editor).toHaveValue(rules);
    await expect(page.locator("#regex-output")).toHaveText("/^CUSTOM$/isu");
    await expect(page.locator("#ignore-case")).toBeChecked();
    await expect(page.locator("#dot-all")).toBeChecked();
    await expect(page.locator("#match-mode")).toHaveValue("search");
    await expect(page.locator('#example-list button[aria-current="true"]')).toHaveCount(0);
    await expect(page.locator("#recipe-note")).toBeHidden();
    await expect(page.locator("#copy-button")).toBeEnabled();
    await expect(page.locator("#add-example")).toBeEnabled();
    await page.locator("#add-example").click();
    await page.getByRole("textbox", { name: "Example 1 string", exact: true }).fill("custom");
    await expect(page.locator("#test-summary")).toHaveText("1 of 1 examples behave as expected");
    await page.locator('[data-scenario="prefixed-identifier"]').click();
    await expect(editor).toHaveValue(scenarios[0].rules);
    await expect(page.locator("#ignore-case")).not.toBeChecked();
    await expect(page.locator("#dot-all")).not.toBeChecked();
    await expect(page.locator("#match-mode")).toHaveValue("full");
    await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  } finally {
    release();
  }
});

test("pre-app option changes preserve empty or whitespace-only rules", async ({ page }) => {
  for (const [rules, ignoreCase, dotAll, matchMode] of [
    ["", true, false, "full"],
    ["", false, true, "full"],
    ["", false, false, "search"],
    [" \n\t", false, false, "full"],
  ]) {
    const release = await openBeforeWorkshopAppLoads(page);
    try {
      const editor = page.locator("#rules-input");
      await editor.fill(rules);
      await page.locator("#ignore-case").setChecked(ignoreCase);
      await page.locator("#dot-all").setChecked(dotAll);
      await page.locator("#match-mode").selectOption(matchMode);
      release();
      await expect(page.locator("#example-list button")).toHaveCount(scenarios.length);
      await expect(editor).toHaveValue(rules);
      await expect(editor).toHaveAttribute("aria-invalid", "false");
      expect(await page.locator("#ignore-case").isChecked()).toBe(ignoreCase);
      expect(await page.locator("#dot-all").isChecked()).toBe(dotAll);
      await expect(page.locator("#match-mode")).toHaveValue(matchMode);
      await expect(page.locator("#compile-state")).toHaveText("Ready");
      await expect(page.locator("#regex-output")).toHaveText("Select a recipe or write a rule");
      await expect(page.locator("#copy-button")).toBeDisabled();
      await expect(page.locator("#test-summary")).toHaveText("Write rules to run the examples.");
    } finally {
      release();
    }
  }
});

test("pre-app invalid rules get diagnostics even when recipes fail", async ({ page }) => {
  await page.route("**/product-scenarios.json*", (route) =>
    route.fulfill({ status: 503, body: "Recipes unavailable" }),
  );
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const release = await openBeforeWorkshopAppLoads(page);
  try {
    const editor = page.locator("#rules-input");
    await editor.fill("invalid rule");
    release();
    await expect(page.locator("#example-list")).toContainText("HTTP 503");
    await expect(editor).toHaveValue("invalid rule");
    await expect(editor).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#compile-state")).toHaveText("Needs a fix");
    await expect(page.locator("#diagnostic")).toContainText('Unsupported rule: "invalid rule".');
    await expect(page.locator("#copy-button")).toBeDisabled();
    await editor.fill("start 3 digits\nend");
    await expect(page.locator("#regex-output")).toHaveText("/^\\d{3}$/u");
    await expect(page.locator("#copy-button")).toBeEnabled();
    expect(errors).toEqual([]);
  } finally {
    release();
  }
});

test("JavaScript-disabled workshop explains its controls and opens the static syntax guide", async ({
  browser,
  page,
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: page.viewportSize(),
    baseURL: testInfo.project.use.baseURL,
  });
  const staticPage = await context.newPage();
  const failedResponses = [];
  staticPage.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  try {
    for (const entry of [".", "./web/index.html"]) {
      await staticPage.goto(entry);
      await expect(staticPage.locator("noscript p")).toContainText("needs JavaScript");
      await expect(staticPage.locator("#copy-button")).toBeDisabled();
      await expect(staticPage.locator("#add-example")).toBeDisabled();
      await expect(staticPage.locator("#regex-output")).toHaveText(
        "Select a recipe or write a rule",
      );
      for (const width of [page.viewportSize().width, 320]) {
        await staticPage.setViewportSize({ width, height: page.viewportSize().height });
        expect(
          await staticPage.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      }
      const guide = staticPage.getByRole("link", { name: "Read the syntax guide", exact: true });
      await guide.focus();
      await guide.press("Enter");
      await expect(staticPage).toHaveURL(/\/web\/language\.html\?v=[\da-f]{12}$/u);
      await expect(staticPage.getByRole("heading", { name: /Say only/ })).toBeVisible();
    }
    expect(failedResponses).toEqual([]);
  } finally {
    await context.close();
  }
});

test("late recipes preserve edits made while loading", async ({ page }) => {
  let release;
  await page.route("**/product-scenarios.json?*", async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => typeof release).toBe("function");
  const editor = page.locator("#rules-input");
  const rules = 'start "CUSTOM"\nend';
  await editor.fill(rules);
  await page.locator("#ignore-case").check();
  await page.locator("#dot-all").check();
  await page.locator("#match-mode").selectOption("search");
  await page.locator("#add-example").click();
  await page.getByRole("textbox", { name: "Example 1 string", exact: true }).fill("custom");
  release();
  await expect(page.locator("#example-list button")).toHaveCount(scenarios.length);
  await expect(editor).toHaveValue(rules);
  await expect(page.locator("#regex-output")).toHaveText("/^CUSTOM$/isu");
  await expect(page.locator("#ignore-case")).toBeChecked();
  await expect(page.locator("#dot-all")).toBeChecked();
  await expect(page.locator("#match-mode")).toHaveValue("search");
  await expect(page.locator("#test-list textarea")).toHaveCount(1);
  await expect(page.locator("#test-list textarea")).toHaveValue("custom");
  await expect(page.locator("#test-summary")).toHaveText("1 of 1 examples behave as expected");
  await expect(page.locator('#example-list button[aria-current="true"]')).toHaveCount(0);
  await expect(page.locator("#recipe-note")).toBeHidden();
});

test("failed recipes leave compiler diagnostics and manual editing available", async ({ page }) => {
  let release;
  await page.route("**/product-scenarios.json?*", async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.fulfill({ status: 503, body: "Recipes unavailable" });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => typeof release).toBe("function");
  const editor = page.locator("#rules-input");
  await editor.fill("invalid rule");
  release();
  await expect(page.locator("#example-list")).toContainText("HTTP 503");
  await expect(page.locator("#diagnostic")).toContainText('Unsupported rule: "invalid rule".');
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#compile-state")).toHaveText("Needs a fix");
  await expect(page.locator("#copy-button")).toBeDisabled();
  await editor.fill("start 3 digits\nend");
  await expect(page.locator("#regex-output")).toHaveText("/^\\d{3}$/u");
  await expect(page.locator("#diagnostic")).toBeHidden();
  await expect(page.locator("#copy-button")).toBeEnabled();
  await page.locator("#add-example").click();
  await page.locator("#test-list textarea").fill("123");
  await expect(page.locator("#test-summary")).toHaveText("1 of 1 examples behave as expected");
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map((violation) => violation.id)).toEqual([]);
});

test("rule counter counts instructions and ignores blank lines", async ({ page }) => {
  await page.goto("/");
  const counter = page.locator("#rule-count");
  const editor = page.locator("#rules-input");
  await expect(counter).toHaveText("3 rules");
  await editor.fill("digit\n\nend");
  await expect(counter).toHaveText("2 rules");
  await editor.fill("digit");
  await expect(counter).toHaveText("1 rule");
});

test("trace selection and rule count use the compiler's line separators", async ({ page }) => {
  await page.goto("/");
  const editor = page.locator("#rules-input");
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    const rules = ["start", JSON.stringify("A\u2028B\u2029C"), "", "2 digits", "end"].join(
      separator,
    );
    await editor.fill(rules);
    await expect(page.locator("#regex-output")).toHaveText("/^A\\u{2028}B\\u{2029}C\\d{2}$/u");
    await page.getByRole("button", { name: /^Rule on line 4:/u }).click();
    await expect(editor).toBeFocused();
    expect(
      await editor.evaluate((input) => input.value.slice(input.selectionStart, input.selectionEnd)),
    ).toBe("2 digits");
    await expect(page.locator("#rule-count")).toHaveText("4 rules");
  }
});

test("rule and example inputs request literal text entry and preserve typed case and punctuation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  for (const add of [false, true]) {
    if (add) await page.locator("#add-example").click();
    for (const input of await page.locator("#rules-input, #test-list textarea").all()) {
      for (const [attribute, value] of [
        ["spellcheck", "false"],
        ["autocomplete", "off"],
        ["autocapitalize", "off"],
        ["autocorrect", "off"],
      ]) {
        await expect(input).toHaveAttribute(attribute, value);
      }
    }
  }
  const text = "teh.A_b/7";
  await page.locator("#rules-input").fill(`start ${JSON.stringify(text)}\nend`);
  const first = page.locator("#test-list textarea").first();
  await first.fill("");
  await first.pressSequentially(text);
  await expect(first).toHaveValue(text);
  const added = page.locator("#test-list textarea").last();
  await added.pressSequentially(text);
  await expect(added).toHaveValue(text);
  await expect(page.locator("#test-list .test-row .test-result").first()).toContainText(
    `Matched ${JSON.stringify(text)} at 0`,
  );
  await expect(page.locator("#test-summary")).toHaveText("5 of 5 examples behave as expected");
  await first.fill("Teh.A_b/7");
  await expect(page.locator("#test-summary")).toHaveText("4 of 5 examples behave as expected");
  await first.fill(text);
  await expect(page.locator("#test-summary")).toHaveText("5 of 5 examples behave as expected");
});

test("direction and C1 controls stay visible and surrogate boundaries follow Unicode matching", async ({
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
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  const points = [
    ...Array.from({ length: 32 }, (_, index) => index + 0x80),
    0x061c,
    0x200e,
    0x200f,
    0x202a,
    0x202b,
    0x202c,
    0x202d,
    0x202e,
    0x2066,
    0x2067,
    0x2068,
    0x2069,
  ];
  const text = `A${String.fromCodePoint(...points)}B`;
  const visible = `A${points.map((point) => `\\u${point.toString(16).padStart(4, "0")}`).join("")}B`;
  const rules = `start ${JSON.stringify(text)}\nend`;
  const editor = page.locator("#rules-input");
  await editor.fill(rules);
  expect(
    /[\p{Bidi_Control}\p{Control}]/u.test(await page.locator("#regex-output").textContent()),
  ).toBe(false);
  await expect(page.locator("#regex-output")).toHaveText(`/^${visible}$/u`);
  expect(
    /[\p{Bidi_Control}\p{Control}]/u.test(await page.locator("#trace-list").textContent()),
  ).toBe(false);
  await expect(page.locator("#trace-list")).toContainText(`Literal text "${visible}".`);
  const trace = page.getByRole("button", {
    name: `Rule on line 1: Literal text "${visible}". Select source line.`,
    exact: true,
  });
  await trace.press("Enter");
  await expect(editor).toBeFocused();
  expect(
    await editor.evaluate((input) => input.value.slice(input.selectionStart, input.selectionEnd)),
  ).toBe(rules.split("\n")[0]);
  await expect(editor).toHaveValue(rules);
  const example = page.getByRole("textbox", { name: "Example 1 string", exact: true });
  await example.fill(text);
  await expect(example).toHaveValue(text);
  const feedback = page.locator("#test-list .test-result").first();
  await expect(feedback).toHaveText(`✓ Matched "${visible}" at 0`);
  await page.locator("#copy-button").press("Enter");
  await expect(page.locator("#copy-button")).toContainText("Copied");
  expect(await page.evaluate(() => window.copiedPattern)).toBe(`/^${visible}$/u`);
  await editor.fill(JSON.stringify(text));
  await example.fill(`${text}tail`);
  await expect(feedback).toHaveText(`! Found "${visible}", not the entire string`);
  await page.locator("#match-mode").selectOption("search");
  await expect(feedback).toHaveText(`✓ Matched "${visible}" at 0`);
  await editor.fill(`unsupported${text}`);
  await expect(page.locator("#compile-state")).toHaveText("Needs a fix");
  expect(
    /[\p{Bidi_Control}\p{Control}]/u.test(
      (await page.locator("#diagnostic").textContent()).replaceAll("\n", ""),
    ),
  ).toBe(false);
  await expect(page.locator("#diagnostic")).toContainText(
    `Unsupported rule: "unsupported${visible}".`,
  );
  await page.getByRole("button", { name: "Go to error", exact: true }).press("Enter");
  expect(await editor.evaluate((input) => [input.selectionStart, input.selectionEnd])).toEqual([
    0, 1,
  ]);
  for (const point of [0x2028, 0x2029]) {
    const sample = `A${String.fromCodePoint(point)}B`;
    await editor.fill(JSON.stringify(sample));
    await expect(page.locator("#regex-output")).toHaveText(`/A\\u{${point.toString(16)}}B/u`);
    await example.fill(sample);
    await expect(example).toHaveValue(sample);
    await expect(feedback).toHaveText(`✓ Matched "A\\u${point.toString(16)}B" at 0`);
  }
  const boundary = "\udc00A\ud800";
  for (const count of [2, 1]) {
    await editor.fill(`start\n${count} ${JSON.stringify(boundary)}\nend`);
    await expect(page.locator("#regex-output")).toHaveText(
      `/^(?:\\u{dc00}A\\u{d800}){${count}}$/u`,
    );
    // Native text insertion replaces lone surrogates; use the original JavaScript value.
    await example.evaluate((input, copies) => {
      input.value = String.fromCharCode(0xdc00, 65, 0xd800).repeat(copies);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, count);
    await expect(example).toHaveValue(boundary.repeat(count));
    await expect(feedback).toHaveText(
      count === 2 ? "! No match" : '✓ Matched "\\udc00A\\ud800" at 0',
    );
  }
});

test("oversized examples stay intact and stop testing until repaired or removed", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.testRequests = 0;
    window.Worker = class extends NativeWorker {
      postMessage(message) {
        window.testRequests += 1;
        if (!window.pauseMatches) super.postMessage(message);
      }
    };
  });
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  await page.locator("#rules-input").fill('start 1000 "aa"\n48 "a"\nend');
  const valid = "a".repeat(2048);
  for (const [index, field] of (await page.locator("#test-list textarea").all()).entries()) {
    await field.fill(index < 2 ? valid : "no");
    await page
      .locator("#test-list select")
      .nth(index)
      .selectOption(index < 2 ? "true" : "false");
  }
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const first = page.getByRole("textbox", { name: "Example 1 string", exact: true });
  await page.clock.install();
  // Hold a valid request so oversized input must cancel its pending timeout.
  await page.evaluate(() => {
    window.pauseMatches = true;
  });
  await first.fill("");
  await expect(page.locator("#test-summary")).toHaveText("Checking examples…");
  const requests = await page.evaluate(() => window.testRequests);
  const oversized = `${valid}BBB`;
  await first.focus();
  await page.keyboard.insertText(oversized);
  await expect(first).toHaveValue(oversized);
  await expect(first).toHaveAttribute("aria-invalid", "true");
  const limits =
    "Up to 100 examples; 2,048 UTF-16 code units per string. Longer input is kept but cannot be tested.";
  const error = "Example too long. Limit: 2,048 UTF-16 code units.";
  await expect(first).toHaveAccessibleDescription(`${limits} ${error}`);
  await expect(page.locator("#test-list select").first()).toHaveAccessibleDescription(error);
  await expect(page.locator("#test-list .test-result").first()).toHaveText(error);
  await expect(page.locator("#test-list .test-row").first()).toHaveAttribute(
    "data-result",
    "invalid",
  );
  await expect(page.locator("#test-summary")).toHaveText(
    "Shorten examples to 2,048 UTF-16 code units or fewer.",
  );
  await page.clock.fastForward(1500);
  await expect(page.locator("#test-summary")).toHaveText(
    "Shorten examples to 2,048 UTF-16 code units or fewer.",
  );
  expect(await page.evaluate(() => window.testRequests)).toBe(requests);
  await page.evaluate(() => {
    window.pauseMatches = false;
  });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.map(({ id }) => id)).toEqual([]);
  await page.locator("#add-example").press("Enter");
  await expect(first).toHaveValue(oversized);
  await expect(first).toHaveAccessibleDescription(`${limits} ${error}`);
  await page.getByRole("button", { name: "Remove example 1", exact: true }).press("Enter");
  await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
  const last = page.getByRole("textbox", { name: "Example 4 string", exact: true });
  const beforeEmoji = await page.evaluate(() => window.testRequests);
  await last.focus();
  await page.keyboard.insertText("🧠".repeat(1025));
  await expect(last).toHaveValue("🧠".repeat(1025));
  await expect(last).toHaveAccessibleDescription(`${limits} ${error}`);
  await expect(page.locator("#test-list select").last()).toHaveAccessibleDescription(error);
  await expect(last).toHaveAttribute("aria-invalid", "true");
  expect(await page.evaluate(() => window.testRequests)).toBe(beforeEmoji);
  await last.fill("🧠".repeat(1024));
  await expect(last).toHaveValue("🧠".repeat(1024));
  await expect(last).toHaveAttribute("aria-invalid", "false");
  await expect(last).toHaveAccessibleDescription(`${limits} ! No match`);
  await expect(page.locator("#test-list select").last()).toHaveAccessibleDescription("! No match");
  await expect(page.locator("#test-list .test-result").last()).toHaveText("! No match");
  expect(await page.evaluate(() => window.testRequests)).toBeGreaterThan(beforeEmoji);
  await last.fill(valid);
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
});

test("positive and negative examples expose a changed outcome", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  await page
    .getByRole("textbox", { name: /^Example \d+ string$/u })
    .first()
    .fill("ABC12");
  await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
  await page.getByRole("button", { name: "+ Add example" }).click();
  await page
    .getByRole("textbox", { name: /^Example \d+ string$/u })
    .last()
    .fill("ABC999");
  await expect(page.locator("#test-summary")).toHaveText("4 of 5 examples behave as expected");
  await page
    .getByRole("button", { name: /^Remove example \d+$/u })
    .last()
    .click();
  await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
});

test("line-mode sample keeps its newline and changes under full-match mode", async ({ page }) => {
  await page.goto("/?example=line-rule");
  await expect(page.locator("#test-list textarea").nth(1)).toHaveValue("note\nitem 123");
  await page.locator("#match-mode").selectOption("full");
  await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
  await page.locator("#match-mode").selectOption("search");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
});

test("entire string mode backtracks past a partial greedy match and preserves search results", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const editor = page.locator("#rules-input");
  const sample = page.locator("#test-list textarea").first();
  const row = page.locator(".test-row").first();
  const result = page.locator(".test-result").first();
  for (const prefix of ["", "line start\n"]) {
    await editor.fill(`${prefix}between 0 and 2 "ab"\nbetween 0 and 2 "abc"`);
    await page.locator("#match-mode").selectOption("full");
    for (const text of ["ababc", "ababcabc", "abababcabc", ""]) {
      await sample.fill(text);
      await expect(row).toHaveAttribute("data-result", "pass");
      await expect(result).toHaveText(`✓ Matched ${JSON.stringify(text)} at 0`);
    }
    for (const text of ["ababx", "ababcabcabc", "ababc\n", "ababc\nabc"]) {
      await sample.fill(text);
      await expect(row).toHaveAttribute("data-result", "fail");
      await expect(result).toContainText("not the entire string");
    }
    await sample.fill("ababc");
    await page.locator("#match-mode").selectOption("search");
    await expect(row).toHaveAttribute("data-result", "pass");
    await expect(result).toHaveText('✓ Matched "abab" at 0');
  }
});

test("Unicode literals and dot-all behavior are visible in example results", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Write your rules" });
  const firstSample = page.getByRole("textbox", { name: /^Example \d+ string$/u }).first();
  await editor.fill("any character");
  await page.locator("#match-mode").selectOption("search");
  await firstSample.fill("\n");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "fail");
  await page.locator("#dot-all").check();
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  await editor.fill('"😀"');
  await firstSample.fill("😀");
  await expect(page.locator("#regex-output")).toHaveText("/😀/su");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
});

test("ignore-case option explains case-insensitive character sets", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Write your rules" }).fill("one of: K");
  await page.locator("#ignore-case").check();
  await expect(page.locator("#trace-list")).toContainText('One of "K", ignoring case (i).');
});

test("hex rules explain single digits, sequences and exact counts in the workshop", async ({
  page,
}) => {
  await page.goto("/?example=hex-color");
  const editor = page.locator("#rules-input");
  const sample = page.locator("#test-list textarea").first();
  for (const [rule, source, text, explanation] of [
    ["hex digit", "[0-9A-Fa-f]", "F", "One hexadecimal digit"],
    ["hex digits", "[0-9A-Fa-f]+", "09aF", "One or more hexadecimal digits"],
    ["2 hex digits", "[0-9A-Fa-f]{2}", "0F", "Exactly 2 hexadecimal digits"],
  ]) {
    await editor.fill(`start\n${rule}\nend`);
    await expect(page.locator("#regex-output")).toHaveText(`/^${source}$/u`);
    await expect(page.locator("#trace-list")).toContainText(explanation);
    await sample.fill(text);
    await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
    await expect(page.locator(".test-result").first()).toHaveText(`✓ Matched "${text}" at 0`);
  }
  await editor.fill("6 hex characters");
  await expect(page.locator("#diagnostic")).toContainText("Line 1, column 3: Unsupported rule");
  await expect(page.locator("#diagnostic")).toContainText(
    "Use `hex digit` for one character or `hex digits` for one or more.",
  );
  await expect(page.locator("#regex-output")).toHaveText("No pattern generated");
});

test("letter rules show counts, alphabetic matching and Unicode case-folding behavior", async ({
  page,
}) => {
  await page.goto("/");
  const editor = page.locator("#rules-input");
  const sample = page.locator("#test-list textarea").first();
  for (const [rule, source, text, explanation] of [
    ["letter", "[A-Za-z]", "A", "One ASCII letter"],
    ["letters", "[A-Za-z]+", "aBc", "One or more ASCII letters"],
    ["3 letters", "[A-Za-z]{3}", "ABC", "Exactly 3 ASCII letters"],
    ["between 2 and 4 letters", "[A-Za-z]{2,4}", "AbCd", "Between 2 and 4 ASCII letters"],
  ]) {
    await editor.fill(`start\n${rule}\nend`);
    await expect(page.locator("#regex-output")).toHaveText(`/^${source}$/u`);
    await expect(page.locator("#trace-list")).toContainText(explanation);
    await sample.fill(text);
    await expect(page.locator(".test-result").first()).toHaveText(`✓ Matched "${text}" at 0`);
    await sample.fill("A3_");
    await expect(page.locator(".test-result").first()).toHaveText("! No match");
  }
  await editor.fill("start letters\nend");
  for (const value of ["é", "K", "ſ"]) {
    await sample.fill(value);
    await expect(page.locator(".test-result").first()).toHaveText("! No match");
  }
  await page.locator("#ignore-case").check();
  await expect(page.locator("#trace-list")).toContainText(
    "With i, a few Unicode equivalents also match.",
  );
  for (const value of ["K", "ſ"]) {
    await sample.fill(value);
    await expect(page.locator(".test-result").first()).toHaveText(`✓ Matched "${value}" at 0`);
  }
  await editor.fill("2 letter characters");
  await expect(page.locator("#diagnostic")).toContainText("Line 1, column 3: Unsupported rule");
  await expect(page.locator("#diagnostic")).toContainText(
    "Use `letter` for one ASCII letter or `letters` for one or more.",
  );
  await expect(page.locator("#copy-button")).toBeDisabled();
  await editor.fill("letters");
  await expect(page.locator("#copy-button")).toBeEnabled();
});

test("bounded counts show inclusive matches, literal grouping and positioned errors", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const editor = page.locator("#rules-input");
  const sample = page.locator("#test-list textarea").first();
  for (const [rule, source, positive, negative] of [
    ["between 2 and 4 digits", "\\d{2,4}", "1234", "12345"],
    ["between 2 and 4 hex digits", "[0-9A-Fa-f]{2,4}", "09aF", "ag"],
    ['between 0 and 1 "AB"', "(?:AB){0,1}", "", "ABAB"],
    ["between 2 and 3 one of: a, b", "[ab]{2,3}", "aba", "a"],
  ]) {
    await editor.fill(`start\n${rule}\nend`);
    await expect(page.locator("#regex-output")).toHaveText(`/^${source}$/u`);
    await expect(page.locator("#trace-list")).toContainText("inclusive");
    await sample.fill(positive);
    await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
    await sample.fill(negative);
    await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
  }
  await editor.fill("start between 4 and 2 digits\nend");
  await expect(page.locator("#diagnostic")).toContainText(
    "Line 1, column 21: The upper count cannot be smaller than the lower count.",
  );
  await expect(page.locator("#copy-button")).toBeDisabled();
  await page.getByRole("button", { name: "Go to error", exact: true }).click();
  expect(
    await editor.evaluate((input) => input.value.slice(input.selectionStart, input.selectionEnd)),
  ).toBe("2");
  await editor.fill("start between 2 and 4 digits\nend");
  await sample.fill("12");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
});

test("copy button places the real generated regex on the clipboard", async ({ page, context }) => {
  await page.goto("/");
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  });
  await page.getByRole("button", { name: /Copy regex/ }).click();
  await expect(page.locator("#copy-button")).toContainText("Copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe("/^ABC\\d{3}$/u");
  await page.locator("#rules-input").fill(`start\n${JSON.stringify("\ud800")}\nend`);
  await expect(page.locator("#regex-output")).toHaveText("/^\\u{d800}$/u");
  expect(await page.locator("#copy-button").textContent()).toBe("Copy regex ↗");
  await page.locator("#copy-button").click();
  await expect(page.locator("#copy-button")).toContainText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("/^\\u{d800}$/u");
  await page.locator("#ignore-case").check();
  expect(await page.locator("#copy-button").textContent()).toBe("Copy regex ↗");
  await page.locator("#copy-button").click();
  await expect(page.locator("#copy-button")).toContainText("Copied");
  await page.locator('[data-scenario="excluded-characters"]').click();
  expect(await page.locator("#copy-button").textContent()).toBe("Copy regex ↗");
});

test("repeated copies keep feedback until the latest copy expires", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => {} } });
  });
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const button = page.locator("#copy-button");
  await button.click();
  await expect(button).toContainText("Copied");
  await page.clock.fastForward(1000);
  await button.click();
  await expect(button).toContainText("Copied");
  await page.clock.fastForward(900);
  expect(await button.textContent()).toBe("Copied ✓");
  await page.clock.fastForward(1000);
  await expect(button).toHaveText("Copy regex ↗");
});

for (const latestSucceeded of [true, false]) {
  test(`latest clipboard ${latestSucceeded ? "success" : "failure"} survives an older reply for unchanged rules`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
    await page.addInitScript(() => {
      window.copyRequests = [];
      window.legacyAttempts = 0;
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            new Promise((resolve, reject) => window.copyRequests.push({ resolve, reject })),
        },
      });
      document.execCommand = () => {
        window.legacyAttempts += 1;
        return false;
      };
    });
    await page.goto("/");
    await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
    const button = page.locator("#copy-button");
    await button.click();
    await button.click();
    await page.evaluate((success) => {
      const request = window.copyRequests[1];
      if (success) request.resolve();
      else request.reject(new Error("Clipboard access blocked"));
    }, latestSucceeded);
    if (latestSucceeded) await expect(button).toHaveText("Copied ✓");
    else await expect(page.locator("#diagnostic")).toContainText("The pattern is selected");
    await page.clock.fastForward(500);
    await page.evaluate(async (success) => {
      const request = window.copyRequests[0];
      if (success) request.reject(new Error("Older clipboard access blocked"));
      else request.resolve();
      await Promise.resolve();
      await Promise.resolve();
    }, latestSucceeded);
    expect(await page.evaluate(() => window.legacyAttempts)).toBe(latestSucceeded ? 0 : 1);
    if (latestSucceeded) {
      await expect(page.locator("#diagnostic")).toBeHidden();
      await page.clock.fastForward(1200);
      await expect(button).toHaveText("Copied ✓");
      await page.clock.fastForward(101);
      await expect(button).toHaveText("Copy regex ↗");
    } else {
      await expect(page.locator("#diagnostic")).toContainText("The pattern is selected");
      await expect(button).toHaveText("Copy regex ↗");
      expect(await page.evaluate(() => window.getSelection().toString())).toBe("/^ABC\\d{3}$/u");
    }
  });
}

for (const timeout of [false, true]) {
  test(`a workshop copy ${timeout ? "timeout" : "rejection"} preserves a newly focused input and selection`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
    await page.addInitScript(() => {
      window.copyRequests = [];
      window.legacyCopyCalls = 0;
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            new Promise((resolve, reject) => window.copyRequests.push({ resolve, reject })),
        },
      });
      document.execCommand = () => {
        window.legacyCopyCalls += 1;
        return false;
      };
    });
    await page.goto("/");
    await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
    const button = page.locator("#copy-button");
    const input = page.locator("#test-list textarea").first();
    await button.focus();
    await button.press("Enter");
    await input.focus();
    await input.evaluate((element) => element.setSelectionRange(1, 3));
    if (timeout) await page.clock.fastForward(1001);
    else await page.evaluate(() => window.copyRequests[0].reject(new Error("Clipboard denied")));
    await expect(page.locator("#diagnostic")).toHaveText(
      "Clipboard access was blocked. Select the pattern and press your copy shortcut.",
    );
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("ABC123");
    expect(
      await input.evaluate((element) => [element.selectionStart, element.selectionEnd]),
    ).toEqual([1, 3]);
    expect(await page.evaluate(() => window.legacyCopyCalls)).toBe(0);
    await button.focus();
    await button.press("Enter");
    await page.evaluate(() => window.copyRequests[1].resolve());
    await expect(button).toHaveText("Copied ✓");
    await expect(button).toBeFocused();
    await expect(page.locator("#diagnostic")).toBeHidden();
  });
}

test("a stalled workshop copy clears old confirmation, keeps fallback focus and recovers", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.addInitScript(() => {
    window.copyRequests = [];
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          new Promise((resolve, reject) => window.copyRequests.push({ resolve, reject })),
      },
    });
    document.execCommand = () => false;
  });
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const button = page.locator("#copy-button");
  await button.click();
  await page.evaluate(() => window.copyRequests[0].resolve());
  await expect(button).toHaveText("Copied ✓");
  await page.clock.fastForward(200);
  await button.press("Enter");
  await expect(button).toHaveText("Copy regex ↗");
  await page.clock.fastForward(1001);
  await expect(page.locator("#diagnostic")).toContainText("The pattern is selected");
  await expect(button).toBeFocused();
  expect(await page.evaluate(() => window.getSelection().toString())).toBe("/^ABC\\d{3}$/u");
  await page.evaluate(() => window.copyRequests[1].resolve());
  await expect(button).toHaveText("Copy regex ↗");
  await expect(page.locator("#diagnostic")).toBeVisible();
  await button.press("Enter");
  await page.evaluate(() => window.copyRequests[2].resolve());
  await expect(button).toHaveText("Copied ✓");
  await expect(page.locator("#diagnostic")).toBeHidden();
  await expect(button).toBeFocused();
});

for (const copied of [true, false]) {
  test(`clipboard fallback keeps keyboard focus when copy ${copied ? "succeeds" : "fails"}`, async ({
    page,
  }) => {
    await page.addInitScript((copied) => {
      Object.defineProperty(navigator, "clipboard", { value: undefined });
      document.execCommand = () => {
        window.legacyCopyText = document.activeElement.value;
        return copied;
      };
    }, copied);
    await page.goto("/");
    await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
    const button = page.locator("#copy-button");
    await button.focus();
    await button.press("Enter");
    expect(await page.evaluate(() => window.legacyCopyText)).toBe("/^ABC\\d{3}$/u");
    await expect(button).toBeFocused();
    if (copied) await expect(button).toContainText("Copied");
    else {
      await expect(page.locator("#diagnostic")).toContainText("The pattern is selected");
      expect(await page.evaluate(() => window.getSelection().toString())).toBe("/^ABC\\d{3}$/u");
    }
  });
}

for (const success of [true, false]) {
  test(`${success ? "resolved" : "rejected"} clipboard request preserves newer rule errors`, async ({
    page,
  }) => {
    await page.addInitScript((success) => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            new Promise((resolve, reject) => {
              window.finishCopy = () =>
                success ? resolve() : reject(new Error("Clipboard access blocked"));
            }),
        },
      });
      document.execCommand = () => false;
    }, success);
    await page.goto("/");
    await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
    await page.locator("#copy-button").click();
    const editor = page.locator("#rules-input");
    await editor.fill("invalid rule");
    await expect(editor).toHaveAttribute("aria-invalid", "true");
    await page.evaluate(async () => {
      window.finishCopy();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await expect(page.locator("#diagnostic")).toBeVisible();
    await expect(page.locator("#diagnostic")).toContainText('Unsupported rule: "invalid rule".');
    await expect(editor).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#copy-button")).toBeDisabled();

    await editor.fill("start 2 digits\nend");
    await page.locator("#copy-button").click();
    await editor.fill("start 4 digits\nend");
    await page.evaluate(async () => {
      window.finishCopy();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await expect(page.locator("#regex-output")).toHaveText("/^\\d{4}$/u");
    await expect(page.locator("#diagnostic")).toBeHidden();
    await expect(page.locator("#copy-button")).toContainText("Copy regex");
  });
}

test("syntax link opens the local rendered guide", async ({ page, context }) => {
  await page.goto("/");
  const [guide] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: /Read the syntax/ }).click(),
  ]);
  await guide.waitForLoadState();
  await expect(guide).toHaveURL(/\/web\/language\.html\?v=[\da-f]{12}$/u);
  await expect(guide.getByRole("heading", { name: "Match one thing" })).toBeVisible();
  await expect(guide.locator("#atoms")).toContainText("[A-Za-z]");
  await expect(guide.locator("#atoms")).toContainText("K");
  await expect(guide.locator(".guide-hero .hero-copy")).toContainText("Use short rules.");
  await expect(guide.getByText(/They reject a final line break/u)).toBeVisible();
  await expect(guide.locator("#repetition tbody tr").first()).toContainText("3 <item>");
  await expect(guide.locator("#repetition tbody tr").nth(1)).toContainText(
    "between 2 and 4 <item>",
  );
  await guide.close();
});

test("empty rules prompt for input without marking the examples as errors", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const editor = page.locator("#rules-input");
  for (const rules of ["", "\n \t\r\n\u2028 "]) {
    await editor.fill(rules);
    await expect(page.locator("#compile-state")).toHaveText("Ready");
    await expect(editor).toHaveAttribute("aria-invalid", "false");
    await expect(page.locator("#diagnostic")).toBeHidden();
    await expect(page.locator("#test-summary")).toHaveText("Write rules to run the examples.");
    await expect(page.locator("#test-summary")).toHaveAttribute("data-state", "neutral");
    await expect(page.locator(".test-result").first()).toHaveText(
      "Write rules to run this example",
    );
    await expect(page.locator("#copy-button")).toBeDisabled();
  }
  for (const rules of ["unsupported words", " ".repeat(16_385)]) {
    await editor.fill(rules);
    await expect(editor).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#test-summary")).toHaveText("Fix the rules to run the examples.");
    await expect(page.locator("#test-summary")).toHaveAttribute("data-state", "error");
  }
  await editor.fill('start "ABC"\n3 digits\nend');
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  await expect(page.locator("#test-summary")).toHaveAttribute("data-state", "success");
});
