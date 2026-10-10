import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { flagSets, inputs, patterns } from "../fixtures/unicode-set-corpus.js";

for (let offset = 0; offset < flagSets.length; offset += 4) {
  test(`native nested v sets preserve captures and cursors: flags ${offset + 1}–${offset + 4} of 64`, async ({
    page,
  }) => {
    await page.goto("/");
    const comparisons = await page.evaluate(
      async ({ flagSets, inputs, patterns }) => {
        const { compile, regexToRules, toRegExp } = await import("/index.js");
        const snapshot = (match) =>
          match && {
            values: [...match],
            index: match.index,
            input: match.input,
            groups: match.groups,
            indices: match.indices && { values: [...match.indices], groups: match.indices.groups },
          };
        let count = 0;
        for (const flags of flagSets)
          for (const source of patterns) {
            const before = new RegExp(source, flags);
            before.lastIndex = 3;
            const translated = regexToRules(before);
            if (before.lastIndex !== 3) throw new Error("Translation changed lastIndex");
            const after = toRegExp(compile(translated.rules, { flags: translated.flags }));
            if (after.flags !== flags) throw new Error("Translation changed flags");
            for (const input of inputs)
              for (const cursor of [0, 1, 2]) {
                before.lastIndex = cursor;
                after.lastIndex = cursor;
                for (let step = 0; step < 3; step++) {
                  if (
                    JSON.stringify(snapshot(before.exec(input))) !==
                      JSON.stringify(snapshot(after.exec(input))) ||
                    before.lastIndex !== after.lastIndex
                  )
                    throw new Error(
                      `${source}/${flags} ${JSON.stringify(input)} at ${cursor}, step ${step}`,
                    );
                  count++;
                }
              }
          }
        return count;
      },
      { flagSets: flagSets.slice(offset, offset + 4), inputs, patterns },
    );
    expect(comparisons).toBe(patterns.length * 4 * inputs.length * 9);
  });
}

test("workshop imports nested set operations, rejects string complements and keeps keyboard trace navigation", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const rules = page.locator("#rules-input");
  await rules.fill(
    'capture "value" {\ncharacter set subtraction {\none of strings: "a", "ab", ""\nstring "ab"\n}\n}',
  );
  await expect(page.locator("#diagnostic")).toContainText("require the v flag");
  await expect(page.locator("#copy-button")).toBeDisabled();
  await page.locator("#unicode-mode").selectOption("v");
  await page.locator("#indices-flag").check();
  await page.locator("#match-mode").selectOption("search");
  const row = page.locator("#test-list .test-row").first();
  await row.locator("textarea").fill("😀ab");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "" at 0');
  await row.locator(".capture-explorer > summary").press("Enter");
  const nativeSummaries = await page.evaluate(() => {
    const text = "😀ab";
    const native = /(?<value>[\q{a|ab|}--\q{ab}])/dgv;
    const summaries = [];
    let match = native.exec(text);
    while (match) {
      summaries.push(
        `Match ${summaries.length + 1}: ${JSON.stringify(match[0])} at ${match.index}`,
      );
      if (!match[0]) native.lastIndex += (text.codePointAt(native.lastIndex) ?? 0) > 0xffff ? 2 : 1;
      match = native.exec(text);
    }
    return summaries;
  });
  await expect(row.locator(".capture-match > summary")).toHaveText(nativeSummaries);
  await page.locator("#trace-list button").filter({ hasText: "subtraction" }).press("Enter");
  await expect(rules).toBeFocused();
  expect(await rules.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
    "character set subtraction {",
  );
  await page.locator("#reverse-translator summary").click();
  await page.locator("#reverse-regex").fill("/(?<value>[[a-z]&&[^aeiou]])/dv");
  await page.locator("#reverse-button").press("Enter");
  await expect(rules).toHaveValue(
    'capture "value" {\ncharacter set intersection {\nlowercase letter\nnone of: "a", "e", "i", "o", "u"\n}\n}',
  );
  await row.locator("textarea").fill("ab");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "b" at 1');
  await row.locator(".capture-match > summary").first().press("Enter");
  await expect(row.locator(".capture-span")).toHaveText(["1–2", "1–2"]);
  await rules.fill('not character set subtraction {\nstring "ab"\nstring "ab"\n}');
  await expect(rules).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#diagnostic")).toContainText("negated class cannot contain");
  await expect(page.locator("#copy-button")).toBeDisabled();
  await rules.fill('not character set intersection {\nstring "ab"\ndigit\n}');
  await expect(page.locator("#copy-button")).toBeEnabled();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
