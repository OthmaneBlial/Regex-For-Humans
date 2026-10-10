import { expect, test } from "@playwright/test";

test("nested capture blocks compile and retain keyboard-accessible source traces", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  await page
    .locator("#rules-input")
    .fill('start\ncapture "year" {\n4 digits\n}\noptional group {\n"-"\n2 digits\n}\nend');
  await expect(page.locator("#regex-output")).toContainText(
    String.raw`/^(?<year>\d{4})(?:-\d{2}){0,1}$/u`,
  );
  const trace = page.locator("#trace-list button");
  await expect(trace).toHaveCount(9);
  const capture = trace.nth(1);
  await expect(capture).toContainText('Capture #1 named "year"');
  await capture.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#rules-input")).toBeFocused();
  expect(
    await page
      .locator("#rules-input")
      .evaluate((field) => field.value.slice(field.selectionStart, field.selectionEnd)),
  ).toBe('capture "year" {');
  await page.locator("#rules-input").fill('capture "x" {\ndigit');
  await expect(page.locator("#diagnostic")).toContainText("Close this group");
});
