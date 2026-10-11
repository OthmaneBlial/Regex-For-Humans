import assert from "node:assert/strict";
import test from "node:test";
import { analyze, CompileError, compile, exportRegex, toSVG } from "../index.js";
import { splitLines } from "../src/parser.js";
import { tokenizeRules } from "../web/syntax.js";

function diagnosed(source, code, token, line, consumer = compile) {
  let error;
  try {
    consumer(source);
  } catch (caught) {
    error = caught;
  }
  assert(error instanceof CompileError);
  assert.equal(error.code, code);
  assert.equal(error.line, line);
  const original = splitLines(source)[line - 1];
  const column = original.indexOf(token) + 1;
  assert.equal(error.column, column);
  assert.equal(error.endColumn, column + token.length);
  assert.equal(error.toJSON().endColumn, error.endColumn);
  assert.equal(original.slice(error.column - 1, error.endColumn - 1), token);
  const tokens = tokenizeRules(source, error);
  assert(tokens);
  assert.equal(tokens.map((item) => source.slice(item.start, item.end)).join(""), source);
  assert.equal(
    tokens
      .filter((item) => item.kind === "invalid")
      .map((item) => source.slice(item.start, item.end))
      .join(""),
    token,
  );
}

test("repetition diagnostics retain complete numeric source tokens and original coordinates", () => {
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    for (const token of ["-12", "+3", "1.5", ".5", "1e2", "0x10", "1_000", "٣", "𝟛"]) {
      for (const rule of [
        `  start ${token} digits`,
        `between ${token} and 4 digits`,
        `between 2 and ${token} digits`,
        `at least ${token} digits`,
      ])
        diagnosed(`# ignored 😀 \"${separator}${rule}`, "INVALID_REPETITION", token, 2);
    }
    diagnosed(`digit${separator}  between 25 and 12 digits`, "INVALID_RANGE", "12", 2);
    diagnosed(`digit${separator}  1001 digits`, "REPETITION_LIMIT", "1001", 2);
  }
});

test("capture diagnostics select original quoted names and reference tokens", () => {
  const cases = [
    ['same as capture "missing"', "MISSING_CAPTURE_REFERENCE", '"missing"', 1],
    ["optional same as capture 12", "MISSING_CAPTURE_REFERENCE", "12", 1],
    ['same as capture "word"\ncapture "word" {\n"A"\n}', "FORWARD_CAPTURE_REFERENCE", '"word"', 1],
    ['capture "word" {\n  same as capture "word"\n}', "SELF_CAPTURE_REFERENCE", '"word"', 2],
    ["same as capture 0", "INVALID_CAPTURE_REFERENCE", "0", 1],
    ['same as capture "bad-name"', "INVALID_CAPTURE_REFERENCE", '"bad-name"', 1],
    ['same as capture "\\u006dissing"', "MISSING_CAPTURE_REFERENCE", '"\\u006dissing"', 1],
    ['capture "bad-name" {\n}', "INVALID_CAPTURE_NAME", '"bad-name"', 1],
    ['capture "😀" {\n}', "INVALID_CAPTURE_NAME", '"😀"', 1],
  ];
  for (const [source, code, token, line] of cases) {
    for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"])
      diagnosed(source.replaceAll("\n", separator), code, token, line);
  }
});

test("all AST consumers retain error spans while legacy point diagnostics remain unchanged", () => {
  for (const consumer of [
    compile,
    analyze,
    toSVG,
    (source) => exportRegex(source, { target: "python" }),
  ])
    diagnosed("  start -12 digits", "INVALID_REPETITION", "-12", 1, consumer);
  const point = new CompileError("UNKNOWN_RULE", "Unknown rule", { line: 2, column: 3 }, "Repair");
  assert.equal(point.endColumn, undefined);
  assert.deepEqual(point.toJSON(), {
    code: "UNKNOWN_RULE",
    message: "Unknown rule",
    line: 2,
    column: 3,
    hint: "Repair",
  });
  const ranged = new CompileError("INVALID_REPETITION", "Invalid count", {
    line: 2,
    column: 3,
    endColumn: 6,
  });
  assert.equal(ranged.endColumn, 6);
  assert.equal(ranged.toJSON().endColumn, 6);
  assert.throws(
    () => compile("nonsense"),
    (error) => error instanceof CompileError && error.endColumn === undefined,
  );
});

test("quoted diagnostics select invalid escapes without cutting Unicode pairs or closing quotes", () => {
  const cases = [
    [String.raw`  start 2 "😀\q"`, String.raw`\q`],
    [String.raw`capture "bad\q" {`, String.raw`\q`],
    [String.raw`same as capture "bad\q"`, String.raw`\q`],
    [String.raw`one of: "A", "\q"`, String.raw`\q`],
    [String.raw`one of strings: "A", "\q"`, String.raw`\q`],
    [String.raw`range "\q" to "Z"`, String.raw`\q`],
    [String.raw`range "A" to "\q"`, String.raw`\q`],
    [String.raw`character class: digit, unicode property "\q"`, String.raw`\q`],
    [String.raw`unicode property "\q"`, String.raw`\q`],
    [String.raw`"\x41"`, String.raw`\x`],
    [String.raw`"\😀"`, String.raw`\😀`],
    [String.raw`"\u12x4"`, String.raw`\u12x4`],
    [String.raw`"\u000😀"`, String.raw`\u000😀`],
    [String.raw`"\u12"`, String.raw`\u12`],
    [String.raw`"\u12`, String.raw`\u12`],
    [String.raw`"\u"`, String.raw`\u`],
    ['"😀\t"', "\t"],
    ['"😀\\', "\\"],
  ];
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"])
    for (const [source, token] of cases)
      diagnosed(`# ignored 😀 \"${separator}${source}`, "INVALID_QUOTE", token, 2);
  for (const consumer of [compile, analyze, toSVG, (s) => exportRegex(s, { target: "python" })])
    diagnosed(String.raw`"😀\q"`, "INVALID_QUOTE", String.raw`\q`, 1, consumer);
  assert.throws(
    () => compile('"😀'),
    (error) =>
      error.code === "INVALID_QUOTE" && error.column === 4 && error.endColumn === undefined,
  );
});

test("character, range and sequence diagnostics retain complete original items", () => {
  const cases = [
    ["  one of: A, AB  , C", "INVALID_CHARACTER", "AB"],
    ['none of: "A", "😀😀"', "INVALID_CHARACTER", '"😀😀"'],
    [String.raw`text without: A, "\u0061b"`, "INVALID_CHARACTER", String.raw`"\u0061b"`],
    ['range "ab" to "z"', "INVALID_CHARACTER_RANGE", '"ab"'],
    ['range "a" to ""', "INVALID_CHARACTER_RANGE", '""'],
    ['range "z" to "a"', "INVALID_CHARACTER_RANGE", '"a"'],
    [
      String.raw`character class: digit, range "\u007a" to "\u0061", space`,
      "INVALID_CHARACTER_RANGE",
      String.raw`"\u0061"`,
    ],
    ['character class: "AB", digit', "INVALID_CLASS_MEMBER", '"AB"'],
    ["character class: optional digit, space", "INVALID_CLASS_MEMBER", "optional digit"],
    ['string code points: "A" + "BC"', "INVALID_STRING_SEQUENCE", '"BC"'],
    ['string code points: ""', "INVALID_STRING_SEQUENCE", '""'],
  ];
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"])
    for (const [source, code, token] of cases)
      diagnosed(`# ignored 😀 "${separator}${source}`, code, token, 2);
});

test("property diagnostics preserve raw aliases across parsing and native semantic validation", () => {
  const cases = [
    ['  unicode property "Bogus_Property"', "INVALID_UNICODE_PROPERTY", "Bogus_Property"],
    [
      String.raw`lazy optional unicode property "\u0073cript=Greek"`,
      "INVALID_UNICODE_PROPERTY",
      String.raw`\u0073cript=Greek`,
    ],
    [
      String.raw`character class: "😀", unicode property "\u0073cript=Greek", digit`,
      "INVALID_UNICODE_PROPERTY",
      String.raw`\u0073cript=Greek`,
    ],
    ['unicode property "Script =Greek"', "INVALID_UNICODE_PROPERTY", "Script =Greek"],
    ['unicode property "字"', "INVALID_UNICODE_PROPERTY", "字"],
    [
      String.raw`unicode property "Line\nBreak"`,
      "INVALID_UNICODE_PROPERTY",
      String.raw`Line\nBreak`,
    ],
    ['unicode property "RGI_Emoji"', "UNICODE_SETS_REQUIRED", "RGI_Emoji"],
    ['not unicode property "RGI_Emoji"', "INVALID_STRING_COMPLEMENT", "RGI_Emoji", "v"],
  ];
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"])
    for (const [source, code, token, flags] of cases)
      diagnosed(`# ignored 😀 "${separator}${source}`, code, token, 2, (s) =>
        compile(s, { flags }),
      );
  for (const consumer of [compile, analyze, toSVG, (s) => exportRegex(s, { target: "python" })])
    diagnosed(
      String.raw`unicode property "\u0073cript=Greek"`,
      "INVALID_UNICODE_PROPERTY",
      String.raw`\u0073cript=Greek`,
      1,
      consumer,
    );
  assert.throws(
    () => compile('unicode property ""'),
    (e) => e.endColumn === undefined,
  );
});

test("empty character-list items retain a visible point instead of a zero-width range", () => {
  for (const prefix of ["one of:", "none of:", "text without:"])
    for (const gap of ["", "   ", "\t\u00a0"])
      for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
        const line = `  ${prefix} A,${gap}, B`;
        const source = `# ignored 😀 "${separator}${line}`;
        let error;
        try {
          compile(source);
        } catch (e) {
          error = e;
        }
        assert(error instanceof CompileError);
        assert.equal(error.code, "INVALID_CHARACTER");
        assert.equal(error.line, 2);
        assert.equal(error.column, line.lastIndexOf(",") + 1);
        assert.equal(error.endColumn, undefined);
        const tokens = tokenizeRules(source, error);
        assert(tokens);
        assert.equal(tokens.map((t) => source.slice(t.start, t.end)).join(""), source);
        assert.equal(
          tokens
            .filter((t) => t.kind === "invalid")
            .map((t) => source.slice(t.start, t.end))
            .join(""),
          ",",
        );
      }
});
