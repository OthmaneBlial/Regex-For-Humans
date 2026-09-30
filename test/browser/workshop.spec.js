import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const scenarios = JSON.parse(
  readFileSync(new URL("../fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

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
    await expect(page.locator("#rules-input")).toHaveValue(scenario.rules);
    await expect(page.locator("#recipe-note")).toBeVisible();
    await expect(page.locator("#recipe-note")).toHaveText(scenario.note);
    await expect(page.locator("#rules-input")).toHaveAccessibleDescription(
      `A controlled language, not a free-form prompt. Read the syntax ↗ ${scenario.note}`,
    );
    await expect(page.locator("#recipe-count")).toHaveText(
      `01—${String(scenarios.length).padStart(2, "0")}`,
    );
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
    await expect(page.locator("#regex-output")).toHaveText(`/${scenario.source}/${scenario.flags}`);
    await expect(page.locator("#test-summary")).toHaveText(
      `${scenario.positive.length + scenario.negative.length} of ${scenario.positive.length + scenario.negative.length} examples behave as expected`,
    );
    await expect(page.locator("#match-mode")).toHaveValue(scenario.matchMode);
    const visibleSamples = await page
      .locator("#test-list textarea")
      .evaluateAll((elements) => elements.map((element) => element.value));
    expect(visibleSamples).toEqual([...scenario.positive, ...scenario.negative]);
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

test("editing rules reports errors without stale output and recovers", async ({ page }) => {
  await page.goto("/");
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
