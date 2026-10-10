import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { compile, regexToRules, toRegExp } from "../index.js";
import { LIMITS, parse } from "../src/parser.js";
import { flagSets, inputs, patterns } from "./fixtures/unicode-set-corpus.js";

function checkSpans(source, members) {
  for (const member of members) {
    assert.equal(source.slice(member.sourceStart, member.sourceEnd), member.source);
    if (member.kind === "set") checkSpans(source, member.members);
  }
}

test("set blocks retain typed operations, nesting, source spans and whole-set repetition", () => {
  const rules =
    'capture "value" {\n  lazy between 1 and 3 character set union {\n    character set intersection {\n      range "a" to "z"\n      none of: "a", "e", "i", "o", "u"\n    }\n    string "ab"\n  }\n}';
  const result = compile(rules, { flags: "dv" });
  assert.equal(result.source, String.raw`(?<value>[[[a-z]&&[^aeiou]]\q{ab}]{1,3}?)`);
  const segment = result.segments[1];
  assert.equal(segment.operation, "union");
  assert.deepEqual(segment.endLocation, { line: 8, column: 3 });
  assert.equal(segment.members[0].kind, "set");
  assert.equal(segment.members[0].operation, "intersection");
  assert.deepEqual(segment.members[0].endLocation, { line: 6, column: 5 });
  assert.equal(segment.members[0].members[0].source, "[a-z]");
  checkSpans(result.source, segment.members);
  assert.deepEqual(toRegExp(result).exec("ab").indices.groups.value, [0, 2]);
  assert.match(segment.explanation, /intersection/u);
  assert.match(segment.explanation, /Lazy/u);
  assert.equal(parse(rules).nodes[0].nodes[0].members[0].operation, "intersection");
});

test("structural string complements follow union, intersection and left-operand subtraction rules", () => {
  for (const rules of [
    'not character set union {\nstring "ab"\n}',
    'not character set intersection {\nstring "ab"\nstring "cd"\n}',
    'not character set subtraction {\nstring "ab"\nstring "ab"\n}',
    'character set union {\nnot character set union {\nstring "ab"\n}\n}',
  ])
    assert.throws(() => compile(rules, { flags: "v" }), { code: "INVALID_STRING_COMPLEMENT" });
  for (const [rules, matchesLowerA] of [
    [
      'not character set intersection {\none of strings: "a", "ab", ""\nunicode property "ASCII"\n}',
      false,
    ],
    [
      'not character set subtraction {\nunicode property "ASCII"\none of strings: "a", "ab", ""\n}',
      true,
    ],
  ]) {
    const result = compile(rules, { flags: "iv" });
    assert.equal(toRegExp(result).test("a"), matchesLowerA);
    for (const input of ["a", "A", "ab", "AB", "😀", ""])
      assert.deepEqual(toRegExp(result).exec(input), new RegExp(result.source, "iv").exec(input));
    assert.equal(toRegExp(result).test("😀"), true);
    assert.doesNotMatch(result.segments[0].explanation, /empty member/u);
  }
  const removedEmpty = compile(
    'character set subtraction {\none of strings: "a", ""\nstring ""\n}',
    { flags: "v" },
  );
  assert.equal(toRegExp(removedEmpty).test(""), false);
  assert.doesNotMatch(removedEmpty.segments[0].explanation, /empty member/u);
  const empty = compile("character set union {\n}", { flags: "v" });
  assert.equal(empty.source, "[]");
  assert.equal(toRegExp(empty).test(""), false);
  assert.match(empty.segments[0].explanation, /no member can match/u);
  const universe = compile("not character set union {\n}", { flags: "v" });
  assert.equal(universe.source, "[^]");
  assert.equal(toRegExp(universe).exec("😀")[0], "😀");
});

test("native nested sets round-trip every v flag, cursor, capture and engine string boundary", () => {
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
        if (segment.atomType === "characterClass") checkSpans(compiled.source, segment.members);
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

test("invalid set operands, arity, modes and block depth report their source positions", () => {
  for (const [rules, code, line, column, flags] of [
    ['\n  character set union {\n"a"\n}', "UNICODE_SETS_REQUIRED", 2, 3, "u"],
    ["character set intersection {\n}", "SET_OPERAND_COUNT", 1, 1, "v"],
    ['character set subtraction {\n"a"\n}', "SET_OPERAND_COUNT", 1, 1, "v"],
    ['character set union {\n  "ab"\n}', "INVALID_SET_OPERAND", 2, 3, "v"],
    ["character set union {\n  digits\n}", "INVALID_SET_OPERAND", 2, 3, "v"],
    ["character set union {\n  any character\n}", "INVALID_SET_OPERAND", 2, 3, "v"],
    ["character set union {\n  start\n}", "UNKNOWN_RULE", 2, 3, "v"],
    ["character set union {\n  group {\n  }\n}", "INVALID_SET_OPERAND", 2, 3, "v"],
    [
      'character set union {\n  optional character set union {\n"a"\n}\n}',
      "INVALID_SET_OPERAND",
      2,
      3,
      "v",
    ],
    ["character set xor {", "INVALID_SET_BLOCK", 1, 1, "v"],
    ['character set union {\n"a"', "UNCLOSED_SET", 1, 1, "v"],
  ])
    assert.throws(() => compile(rules, { flags }), { code, line, column }, rules);
  const nested = (groups, sets) =>
    `${"group {\n".repeat(groups)}${"character set union {\n".repeat(sets)}"a"\n${"}\n".repeat(groups + sets)}`;
  assert.equal(toRegExp(compile(nested(32, 32), { flags: "v" })).test("a"), true);
  assert.throws(() => compile(nested(32, 33), { flags: "v" }), {
    code: "SET_DEPTH_LIMIT",
    line: LIMITS.groupDepth + 1,
    column: 1,
  });
  assert.throws(() => regexToRules(new RegExp("[".repeat(65) + "]".repeat(65), "v")), {
    code: "SET_DEPTH_LIMIT",
    line: 1,
    column: 65,
  });
  assert.throws(() => compile(`character set union {\n${'"a"\n'.repeat(200)}}`, { flags: "v" }), {
    code: "LINE_LIMIT",
  });
});

test("a target missing set operators fails at the block without approximating its membership", () => {
  const NativeRegExp = globalThis.RegExp;
  try {
    globalThis.RegExp = class extends NativeRegExp {
      constructor(source, flags) {
        if (String(source).includes("&&") || String(source).includes("--"))
          throw new SyntaxError("Set operation unavailable");
        super(source, flags);
      }
    };
    assert.throws(() => compile('\n  character set intersection {\n"a"\n"a"\n}', { flags: "v" }), {
      code: "UNSUPPORTED_TARGET_FEATURE",
      line: 2,
      column: 3,
    });
  } finally {
    globalThis.RegExp = NativeRegExp;
  }
});

test("CLI set compilation and reverse translation keep native v semantics and structured errors", () => {
  const rules = 'character set subtraction {\nrange "a" to "z"\none of: "a", "e", "i", "o", "u"\n}';
  const run = (args, input = rules) =>
    spawnSync(process.execPath, ["bin/regex-for-humans.js", ...args], {
      encoding: "utf8",
      input,
    });
  const compiled = run(["--flags", "v", "--json"]);
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(JSON.parse(compiled.stdout).source, "[[a-z]--[aeiou]]");
  const reversed = run(["--reverse"], "/[[a-z]--[aeiou]]/v");
  assert.equal(reversed.status, 0, reversed.stderr);
  assert.match(reversed.stdout, /character set subtraction/u);
  const invalid = run(["--flags", "u", "--json"]);
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stderr).error.code, "UNICODE_SETS_REQUIRED");
});
