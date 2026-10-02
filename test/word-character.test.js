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

test("complete ASCII word classes translate across range orders, duplicates, flags and counts", () => {
  let orders = [[]];
  for (const part of ["A-Z", "a-z", "0-9", "_"]) {
    const next = [];
    for (const order of orders) {
      for (let index = 0; index <= order.length; index += 1) {
        next.push([...order.slice(0, index), part, ...order.slice(index)]);
      }
    }
    orders = next;
  }
  assert.equal(orders.length, 24);
  const bodies = [
    ...orders.map((order) => order.join("")),
    "A-ZA-Za-z0-9_",
    "_0-9a-zA-Z_",
    "A-Za-z0-9_A-Za-z0-9_",
  ];
  const samples = [
    ...Array.from({ length: 128 }, (_, point) => String.fromCodePoint(point)),
    "",
    "A_7",
    "____",
    "_____",
    "Kſ",
    "é",
    "é😀",
    "😀",
    "😀😀",
    "\ud800",
    "\udfff",
    "a-b",
    "a b",
    "\nA_7\n",
    "\r\né😀\r\n",
    "\u2028A_7\u2029",
  ];
  for (const body of bodies) {
    for (const negative of [false, true]) {
      const phrase = negative ? "not word" : "word";
      for (const [suffix, rule] of [
        ["", phrase],
        ["?", `optional ${phrase}`],
        ["*", `zero or more ${phrase}`],
        ["+", `one or more ${phrase}`],
        ["{0}", `0 ${phrase}`],
        ["{3}", `3 ${phrase}`],
        ["{2,4}", `between 2 and 4 ${phrase}`],
        ["{2,}", `at least 2 ${phrase}`],
      ]) {
        for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
          const original = new RegExp(`^[${negative ? "^" : ""}${body}]${suffix}$`, flags);
          original.lastIndex = 7;
          const translated = regexToRules(original);
          const anchor = flags.includes("m") ? "line " : "";
          assert.equal(translated.rules, `${anchor}start\n${rule}\n${anchor}end`);
          const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
          assert.equal(rebuilt.flags, flags);
          for (const sample of samples)
            assert.deepEqual(
              rebuilt.exec(sample),
              original.exec(sample),
              `${original.source} ${flags} ${JSON.stringify(sample)}`,
            );
          assert.equal(original.lastIndex, 7);
        }
      }
    }
  }
  for (const body of [
    "A-Za-z0-9",
    "A-Za-z_",
    "A-Z0-9_",
    "a-z0-9_",
    "A-Za-z0-9_.",
    "A-Za-z0-9_é",
    "A-Za-z0-9_-",
    "A-Ya-z0-9_",
  ]) {
    for (const negative of [false, true]) {
      assert.throws(() => regexToRules(new RegExp(`^[${negative ? "^" : ""}${body}]+$`, "u")), {
        code: "UNSUPPORTED_REGEX",
        line: 1,
        column: negative ? 5 : 4,
      });
    }
  }
});

test("CLI reverse emits reusable complete word classes and rejects nearby unsupported ranges", () => {
  for (const body of ["A-Za-z0-9_", "_0-9a-zA-Z_", "^A-Za-z0-9_", "^_0-9a-zA-Z_"]) {
    const original = new RegExp(`^[${body}]{2,4}$`, "iu");
    const translated = regexToRules(original);
    for (const json of [false, true]) {
      const result = spawnSync(
        process.execPath,
        [cli, "--reverse", ...(json ? ["--json"] : []), "-"],
        {
          input: original.toString(),
          encoding: "utf8",
        },
      );
      assert.equal(result.status, 0, result.stderr);
      if (json) {
        assert.equal(result.stderr, "");
        assert.deepEqual(JSON.parse(result.stdout), translated);
      } else {
        assert.equal(result.stdout, `${translated.rules}\n`);
        assert.equal(
          result.stderr,
          "Compile these rules with --ignore-case to preserve the regex flags, or use --json.\n",
        );
      }
      const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
      for (const sample of ["A_7", "Kſ", "é😀", "a-b", "\ud800", "_____", ""])
        assert.deepEqual(rebuilt.exec(sample), original.exec(sample));
    }
  }
  const result = spawnSync(process.execPath, [cli, "--reverse", "--json", "-"], {
    input: "/^[A-Za-z0-9_.]+$/u",
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.deepEqual(JSON.parse(result.stderr).error, {
    code: "UNSUPPORTED_REGEX",
    message: "Character ranges are supported only for digit, letter, word and hex classes.",
    line: 1,
    column: 4,
    hint: "Supported syntax includes literals, anchors, common character classes, repetition, non-capturing literal or empty groups and i/s/u/m flags. Capturing or complex groups, alternation, lookaround and backreferences are not supported.",
  });
});
