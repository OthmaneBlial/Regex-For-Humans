import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { compile, regexToRules, toRegExp } from "../index.js";
import { UNICODE_STRING_PROPERTIES } from "../src/ast.js";
import { parse } from "../src/parser.js";
import { flagSets, inputs, patterns } from "./fixtures/unicode-string-corpus.js";

test("native string-set rules preserve longest-first preference, backtracking, empty strings and member spans", () => {
  const rules = 'capture "value" {\n  lazy between 1 and 3 one of strings: "a", "ab", ""\n}';
  const result = compile(rules, { flags: "dv" });
  assert.equal(result.source, String.raw`(?<value>[\q{a|ab|}]{1,3}?)`);
  const segment = result.segments[1];
  assert.equal(segment.atomType, "characterClass");
  assert.equal(segment.members[0].kind, "strings");
  assert.deepEqual(segment.members[0].values, ["a", "ab", ""]);
  assert.equal(
    result.source.slice(segment.members[0].sourceStart, segment.members[0].sourceEnd),
    String.raw`\q{a|ab|}`,
  );
  assert.deepEqual(toRegExp(result).exec("ab").indices.groups.value, [0, 2]);
  assert.equal(toRegExp(result).exec("").groups.value, "");
  assert.match(segment.explanation, /longer members first/u);
  assert.match(segment.explanation, /empty member/u);
  assert.match(segment.explanation, /Lazy/u);
  for (const values of [
    ["a", "ab"],
    ["ab", "a"],
  ]) {
    const source = `one of strings: ${values.map((value) => JSON.stringify(value)).join(", ")}`;
    assert.equal(toRegExp(compile(source, { flags: "v" })).exec("ab")[0], "ab");
    assert.equal(toRegExp(compile(`${source}\n"b"`, { flags: "v" })).exec("ab")[0], "ab");
  }
  assert.equal(
    toRegExp(compile('character class: string "a", string "ab", "_"', { flags: "v" })).exec(
      "ab",
    )[0],
    "ab",
  );
  assert.equal(
    toRegExp(compile('not character class: string "a", string "😀"', { flags: "v" })).test("😀"),
    false,
  );
  assert.deepEqual(parse('one of strings: "", "ab"').nodes[0].members[0].values, ["", "ab"]);
  for (const value of ["\u202e", "\u2066"]) {
    for (const source of [
      `one of strings: ${JSON.stringify(value)}`,
      `string code points: ${JSON.stringify(value)}`,
    ]) {
      const escaped = compile(source, { flags: "v" });
      const member = escaped.segments[0].members[0];
      assert.equal(escaped.source.slice(member.sourceStart, member.sourceEnd), member.source);
      assert.equal(escaped.source.includes(value), false);
      assert.equal(toRegExp(escaped).exec(value)[0], value);
    }
  }
});

test("all seven native Unicode properties of strings retain property type and complete emoji sequences", () => {
  for (const property of UNICODE_STRING_PROPERTIES) {
    const rules = `unicode property ${JSON.stringify(property)}`;
    const result = compile(rules, { flags: "v" });
    assert.equal(parse(rules).nodes[0].propertyType, "string");
    assert.equal(result.segments[0].propertyType, "string");
    assert.match(result.segments[0].explanation, /multiple code points/u);
    assert.deepEqual(regexToRules(toRegExp(result)), { rules, flags: "v" });
    for (const input of inputs)
      assert.deepEqual(
        toRegExp(result).exec(input),
        new RegExp(`\\p{${property}}`, "v").exec(input),
      );
  }
  const result = compile('unicode property "RGI_Emoji"', { flags: "dv" });
  const match = toRegExp(result).exec("x👨‍👩‍👧y");
  assert.equal(match[0], "👨‍👩‍👧");
  assert.deepEqual(match.indices[0], [1, 9]);
  assert.equal(compile('unicode property "L"').segments[0].propertyType, "character");
});

test("explicit string code-point sequences preserve separate surrogate escapes and structural negation", () => {
  const rules = String.raw`string code points: "\ud83d" + "\ude00"`;
  const result = compile(rules, { flags: "v" });
  assert.equal(result.source, String.raw`[\q{\u{d83d}\u{de00}}]`);
  assert.equal(result.segments[0].members[0].kind, "stringCodePoints");
  assert.deepEqual(result.segments[0].members[0].codePoints, ["\ud83d", "\ude00"]);
  assert.deepEqual(regexToRules(/[\q{\u{d83d}\u{de00}}]/v), {
    rules: `character class: ${rules}`,
    flags: "v",
  });
  assert.throws(() => compile(`not character class: ${rules}`, { flags: "v" }), {
    code: "INVALID_STRING_COMPLEMENT",
    line: 1,
    column: 1,
  });
  for (const value of ['""', '"ab"'])
    assert.throws(() => compile(`string code points: ${value}`, { flags: "v" }), {
      code: "INVALID_STRING_SEQUENCE",
      line: 1,
      column: 21,
    });
  assert.throws(() => compile('string code points: "a" +', { flags: "v" }), {
    code: "INVALID_STRING_SEQUENCE",
    line: 1,
    column: 25,
  });
  assert.throws(() => compile('string code points: "a" "b"', { flags: "v" }), {
    code: "INVALID_STRING_SEQUENCE",
    line: 1,
    column: 25,
  });
  assert.throws(() => compile("string code points:", { flags: "v" }), {
    code: "EMPTY_STRING_SEQUENCE",
    line: 1,
    column: 20,
  });
  assert.equal(
    toRegExp(compile('string code points: "a" + "+"', { flags: "v" })).exec("a+")[0],
    "a+",
  );
});

test("string properties and finite string sets round-trip every flag/cursor combination against native captures", () => {
  let comparisons = 0;
  for (const flags of flagSets)
    for (const source of patterns) {
      const native = new RegExp(source, flags);
      native.lastIndex = 3;
      const translated = regexToRules(native);
      assert.equal(native.lastIndex, 3);
      const compiled = compile(translated.rules, { flags: translated.flags });
      const result = toRegExp(compiled);
      assert.equal(result.flags, flags);
      for (const segment of compiled.segments) {
        assert.equal(compiled.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
        if (segment.atomType === "characterClass")
          for (const member of segment.members)
            assert.equal(
              compiled.source.slice(member.sourceStart, member.sourceEnd),
              member.source,
            );
      }
      for (const input of inputs)
        for (const cursor of [0, 1, 2]) {
          native.lastIndex = cursor;
          result.lastIndex = cursor;
          for (let step = 0; step < 3; step++) {
            assert.deepEqual(
              result.exec(input),
              native.exec(input),
              `${source}/${flags} ${JSON.stringify(input)} ${cursor} ${step}`,
            );
            assert.equal(result.lastIndex, native.lastIndex);
            comparisons++;
          }
        }
    }
  assert.equal(comparisons, patterns.length * flagSets.length * inputs.length * 9);
});

test("string mode, quotes, repetition and structural complements have precise diagnostics", () => {
  for (const [rules, code, column, flags] of [
    ['unicode property "RGI_Emoji"', "UNICODE_SETS_REQUIRED", 19, "u"],
    ['not unicode property "RGI_Emoji"', "INVALID_STRING_COMPLEMENT", 23, "v"],
    ['one of strings: "ab"', "UNICODE_SETS_REQUIRED", 17, "u"],
    ["one of strings: ab", "INVALID_STRING_LIST", 17, "v"],
    ['one of strings: "a" "b"', "INVALID_STRING_LIST", 21, "v"],
    ['one of strings: "a",', "INVALID_STRING_LIST", 20, "v"],
    ["one of strings:", "EMPTY_STRING_LIST", 16, "v"],
    ['string "a", "b"', "INVALID_STRING_LIST", 8, "v"],
    ['not character class: string "ab"', "INVALID_STRING_COMPLEMENT", 1, "v"],
    ['not character class: string ""', "INVALID_STRING_COMPLEMENT", 1, "v"],
    ['not character class: unicode property "Basic_Emoji"', "INVALID_STRING_COMPLEMENT", 1, "v"],
    ['lazy string "ab"', "INVALID_LAZY_REPETITION", 1, "v"],
    ['1001 string "ab"', "REPETITION_LIMIT", 1, "v"],
  ])
    assert.throws(() => compile(rules, { flags }), { code, line: 1, column }, rules);
  assert.throws(() => compile('character class: unicode property "basic_emoji"', { flags: "v" }), {
    code: "INVALID_UNICODE_PROPERTY",
    line: 1,
    column: 36,
  });
  assert.throws(() => compile('one of: "ab"'), { code: "INVALID_CHARACTER" });
});

test("missing native string features fail explicitly at the property or string operand", () => {
  const NativeRegExp = globalThis.RegExp;
  try {
    globalThis.RegExp = class extends NativeRegExp {
      constructor(source, flags) {
        if (String(source).includes("RGI_Emoji") || String(source).includes("\\q{"))
          throw new SyntaxError("Native string feature unavailable");
        super(source, flags);
      }
    };
    assert.throws(() => compile('unicode property "RGI_Emoji"', { flags: "v" }), {
      code: "UNSUPPORTED_TARGET_FEATURE",
      line: 1,
      column: 19,
    });
    assert.throws(() => compile('one of strings: "ab"', { flags: "v" }), {
      code: "UNSUPPORTED_TARGET_FEATURE",
      line: 1,
      column: 17,
    });
    assert.equal(compile('unicode property "L"', { flags: "v" }).flags, "v");
  } finally {
    globalThis.RegExp = NativeRegExp;
  }
});

test("both CLI directions preserve string-set semantics, flags and invalid complement diagnostics", () => {
  const run = (args, input) =>
    spawnSync(process.execPath, ["bin/regex-for-humans.js", ...args], { input, encoding: "utf8" });
  const forward = run(
    ["--json", "--flags", "dgv"],
    'capture "emoji" {\nunicode property "RGI_Emoji"\n}',
  );
  assert.equal(forward.status, 0, forward.stderr);
  const compiled = JSON.parse(forward.stdout);
  assert.equal(new RegExp(compiled.source, compiled.flags).exec("👨‍👩‍👧").groups.emoji, "👨‍👩‍👧");
  const reverse = run(["--json", "--reverse"], String.raw`/(?<word>[\q{ab|a|}])\k<word>/dgv`);
  assert.equal(reverse.status, 0, reverse.stderr);
  const translated = JSON.parse(reverse.stdout);
  assert.equal(compile(translated.rules, { flags: translated.flags }).flags, "dgv");
  const invalid = run(["--json", "--flags=v"], 'not character class: string "ab"');
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stderr).error.code, "INVALID_STRING_COMPLEMENT");
});
