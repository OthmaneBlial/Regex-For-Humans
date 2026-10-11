import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { LIMITS } from "../../src/parser.js";

const original =
  'start\ncapture "word" {\n  letter\n}\nsame as capture "word"\nsame as capture 1\nend';

async function ready(page, rules = original) {
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  await page.locator("#rules-input").fill(rules);
  await page.locator("#group-editor > summary").press("Enter");
}

test("group previews show source and regex references before applying, without changing tests or saved drafts", async ({
  page,
}) => {
  await ready(page);
  const editor = page.locator("#rules-input");
  await page.getByLabel("Example 1 string", { exact: true }).fill("AAA");
  const row = page.locator(".test-row").first();
  await expect(row).toHaveAttribute("data-result", "pass");
  await page.locator("#test-fixtures > summary").click();
  await page.locator("#draft-save").check();
  await expect(page.locator("#draft-status")).toContainText("Draft saved");
  const saved = await page.evaluate(() => localStorage.getItem("regex-for-humans:draft.v1"));
  const regex = await page.locator("#regex-output").textContent();
  await page.locator("#group-name").fill("renamed");
  const renamed = original.replaceAll('"word"', '"renamed"');
  await page.locator("#group-preview-button").press("Enter");
  await expect(page.locator("#group-preview-button")).toBeFocused();
  await expect(page.locator("#group-preview-button")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#group-before-rules")).toHaveText(original);
  await expect(page.locator("#group-after-rules")).toHaveText(renamed);
  await expect(page.locator("#group-before-regex")).toHaveText(regex);
  await expect(page.locator("#group-after-regex")).toHaveText(regex.replaceAll("word", "renamed"));
  await expect(page.locator("#group-before-rules del")).toHaveText(["wor", "wor"]);
  await expect(page.locator("#group-after-rules ins")).toHaveText(["rename", "rename"]);
  await expect(editor).toHaveValue(original);
  await expect(page.locator("#regex-output")).toHaveText(regex);
  await expect(row).toHaveAttribute("data-result", "pass");
  expect(await page.evaluate(() => localStorage.getItem("regex-for-humans:draft.v1"))).toBe(saved);
  const download = page.waitForEvent("download");
  await page.locator("#fixture-export").click();
  const file = await download;
  const stream = await file.createReadStream();
  let json = "";
  for await (const part of stream) json += part;
  expect(JSON.parse(json).rules).toBe(original);
  await page.locator("#group-apply").click();
  await expect(editor).toHaveValue(renamed);
  await expect(page.locator("#group-preview")).toBeHidden();
  await expect(page.locator("#group-feedback")).toContainText("Group updated");
  await expect(row).toHaveAttribute("data-result", "pass");
});

test("capture conversions preview renumbered references and preserve their targets on apply", async ({
  page,
}) => {
  const rules =
    'start\ngroup {\n  "X"\n  capture {\n    digit\n  }\n}\ncapture {\n  "B"\n}\nsame as capture 2\nend';
  await ready(page, rules);
  await page.getByLabel("Example 1 string", { exact: true }).fill("X1BB");
  await page.locator("#group-type").selectOption("named");
  await page.locator("#group-name").fill("outer");
  await page.locator("#group-preview-button").click();
  const after = rules
    .replace("group {", 'capture "outer" {')
    .replace("same as capture 2", "same as capture 3");
  await expect(page.locator("#group-after-rules")).toHaveText(after);
  await expect(page.locator("#group-after-regex")).toContainText("(?<outer>");
  await expect(page.locator("#group-after-regex")).toContainText(String.raw`\3`);
  await expect(page.locator("#rules-input")).toHaveValue(rules);
  await page.locator("#group-apply").click();
  await expect(page.locator("#regex-output")).toContainText(String.raw`\3`);
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  await page.locator("#group-type").selectOption("none");
  await page.locator("#group-preview-button").click();
  await expect(page.locator("#group-after-rules")).toHaveText(rules);
  await page.locator("#group-preview-close").press("Enter");
  await expect(page.locator("#group-preview-button")).toBeFocused();
  await expect(page.locator("#group-preview")).toBeHidden();
  await expect(page.locator("#rules-input")).toHaveValue(after);
});

test("previews reject destructive, invalid, duplicate and over-budget edits without leaving stale output", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#group-preview-button").click();
  await expect(page.locator("#group-feedback")).toHaveText("No group changes to preview.");
  await expect(page.locator("#group-preview")).toBeHidden();
  await page.locator("#group-name").fill("fresh");
  await page.locator("#group-preview-button").click();
  await expect(page.locator("#group-preview")).toBeVisible();
  await page.locator("#group-type").selectOption("none");
  await page.locator("#group-preview-button").click();
  await expect(page.locator("#group-feedback")).toContainText("reference targets it");
  await expect(page.locator("#group-preview")).toBeHidden();
  await expect(page.locator("#group-after-rules")).toBeEmpty();
  await page.locator("#group-type").selectOption("named");
  await page.locator("#group-name").fill("bad-name");
  await page.locator("#group-preview-button").click();
  await expect(page.locator("#group-name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#rules-input")).toHaveValue(original);
  const duplicate = original.replace("start\n", 'start\ncapture "other" {\n"B"\n}\n');
  await page.locator("#rules-input").fill(duplicate);
  await page.locator("#group-select").selectOption("5:1");
  await page.locator("#group-name").fill("other");
  await page.locator("#group-preview-button").click();
  await expect(page.locator("#group-name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#rules-input")).toHaveValue(duplicate);
  const header = 'capture "x" {\n"';
  const tail = '"\n}';
  const bounded = header + "A".repeat(LIMITS.sourceLength - header.length - tail.length) + tail;
  await page.locator("#rules-input").fill(bounded);
  await expect(page.locator("#compile-state")).toHaveText("Compiled");
  await page.locator("#group-name").fill("longer");
  await page.locator("#group-preview-button").click();
  await expect(page.locator("#group-feedback")).toContainText("Original rules unchanged");
  await expect(page.locator("#group-preview")).toBeHidden();
  await expect(page.locator("#rules-input")).toHaveValue(bounded);
});

test("changing source, flags or group fields invalidates a preview and apply always uses current inputs", async ({
  page,
}) => {
  await ready(page);
  const preview = page.locator("#group-preview");
  const button = page.locator("#group-preview-button");
  await page.locator("#group-name").fill("first");
  await button.click();
  await expect(preview).toBeVisible();
  await page.locator("#group-name").fill("second");
  await expect(preview).toBeHidden();
  await button.click();
  await page.locator("#ignore-case").check();
  await expect(preview).toBeHidden();
  await expect(page.locator("#group-name")).toHaveValue("second");
  await button.click();
  await expect(page.locator("#group-after-regex")).toContainText("/iu");
  await page.locator("#unicode-mode").selectOption("v");
  await expect(preview).toBeHidden();
  await button.click();
  await expect(page.locator("#group-after-regex")).toContainText("/iv");
  await page.locator("#rules-input").fill(original.replace("letter", "digit"));
  await expect(preview).toBeHidden();
  await button.click();
  await page.locator("#group-type").selectOption("numbered");
  await expect(preview).toBeHidden();
  await button.click();
  await expect(page.locator("#group-after-regex")).not.toContainText("?<");
  await page.locator("#group-apply").click();
  await expect(page.locator("#rules-input")).toHaveValue(
    original
      .replace('capture "word"', "capture")
      .replace('same as capture "word"', "same as capture 1")
      .replace("letter", "digit"),
  );
  await expect(preview).toBeHidden();
  await page.locator("#rules-input").fill("bad rule");
  await expect(button).toBeDisabled();
  await expect(preview).toBeHidden();
});

test("preview text exposes controls, keeps astral names intact and never parses user HTML", async ({
  page,
}) => {
  const rules =
    '# <img src=x onerror="alert(1)">\u202e\nstart\ncapture "𐐀" {\n"😀"\n}\nsame as capture "𐐀"\nend';
  await ready(page, rules);
  await page.locator("#group-name").fill("𐐁");
  await page.locator("#group-preview-button").click();
  const visible = rules.replace("\u202e", String.raw`\u202e`);
  await expect(page.locator("#group-before-rules")).toHaveText(visible);
  await expect(page.locator("#group-after-rules")).toHaveText(visible.replaceAll("𐐀", "𐐁"));
  await expect(page.locator("#group-before-rules del")).toHaveText(["𐐀", "𐐀"]);
  await expect(page.locator("#group-preview img")).toHaveCount(0);
  await expect(page.locator("#rules-input")).toHaveValue(rules);
});

test("selecting another group or replacing the workspace clears temporary comparisons", async ({
  page,
}) => {
  const twoGroups =
    'start\ncapture "word" {\nletter\n}\ncapture "extra" {\ndigit\n}\nsame as capture "word"\nend';
  await ready(page, twoGroups);
  const preview = page.locator("#group-preview");
  const show = async () => {
    await page.locator("#group-name").fill("changed");
    await page.locator("#group-preview-button").click();
    await expect(preview).toBeVisible();
  };
  await show();
  await page.locator("#group-select").selectOption("5:1");
  await expect(preview).toBeHidden();
  await show();
  await page.locator("#reverse-translator > summary").click();
  await page.locator("#reverse-regex").fill("/^(?<imported>A)$/u");
  await page.locator("#reverse-regex").press("Control+Enter");
  await expect(preview).toBeHidden();
  await expect(page.locator("#regex-output")).toHaveText("/^(?<imported>A)$/u");
  await show();
  await page.locator("#fixture-file").setInputFiles({
    name: "suite.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "regex-for-humans-tests",
        version: 1,
        rules: original,
        flags: "u",
        mode: "full",
        cases: [{ text: "AAA", expected: true }],
      }),
    ),
  });
  await expect(page.locator("#rules-input")).toHaveValue(original);
  await expect(preview).toBeHidden();
  await show();
  await page.locator("#rule-builder > summary").click();
  await page.locator("#builder-kind").selectOption("optional");
  await page.locator("#builder-insert").click();
  await expect(page.locator("#builder-feedback")).toHaveAttribute("data-state", "success");
  await expect(preview).toBeHidden();
  await show();
  await page.locator("#example-list button").first().click();
  await expect(preview).toBeHidden();
  await expect(page.locator("#group-after-rules")).toBeEmpty();
  await page.locator("#rules-input").fill(original);
  await show();
  await page.reload();
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  await expect(preview).toBeHidden();
});

test("previews remain readable at 320px in both themes with localized labels and keyboard navigation", async ({
  page,
}, testInfo) => {
  await ready(page, original.replace("letter", `"${"A".repeat(1500)}"`));
  await page.locator("#group-name").fill("renamed");
  await page.locator("#group-preview-button").press("Enter");
  await page.setViewportSize({ width: 320, height: 800 });
  for (const theme of ["light", "dark"]) {
    await page.locator("#interface-theme").selectOption(theme);
    for (const [locale, label] of [
      ["en", "Preview group edit"],
      ["zh-CN", "预览分组修改"],
      ["es", "Vista previa del cambio"],
      ["fr", "Aperçu de la modification"],
    ]) {
      await page.locator("#interface-language").selectOption(locale);
      await expect(page.locator("#group-preview-button")).toHaveText(label);
      await expect(page.locator("#group-preview")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await page
          .locator("#group-after-rules")
          .evaluate((node) => node.parentElement.scrollWidth <= node.parentElement.clientWidth + 1),
      ).toBe(true);
    }
    const audit = await new AxeBuilder({ page })
      .include("#group-editor")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  }
  await page
    .locator("#group-preview")
    .screenshot({ path: `artifacts/group-preview-${testInfo.project.name}-fr-320-dark.png` });
  await page.locator("#group-preview-close").press("Enter");
  await expect(page.locator("#group-preview-button")).toBeFocused();
});
