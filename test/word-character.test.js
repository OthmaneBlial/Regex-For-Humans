import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";
import { parse } from "../src/parser.js";

const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
const forms = [
  ["word character", null, ""],
  ["WORD CHARACTERS", { kind: "oneOrMore" }, "+"],
  ["0 word characters", { kind: "exact", min: 0 }, "{0}"],
  ["3 word characters", { kind: "exact", min: 3 }, "{3}"],
  ["between 2 and 4 word characters", { kind: "range", min: 2, max: 4 }, "{2,4}"],
  ["optional word character", { kind: "range", min: 0, max: 1 }, "{0,1}"],
  ["zero or more word characters", { kind: "zeroOrMore" }, "*"],
  ["at least 2 word characters", { kind: "atLeast", min: 2 }, "{2,}"],
];

test("explicit word-character names have singular/plural defaults and count overrides", () => {
  for (const [rule, repetition, suffix] of forms) {
    const node = parse(rule).nodes[0];
    assert.equal(node.atomType, "shorthand");
    assert.equal(node.value, "\\w");
    assert.deepEqual(node.repetition, repetition);
    assert.equal(compile(rule).source, `\\w${suffix}`);
    assert.match(
      compile(rule).segments[0].explanation,
      /Word character: ASCII letter, digit or underscore/u,
    );
  }
  assert.equal(compile("word").source, "\\w");
  assert.equal(compile("not word").source, "\\W");
  assert.equal(
    regexToRules(/\w+/u).rules,
    "one or more word",
    "existing reverse wording stays compatible",
  );
});

test("word-character names preserve native matching and Unicode case folding under all flags", () => {
  const samples = [
    ...Array.from({ length: 256 }, (_, point) => String.fromCodePoint(point)),
    "",
    "ABC",
    "A_7",
    "ABCD",
    "ABCDE",
    "K",
    "ſ",
    "Kſ",
    "é",
    "😀",
    "\ud800",
    "\udfff",
    "\nA_7\n",
    "a-b",
  ];
  for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
    const line = flags.includes("m") ? "line " : "";
    for (const [rule, , suffix] of forms) {
      const result = compile(`${line}start\n${rule}\n${line}end`, {
        flags: flags.replace(/[mu]/gu, ""),
      });
      const rebuilt = toRegExp(result);
      const native = new RegExp(`^\\w${suffix}$`, flags);
      assert.equal(rebuilt.flags, native.flags);
      for (const sample of samples)
        assert.deepEqual(
          rebuilt.exec(sample),
          native.exec(sample),
          `${rule} ${flags} ${JSON.stringify(sample)}`,
        );
    }
  }
  assert.equal(toRegExp(compile("start\nword characters\nend")).test("Kſ"), false);
  assert.equal(toRegExp(compile("start\nword characters\nend", { flags: "i" })).test("Kſ"), true);
  assert.equal(toRegExp(compile("start\nword characters\nend", { flags: "i" })).test("é"), false);
});

test("malformed word-character names have positioned diagnostics and explicit repair wording", () => {
  for (const [rule, code, column] of [
    ["words", "UNKNOWN_RULE", 1],
    ["word character extra", "UNKNOWN_RULE", 1],
    ["2 word characters extra", "UNKNOWN_RULE", 3],
    ["word characters 3 times", "UNKNOWN_RULE", 1],
    ["2 3 word characters", "DUPLICATE_REPETITION", 3],
    ["between 4 and 2 word characters", "INVALID_RANGE", 15],
    ["1001 word characters", "REPETITION_LIMIT", 1],
  ])
    assert.throws(() => compile(rule), { code, line: 1, column });
  assert.throws(() => compile("words"), {
    hint: "Use `word character` for one ASCII letter, digit or underscore, or `word characters` for one or more.",
  });
  assert.throws(() => compile("alphanumeric character"), { code: "UNKNOWN_RULE" });
});

test("CLI exposes explicit word-character names through the shared compiler", () => {
  const rules = "start\nbetween 2 and 4 word characters\nend";
  const output = spawnSync(process.execPath, [cli, "--json", "--ignore-case", "-"], {
    input: rules,
    encoding: "utf8",
  });
  assert.equal(output.status, 0, output.stderr);
  assert.equal(output.stderr, "");
  assert.deepEqual(JSON.parse(output.stdout), compile(rules, { flags: "i" }));
});
