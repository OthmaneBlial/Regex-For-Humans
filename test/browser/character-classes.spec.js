import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { inputs, patterns } from "../fixtures/character-class-corpus.js";

test("class unions test multilingual captures, source navigation, range errors and native complements", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const rules = page.locator("#rules-input");
  const row = page.locator("#test-list .test-row").first();
  await page.locator("#match-mode").selectOption("search");
  const classRule = 'one or more character class: unicode property "L", unicode property "M", "_"';
  await rules.fill(`capture "word" {\n${classRule}\n}`);
  await expect(page.locator("#regex-output")).toHaveText(String.raw`/(?<word>[\p{L}\p{M}_]+)/u`);
  await row.locator("textarea").fill("😀e\u0301 اردو");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "e\u0301" at 2');
  await row.locator(".capture-explorer > summary").press("Enter");
  await row.locator(".capture-match > summary").first().press("Enter");
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "e\u0301" at 2',
    'Match 2: "اردو" at 5',
  ]);
  await expect(row.locator(".capture-value")).toHaveText(['"e\u0301"', '"e\u0301"']);
  await expect(row.locator(".capture-span")).toHaveText(["2–4", "2–4"]);
  await page
    .locator("#trace-list button")
    .filter({ hasText: "One Unicode code point in the union" })
    .press("Enter");
  await expect(rules).toBeFocused();
  expect(await rules.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
    classRule,
  );
  await rules.fill('range "ω" to "α"');
  await expect(rules).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#diagnostic")).toContainText("upper endpoint");
  await expect(page.locator("#copy-button")).toBeDisabled();
  await rules.fill('character class: range "😀" to "🙏", digit');
  await row.locator("textarea").fill("😀3🙏");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "😀" at 0');
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "😀" at 0',
    'Match 2: "3" at 2',
    'Match 3: "🙏" at 3',
  ]);
  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  await reverse.fill(String.raw`/[^\p{Lowercase_Letter}]/iu`);
  await page.locator("#reverse-button").press("Enter");
  await expect(rules).toHaveValue('not character class: unicode property "Lowercase_Letter"');
  await row.locator("textarea").fill("a");
  await expect(row.locator(".test-result")).toHaveText("! No match");
  await reverse.fill(String.raw`/[\P{Lowercase_Letter}]/iu`);
  await page.locator("#reverse-button").press("Enter");
  await expect(rules).toHaveValue('character class: not unicode property "Lowercase_Letter"');
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "a" at 0');
  await rules.fill('character class: unicode property "letter", "_"');
  await expect(page.locator("#diagnostic")).toContainText("not recognized");
  await rules.fill(classRule);
  await row.locator("textarea").fill("हिन्दी");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "हिन्दी" at 0');
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("class imports preserve native capture arrays and indices across Unicode flag combinations", async ({
  page,
}) => {
  await page.goto("/");
  const proof = await page.evaluate(
    async ({ patterns, inputs }) => {
      const { compile, regexToRules } = await import("/index.js");
      const snapshot = (match) =>
        match && {
          values: Array.from(match),
          index: match.index,
          groups: match.groups,
          indices: Array.from(match.indices),
          namedIndices: match.indices.groups,
        };
      const mismatches = [];
      let comparisons = 0;
      for (let bits = 0; bits < 8; bits += 1) {
        const flags = `${bits & 1 ? "i" : ""}${bits & 2 ? "m" : ""}${bits & 4 ? "s" : ""}u`;
        for (const source of patterns) {
          const translated = regexToRules(new RegExp(source, flags));
          const result = compile(translated.rules, { flags: translated.flags });
          const before = new RegExp(source, `d${flags}`);
          const after = new RegExp(result.source, `d${result.flags}`);
          for (const input of inputs) {
            if (
              JSON.stringify(snapshot(before.exec(input))) !==
              JSON.stringify(snapshot(after.exec(input)))
            )
              mismatches.push({ source, flags, input });
            comparisons += 1;
          }
        }
      }
      return { comparisons, mismatches };
    },
    { patterns, inputs },
  );
  expect(proof).toEqual({ comparisons: patterns.length * 8 * inputs.length, mismatches: [] });
});
