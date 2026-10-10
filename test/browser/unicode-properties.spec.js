import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Unicode properties expose native multilingual captures, alias errors and complement behavior", async ({
  page,
}) => {
  await page.goto("/");
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const rules = page.locator("#rules-input");
  const row = page.locator("#test-list .test-row").first();
  await page.locator("#match-mode").selectOption("search");
  await rules.fill('capture "word" {\none or more unicode property "L"\n}');
  await expect(page.locator("#regex-output")).toHaveText("/(?<word>\\p{L}+)/u");
  await row.locator("textarea").fill("😀اردو 中文");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "اردو" at 2');
  await row.locator(".capture-explorer > summary").press("Enter");
  await row.locator(".capture-match > summary").first().press("Enter");
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "اردو" at 2',
    'Match 2: "中文" at 7',
  ]);
  await expect(row.locator(".capture-value")).toHaveText(['"اردو"', '"اردو"']);
  await expect(row.locator(".capture-span")).toHaveText(["2–6", "2–6"]);
  await page
    .locator("#trace-list button")
    .filter({ hasText: "Unicode code point selected by property" })
    .press("Enter");
  await expect(rules).toBeFocused();
  expect(await rules.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
    'one or more unicode property "L"',
  );
  await rules.fill('unicode property "script=Greek"');
  await expect(rules).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#copy-button")).toBeDisabled();
  await expect(page.locator("#diagnostic")).toContainText("not recognized");
  await rules.fill('unicode property "Script_Extensions=Thaana"');
  await row.locator("textarea").fill("٢");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "٢" at 0');
  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  await reverse.fill("/\\P{Lowercase_Letter}/iu");
  await page.locator("#reverse-button").press("Enter");
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await expect(rules).toHaveValue('not unicode property "Lowercase_Letter"');
  await row.locator("textarea").fill("a");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "a" at 0');
  await page.locator("#ignore-case").uncheck();
  await expect(row.locator(".test-result")).toHaveText("! No match");
  const retained = await rules.inputValue();
  await reverse.fill("/a[]/u");
  await page.locator("#reverse-button").press("Enter");
  await expect(reverse).toHaveAttribute("aria-invalid", "true");
  await expect(rules).toHaveValue(retained);
  await expect(page.locator("#reverse-feedback")).toContainText("empty character class");
  await reverse.fill("/\\p{L}{0}/u");
  await page.locator("#reverse-button").press("Enter");
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await row.locator("textarea").fill("😀");
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "" at 0',
    'Match 2: "" at 2',
  ]);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("property imports preserve native captures and indices with all supported flag combinations", async ({
  page,
}) => {
  await page.goto("/");
  const proof = await page.evaluate(async () => {
    const { compile, regexToRules } = await import("/index.js");
    const patterns = [
      String.raw`\p{L}`,
      String.raw`\p{General_Category=Letter}`,
      String.raw`\p{sc=Grek}+?`,
      String.raw`\p{Script_Extensions=Thaana}`,
      String.raw`\p{Nd}+`,
      String.raw`\p{Emoji_Presentation}{2}`,
      String.raw`\P{Lowercase_Letter}`,
      String.raw`(?<word>\p{L}+?)\s\k<word>`,
      String.raw`(?<letter>\p{L})?(?<number>\p{Nd}*)`,
      String.raw`(\p{L}|\p{M})+`,
      String.raw`(?<empty>\p{L}{0})`,
      String.raw`(?:\p{L}\p{M}*){1,3}?`,
      String.raw`(?=(?<letter>\p{L}))`,
      String.raw`(?<=(?<letters>\p{L}+))\p{Nd}`,
      String.raw`(?<!\P{ASCII})\p{L}`,
      String.raw`^\p{L}+$`,
    ];
    const inputs = [
      "",
      "a",
      "A",
      "abc",
      "aa aa",
      "é",
      "e\u0301",
      "αβ",
      "αβ1",
      "中文",
      "عربي",
      "اردو",
      "٢",
      "٣",
      "12",
      "é1",
      "हिन्दी",
      "𐐀",
      "😀",
      "😀😀",
      "👨‍👩‍👧",
      "👩🏽",
      "\na\n",
      "\u200c",
      "\u0301",
      "K",
      "ſ",
      "\ud83d",
      "\ude00",
      "\t",
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
  expect(proof).toEqual({ comparisons: 3840, mismatches: [] });
});
