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
  assert.equal(result.segments.at(-1).explanation, "Input end.");
  const regex = toRegExp(result);
  assert.equal(regex.test("A"), true);
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"])
    assert.equal(regex.test(`A${separator}`), false, JSON.stringify(separator));
});

test("negative classes and concise repetition forms compile exactly", () => {
  assert.equal(compile("not word").source, "\\W");
  assert.equal(compile("not digit").source, "\\D");
  assert.equal(compile("3 digit").source, "\\d{3}");
  assert.equal(compile("digits").source, "\\d+");
  assert.equal(compile("any text").source, ".*");
  assert.equal(compile("text without: a, b").source, "[^ab]*");
});

test("literal and character-class metacharacters are escaped in their contexts", () => {
  const literal = compile('start\n"a.b/c[1]"\nend');
  assert.equal(literal.source, "^a\\.b\\/c\\[1\\]$");
  assert.equal(toRegExp(literal).test("a.b/c[1]"), true);
  assert.equal(toRegExp(literal).test("axb/c[1]"), false);

  const list = compile('one of: "]", "-", "^", "\\\\", ",", "😀"');
  const regex = toRegExp(list);
  for (const character of ["]", "-", "^", "\\", ",", "😀"])
    assert.equal(regex.test(character), true, character);
  assert.equal(regex.test("z"), false);
  assert.equal(compile('2 "AB"').source, "(?:AB){2}");
  assert.equal(compile('"\\n"').source, "\\u{a}");
});

test("lone surrogates survive UTF-8 transport in literals and character sets", () => {
  for (const character of ["\ud800", "\udbff", "\udc00", "\udfff"]) {
    const quoted = JSON.stringify(character);
    const escaped = `\\u{${character.charCodeAt(0).toString(16)}}`;
    for (const [rule, source, sample, expected] of [
      [quoted, escaped, character, true],
      [`2 ${quoted}`, `${escaped}{2}`, character.repeat(2), true],
      [`one of: ${quoted}`, `[${escaped}]`, character, true],
      [`none of: ${quoted}`, `[^${escaped}]`, character, false],
      [`text without: ${quoted}`, `[^${escaped}]*`, character, false],
    ]) {
      const result = compile(`start\n${rule}\nend`);
      assert.equal(result.source, `^${source}$`, rule);
      assert.equal(Buffer.from(result.source).toString("utf8"), result.source, rule);
      assert.equal(toRegExp(result).test(sample), expected, rule);
      assert.equal(toRegExp(result).test("\ufffd"), !expected, rule);
    }
  }
  assert.equal(compile('"😀"').source, "😀");
  const separateSurrogates = compile(String.raw`one of: "\ud800", "\udc00"`);
  assert.equal(separateSurrogates.source, "[\\u{d800}\\u{dc00}]");
  for (const character of ["\ud800", "\udc00"])
    assert.equal(toRegExp(separateSurrogates).test(character), true);
  assert.equal(toRegExp(separateSurrogates).test("\ud800\udc00"), false);
});

test("flags and segment positions describe the emitted expression", () => {
  const result = compile("line start\nany character\nline end", {
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
  assert.equal(lineRule.segments[0].explanation, "Start of each line (m).");
  assert.equal(
    lineRule.segments[1].explanation,
    "Longest text up to the next rule, excluding line breaks.",
  );
  const excludedRule = compile(scenarios[1].rules);
  assert.equal(excludedRule.segments[1].explanation, 'Longest text without "a", "b", "c", "d".');
  assert.equal(lineRule.segments[2].explanation, "Exactly 3 digits (0–9).");
  assert.equal(lineRule.segments[3].explanation, "End of each line (m).");
  assert.equal(compile("digit").segments[0].explanation, "One digit (0–9).");
  assert.equal(compile("not digit").segments[0].explanation, "Any character except 0–9.");
  assert.equal(compile("space").segments[0].explanation, "Whitespace, including line breaks.");
  assert.equal(compile("not space").segments[0].explanation, "Any non-whitespace character.");
  assert.equal(
    compile("any character").segments[0].explanation,
    "Any character except a line break.",
  );
  assert.equal(
    compile("any character", { flags: "s" }).segments[0].explanation,
    "Any character, including line breaks.",
  );
  assert.equal(compile("digits").segments[0].explanation, "One or more digits (0–9).");
  assert.equal(compile("1 digit").segments[0].explanation, "Exactly 1 digit (0–9).");
  assert.equal(compile("3 digits").segments[0].explanation, "Exactly 3 digits (0–9).");
  assert.equal(
    compile("any text", { flags: "s" }).segments[0].explanation,
    "Longest text, including line breaks.",
  );
  assert.equal(
    compile('"ABC"', { flags: "i" }).segments[0].explanation,
    'Literal text "ABC", ignoring case (i).',
  );
  assert.equal(
    compile("word").segments[0].explanation,
    "Word character: ASCII letter, digit or underscore. With i, a few Unicode equivalents match.",
  );
  assert.equal(compile("not word").segments[0].explanation, "Any non-word character.");
});

test("case-insensitive class explanations include JavaScript Unicode folding", () => {
  const positive = compile("one of: K", { flags: "i" });
  assert.equal(positive.segments[0].explanation, 'One of "K", ignoring case (i).');
  assert.equal(toRegExp(positive).test("K"), true);

  const repeatedPositive = compile("3 one of: K", { flags: "i" });
  assert.equal(
    repeatedPositive.segments[0].explanation,
    'One of "K", ignoring case (i). Exactly 3 times.',
  );
  assert.equal(toRegExp(repeatedPositive).test("KKk"), true);

  const negative = compile("none of: K", { flags: "i" });
  assert.equal(negative.segments[0].explanation, 'Any character except "K", ignoring case (i).');
  assert.equal(toRegExp(negative).test("K"), false);

  const excludedText = compile("start\ntext without: K\nend", { flags: "i" });
  assert.match(excludedText.segments[1].explanation, /ignoring case \(i\)/u);
  assert.equal(toRegExp(excludedText).test("k"), false);

  const notWord = compile("not word", { flags: "i" });
  assert.match(notWord.segments[0].explanation, /i treats a few Unicode equivalents as words/u);
  assert.equal(toRegExp(notWord).test("K"), false);
});

test("invalid input fails explicitly rather than returning partial output", () => {
  for (const source of [
    "unknown phrase",
    "digit\nsurprise",
    "digit between 9 and 2 times",
    "one of:",
  ]) {
    assert.throws(() => compile(source), CompileError, source);
  }
  assert.throws(() => compile("digit", { flags: "g" }), { code: "UNSUPPORTED_FLAGS" });
  assert.throws(() => compile("digit", { flags: "ii" }), { code: "UNSUPPORTED_FLAGS" });
  assert.throws(() => toRegExp({ source: 1, flags: "u" }), TypeError);
});
