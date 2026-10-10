import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, toRegExp } from "../index.js";
import { LIMITS } from "../src/parser.js";

const dateRules =
  'start\ncapture "date" {\n  capture "year" {\n    4 digits\n  }\n  "-"\n  capture {\n    2 digits\n  }\n}\nend';

test("nested captures preserve numbering, names, values and every source span", () => {
  const result = compile(dateRules);
  assert.equal(result.source, String.raw`^(?<date>(?<year>\d{4})-(\d{2}))$`);
  const match = toRegExp(result).exec("2026-10");
  assert.deepEqual(Array.from(match), ["2026-10", "2026-10", "2026", "10"]);
  assert.deepEqual({ ...match.groups }, { date: "2026-10", year: "2026" });
  assert.equal(toRegExp(result).test("2026-1"), false);
  assert.deepEqual(
    result.segments
      .filter((s) => s.kind === "group" && s.edge === "start")
      .map((s) => [s.captureIndex, s.name]),
    [
      [1, "date"],
      [2, "year"],
      [3, null],
    ],
  );
  assert.equal(result.segments.map((s) => s.source).join(""), result.source);
  for (const segment of result.segments) {
    assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
    assert.equal(dateRules.split("\n")[segment.line - 1].trim(), segment.text);
  }
  assert.match(result.segments[1].explanation, /Capture #1 named "date"/u);
});

test("group repetition keeps sequences together and distinguishes absent and empty captures", () => {
  for (const [modifier, quantifier, yes, no] of [
    ["optional", "{0,1}", "", "ABAB"],
    ["zero or more", "*", "ABAB", "A"],
    ["one or more", "+", "ABAB", ""],
    ["2", "{2}", "ABAB", "AB"],
    ["between 2 and 3", "{2,3}", "ABABAB", "AB"],
    ["at least 2", "{2,}", "ABABAB", "AB"],
  ]) {
    const result = compile(`start\n${modifier} group {\n"A"\n"B"\n}\nend`);
    assert.equal(result.source, `^(?:AB)${quantifier}$`);
    assert.equal(toRegExp(result).test(yes), true);
    assert.equal(toRegExp(result).test(no), false);
  }
  const expression = toRegExp(
    compile('start\noptional capture "value" {\n"😀"\n}\ncapture "empty" {\n}\nend'),
  );
  assert.deepEqual({ ...expression.exec("").groups }, { value: undefined, empty: "" });
  assert.deepEqual({ ...expression.exec("😀").groups }, { value: "😀", empty: "" });
  assert.equal(
    toRegExp(compile('start\n2 capture "last" {\ndigit\n}\nend')).exec("12").groups.last,
    "2",
  );
});

test("Unicode capture names are identifiers and quoted punctuation stays data", () => {
  const expression = toRegExp(compile('start\ncapture "année" {\n"{😀}"\n}\nend'));
  assert.equal(expression.exec("{😀}").groups.année, "{😀}");
  for (const name of ["", "123", "a-b", "😀", "a>b", "a\u202e"]) {
    assert.throws(() => compile(`capture ${JSON.stringify(name)} {\n}`), {
      code: "INVALID_CAPTURE_NAME",
      line: 1,
      column: 9,
    });
  }
});

test("group diagnostics are positioned and nesting is bounded", () => {
  for (const [source, code, line, column] of [
    ["}", "UNEXPECTED_GROUP_END", 1, 1],
    ['  capture "a" {\n digit', "UNCLOSED_GROUP", 1, 3],
    ['capture "a" {\n}\ncapture "a" {\n}', "DUPLICATE_CAPTURE_NAME", 3, 1],
    ['capture "a"', "INVALID_GROUP", 1, 9],
    ["group {\n1001 digit\n}", "REPETITION_LIMIT", 2, 1],
    ["optional optional group {\n}", "DUPLICATE_REPETITION", 1, 10],
    ["end\ngroup {\n}", "MISPLACED_ANCHOR", 2, 1],
  ])
    assert.throws(() => compile(source), { code, line, column });
  const nested = (depth) => `${"group {\n".repeat(depth)}digit\n${"}\n".repeat(depth)}`;
  assert.equal(toRegExp(compile(nested(LIMITS.groupDepth))).test("1"), true);
  assert.throws(() => compile(nested(LIMITS.groupDepth + 1)), {
    code: "GROUP_DEPTH_LIMIT",
    line: LIMITS.groupDepth + 1,
    column: 1,
  });
});

test("CLI JSON and explanations use the same group compiler", () => {
  const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
  const json = spawnSync(process.execPath, [cli, "--json", "-"], {
    input: dateRules,
    encoding: "utf8",
  });
  assert.equal(json.status, 0, json.stderr);
  assert.deepEqual(JSON.parse(json.stdout), compile(dateRules));
  const explained = spawnSync(process.execPath, [cli, "--explain", "-"], {
    input: dateRules,
    encoding: "utf8",
  });
  assert.equal(explained.status, 0, explained.stderr);
  assert.match(explained.stdout, /Capture #2 named "year"/u);
});

test("anchors retain local ordering and global multiline semantics inside groups", () => {
  const input = compile('group {\nstart "A"\nend\n}');
  assert.equal(input.source, "(?:^A$)");
  assert.equal(toRegExp(input).test("A"), true);
  assert.equal(toRegExp(input).test("BA"), false);
  const line = compile('capture {\nline start "A"\nline end\n}');
  assert.equal(line.flags, "mu");
  assert.equal(toRegExp(line).exec("B\nA")[1], "A");
  const mixed = toRegExp(compile("start\ngroup {\nline end\n}"));
  assert.equal(mixed.flags, "mu");
  assert.equal(mixed.exec("\nA")?.index, 0);
  assert.equal(mixed.test("A\n"), false);
  assert.throws(() => compile('group {\nend\n"A"\n}'), { code: "MISPLACED_ANCHOR", line: 3 });
  assert.throws(() => compile('group {\n"A"\nstart\n}'), { code: "MISPLACED_ANCHOR", line: 3 });
});
