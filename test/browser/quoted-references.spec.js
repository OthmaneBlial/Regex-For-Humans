import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { draftStorageKey, fixtureStorageKey } from "../../web/fixtures.js";
import { translate } from "../../web/i18n.js";

test.describe.configure({ timeout: 90_000 });
const help =
  "Complete built-in classes or references to earlier closed captures. Named references also complete inside quotes; counts stay in place. Suggestions use English syntax and must compile with the whole document. Ctrl + Space opens the list; Enter applies; Escape closes.";

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  return page.locator("#rules-input");
}

async function cursor(editor, position) {
  await editor.evaluate((field, caret) => field.setSelectionRange(caret, caret), position);
  await editor.press("Control+Space");
}

test("escaped quoted references retain native Unicode spans, counts, other targets, fixtures and history", async ({
  page,
}) => {
  const editor = await ready(page);
  const name = "𝔘nicode";
  const command = "LAZY\tbetween 1 and 2\tSAME AS CAPTURE\t";
  const original = `# <img src=x onerror="window.injected=1">\nstart\ncapture "${name}" {\n "😀"\n}\n${command}"${name}"\nsame as capture 1\nend`;
  await page.locator("#test-fixtures > summary").click();
  await page.locator("#fixture-file").setInputFiles({
    name: "names.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "regex-for-humans-tests",
        version: 1,
        rules: original,
        flags: "dgu",
        mode: "search",
        cases: [
          { text: "😀😀😀😀", expected: true, expect: { spans: [[0, 8]], captures: [["😀"]] } },
          { text: "😀😀😀😃", expected: false },
        ],
      }),
    ),
  });
  await expect(page.locator("#fixture-status")).toContainText("Imported 2 examples.");
  await page.locator("#fixture-save").click();
  const saved = await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey);
  const raw = "\\uD835\\uDD";
  const source = original.replace(`${command}"${name}"`, `${command}"${raw}"`);
  await editor.fill(source);
  await page.locator("#draft-save").check();
  const draft = await page.evaluate((key) => localStorage.getItem(key), draftStorageKey);
  const expectation = await page.locator(".expectation-input").first().inputValue();
  const quote = source.indexOf(command) + command.length;
  await cursor(editor, quote + 1 + raw.length);
  await page.locator("#completion-choice").selectOption({ label: `same as capture "${name}"` });
  await expect(page.locator("#completion-preview")).toHaveText(original);
  await expect(page.locator("#completion-preview img")).toHaveCount(0);
  await expect(editor).toHaveValue(source);
  expect(await page.evaluate((key) => localStorage.getItem(key), draftStorageKey)).toBe(draft);
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toHaveValue(original);
  expect(await editor.evaluate((field) => field.selectionStart)).toBe(quote + name.length + 2);
  await expect(page.locator('.test-row[data-result="pass"]')).toHaveCount(2);
  await expect(page.locator("#global-flag")).toBeChecked();
  await expect(page.locator("#indices-flag")).toBeChecked();
  await expect(page.locator("#match-mode")).toHaveValue("search");
  await expect(page.locator(".expectation-input").first()).toHaveValue(expectation);
  const row = page.locator(".test-row").first();
  await row.locator(".capture-explorer > summary").click();
  await row.locator(".capture-match > summary").click();
  await expect(row.locator(".capture-value")).toHaveText(['"😀😀😀😀"', '"😀"']);
  await expect(row.locator(".capture-span")).toHaveText(["0–8", "0–2"]);
  await editor.press("ControlOrMeta+z");
  await expect(editor).toHaveValue(source);
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await editor.press("ControlOrMeta+Shift+z");
  await expect(editor).toHaveValue(original);
  await expect(page.locator('.test-row[data-result="pass"]')).toHaveCount(2);
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key))?.rules, draftStorageKey),
    )
    .toBe(original);
  expect(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)).toBe(saved);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await page.reload();
  await expect(editor).toHaveValue(original);
  await expect(page.locator('.test-row[data-result="pass"]')).toHaveCount(2);
});

test("quoted names retain case, following rules, literal boundaries, cursor and composition guards", async ({
  page,
}) => {
  const editor = await ready(page);
  await page.locator("#ignore-case").check();
  const definitions = 'capture "field" {\n "A"\n}\ncapture "Field" {\n "B"\n}\n';
  for (const [raw, name, input] of [
    ["f", "field", "ABA"],
    ["F", "Field", "ABB"],
  ]) {
    const source = `${definitions}same as capture "${raw}"`;
    await editor.fill(source);
    await cursor(editor, source.length - 1);
    await expect(page.locator("#completion-choice option")).toHaveCount(1);
    await page.locator("#completion-choice").press("Enter");
    await expect(editor).toHaveValue(`${definitions}same as capture "${name}"`);
    await page.locator("#test-list textarea").first().fill(input);
    await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  }
  const open = `${definitions}same as capture "field\n"Z"`;
  await editor.fill(open);
  await cursor(editor, open.lastIndexOf('"field') + 3);
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toHaveValue(`${definitions}same as capture "field"\n"Z"`);
  for (const tail of [
    'capture "f" {\n digit\n}',
    '"f"',
    'unicode property "f"',
    'same as capture "f""unrelated"',
    '# same as capture "f"',
    'same as capture "field"',
  ]) {
    const source = definitions + tail;
    await editor.fill(source);
    const quote = source.lastIndexOf('"f');
    await cursor(editor, tail.endsWith('"field"') ? source.length - 1 : quote + 2);
    await expect(page.locator("#completion-choice option")).toHaveCount(0);
    await expect(editor).toHaveValue(source);
  }
  const partial = `${definitions}same as capture "f"`;
  await editor.fill(partial);
  await cursor(editor, partial.length - 1);
  await editor.evaluate((field) => field.setSelectionRange(0, 0));
  await page.locator("#completion-apply").click();
  await expect(editor).toHaveValue(partial);
  await editor.evaluate(
    (field, caret) => field.setSelectionRange(caret - 1, caret),
    partial.length - 1,
  );
  await editor.press("Control+Space");
  await expect(page.locator("#completion-choice option")).toHaveCount(0);
  await editor.evaluate((field) =>
    field.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true })),
  );
  await editor.evaluate(
    (field, caret) => field.setSelectionRange(caret, caret),
    partial.length - 1,
  );
  await editor.press("Control+Space");
  await expect(page.locator("#completion-choice option")).toHaveCount(0);
  await editor.evaluate((field) =>
    field.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true })),
  );
});

test("quoted previews retain four languages, both palettes and accessible 320px keyboard controls", async ({
  page,
}, testInfo) => {
  const editor = await ready(page);
  await page.setViewportSize({ width: 320, height: 720 });
  const name = "first_closed_capture_with_a_long_name";
  const source = `capture "outer" {\n capture "${name}" {\n  "😀"\n }\n same as capture "fir"\n}`;
  for (const locale of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(locale);
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      await editor.fill(source);
      await cursor(editor, source.lastIndexOf('"fir') + 4);
      await page.locator("#completion-choice").selectOption({ label: `same as capture "${name}"` });
      await expect(page.locator("#completion-help")).toHaveText(translate(locale, help));
      await expect(page.locator("#completion-preview-field > span")).toHaveText(
        translate(locale, "Proposed rules:"),
      );
      await expect(page.locator("#completion-preview")).toContainText(`same as capture "${name}"`);
      await expect(editor).toHaveValue(source);
      expect(
        await page
          .locator("#completion-preview")
          .evaluate((node) => node.scrollWidth > node.clientWidth),
      ).toBe(false);
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
          .screenshot({ path: testInfo.outputPath(`quoted-references-${theme}-320.png`) });
      await page.locator("#completion-choice").press("Escape");
      await expect(editor).toHaveValue(source);
      await expect(editor).toBeFocused();
    }
  }
});
