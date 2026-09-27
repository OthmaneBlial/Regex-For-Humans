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

test("negative classes do not collide with their positive names", () => {
  assert.equal(parse("non-alphanumeric character").nodes[0].value, "\\W");
  assert.equal(parse("non-digit character").nodes[0].value, "\\D");
  assert.equal(parse("non-whitespace character").nodes[0].value, "\\S");
});

test("repetition forms are distinct and validate their bounds", () => {
  assert.deepEqual(parse("digit character 3 times").nodes[0].repetition, { kind: "exact", min: 3 });
  assert.deepEqual(parse("digit character between 2 and 4 times").nodes[0].repetition, {
    kind: "range",
    min: 2,
    max: 4,
  });
  assert.deepEqual(parse("digit character at least 3 times").nodes[0].repetition, {
    kind: "minimum",
    min: 3,
  });
  assert.deepEqual(parse("any number of times for digit character").nodes[0].repetition, {
    kind: "zeroOrMore",
  });
  assert.throws(() => parse("digit character between 4 and 2 times"), { code: "INVALID_RANGE" });
  assert.throws(() => parse(`digit character ${LIMITS.repetition + 1} times`), {
    code: "REPETITION_LIMIT",
  });
  assert.throws(() => parse("3 times"), { code: "UNKNOWN_RULE" });
});

test("an excessive repetition count points to the count", () => {
  const count = String(LIMITS.repetition + 1);
  const rules = `digit character at least ${count} times`;
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

test("an invalid repetition range points to its upper bound", () => {
  const rules = "digit character between 4 and 2 times";
  assert.throws(
    () => parse(rules),
    (error) => {
      assert.ok(error instanceof CompileError);
      assert.equal(error.code, "INVALID_RANGE");
      assert.equal(error.column, rules.indexOf("2") + 1);
      return true;
    },
  );
});

test("duplicate repetitions report the second modifier's location", () => {
  for (const [rules, column] of [
    ["digit character 2 times 3 times", 25],
    ["3 digits 4 times", 10],
    ["2 times for 3 digits", 13],
    ["at least 2 times for digit character 3 times", 38],
  ]) {
    assert.throws(
      () => parse(rules),
      (error) => {
        assert.ok(error instanceof CompileError);
        assert.equal(error.code, "DUPLICATE_REPETITION");
        assert.equal(error.line, 1);
        assert.equal(error.column, column);
        return true;
      },
      rules,
    );
  }
});

test("quoted literal and character-list items keep punctuation as data", () => {
  assert.equal(parse('a "a.b"').nodes[0].value, "a.b");
  assert.deepEqual(parse('any of the following characters: "]", "-", ",", "\\\\"').nodes[0].value, [
    "]",
    "-",
    ",",
    "\\",
  ]);
  assert.throws(() => parse('a "bad\\q"'), { code: "INVALID_QUOTE" });
  assert.throws(() => parse('a ""'), { code: "EMPTY_LITERAL" });
  assert.throws(() => parse("any of the following characters:"), { code: "EMPTY_CHARACTER_LIST" });
  assert.throws(() => parse("any of the following characters: ab"), { code: "INVALID_CHARACTER" });
  assert.throws(() => parse("any of the following characters: a,   "), {
    code: "INVALID_CHARACTER_LIST",
  });
});

test("quoted-string errors point to the invalid escape or missing quote", () => {
  const cases = [
    [String.raw`a "bad\q"`, "\\q", /Invalid JSON escape/u],
    [String.raw`one of: "a", "bad\q"`, "\\q", /Invalid JSON escape/u],
    [String.raw`a "bad\u12x4"`, "\\u", /four hexadecimal digits/u],
    ['a "bad\t"', "\t", /Escape control characters/u],
    ['a "ABC', null, /Missing closing double quote/u],
    [`a "ABC${"\\"}`, "\\", /Incomplete JSON escape/u],
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
  const rules = '  start, a "A"  extra';
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
    () => parse("digit character\n  surprise phrase"),
    (error) => {
      assert.ok(error instanceof CompileError);
      assert.equal(error.code, "UNKNOWN_RULE");
      assert.equal(error.line, 2);
      assert.equal(error.column, 3);
      assert.match(error.hint, /LANGUAGE/);
      return true;
    },
  );
  assert.throws(() => parse("digit character\nat the beginning of the input"), {
    code: "MISPLACED_ANCHOR",
  });
  assert.throws(() => parse("end of the input\ndigit character"), { code: "MISPLACED_ANCHOR" });
  assert.throws(() => parse("at the beginning of the input\nend of the line"), {
    code: "MIXED_ANCHORS",
  });
  assert.throws(() => parse(" "), { code: "EMPTY_SOURCE" });
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
});

test("line limit accepts a final newline and still rejects a 201st line", () => {
  const atLimit = Array.from({ length: LIMITS.lines }, () => "digit").join("\n");
  assert.equal(parse(`${atLimit}\n`).nodes.length, LIMITS.lines);

  for (const source of [`${atLimit}\ndigit\n`, `${atLimit}\n\n`]) {
    assert.throws(
      () => parse(source),
      (error) => error.code === "LINE_LIMIT" && error.line === LIMITS.lines + 1,
    );
  }
});

test("diagnostic columns count UTF-16 code units", () => {
  assert.throws(
    () => parse(`a "😀" ${LIMITS.repetition + 1} times`),
    (error) => {
      assert.ok(error instanceof CompileError);
      assert.equal(error.code, "REPETITION_LIMIT");
      assert.equal(error.line, 1);
      assert.equal(error.column, 8);
      return true;
    },
  );
});

test("keywords ignore case and blank lines while retaining literal case", () => {
  const result = parse(
    '  AT THE BEGINNING OF THE INPUT\r\n\r\n I AM LOOKING FOR A "AbC"  \r\nend of the input',
  );
  assert.equal(result.nodes.length, 3);
  assert.equal(result.nodes[1].value, "AbC");
  assert.equal(result.nodes[1].location.line, 3);
});
