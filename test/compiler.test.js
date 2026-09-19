import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compile, toRegExp, regexMatchingThroughLines, CompileError } from "../index.js";

const scenarios = JSON.parse(readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"));

test("reference scenarios compile to exact source and flags and match both ways", () => {
  for (const scenario of scenarios) {
    const result = compile(scenario.rules);
    assert.equal(result.source, scenario.source, scenario.id);
    assert.equal(result.flags, scenario.flags, scenario.id);
    const regex = toRegExp(result);
    for (const sample of scenario.positive) assert.equal(regex.test(sample), true, `${scenario.id}: ${JSON.stringify(sample)}`);
    for (const sample of scenario.negative) assert.equal(regex.test(sample), false, `${scenario.id}: ${JSON.stringify(sample)}`);
    assert.equal(regexMatchingThroughLines(scenario.rules), scenario.source, scenario.id);
  }
});

test("negative classes and all repetition forms are semantically distinct", () => {
  assert.equal(compile("non-alphanumeric character").source, "\\W");
  assert.equal(compile("non-digit character").source, "\\D");
  assert.equal(compile("digit character between 2 and 4 times").source, "\\d{2,4}");
  assert.equal(compile("digit character at least 3 times").source, "\\d{3,}");
  assert.equal(compile("digit character 3 times").source, "\\d{3}");
  assert.equal(compile("digit character at least one time").source, "\\d+");
  assert.equal(compile("digit character at most one time").source, "\\d?");
  assert.equal(compile("digit character any number of times").source, "\\d*");
});

test("literal and character-class metacharacters are escaped in their contexts", () => {
  const literal = compile('at the beginning of the input\na "a.b/c[1]"\nend of the input');
  assert.equal(literal.source, '^a\\.b\\/c\\[1\\]$');
  assert.equal(toRegExp(literal).test("a.b/c[1]"), true);
  assert.equal(toRegExp(literal).test("axb/c[1]"), false);

  const list = compile('any of the following characters: "]", "-", "^", "\\\\", ",", "😀"');
  const regex = toRegExp(list);
  for (const character of ["]", "-", "^", "\\", ",", "😀"]) assert.equal(regex.test(character), true, character);
  assert.equal(regex.test("z"), false);
  assert.equal(compile('a "AB" 2 times').source, '(?:AB){2}');
  assert.equal(compile('a "\\n"').source, "\\u{a}");
});

test("flags and segment positions describe the emitted expression", () => {
  const result = compile('at the beginning of a line\nany character\nend of the line', { flags: "is" });
  assert.equal(result.flags, "imsu");
  assert.equal(result.source, "^.$");
  assert.equal(result.segments.length, 3);
  for (const segment of result.segments) {
    assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
    assert.ok(segment.line > 0);
    assert.ok(segment.column > 0);
  }
  assert.equal(toRegExp(result).test("\n"), true);
});

test("explanations reflect JavaScript flags, greedy matching and shorthand limits", () => {
  const lineRule = compile(scenarios[2].rules);
  assert.match(lineRule.segments[0].explanation, /m flag/u);
  assert.match(lineRule.segments[1].explanation, /line break/u);
  assert.match(lineRule.segments[1].explanation, /greedily/u);
  assert.match(lineRule.segments[2].explanation, /ASCII digit/u);
  assert.match(compile("any character", { flags: "s" }).segments[0].explanation, /including a line break/u);
  assert.match(compile('a "ABC"', { flags: "i" }).segments[0].explanation, /ignoring case/u);
  assert.match(compile("alphanumeric character").segments[0].explanation, /underscore/u);
});

test("invalid input fails explicitly rather than returning partial output", () => {
  for (const source of ["unknown phrase", "digit character\nsurprise", "digit character between 9 and 2 times", "any of the following characters:"]) {
    assert.throws(() => compile(source), CompileError, source);
  }
  assert.throws(() => compile("digit character", { flags: "g" }), { code: "UNSUPPORTED_FLAGS" });
  assert.throws(() => compile("digit character", { flags: "ii" }), { code: "UNSUPPORTED_FLAGS" });
  assert.throws(() => toRegExp({ source: 1, flags: "u" }), TypeError);
});
