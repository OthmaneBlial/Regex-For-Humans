import { expect, test } from "@playwright/test";
import { LIMITS } from "../../src/parser.js";

test("oversized rules skip counting and keep error navigation within the source budget", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.ruleSplitLengths = [];
  });
  await page.route(/\/src\/parser\.js(?:\?.*)?$/u, async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const marker = "export function splitLines(source) {";
    expect(source).toContain(marker);
    await route.fulfill({
      response,
      body: source.replace(
        marker,
        `${marker}\n  globalThis.ruleSplitLengths?.push(source.length);`,
      ),
    });
  });
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const editor = page.locator("#rules-input");
  const counter = page.locator("#rule-count");
  const originalRules = await editor.inputValue();
  await page.locator("#ignore-case").check();
  await page.locator("#dot-all").check();
  for (const rules of [
    "\n".repeat(LIMITS.sourceLength * 8),
    JSON.stringify("x".repeat(LIMITS.sourceLength * 8)),
    "x".repeat(LIMITS.sourceLength + 1),
    JSON.stringify("😀".repeat(LIMITS.sourceLength * 4)),
  ]) {
    await page.evaluate(() => {
      window.ruleSplitLengths = [];
    });
    await editor.evaluate((field, value) => {
      field.value = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
    }, rules);
    await expect(page.locator("#diagnostic")).toContainText(
      "Rules cannot exceed 16384 UTF-16 code units.",
    );
    expect(await page.evaluate(() => window.ruleSplitLengths)).toEqual([LIMITS.sourceLength]);
    await expect(counter).toHaveText("Over limit");
    await expect(editor).toHaveValue(rules);
    await expect(editor).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#copy-button")).toBeDisabled();
    await expect(page.locator("#test-summary")).toHaveText("Fix the rules to run the examples.");
    await page.getByRole("button", { name: "Go to error", exact: true }).click();
    expect(await page.evaluate(() => window.ruleSplitLengths)).toEqual([
      LIMITS.sourceLength,
      LIMITS.sourceLength + 1,
    ]);
    await expect(editor).toBeFocused();
    expect(await editor.evaluate((field) => [field.selectionStart, field.selectionEnd])).toEqual([
      LIMITS.sourceLength,
      LIMITS.sourceLength + Number(rules[LIMITS.sourceLength] !== "\n"),
    ]);
    await expect(editor).toHaveValue(rules);
    await expect(page.locator("#ignore-case")).toBeChecked();
    await expect(page.locator("#dot-all")).toBeChecked();
  }
  const boundary = JSON.stringify("x".repeat(LIMITS.sourceLength - 2));
  await editor.fill(boundary);
  await expect(editor).toHaveValue(boundary);
  await expect(counter).toHaveText("1 rule");
  await expect(page.locator("#compile-state")).toHaveText("Compiled");
  await expect(page.locator("#diagnostic")).toBeHidden();
  await expect(page.locator("#copy-button")).toBeEnabled();
  await editor.fill(originalRules);
  await expect(counter).toHaveText("3 rules");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/isu");
  // Ignore case remains enabled, so the recipe's lowercase negative now matches.
  await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
});
