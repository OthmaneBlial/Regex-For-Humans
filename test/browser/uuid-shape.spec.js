import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const recipes = JSON.parse(
  readFileSync(new URL("../fixtures/product-scenarios.json", import.meta.url), "utf8"),
);
const recipe = recipes.find(({ id }) => id === "uuid-shape");

test("UUID shape explains fixed hex groups, keeps semantic limits and round-trips in the workshop", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copiedText = text;
        },
      },
    });
  });
  await page.goto("/?example=uuid-shape");
  const editor = page.locator("#rules-input");
  const output = page.locator("#regex-output");
  const sample = page.locator("#test-list textarea").first();
  const feedback = page.locator("#test-list .test-result").first();
  await expect(editor).toHaveValue(recipe.rules);
  await expect(page.locator("#recipe-count")).toHaveText(
    `01—${String(recipes.length).padStart(2, "0")}`,
  );
  await expect(page.locator("#recipe-note")).toHaveText(recipe.note);
  await expect(page.locator("#test-summary")).toHaveText("13 of 13 examples behave as expected");
  await expect(page.locator("#trace-list .trace-item")).toHaveCount(11);
  await expect(page.locator("#trace-list .trace-meaning").nth(1)).toHaveText(
    "Exactly 8 hexadecimal digits (0–9, A–F, a–f).",
  );
  await expect(page.locator("#trace-list .trace-meaning").nth(9)).toHaveText(
    "Exactly 12 hexadecimal digits (0–9, A–F, a–f).",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  for (const flags of ["", "i", "s", "is"]) {
    await page.locator("#ignore-case").setChecked(flags.includes("i"));
    await page.locator("#dot-all").setChecked(flags.includes("s"));
    await expect(output).toHaveText(`/${recipe.source}/${flags}u`);
    await sample.fill("12345678-9abc-fdef-0123-456789abcdef");
    await expect(feedback).toContainText("✓ Matched");
    await sample.fill("12345678-9abc-fdef-0123-456789abcdeg");
    await expect(feedback).toHaveText("! No match");
  }
  await sample.fill(recipe.positive[0]);
  await expect(feedback).toContainText("✓ Matched");
  const literal = `/${recipe.source}/isu`;
  await page.locator("#copy-button").click();
  await expect.poll(() => page.evaluate(() => window.copiedText)).toBe(literal);
  await page.locator("#reverse-translator summary").click();
  await page.locator("#reverse-regex").fill(literal);
  await page.locator("#reverse-button").click();
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue(recipe.rules.replaceAll("hex digits", "hex digit"));
  await expect(output).toHaveText(literal);
  await expect(page.locator("#ignore-case")).toBeChecked();
  await expect(page.locator("#dot-all")).toBeChecked();
  await expect(page.locator("#test-summary")).toHaveAttribute("data-state", "success");
  await expect(page.locator("#trace-list .trace-item")).toHaveCount(11);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});
