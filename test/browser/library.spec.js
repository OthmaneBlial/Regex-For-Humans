import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { translate } from "../../web/i18n.js";

test("library filters preserve the workspace and selected recipe through empty results", async ({
  page,
}) => {
  await page.goto("/?example=unicode-word");
  const rules = await page.locator("#rules-input").inputValue();
  await expect(page.locator("#test-summary")).toHaveText("11 of 11 examples behave as expected");
  await page.locator("#recipe-category").selectOption("unicode-text");
  await expect(page.locator("#example-list button")).toHaveCount(1);
  await expect(page.locator('[data-scenario="unicode-word"]')).toHaveAttribute(
    "aria-current",
    "true",
  );
  await page.locator("#recipe-level").selectOption("beginner");
  await expect(page.locator("#example-list button")).toHaveCount(0);
  await expect(page.locator("#recipe-results")).toHaveText("0 of 31 recipes");
  await expect(page.locator("#example-list")).toHaveText("No recipes match. Try fewer filters.");
  await page.locator("#recipe-search").fill('<img onerror="alert(1)">');
  await expect(page.locator("#example-list img")).toHaveCount(0);
  await expect(page.locator("#rules-input")).toHaveValue(rules);
  await expect(page.locator("#test-list textarea").nth(2)).toHaveValue("اردو");
  await expect(page).toHaveURL(/example=unicode-word/u);
  await page.locator("#recipe-clear").click();
  await expect(page.locator("#recipe-search")).toBeFocused();
  await expect(page.locator("#example-list button")).toHaveCount(31);
  await expect(page.locator('[data-scenario="unicode-word"]')).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.locator("#recipe-clear")).toBeDisabled();
  if (page.viewportSize().width > 760) {
    expect(
      await page
        .locator(".sidebar")
        .evaluate(
          (sidebar) =>
            sidebar.clientHeight <= innerHeight && sidebar.scrollHeight > sidebar.clientHeight,
        ),
    ).toBe(true);
    await page.locator('[data-scenario="replace-word"]').focus();
    await expect(page.locator('[data-scenario="replace-word"]')).toBeInViewport();
  }
});

test("translated search, keyboard selection and palette controls keep the DSL in English", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  for (const [locale, query] of [
    ["en", "syntax"],
    ["zh-CN", "预发布"],
    ["es", "prelanzamiento"],
    ["fr", "syntaxe"],
  ]) {
    await page.locator("#interface-language").selectOption(locale);
    await page.locator("#recipe-category").selectOption("semantic-versions");
    await page.locator("#recipe-level").selectOption("expert");
    await page.locator("#recipe-search").fill(query);
    await expect(page.locator("#recipe-results")).toHaveText(
      translate(locale, "{count} of {total} recipes", { count: 1, total: 31 }),
    );
    const recipe = page.locator('[data-scenario="semantic-version"]');
    await expect(recipe).toHaveAccessibleDescription(translate(locale, "Expert"));
    await recipe.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#rules-input")).toHaveValue(/capture "major"/u);
    await expect(page.locator("#test-summary")).toHaveText(
      translate(locale, "{passed} of {total} examples behave as expected{feedback}", {
        passed: 12,
        total: 12,
        feedback: "",
      }),
    );
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("replacement examples preload detailed expectations and survive catalog filtering", async ({
  page,
}) => {
  await page.goto("/?example=replace-word");
  await expect(page.locator("#test-summary")).toHaveText("6 of 6 examples behave as expected");
  const row = page.locator("#test-list .test-row").nth(1);
  await row
    .locator("summary")
    .filter({ hasText: /^Exact expectations$/u })
    .click();
  await expect(row.locator(".expectation-checks .replacement-result")).toContainText(
    "the then teh",
  );
  const details = row.locator('input[type="text"]');
  const original = await details.inputValue();
  await page.locator("#recipe-search").fill("nonexistent-query");
  await page.locator("#recipe-clear").click();
  await expect(details).toHaveValue(original);
  await page.locator("#global-flag").check();
  await expect(page.locator("#test-summary")).toHaveText("5 of 6 examples behave as expected");
  await expect(row.locator(".expectation-checks .replacement-result")).toContainText(
    "the then the",
  );
  await page.locator("#global-flag").uncheck();
  await expect(page.locator("#test-summary")).toHaveText("6 of 6 examples behave as expected");
});

test("delayed catalog keeps filters disabled and binds options in the chosen language", async ({
  page,
}) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/product-scenarios.json*", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#interface-language")).toBeEnabled();
    await expect(page.locator("#recipe-search")).toBeDisabled();
    await expect(page.locator("#recipe-category")).toBeDisabled();
    await expect(page.locator("#recipe-level")).toBeDisabled();
    await page.locator("#interface-language").selectOption("fr");
    release();
    await expect(page.locator("#recipe-search")).toBeEnabled();
    await expect(page.locator('#recipe-category option[value="semantic-versions"]')).toHaveText(
      "Versions sémantiques",
    );
    await expect(page.locator("#rules-input")).toHaveValue('start "ABC"\n3 digits\nend');
    await expect(page.locator("#recipe-results")).toHaveText("Recettes : 31 sur 31");
  } finally {
    release();
  }
});
