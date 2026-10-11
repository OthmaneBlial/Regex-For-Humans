import { expect, test } from "@playwright/test";
import { translate } from "../../web/i18n.js";
import { flagSets } from "../fixtures/advanced-flags-corpus.js";
import { scopedInputs, scopedPatterns } from "../fixtures/scoped-flags-corpus.js";

test("local i/m/s groups preserve native matches and cursor state across all 128 flag combinations", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  const proof = await page.evaluate(
    async ({ flagSets, scopedInputs, scopedPatterns }) => {
      const { compile, regexToRules, toRegExp } = await import("/index.js");
      const { supportsModifiers } = await import("/src/flags.js");
      if (!supportsModifiers())
        throw new Error("Native scoped options fail the semantic capability probe");
      const snapshot = (match) =>
        match && {
          captures: [...match],
          index: match.index,
          input: match.input,
          groups: Object.entries(match.groups ?? {}).map(([name, value]) => [name, value ?? null]),
          indices: match.indices && {
            values: [...match.indices],
            groups: Object.entries(match.indices.groups ?? {}).map(([name, value]) => [
              name,
              value ?? null,
            ]),
          },
        };
      let comparisons = 0;
      let witnesses = 0;
      for (const flags of flagSets)
        for (const [source, witness, mode] of scopedPatterns) {
          if (mode && !flags.includes(mode)) continue;
          if (!new RegExp(source, flags.replace(/[gy]/gu, "")).test(witness))
            throw new Error(`Lost positive witness: ${source}/${flags}`);
          witnesses++;
          const before = new RegExp(source, flags);
          before.lastIndex = 7;
          const translated = regexToRules(before);
          if (before.lastIndex !== 7) throw new Error("Import changed the native cursor");
          const after = toRegExp(compile(translated.rules, { flags: translated.flags }));
          if (after.flags !== before.flags) throw new Error(`Lost outer flags: ${source}/${flags}`);
          for (const input of scopedInputs)
            for (const cursor of [0, 1, 2]) {
              before.lastIndex = after.lastIndex = cursor;
              for (let step = 0; step < 2; step++) {
                if (
                  JSON.stringify(snapshot(after.exec(input))) !==
                    JSON.stringify(snapshot(before.exec(input))) ||
                  after.lastIndex !== before.lastIndex
                )
                  throw new Error(
                    `Native mismatch: ${source}/${flags}: ${JSON.stringify(input)}, cursor ${cursor}, step ${step}`,
                  );
                comparisons++;
              }
            }
        }
      return { comparisons, witnesses };
    },
    { flagSets, scopedInputs, scopedPatterns },
  );
  expect(proof.witnesses).toBe(3584);
  expect(proof.comparisons).toBe(1_268_736);
});

test("local options reach source traces, worker matching, imports and scoped group conversion", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  const rules =
    'start\ncapture "word" {\n"k"\n}\ngroup with flags "i" {\nsame as capture 1\n}\nend';
  await page.locator("#rules-input").fill(rules);
  await page.locator("#test-list .test-row textarea").first().fill("kK");
  await expect(page.locator("#test-list .test-row").first()).toHaveAttribute("data-result", "pass");
  await expect(page.locator("#trace-list")).toContainText(
    'Local flags "i" apply only inside this group',
  );
  await expect(page.locator("#trace-list")).toContainText(
    "Same text as capture #1, ignoring case (i)",
  );
  await expect(
    page.locator("#rules-syntax .syntax-keyword").filter({ hasText: /^(?:with|flags)$/u }),
  ).toHaveCount(2);
  for (const locale of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(locale);
    await page.locator("#explanation-mode").selectOption("beginner");
    await expect(page.locator("#trace-list")).toContainText(
      translate(locale, "Local flags {modifiers} apply only to this group's rules.", {
        modifiers: "i",
      }),
    );
    await page.locator("#explanation-mode").selectOption("expert");
    await expect(page.locator("#trace-list")).toContainText(
      translate(locale, "Effective flags here: {flags}.", { flags: "iu" }),
    );
  }
  await page.locator("#interface-language").selectOption("en");
  await page.locator("#explanation-mode").selectOption("intermediate");
  await page.locator("#reverse-translator summary").click();
  await page.locator("#reverse-regex").fill(String.raw`/(?<word>k)(?i:\k<word>)/u`);
  await page.locator("#reverse-regex").press("Control+Enter");
  await expect(page.locator("#reverse-regex")).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#rules-input")).toHaveValue(/group with flags "i"/u);
  const converted = await page.evaluate(async () => {
    const { compile, editGroup, toRegExp, regexToRules, analyze, toSVG, exportRegex } =
      await import("/index.js");
    const { failureRequirements } = await import("/web/failure-reasons.js");
    const source = 'group with flags "i" {\ncapture "inner" {\n"a"\n}\nsame as capture 1\n}';
    const edited = editGroup(source, { line: 1, column: 1 }, { capturing: true, name: "outer" });
    const match = toRegExp(compile(edited)).exec("aA");
    const projectionRules = 'start\ngroup with flags "is" {\n"a"\nany character\n}\n"B"\nend';
    const projections = {
      dotAll: analyze(projectionRules).warnings.some(
        (finding) => finding.code === "DOT_ALL_WILDCARD",
      ),
      disabledDotAll: analyze('group with flags "-s" {\nany text\n}', { flags: "s" }).warnings.some(
        (finding) => finding.code === "DOT_ALL_WILDCARD",
      ),
      diagram: toSVG(projectionRules).includes("ignoring case"),
      requirements: failureRequirements(projectionRules, "u"),
      strictRequirements: failureRequirements('start\ngroup with flags "-i" {\n"A"\n}\nend', "iu"),
      nativeExports: ["javascript", "typescript"].every((target) => {
        const exported = exportRegex(projectionRules, { target });
        return (
          exported.source === compile(projectionRules).source &&
          exported.requirements.some((requirement) => requirement.includes("scoped i/m/s"))
        );
      }),
      foreignCodes: [],
      absoluteAnchors: false,
      nestedLineAnchors: false,
      newlineConversions: 0,
      conversionDepthCode: "",
    };
    const absolute = toRegExp(compile('group with flags "m" {\nstart\n"a"\nend\n}'));
    projections.absoluteAnchors =
      absolute.test("a") && !absolute.test("x\na\ny") && absolute.flags === "u";
    const nested = `${'group with flags "-m" {\n'.repeat(64)}line start\n"a"\nline end\n${"}\n".repeat(64)}`;
    const lineResult = compile(nested);
    const lineImport = regexToRules(toRegExp(lineResult));
    projections.nestedLineAnchors =
      toRegExp(compile(lineImport.rules, { flags: lineImport.flags })).test("x\na\ny") &&
      lineResult.flags === "u";
    for (const separator of ["\n", "\r\n", "\r", "\u2028", "\u2029"]) {
      const text = source.replaceAll("\n", separator);
      const converted = editGroup(text, { line: 1, column: 1 }, { capturing: true, name: "outer" });
      const values = toRegExp(compile(converted)).exec("aA")?.groups;
      if (
        converted.startsWith(`capture "outer" {${separator}group with flags "i" {`) &&
        values?.outer === "aA" &&
        values?.inner === "a"
      )
        projections.newlineConversions++;
    }
    try {
      editGroup(nested, { line: 1, column: 1 }, { capturing: true, name: null });
    } catch (error) {
      projections.conversionDepthCode = error.code;
    }
    for (const target of ["python", "rust", "go", "java", "csharp", "php", "ruby"])
      try {
        exportRegex(projectionRules, { target });
      } catch (error) {
        projections.foreignCodes.push(error.code);
      }
    return { edited, groups: match.groups, projections };
  });
  expect(converted.edited).toContain('group with flags "i"');
  expect(converted.edited).toContain("same as capture 2");
  expect(converted.groups).toEqual({ outer: "aA", inner: "a" });
  expect(converted.projections).toEqual({
    dotAll: true,
    disabledDotAll: false,
    diagram: true,
    requirements: { minimum: 2, literals: ["B"], endLiteral: "B" },
    strictRequirements: { minimum: 1, literals: ["A"], startLiteral: "A", endLiteral: "A" },
    nativeExports: true,
    foreignCodes: Array(7).fill("EXPORT_SCOPED_FLAGS"),
    absoluteAnchors: true,
    nestedLineAnchors: true,
    newlineConversions: 5,
    conversionDepthCode: "GROUP_DEPTH_LIMIT",
  });
});
