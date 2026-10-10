import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("alternatives import captures, expose absent values and navigate to each choice", async ({
  page,
}) => {
  await page.goto("/");
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const rules = page.locator("#rules-input");
  const row = page.locator("#test-list .test-row").first();
  await rules.fill('start\ncapture "pet" {\neither {\n"cat"\n"dog"\n"bird"\n}\n}\nend');
  await expect(page.locator("#regex-output")).toHaveText("/^(?<pet>(?:cat|dog|bird))$/u");
  await row.locator("textarea").fill("dog");
  await expect(row.locator(".capture-explorer > summary")).toHaveText(
    "1 match · 1 capture per match",
  );
  await row.locator(".capture-explorer > summary").press("Enter");
  await row.locator(".capture-match > summary").press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"dog"', '"dog"']);
  const separator = page.locator("#trace-list button").filter({ hasText: "Alternative 2 of 3" });
  await separator.press("Enter");
  await expect(rules).toBeFocused();
  expect(await rules.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
    '"dog"',
  );
  await page.locator("#reverse-translator summary").click();
  await page.locator("#reverse-regex").fill("/^(?:(?<first>a)|(?<second>b))$/u");
  await page.locator("#reverse-button").press("Enter");
  await expect(page.locator("#reverse-regex")).toHaveAttribute("aria-invalid", "false");
  await row.locator("textarea").fill("b");
  await row.locator(".capture-match > summary").press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"b"', "Not captured", '"b"']);
  await expect(row.locator(".capture-span")).toHaveText(["0–1", "—", "0–1"]);
  await row.locator("textarea").fill("ab");
  await expect(row.locator(".test-result")).toHaveText("! No match");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("alternative imports retain native capture arrays and indices in every engine", async ({
  page,
}) => {
  await page.goto("/");
  const comparisons = await page.evaluate(async () => {
    const { compile, regexToRules } = await import("/index.js");
    const patterns = [
      "a|aa",
      "^a|b$",
      "(?:a|)",
      "((a)|(b))*",
      "(?<x>a)|(?<y>b)",
      "(?:(a)|b)\\1",
      "(?:.[^]|[^].)",
      "(?:😀|a)+",
      "(?:a|(?:b|c)d){0,2}",
    ];
    const samples = [
      "",
      "a",
      "aa",
      "ab",
      "b",
      "bb",
      "bcd",
      "😀",
      "😀a",
      "\na",
      "a\n",
      "\ud83d",
      "\ude00",
    ];
    const mismatches = [];
    let checked = 0;
    for (let bits = 0; bits < 8; bits += 1)
      for (const source of patterns) {
        const flags = `${bits & 1 ? "i" : ""}${bits & 2 ? "m" : ""}${bits & 4 ? "s" : ""}u`;
        const translated = regexToRules(new RegExp(source, flags));
        const result = compile(translated.rules, { flags: translated.flags });
        const original = new RegExp(source, `d${flags}`);
        const rebuilt = new RegExp(result.source, `d${result.flags}`);
        const snapshot = (match) =>
          match && {
            values: Array.from(match),
            index: match.index,
            groups: match.groups,
            indices: Array.from(match.indices),
            namedIndices: match.indices.groups,
          };
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
  expect(comparisons).toEqual({ checked: 936, mismatches: [] });
});
