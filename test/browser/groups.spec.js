import { expect, test } from "@playwright/test";

test("nested capture blocks compile and retain keyboard-accessible source traces", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  await page
    .locator("#rules-input")
    .fill('start\ncapture "year" {\n4 digits\n}\noptional group {\n"-"\n2 digits\n}\nend');
  await expect(page.locator("#regex-output")).toContainText(
    String.raw`/^(?<year>\d{4})(?:-\d{2}){0,1}$/u`,
  );
  const trace = page.locator("#trace-list button");
  await expect(trace).toHaveCount(9);
  const capture = trace.nth(1);
  await expect(capture).toContainText('Capture #1 named "year"');
  await capture.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#rules-input")).toBeFocused();
  expect(
    await page
      .locator("#rules-input")
      .evaluate((field) => field.value.slice(field.selectionStart, field.selectionEnd)),
  ).toBe('capture "year" {');
  await page.locator("#rules-input").fill('capture "x" {\ndigit');
  await expect(page.locator("#diagnostic")).toContainText("Close this group");
});

test("capture references compile, match in the worker and locate missing targets", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  await page
    .locator("#rules-input")
    .fill('start\ncapture "word" {\nletters\n}\nspace\nsame as capture "word"\nend');
  await page.locator("#test-list .test-row textarea").first().fill("cat cat");
  await expect(page.locator("#test-list .test-row").first()).toHaveAttribute("data-result", "pass");
  await expect(page.locator("#trace-list")).toContainText('Same text as capture #1 named "word"');
  await page.locator("#test-list .test-row textarea").first().fill("cat dog");
  await expect(page.locator("#test-list .test-row").first()).toHaveAttribute("data-result", "fail");
  await page.locator("#rules-input").fill("same as capture 1");
  await expect(page.locator("#diagnostic")).toContainText("Capture 1 is not defined");
});

test("regex imports preserve nested captures and references in editable rules", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  await reverse.fill(String.raw`/^(?<outer>(?<word>[A-Za-z]+))\s\k<word>$/iu`);
  await reverse.press("Control+Enter");
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#rules-input")).toHaveValue(
    'start\ncapture "outer" {\ncapture "word" {\none or more letter\n}\n}\nspace\nsame as capture "word"\nend',
  );
  await expect(page.locator("#trace-list")).toContainText('Capture #2 named "word"');
  await page.locator("#test-list .test-row textarea").first().fill("CAT cat");
  await expect(page.locator("#test-list .test-row").first()).toHaveAttribute("data-result", "pass");
  const previous = await page.locator("#rules-input").inputValue();
  await reverse.fill(String.raw`/😀(?:\1)(a)/u`);
  await reverse.press("Control+Enter");
  await expect(reverse).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#reverse-feedback")).toContainText(
    "Column 6: A capture reference must follow its capture.",
  );
  await expect(page.locator("#rules-input")).toHaveValue(previous);
  await page.getByRole("button", { name: "Go to regex error", exact: true }).press("Enter");
  expect(
    await reverse.evaluate((field) => field.value.slice(field.selectionStart, field.selectionEnd)),
  ).toBe("\\");
});

test("regex imports retain compiler reference wrappers at the maximum group depth", async ({
  page,
}) => {
  const depth = 64;
  const source = `(?<prefix>A)${"(".repeat(depth)}(?:\\1)${")".repeat(depth)}`;
  const rules = `capture "prefix" {\n"A"\n}\n${"capture {\n".repeat(depth)}same as capture 1\n${"}\n".repeat(depth).trimEnd()}`;
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  await reverse.fill(`/${source}/du`);
  await reverse.press("Control+Enter");
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#rules-input")).toHaveValue(rules);
  await expect(page.locator("#regex-output")).toHaveText(`/${source}/du`);
  await page.locator("#test-list .test-row textarea").first().fill("AA");
  await expect(page.locator("#test-list .test-row").first()).toHaveAttribute("data-result", "pass");
});
