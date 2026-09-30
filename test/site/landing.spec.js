import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";

const recipes = JSON.parse(
  readFileSync(new URL("../fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("landing recipes compile with the real library and copy the current rules and regex", async ({
  page,
}) => {
  await page.goto("/");
  for (const id of ["hex-color", "prefixed-identifier", "version-shape"]) {
    const recipe = recipes.find((item) => item.id === id);
    const button = page.locator(`[data-recipe="${id}"]`);
    await expect(button).toBeEnabled();
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    const compiled = compile(recipe.rules);
    const literal = `/${compiled.source}/${compiled.flags}`;
    await expect(page.locator("#rules-code")).toHaveText(recipe.rules);
    await expect(page.locator("#regex-code")).toHaveText(literal);
    await expect(page.locator("#demo-result")).toHaveText("✓ Match");
    await page.locator("#demo-input").fill(recipe.negative[0]);
    await expect(page.locator("#demo-result")).toHaveText("× No match");
    await page.locator("#demo-input").fill(recipe.positive[0]);
    await expect(page.locator("#demo-result")).toHaveText("✓ Match");
    await expect(page.locator("#demo-open")).toHaveAttribute("href", `./workshop/?example=${id}`);
    await page.evaluate(() => {
      window.copiedText = "";
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.copiedText = text;
          },
        },
      });
    });
    for (const [target, text] of [
      ["rules-code", recipe.rules],
      ["regex-code", literal],
    ]) {
      await page.locator(`[data-copy="${target}"]`).click();
      await expect.poll(() => page.evaluate(() => window.copiedText)).toBe(text);
    }
  }
});

test("landing is accessible at desktop, mobile and 320px, with working workshop links and assets", async ({
  page,
}) => {
  const failed = [];
  const errors = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failed.push(response.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  const viewport = page.viewportSize();
  for (const width of [viewport.width, 320]) {
    await page.setViewportSize({ width, height: viewport.height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    for (const button of await page.locator("[data-copy]").all())
      await expect(button).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  }
  await page.locator('.recipe-card[href*="hex-color"]').click();
  await expect(page.locator("#regex-output")).toHaveText("/^#[0-9A-Fa-f]{6}$/u");
  await page.getByRole("link", { name: /Read the syntax/ }).click();
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test("the initial hex demo still works when extra recipes cannot load", async ({ page }) => {
  await page.route("**/product-scenarios.json", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#demo-note")).toContainText("Extra recipes couldn't load");
  await page.locator("#demo-input").fill("#xyzxyz");
  await expect(page.locator("#demo-result")).toHaveText("× No match");
  await expect(page.locator("#demo-open")).toHaveAttribute("href", "./workshop/?example=hex-color");
});

test("copying a second snippet keeps its feedback after the first timer expires", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => {} },
    });
  });
  await page.goto("/");
  await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
  await page.locator('[data-copy="rules-code"]').click();
  await page.clock.fastForward(1000);
  await page.locator('[data-copy="regex-code"]').click();
  await page.clock.fastForward(900);
  await expect(page.locator("#copy-status")).toContainText("regex copied");
  await page.clock.fastForward(1000);
  await expect(page.locator("#copy-status")).toBeEmpty();
  await expect(page.locator('[data-copy="regex-code"]')).toHaveText("Copy regex");
});
