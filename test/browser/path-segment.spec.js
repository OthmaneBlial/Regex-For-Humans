import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";

test("readable path segment rules explain Unicode bounds and translate back without an escape list", async ({
  page,
}) => {
  const rules = "start\nbetween 1 and 32 path segment characters\nend";
  const result = compile(rules);
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  const editor = page.locator("#rules-input");
  const sample = page.locator("#test-list textarea").first();
  const feedback = page.locator("#test-list .test-result").first();
  await editor.fill(rules);
  await expect(page.locator("#regex-output")).toHaveText(`/${result.source}/u`);
  await expect(page.locator("#trace-list .trace-meaning").nth(1)).toHaveText(
    result.segments[1].explanation,
  );
  await expect(page.locator("#copy-button")).toBeEnabled();
  for (const value of ["Équipe 😀", "😀".repeat(32), ".", "..", "a b"]) {
    await sample.fill(value);
    await expect(feedback).toContainText("✓ Matched");
  }
  for (const value of [
    "",
    "😀".repeat(33),
    "folder/name",
    "folder\\name",
    "a\0b",
    "a\nb",
    "a\u2028b",
    "a\u2029b",
  ]) {
    await sample.fill(value);
    await expect(feedback).toHaveText("! No match");
  }
  await page.locator("#reverse-translator summary").click();
  await page.locator("#reverse-regex").fill(`/${result.source}/u`);
  await page.locator("#reverse-regex").press("Control+Enter");
  await expect(editor).toHaveValue("start\nbetween 1 and 32 path segment character\nend");
  await expect(editor).toBeFocused();
  await expect(page.locator("#trace-list .trace-meaning").nth(1)).toHaveText(
    result.segments[1].explanation,
  );
  await sample.fill("Équipe 😀");
  await expect(feedback).toHaveText('✓ Matched "Équipe 😀" at 0');
});
