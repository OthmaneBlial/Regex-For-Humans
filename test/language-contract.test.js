import assert from "node:assert/strict";
import test from "node:test";
import { CompileError, compile, toRegExp } from "../index.js";

const constructions = [
  ["input start", 'start\n"A"', "A", "BA", "start extra"],
  ["input end", '"A"\nend', "A", "AB", "end extra"],
  ["line start", 'line start\n"A"', "B\nA", "BA", "line start extra"],
  ["line end", '"A"\nline end', "A\nB", "AB", "line end extra"],
  ["wildcard", "any character", "A", "\n", "any characters"],
  ["word", "word", "_", "-", "alphanumeric character"],
  ["not word", "not word", "é", "A", "non-alphanumeric character"],
  ["digit", "digit", "3", "A", "digit character"],
  ["not digit", "not digit", "A", "3", "non-digit character"],
  ["hex digit", "hex digit", "f", "g", "hex character"],
  ["hex digits", "hex digits", "09aF", "g", "hex digits extra"],
  ["space", "space", "\n", "A", "any whitespace"],
  ["not space", "not space", "A", " ", "non-whitespace character"],
  ["literal", '"ABC"', "ABC", "ABX", 'a "ABC"'],
  ["set", "one of: a, b, c", "b", "d", "any of the following characters: a, b, c"],
  ["not set", "none of: a, b, c", "d", "b", "anything except the following characters: a, b, c"],
  ["unlimited digits", "digits", "123", "abc", "digit any number of times"],
  ["any text", "any text", "hello", "", "any character any number of times"],
  ["exact count", '3 "AB"', "ABABAB", "ABAB", 'three "AB"'],
  ["bounded count", 'between 2 and 4 "AB"', "ABABAB", "AB", 'two to four "AB"'],
];

for (const [name, rules, yes, no, legacy] of constructions) {
  test(`language contract: ${name}`, () => {
    const regex = toRegExp(compile(rules));
    assert.equal(regex.test(yes), true, name);
    if (no) assert.equal(regex.test(no), false, name);
    assert.throws(() => compile(legacy), { code: "UNKNOWN_RULE" }, legacy);
  });
}

test("the old verbose screenshot rules are rejected", () => {
  const oldExamples = [
    [
      "at the beginning of the input",
      "anything except the following characters: a, b, c, d any number of times",
      "end of the input",
    ].join("\n"),
    [
      "at the beginning of a line, I am looking for any character, any number of times",
      "I am looking for a digit character 3 times",
      "end of the line",
    ].join("\n"),
  ];
  for (const rules of oldExamples) assert.throws(() => compile(rules), CompileError);
});

test("counts are exact and must come before one atom", () => {
  assert.equal(compile("3 digits").source, "\\d{3}");
  assert.equal(compile("digits").source, "\\d+");
  assert.equal(compile("any text").source, ".*");
  assert.equal(compile("text without: a, b").source, "[^ab]*");
  for (const rules of [
    "digit 3 times",
    "digit between 2 and 4 times",
    "at least 3 times for digit",
    "digit any number of times",
    "3 4 digits",
  ]) {
    assert.throws(() => compile(rules), CompileError, rules);
  }
});

test("compact rules compile precisely and retain useful source locations", () => {
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

test("literal and set escaping preserve arbitrary Unicode scalars", () => {
  let state = 0x12_34_56_78;
  for (let count = 0; count < 300; count += 1) {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    const point = state % 0x110000;
    if (point >= 0xd800 && point <= 0xdfff) continue;
    const character = String.fromCodePoint(point);
    const quoted = JSON.stringify(character);
    const literal = toRegExp(compile(`start\n${quoted}\nend`));
    assert.equal(literal.test(character), true, `literal U+${point.toString(16)}`);
    assert.equal(literal.test(`${character}x`), false, `literal suffix U+${point.toString(16)}`);
    const set = toRegExp(compile(`one of: ${quoted}`));
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
    const literal = toRegExp(compile(`start\n${quoted}\nend`));
    assert.equal(literal.test(character), true, `literal ${quoted}`);
    const set = toRegExp(compile(`one of: ${quoted}`));
    assert.equal(set.test(character), true, `set ${quoted}`);
    const negativeSet = toRegExp(compile(`none of: ${quoted}`));
    assert.equal(negativeSet.test(character), false, `negative set ${quoted}`);
  }
});
