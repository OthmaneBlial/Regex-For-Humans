import { expect, test } from "@playwright/test";

test("explicit word-character names simplify the username recipe and explain class limits", async ({
  page,
}) => {
  await page.goto("/?example=username-shape");
  const editor = page.locator("#rules-input");
  await expect(editor).toHaveValue("start letter\nbetween 2 and 15 word characters\nend");
  await expect(page.locator("#test-summary")).toContainText("examples behave as expected");
  await expect(page.locator("#test-summary")).toHaveAttribute("data-state", "success");
  const output = page.locator("#regex-output");
  const sample = page.locator("#test-list textarea").first();
  const feedback = page.locator("#test-list .test-result").first();
  for (const [rule, source, accepted, rejected] of [
    ["word character", String.raw`\w`, "_", "AB"],
    ["word characters", String.raw`\w+`, "A_7", ""],
    ["between 2 and 4 word characters", String.raw`\w{2,4}`, "A_7", "ABCDE"],
    ["optional word character", String.raw`\w{0,1}`, "", "AB"],
  ]) {
    await editor.fill(`start\n${rule}\nend`);
    await expect(output).toHaveText(`/^${source}$/u`);
    await expect(page.locator("#trace-list .trace-meaning").nth(1)).toContainText(
      "Word character: ASCII letter, digit or underscore.",
    );
    await sample.fill(accepted);
    await expect(feedback).toContainText("✓ Matched");
    await sample.fill(rejected);
    await expect(feedback).toHaveText("! No match");
  }
  await editor.fill("start\nword characters\nend");
  await sample.fill("Kſ");
  await expect(feedback).toHaveText("! No match");
  await page.locator("#ignore-case").check();
  await expect(feedback).toHaveText('✓ Matched "Kſ" at 0');
  for (const value of ["é", "a-b", "a b", "😀"]) {
    await sample.fill(value);
    await expect(feedback).toHaveText("! No match");
  }
  await editor.fill("words");
  await expect(page.locator("#diagnostic")).toContainText(
    "Use `word character` for one ASCII letter, digit or underscore, or `word characters` for one or more.",
  );
  await expect(page.locator("#copy-button")).toBeDisabled();
  await editor.fill("start\nword characters\nend");
  await sample.fill("A_7");
  await expect(feedback).toHaveText('✓ Matched "A_7" at 0');
  await expect(page.locator("#copy-button")).toBeEnabled();
});
