import { expect, test } from "@playwright/test";
import { REGEX_LITERAL_INPUT_LIMIT } from "../../src/regex-literal.js";

test("outer whitespace counts toward the reverse input budget without replacing edits", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  const editor = page.locator("#rules-input");
  const sample = page.locator("#test-list textarea").first();
  const result = page.locator("#test-list .test-result").first();
  await editor.fill('start\n"KEEP"\nend');
  await page.locator("#ignore-case").check();
  await page.locator("#dot-all").check();
  await sample.fill("KEEP");
  await expect(result).toHaveText('✓ Matched "KEEP" at 0');
  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  const feedback = page.locator("#reverse-feedback");
  const literal = "/^😀$/u";
  const excess = REGEX_LITERAL_INPUT_LIMIT + 1 - literal.length;
  for (const input of [
    `${" ".repeat(excess)}${literal}`,
    `${literal}${"\u00a0".repeat(excess)}`,
    " ".repeat(REGEX_LITERAL_INPUT_LIMIT + 1),
  ]) {
    await reverse.fill(input);
    await reverse.press("Control+Enter");
    await expect(feedback).toHaveText(
      "Regex input cannot exceed 16392 UTF-16 code units, including delimiters, flags and outer whitespace.",
    );
    await expect(reverse).toHaveValue(input);
    await expect(reverse).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#reverse-error")).toBeHidden();
    await expect(editor).toHaveValue('start\n"KEEP"\nend');
    await expect(page.locator("#regex-output")).toHaveText("/^KEEP$/isu");
    await expect(page.locator("#ignore-case")).toBeChecked();
    await expect(page.locator("#dot-all")).toBeChecked();
    await expect(page.locator("#copy-button")).toBeEnabled();
    await expect(result).toHaveText('✓ Matched "KEEP" at 0');
  }
  await expect(page.locator("#reverse-help")).toContainText(
    "Limit: 16,392 UTF-16 code units, including outer whitespace.",
  );
  const boundary = `${"\u00a0".repeat(REGEX_LITERAL_INPUT_LIMIT - literal.length)}${literal}`;
  await reverse.fill(boundary);
  await reverse.press("Control+Enter");
  await expect(reverse).toHaveValue(boundary);
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await expect(feedback).toHaveText("Translated. Review the rules and test your examples.");
  await expect(editor).toHaveValue('start\n"😀"\nend');
  await expect(editor).toBeFocused();
  await expect(page.locator("#regex-output")).toHaveText("/^😀$/u");
  await expect(page.locator("#ignore-case")).not.toBeChecked();
  await expect(page.locator("#dot-all")).not.toBeChecked();
  await sample.fill("😀");
  await expect(result).toHaveText('✓ Matched "😀" at 0');
});
