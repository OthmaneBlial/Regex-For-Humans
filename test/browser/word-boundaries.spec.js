import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("word boundaries retain native empty captures, Unicode positions and source navigation", async ({
  page,
}) => {
  await page.goto("/");
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const rules = page.locator("#rules-input");
  const row = page.locator("#test-list .test-row").first();
  await page.locator("#match-mode").selectOption("search");
  await rules.fill('capture "edge" {\nword boundary\n}\ncapture "word" {\n"cat"\n}\nword boundary');
  await expect(page.locator("#regex-output")).toHaveText("/(?<edge>\\b)(?<word>cat)\\b/u");
  await row.locator("textarea").fill("😀cat!");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "cat" at 2');
  await row.locator(".capture-explorer > summary").press("Enter");
  await row.locator(".capture-match > summary").press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"cat"', '"" (empty)', '"cat"']);
  await expect(row.locator(".capture-span")).toHaveText(["2–5", "2–2", "2–5"]);
  await page
    .locator("#trace-list button")
    .filter({ hasText: "Require different word/non-word status" })
    .first()
    .press("Enter");
  await expect(rules).toBeFocused();
  expect(await rules.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
    "word boundary",
  );
  await row.locator("textarea").fill("_cat_");
  await expect(row.locator(".test-result")).toHaveText("! No match");
  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  await reverse.fill("/\\B/iu");
  await page.locator("#reverse-button").press("Enter");
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await expect(rules).toHaveValue("not word boundary");
  await row.locator("textarea").fill("😀");
  await expect(row.locator(".capture-explorer > summary")).toHaveText(
    "2 matches · 0 captures per match",
  );
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "" at 0',
    'Match 2: "" at 2',
  ]);
  await row.locator("textarea").fill("K");
  await expect(row.locator(".test-result")).toHaveText("! No match");
  await page.locator("#ignore-case").uncheck();
  await expect(row.locator(".capture-explorer > summary")).toHaveText(
    "2 matches · 0 captures per match",
  );
  await rules.fill("optional word boundary");
  await expect(rules).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#copy-button")).toBeDisabled();
  await rules.fill("word boundary");
  await row.locator("textarea").fill("cat");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "" at 0');
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "" at 0',
    'Match 2: "" at 3',
  ]);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("native boundary imports preserve captures and indices under every supported flag set", async ({
  page,
}) => {
  await page.goto("/");
  const proof = await page.evaluate(async () => {
    const { compile, regexToRules } = await import("/index.js");
    const patterns = [
      String.raw`\b`,
      String.raw`\B`,
      String.raw`^\B$`,
      String.raw`\bcat\b`,
      String.raw`\Bcat\B`,
      String.raw`(?<edge>\b)cat`,
      String.raw`\b(?<word>\w+?)\b`,
      String.raw`(?:(\b)?a)+`,
      String.raw`(?=\bcat)cat`,
      String.raw`(?<=\bcat)\B`,
      String.raw`^\B.\B$`,
      String.raw`[\b]\b`,
    ];
    const inputs = [
      "",
      "cat",
      "CAT",
      "cats",
      "scat",
      " cat!",
      "cat cat",
      "aa",
      "a",
      "_",
      "0",
      "_cat_",
      "é",
      "écaté",
      "K",
      "ſ",
      "😀",
      "😀cat😀",
      "cat\u0301",
      "中文",
      "عربي",
      "اردو",
      "\ncat\n",
      "\bcat",
      "\ud83d",
      "\ude00",
    ];
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
  });
  expect(proof).toEqual({ comparisons: 2496, mismatches: [] });
});
