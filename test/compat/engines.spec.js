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

  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  await reverse.fill("/^Hi|Hello$/u");
  await page.locator("#reverse-button").click();
  await expect(reverse).toHaveAttribute("aria-invalid", "true");
  await expect(reverse).toHaveAccessibleDescription(/Only a start anchor/);
  await expect(output).toHaveText("/^Hello$/u");
  await reverse.fill("/^[a-zA-Z]{2}$/u");
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await page.locator("#reverse-button").click();
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await expect(output).toHaveText("/^[A-Za-z]{2}$/u");
  await firstExample.fill("Hi");
  await expect(firstResult).toHaveText('✓ Matched "Hi" at 0');
  await reverse.fill(String.raw`/^\cJ{2}$/u`);
  await page.locator("#reverse-button").click();
  await expect(output).toHaveText(String.raw`/^\u{a}{2}$/u`);
  await firstExample.fill("\n\n");
  await expect(firstResult).toHaveText('✓ Matched "\\n\\n" at 0');
  await firstExample.fill("\n");
  await expect(firstResult).toHaveText("! No match");
});
