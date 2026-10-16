import assert from "node:assert/strict";
import test from "node:test";
import { compile, toRegExp } from "../index.js";
import { LIMITS } from "../src/parser.js";
import { completeBlock } from "../web/insert-rule.js";
import { ruleCompletions } from "../web/rule-completions.js";
import { flagSets } from "./fixtures/unicode-set-corpus.js";

const counts = [
  ["0 ", "{0}"],
  ["1 ", "{1}"],
  ["3 ", "{3}"],
  ["optional ", "{0,1}"],
  ["zero or more ", "*"],
  ["one or more ", "+"],
  ["at least 2 ", "{2,}"],
  ["between 1 and 3 ", "{1,3}"],
  ["between 2 and 2 ", "{2,2}"],
];
const repetitions = counts.flatMap(([text, native]) => [
  [text, native],
  [`lazy ${text}`, `${native}?`],
]);
const blocks = [
  ["group {", String.raw`(?:\d)`, "digit"],
  ["capture {", String.raw`(\d)`, "digit"],
  ["either {", "(?:A|B)", '"A"'],
  ["character set union {", "[AB]", '"A"'],
  ["not character set union {", "[^AB]", '"A"'],
  ["character set intersection {", "[[A-Z]&&[AEIOU]]", 'range "A" to "Z"'],
  ["not character set intersection {", "[^[[A-Z]&&[AEIOU]]]", 'range "A" to "Z"'],
  ["character set subtraction {", "[[A-Z]--[AEIOU]]", 'range "A" to "Z"'],
  ["not character set subtraction {", "[^[[A-Z]--[AEIOU]]]", 'range "A" to "Z"'],
];

function choose(source, caret, text, flags = "du") {
  const choice = ruleCompletions(source, caret, { flags }).find((item) => item.text === text);
  assert(choice, `Expected ${JSON.stringify(text)} in ${JSON.stringify(source)}`);
  return choice;
}

test("repeated block completions retain native greedy/lazy captures, references, spans and cursors", () => {
  let comparisons = 0;
  for (const [text, pattern, operand] of blocks) {
    const flags = text.includes("set ")
      ? flagSets
      : [...flagSets, ...flagSets.map((flags) => flags.replace("v", "u"))];
    for (const [modifier, quantifier] of repetitions)
      for (const options of flags) {
        const source = `capture "context" {\n  ${modifier}${text.slice(0, -2)}\n}\ncapture "kept" {\n "A"\n}\nsame as capture 2`;
        const choice = choose(source, source.indexOf("\n}"), modifier + text, options);
        const optionalGroup = text === "group {" && /^(?:lazy )?optional $/u.test(modifier);
        assert(choice.rules.slice(choice.caret).startsWith(optionalGroup ? '"A"' : operand));
        const target = text === "capture {" ? 3 : 2;
        assert(choice.rules.endsWith(`same as capture ${target}`));
        assert.equal(choice.preview, choice.rules);
        const actual = toRegExp(compile(choice.rules, { flags: options }));
        const native = new RegExp(
          `(?<context>${optionalGroup ? "(?:A)" : pattern}${quantifier})(?<kept>A)\\${target}`,
          options,
        );
        for (const input of [
          "",
          "AA",
          "1AA",
          "123AA",
          "1111AA",
          "BAA",
          "ABAA",
          "aAA",
          "KAA",
          "😀AA",
          "\nAA",
          "11AA11AA",
        ])
          for (const cursor of [0, 1, 2]) {
            actual.lastIndex = cursor;
            native.lastIndex = cursor;
            for (let step = 0; step < 2; step++) {
              assert.deepEqual(
                actual.exec(input),
                native.exec(input),
                `${modifier}${text}/${options}`,
              );
              assert.equal(actual.lastIndex, native.lastIndex);
              comparisons++;
            }
          }
      }
  }
  assert.equal(comparisons, 995_328);
});

test("quantified capture completion preserves exact modifiers, logical separators and outer arity", () => {
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    const modifier = "LAZY\tbetween\t1\tand\t3\t";
    const source = [
      '"😀\u2028"',
      "either {",
      `\t${modifier}ca # kept <img onerror=alert(1)>`,
      '  "B"',
      "}",
      'capture "kept" {',
      ' "A"',
      "}",
      "same as capture 1",
    ].join(separator);
    const choice = choose(source, source.indexOf(" # kept"), `${modifier}capture {`);
    assert(choice.rules.includes(`\t${modifier}capture {${separator}\t  digit`));
    assert(choice.rules.includes(`${separator}\t# kept <img onerror=alert(1)>${separator}`));
    assert(choice.rules.startsWith(`"😀\u2028"${separator}`));
    assert(choice.rules.endsWith("same as capture 2"));
    assert(choice.rules.slice(choice.caret).startsWith("digit"));
    assert.deepEqual(
      [...toRegExp(compile(choice.rules)).exec("😀\u2028111AA")],
      ["😀\u2028111AA", "1", "A"],
    );
  }
});

test("optional template aliases have one header and retain their established sample body", () => {
  for (const [prefix, modifier] of [
    ["optional ", "optional "],
    ["optional gro", "optional "],
    ["OPTIONAL", "OPTIONAL "],
    ["OPTIONAL gro", "OPTIONAL "],
    ["OPTIONAL\tgro", "OPTIONAL\t"],
    ["lazy OPTIONAL\tgro", "lazy OPTIONAL\t"],
    ["lazy optional gro", "lazy optional "],
  ]) {
    const choices = ruleCompletions(prefix, prefix.length);
    const headers = choices.filter((item) => item.text.includes("{"));
    assert.equal(
      new Set(headers.map((item) => item.text.toLowerCase().replace(/[\t ]+/gu, " "))).size,
      headers.length,
    );
    const group = headers.find((item) =>
      /^(?:lazy )?optional group \{$/iu.test(item.text.replace(/[\t ]+/gu, " ")),
    );
    assert(group);
    assert(group.rules.slice(group.caret).startsWith('"A"'));
    assert(group.rules.startsWith(`${modifier}group {`));
    assert.equal(group.text, `${modifier}group {`);
  }
});

test("only valid repeated block contexts pass the existing parser and compiler guards", () => {
  for (const source of [
    "lazy gro",
    "3 optional cap",
    "optional 2 cap",
    "lazy lazy 2 cap",
    "between 5 and 2 cap",
    "between one and 2 cap",
    "at least -1 cap",
    "1.5 cap",
    `${LIMITS.repetition + 1} cap`,
    "start 2 cap",
    "digit 2 cap",
    "character class: 2 cap",
    "2 followed b",
    "lazy 2 not followed b",
    '"2 cap"',
    "# 2 cap",
    "end\n2 cap",
    "unknown\n2 cap",
    "group {\n2 cap",
    "character set union {\n2 character se\n}",
    `${"#\n".repeat(LIMITS.lines - 2)}2 cap`,
    `${"group {\n".repeat(LIMITS.groupDepth)}2 cap\n${"}\n".repeat(LIMITS.groupDepth)}`,
  ]) {
    const caret = source.includes("\n}") ? source.indexOf("\n}") : source.length;
    assert(
      !ruleCompletions(source, caret, { flags: "v" }).some((c) => c.text.includes("{")),
      source,
    );
  }
  assert.deepEqual(ruleCompletions("2 cap", 5, { flags: "uv" }), []);
  assert(!ruleCompletions("2 character se", 14).some((c) => c.text.includes("set ")));
});

test("block completion keeps the supplied existing modifier inside its validated range", () => {
  for (const modifier of [null, 2, "3 ", "2 gro extra"])
    assert.throws(() => completeBlock("2 gro", 0, 5, "group", {}, modifier), TypeError);
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"])
    assert.throws(
      () => completeBlock(`${separator}gro`, 0, separator.length + 3, "group", {}, separator),
      TypeError,
    );
  assert.equal(completeBlock("2 gro", 0, 5, "group", {}, "2 ").rules, "2 group {\n  digit\n}\n");
});
