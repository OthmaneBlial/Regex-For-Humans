import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("assertions expose captures outside consuming spans, absent values and Unicode empty matches", async ({
  page,
}) => {
  await page.goto("/");
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const rules = page.locator("#rules-input");
  const row = page.locator("#test-list .test-row").first();
  await page.locator("#match-mode").selectOption("search");
  await rules.fill(
    'preceded by {\ncapture "currency" {\n"USD"\n}\n}\ncapture "amount" {\ndigits\n}',
  );
  await expect(page.locator("#regex-output")).toHaveText("/(?<=(?<currency>USD))(?<amount>\\d+)/u");
  await row.locator("textarea").fill("USD123");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "123" at 3');
  await row.locator(".capture-explorer > summary").press("Enter");
  await row.locator(".capture-match > summary").press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"123"', '"USD"', '"123"']);
  await expect(row.locator(".capture-span")).toHaveText(["3–6", "0–3", "3–6"]);
  await page
    .locator("#trace-list button")
    .filter({ hasText: "Require a match ending" })
    .press("Enter");
  await expect(rules).toBeFocused();
  expect(await rules.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
    "preceded by {",
  );
  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  await reverse.fill("/USD(?=(?<amount>\\d+))/u");
  await page.locator("#reverse-button").press("Enter");
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "USD" at 0');
  await row.locator(".capture-match > summary").press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"USD"', '"123"']);
  await expect(row.locator(".capture-span")).toHaveText(["0–3", "3–6"]);
  await reverse.fill("/(?!(?<blocked>x))a/u");
  await page.locator("#reverse-button").press("Enter");
  await row.locator("textarea").fill("a");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "a" at 0');
  await row.locator(".capture-match > summary").press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"a"', "Not captured"]);
  await expect(row.locator(".capture-span")).toHaveText(["0–1", "—"]);
  await rules.fill('followed by {\ncapture "character" {\nany character\n}\n}');
  await row.locator("textarea").fill("😀a");
  await expect(row.locator(".capture-explorer > summary")).toHaveText(
    "2 matches · 1 capture per match",
  );
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "" at 0',
    'Match 2: "" at 2',
  ]);
  await row.locator(".capture-match > summary").first().press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"" (empty)', '"😀"']);
  await expect(row.locator(".capture-span")).toHaveText(["0–0", "0–2"]);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("native lookaround imports preserve direction, capture arrays and indices in every browser", async ({
  page,
}) => {
  await page.goto("/");
  const comparisons = await page.evaluate(async () => {
    const { compile, regexToRules } = await import("/index.js");
    const patterns = [
      "a(?=b)",
      "a(?!b)",
      "(?<=a)b",
      "(?<!a)b",
      "(?=)",
      "(?!)",
      "(?<=([ab]+)([bc]+))$",
      "(?<=(?<x>a+?))b",
      "(?=(?<x>a|b))\\k<x>",
      "(?<=😀)(?<x>a)",
      "(?!(?<x>a))b\\k<x>",
      "(?=(?:.[^]))",
    ];
    const samples = [
      "",
      "a",
      "aa",
      "ab",
      "aab",
      "b",
      "bb",
      "abc",
      "ABC",
      "bc",
      "bca",
      "😀a",
      "😀",
      "\ud83d",
      "\ude00",
      "a\nb",
      "\na\n",
      "\n",
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
    let checked = 0;
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
  expect(comparisons).toEqual({ checked: 1728, mismatches: [] });
});
