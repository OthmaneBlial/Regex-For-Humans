import assert from "node:assert/strict";
import test from "node:test";
import { CompileError, compile, toRegExp } from "../index.js";

// Each documented instruction has a matching example, a counterexample and
// a nearby malformed spelling that must fail instead of partially compiling.
const constructions = [
  [
    "input start",
    'at the beginning of the input\na "A"',
    "A",
    "BA",
    "at the beginning of the input extra",
  ],
  ["input end", 'a "A"\nend of the input', "A", "AB", "end of the input extra"],
  [
    "line start",
    'at the beginning of a line\na "A"',
    "B\nA",
    "BA",
    "at the beginning of a line extra",
  ],
  ["line end", 'a "A"\nend of the line', "A\nB", "AB", "end of the line extra"],
  ["wildcard", "any character", "A", "\n", "any characters"],
  ["word", "word", "_", "-", "alphanumeric characters"],
  ["not word", "not word", "é", "A", "non-alphanumeric characters"],
  ["digit", "digit character", "3", "A", "digit characters"],
  ["not digit", "non-digit character", "A", "3", "non-digit characters"],
  ["space", "any whitespace", "\n", "A", "some whitespace"],
  ["not space", "non-whitespace character", "A", " ", "non-whitespace characters"],
  ["literal", 'a "ABC"', "ABC", "ABX", 'a "ABC" extra'],
  ["set", "any of the following characters: a, b, c", "b", "d", "any of the following characters:"],
  [
    "not set",
    "anything except the following characters: a, b, c",
    "d",
    "b",
    "anything except the following characters:",
  ],
];

for (const [name, rules, yes, no, malformed] of constructions) {
  test(`language contract: ${name}`, () => {
    const regex = toRegExp(compile(rules));
    assert.equal(regex.test(yes), true, name);
    assert.equal(regex.test(no), false, name);
    assert.throws(() => compile(malformed), CompileError, name);
  });
}

test("misleading alphanumeric labels are rejected", () => {
  for (const phrase of ["alphanumeric character", "non-alphanumeric character"]) {
    assert.throws(() => compile(phrase), { code: "UNKNOWN_RULE" }, phrase);
  }
});

test("articles only prefix quoted literals", () => {
  assert.equal(compile('a "A"').source, "A");
  assert.equal(compile('an "A"').source, "A");
  for (const phrase of ["a digit", "an digit"]) {
    assert.throws(() => compile(phrase), { code: "UNKNOWN_RULE" }, phrase);
  }
});

test("compact phrases compile precisely and retain useful source locations", () => {
  const examples = [
    ["start 3 digits\nend", "^\\d{3}$", "123", "12"],
    ['start "ABC"\n3 digits\nend', "^ABC\\d{3}$", "ABC123", "ABC12"],
    ['line start\n3 "AB"\nline end', "^(?:AB){3}$", "ABABAB", "ABAB"],
    ['"ABC"', "ABC", "ABC", "ABX"],
    ["digits", "\\d+", "123", "abc"],
    ["word", "\\w", "_", "-"],
    ["not word", "\\W", "-", "A"],
    ["digit", "\\d", "3", "A"],
    ["not digit", "\\D", "A", "3"],
    ["space", "\\s", " ", "A"],
    ["not space", "\\S", "A", " "],
    ["one of: a, b", "[ab]", "b", "c"],
    ["none of: a, b", "[^ab]", "c", "b"],
  ];

  for (const [rules, source, yes, no] of examples) {
    const result = compile(rules);
    assert.equal(result.source, source, rules);
    assert.equal(toRegExp(result).test(yes), true, rules);
    assert.equal(toRegExp(result).test(no), false, rules);
  }

  const result = compile("start 3 digits\nend");
  assert.deepEqual(
    result.segments.slice(0, 2).map(({ text, line, column }) => ({ text, line, column })),
    [
      { text: "start", line: 1, column: 1 },
      { text: "3 digits", line: 1, column: 7 },
    ],
  );
  assert.throws(() => compile("start 3 digits extra"), CompileError);
});

test("short text rules replace verbose wildcard and character exclusions", () => {
  const anyText = compile("any text");
  assert.equal(anyText.source, ".*");
  assert.equal(toRegExp(anyText).exec("hello")?.[0], "hello");
  assert.equal(toRegExp(anyText).exec("")?.[0], "");

  const without = compile("start\ntext without: a, b\nend");
  assert.equal(without.source, "^[^ab]*$");
  const regex = toRegExp(without);
  assert.equal(regex.test("xyz"), true);
  assert.equal(regex.test(""), true);
  assert.equal(regex.test("cab"), false);
  assert.throws(() => compile("any text 3 times"), { code: "DUPLICATE_REPETITION" });
  assert.throws(() => compile("text without: a, b 3 times"), { code: "DUPLICATE_REPETITION" });
});

const repetitions = [
  ["any number of times", "", "AAA", "B", "any numbers of times"],
  ["at least one time", "A", "AAA", "", "at least one times"],
  ["at most one time", "", "A", "AA", "at most one times"],
  ["3 times", "AAA", "AAA", "AA", "-3 times"],
  ["between 2 and 4 times", "AA", "AAAA", "A", "between 4 and 2 times"],
  ["at least 3 times", "AAA", "AAAA", "AA", "at least -3 times"],
];

for (const [phrase, first, second, no, malformed] of repetitions) {
  test(`repetition contract: ${phrase}`, () => {
    const rules = `at the beginning of the input\na "A" ${phrase}\nend of the input`;
    const regex = toRegExp(compile(rules));
    assert.equal(regex.test(first), true, phrase);
    assert.equal(regex.test(second), true, phrase);
    assert.equal(regex.test(no), false, phrase);
    assert.throws(() => compile(`a "A" ${malformed}`), CompileError, phrase);
  });
}

test("literal and set escaping preserve arbitrary Unicode scalars", () => {
  let state = 0x12_34_56_78;
  for (let count = 0; count < 300; count += 1) {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    const point = state % 0x110000;
    if (point >= 0xd800 && point <= 0xdfff) continue;
    const character = String.fromCodePoint(point);
    const quoted = JSON.stringify(character);
    const literal = toRegExp(
      compile(`at the beginning of the input\na ${quoted}\nend of the input`),
    );
    assert.equal(literal.test(character), true, `literal U+${point.toString(16)}`);
    assert.equal(literal.test(`${character}x`), false, `literal suffix U+${point.toString(16)}`);
    const set = toRegExp(compile(`any of the following characters: ${quoted}`));
    assert.equal(set.test(character), true, `set U+${point.toString(16)}`);
  }
});

test("metacharacters and controls remain data in literals and sets", () => {
  for (const character of [
    "\\",
    "[",
    "]",
    "-",
    "^",
    "$",
    "*",
    "+",
    "?",
    ".",
    "(",
    ")",
    "|",
    "/",
    "\n",
    "\r",
    "\t",
    "\u2028",
    "\u2029",
    "😀",
  ]) {
    const quoted = JSON.stringify(character);
    const literal = toRegExp(
      compile(`at the beginning of the input\na ${quoted}\nend of the input`),
    );
    assert.equal(literal.test(character), true, `literal ${quoted}`);
    const set = toRegExp(compile(`any of the following characters: ${quoted}`));
    assert.equal(set.test(character), true, `set ${quoted}`);
    const negativeSet = toRegExp(compile(`anything except the following characters: ${quoted}`));
    assert.equal(negativeSet.test(character), false, `negative set ${quoted}`);
  }
});
