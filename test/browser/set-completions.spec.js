import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { draftStorageKey, fixtureStorageKey } from "../../web/fixtures.js";
import { translate } from "../../web/i18n.js";

test.describe.configure({ timeout: 90_000 });

const help =
  "Choose Unicode v for set union, intersection and subtraction templates, including negated forms.";

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  return page.locator("#rules-input");
}

test("nested set completion preserves exact fixtures, Unicode capture spans, drafts and native history", async ({
  page,
}) => {
  const editor = await ready(page);
  const original =
    '# <img src=x onerror="window.injected=1">\nstart\ncapture "kept" {\n  "😀"\n}\ncharacter set intersection {\n  "A"\n  range "A" to "Z"\n}\nsame as capture 1\nend';
  await page.locator("#test-fixtures > summary").click();
  await page.locator("#fixture-file").setInputFiles({
    name: "sets.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "regex-for-humans-tests",
        version: 1,
        rules: original,
        flags: "div",
        mode: "full",
        cases: [
          { text: "😀B😀", expected: true, expect: { spans: [[0, 5]], captures: [["😀"]] } },
          { text: "😀A😀", expected: false },
        ],
      }),
    ),
  });
  await expect(page.locator("#fixture-status")).toContainText("Imported 2 examples.");
  await page.locator("#fixture-save").click();
  const saved = await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey);
  const source = original.replace(
    'character set intersection {\n  "A"',
    "character set intersection {\n  character se",
  );
  await editor.fill(source);
  await page.locator("#draft-save").check();
  const draft = await page.evaluate((key) => localStorage.getItem(key), draftStorageKey);
  const cases = await page
    .locator("#test-list textarea")
    .evaluateAll((fields) => fields.map((f) => f.value));
  const expectation = await page.locator(".expectation-input").first().inputValue();
  await editor.evaluate(
    (field, caret) => field.setSelectionRange(caret, caret),
    source.indexOf("character se\n") + 12,
  );
  await editor.press("Control+Space");
  await page.locator("#completion-choice").selectOption({ label: "character set subtraction {" });
  const proposal = await page.locator("#completion-preview").textContent();
  expect(proposal).toContain('one of: "A", "E", "I", "O", "U"');
  await expect(editor).toHaveValue(source);
  expect(await page.evaluate((key) => localStorage.getItem(key), draftStorageKey)).toBe(draft);
  await expect(page.locator("#completion-preview img")).toHaveCount(0);
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toHaveValue(proposal);
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((f) => f.value.slice(f.selectionStart, f.selectionStart + 16))).toBe(
    'range "A" to "Z"',
  );
  await expect(page.locator('.test-row[data-result="pass"]')).toHaveCount(2);
  await expect(page.locator("#indices-flag")).toBeChecked();
  await expect(page.locator("#ignore-case")).toBeChecked();
  await expect(page.locator("#unicode-mode")).toHaveValue("v");
  expect(
    await page.locator("#test-list textarea").evaluateAll((fields) => fields.map((f) => f.value)),
  ).toEqual(cases);
  expect(await page.locator(".expectation-input").first().inputValue()).toBe(expectation);
  const row = page.locator(".test-row").first();
  await row.locator(".capture-explorer > summary").click();
  await row.locator(".capture-match > summary").click();
  await expect(row.locator(".capture-value")).toHaveText(['"😀B😀"', '"😀"']);
  await expect(row.locator(".capture-span")).toHaveText(["0–5", "0–2"]);
  await editor.press("ControlOrMeta+z");
  await expect(editor).toHaveValue(source);
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await editor.press("ControlOrMeta+Shift+z");
  await expect(editor).toHaveValue(proposal);
  await expect(page.locator('.test-row[data-result="pass"]')).toHaveCount(2);
  await expect
    .poll(async () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key))?.rules, draftStorageKey),
    )
    .toBe(proposal);
  expect(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)).toBe(saved);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await page.reload();
  await expect(editor).toHaveValue(proposal);
  await expect(page.locator('.test-row[data-result="pass"]')).toHaveCount(2);
});

test("all six set templates agree with native match arrays and cursor behavior", async ({
  page,
}) => {
  const editor = await ready(page);
  await page.locator("#unicode-mode").selectOption("v");
  await page.locator("#indices-flag").check();
  await page.locator("#ignore-case").check();
  for (const [text, pattern, input] of [
    ["character set union {", "[AB]", "A"],
    ["not character set union {", "[^AB]", "😀"],
    ["character set intersection {", "[[A-Z]&&[AEIOU]]", "A"],
    ["not character set intersection {", "[^[[A-Z]&&[AEIOU]]]", "B"],
    ["character set subtraction {", "[[A-Z]--[AEIOU]]", "B"],
    ["not character set subtraction {", "[^[[A-Z]--[AEIOU]]]", "A"],
  ]) {
    const source = `capture "picked" {\n  ${text.slice(0, -2)}\n}`;
    await editor.fill(source);
    await editor.evaluate((f) =>
      f.setSelectionRange(f.value.indexOf("\n}"), f.value.indexOf("\n}")),
    );
    await editor.press("Control+Space");
    await page.locator("#completion-choice").selectOption({ label: text });
    await page.locator("#completion-choice").press("Enter");
    await page.locator("#test-list textarea").first().fill(input);
    await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
    const literal = await page.locator("#regex-output").textContent();
    expect(
      await page.evaluate(
        ({ literal, pattern }) => {
          const source = literal.slice(1, literal.lastIndexOf("/"));
          const project = (m) =>
            m && {
              values: [...m],
              index: m.index,
              groups: m.groups,
              indices: m.indices,
              namedIndices: m.indices?.groups,
            };
          let comparisons = 0;
          for (const flags of ["v", "dv", "div", "dgv", "dvy", "dgimsvy"]) {
            const actual = new RegExp(source, flags);
            const native = new RegExp(`(?<picked>${pattern})`, flags);
            for (const input of [
              "",
              "A",
              "B",
              "C",
              "E",
              "a",
              "b",
              "K",
              "😀",
              "😀A",
              "\n",
              "\ud800",
            ])
              for (const cursor of [0, 1, 2]) {
                actual.lastIndex = cursor;
                native.lastIndex = cursor;
                for (let step = 0; step < 2; step++) {
                  if (
                    JSON.stringify(project(actual.exec(input))) !==
                      JSON.stringify(project(native.exec(input))) ||
                    actual.lastIndex !== native.lastIndex
                  )
                    throw new Error(
                      `Native set mismatch: ${pattern}/${flags} ${JSON.stringify(input)} at ${cursor}`,
                    );
                  comparisons++;
                }
              }
          }
          return comparisons;
        },
        { literal, pattern },
      ),
    ).toBe(432);
  }
});

test("set mode guidance and previews remain accessible in four locales and both palettes at 320px", async ({
  page,
}, testInfo) => {
  const editor = await ready(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await editor.fill("character se");
  await page.locator("#complete-rule").click();
  await expect(page.locator("#completion-choice option")).toHaveCount(0);
  await expect(editor).toHaveValue("character se");
  await page.locator("#unicode-mode").selectOption("v");
  for (const locale of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(locale);
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      await editor.fill("not character se");
      await page.locator("#complete-rule").click();
      await page
        .locator("#completion-choice")
        .selectOption({ label: "not character set intersection {" });
      await expect(page.locator("#completion-set-help")).toHaveText(translate(locale, help));
      await expect(page.locator("#completion-choice")).toHaveAttribute(
        "aria-describedby",
        /completion-set-help/u,
      );
      const proposal = await page.locator("#completion-preview").textContent();
      expect(proposal).toContain('range "A" to "Z"');
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      );
      expect(
        (
          await new AxeBuilder({ page })
            .include("#rule-completions")
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      if (locale === "fr")
        await page
          .locator("#rule-completions")
          .screenshot({ path: testInfo.outputPath(`set-completions-${theme}-320.png`) });
      await page.locator("#completion-choice").press("Escape");
      await expect(editor).toHaveValue("not character se");
      await expect(editor).toBeFocused();
    }
  }
});
