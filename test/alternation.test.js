import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";
import { LIMITS, parse } from "../src/parser.js";

const choices = 'start\neither {\n"cat"\n"dog"\n"bird"\n}\nend';

test("each either entry is an ordered choice with exact source navigation", () => {
  const result = compile(choices);
  assert.equal(result.source, "^(?:cat|dog|bird)$");
  for (const text of ["cat", "dog", "bird"]) assert.equal(toRegExp(result).test(text), true);
  for (const text of ["", "catdog", "xcat", "birdx"])
    assert.equal(toRegExp(result).test(text), false);
  assert.equal(parse(choices).nodes[1].branches.length, 3);
  assert.equal(result.segments.map((s) => s.source).join(""), result.source);
  for (const segment of result.segments) {
    assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
    assert.equal(choices.split("\n")[segment.line - 1].trim(), segment.text);
  }
  assert.deepEqual(
    result.segments.filter((s) => s.kind === "alternation").map((s) => [s.edge, s.line]),
    [
      ["start", 2],
      ["branch", 4],
      ["branch", 5],
      ["end", 6],
    ],
  );
  assert.match(result.segments[1].explanation, /3 alternatives.*in order/u);
  assert.equal(toRegExp(compile('either {\n"a"\n"aa"\n}')).exec("aa")[0], "a");
});

test("nested alternatives, sequence branches, captures and whole-choice repetition retain semantics", () => {
  const rules =
    'start\ncapture "outer" {\n2 either {\ncapture "first" {\n"a"\n}\ngroup {\n"b"\neither {\n"c"\n"d"\n}\n}\n}\n}\nsame as capture "first"\nend';
  const expression = toRegExp(compile(rules));
  assert.equal(expression.source, String.raw`^(?<outer>(?:(?<first>a)|(?:b(?:c|d))){2})\k<first>$`);
  assert.deepEqual({ ...expression.exec("aaa").groups }, { outer: "aa", first: "a" });
  assert.deepEqual({ ...expression.exec("abc").groups }, { outer: "abc", first: undefined });
  assert.deepEqual({ ...expression.exec("bdbd").groups }, { outer: "bdbd", first: undefined });
  assert.equal(expression.test("abca"), false);
});

test("choice branches have local anchor ordering and share the input/line anchor contract", () => {
  const result = compile('either {\nstart "a"\ngroup {\n"b"\nend\n}\n}');
  assert.equal(result.source, "(?:^a|(?:b$))");
  for (const text of ["ax", "xb", "ab"]) assert.equal(toRegExp(result).test(text), true);
  assert.equal(toRegExp(result).test("xax"), false);
  assert.equal(toRegExp(compile("either {\nend\nstart\n}")).test("x"), true);
  assert.equal(compile('either {\nline start "a"\nline start "b"\n}').flags, "mu");
  assert.throws(() => compile('either {\nstart "a"\nline start "b"\n}'), {
    code: "MIXED_ANCHORS",
    line: 3,
  });
});

test("choice diagnostics preserve brace, reference, duplicate-name and depth protections", () => {
  for (const [rules, code, line, column] of [
    ["  either {\n}", "ALTERNATIVE_COUNT", 1, 3],
    ['either {\n"a"\n}', "ALTERNATIVE_COUNT", 1, 1],
    ['either\n"a"', "INVALID_GROUP", 1, 7],
    ['either {\n"a"\n"b"', "UNCLOSED_GROUP", 1, 1],
    ['either {\ncapture "x" {\n"a"\n}\ncapture "x" {\n"b"\n}\n}', "DUPLICATE_CAPTURE_NAME", 5, 1],
    ['either {\nsame as capture 1\ncapture {\n"a"\n}\n}', "FORWARD_CAPTURE_REFERENCE", 2, 17],
    ['capture {\neither {\nsame as capture 1\n"a"\n}\n}', "SELF_CAPTURE_REFERENCE", 3, 17],
  ])
    assert.throws(() => compile(rules), { code, line, column });
  const nested = (depth) =>
    `${"either {\n".repeat(depth)}"a"\n"b"\n${'}\n"c"\n'.repeat(depth - 1)}}`;
  assert.equal(toRegExp(compile(nested(LIMITS.groupDepth))).test("a"), true);
  assert.throws(() => compile(nested(LIMITS.groupDepth + 1)), {
    code: "GROUP_DEPTH_LIMIT",
    line: 65,
  });
});

const samples = [
  "",
  "a",
  "aa",
  "aaa",
  "ab",
  "abc",
  "abca",
  "b",
  "bb",
  "bdbd",
  "c",
  "cat",
  "dog",
  "bird",
  "catdog",
  "xcat",
  "CAT",
  "xax",
  "xb",
  "a\nb",
  "\na\n",
  "😀",
  "😀a",
  "a😀",
  "😀😀",
  "\ud83d",
  "\ude00",
  "\n",
  "|",
  "a|b",
  "12",
  "122",
  "é",
  "é",
];

test("native disjunctions round-trip with exact match arrays, names and indices under every supported flag", () => {
  const patterns = [
    "cat|dog|bird",
    "a|aa",
    "^a|b$",
    "^a$|^b$",
    "a|",
    "|a",
    "||",
    "(?:|a|)",
    "^(?:cat|dog)$",
    "(?:ab|c)+",
    "(?:a|(?:b|c)d){0,2}",
    "(a)|(b)",
    "(?<x>a|b)",
    "(?<x>a)|(?<y>b)",
    "((a)|(b))*",
    "(?:(a)|b)\\1",
    "(?<x>a)|\\k<x>",
    "^(?:(a)|b){2}\\1$",
    "(?<empty>)|(?<absent>x)",
    "(?:^a$|^b$)",
    "(?:[^]|.)",
    "(?:.[^]|[^].)",
    "(?:😀|a)+",
    String.raw`(?:\u{D83D}|\u{DE00})+`,
    String.raw`(?:\u{D83D}\u{DE00}|😀)`,
    String.raw`\||[|]|a\|b`,
    "(?<année>é|é)",
    "(?:(a)|b)(?:\\1|c)",
    "(?:a{0}|b{0})+",
    "(?:a|b)(?:c|d)",
  ];
  for (const source of patterns)
    for (const flags of ["u", "iu", "mu", "imu", "su", "isu", "msu", "imsu"]) {
      const regex = new RegExp(source, flags);
      regex.lastIndex = 7;
      const translated = regexToRules(regex);
      assert.equal(regex.lastIndex, 7);
      const compiled = compile(translated.rules, { flags: translated.flags });
      const original = new RegExp(source, `${flags}d`);
      const rebuilt = new RegExp(compiled.source, `${compiled.flags}d`);
      for (const text of samples)
        assert.deepEqual(
          rebuilt.exec(text),
          original.exec(text),
          `${regex} against ${JSON.stringify(text)}\n${translated.rules}`,
        );
    }
  assert.equal(regexToRules(/cat|dog|bird/u).rules, 'either {\n"cat"\n"dog"\n"bird"\n}');
});

test("alternatives use the installed CLI paths in both directions", () => {
  const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
  const forward = spawnSync(process.execPath, [cli, "--json", "-"], {
    input: choices,
    encoding: "utf8",
  });
  assert.equal(forward.status, 0, forward.stderr);
  assert.deepEqual(JSON.parse(forward.stdout), compile(choices));
  const reverse = spawnSync(process.execPath, [cli, "--reverse", "--json", "-"], {
    input: "/(?<pet>cat|dog|bird)/iu",
    encoding: "utf8",
  });
  assert.equal(reverse.status, 0, reverse.stderr);
  const translated = JSON.parse(reverse.stdout);
  assert.equal(
    toRegExp(compile(translated.rules, { flags: translated.flags })).exec("DOG").groups.pet,
    "DOG",
  );
});

test("alternative imports retain translated line and nesting budgets with regex positions", () => {
  assert.equal(
    regexToRules(new RegExp(Array(198).fill("a").join("|"), "u")).rules.split("\n").length,
    200,
  );
  assert.throws(() => regexToRules(new RegExp(Array(199).fill("a").join("|"), "u")), {
    code: "LINE_LIMIT",
    line: 1,
    column: 1,
  });
  const source = `${"(".repeat(64)}a|b${")".repeat(64)}`;
  assert.throws(() => regexToRules(new RegExp(source, "u")), {
    code: "GROUP_DEPTH_LIMIT",
    line: 1,
    column: 65,
    message: "Translated rules cannot nest more than 64 levels.",
  });
});
