import { expect, test } from "@playwright/test";

test("a linked recipe is revealed in the recipe list without scrolling the page", async ({
  page,
}) => {
  await page.goto("/?example=git-object-hash");
  const current = page.locator('#example-list [aria-current="true"]');
  await expect(current).toHaveAttribute("data-scenario", "git-object-hash");
  await expect(current).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
