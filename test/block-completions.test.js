import assert from "node:assert/strict";
import test from "node:test";
import { compile, toRegExp } from "../index.js";
import { LIMITS } from "../src/parser.js";
import { ruleCompletions } from "../web/rule-completions.js";

function choose(source, caret, text, flags = "du") {
  const result = ruleCompletions(source, caret, { flags }).find((item) => item.text === text);
  assert(result, `Expected ${text} in ${JSON.stringify(source)}`);
  return result;
}

test("balanced group and assertion completions agree with native captures and zero-width semantics", () => {
  for (const [text, nativeSource] of [
    ["group {", String.raw`(?:\d)`],
    ["capture {", String.raw`(\d)`],
    ["optional group {", "(?:A){0,1}"],
    ["either {", "(?:A|B)"],
    ["followed by {", String.raw`(?=\d)`],
    ["not followed by {", String.raw`(?!\d)`],
    ["preceded by {", String.raw`(?<=\d)`],
    ["not preceded by {", String.raw`(?<!\d)`],
  ]) {
    const prefix = text.slice(0, -2);
    const result = choose(prefix, prefix.length, text);
    assert.equal(result.preview, result.rules);
    assert.equal(result.rules.split("\n")[0], text);
    const regex = toRegExp(compile(result.rules, { flags: "du" }));
    const native = new RegExp(nativeSource, "du");
    for (const input of ["", "1", "A", "B", "21", "A1", "😀1", "\n"])
      assert.deepEqual(regex.exec(input), native.exec(input), `${text}: ${JSON.stringify(input)}`);
    assert.match(result.rules.slice(result.caret), /^(?:digit|"A")/u);
  }
});

test("capture completion preserves resolved references after inserting before existing captures", () => {
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    const source = [
      '# unfinished " 😀',
      "start",
      "  cap",
      'capture "original" {',
      '  "A"',
      "}",
      "same as capture 1",
      'same as capture "original"',
      "end",
    ].join(separator);
    const caret = source.indexOf(`${separator}capture "original"`);
    const result = choose(source, caret, "capture {");
    assert(result.rules.includes(["  capture {", "    digit", "  }"].join(separator)));
    assert(result.rules.includes(`same as capture 2${separator}`));
    assert(result.rules.includes('same as capture "original"'));
    assert(result.rules.startsWith(`# unfinished " 😀${separator}start${separator}`));
    assert.equal(result.preview, result.rules);
    assert.equal(result.rules.slice(result.caret, result.caret + 5), "digit");
    const regex = toRegExp(compile(result.rules, { flags: "du" }));
    const match = regex.exec("1AAA");
    assert(match);
    assert.deepEqual([...match], ["1AAA", "1", "A"]);
    assert.equal(match.groups.original, "A");
    assert.deepEqual(
      [...match.indices],
      [
        [0, 4],
        [0, 1],
        [1, 2],
      ],
    );
    assert.equal(regex.test("1AA1"), false);
  }
});

test("nested block completion preserves outer captures, whitespace and trailing comments", () => {
  const source = 'start\ncapture "outer" {\n\tgro # keep this comment\n}\nend';
  const caret = source.indexOf("gro") + 2;
  const result = choose(source, caret, "group {");
  assert(result.rules.includes("\tgroup {\n\t  digit\n\t}\n\t# keep this comment\n"));
  const match = toRegExp(compile(result.rules, { flags: "du" })).exec("7");
  assert.equal(match.groups.outer, "7");
  assert.deepEqual(match.indices.groups.outer, [0, 1]);
});

test("block proposals reject non-line contexts, open surroundings, invalid options and compiler budgets", () => {
  for (const source of [
    'capture "name"',
    "3 cap",
    "character class: cap",
    "capture {\ncap",
    "unknown\ncap",
    "cap }",
    `#${"x".repeat(LIMITS.sourceLength)}\ncap`,
    `${"#\n".repeat(LIMITS.lines - 2)}cap`,
    `${"group {\n".repeat(LIMITS.groupDepth)}cap\n${"}\n".repeat(LIMITS.groupDepth)}`,
  ]) {
    const caret = source.lastIndexOf("cap") + 3;
    assert(!ruleCompletions(source, caret).some((item) => item.text.includes("{")), source);
  }
  assert.deepEqual(ruleCompletions("cap", 3, { flags: "uv" }), []);
});

test("a blank line offers blocks without duplicating documents or altering quoted text", () => {
  const results = ruleCompletions("", 0);
  assert.equal(results.filter((item) => item.text.includes("{")).length, 8);
  assert.equal(new Set(results.map((item) => item.rules)).size, results.length);
  for (const source of ['"cap"', '"cap', "# cap", 'group with flags "cap" {\ndigit\n}'])
    assert.deepEqual(ruleCompletions(source, source.indexOf("cap") + 2), []);
});
