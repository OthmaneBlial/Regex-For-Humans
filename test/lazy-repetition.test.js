import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";
import { LIMITS, parse } from "../src/parser.js";

test("lazy modifies every existing quantifier and implicit sequence without changing greedy defaults", () => {
  for (const [rule, source] of [
    ["lazy digits", String.raw`\d+?`],
    ["lazy any text", ".*?"],
    ['lazy text without: "x", "y"', "[^xy]*?"],
    ['lazy optional "AB"', "(?:AB){0,1}?"],
    ["lazy zero or more digit", String.raw`\d*?`],
    ["lazy one or more letter", "[A-Za-z]+?"],
    ["lazy at least 3 space", String.raw`\s{3,}?`],
    ["lazy between 2 and 4 one of: a, b", "[ab]{2,4}?"],
    ['lazy 2 "😀AB"', "(?:😀AB){2}?"],
    ["lazy between 0 and 0 any character", ".{0,0}?"],
    ["LAZY\tspaces", String.raw`\s+?`],
  ]) {
    const result = compile(rule);
    assert.equal(result.source, source);
    assert.equal(result.segments[0].repetition.lazy, true);
    assert.equal(parse(rule).nodes[0].text, rule);
    const greedy = compile(rule.replace(/^lazy\s+/iu, ""));
    assert.equal(greedy.source, source.slice(0, -1));
    assert.equal(Object.hasOwn(greedy.segments[0].repetition, "lazy"), false);
  }
  assert.equal(toRegExp(compile("digits")).exec("1234")[0], "1234");
  assert.equal(toRegExp(compile("lazy digits")).exec("1234")[0], "1");
  assert.equal(toRegExp(compile('lazy digits\n"4"')).exec("1234")[0], "1234");
  assert.equal(toRegExp(compile('"lazy"')).exec("lazy")[0], "lazy");
});

test("lazy whole blocks and references preserve numbered, absent and final captures and source spans", () => {
  const rules =
    'start\ncapture "first" {\n"a"\n}\nlazy one or more either {\ncapture "last" {\n"b"\n}\n"c"\n}\nlazy optional same as capture "first"\nend';
  const result = compile(rules);
  assert.equal(result.source, String.raw`^(?<first>a)(?:(?<last>b)|c)+?\k<first>{0,1}?$`);
  const expression = toRegExp(result);
  assert.deepEqual({ ...expression.exec("abca").groups }, { first: "a", last: undefined });
  assert.deepEqual({ ...expression.exec("acbb").groups }, { first: "a", last: "b" });
  for (const segment of result.segments) {
    assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
    assert.equal(rules.split("\n")[segment.line - 1].trim(), segment.text);
  }
  const absent = toRegExp(compile('lazy optional capture "x" {\n"a"\n}\n"a"'));
  assert.equal(absent.exec("aa").groups.x, undefined);
  assert.equal(absent.exec("aa")[0], "a");
  const empty = toRegExp(compile('capture "empty" {\nlazy any text\n}'));
  assert.equal(empty.exec("abc").groups.empty, "");
  assert.equal(compile('lazy one or more group {\n"AB"\n}').source, "(?:AB)+?");
});

const patterns = [
  "a*?",
  "a+?",
  "a??",
  "a{0}?",
  "a{2}?",
  "a{0,0}?",
  "a{0,1}?",
  "a{2,4}?",
  "a{0,}?",
  "a{1,}?",
  "a{2,}?",
  ".*?a",
  "[^b]*?b",
  "(?:AB){1,3}?",
  "(?:)*?",
  "(?:)??",
  "(?:){2,4}?",
  "(?<empty>)*?",
  "(?<empty>)+?",
  "(a)??a",
  "((a)|(b))+?c",
  "(?:(?<a>a)|b)*?b",
  "(?<x>a+?)b\\k<x>??",
  "(a)(?:\\1)*?b",
  "(?:a|aa)+?b",
  "((?:a|b)*?)*?c",
  "(?<année>é|é){1,2}?",
  "(?:😀){1,3}?",
  String.raw`\uD83D\uDE00+?`,
  String.raw`(?:\u{D83D}\u{DE00})+?`,
  "(?:.[^]*?|[^]+?.)",
  "^(?<digits>\\d{1,3}?)\\d*$",
  "[^😀]+?",
  "[A-Za-z]*?K",
  "^a*?$",
];
const samples = [
  "",
  "a",
  "aa",
  "aaa",
  "aaaa",
  "ab",
  "aab",
  "ababa",
  "b",
  "bb",
  "bc",
  "abc",
  "aabc",
  "ac",
  "c",
  "AB",
  "ABABAB",
  "é",
  "é",
  "éé",
  "1234",
  "1",
  "K",
  "K",
  "😀",
  "😀😀",
  "😀a",
  "a😀",
  "\ud83d",
  "\ude00",
  "\na\n",
  "a\nb",
  "\n",
  "😀AB",
];

test("lazy regex imports retain full native match arrays and indices under all eight supported flag sets", () => {
  for (const source of patterns)
    for (const flags of ["u", "iu", "mu", "imu", "su", "isu", "msu", "imsu"]) {
      const regex = new RegExp(source, flags);
      regex.lastIndex = 9;
      const translated = regexToRules(regex);
      assert.equal(regex.lastIndex, 9);
      assert.match(translated.rules, /lazy /u);
      const result = compile(translated.rules, { flags: translated.flags });
      const original = new RegExp(source, `d${flags}`);
      const rebuilt = new RegExp(result.source, `d${result.flags}`);
      for (const text of samples)
        assert.deepEqual(
          rebuilt.exec(text),
          original.exec(text),
          `${regex}: ${JSON.stringify(text)}\n${translated.rules}`,
        );
    }
  assert.equal(regexToRules(/.*?/u).rules, "lazy any text");
  assert.equal(regexToRules(/[^b]*?/u).rules, 'lazy text without: "b"');
  assert.equal(regexToRules(/(?:AB)+?/u).rules, 'lazy one or more "AB"');
});

test("lazy diagnostics retain item, count, reference and depth budgets with original source positions", () => {
  for (const [rules, code, column] of [
    ["  lazy", "INVALID_LAZY_REPETITION", 3],
    ["lazy lazy digits", "INVALID_LAZY_REPETITION", 1],
    ["lazy digit", "INVALID_LAZY_REPETITION", 1],
    ['lazy "AB"', "INVALID_LAZY_REPETITION", 1],
    ["lazy group {\n}", "INVALID_LAZY_REPETITION", 1],
    ["lazy optional start", "ANCHOR_REPETITION", 15],
    ["lazy between 2 and 1001 digit", "REPETITION_LIMIT", 20],
    ["lazy between 3 and 2 digit", "INVALID_RANGE", 20],
    ["lazy 1.5 digit", "INVALID_REPETITION", 6],
    ["lazy optional 2 digits", "DUPLICATE_REPETITION", 15],
    ['lazy 2 ""', "EMPTY_LITERAL", 8],
    ['lazy one or more "A" extra', "TRAILING_TEXT", 22],
    ["lazy optional same as capture 7", "MISSING_CAPTURE_REFERENCE", 31],
  ])
    assert.throws(() => compile(rules), { code, line: 1, column });
  const nested = (depth) => `${"lazy optional group {\n".repeat(depth)}"a"\n${"}\n".repeat(depth)}`;
  assert.equal(toRegExp(compile(nested(LIMITS.groupDepth))).test(""), true);
  assert.throws(() => compile(nested(LIMITS.groupDepth + 1)), {
    code: "GROUP_DEPTH_LIMIT",
    line: 65,
  });
  assert.throws(() => regexToRules(new RegExp(String.raw`\d*?`.repeat(201), "u")), {
    code: "LINE_LIMIT",
    line: 1,
    column: 1,
  });
});

test("lazy explanations describe shortest-first backtracking without claiming longest text or runtime traces", () => {
  for (const rules of [
    "lazy any text",
    'lazy text without: "x"',
    "lazy digits",
    'lazy optional "-"',
    'lazy one or more group {\n"AB"\n}',
  ]) {
    const result = compile(rules);
    assert.match(
      result.segments[0].explanation,
      /fewest repetitions first.*following rules require/u,
    );
    assert.doesNotMatch(result.segments[0].explanation, /Longest/u);
  }
  assert.match(compile('lazy optional "-"').segments[0].explanation, /Optional\./u);
  assert.match(compile("lazy 3 digits").segments[0].explanation, /fixed count/u);
  assert.equal(compile("any text").segments[0].explanation, "Longest text, excluding line breaks.");
});

test("CLI forward JSON and reverse rules expose the same lazy semantics and diagnostics", () => {
  const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
  const forward = spawnSync(process.execPath, [cli, "--json", "-"], {
    input: "lazy digits",
    encoding: "utf8",
  });
  assert.equal(forward.status, 0, forward.stderr);
  const result = JSON.parse(forward.stdout);
  assert.equal(result.source, String.raw`\d+?`);
  assert.equal(result.segments[0].repetition.lazy, true);
  const reverse = spawnSync(process.execPath, [cli, "--reverse", "-"], {
    input: "/(?<id>\\d+?)-/u",
    encoding: "utf8",
  });
  assert.equal(reverse.status, 0, reverse.stderr);
  const expression = toRegExp(compile(reverse.stdout.trim()));
  assert.equal(expression.exec("123-").groups.id, "123");
  const invalid = spawnSync(process.execPath, [cli, "-"], {
    input: "lazy digit",
    encoding: "utf8",
  });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Line 1, column 1: Lazy needs an explicit repetition/u);
});
