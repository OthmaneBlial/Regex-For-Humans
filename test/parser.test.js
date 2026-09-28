import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CompileError } from "../src/diagnostics.js";
import { LIMITS, parse } from "../src/parser.js";

const scenarios = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("all reference scenarios parse into ordered instructions", () => {
  for (const scenario of scenarios) {
    const { nodes } = parse(scenario.rules);
    assert.ok(nodes.length >= 3, scenario.id);
    assert.equal(nodes[0].kind, "anchor", scenario.id);
    assert.equal(nodes.at(-1).kind, "anchor", scenario.id);
  }
});

test("negative shorthands use their exact names", () => {
  assert.equal(parse("not word").nodes[0].value, "\\W");
  assert.equal(parse("not digit").nodes[0].value, "\\D");
  assert.equal(parse("not space").nodes[0].value, "\\S");
});

test("exact counts stay before one rule and validate their limit", () => {
  assert.deepEqual(parse("3 digit").nodes[0].repetition, { kind: "exact", min: 3 });
  assert.deepEqual(parse("digits").nodes[0].repetition, { kind: "oneOrMore" });
  assert.deepEqual(parse("any text").nodes[0].repetition, { kind: "zeroOrMore" });
  assert.throws(() => parse(`3 4 digits`), { code: "DUPLICATE_REPETITION" });
  assert.throws(() => parse(`3 times`), { code: "UNKNOWN_RULE" });
  assert.throws(() => parse(`${LIMITS.repetition + 1} digit`), {
    code: "REPETITION_LIMIT",
  });
});

test("an excessive repetition count points to the count", () => {
  const count = String(LIMITS.repetition + 1);
  const rules = `${count} digit`;
  assert.throws(
    () => parse(rules),
    (error) => {
      assert.ok(error instanceof CompileError);
      assert.equal(error.code, "REPETITION_LIMIT");
      assert.equal(error.column, rules.indexOf(count) + 1);
      return true;
    },
  );
});

test("a second count points to its own column", () => {
  const rules = "3 4 digits";
  assert.throws(
    () => parse(rules),
    (error) =>
      error instanceof CompileError &&
      error.code === "DUPLICATE_REPETITION" &&
      error.line === 1 &&
      error.column === 3,
  );
});

test("quoted literal and character-list items keep punctuation as data", () => {
  assert.equal(parse('"a.b"').nodes[0].value, "a.b");
  assert.deepEqual(parse('one of: "]", "-", ",", "\\\\"').nodes[0].value, ["]", "-", ",", "\\"]);
  assert.throws(() => parse('"bad\\q"'), { code: "INVALID_QUOTE" });
  assert.throws(() => parse('""'), { code: "EMPTY_LITERAL" });
  assert.throws(() => parse("one of:"), { code: "EMPTY_CHARACTER_LIST" });
  assert.throws(() => parse("one of: ab"), { code: "INVALID_CHARACTER" });
  assert.throws(() => parse("one of: a,   "), {
    code: "INVALID_CHARACTER_LIST",
  });
});

test("quoted-string errors point to the invalid escape or missing quote", () => {
  const cases = [
    [String.raw`"bad\q"`, "\\q", /Invalid JSON escape/u],
    [String.raw`one of: "a", "bad\q"`, "\\q", /Invalid JSON escape/u],
    [String.raw`"bad\u12x4"`, "\\u", /four hexadecimal digits/u],
    ['"bad\t"', "\t", /Escape control characters/u],
    ['"ABC', null, /Missing closing double quote/u],
    [`"ABC${"\\"}`, "\\", /Incomplete JSON escape/u],
  ];
  for (const [rules, marker, message] of cases) {
    const badIndex = marker === null ? rules.length : rules.indexOf(marker);
    assert.throws(
      () => parse(rules),
      (error) => {
        assert.ok(error instanceof CompileError);
        assert.equal(error.code, "INVALID_QUOTE");
        assert.equal(error.column, badIndex + 1);
        assert.match(error.message, message);
        return true;
      },
      rules,
    );
  }

  const list = String.raw`start
one of: "a", "bad\q"`;
  assert.throws(
    () => parse(list),
    (error) => error.code === "INVALID_QUOTE" && error.line === 2 && error.column === 18,
  );
});

test("trailing literal text points to its first unexpected character", () => {
  const rules = '  start, "A"  extra';
  assert.throws(
    () => parse(rules),
    (error) =>
      error.code === "TRAILING_TEXT" &&
      error.line === 1 &&
      error.column === rules.indexOf("extra") + 1,
  );
});

test("multi-code-point character-list errors point to the offending item", () => {
  for (const items of ["a, bc", 'a, "bc"']) {
    assert.throws(
      () => parse(`start\none of: ${items}`),
      (error) => {
        assert.ok(error instanceof CompileError);
        assert.equal(error.code, "INVALID_CHARACTER");
        assert.equal(error.line, 2);
        assert.equal(error.column, 12);
        return true;
      },
      items,
    );
  }
});

test("unknown and misplaced instructions report a useful location", () => {
  assert.throws(
    () => parse("digit\n  surprise phrase"),
    (error) => {
      assert.ok(error instanceof CompileError);
      assert.equal(error.code, "UNKNOWN_RULE");
      assert.equal(error.line, 2);
      assert.equal(error.column, 3);
      assert.equal(error.message, 'Unsupported rule: "surprise phrase".');
      assert.equal(error.hint, "Try `line start`, `any text` or `3 digits`.");
      return true;
    },
  );
  for (const legacyRule of [
    "at the beginning of a line",
    "end of the line",
    "I am looking for any character, any number of times",
    "I am looking for a digit character 3 times",
    "digit character",
    "anything except the following characters: a, b",
  ]) {
    assert.throws(() => parse(legacyRule), { code: "UNKNOWN_RULE" }, legacyRule);
  }
  assert.throws(
    () => parse("digit\nline start"),
    (error) =>
      error.code === "MISPLACED_ANCHOR" && error.message === "Start anchor must be the first rule.",
  );
  assert.throws(
    () => parse("digit\nend\ntext"),
    (error) =>
      error.code === "MISPLACED_ANCHOR" && error.message === "End anchor must be the last rule.",
  );
  assert.throws(
    () => parse("start\nline end"),
    (error) =>
      error.code === "MIXED_ANCHORS" && error.message === "Do not mix input and line anchors.",
  );
  assert.throws(() => parse(" "), { code: "EMPTY_SOURCE" });
});

test("duplicate anchors point to the second anchor", () => {
  for (const [rules, line, column, message] of [
    ["start\nstart\n3 digits", 2, 1, "Use only one start anchor."],
    ["start, start 3 digits", 1, 8, "Use only one start anchor."],
    ["digit\nend\nend", 3, 1, "Use only one end anchor."],
  ]) {
    assert.throws(
      () => parse(rules),
      (error) => {
        assert.ok(error instanceof CompileError);
        assert.equal(error.code, "DUPLICATE_ANCHOR");
        assert.equal(error.message, message);
        assert.equal(error.line, line);
        assert.equal(error.column, column);
        return true;
      },
    );
  }
});

test("source-length errors point to the first code unit beyond the limit", () => {
  const source = `${"x".repeat(LIMITS.sourceLength - 5)}\nabcdef`;
  assert.throws(
    () => parse(source),
    (error) => {
      assert.ok(error instanceof CompileError);
      assert.equal(error.code, "SOURCE_LIMIT");
      assert.equal(error.line, 2);
      assert.equal(error.column, 5);
      return true;
    },
  );

  assert.throws(
    () => parse(`${"x".repeat(LIMITS.sourceLength - 1)}\r\n`),
    (error) =>
      error.code === "SOURCE_LIMIT" && error.line === 1 && error.column === LIMITS.sourceLength,
  );

  for (const separator of ["\n", "\r\n", "\r", "\u2028", "\u2029"]) {
    const prefix = `digit${separator}a`;
    const source = `${prefix}${"x".repeat(LIMITS.sourceLength - prefix.length)}Y`;
    assert.throws(
      () => parse(source),
      (error) =>
        error.code === "SOURCE_LIMIT" &&
        error.line === 2 &&
        error.column === LIMITS.sourceLength - prefix.length + 2,
      separator,
    );
  }
});

test("line limit accepts a final newline and rejects the 201st input line", () => {
  for (const separator of ["\n", "\r\n", "\r", "\u2028", "\u2029"]) {
    const atLimit = Array.from({ length: LIMITS.lines }, () => "digit").join(separator);
    assert.equal(parse(`${atLimit}${separator}`).nodes.length, LIMITS.lines);

    for (const source of [
      `${atLimit}${separator}digit${separator}`,
      `${atLimit}${separator}${separator}`,
      separator.repeat(LIMITS.lines + 1),
    ]) {
      assert.throws(
        () => parse(source),
        (error) =>
          error.code === "LINE_LIMIT" &&
          error.message === `Input cannot exceed ${LIMITS.lines} lines.` &&
          error.line === LIMITS.lines + 1,
        separator,
      );
    }
  }
});

test("diagnostic columns count UTF-16 code units", () => {
  const rules = String.raw`"😀\q"`;
  assert.throws(
    () => parse(rules),
    (error) => {
      assert.ok(error instanceof CompileError);
      assert.equal(error.code, "INVALID_QUOTE");
      assert.equal(error.line, 1);
      assert.equal(error.column, rules.indexOf("\\q") + 1);
      return true;
    },
  );
});

test("keywords ignore case and blank lines while retaining literal case", () => {
  const result = parse('  START\r\n\r\n "AbC"  \r\nEND');
  assert.equal(result.nodes.length, 3);
  assert.equal(result.nodes[1].value, "AbC");
  assert.equal(result.nodes[1].location.line, 3);
});
