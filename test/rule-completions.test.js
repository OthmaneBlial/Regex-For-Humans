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
  assert.equal(ruleCompletions("", 0).length, SHORTHAND_RULES.length + 8);
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

test("closed nested captures supply numbered and Unicode named references while their parent is open", () => {
  const source = 'start\ncapture "outer" {\n  capture "字" {\n    "😀"\n  }\n  same as ca\n}\nend';
  const caret = source.indexOf("\n}");
  const choices = ruleCompletions(source, caret, { flags: "du" });
  assert.deepEqual(
    choices.map((item) => item.text),
    ["same as capture 2", 'same as capture "字"'],
  );
  const choice = choose(source, caret, 'same as capture "字"', "du");
  const native = toRegExp(compile(choice.rules, { flags: "du" }));
  const match = native.exec("😀😀");
  assert(match);
  assert.equal(match.groups.outer, "😀😀");
  assert.equal(match.groups.字, "😀");
  assert.deepEqual(match.indices.groups.字, [0, 2]);
  assert.deepEqual(match.indices.groups.outer, [0, 4]);
  assert.equal(native.test("😀😃"), false);
  assert(
    compile(choice.rules).segments.some(
      (node) => node.kind === "backreference" && node.captureIndex === 2,
    ),
  );
  for (const bad of [
    'same as ca\ncapture {\n"A"\n}',
    'capture "open" {\n  same as ca\n}',
    'capture "open" {\n  same as ca',
  ]) {
    assert.deepEqual(ruleCompletions(bad, bad.indexOf("same as ca") + "same as ca".length), []);
  }
});

test("numeric reference prefixes complete multi-digit indices without changing existing targets", () => {
  const captures = [..."ABCDEFGHIJ"]
    .map((letter) => `capture "${letter}" {\n  "${letter}"\n}`)
    .join("\n");
  const source = `start\n${captures}\nsame as capture 1\n"0"\nsame as capture "A"\nend`;
  const caret = source.indexOf('\n"0"');
  const choices = ruleCompletions(source, caret, { flags: "du" });
  assert.deepEqual(
    choices.map((item) => item.text),
    ["same as capture 10"],
  );
  const choice = choices[0];
  assert.equal(choice.rules, source.replace("same as capture 1\n", "same as capture 10\n"));
  const native = toRegExp(compile(choice.rules, { flags: "du" }));
  const match = native.exec("ABCDEFGHIJJ0A");
  assert(match);
  assert.equal(match[10], "J");
  assert.deepEqual(match.indices[10], [9, 10]);
  assert.equal(match.groups.A, "A");
  assert.equal(native.test("ABCDEFGH IJJ0A"), false);
  assert.equal(native.test("ABCDEFGHIJA0A"), false);
});

test("reference completion keeps quote-aware locations, all separators, repetition and existing captures", () => {
  const value = `😀${"\u2028".repeat(7)}A`;
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    const source = [
      "start",
      'capture "earlier" {',
      `  ${JSON.stringify(value)}`,
      "}",
      "  2 same as ca",
      'capture "later" {',
      '  "Z"',
      "}",
      "end",
    ].join(separator);
    const caret = source.indexOf(`${separator}capture "later"`);
    const choices = ruleCompletions(source, caret, { flags: "du" });
    assert.deepEqual(
      choices.map((item) => item.text),
      ["same as capture 1", 'same as capture "earlier"'],
    );
    const choice = choose(source, caret, 'same as capture "earlier"', "du");
    assert.equal(choice.rules, source.replace("same as ca", 'same as capture "earlier"'));
    assert.equal(choice.caret, caret + 'same as capture "earlier"'.length - "same as ca".length);
    const match = toRegExp(compile(choice.rules, { flags: "du" })).exec(`${value.repeat(3)}Z`);
    assert(match);
    assert.deepEqual([match.groups.earlier, match.groups.later], [value, "Z"]);
    assert.deepEqual(match.indices.groups.earlier, [0, value.length]);
    assert.deepEqual(match.indices.groups.later, [value.length * 3, value.length * 3 + 1]);
  }
});

test("reference proposals preserve native absent and empty participation in optional, alternative and assertion captures", () => {
  const bodies = [
    ['optional capture "value" {\n  "A"\n}\n"X"', "X", undefined],
    ['capture "value" {\n  optional "A"\n}\n"X"', "X", ""],
    ['either {\n  capture "value" {\n    "A"\n  }\n  "B"\n}', "B", undefined],
    ['not followed by {\n  capture "value" {\n    "B"\n  }\n}\n"A"', "A", undefined],
  ];
  for (const [body, input, expected] of bodies) {
    const source = `start\n${body}\nsame as ca\nend`;
    const choice = choose(source, source.indexOf("\nend"), 'same as capture "value"', "du");
    const match = toRegExp(compile(choice.rules, { flags: "du" })).exec(input);
    assert(match);
    assert.equal(match.groups.value, expected);
    assert.deepEqual(match.indices.groups.value, expected === "" ? [0, 0] : undefined);
  }
});

test("reference discovery is bounded by the existing capture/source budgets and rejects invalid surroundings", () => {
  const letters = Array.from({ length: 60 }, (_, index) => String.fromCharCode(65 + (index % 26)));
  const source = `start\n${letters.map((letter, index) => `capture "field${index}" {\n  "${letter}"\n}`).join("\n")}\nsame as ca\nend`;
  const caret = source.indexOf("\nend");
  const choices = ruleCompletions(source, caret);
  assert.equal(choices.length, 120);
  assert.equal(new Set(choices.map((item) => item.rules)).size, choices.length);
  for (const choice of choices) {
    assert(choice.rules.length <= LIMITS.sourceLength);
    assert.equal(
      compile(choice.rules).segments.filter(
        (node) => node.kind === "group" && node.edge === "start" && node.capturing,
      ).length,
      60,
    );
  }
  const native = toRegExp(compile(choose(source, caret, "same as capture 60").rules));
  assert.equal(native.test(letters.join("") + letters.at(-1)), true);
  assert.equal(native.test(letters.join("") + letters[0]), false);
  for (const invalid of [
    source.replace('"A"', "unknown"),
    source.replace("same as ca", "character class: same as ca"),
    `${source}\n${" ".repeat(LIMITS.sourceLength)}`,
  ]) {
    assert.deepEqual(ruleCompletions(invalid, invalid.indexOf("\nend")), []);
  }
});
