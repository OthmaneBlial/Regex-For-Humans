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

test("a visible first recipe leaves the sidebar and carousel at their start", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('#example-list [aria-current="true"]')).toBeInViewport({ ratio: 1 });
  const offsets = await page.evaluate(() => {
    const result = [];
    for (let box = document.getElementById("example-list"); box; box = box.parentElement)
      result.push(box.scrollTop, box.scrollLeft);
    return result;
  });
  expect(offsets.every((offset) => offset === 0)).toBe(true);
});
