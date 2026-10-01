import { expect, test } from "@playwright/test";

test("public regex construction uses each validated field once", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const result = await page.evaluate(async () => {
    const { toRegExp } = await import("/index.js");
    let sourceReads = 0;
    let flagReads = 0;
    const regex = toRegExp({
      get source() {
        return ++sourceReads === 1 ? "^A.😀$" : "^CHANGED$";
      },
      get flags() {
        return ++flagReads === 1 ? "isu" : "g";
      },
    });
    let invalidFlagReads = 0;
    let error;
    try {
      toRegExp({
        source: 0,
        get flags() {
          invalidFlagReads += 1;
          throw new Error("Flags must not be read after invalid source.");
        },
      });
    } catch (caught) {
      error = { name: caught.name, message: caught.message };
    }
    return {
      source: regex.source,
      flags: regex.flags,
      matches: regex.test("a\n😀"),
      changed: regex.test("CHANGED"),
      sourceReads,
      flagReads,
      invalidFlagReads,
      error,
    };
  });
  expect(result).toEqual({
    source: "^A.😀$",
    flags: "isu",
    matches: true,
    changed: false,
    sourceReads: 1,
    flagReads: 1,
    invalidFlagReads: 0,
    error: { name: "TypeError", message: "Expected a compile result with source and flags." },
  });
});
