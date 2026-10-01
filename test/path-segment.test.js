import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";
import { parse } from "../src/parser.js";

const source = String.raw`[^\/\\\u{0}\u{a}\u{d}\u{2028}\u{2029}]`;
const explicit = 'none of: "/", "\\\\", "\\u0000", "\\n", "\\r", "\\u2028", "\\u2029"';
const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));

test("path segment characters have singular/plural defaults and ordinary repetition metadata", () => {
  for (const [rule, repetition, suffix] of [
    ["path segment character", null, ""],
    ["PATH SEGMENT CHARACTERS", { kind: "oneOrMore" }, "+"],
    ["3 path segment characters", { kind: "exact", min: 3 }, "{3}"],
    ["between 1 and 32 path segment characters", { kind: "range", min: 1, max: 32 }, "{1,32}"],
    ["optional path segment character", { kind: "range", min: 0, max: 1 }, "{0,1}"],
    ["zero or more path segment characters", { kind: "zeroOrMore" }, "*"],
    ["at least 2 path segment characters", { kind: "atLeast", min: 2 }, "{2,}"],
  ]) {
    const node = parse(rule).nodes[0];
    assert.deepEqual(node.repetition, repetition);
    assert.equal(compile(rule).source, source + suffix);
    assert.match(
      compile(rule).segments[0].explanation,
      /Path segment character.*slash.*backslash.*NUL.*line break/u,
    );
  }
});

test("readable path characters preserve the explicit exclusion list and Unicode bounds", () => {
  const forbidden = ["/", "\\", "\0", "\n", "\r", "\u2028", "\u2029"];
  const samples = [
    ...Array.from({ length: 256 }, (_, point) => String.fromCodePoint(point)),
    ...forbidden,
    "é",
    "😀",
    "K",
    "ſ",
    "\ud800",
    "\udfff",
    "\u{10ffff}",
  ];
  for (const flags of ["", "i", "s", "is"]) {
    const result = compile("start\npath segment character\nend", { flags });
    const previous = compile(`start\n${explicit}\nend`, { flags });
    assert.equal(result.source, previous.source);
    for (const sample of samples) {
      assert.equal(
        toRegExp(result).test(sample),
        !forbidden.includes(sample),
        JSON.stringify(sample),
      );
    }
    const bounded = toRegExp(
      compile("start\nbetween 1 and 32 path segment characters\nend", { flags }),
    );
    for (const length of [0, 1, 31, 32, 33]) {
      for (const character of ["a", "é", "😀"])
        assert.equal(bounded.test(character.repeat(length)), length >= 1 && length <= 32);
    }
    for (const character of forbidden) assert.equal(bounded.test(`a${character}b`), false);
    for (const value of [".", "..", "CON", "a:b", "a?b", "a b"])
      assert.equal(bounded.test(value), true, "shape does not enforce filesystem policy");
    const reversed = regexToRules(
      toRegExp(compile("start\nbetween 1 and 32 path segment characters\nend", { flags })),
    );
    assert.equal(reversed.rules, "start\nbetween 1 and 32 path segment character\nend");
    assert.equal(reversed.flags, flags);
    assert.equal(compile(reversed.rules, { flags: reversed.flags }).source, `^${source}{1,32}$`);
  }
});

test("malformed path character rules keep positioned diagnostics and a readable repair hint", () => {
  for (const [rule, code, column] of [
    ["path segment", "UNKNOWN_RULE", 1],
    ["path segment characters 3 times", "UNKNOWN_RULE", 1],
    ["2 path segment characters extra", "UNKNOWN_RULE", 3],
    ["2 3 path segment characters", "DUPLICATE_REPETITION", 3],
    ["between 4 and 2 path segment characters", "INVALID_RANGE", 15],
    ["1001 path segment characters", "REPETITION_LIMIT", 1],
  ]) {
    assert.throws(() => compile(rule), { code, line: 1, column });
  }
  assert.throws(() => compile("path segment"), {
    hint: "Use `path segment character` for one character or `path segment characters` for one or more.",
  });
});

test("CLI JSON and explanations expose the same readable path rule", () => {
  const rules = "start\nbetween 1 and 32 path segment characters\nend";
  const result = spawnSync(process.execPath, [cli, "--json", "-"], {
    input: rules,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.deepEqual(JSON.parse(result.stdout), compile(rules));
  const explained = spawnSync(process.execPath, [cli, "--explain", "-"], {
    input: rules,
    encoding: "utf8",
  });
  assert.equal(explained.status, 0, explained.stderr);
  assert.match(explained.stdout, /Path segment character.*Between 1 and 32 times/u);
  assert.doesNotMatch(explained.stdout, /Any character except/u);
});
