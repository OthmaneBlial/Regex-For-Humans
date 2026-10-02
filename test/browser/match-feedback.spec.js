import { expect, test } from "@playwright/test";

test("both match modes report zero-based UTF-16 positions for complete, partial and empty matches", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const mode = page.getByRole("combobox", { name: "Match mode", exact: true });
  const help =
    "Entire string requires a match covering the whole example. Search anywhere shows the first match, which can be empty. Positions start at 0 and count UTF-16 code units; an emoji such as 😀 counts as two.";
  await expect(page.locator("#match-mode-help")).toBeVisible();
  await expect(mode).toHaveAccessibleDescription(help);
  await mode.focus();
  await expect(mode).toBeFocused();
  const editor = page.locator("#rules-input");
  const field = page.locator("#test-list textarea").first();
  const expected = page.locator("#test-list select").first();
  const result = page.locator("#test-list .test-result").first();
  await editor.fill('"A"');
  for (const [text, index] of [
    ["😀A", 2],
    ["e\u0301A", 2],
    ["😀\nA", 3],
    ["\u202eA", 1],
    ["xyzA", 3],
    ["Atail", 0],
  ]) {
    await mode.selectOption("full");
    await field.fill(text);
    const feedback = `! Found "A" at ${index}, not the entire string`;
    await expect(result).toHaveText(feedback);
    await expect(field).toHaveAccessibleDescription(new RegExp(feedback));
    await expect(expected).toHaveAccessibleDescription(feedback);
    await mode.selectOption("search");
    await expect(result).toHaveText(`✓ Matched "A" at ${index}`);
  }
  await mode.selectOption("full");
  await field.fill("😀A");
  await expected.selectOption("false");
  await expect(result).toHaveText('✓ Found "A" at 2, not the entire string');
  await expected.selectOption("true");
  await field.fill("A");
  await expect(result).toHaveText('✓ Matched "A" at 0');
  await field.fill("😀B");
  await expect(result).toHaveText("! No match");
  await mode.selectOption("search");
  await expect(result).toHaveText("! No match");
  await editor.fill('line start "A"\nline end');
  await field.fill("😀\nA\n");
  await mode.selectOption("full");
  await expect(result).toHaveText('! Found "A" at 3, not the entire string');
  await mode.selectOption("search");
  await expect(result).toHaveText('✓ Matched "A" at 3');
  await editor.fill(JSON.stringify("A\nB"));
  await field.fill("😀A\nBtail");
  await mode.selectOption("full");
  await expect(result).toHaveText('! Found "A\\nB" at 2, not the entire string');
  await mode.selectOption("search");
  await expect(result).toHaveText('✓ Matched "A\\nB" at 2');
  await editor.fill('between 0 and 1 "A"');
  await field.fill("😀");
  await expect(result).toHaveText('✓ Matched "" at 0');
  await mode.selectOption("full");
  await expect(result).toHaveText('! Found "" at 0, not the entire string');
  await field.fill("");
  await expect(result).toHaveText('✓ Matched "" at 0');
  await editor.fill('between 0 and 2 "ab"\nbetween 0 and 2 "abc"');
  await field.fill("ababc");
  await expect(result).toHaveText('✓ Matched "ababc" at 0');
  const regex = page.locator("#regex-output");
  const pattern = await regex.innerText();
  await mode.selectOption("search");
  await expect(result).toHaveText('✓ Matched "abab" at 0');
  await expect(regex).toHaveText(pattern);
  await mode.selectOption("full");
  await expect(result).toHaveText('✓ Matched "ababc" at 0');
  await expect(regex).toHaveText(pattern);
  await expect(mode).toHaveAccessibleDescription(help);
});
