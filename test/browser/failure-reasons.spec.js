import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { translate } from "../../web/i18n.js";

test("wrong anchored literal positions explain failures in every interface language", async ({
  page,
}) => {
  await page.goto("/");
  const rules = page.locator("#rules-input");
  await rules.fill('start\n"ABC"\n1 digit\n"XYZ"\nend');
  const row = page.locator(".test-row").first();
  const input = row.locator("textarea").first();
  const reason = row.locator(".failure-reason");
  for (const locale of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(locale);
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      for (const [text, key, literal] of [
        ["!ABC1XYZ", "The input must begin with {literal}.", '"ABC"'],
        ["ABC1XYZ!", "The input must end with {literal}.", '"XYZ"'],
      ]) {
        await input.fill(text);
        await expect(reason).toHaveText(translate(locale, key, { literal }));
        await expect(row).toHaveAttribute("data-result", "fail");
      }
    }
  }
  await input.fill("ABC1XYZ");
  await expect(row).toHaveAttribute("data-result", "pass");
  await expect(reason).toBeHidden();
  await expect(reason).toBeEmpty();
});

test("failure explanations prove necessary conditions and clear after edits or invalid rules", async ({
  page,
}) => {
  await page.goto("/");
  const rules = page.locator("#rules-input");
  const row = page.locator(".test-row").first();
  const input = row.locator("textarea").first();
  const reason = row.locator(".failure-reason");
  await rules.fill('start\n"widget_"\n8 digits\nend');
  await input.fill("x");
  await expect(reason).toHaveText("Any match needs at least 15 UTF-16 units; this input has 1.");
  await input.fill("123456789012345");
  await expect(reason).toHaveText('Required literal "widget_" is absent from the input.');
  await input.fill("widget_notdigits");
  await expect(reason).toHaveText(
    "The native engine found no match. A precise failing step is unavailable.",
  );
  await input.fill("widget_12345678");
  await expect(reason).toBeHidden();
  await expect(reason).toBeEmpty();
  await rules.fill("not a rule");
  await expect(rules).toHaveAttribute("aria-invalid", "true");
  await expect(row).toHaveAttribute("data-result", "pending");
  await expect(reason).toBeHidden();
  await rules.fill('start\n"A"\nend');
  await input.fill("a");
  await expect(reason).toHaveText('Required literal "A" is absent from the input.');
  await page.locator("#ignore-case").check();
  await expect(row).toHaveAttribute("data-result", "pass");
  await expect(reason).toBeHidden();
});

test("failure explanations show actual UTF-16 ranges and retain exact expectation checks", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#rules-input").fill('"A"');
  const row = page.locator(".test-row").first();
  await row.locator("textarea").first().fill("😀A!");
  await expect(row.locator(".failure-reason")).toHaveText(
    "The native match covers [2, 3); full-input mode requires [0, 4).",
  );
  await page.locator("#match-mode").selectOption("search");
  await expect(row.locator(".failure-reason")).toBeHidden();
  await row.locator("select").selectOption("false");
  await expect(row.locator(".failure-reason")).toHaveText(
    "The native engine matched [2, 3); this example expects no match.",
  );
  await row.locator("select").selectOption("true");
  await row.locator(".expectation-editor summary").click();
  await row.locator(".expectation-input").fill('{"spans":[[0,1]]}');
  await expect(row.locator(".expectation-checks")).toContainText("! Exact spans differs");
  await expect(row.locator(".failure-reason")).toBeHidden();
});

const markupText = "<img onerror=alert(1)> {minimum}";
for (const [scenario, value, key] of [
  ["missing literal", "x".repeat(40), "Required literal {literal} is absent from the input."],
  ["input start", `x${markupText}`, "The input must begin with {literal}."],
  ["input end", `${markupText}x`, "The input must end with {literal}."],
])
  for (const locale of ["en", "zh-CN", "es", "fr"])
    test(`${locale} failure explanations for ${scenario} are described and accessible at 320px`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.setViewportSize({ width: 320, height: 800 });
      await page.locator("#rules-input").fill(`start\n${JSON.stringify(markupText)}\nend`);
      const row = page.locator(".test-row").first();
      const input = row.locator("textarea").first();
      await input.fill(value);
      const literal = JSON.stringify(markupText);
      await page.locator("#interface-language").selectOption(locale);
      for (const theme of ["light", "dark"]) {
        await page.locator("#interface-theme").selectOption(theme);
        await expect(row.locator(".failure-reason")).toHaveText(
          translate(locale, key, { literal }),
        );
        await expect(row.locator("img")).toHaveCount(0);
        const id = await row.locator(".failure-reason").getAttribute("id");
        await expect(input).toHaveAttribute("aria-describedby", new RegExp(id));
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      }
    });
