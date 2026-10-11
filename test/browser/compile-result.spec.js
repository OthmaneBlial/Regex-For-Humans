import { expect, test } from "@playwright/test";

test("cached scope construction checks the receiving Unicode mode without confusing literal text", async ({
  page,
}) => {
  await page.goto("/");
  const proof = await page.evaluate(async () => {
    const { toRegExp } = await import("/index.js");
    const modes = [];
    for (const flags of ["u", "v", ""]) {
      const native = new RegExp(String.raw`(?i:\.|\bNULL)`, flags);
      const healthy = native.test("Null");
      let sourceReads = 0;
      let flagReads = 0;
      let match = false;
      let error;
      try {
        const regex = toRegExp({
          get source() {
            sourceReads++;
            return '"a\r\nb(?i:c)';
          },
          get flags() {
            flagReads++;
            return flags;
          },
          get segments() {
            throw new Error("Unused segments were read");
          },
        });
        match = regex.test('"a\r\nbC');
      } catch (caught) {
        error = { code: caught.code, line: caught.line, column: caught.column };
      }
      modes.push({ healthy, match, error, sourceReads, flagReads });
    }
    const literals = [
      { source: String.raw`\(\?i:a\)`, flags: "u" },
      { source: "[(?i:)]", flags: "u" },
      { source: String.raw`[[\q{\(\?i:a\)}]]`, flags: "v" },
      { source: "a{2001}", flags: "u" },
    ].every(
      (metadata) =>
        toRegExp(metadata).source === new RegExp(metadata.source, metadata.flags).source,
    );
    const syntaxErrors = [
      { source: "(?i:a)", flags: "uu" },
      { source: "(?ii:a)", flags: "u" },
    ].map((metadata) => {
      try {
        toRegExp(metadata);
      } catch (error) {
        return error.name;
      }
      return "accepted";
    });
    return { modes, literals, syntaxErrors };
  });
  expect(proof.literals).toBe(true);
  expect(proof.syntaxErrors).toEqual(["SyntaxError", "SyntaxError"]);
  for (const mode of proof.modes) {
    expect([mode.sourceReads, mode.flagReads]).toEqual([1, 1]);
    expect(mode.match).toBe(mode.healthy);
    expect(mode.error).toEqual(
      mode.healthy ? undefined : { code: "UNSUPPORTED_TARGET_FEATURE", line: 2, column: 2 },
    );
  }
  expect(proof.modes.slice(0, 2).every((mode) => mode.healthy)).toBe(true);
});

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
