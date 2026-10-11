import assert from "node:assert/strict";
import test from "node:test";
import { compile, toRegExp } from "../index.js";
import { LIMITS, SHORTHAND_RULES } from "../src/parser.js";
import { ruleCompletions } from "../web/rule-completions.js";

function choose(source, caret, text, flags = "u") {
  const choice = ruleCompletions(source, caret, { flags }).find((item) => item.text === text);
  assert(choice, `Expected ${text} in ${JSON.stringify(source)} at ${caret}`);
  return choice;
}

test("suggestions derive from every parser shorthand and compile in a full document", () => {
  assert(Object.isFrozen(SHORTHAND_RULES));
  for (const text of SHORTHAND_RULES) {
    const partial = text.slice(0, -1);
    const source = `start\n${partial}\nend`;
    const choice = choose(source, 6 + partial.length, text);
    assert.equal(choice.rules, `start\n${text}\nend`);
    assert.equal(choice.caret, 6 + text.length);
    toRegExp(compile(choice.rules));
  }
});

test("completion respects counts, negation, lazy repetition and class member context", () => {
  for (const [prefix, positive] of [
    ["between 2 and 5 ", "123"],
    ["3 ", "123"],
    ["optional ", "1"],
    ["lazy one or more ", "123"],
  ]) {
    const source = `start\n${prefix}di\nend`;
    const choice = choose(source, source.indexOf("\nend"), "digits");
    const native = toRegExp(compile(choice.rules));
    assert.equal(native.test(positive), true);
    assert.equal(native.test("abc"), false);
  }
  const negated = choose("not wo", 6, "not word");
  assert.equal(toRegExp(compile(negated.rules)).test("!"), true);
  assert.equal(toRegExp(compile(negated.rules)).test("A"), false);
  const members = ruleCompletions("character class: di", 19);
  assert(members.some((item) => item.text === "digit"));
  assert(!members.some((item) => item.text === "digits"));
});

test("native UTF-16 positions retain every line separator, indentation, literals and capture references", () => {
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    const prefix = ['# ignored "', "start", 'capture "emoji" {', '  "😀"', "}"].join(separator);
    const source = `${prefix}${separator}  between 2 and 4 pa${separator}same as capture 1${separator}end`;
    const caret = source.indexOf(`${separator}same as`);
    const choice = choose(source, caret, "path segment characters", "div");
    assert.equal(
      choice.rules,
      source.slice(0, caret - 2) + "path segment characters" + source.slice(caret),
    );
    const native = toRegExp(compile(choice.rules, { flags: "div" }));
    const match = native.exec("😀abcd😀");
    assert(match);
    assert.equal(match.groups.emoji, "😀");
    assert.deepEqual(match.indices.groups.emoji, [0, 2]);
    assert.equal(match[1], "😀");
    native.lastIndex = 0;
    assert.equal(native.test("😀a/b😀"), false);
    native.lastIndex = 0;
    assert.equal(native.test("😀abcd😃"), false);
  }
});

test("completion replaces the remaining word at the cursor without changing surrounding tokens", () => {
  const source = "start\n  between 2 and 5 digt\nend";
  const caret = source.indexOf("digt") + 2;
  const choice = choose(source, caret, "digits");
  assert.equal(choice.rules, "start\n  between 2 and 5 digits\nend");
  const uppercase = choose("HEX DI", 6, "hex digits");
  assert.equal(uppercase.rules, "hex digits");
  for (const item of ruleCompletions("not wo", 6)) toRegExp(compile(item.rules));
});

test("quoted text, capture names, unfinished quotes and comments never get suggestions", () => {
  for (const source of [
    '"digits"',
    '"di',
    'capture "digits" {\n digit\n}',
    'group with flags "i" {\n digit\n}',
    '# digits "',
  ]) {
    const position =
      source.indexOf("digits") >= 0 ? source.indexOf("digits") + 2 : source.indexOf('"') + 2;
    assert.deepEqual(ruleCompletions(source, position), []);
  }
  assert.deepEqual(ruleCompletions('"😀\ndi"', 6), []);
  const source = '# unfinished "\nstart\ndi\nend';
  assert.equal(choose(source, source.indexOf("\nend"), "digits").text, "digits");
});

test("empty rules accept atoms, while invalid surrounding rules and budgets reject every proposal", () => {
  assert.equal(ruleCompletions("", 0).length, SHORTHAND_RULES.length);
  for (const source of [
    "start\nunknown\ndi\nend",
    "capture {\ndi",
    "end\ndi",
    "di" + " ".repeat(LIMITS.sourceLength),
    "#\n".repeat(LIMITS.lines) + "di",
  ]) {
    assert.deepEqual(ruleCompletions(source, source.length), []);
  }
  assert.deepEqual(ruleCompletions("di", 2, { flags: "zz" }), []);
  assert.deepEqual(ruleCompletions("digits", 6), []);
});

test("completion validates caller types and never offers the same rewritten document twice", () => {
  assert.throws(() => ruleCompletions(null, 0), TypeError);
  for (const caret of [-1, 3, 1.5, NaN, "1"])
    assert.throws(() => ruleCompletions("di", caret), TypeError);
  const choices = ruleCompletions("not wo", 6);
  assert.equal(new Set(choices.map((item) => item.rules)).size, choices.length);
});
