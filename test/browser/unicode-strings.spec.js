import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { flagSets, inputs, patterns } from "../fixtures/unicode-string-corpus.js";

for (let offset = 0; offset < flagSets.length; offset += 8) {
  test(`native v strings preserve captures and cursors: flags ${offset + 1}–${offset + 8} of 64`, async ({
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
      { flagSets: flagSets.slice(offset, offset + 8), inputs, patterns },
    );
    expect(comparisons).toBe(patterns.length * 8 * inputs.length * 9);
  });
}

test("isolated worker keeps longest strings, complete emoji captures and Unicode empty-match advancement", async ({
  page,
}) => {
  await page.goto("/");
  const batches = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    const runner = new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }));
    let count = 0;
    try {
      for (const flags of ["v", "dv", "gv", "vy", "dgv", "divy", "gimsv", "dgimsvy"])
        for (const mode of ["full", "search"])
          for (const source of [
            "(?<x>[\\q{a|ab|}])",
            "(?<x>\\p{RGI_Emoji})",
            "(?<x>[\\q{\\r\\n|\\r|\\n}])",
          ]) {
            const texts = ["ab", "ab", "😀", "👨‍👩‍👧", "😀a ab", "🇵🇰🇲🇦", "\r\n\n", "", "\ud83d"];
            const cases = texts.map((text, id) => {
              const match = new RegExp(
                mode === "full" ? `^(?:${source})$(?![\\s\\S])` : source,
                flags,
              ).exec(text);
              return {
                id,
                text,
                expected:
                  !!match &&
                  (mode === "search" || (match.index === 0 && match[0].length === text.length)),
              };
            });
            const results = await runner.run({ source, flags, mode, cases, captureCount: 1 });
            for (let i = 0; i < cases.length; i++) {
              const sample = cases[i],
                result = results[i];
              if (!result.pass || result.actual !== sample.expected)
                throw new Error(`Worker mismatch ${source}/${flags} ${mode} ${i}`);
              if (mode === "search") {
                const native = new RegExp(
                  source,
                  [..."dgimsvy"]
                    .filter((flag) => flags.includes(flag) || flag === "d" || flag === "g")
                    .join(""),
                );
                const matches = [];
                let match = native.exec(sample.text);
                while (match) {
                  matches.push({
                    value: match[0],
                    range: { start: match.index, end: match.index + match[0].length },
                    captures: [
                      {
                        value: match[1] ?? null,
                        range: match.indices[1]
                          ? { start: match.indices[1][0], end: match.indices[1][1] }
                          : null,
                      },
                    ],
                  });
                  if (match[0] === "")
                    native.lastIndex +=
                      (sample.text.codePointAt(native.lastIndex) ?? 0) > 0xffff ? 2 : 1;
                  match = native.exec(sample.text);
                }
                if (JSON.stringify(matches) !== JSON.stringify(result.matches))
                  throw new Error(`Worker string capture mismatch ${source}/${flags} ${i}`);
              }
            }
            count++;
          }
    } finally {
      runner.cancel();
    }
    return count;
  });
  expect(batches).toBe(48);
});

test("workshop imports native strings, selects v explicitly and shows complete string capture spans", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const rules = page.locator("#rules-input");
  await rules.fill('capture "value" {\none of strings: "a", "ab"\n}');
  await expect(page.locator("#diagnostic")).toContainText("require the v flag");
  await expect(page.locator("#copy-button")).toBeDisabled();
  await page.locator("#unicode-mode").selectOption("v");
  await page.locator("#indices-flag").check();
  await page.locator("#match-mode").selectOption("search");
  const row = page.locator("#test-list .test-row").first();
  await row.locator("textarea").fill("😀a ab");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "a" at 2');
  await row.locator(".capture-explorer > summary").press("Enter");
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "a" at 2',
    'Match 2: "ab" at 4',
  ]);
  await row.locator(".capture-match > summary").nth(1).press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"ab"', '"ab"']);
  await expect(row.locator(".capture-span")).toHaveText(["4–6", "4–6"]);
  await page
    .locator("#trace-list button")
    .filter({ hasText: "One native string or Unicode code point in" })
    .press("Enter");
  await expect(rules).toBeFocused();
  expect(await rules.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
    'one of strings: "a", "ab"',
  );
  await rules.fill('capture "value" {\nunicode property "RGI_Emoji"\n}');
  await row.locator("textarea").fill("x👨‍👩‍👧y");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "👨‍👩‍👧" at 1');
  await row.locator(".capture-match > summary").first().press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"👨‍👩‍👧"', '"👨‍👩‍👧"']);
  await expect(row.locator(".capture-span")).toHaveText(["1–9", "1–9"]);
  await page.locator("#reverse-translator summary").click();
  await page.locator("#reverse-regex").fill(String.raw`/(?<value>[\q{a|ab|}])/dv`);
  await page.locator("#reverse-button").press("Enter");
  await expect(rules).toHaveValue(
    'capture "value" {\ncharacter class: string "a", string "ab", string ""\n}',
  );
  await expect(page.locator("#unicode-mode")).toHaveValue("v");
  await expect(page.locator("#indices-flag")).toBeChecked();
  await row.locator("textarea").fill("😀");
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "" at 0',
    'Match 2: "" at 2',
  ]);
  await rules.fill('not character class: string "ab"');
  await expect(rules).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#diagnostic")).toContainText("negated class cannot contain");
  await expect(page.locator("#copy-button")).toBeDisabled();
  await rules.fill('one of strings: "a", "ab", ""');
  await expect(page.locator("#copy-button")).toBeEnabled();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
