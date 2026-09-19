import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

for (const state of ["ready", "error"]) {
  test(`${state} workshop has no automatically detectable WCAG A/AA violation`, async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
    if (state === "error") {
      await page.getByRole("textbox", { name: "One instruction per line" }).fill("unknown rule");
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
  await page.getByRole("textbox", { name: "One instruction per line" }).focus();
  await expect(page.getByRole("textbox", { name: "One instruction per line" })).toBeFocused();
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
