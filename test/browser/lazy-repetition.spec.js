import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("lazy captures distinguish search from full matching and retain keyboard rule navigation", async ({
  page,
}) => {
  await page.goto("/");
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const rules = page.locator("#rules-input");
  const row = page.locator("#test-list .test-row").first();
  await rules.fill('capture "number" {\nlazy digits\n}');
  await expect(page.locator("#regex-output")).toHaveText("/(?<number>\\d+?)/u");
  await row.locator("textarea").fill("1234");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "1234" at 0');
  await page.locator("#match-mode").selectOption("search");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "1" at 0');
  await row.locator(".capture-explorer > summary").press("Enter");
  await row.locator(".capture-match > summary").first().press("Enter");
  await expect(row.locator(".capture-value").first()).toHaveText('"1"');
  await expect(row.locator(".capture-value").nth(1)).toHaveText('"1"');
  await expect(row.locator(".capture-span").first()).toHaveText("0–1");
  await page
    .locator("#trace-list button")
    .filter({ hasText: "fewest repetitions first" })
    .press("Enter");
  await expect(rules).toBeFocused();
  expect(await rules.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
    "lazy digits",
  );
  await page.locator("#reverse-translator summary").click();
  await page.locator("#reverse-regex").fill("/(?<optional>a)??a/u");
  await page.locator("#reverse-button").press("Enter");
  await expect(rules).toHaveValue('lazy optional capture "optional" {\n"a"\n}\n"a"');
  await row.locator("textarea").fill("aa");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "a" at 0');
  await row.locator(".capture-match > summary").first().press("Enter");
  await expect(row.locator(".capture-value").first()).toHaveText('"a"');
  await expect(row.locator(".capture-value").nth(1)).toHaveText("Not captured");
  await expect(row.locator(".capture-span").nth(1)).toHaveText("—");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("native lazy imports preserve capture arrays and indices in every browser engine", async ({
  page,
}) => {
  await page.goto("/");
  const comparisons = await page.evaluate(async () => {
    const { compile, regexToRules } = await import("/index.js");
    const patterns = [
      "a*?",
      "a??a",
      "(?:AB){1,3}?",
      "(?:)*?",
      "(?<empty>)+?",
      "((a)|(b))+?c",
      "(?<x>a+?)b\\k<x>??",
      "(?:😀){1,3}?",
      "(?:.[^]*?|[^]+?.)",
      "^(?<digits>\\d{1,3}?)\\d*$",
    ];
    const samples = [
      "",
      "a",
      "aa",
      "aaa",
      "ab",
      "abc",
      "bc",
      "ABAB",
      "1234",
      "😀",
      "😀😀",
      "😀a",
      "\ud83d",
      "\ude00",
      "a\nb",
      "\n",
    ];
    let checked = 0;
    const mismatches = [];
    const snapshot = (match) =>
      match && {
        values: Array.from(match),
        index: match.index,
        groups: match.groups,
        indices: Array.from(match.indices),
        namedIndices: match.indices.groups,
      };
    for (let bits = 0; bits < 8; bits += 1)
      for (const source of patterns) {
        const flags = `${bits & 1 ? "i" : ""}${bits & 2 ? "m" : ""}${bits & 4 ? "s" : ""}u`;
        const translated = regexToRules(new RegExp(source, flags));
        const result = compile(translated.rules, { flags: translated.flags });
        const original = new RegExp(source, `d${flags}`);
        const rebuilt = new RegExp(result.source, `d${result.flags}`);
        for (const text of samples) {
          checked += 1;
          if (
            JSON.stringify(snapshot(original.exec(text))) !==
            JSON.stringify(snapshot(rebuilt.exec(text)))
          )
            mismatches.push({ source, flags, text });
        }
      }
    return { checked, mismatches };
  });
  expect(comparisons).toEqual({ checked: 1280, mismatches: [] });
});
