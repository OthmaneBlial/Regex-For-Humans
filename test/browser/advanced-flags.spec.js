import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { flagSets, inputs, patterns } from "../fixtures/advanced-flags-corpus.js";

test("all eight flags preserve native captures, indices and cursor state across 128 combinations", async ({
  page,
}) => {
  await page.goto("/");
  const proof = await page.evaluate(
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
      let comparisons = 0;
      for (const flags of flagSets)
        for (const source of patterns) {
          const before = new RegExp(source, flags);
          before.lastIndex = 2;
          const translated = regexToRules(before);
          if (before.lastIndex !== 2) throw new Error("Translation changed cursor state");
          const after = toRegExp(compile(translated.rules, { flags: translated.flags }));
          if (after.flags !== flags) throw new Error(`Lost flags: ${source}/${flags}`);
          for (const input of inputs)
            for (const cursor of [0, 1, 2]) {
              before.lastIndex = cursor;
              after.lastIndex = cursor;
              for (let step = 0; step < 3; step += 1) {
                if (
                  JSON.stringify(snapshot(after.exec(input))) !==
                    JSON.stringify(snapshot(before.exec(input))) ||
                  after.lastIndex !== before.lastIndex
                )
                  throw new Error(
                    `Native mismatch: ${source}/${flags} ${JSON.stringify(input)} at ${cursor}, step ${step}`,
                  );
                comparisons += 1;
              }
            }
        }
      return comparisons;
    },
    { flagSets, inputs, patterns },
  );
  expect(proof).toBe(184_320);
});

test("worker combines requested d/g/y flags once, resets every example and respects sticky search", async ({
  page,
}) => {
  await page.goto("/");
  const proof = await page.evaluate(async (flagSets) => {
    const { TestRunner } = await import("/web/test-runner.js");
    const runner = new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }));
    let batches = 0;
    try {
      for (const flags of flagSets)
        for (const mode of ["full", "search"])
          for (const source of ["(?<x>a|ab)", "(?<x>)"]) {
            const texts = ["ab", "ab", "ba", "a a", "😀a", "", "😀", "a", "a"];
            const cases = texts.map((text, id) => {
              const native = new RegExp(
                mode === "full" ? `^(?:${source})$(?![\\s\\S])` : source,
                flags,
              ).exec(text);
              return {
                id,
                text,
                expected:
                  native !== null &&
                  (mode === "search" || (native.index === 0 && native[0].length === text.length)),
              };
            });
            const results = await runner.run({ source, flags, mode, cases, captureCount: 1 });
            for (let i = 0; i < cases.length; i += 1) {
              const sample = cases[i];
              const result = results[i];
              if (result.actual !== sample.expected || !result.pass)
                throw new Error(`State leaked: ${source}/${flags} ${mode} case ${i}`);
              if (mode === "search") {
                const native = new RegExp(source, [...new Set(`${flags}dg`)].sort().join(""));
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
                  throw new Error(`Capture mismatch: ${source}/${flags} case ${i}`);
              }
            }
            batches += 1;
          }
    } finally {
      runner.cancel();
    }
    return batches;
  }, flagSets);
  expect(proof).toBe(512);
});

test("absolute input anchors never accept a position inside an astral character with m", async ({
  page,
}) => {
  await page.goto("/");
  const proof = await page.evaluate(async (flagSets) => {
    const { compile, regexToRules, toRegExp } = await import("/index.js");
    let comparisons = 0;
    for (const flags of flagSets)
      for (const [rules, source] of [
        ["start", "^"],
        ["end", "$"],
        ["start\nend", "^$"],
        ["start\nany character\nend", "^.$"],
      ]) {
        const native = new RegExp(source, flags.replace("m", ""));
        const result = toRegExp(compile(rules, { flags: [...new Set(`${flags}m`)].join("") }));
        const translated = regexToRules(result);
        const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
        for (const input of ["", "😀", "😀a", "a😀", "\n😀\n", "a\n", "\ud800", "\udc00"])
          for (const cursor of [0, 1, 2, 3, 4]) {
            native.lastIndex = cursor;
            result.lastIndex = cursor;
            rebuilt.lastIndex = cursor;
            const before = native.exec(input);
            const after = result.exec(input);
            const reverse = rebuilt.exec(input);
            if (
              before?.[0] !== after?.[0] ||
              before?.index !== after?.index ||
              native.lastIndex !== result.lastIndex ||
              before?.[0] !== reverse?.[0] ||
              before?.index !== reverse?.index ||
              native.lastIndex !== rebuilt.lastIndex
            )
              throw new Error(
                `Absolute anchor mismatch: ${source}/${flags} ${JSON.stringify(input)} at ${cursor}`,
              );
            comparisons += 1;
          }
      }
    return comparisons;
  }, flagSets);
  expect(proof).toBe(20_480);
});

test("workshop exposes every flag, imports options, preserves failed imports and resets recipes", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const rules = page.locator("#rules-input");
  await rules.fill('capture "x" {\nletter\n}');
  const toggles = [
    "indices-flag",
    "global-flag",
    "ignore-case",
    "multiline-flag",
    "dot-all",
    "sticky-flag",
  ];
  for (const id of toggles) await page.locator(`#${id}`).check();
  await page.locator("#unicode-mode").selectOption("v");
  await expect(page.locator("#regex-output")).toHaveText("/(?<x>[A-Za-z])/dgimsvy");
  await expect(page.locator("#copy-button")).toBeEnabled();
  await page.locator("#match-mode").selectOption("search");
  const row = page.locator("#test-list .test-row").first();
  await row.locator("textarea").fill("a a");
  await expect(row.locator(".test-result")).toHaveText('✓ Matched "a" at 0');
  await expect(row.locator(".capture-match > summary")).toHaveCount(1);
  await page.locator("#sticky-flag").uncheck();
  await expect(row.locator(".capture-match > summary")).toHaveCount(2);
  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  await reverse.fill("/(?<x>a)/dgimsvy");
  await page.locator("#reverse-button").press("Enter");
  await expect(rules).toHaveValue('capture "x" {\n"a"\n}');
  for (const id of toggles) await expect(page.locator(`#${id}`)).toBeChecked();
  await expect(page.locator("#unicode-mode")).toHaveValue("v");
  await reverse.fill("/[a&&b]/v");
  await page.locator("#reverse-button").press("Enter");
  await expect(reverse).toHaveAttribute("aria-invalid", "true");
  await expect(rules).toHaveValue('capture "x" {\n"a"\n}');
  await expect(page.locator("#regex-output")).toHaveText("/(?<x>a)/dgimsvy");
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations.map((violation) => violation.id)).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.locator("#example-list button").first().click();
  for (const id of toggles) await expect(page.locator(`#${id}`)).not.toBeChecked();
  await expect(page.locator("#unicode-mode")).toHaveValue("u");
  expect(errors).toEqual([]);
});
