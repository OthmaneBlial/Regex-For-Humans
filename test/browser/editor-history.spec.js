import { expect, test } from "@playwright/test";
import { draftStorageKey } from "../../web/fixtures.js";

// Cold browser startup and complete keyboard history flows share this observation budget.
test.describe.configure({ timeout: 90_000 });

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  return page.locator("#rules-input");
}

async function history(editor, command, value) {
  await editor.focus();
  await editor.press(command === "undo" ? "ControlOrMeta+z" : "ControlOrMeta+Shift+z");
  await expect(editor).toHaveValue(value);
  expect(await editor.page().locator("#rules-syntax .syntax-source").textContent()).toBe(value);
}

test("completion is one native undo step between ordinary typing and redo", async ({ page }) => {
  const editor = await ready(page);
  await editor.evaluate((field) => {
    field.value = "di";
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await editor.press("End");
  await editor.press("g");
  await expect(editor).toHaveValue("dig");
  await editor.press("Control+Space");
  await page.locator("#completion-choice").selectOption({ label: "digit" });
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toHaveValue("digit");
  await expect(page.locator("#regex-output")).toHaveText("/\\d/u");
  await editor.press("s");
  await expect(editor).toHaveValue("digits");
  await history(editor, "undo", "digit");
  await history(editor, "undo", "dig");
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await history(editor, "undo", "di");
  await history(editor, "redo", "dig");
  await history(editor, "redo", "digit");
  await history(editor, "redo", "digits");
  await expect(page.locator("#regex-output")).toHaveText("/\\d+/u");
});

test("builder and group edits undo complete reference changes and update opted-in drafts", async ({
  page,
}) => {
  const editor = await ready(page);
  const original = 'start\ncapture "word" {\n  "A"\n}\nsame as capture 1\nend';
  await editor.fill(original);
  await page.locator("#test-fixtures > summary").click();
  await page.locator("#draft-save").check();
  await page.locator("#ignore-case").check();
  const examples = await page
    .locator("#test-list textarea")
    .evaluateAll((fields) => fields.map((field) => field.value));
  await editor.evaluate((field) => field.setSelectionRange(6, 6));
  await page.locator("#rule-builder > summary").click();
  await page.locator("#builder-kind").selectOption("capture");
  await page.locator("#builder-insert").click();
  const inserted = await editor.inputValue();
  expect(inserted).toContain("same as capture 2");
  await history(editor, "undo", original);
  await expect(page.locator("#regex-output")).toHaveText("/^(?<word>A)(?:\\1)$/iu");
  await history(editor, "redo", inserted);
  await page.locator("#group-editor > summary").click();
  await page.locator("#group-select").selectOption("5:1");
  await page.locator("#group-name").fill("renamed");
  await page.locator("#group-apply").click();
  const renamed = inserted.replace('capture "word"', 'capture "renamed"');
  await expect(editor).toHaveValue(renamed);
  await history(editor, "undo", inserted);
  await expect
    .poll(async () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key))?.rules, draftStorageKey),
    )
    .toBe(inserted);
  await history(editor, "redo", renamed);
  await expect(page.locator("#ignore-case")).toBeChecked();
  expect(
    await page
      .locator("#test-list textarea")
      .evaluateAll((fields) => fields.map((field) => field.value)),
  ).toEqual(examples);
  await expect
    .poll(async () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key))?.rules, draftStorageKey),
    )
    .toBe(renamed);
});

test("regex and fixture imports and recipe changes preserve rule history without changing current options", async ({
  page,
}) => {
  const editor = await ready(page);
  const original = 'start\n"😀"\nend';
  await editor.fill(original);
  await page.locator("#reverse-translator > summary").click();
  await page.locator("#reverse-regex").fill("/(?<word>A)\\k<word>/iu");
  await page.locator("#reverse-button").click();
  const translated = await editor.inputValue();
  await history(editor, "undo", original);
  await expect(page.locator("#ignore-case")).toBeChecked();
  await history(editor, "redo", translated);
  await page.locator("#test-fixtures > summary").click();
  await page.locator("#fixture-file").setInputFiles({
    name: "history.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "regex-for-humans-tests",
        version: 1,
        rules: 'start\r\n"é"\r\nend',
        flags: "du",
        mode: "full",
        cases: [{ text: "é", expected: true }],
      }),
    ),
  });
  const imported = 'start\n"é"\nend';
  await expect(editor).toHaveValue(imported);
  await history(editor, "undo", translated);
  await expect(page.locator("#test-list textarea")).toHaveCount(1);
  await expect(page.locator("#indices-flag")).toBeChecked();
  await history(editor, "redo", imported);
  await page.locator("#example-list button").first().click();
  const recipe = await editor.inputValue();
  await history(editor, "undo", imported);
  await history(editor, "redo", recipe);
});

test("rule transformations do not replay input handlers in other edited fields", async ({
  page,
}) => {
  const editor = await ready(page);
  await editor.fill("digit");
  await page.locator(".expectation-editor > summary").first().click();
  const expectation = page.locator(".expectation-input").first();
  await expectation.fill("");
  await expectation.pressSequentially("{");
  await expect(expectation).toHaveAttribute("aria-invalid", "true");
  await page.evaluate(() => {
    document.body.dataset.foreignInput = "0";
    document.addEventListener("input", (event) => {
      if (event.target !== document.querySelector("#rules-input"))
        document.body.dataset.foreignInput = String(Number(document.body.dataset.foreignInput) + 1);
    });
  });
  await page.locator("#example-list button").first().click();
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  await expect(page.locator(".expectation-input[aria-invalid=true]")).toHaveCount(0);
  await expect(page.locator("body")).toHaveAttribute("data-foreign-input", "0");

  const example = page.locator("#test-list textarea").first();
  await example.fill("12");
  await example.press("3");
  const rules = await editor.inputValue();
  await page.locator("#rule-builder > summary").click();
  await page.locator("#builder-kind").selectOption("optional");
  await page.locator("body").evaluate((body) => {
    body.dataset.foreignInput = "0";
  });
  await page.locator("#builder-insert").click();
  await expect(page.locator("#builder-feedback")).toHaveAttribute("data-state", "success");
  await expect(example).toHaveValue("123");
  await expect(page.locator("body")).toHaveAttribute("data-foreign-input", "0");
  await history(editor, "undo", rules);
  await expect(example).toHaveValue("123");
});

test("unchanged edits keep history and unavailable native editing still applies exact plain text", async ({
  page,
}) => {
  const editor = await ready(page);
  const source = 'capture "word" {\n  "A"\n}';
  await editor.evaluate((field, rules) => {
    field.value = rules;
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }, source);
  await editor.press("ControlOrMeta+End");
  await editor.press("Enter");
  await page.locator("#group-editor > summary").click();
  await page.locator("#group-apply").click();
  await history(editor, "undo", source);
  await page.locator("#group-apply").click();
  await history(editor, "redo", `${source}\n`);
  await history(editor, "undo", source);
  await page.evaluate(() => {
    document.execCommand = () => {
      throw new Error("unavailable");
    };
  });
  await editor.fill("gro");
  await page.locator("#complete-rule").click();
  await page.locator("#completion-choice").press("Enter");
  await expect(editor).toHaveValue("group {\n  digit\n}\n");
  await expect(page.locator("#regex-output")).toHaveText("/(?:\\d)/u");
});

test("startup and recovered drafts establish initial text without an empty undo step", async ({
  page,
}) => {
  const editor = await ready(page);
  const initial = await editor.inputValue();
  await history(editor, "undo", initial);
  await editor.fill("digit");
  await page.locator("#test-fixtures > summary").click();
  await page.locator("#draft-save").check();
  await expect(page.locator("#draft-status")).toHaveText("Draft saved in this browser.");
  await page.reload();
  await expect(editor).toHaveValue("digit");
  await history(editor, "undo", "digit");
});

test("recipe changes retain body focus without losing native rule history", async ({ page }) => {
  const editor = await ready(page);
  await editor.fill("digit");
  await editor.evaluate((field) => field.blur());
  const recipe = page.locator("#example-list button").first();
  await recipe.evaluate((button) =>
    button.addEventListener("mousedown", (event) => event.preventDefault(), { once: true }),
  );
  await recipe.click();
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  await history(editor, "undo", "digit");
});
