import { expect, test } from "@playwright/test";

test("the workshop compiles rules and reports example results", async ({ page }) => {
  await page.goto("/");
  const output = page.locator("#regex-output");
  await expect(output).toHaveText("/^ABC\\d{3}$/u");

  await page.getByRole("textbox", { name: "Write your rules" }).fill('start\n"Hello"\nend');
  await expect(output).toHaveText("/^Hello$/u");

  const firstExample = page.locator("#test-list textarea").first();
  const firstResult = page.locator("#test-list .test-result").first();
  await firstExample.fill("Hello");
  await expect(firstResult).toHaveText('✓ Matched "Hello" at 0');
  await firstExample.fill("Hello!");
  await expect(firstResult).toHaveText("! No match");
});
