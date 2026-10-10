import { expect, test } from "@playwright/test";
import { compile, toRegExp } from "../../index.js";

test("capture and developer examples copy real source and expose all README languages", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedText = text;
        },
      },
    });
  });
  await page.goto("/");
  const rules = await page.locator("#capture-rules").textContent();
  const compiled = compile(rules);
  await expect(page.locator("#capture-regex")).toHaveText(`/${compiled.source}/${compiled.flags}`);
  const match = toRegExp(compiled).exec("2026-10-10");
  expect({ ...match.groups }).toEqual({ year: "2026", month: "10", day: "10" });
  await expect(page.locator(".capture-fields dd")).toHaveText(match.slice(1));
  for (const id of ["capture-rules", "capture-regex", "library-code", "terminal-code"]) {
    const text = (await page.locator(`#${id}`).textContent()).trim();
    const copy = page.locator(`[data-copy="${id}"]`);
    await expect(copy).toBeEnabled();
    await copy.click();
    await expect.poll(() => page.evaluate(() => window.copiedText)).toBe(text);
  }
  const languages = page.getByRole("navigation", { name: "README languages" }).getByRole("link");
  await expect(languages).toHaveCount(8);
  for (const link of await languages.all()) await expect(link).toBeVisible();
  await page.locator("#questions details").first().locator("summary").press("Enter");
  await expect(page.locator("#questions details").first()).toHaveAttribute("open", "");
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
