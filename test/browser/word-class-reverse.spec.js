import { expect, test } from "@playwright/test";

test("complete word classes translate, preserve native matching and recover from nearby unsupported ranges", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copiedPattern = text;
        },
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  const native = await page.evaluate(async () => {
    const { compile, regexToRules, toRegExp } = await import(new URL("./index.js", location.href));
    const failures = [];
    let variants = 0;
    for (const body of ["A-Za-z0-9_", "_0-9a-zA-Z", "a-z_A-Z0-9", "A-ZA-Za-z0-9__"]) {
      for (const negative of [false, true]) {
        for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
          const original = new RegExp(`^[${negative ? "^" : ""}${body}]{2,4}$`, flags);
          original.lastIndex = 7;
          const translated = regexToRules(original);
          const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
          variants += 1;
          for (const sample of [
            "",
            "A_7",
            "____",
            "_____",
            "Kſ",
            "é😀",
            "😀",
            "\ud800",
            "a-b",
            "a b",
            "\nA_7\n",
            "\r\né😀\r\n",
            "\u2028A_7\u2029",
          ]) {
            const describe = (regex) => {
              const match = regex.exec(sample);
              return (
                match && {
                  values: [...match],
                  index: match.index,
                  input: match.input,
                  groups: match.groups,
                }
              );
            };
            if (JSON.stringify(describe(original)) !== JSON.stringify(describe(rebuilt)))
              failures.push({ source: original.source, flags, sample });
          }
          if (rebuilt.flags !== flags || original.lastIndex !== 7)
            failures.push({ source: original.source, flags });
        }
      }
    }
    return { variants, failures };
  });
  expect(native).toEqual({ variants: 64, failures: [] });
  await page.locator("#reverse-translator summary").click();
  const reverse = page.locator("#reverse-regex");
  const editor = page.locator("#rules-input");
  const output = page.locator("#regex-output");
  const sample = page.locator("#test-list textarea").first();
  const result = page.locator("#test-list .test-result").first();
  for (const [body, flags, phrase, token, accepted, rejected] of [
    ["A-Za-z0-9_", "iu", "word", "w", "Kſ", "é😀"],
    ["^_0-9a-zA-Z_", "isu", "not word", "W", "é😀", "Kſ"],
    ["a-z_A-Z0-9", "imsu", "word", "w", "A_7", "a-b"],
    ["^A-ZA-Za-z0-9__", "u", "not word", "W", "é😀", "A_7"],
  ]) {
    const anchor = flags.includes("m") ? "line " : "";
    await reverse.fill(`/^[${body}]{2,4}$/${flags}`);
    await page.locator("#reverse-button").click();
    await expect(editor).toHaveValue(`${anchor}start\nbetween 2 and 4 ${phrase}\n${anchor}end`);
    await expect(output).toHaveText(`/^\\${token}{2,4}$/${flags}`);
    await expect(reverse).toHaveAttribute("aria-invalid", "false");
    await expect(page.locator("#ignore-case")).toBeChecked({ checked: flags.includes("i") });
    await expect(page.locator("#dot-all")).toBeChecked({ checked: flags.includes("s") });
    await sample.fill(accepted);
    await expect(result).toHaveText(`✓ Matched "${accepted}" at 0`);
    await sample.fill(rejected);
    await expect(result).toHaveText("! No match");
  }
  const previousRules = await editor.inputValue();
  const previousOutput = await output.textContent();
  for (const body of ["A-Za-z0-9", "A-Za-z0-9_.", "^A-Za-z0-9_é"]) {
    await reverse.fill(`/^[${body}]{2,4}$/u`);
    await page.locator("#reverse-button").click();
    await expect(reverse).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#reverse-feedback")).toContainText(
      "Character ranges are supported only for digit, letter, word and hex classes.",
    );
    await expect(editor).toHaveValue(previousRules);
    await expect(output).toHaveText(previousOutput);
    await expect(page.locator("#copy-button")).toBeEnabled();
    await page.locator("#reverse-error").click();
    await expect(reverse).toBeFocused();
    expect(
      await reverse.evaluate((field) =>
        field.value.slice(field.selectionStart, field.selectionEnd),
      ),
    ).toBe("-");
  }
  await reverse.fill("/^[_0-9a-zA-Z]{2,4}$/iu");
  await page.locator("#reverse-button").click();
  await expect(editor).toHaveValue("start\nbetween 2 and 4 word\nend");
  await expect(output).toHaveText("/^\\w{2,4}$/iu");
  await expect(page.locator("#reverse-feedback")).toContainText("Translated");
  await expect(editor).toBeFocused();
  await sample.fill("Kſ");
  await expect(result).toHaveText('✓ Matched "Kſ" at 0');
  await page.locator("#copy-button").click();
  expect(await page.evaluate(() => window.copiedPattern)).toBe("/^\\w{2,4}$/iu");
  expect(errors).toEqual([]);
});
