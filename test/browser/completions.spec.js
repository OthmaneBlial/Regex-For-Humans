import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { draftStorageKey } from "../../web/fixtures.js";
import { translate } from "../../web/i18n.js";

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  return page.locator("#rules-input");
}

test("balanced capture proposals preview reference remapping and preserve fixtures and saved drafts", async ({
  page,
}) => {
  const editor = await ready(page);
  const original =
    '# <img src=x onerror="window.injected=1">\nstart\ncapture "original" {\n  "A"\n}\nsame as capture 1\nsame as capture "original"\nend';
  const expectation = { spans: [[0, 4]], captures: [["1", "A"]] };
  await page.locator("#test-fixtures > summary").click();
  await page.locator("#fixture-file").setInputFiles({
    name: "block.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "regex-for-humans-tests",
        version: 1,
        rules: original,
        flags: "du",
        mode: "full",
        cases: [{ text: "1AAA", expected: true, expect: expectation }],
      }),
    ),
  });
  await expect(page.locator("#fixture-status")).toContainText("Imported 1 examples.");
  const source = original.replace("start\n", "start\ncap\n");
  await editor.fill(source);
  await page.locator("#draft-save").check();
  await expect
    .poll(
      async () =>
        JSON.parse(await page.evaluate((key) => localStorage.getItem(key), draftStorageKey))?.rules,
    )
    .toBe(source);
  const draft = await page.evaluate((key) => localStorage.getItem(key), draftStorageKey);
  const details = await page.locator(".expectation-input").inputValue();
  await editor.evaluate((el, at) => el.setSelectionRange(at, at), source.indexOf("\ncap\n") + 4);
  await editor.press("Control+Space");
  await page.locator("#completion-choice").selectOption({ label: "capture {" });
  await expect(page.locator("#completion-preview-field > span")).toHaveText("Proposed rules:");
  await expect(page.locator("#completion-preview")).toContainText("same as capture 2");
  await expect(editor).toHaveValue(source);
  expect(await page.evaluate((key) => localStorage.getItem(key), draftStorageKey)).toBe(draft);
  expect(await page.locator(".expectation-input").inputValue()).toBe(details);
  expect(await page.locator("#completion-preview img").count()).toBe(0);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  const proposal = await page.locator("#completion-preview").textContent();
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toHaveValue(proposal);
  expect(
    await editor.evaluate((el) => el.value.slice(el.selectionStart, el.selectionStart + 5)),
  ).toBe("digit");
  await expect(page.locator("#indices-flag")).toBeChecked();
  await expect(page.locator("#unicode-mode")).toHaveValue("u");
  expect(await page.locator(".expectation-input").inputValue()).toBe(details);
  await expect(page.locator(".test-row")).toHaveAttribute("data-result", "pass");
  await page.locator(".capture-explorer > summary").click();
  await page.locator(".capture-match summary").click();
  await expect(page.locator(".capture-value")).toHaveText(['"1AAA"', '"1"', '"A"']);
  await expect
    .poll(
      async () =>
        JSON.parse(await page.evaluate((key) => localStorage.getItem(key), draftStorageKey))?.rules,
    )
    .toBe(proposal);
  await page.reload();
  await expect(editor).toHaveValue(proposal);
  await expect(page.locator(".test-row")).toHaveAttribute("data-result", "pass");
});

test("balanced assertion and group previews keep four locales, both themes and 320px keyboard access", async ({
  page,
}, testInfo) => {
  const editor = await ready(page);
  await page.setViewportSize({ width: 320, height: 720 });
  for (const locale of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(locale);
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      await editor.fill("not pre");
      await page.locator("#complete-rule").click();
      await page.locator("#completion-choice").selectOption({ label: "not preceded by {" });
      await expect(page.locator("#completion-preview-field > span")).toHaveText(
        translate(locale, "Proposed rules:"),
      );
      const proposal = await page.locator("#completion-preview").textContent();
      expect(proposal).toContain("not preceded by {\n  digit\n}");
      expect(
        await page.locator("#completion-preview").evaluate((el) => el.scrollWidth > el.clientWidth),
      ).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      );
      const audit = await new AxeBuilder({ page })
        .include("#rule-completions")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(audit.violations).toEqual([]);
      if (locale === "fr")
        await page.locator("#rule-completions").screenshot({
          path: testInfo.outputPath(`block-completions-${theme}-320.png`),
        });
      await page.locator("#completion-choice").press("Enter");
      await expect(editor).toHaveValue(proposal);
      await expect(editor).toBeFocused();
      await editor.fill("gro");
      await page.locator("#complete-rule").click();
      await expect(page.locator("#completion-choice option")).toHaveText(["group {"]);
      await page.locator("#completion-choice").press("Escape");
      await expect(editor).toHaveValue("gro");
    }
  }
});

test("keyboard completion preserves flags, examples and capture references with native results", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const editor = await ready(page);
  await page.locator("#indices-flag").check();
  await page.locator("#ignore-case").check();
  await page.locator("#unicode-mode").selectOption("v");
  const source = 'start\ncapture "item" {\n  digit\n}\nbetween 2 and 5 di\nsame as capture 1\nend';
  await editor.fill(source);
  const caret = source.indexOf("\nsame as");
  await editor.evaluate((el, at) => el.setSelectionRange(at, at), caret);
  const examples = await page
    .locator("#test-list textarea")
    .evaluateAll((fields) => fields.map((el) => el.value));
  await editor.press("Control+Space");
  await expect(page.locator("#completion-choice")).toBeFocused();
  await expect(editor).toHaveValue(source);
  await page.locator("#completion-choice").selectOption({ label: "digits" });
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue(source.replace("5 di\n", "5 digits\n"));
  await expect(page.locator("#regex-output")).toHaveText("/^(?<item>\\d)\\d{2,5}(?:\\1)$/div");
  await expect(page.locator("#rule-completions")).toBeHidden();
  expect(
    await page.locator("#test-list textarea").evaluateAll((fields) => fields.map((el) => el.value)),
  ).toEqual(examples);
  await expect(page.locator("#indices-flag")).toBeChecked();
  await expect(page.locator("#ignore-case")).toBeChecked();
  await expect(page.locator("#unicode-mode")).toHaveValue("v");
  expect(await page.locator("#rules-syntax .syntax-source").textContent()).toBe(
    await editor.inputValue(),
  );
  await page.locator("#test-list textarea").first().fill("1121");
  const row = page.locator(".test-row").first();
  await expect(row).toHaveAttribute("data-result", "pass");
  await row.locator(".capture-explorer > summary").click();
  await row.locator(".capture-match summary").click();
  await expect(row.locator(".capture-value")).toHaveText(['"1121"', '"1"']);
  expect(errors).toEqual([]);
});

test("selected text, quotes, comments, other errors and stale suggestions never overwrite work", async ({
  page,
}) => {
  const editor = await ready(page);
  for (const [source, start, end] of [
    ["start\ndi\nend", 6, 8],
    ['start\n"digits"\nend', 9, 9],
    ['# <img onerror="window.injected=1"> digits', 36, 36],
    ["start\nunknown\ndi\nend", 16, 16],
  ]) {
    await editor.fill(source);
    await editor.evaluate((el, range) => el.setSelectionRange(...range), [start, end]);
    await page.locator("#complete-rule").click();
    await expect(page.locator("#completion-apply")).toBeDisabled();
    await expect(page.locator("#completion-choice")).toBeHidden();
    await expect(page.locator("#completion-status")).toContainText("No validated suggestions.");
    await page.locator("#completion-close").click();
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue(source);
    expect(await editor.evaluate((el) => [el.selectionStart, el.selectionEnd])).toEqual([
      start,
      end,
    ]);
  }
  await editor.fill("di");
  await editor.evaluate((el) => el.setSelectionRange(2, 2));
  await page.locator("#complete-rule").click();
  await editor.evaluate((el) => {
    el.value = "manual work";
  });
  await page.locator("#completion-apply").click();
  await expect(editor).toHaveValue("manual work");
  await expect(page.locator("#rule-completions")).toBeHidden();
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
});

test("closed capture references preview without editing, then retain native values, spans, flags and drafts", async ({
  page,
}) => {
  const editor = await ready(page);
  await page.locator("#indices-flag").check();
  await page.locator("#unicode-mode").selectOption("v");
  const name = "utilisateur_字_𐐀_avec_un_nom_long";
  const source = `start\noptional capture "${name}" {\n  "A"\n}\n"X"\nsame as ca\nend`;
  const reference = `same as capture "${name}"`;
  await editor.fill(source);
  await page.locator("#test-fixtures > summary").click();
  await page.locator("#draft-save").check();
  await expect(page.locator("#draft-status")).toHaveText("Draft saved in this browser.");
  const snapshot = await page.evaluate((key) => localStorage.getItem(key), draftStorageKey);
  expect(snapshot).not.toBeNull();
  const examples = await page
    .locator("#test-list textarea")
    .evaluateAll((fields) => fields.map((el) => el.value));
  await editor.evaluate((el) =>
    el.setSelectionRange(el.value.indexOf("\nend"), el.value.indexOf("\nend")),
  );
  await editor.press("Control+Space");
  await expect(page.locator("#completion-choice option")).toHaveText([
    "same as capture 1",
    reference,
  ]);
  await expect(page.locator("#completion-preview")).toHaveText("same as capture 1");
  await page.locator("#completion-choice").selectOption({ label: reference });
  await expect(page.locator("#completion-preview")).toHaveText(reference);
  await expect(editor).toHaveValue(source);
  expect(await page.evaluate((key) => localStorage.getItem(key), draftStorageKey)).toBe(snapshot);
  expect(
    await page.locator("#test-list textarea").evaluateAll((fields) => fields.map((el) => el.value)),
  ).toEqual(examples);
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue(source.replace("same as ca", reference));
  await expect(page.locator("#indices-flag")).toBeChecked();
  await expect(page.locator("#unicode-mode")).toHaveValue("v");
  await page.locator("#test-list textarea").first().fill("AXA");
  const row = page.locator(".test-row").first();
  await expect(row).toHaveAttribute("data-result", "pass");
  await row.locator(".capture-explorer > summary").click();
  await row.locator(".capture-match summary").click();
  await expect(row.locator(".capture-value")).toHaveText(['"AXA"', '"A"']);
  const native = await page.evaluate(
    ({ literal, name }) => {
      const slash = literal.lastIndexOf("/");
      const regex = new RegExp(literal.slice(1, slash), literal.slice(slash + 1));
      const absent = regex.exec("X");
      const present = regex.exec("AXA");
      return {
        absentMatch: absent?.[0],
        absent: absent?.[1] === undefined,
        value: present?.groups[name],
        span: present?.indices.groups[name],
      };
    },
    { literal: await page.locator("#regex-output").textContent(), name },
  );
  expect(native).toEqual({ absentMatch: "X", absent: true, value: "A", span: [0, 1] });
  await expect(page.locator("#draft-status")).toHaveText("Draft saved in this browser.");
  await page.reload();
  await expect(editor).toHaveValue(source.replace("same as ca", reference));
});

test("open and forward captures are excluded while a multi-digit target reports one suggestion", async ({
  page,
}) => {
  const editor = await ready(page);
  for (const source of [
    'capture "open" {\n  same as ca\n}',
    'same as ca\ncapture "future" {\n  digit\n}',
  ]) {
    await editor.fill(source);
    const caret = source.indexOf("same as ca") + "same as ca".length;
    await editor.evaluate((el, at) => el.setSelectionRange(at, at), caret);
    await page.locator("#complete-rule").click();
    await expect(page.locator("#completion-apply")).toBeDisabled();
    await expect(page.locator("#completion-preview-field")).toBeHidden();
    await page.locator("#completion-close").click();
    await expect(editor).toHaveValue(source);
  }
  const source = `${[..."ABCDEFGHIJ"].map((letter) => `capture {\n  "${letter}"\n}`).join("\n")}\nsame as capture 1`;
  await editor.fill(source);
  await page.locator("#complete-rule").click();
  await expect(page.locator("#completion-choice option")).toHaveText(["same as capture 10"]);
  await expect(page.locator("#completion-status")).toHaveText("1 validated suggestion.");
  await expect(page.locator("#completion-preview")).toHaveText("same as capture 10");
  await page.locator("#completion-apply").click();
  await expect(editor).toHaveValue(source.replace("capture 1", "capture 10"));
});

test("native typing, Tab, IME and Escape retain their editor behavior", async ({
  page,
  browserName,
}) => {
  const editor = await ready(page);
  await editor.fill("di");
  await editor.press("Enter");
  await expect(editor).toHaveValue("di\n");
  await expect(page.locator("#rule-completions")).toBeHidden();
  await editor.press("Tab");
  await expect(
    browserName === "webkit"
      ? page.locator("#unicode-mode")
      : page.getByRole("link", { name: /Read the syntax/ }),
  ).toBeFocused();
  await expect(editor).toHaveValue("di\n");
  await editor.fill("di");
  await editor.dispatchEvent("compositionstart");
  await editor.press("Control+Space");
  await expect(page.locator("#rule-completions")).toBeHidden();
  await editor.dispatchEvent("compositionend");
  await editor.press("Control+Space");
  await page.locator("#completion-choice").press("Escape");
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue("di");
  await editor.press("Control+Space");
  await page.locator("#completion-choice").press("ArrowDown");
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toHaveValue("digits");
  await expect(page.locator("#regex-output")).toHaveText("/\\d+/u");
});

test("suggestions translate in four interfaces and fit both themes at 320px", async ({
  page,
}, testInfo) => {
  const editor = await ready(page);
  await page.setViewportSize({ width: 320, height: 740 });
  for (const locale of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(locale);
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      await editor.fill("between 2 and 5 pa");
      await editor.evaluate((el) => el.setSelectionRange(el.value.length, el.value.length));
      await expect(page.locator("#complete-rule")).toHaveText(translate(locale, "Complete a rule"));
      await page.locator("#complete-rule").click();
      await expect(page.locator("#completion-label")).toHaveText(
        translate(locale, "Rule suggestions"),
      );
      await expect(page.locator("#completion-choice option")).toHaveText([
        "path segment character",
        "path segment characters",
      ]);
      await expect(page.locator("#completion-preview")).toHaveText("path segment character");
      await page.locator("#completion-choice").selectOption({ label: "path segment characters" });
      await expect(page.locator("#completion-preview")).toHaveText("path segment characters");
      await page.locator("#completion-apply").click();
      await expect(editor).toHaveValue("between 2 and 5 path segment characters");
      const name = "capture_字_avec_un_nom_assez_long_pour_le_mobile";
      const source = `capture "${name}" {\n  letter\n}\nsame as ca`;
      const reference = `same as capture "${name}"`;
      await editor.fill(source);
      await page.locator("#complete-rule").click();
      await page.locator("#completion-choice").selectOption({ label: reference });
      await expect(page.locator("#completion-preview-field > span")).toHaveText(
        translate(locale, "Suggested rule:"),
      );
      await expect(page.locator("#completion-preview")).toHaveText(reference);
      expect(
        await page.locator("#completion-preview").evaluate((el) => el.scrollWidth > el.clientWidth),
      ).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      );
      const audit = await new AxeBuilder({ page })
        .include("#rule-completions")
        .include("#complete-rule")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(audit.violations).toEqual([]);
      if (locale === "fr")
        await page
          .locator("#rule-completions")
          .screenshot({ path: testInfo.outputPath(`completions-${theme}-320.png`) });
      await page.locator("#completion-apply").click();
      await expect(editor).toHaveValue(source.replace("same as ca", reference));
    }
  }
});

test("a completed rule persists in an opted-in draft, while a flag or recipe change closes the list", async ({
  page,
}) => {
  const editor = await ready(page);
  await page.locator("#test-fixtures > summary").click();
  await page.locator("#draft-save").check();
  await editor.fill("di");
  await page.locator("#complete-rule").click();
  await page.locator("#completion-choice").selectOption({ label: "digits" });
  await page.locator("#completion-apply").click();
  await expect(page.locator("#draft-status")).toHaveText("Draft saved in this browser.");
  await page.reload();
  await expect(editor).toHaveValue("digits");
  await editor.fill("di");
  await page.locator("#complete-rule").click();
  await page.locator("#ignore-case").check();
  await expect(page.locator("#rule-completions")).toBeHidden();
  await page.locator("#complete-rule").click();
  await page.locator("#example-list button").first().click();
  await expect(page.locator("#rule-completions")).toBeHidden();
});
