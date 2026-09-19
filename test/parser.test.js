import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse, LIMITS } from "../src/parser.js";
import { CompileError } from "../src/diagnostics.js";

const scenarios = JSON.parse(readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"));

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
  assert.deepEqual(parse("digit character between 2 and 4 times").nodes[0].repetition, { kind: "range", min: 2, max: 4 });
  assert.deepEqual(parse("digit character at least 3 times").nodes[0].repetition, { kind: "minimum", min: 3 });
  assert.deepEqual(parse("any number of times for digit character").nodes[0].repetition, { kind: "zeroOrMore" });
  assert.throws(() => parse("digit character between 4 and 2 times"), { code: "INVALID_RANGE" });
  assert.throws(() => parse(`digit character ${LIMITS.repetition + 1} times`), { code: "REPETITION_LIMIT" });
  assert.throws(() => parse("3 times"), { code: "UNKNOWN_RULE" });
});

test("quoted literal and character-list items keep punctuation as data", () => {
  assert.equal(parse('a "a.b"').nodes[0].value, "a.b");
  assert.deepEqual(parse('any of the following characters: "]", "-", ",", "\\\\"').nodes[0].value, ["]", "-", ",", "\\"]);
  assert.throws(() => parse('a "bad\\q"'), { code: "INVALID_QUOTE" });
  assert.throws(() => parse('a ""'), { code: "EMPTY_LITERAL" });
  assert.throws(() => parse("any of the following characters:"), { code: "EMPTY_CHARACTER_LIST" });
  assert.throws(() => parse("any of the following characters: ab"), { code: "INVALID_CHARACTER" });
  assert.throws(() => parse("any of the following characters: a,   "), { code: "INVALID_CHARACTER_LIST" });
});

test("unknown and misplaced instructions report a useful location", () => {
  assert.throws(() => parse("digit character\n  surprise phrase"), error => {
    assert.ok(error instanceof CompileError);
    assert.equal(error.code, "UNKNOWN_RULE");
    assert.equal(error.line, 2);
    assert.equal(error.column, 3);
    assert.match(error.hint, /LANGUAGE/);
    return true;
  });
  assert.throws(() => parse("digit character\nat the beginning of the input"), { code: "MISPLACED_ANCHOR" });
  assert.throws(() => parse("end of the input\ndigit character"), { code: "MISPLACED_ANCHOR" });
  assert.throws(() => parse("at the beginning of the input\nend of the line"), { code: "MIXED_ANCHORS" });
  assert.throws(() => parse(" "), { code: "EMPTY_SOURCE" });
});

test("keywords ignore case and blank lines while retaining literal case", () => {
  const result = parse('  AT THE BEGINNING OF THE INPUT\r\n\r\n I AM LOOKING FOR A "AbC"  \r\nend of the input');
  assert.equal(result.nodes.length, 3);
  assert.equal(result.nodes[1].value, "AbC");
  assert.equal(result.nodes[1].location.line, 3);
});
