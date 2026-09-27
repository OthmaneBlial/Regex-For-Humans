import { readFileSync } from "node:fs";
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
    if (scenario.id === "excluded-characters") {
      await expect(page.locator("#trace-list")).toContainText(
        'Any text without "a", "b", "c", "d" (greedy).',
      );
    }
    if (scenario.id === "line-rule") {
      await expect(page.locator("#trace-list")).toContainText(
        "Any text without line breaks (greedy).",
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
    expect(browserErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
    expect(remoteRequests).toEqual([]);
    expect(unversionedAssets).toEqual([]);
  });
}

test("editing rules reports errors without stale output and recovers", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Write your rules" });
  await editor.fill("digit\n  unsupported words");
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(editor).toHaveAttribute("aria-describedby", "rules-help diagnostic");
  await expect(page.locator("#diagnostic")).toContainText("Line 2, column 3");
  await expect(page.locator("#regex-output")).toHaveText("No pattern generated");
  await expect(page.getByRole("button", { name: /Copy regex/ })).toBeDisabled();
  await editor.fill("start\nstart\n3 digits");
  await expect(page.locator("#diagnostic")).toContainText(
    "Line 2, column 1: Only one beginning anchor is allowed.",
  );
  await editor.fill('start "A" extra');
  await expect(page.locator("#diagnostic")).toContainText("Line 1, column 11");
  await editor.fill("\n".repeat(201));
  await expect(page.locator("#diagnostic")).toContainText(
    "Line 201, column 1: Input cannot exceed 200 lines.",
  );
  await editor.fill(" ".repeat(16_385));
  await expect(page.locator("#diagnostic")).toContainText(
    "Line 1, column 16385: Rules cannot exceed 16384 UTF-16 code units.",
  );
  await editor.fill(String.raw`a "bad\q"`);
  await expect(page.locator("#diagnostic")).toContainText("Line 1, column 7: Invalid JSON escape.");
  await editor.fill('start "ABC"\n3 digits\nend');
  await expect(editor).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  await expect(page.locator("#diagnostic")).toBeHidden();
  await page.locator("#ignore-case").check();
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/iu");
  await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
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
  await expect(page.locator("#test-summary")).toHaveText("2 of 3 examples behave as expected");
  await page.locator("#match-mode").selectOption("search");
  await expect(page.locator("#test-summary")).toHaveText("3 of 3 examples behave as expected");
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
  await editor.fill('a "😀"');
  await firstSample.fill("😀");
  await expect(page.locator("#regex-output")).toHaveText("/😀/su");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
});

test("ignore-case option explains case-insensitive character sets", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Write your rules" }).fill("one of: K");
  await page.locator("#ignore-case").check();
  await expect(page.locator("#trace-list")).toContainText(
    'One of "K", ignoring case according to JavaScript\'s Unicode rules.',
  );
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
});

test("syntax link opens the local rendered guide", async ({ page, context }) => {
  await page.goto("/");
  const [guide] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: /Read the syntax/ }).click(),
  ]);
  await guide.waitForLoadState();
  await expect(guide).toHaveURL(/\/web\/language\.html\?v=[\da-f]{12}$/u);
  await expect(guide.getByRole("heading", { name: "Match one thing" })).toBeVisible();
  await expect(guide.locator(".guide-hero .hero-copy")).toContainText("Write one rule per line.");
  await expect(guide.getByText(/They reject a final line break/u)).toBeVisible();
  await expect(guide.locator("#repetition tbody tr").first()).toContainText("3 <item>");
  await guide.close();
});
