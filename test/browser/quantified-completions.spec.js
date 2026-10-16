import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { draftStorageKey, fixtureStorageKey } from "../../web/fixtures.js";
import { translate } from "../../web/i18n.js";

test.describe.configure({ timeout: 90_000 });

const help =
  "Complete groups and assertions on standalone lines. Groups, captures, alternatives and sets also accept repetition modifiers. Review the whole document and updated references before applying.";

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  return page.locator("#rules-input");
}

test("lazy repeated captures retain original references, exact native spans, fixtures and draft history", async ({
  page,
}) => {
  const editor = await ready(page);
  const original =
    '# kept 😀\nstart\ncapture "context" {\n  digit\n}\ncapture "kept" {\n  "😀"\n}\nsame as capture 2\nend';
  await page.locator("#test-fixtures > summary").click();
  await page.locator("#fixture-file").setInputFiles({
    name: "repeated.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "regex-for-humans-tests",
        version: 1,
        rules: original,
        flags: "dgu",
        mode: "full",
        cases: [
          {
            text: "11😀😀",
            expected: true,
            expect: { spans: [[0, 6]], captures: [["11", "1", "😀"]] },
          },
          { text: "11😀😁", expected: false },
        ],
      }),
    ),
  });
  await expect(page.locator("#fixture-status")).toContainText("Imported 2 examples.");
  await page.locator("#fixture-save").click();
  const saved = await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey);
  const prefix = "lazy between 1 and 3 cap";
  const source = original.replace("  digit", `  ${prefix}`);
  await editor.fill(source);
  await page.locator("#draft-save").check();
  const draft = await page.evaluate((key) => localStorage.getItem(key), draftStorageKey);
  const expectation = await page.locator(".expectation-input").first().inputValue();
  await editor.evaluate(
    (field, caret) => field.setSelectionRange(caret, caret),
    source.indexOf(prefix) + prefix.length,
  );
  await editor.press("Control+Space");
  await page
    .locator("#completion-choice")
    .selectOption({ label: "lazy between 1 and 3 capture {" });
  const proposal = await page.locator("#completion-preview").textContent();
  expect(proposal).toContain("same as capture 3");
  await expect(editor).toHaveValue(source);
  expect(await page.evaluate((key) => localStorage.getItem(key), draftStorageKey)).toBe(draft);
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toHaveValue(proposal);
  expect(
    await editor.evaluate((field) =>
      field.value.slice(field.selectionStart, field.selectionStart + 5),
    ),
  ).toBe("digit");
  await expect(page.locator('.test-row[data-result="pass"]')).toHaveCount(2);
  await expect(page.locator("#global-flag")).toBeChecked();
  await expect(page.locator("#indices-flag")).toBeChecked();
  await expect(page.locator("#match-mode")).toHaveValue("full");
  await expect(page.locator(".expectation-input").first()).toHaveValue(expectation);
  const row = page.locator(".test-row").first();
  await row.locator(".capture-explorer > summary").click();
  await row.locator(".capture-match > summary").click();
  await expect(row.locator(".capture-value")).toHaveText(['"11😀😀"', '"11"', '"1"', '"😀"']);
  await expect(row.locator(".capture-span")).toHaveText(["0–6", "0–2", "1–2", "2–4"]);
  await editor.press("ControlOrMeta+z");
  await expect(editor).toHaveValue(source);
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await editor.press("ControlOrMeta+Shift+z");
  await expect(editor).toHaveValue(proposal);
  await expect(page.locator('.test-row[data-result="pass"]')).toHaveCount(2);
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key))?.rules, draftStorageKey),
    )
    .toBe(proposal);
  expect(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)).toBe(saved);
  await page.reload();
  await expect(editor).toHaveValue(proposal);
  await expect(page.locator('.test-row[data-result="pass"]')).toHaveCount(2);
});

test("native worker matching accepts repeated templates and rejects invalid modifier contexts", async ({
  page,
}) => {
  const editor = await ready(page);
  await page.locator("#unicode-mode").selectOption("v");
  for (const [prefix, label, input] of [
    ["3 gro", "3 group {", "123"],
    ["lazy optional gro", "lazy optional group {", ""],
    ["between 1 and 3 ei", "between 1 and 3 either {", "ABA"],
    ["zero or more cap", "zero or more capture {", ""],
    ["at least 2 character se", "at least 2 character set union {", "AB"],
    [
      "lazy between 1 and 3 not character se",
      "lazy between 1 and 3 not character set subtraction {",
      "A",
    ],
  ]) {
    await editor.fill(prefix);
    await editor.press("Control+Space");
    const choice = page.locator("#completion-choice");
    await expect(
      choice
        .locator("option")
        .filter({ hasText: new RegExp(`^${label.replace("{", "\\{")}$`, "u") }),
    ).toHaveCount(1);
    await choice.selectOption({ label });
    await choice.press("Enter");
    await expect(editor).toHaveAttribute("aria-invalid", "false");
    await expect(editor).toHaveValue(new RegExp(`^${label.replace("{", "\\{")}`, "u"));
    await page.locator("#test-list textarea").first().fill(input);
    await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  }
  await editor.fill("LAZY\tOPTIONAL\tgro");
  await editor.press("Control+Space");
  await expect(page.locator("#completion-choice option")).toHaveCount(1);
  await expect(page.locator("#completion-choice option")).toHaveText("LAZY OPTIONAL group {");
  await page.locator("#completion-choice").selectOption({ index: 0 });
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toHaveValue('LAZY\tOPTIONAL\tgroup {\n  "A"\n}\n');
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  for (const source of [
    "lazy gro",
    "2 optional cap",
    "between 3 and 1 gro",
    "2 followed b",
    "start 2 cap",
  ]) {
    await editor.fill(source);
    await editor.press("Control+Space");
    await expect(page.locator("#completion-choice option")).toHaveCount(0);
    await expect(editor).toHaveValue(source);
  }
});

test("quantified previews and guidance retain four locales, both palettes and 320px keyboard access", async ({
  page,
}, testInfo) => {
  const editor = await ready(page);
  await page.setViewportSize({ width: 320, height: 720 });
  const source =
    'either {\n  lazy between 1 and 3 cap\n  "B"\n}\ncapture "kept" {\n  "A"\n}\nsame as capture 1';
  for (const locale of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(locale);
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      await editor.fill(source);
      await editor.evaluate(
        (field, caret) => field.setSelectionRange(caret, caret),
        source.indexOf('\n  "B"'),
      );
      await editor.press("Control+Space");
      await page
        .locator("#completion-choice")
        .selectOption({ label: "lazy between 1 and 3 capture {" });
      await expect(page.locator("#completion-block-help")).toHaveText(translate(locale, help));
      await expect(page.locator("#completion-preview")).toContainText("same as capture 2");
      await expect(editor).toHaveValue(source);
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
          .screenshot({ path: testInfo.outputPath(`quantified-completions-${theme}-320.png`) });
      await page.locator("#completion-choice").press("Escape");
      await expect(editor).toBeFocused();
      await expect(editor).toHaveValue(source);
    }
  }
});
