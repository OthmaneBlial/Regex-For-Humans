import { expect, test } from "@playwright/test";

test("the workshop compiles rules and reports example results", async ({ page }) => {
  await page.goto("/");
  const output = page.locator("#regex-output");
  await expect(output).toHaveText("/^ABC\\d{3}$/u");

  await page.getByRole("textbox", { name: "Write your rules" }).fill('start\n"Hello"\nend');
  await expect(output).toHaveText("/^Hello$/u");

  const firstExample = page.locator("#test-list textarea").first();
  const firstResult = page.locator("#test-list .test-result").first();
  await firstExample.fill("Hello");
  await expect(firstResult).toHaveText('✓ Matched "Hello" at 0');
  await firstExample.fill("Hello!");
  await expect(firstResult).toHaveText("! No match");

  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  await reverse.fill("/^Hi|Hello$/u");
  await page.locator("#reverse-button").click();
  await expect(reverse).toHaveAttribute("aria-invalid", "true");
  await expect(reverse).toHaveAccessibleDescription(/Alternation.*Translate each alternative/);
  await expect(output).toHaveText("/^Hello$/u");
  await reverse.fill("/^(?:Hi|Hello)$/u");
  await page.locator("#reverse-button").click();
  await expect(reverse).toHaveAttribute("aria-invalid", "true");
  await expect(reverse).toHaveAccessibleDescription(/Column 7: Alternation/);
  await expect(output).toHaveText("/^Hello$/u");
  for (const [literal, diagnostic] of [
    ["/^😀(AB)/u", "Column 4: Capturing groups cannot be translated."],
    ["/^(?<letters>AB)/u", "Column 2: Capturing groups cannot be translated."],
    ["/^😀(?=AB)AB/u", "Column 4: Lookahead assertions cannot be translated."],
    ["/😀(?<!A)B/u", "Column 3: Lookbehind assertions cannot be translated."],
  ]) {
    await reverse.fill(literal);
    await page.locator("#reverse-button").press("Enter");
    await expect(reverse).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#reverse-feedback")).toContainText(diagnostic);
    await expect(reverse).toHaveAccessibleDescription(/non-capturing literal or empty groups/);
    await expect(output).toHaveText("/^Hello$/u");
    await page.getByRole("button", { name: "Go to regex error", exact: true }).press("Enter");
    await expect(reverse).toBeFocused();
    const position = literal.lastIndexOf("(");
    expect(await reverse.evaluate((field) => [field.selectionStart, field.selectionEnd])).toEqual([
      position,
      position + 1,
    ]);
  }
  await reverse.fill("/^[a-zA-Z]{2}$/u");
  await expect(page.locator("#reverse-error")).toBeHidden();
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await page.locator("#reverse-button").click();
  await expect(reverse).toHaveAttribute("aria-invalid", "false");
  await expect(output).toHaveText("/^[A-Za-z]{2}$/u");
  await firstExample.fill("Hi");
  await expect(firstResult).toHaveText('✓ Matched "Hi" at 0');
  await reverse.fill(String.raw`/^\cJ{2}$/u`);
  await page.locator("#reverse-button").click();
  await expect(output).toHaveText(String.raw`/^\u{a}{2}$/u`);
  await firstExample.fill("\n\n");
  await expect(firstResult).toHaveText('✓ Matched "\\n\\n" at 0');
  await firstExample.fill("\n");
  await expect(firstResult).toHaveText("! No match");
  await reverse.fill("/^[._-]{2}$/u");
  await page.locator("#reverse-button").click();
  await expect(output).toHaveText(String.raw`/^[._\-]{2}$/u`);
  await firstExample.fill("-_");
  await expect(firstResult).toHaveText('✓ Matched "-_" at 0');
  await firstExample.fill(".a");
  await expect(firstResult).toHaveText("! No match");
  await reverse.fill("/^[ab]*$/u");
  await page.locator("#reverse-button").click();
  await expect(page.locator("#trace-list")).toContainText('One of "a", "b". Zero or more times.');
  await firstExample.fill("abba");
  await expect(firstResult).toHaveText('✓ Matched "abba" at 0');
  await firstExample.fill("x");
  await expect(firstResult).toHaveText("! No match");
  await reverse.fill("/(?:)+/u");
  await page.locator("#reverse-button").click();
  await expect(output).toHaveText("/.{0}/u");
  await firstExample.fill("");
  await expect(firstResult).toHaveText('✓ Matched "" at 0');
  await firstExample.fill("x");
  await expect(firstResult).toContainText("not the entire string");
  await reverse.fill(String.raw`/^(?:\u{0001f600}A){2}$/isu`);
  await reverse.press("Control+Enter");
  await expect(page.locator("#rules-input")).toBeFocused();
  await reverse.fill(String.raw`/^(?:\u{0001f600}A){2}$/isu`);
  await reverse.press("Meta+Enter");
  await expect(page.locator("#rules-input")).toBeFocused();
  await expect(output).toHaveText("/^(?:😀A){2}$/isu");
  await firstExample.fill("😀a😀a");
  await expect(firstResult).toHaveText('✓ Matched "😀a😀a" at 0');
  await firstExample.fill("😀A");
  await expect(firstResult).toHaveText("! No match");
  await page.locator("#rules-input").fill("start\nbetween 2 and 4 word characters\nend");
  await expect(output).toHaveText("/^\\w{2,4}$/isu");
  await firstExample.fill("A_7");
  await expect(firstResult).toHaveText('✓ Matched "A_7" at 0');
  await firstExample.fill("Kſ");
  await expect(firstResult).toHaveText('✓ Matched "Kſ" at 0');
  await firstExample.fill("a-b");
  await expect(firstResult).toHaveText("! No match");
  await page.locator("#rules-input").fill("start\nbetween 1 and 32 path segment characters\nend");
  await expect(page.locator("#trace-list")).toContainText(
    "Path segment character: excludes slash, backslash, NUL and line breaks.",
  );
  await firstExample.fill("Équipe 😀");
  await expect(firstResult).toHaveText('✓ Matched "Équipe 😀" at 0');
  await firstExample.fill("folder/name");
  await expect(firstResult).toHaveText("! No match");
  await reverse.fill(String.raw`/^[^\u2029\r\x00\/\u2028\n\\/]{1,32}$/u`);
  await reverse.press("Control+Enter");
  await expect(page.locator("#rules-input")).toHaveValue(
    "start\nbetween 1 and 32 path segment character\nend",
  );
  await expect(page.locator("#trace-list")).toContainText(
    "Path segment character: excludes slash, backslash, NUL and line breaks.",
  );
  await firstExample.fill("Équipe 😀");
  await expect(firstResult).toHaveText('✓ Matched "Équipe 😀" at 0');
  await firstExample.fill("folder/name");
  await expect(firstResult).toHaveText("! No match");
  const foreign = await page.evaluate(async () => {
    const { regexToRules } = await import("/index.js");
    const frame = document.createElement("iframe");
    frame.hidden = true;
    document.body.append(frame);
    try {
      const regex = new frame.contentWindow.RegExp("^😀[A-Z]{2}$", "isu");
      for (const name of [
        "source",
        "flags",
        "unicode",
        "ignoreCase",
        "multiline",
        "dotAll",
        Symbol.match,
      ]) {
        Object.defineProperty(regex, name, {
          get() {
            throw new Error("Overridden metadata was read");
          },
        });
      }
      return { localInstance: regex instanceof RegExp, translated: regexToRules(regex) };
    } finally {
      frame.remove();
    }
  });
  expect(foreign).toEqual({
    localInstance: false,
    translated: { rules: 'start\n"😀"\n2 uppercase letter\nend', flags: "is" },
  });
  await page.goto("/?example=artifact-manifest");
  await expect(page.locator("#rules-input")).toHaveValue(
    /between 1 and 32 path segment characters/u,
  );
  await expect(page.locator("#trace-list .trace-fragment")).toHaveCount(19);
  await expect(page.locator('#test-list .test-row[data-result="pass"]')).toHaveCount(9);
  await expect(page.locator("#test-summary")).toHaveText("9 of 9 examples behave as expected");
  await expect(page.locator("#test-list textarea").nth(2)).toHaveValue(/Équipe 😀/u);
});
