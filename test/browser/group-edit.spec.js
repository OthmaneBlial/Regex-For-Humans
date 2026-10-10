import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("group renaming updates references, preserves pending fields and rejects destructive edits", async ({
  page,
}) => {
  await page.goto("/");
  const rules =
    'start\ngroup {\n  capture "word" {\n    letter\n  }\n  capture "suffix" {\n    digit\n  }\n  same as capture "word"\n  same as capture 2\n}\nend';
  const editor = page.getByRole("textbox", { name: "Write your rules", exact: true });
  await editor.fill(rules);
  await page.getByLabel("Example 1 string", { exact: true }).fill("A1A1");
  await page.locator("#group-editor > summary").press("Enter");
  const selected = page.getByLabel("Group to edit", { exact: true });
  await selected.selectOption("3:3");
  const name = page.getByLabel("Capture name", { exact: true });
  await name.fill("renamed");
  await name.press("Enter");
  const renamed = rules
    .replace('capture "word"', 'capture "renamed"')
    .replace('same as capture "word"', 'same as capture "renamed"');
  await expect(editor).toHaveValue(renamed);
  await expect(page.locator("#group-feedback")).toContainText("Group updated");
  await expect(page.locator("#group-info")).toHaveText("Capture #1 · 1 reference.");
  await expect(page.locator(".test-row").first()).toContainText('Matched "A1A1" at 0');
  await name.fill("pending");
  await page.getByRole("checkbox", { name: "Ignore case i", exact: true }).check();
  await expect(name).toHaveValue("pending");
  await page.getByLabel("Group type", { exact: true }).selectOption("none");
  await page.getByRole("button", { name: "Apply group edit", exact: true }).press("Enter");
  await expect(page.locator("#group-feedback")).toContainText("Original rules unchanged");
  await expect(page.locator("#group-feedback")).toContainText("reference targets it");
  await expect(editor).toHaveValue(renamed);
  await expect(editor).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByRole("button", { name: "Copy regex ↗", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Reference on line 9", exact: true }).press("Enter");
  expect(
    await editor.evaluate((field) => field.value.slice(field.selectionStart, field.selectionEnd)),
  ).toBe('  same as capture "renamed"');
  await page.getByLabel("Group type", { exact: true }).selectOption("named");
  await name.fill("suffix");
  await page.getByRole("button", { name: "Apply group edit", exact: true }).click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(editor).toHaveValue(renamed);
  await editor.fill("not a rule");
  await expect(page.locator("#group-editor")).toBeHidden();
  await expect(selected).toBeDisabled();
  await expect(page.getByRole("button", { name: "Apply group edit", exact: true })).toBeHidden();
});

test("capture conversion renumbers later references and highlights native capture ranges", async ({
  page,
}) => {
  await page.goto("/");
  const rules =
    'start\ngroup {\n  "X"\n  capture {\n    digit\n  }\n}\ncapture {\n  "B"\n}\nsame as capture 2\nend';
  const editor = page.getByRole("textbox", { name: "Write your rules", exact: true });
  await editor.fill(rules);
  await page.getByLabel("Example 1 string", { exact: true }).fill("X1BB");
  await page.locator("#group-editor > summary").press("Enter");
  await page.getByLabel("Group type", { exact: true }).selectOption("named");
  await page.getByLabel("Capture name", { exact: true }).fill("outer");
  await page.getByRole("button", { name: "Apply group edit", exact: true }).click();
  await expect(editor).toHaveValue(
    rules.replace("group {", 'capture "outer" {').replace("same as capture 2", "same as capture 3"),
  );
  const row = page.locator(".test-row").first();
  await expect(row).toContainText('Matched "X1BB" at 0');
  await row.locator(".capture-explorer > summary").press("Enter");
  await row.locator(".capture-match > summary").press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"X1BB"', '"X1"', '"1"', '"B"']);
  await row
    .getByRole("button", { name: "Highlight capture #2 in match 1", exact: true })
    .press("Enter");
  await expect(row.locator(".match-highlight")).toHaveText("1");
  await expect(row.locator(".match-preview")).toContainText("Capture #2 in input:");
  await row.getByRole("button", { name: "Highlight capture #0 in match 1", exact: true }).click();
  await expect(row.locator(".match-highlight")).toHaveText("X1BB");
  await page.getByLabel("Group type", { exact: true }).selectOption("none");
  await page.getByRole("button", { name: "Apply group edit", exact: true }).click();
  await expect(editor).toHaveValue(rules);
  await expect(row).toContainText('Matched "X1BB" at 0');
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test("capture highlighting distinguishes empty, absent and lookaround positions", async ({
  page,
}) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Write your rules", exact: true });
  await editor.fill(
    'start\noptional capture "absent" {\n"x"\n}\ncapture "empty" {\noptional "y"\n}\nend',
  );
  await page.getByLabel("Example 1 string", { exact: true }).fill("");
  const row = page.locator(".test-row").first();
  await row.locator(".capture-explorer > summary").press("Enter");
  await row.locator(".capture-match > summary").press("Enter");
  await expect(
    row.getByRole("button", { name: "Highlight capture #1 in match 1", exact: true }),
  ).toHaveCount(0);
  await row.getByRole("button", { name: "Highlight capture #2 in match 1", exact: true }).click();
  await expect(row.locator(".match-caret")).toHaveText("|");
  await page.getByLabel("Match mode", { exact: true }).selectOption("search");
  await editor.fill('preceded by {\ncapture "before" {\n"a"\n}\n}\n"b"');
  await page.getByLabel("Example 1 string", { exact: true }).fill("😀ab");
  await expect(row).toContainText('Matched "b" at 3');
  await row.locator(".capture-match > summary").press("Enter");
  await row.getByRole("button", { name: "Highlight capture #1 in match 1", exact: true }).click();
  await expect(row.locator(".match-highlight")).toHaveText("a");
  await expect(row.locator(".capture-span")).toHaveText(["3–4", "2–3"]);
});
