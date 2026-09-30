import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CompileError } from "../src/diagnostics.js";
import { LIMITS, parse } from "../src/parser.js";

const scenarios = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("empty literals suggest whole-input anchors without changing diagnostic locations", () => {
  for (const prefix of ["", "3 ", "between 0 and 1 ", "start ", "start, 2 ", "line start "]) {
    const line = `  ${prefix}""`;
    assert.throws(() => parse(`\n${line}`), {
      code: "EMPTY_LITERAL",
      message: "A literal cannot be empty.",
      line: 2,
      column: line.indexOf('""') + 1,
      hint: "Use `start` and `end` on separate lines to match an empty string.",
    });
  }
  assert.deepEqual(
    parse("start\nend").nodes.map(({ kind }) => kind),
    ["anchor", "anchor"],
  );
  assert.equal(parse('" "').nodes[0].value, " ");
  assert.throws(() => parse('one of: ""'), { code: "INVALID_CHARACTER" });
});

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

test("letter rules have explicit sequence defaults, counts and positioned errors", () => {
  for (const [rules, repetition] of [
    ["letter", null],
    ["letters", { kind: "oneOrMore" }],
    ["3 letters", { kind: "exact", min: 3 }],
    ["0 letter", { kind: "exact", min: 0 }],
    ["between 0 and 4 letters", { kind: "range", min: 0, max: 4 }],
  ]) {
    const node = parse(rules).nodes[0];
    assert.equal(node.atomType, "shorthand");
    assert.equal(node.value, "[A-Za-z]");
    assert.deepEqual(node.repetition, repetition, rules);
  }
  const line = "  START, Between\t02 And 4 LETTERS";
  const counted = parse(`\n${line}\nend`).nodes[1];
  assert.deepEqual(counted.location, { line: 2, column: line.indexOf("Between") + 1 });
  assert.deepEqual(counted.repetition, { kind: "range", min: 2, max: 4 });
  for (const [rules, code, marker] of [
    ["2 letter characters", "UNKNOWN_RULE", "letter"],
    ["letter 3 times", "UNKNOWN_RULE", "letter"],
    ["2 3 letters", "DUPLICATE_REPETITION", "3"],
    ["1001 letters", "REPETITION_LIMIT", "1001"],
    ["between 4 and 2 letters", "INVALID_RANGE", "2"],
  ]) {
    assert.throws(() => parse(rules), { code, line: 1, column: rules.indexOf(marker) + 1 }, rules);
  }
  assert.throws(() => parse("2 letter characters"), {
    hint: "Use `letter` for one ASCII letter or `letters` for one or more.",
  });
  assert.throws(() => parse("not letter"), { code: "UNKNOWN_RULE" });
});

test("hex rules have explicit repetition and positioned malformed-input errors", () => {
  assert.equal(parse("hex digit").nodes[0].value, "[0-9A-Fa-f]");
  assert.equal(parse("hex digit").nodes[0].repetition, null);
  assert.deepEqual(parse("hex digits").nodes[0].repetition, { kind: "oneOrMore" });
  const counted = parse("  start 6 HEX DIGITS\nend").nodes[1];
  assert.equal(counted.atomType, "shorthand");
  assert.equal(counted.value, "[0-9A-Fa-f]");
  assert.deepEqual(counted.repetition, { kind: "exact", min: 6 });
  assert.deepEqual(counted.location, { line: 1, column: 9 });
  assert.throws(() => parse("hex characters"), {
    code: "UNKNOWN_RULE",
    hint: "Use `hex digit` for one character or `hex digits` for one or more.",
  });
  for (const [rules, code, column] of [
    ["2 hex characters", "UNKNOWN_RULE", 3],
    ["2 3 hex digits", "DUPLICATE_REPETITION", 3],
    ["1001 hex digits", "REPETITION_LIMIT", 1],
    ["hex digits 3 times", "UNKNOWN_RULE", 1],
  ]) {
    assert.throws(() => parse(rules), { code, line: 1, column }, rules);
  }
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
  for (const [count, min] of [
    ["0", 0],
    ["0003", 3],
    ["1000", 1000],
  ]) {
    assert.deepEqual(parse(`${count} digits`).nodes[0].repetition, { kind: "exact", min });
  }
  assert.equal(parse('"1.5"').nodes[0].value, "1.5");
  assert.deepEqual(parse("one of: ٣, 3").nodes[0].value, ["٣", "3"]);
});

test("malformed numeric count tokens share positioned exact and bounded diagnostics", () => {
  for (const token of ["-1", "+3", "1.5", ".5", "1e2", "0x10", "1_000", "٣", "𝟛"]) {
    for (const line of [
      `  start ${token} digits`,
      `between ${token} and 4 digits`,
      `between 2 and ${token} digits`,
    ]) {
      assert.throws(
        () => parse(`\n${line}`),
        {
          code: "INVALID_REPETITION",
          message: "Counts must be nonnegative integers.",
          line: 2,
          column: line.indexOf(token) + 1,
          hint: "Write counts with digits 0–9 only, such as `3`.",
        },
        line,
      );
    }
  }
});

test("an exact count without an item reports its own location and a repair hint", () => {
  for (const [rules, line, column] of [
    ["3", 1, 1],
    ["start 3", 1, 7],
    ["digit\n  3", 2, 3],
    ["  line start, 03", 1, 15],
  ]) {
    assert.throws(
      () => parse(rules),
      {
        code: "INVALID_REPETITION",
        message: "A count needs an item.",
        line,
        column,
        hint: "Use `3 digits`, with the count before the item.",
      },
      rules,
    );
  }
});

test("bounded counts apply to one atom and retain the original location", () => {
  const line = "  START, Between\t02 And 4 HEX DIGITS";
  const node = parse(`\n${line}\nend`).nodes[1];
  assert.equal(node.value, "[0-9A-Fa-f]");
  assert.deepEqual(node.repetition, { kind: "range", min: 2, max: 4 });
  assert.deepEqual(node.location, { line: 2, column: line.indexOf("Between") + 1 });
  for (const [min, max] of [
    [0, 0],
    [0, 1],
    [3, 3],
    [0, 1000],
  ]) {
    assert.deepEqual(parse(`between ${min} and ${max} digit`).nodes[0].repetition, {
      kind: "range",
      min,
      max,
    });
  }
});

test("bounded count errors point to invalid bounds or incomplete syntax", () => {
  for (const [rules, code, marker] of [
    ["start between 4 and 2 digits", "INVALID_RANGE", "2"],
    ["between -1 and 4 digits", "INVALID_REPETITION", "-1"],
    ["between 1.5 and 4 digits", "INVALID_REPETITION", "1.5"],
    ["between two and 4 digits", "INVALID_REPETITION", "two"],
    ["between 2 and -4 digits", "INVALID_REPETITION", "-4"],
    ["between 2 and 0x4 digits", "INVALID_REPETITION", "0x4"],
    ["between 2 and Infinity digits", "INVALID_REPETITION", "Infinity"],
    ["between 1001 and 1002 digits", "REPETITION_LIMIT", "1001"],
    ["between 2 and 1001 digits", "REPETITION_LIMIT", "1001"],
    ["between 2 and 9007199254740992 digits", "REPETITION_LIMIT", "9007199254740992"],
    ["between 2 to 4 digits", "INVALID_REPETITION", "between"],
    ["between 2 and 4", "INVALID_REPETITION", "between"],
  ]) {
    assert.throws(
      () => parse(rules),
      {
        code,
        line: 1,
        column: rules.indexOf(marker) + 1,
      },
      rules,
    );
  }
});

test("bounded counts preserve duplicate, anchor and atom diagnostics", () => {
  for (const [rules, code, marker] of [
    ["between 2 and 4 3 digits", "DUPLICATE_REPETITION", "3 digits"],
    ["3 between 2 and 4 digits", "DUPLICATE_REPETITION", "between"],
    ["between 2 and 4 between 1 and 3 digits", "DUPLICATE_REPETITION", "between 1"],
    ["between 2 and 4 line start", "ANCHOR_REPETITION", "line start"],
    ["start between 2 and 4 end", "ANCHOR_REPETITION", "end"],
    ["between 2 and 4 any text", "DUPLICATE_REPETITION", "any text"],
    ["between 2 and 4 text without: a", "DUPLICATE_REPETITION", "text without"],
    [String.raw`between 2 and 4 "bad\q"`, "INVALID_QUOTE", "\\q"],
    ['between 2 and 4 ""', "EMPTY_LITERAL", '""'],
    ['between 2 and 4 "A" extra', "TRAILING_TEXT", "extra"],
    ["between 2 and 4 one of: a, bc", "INVALID_CHARACTER", "bc"],
    ["between 2 and 4 hex characters", "UNKNOWN_RULE", "hex"],
  ]) {
    assert.throws(
      () => parse(rules),
      {
        code,
        line: 1,
        column: rules.indexOf(marker) + 1,
      },
      rules,
    );
  }
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
  for (const [rules, marker] of [
    ["3 4 digits", "4"],
    ["3 +2 digits", "+2"],
    ["3 1.5 digits", "1.5"],
    ["between 2 and 4 ٣ digits", "٣"],
    ["3 4", "4"],
  ]) {
    assert.throws(
      () => parse(rules),
      {
        code: "DUPLICATE_REPETITION",
        line: 1,
        column: rules.indexOf(marker) + 1,
      },
      rules,
    );
  }
});

test("counted instruction errors point past the count", () => {
  const cases = [
    [String.raw`3 "bad\q"`, "INVALID_QUOTE", "\\q"],
    ['3 ""', "EMPTY_LITERAL", '""'],
    ['3 "A"  extra', "TRAILING_TEXT", "extra"],
    ["3 one of: a, bc", "INVALID_CHARACTER", "bc"],
    ["3 surprise phrase", "UNKNOWN_RULE", "surprise"],
  ];
  for (const [rules, code, marker] of cases) {
    assert.throws(
      () => parse(rules),
      (error) =>
        error instanceof CompileError &&
        error.code === code &&
        error.column === rules.indexOf(marker) + 1,
      rules,
    );
  }
});

test("counts on anchors point to the anchor", () => {
  for (const [rules, line, column] of [
    ["3 start", 1, 3],
    ["3 end", 1, 3],
    ["2 line start", 1, 3],
    ["start 3 end", 1, 9],
    ["line start\n2 line end", 2, 3],
  ]) {
    assert.throws(
      () => parse(rules),
      (error) =>
        error instanceof CompileError &&
        error.code === "ANCHOR_REPETITION" &&
        error.line === line &&
        error.column === column &&
        error.message === "Counts apply to items, not anchors." &&
        error.hint === "Remove the count or apply it to an item, such as `3 digits`.",
      rules,
    );
  }
});

test("unsupported quote delimiters retain positioned errors and offer a JSON quote hint", () => {
  const quotes = ["'ABC'", "`ABC`", "“ABC”", "”ABC”", "‘ABC’", "’ABC’"];
  const hint = 'Use JSON double quotes for quoted text, such as `"A"`.';
  for (const value of quotes) {
    for (const prefix of ["", "start ", "0 ", "between 0 and 1 ", "start 2 ", "line start, 2 "]) {
      const line = `  ${prefix}${value}`;
      assert.throws(() => parse(`\n${line}`), {
        code: "UNKNOWN_RULE",
        line: 2,
        column: line.indexOf(value) + 1,
        hint,
      });
    }
    for (const prefix of ["one of: b, ", "none of: b, ", "text without: b, "]) {
      const line = `  ${prefix}${value}`;
      assert.throws(() => parse(`\n${line}`), {
        code: "INVALID_CHARACTER",
        line: 2,
        column: line.indexOf(value) + 1,
        hint,
      });
    }
    assert.equal(parse(JSON.stringify(value)).nodes[0].value, value);
    assert.throws(
      () => parse(`one of: ${JSON.stringify(value)}`),
      (error) => error.code === "INVALID_CHARACTER" && error.hint === undefined,
    );
  }
  assert.deepEqual(parse("one of: ', `, “, ”, ‘, ’").nodes[0].value, [
    "'",
    "`",
    "“",
    "”",
    "‘",
    "’",
  ]);
});

test("quoted literal and character-list items keep punctuation as data", () => {
  assert.equal(parse('"a.b"').nodes[0].value, "a.b");
  assert.deepEqual(parse('one of: "]", "-", ",", "\\\\"').nodes[0].value, ["]", "-", ",", "\\"]);
  for (const trailing of ["   ", "\t ", "\u00a0 "]) {
    const literal = parse(`  start 2 "😀 "${trailing}`).nodes[1];
    assert.equal(literal.value, "😀 ");
    assert.equal(literal.text, '2 "😀 "');
    assert.deepEqual(literal.location, { line: 1, column: 9 });
    const list = parse(`  start one of: "a", "😀"${trailing}`).nodes[1];
    assert.deepEqual(list.value, ["a", "😀"]);
    assert.equal(list.text, 'one of: "a", "😀"');
  }
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
  for (const prefix of [
    "",
    "start ",
    "start 2 ",
    "start between 0 and 4 ",
    "one of: a, ",
    "none of: a, ",
    "text without: a, ",
  ]) {
    for (const trailing of ["   ", "\u00a0 ", "\u2003 "]) {
      const line = `  ${prefix}"😀${trailing}`;
      assert.throws(() => parse(`\n${line}`), {
        code: "INVALID_QUOTE",
        message: "Missing closing double quote.",
        line: 2,
        column: line.length + 1,
      });
    }
    for (const control of ["\t", "\r", "\n", "\v", "\f"]) {
      const line = `  ${prefix}"😀${control} `;
      assert.throws(() => parse(`\n${line}`), {
        code: "INVALID_QUOTE",
        message: "Escape control characters inside quoted values.",
        line: 2,
        column: line.indexOf(control) + 1,
      });
    }
  }
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
