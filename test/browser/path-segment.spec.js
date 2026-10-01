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
  for (const source of [
    result.source,
    String.raw`^[^/\\\0\n\r\u2028\u2029]{1,32}$`,
    String.raw`^[^\u2029\cM\x00\/\u2028\cJ\\/]{1,32}$`,
    String.raw`^[^\u{00002029}\u{00002028}\u{0000000D}\u{0000000A}\u{00000000}\u{0000005C}\u{0000002F}]{1,32}$`,
  ]) {
    await page.locator("#reverse-regex").fill(`/${source}/u`);
    await page.locator("#reverse-regex").press("Control+Enter");
    await expect(editor).toHaveValue("start\nbetween 1 and 32 path segment character\nend");
    await expect(editor).toBeFocused();
    await expect(page.locator("#regex-output")).toHaveText(`/${result.source}/u`);
    await expect(page.locator("#trace-list .trace-meaning").nth(1)).toHaveText(
      result.segments[1].explanation,
    );
    await sample.fill("Équipe 😀");
    await expect(feedback).toHaveText('✓ Matched "Équipe 😀" at 0');
    await sample.fill("folder/name");
    await expect(feedback).toHaveText("! No match");
  }
  const previous = await editor.inputValue();
  await page.locator("#reverse-regex").fill(String.raw`/^[^/\\\0\n\r\u2028\u2029](x)$/u`);
  await page.locator("#reverse-button").click();
  await expect(page.locator("#reverse-feedback")).toContainText(
    "Capturing groups cannot be translated.",
  );
  await expect(editor).toHaveValue(previous);
});
