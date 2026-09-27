import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CompileError, compile, regexMatchingThroughLines, toRegExp } from "../index.js";

const scenarios = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("reference scenarios compile to exact source and flags and match both ways", () => {
  for (const scenario of scenarios) {
    const result = compile(scenario.rules);
    assert.equal(result.source, scenario.source, scenario.id);
    assert.equal(result.flags, scenario.flags, scenario.id);
    const regex = toRegExp(result);
    for (const sample of scenario.positive)
      assert.equal(regex.test(sample), true, `${scenario.id}: ${JSON.stringify(sample)}`);
    for (const sample of scenario.negative)
      assert.equal(regex.test(sample), false, `${scenario.id}: ${JSON.stringify(sample)}`);
    assert.equal(regexMatchingThroughLines(scenario.rules), scenario.source, scenario.id);
  }
});

test("JavaScript line terminators separate rules and match line anchors", () => {
  for (const separator of ["\n", "\r\n", "\r", "\u2028", "\u2029"]) {
    const result = compile(`line start${separator}3 digits${separator}line end`);
    assert.equal(result.source, "^\\d{3}$");
    assert.equal(result.flags, "mu");
    assert.deepEqual(
      result.segments.map(({ line }) => line),
      [1, 2, 3],
    );
    const regex = toRegExp(result);
    assert.equal(regex.test(`${separator}123${separator}`), true, JSON.stringify(separator));
    assert.equal(regex.test(`${separator}12${separator}`), false, JSON.stringify(separator));
  }
});

test("input end anchor rejects a final JavaScript line terminator", () => {
  const result = compile('start "A"\nend');
  assert.equal(result.source, "^A$");
  assert.equal(result.flags, "u");
  assert.equal(result.segments.at(-1).explanation, "End of the input.");
  const regex = toRegExp(result);
  assert.equal(regex.test("A"), true);
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"])
    assert.equal(regex.test(`A${separator}`), false, JSON.stringify(separator));
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
  assert.equal(literal.source, "^a\\.b\\/c\\[1\\]$");
  assert.equal(toRegExp(literal).test("a.b/c[1]"), true);
  assert.equal(toRegExp(literal).test("axb/c[1]"), false);

  const list = compile('any of the following characters: "]", "-", "^", "\\\\", ",", "😀"');
  const regex = toRegExp(list);
  for (const character of ["]", "-", "^", "\\", ",", "😀"])
    assert.equal(regex.test(character), true, character);
  assert.equal(regex.test("z"), false);
  assert.equal(compile('a "AB" 2 times').source, "(?:AB){2}");
  assert.equal(compile('a "\\n"').source, "\\u{a}");
});

test("flags and segment positions describe the emitted expression", () => {
  const result = compile("at the beginning of a line\nany character\nend of the line", {
    flags: "is",
  });
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
  assert.equal(lineRule.segments[1].explanation, "Any text without line breaks (greedy).");
  const excludedRule = compile(scenarios[1].rules);
  assert.equal(
    excludedRule.segments[1].explanation,
    'Any text without "a", "b", "c", "d" (greedy).',
  );
  assert.match(lineRule.segments[2].explanation, /ASCII digit/u);
  assert.equal(
    compile("any text", { flags: "s" }).segments[0].explanation,
    "Any text, line breaks included (greedy).",
  );
  assert.match(compile('a "ABC"', { flags: "i" }).segments[0].explanation, /ignoring case/u);
  assert.match(compile("alphanumeric character").segments[0].explanation, /underscore/u);
});

test("case-insensitive class explanations include JavaScript Unicode folding", () => {
  const positive = compile("one of: K", { flags: "i" });
  assert.equal(
    positive.segments[0].explanation,
    'One of "K", ignoring case according to JavaScript\'s Unicode rules.',
  );
  assert.equal(toRegExp(positive).test("K"), true);

  const repeatedPositive = compile("one of: K any number of times", { flags: "i" });
  assert.equal(
    repeatedPositive.segments[0].explanation,
    'Any sequence of "K", ignoring case according to JavaScript\'s Unicode rules (greedy).',
  );
  assert.equal(toRegExp(repeatedPositive).test("KKk"), true);

  const negative = compile("none of: K", { flags: "i" });
  assert.equal(
    negative.segments[0].explanation,
    'One Unicode code point except "K", ignoring case according to JavaScript\'s Unicode rules.',
  );
  assert.equal(toRegExp(negative).test("K"), false);

  const excludedText = compile("start\ntext without: K\nend", { flags: "i" });
  assert.match(
    excludedText.segments[1].explanation,
    /ignoring case according to JavaScript's Unicode rules/u,
  );
  assert.equal(toRegExp(excludedText).test("k"), false);

  const notWord = compile("not word", { flags: "i" });
  assert.match(
    notWord.segments[0].explanation,
    /case-folding equivalents count as word characters/u,
  );
  assert.equal(toRegExp(notWord).test("K"), false);
});

test("invalid input fails explicitly rather than returning partial output", () => {
  for (const source of [
    "unknown phrase",
    "digit character\nsurprise",
    "digit character between 9 and 2 times",
    "any of the following characters:",
  ]) {
    assert.throws(() => compile(source), CompileError, source);
  }
  assert.throws(() => compile("digit character", { flags: "g" }), { code: "UNSUPPORTED_FLAGS" });
  assert.throws(() => compile("digit character", { flags: "ii" }), { code: "UNSUPPORTED_FLAGS" });
  assert.throws(() => toRegExp({ source: 1, flags: "u" }), TypeError);
});
