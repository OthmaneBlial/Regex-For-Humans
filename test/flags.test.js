import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { compile, regexToRules, toRegExp } from "../index.js";
import { flagSets, inputs, patterns } from "./fixtures/advanced-flags-corpus.js";

test("all 128 flag combinations retain native matches, captures, indices and cursor state in both directions", () => {
  let comparisons = 0;
  for (const flags of flagSets) {
    for (const source of patterns) {
      const before = new RegExp(source, flags);
      before.lastIndex = 2;
      const translated = regexToRules(before);
      assert.equal(before.lastIndex, 2);
      const result = compile(translated.rules, { flags: translated.flags });
      assert.equal(result.flags, flags, `${source}/${flags}`);
      const after = toRegExp(result);
      for (const input of inputs) {
        for (const cursor of [0, 1, 2]) {
          before.lastIndex = cursor;
          after.lastIndex = cursor;
          for (let step = 0; step < 3; step += 1) {
            assert.deepEqual(
              after.exec(input),
              before.exec(input),
              `${source}/${flags}: ${JSON.stringify(input)} at ${cursor}, step ${step}`,
            );
            assert.equal(after.lastIndex, before.lastIndex);
            comparisons += 1;
          }
        }
      }
    }
  }
  assert.equal(comparisons, 184_320);
});

test("input anchors remain absolute under m while mixed line anchors retain native boundaries and trace spans", () => {
  const absolute = compile('start "a"\nend', { flags: "m" });
  assert.equal(absolute.source, "^(?<![\\s\\S])a$(?![\\s\\S])");
  assert.equal(absolute.flags, "mu");
  assert.equal(toRegExp(absolute).test("a"), true);
  for (const input of ["a\n", "\na", "x\na\ny"])
    assert.equal(toRegExp(absolute).test(input), false);
  for (const [rules, source] of [
    ['start "a"\nline end', "^(?<![\\s\\S])a$"],
    ['line start "a"\nend', "^a$(?![\\s\\S])"],
    ["start\ngroup {\nline end\n}", "^(?<![\\s\\S])(?:$)"],
  ]) {
    const result = compile(rules);
    assert.equal(result.source, source);
    assert.equal(result.flags, "mu");
    const translated = regexToRules(toRegExp(result));
    assert.equal(compile(translated.rules, { flags: translated.flags }).source, result.source);
    for (const segment of result.segments)
      assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
    for (const input of ["", "a", "a\n", "\na", "x\na", "a\nx"])
      assert.deepEqual(toRegExp(result).exec(input), new RegExp(source, "mu").exec(input));
  }
});

test("v class escaping preserves reserved punctuation, controls, ranges and individual member spans", () => {
  const values = [
    "!",
    "!",
    "[",
    "]",
    "(",
    ")",
    "{",
    "}",
    "|",
    "&",
    "&",
    ",",
    ",",
    "`",
    "~",
    "-",
    "/",
    "\\",
    "\u202e",
    "😀",
    "\ud800",
  ];
  for (const flags of ["u", "v", "iu", "iv"]) {
    for (const negative of [false, true]) {
      const content = values.map((value) => `\\u{${value.codePointAt(0).toString(16)}}`).join("");
      const native = new RegExp(`[${negative ? "^" : ""}${content}]`, flags);
      for (const prefix of [
        negative ? "none of:" : "one of:",
        negative ? "not character class:" : "character class:",
      ]) {
        const result = compile(
          `${prefix} ${values.map((value) => JSON.stringify(value)).join(", ")}`,
          { flags },
        );
        for (const input of [...values, "a", "", "!!", "\udc00"])
          assert.deepEqual(toRegExp(result).exec(input), native.exec(input));
        if (result.segments[0].atomType === "characterClass")
          for (const member of result.segments[0].members)
            assert.equal(result.source.slice(member.sourceStart, member.sourceEnd), member.source);
        const translated = regexToRules(toRegExp(result));
        const rebuilt = compile(translated.rules, { flags: translated.flags });
        for (const input of [...values, "a"])
          assert.deepEqual(toRegExp(rebuilt).exec(input), native.exec(input));
      }
    }
    const range = compile('range "(" to "|"', { flags });
    for (const input of ["(", ")", "[", "\\", "|", "}", "A"])
      assert.deepEqual(
        toRegExp(range).exec(input),
        new RegExp("[\\u{28}-\\u{7c}]", flags).exec(input),
      );
  }
});

test("v complements explain folding in the selected mode and unsupported nested sets stay explicit", () => {
  const result = compile('not unicode property "Lowercase_Letter"', { flags: "iv" });
  assert.equal(toRegExp(result).test("a"), false);
  assert.match(result.segments[0].explanation, /\(v\).*before complementing/u);
  for (const source of ["[a&&b]", "[a--b]", "[[a]b]"])
    assert.throws(() => regexToRules(new RegExp(source, "v")), { code: "UNSUPPORTED_REGEX" });
});

test("flag validation rejects duplicates, unknown flags and u/v conflicts and probes target capabilities", () => {
  for (const flags of ["uu", "gg", "dd", "uv", "vu", "U", "x", "gu\n", null, {}, 42])
    assert.throws(() => compile("digit", { flags }), {
      code: "UNSUPPORTED_FLAGS",
      line: 1,
      column: 1,
    });
  const NativeRegExp = globalThis.RegExp;
  try {
    globalThis.RegExp = class extends NativeRegExp {
      constructor(source, flags) {
        if (flags?.includes("v") || flags?.includes("d") || String(source).includes("(?<"))
          throw new SyntaxError("Mock unsupported capability");
        super(source, flags);
      }
    };
    for (const flags of ["v", "d"])
      assert.throws(() => compile("digit", { flags }), {
        code: "UNSUPPORTED_TARGET_FEATURE",
        line: 1,
        column: 1,
      });
    assert.throws(() => compile('\n  start "a"\nend', { flags: "m" }), {
      code: "UNSUPPORTED_TARGET_FEATURE",
      line: 2,
      column: 3,
    });
  } finally {
    globalThis.RegExp = NativeRegExp;
  }
});

test("reverse flag metadata ignores instance overrides and leaves native cursor state unchanged", () => {
  const original = /(?<x>a)/dgimsvy;
  original.lastIndex = 37;
  for (const property of [
    "source",
    "flags",
    "global",
    "sticky",
    "unicode",
    "unicodeSets",
    "hasIndices",
    "multiline",
    "ignoreCase",
    "dotAll",
  ])
    Object.defineProperty(original, property, {
      get() {
        throw new Error("Override must not run");
      },
    });
  const translated = regexToRules(original);
  assert.equal(translated.flags, "dgimsvy");
  assert.equal(original.lastIndex, 37);
  assert.equal(compile(translated.rules, { flags: translated.flags }).flags, "dgimsvy");
});

test("CLI accepts explicit flags in both forms and returns reusable reverse options", () => {
  const run = (input, args) =>
    spawnSync(process.execPath, ["bin/regex-for-humans.js", ...args], { input, encoding: "utf8" });
  for (const args of [
    ["--flags", "ygvsimd", "--json"],
    ["--flags=ygvsimd", "--json"],
    ["--ignore-case", "--dot-all", "--flags=ygvsimd", "--json"],
    ["--flags=ygvsimd", "--ignore-case", "--dot-all", "--json"],
  ]) {
    const outcome = run('capture "x" {\nletter\n}', args);
    assert.equal(outcome.status, 0, outcome.stderr);
    assert.equal(JSON.parse(outcome.stdout).flags, "dgimsvy");
  }
  const reverse = run("/(?<x>a)/dgimsvy", ["--reverse", "--json"]);
  assert.equal(reverse.status, 0, reverse.stderr);
  assert.equal(JSON.parse(reverse.stdout).flags, "dgimsvy");
  assert.match(run("/a/dgimsvy", ["--reverse"]).stderr, /--flags dgimsvy/u);
  for (const args of [["--flags"], ["--flags", "--json"], ["--reverse", "--flags="]])
    assert.equal(run("digit", args).status, 2);
  assert.equal(run("digit", ["--flags=uv", "--json"]).status, 1);
  for (const args of [
    ["--ignore-case", "--flags=ii", "--json"],
    ["--flags=ii", "--ignore-case", "--json"],
  ])
    assert.equal(run("digit", args).status, 1);
  assert.equal(
    JSON.parse(run("digit", ["--flags=uv", "--json"]).stderr).error.code,
    "UNSUPPORTED_FLAGS",
  );
});
