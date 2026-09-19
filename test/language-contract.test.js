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
  ["word", "alphanumeric character", "A", "-", "alphanumeric characters"],
  ["not word", "non-alphanumeric character", "-", "A", "non-alphanumeric characters"],
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
