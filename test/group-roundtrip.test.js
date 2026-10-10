import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";
import { LIMITS } from "../src/parser.js";

const samples = [
  "",
  "a",
  "aa",
  "ab",
  "aba",
  "abb",
  "aab",
  "ABC",
  "AB12",
  "AB1AB2",
  "12212",
  "cat cat",
  "cat dog",
  "CAT cat",
  "😀",
  "😀😀",
  "éé",
  "éé",
  "\nA",
  "\na\n",
  "2026-10-10",
  "2026-1-10",
  "\ud83d",
  "\ude00",
  "😀A",
];

function check(regex, values = samples) {
  const translated = regexToRules(regex);
  const result = compile(translated.rules, { flags: translated.flags });
  const original = new RegExp(regex.source, `${regex.flags}d`);
  const rebuilt = new RegExp(result.source, `${result.flags}d`);
  for (const value of values)
    assert.deepEqual(
      rebuilt.exec(value),
      original.exec(value),
      `${regex} against ${JSON.stringify(value)}`,
    );
  return translated;
}

test("group imports preserve names, ordering, absent/empty values, repetitions and capture indices", () => {
  for (const source of [
    String.raw`^(?<date>(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2}))$`,
    String.raw`^(a(b)?)\2$`,
    String.raw`^(?<word>[A-Za-z]+)\s\k<word>$`,
    String.raw`^((?:AB\d?){2})(C)?\1$`,
    String.raw`^((\d){2})\2\1$`,
    String.raw`(?<année>é+)\k<année>`,
    String.raw`(?<\u0061>a)\k<\u0061>`,
    String.raw`(?<\u{1D49C}>a)\k<\u{1D49C}>`,
    "(?:(?:))",
    "(?:(?:))*",
    "()",
    "(){0}",
    "(())?",
    "(?<empty>)*",
    "(?<x>😀)?(?<empty>)",
    "(?:[^].)+",
    "([^.]+)([^])",
    "(?:^a$)",
    "((?:a)+)?",
    "(?:AB(?:CD)?)",
    String.raw`(?:\u{D83D}\u{DE00})+`,
  ])
    for (const flags of ["u", "iu", "su", "isu", "mu", "imsu"]) check(new RegExp(source, flags));
});

test("literal-group normalization remains compact while composite groups become editable blocks", () => {
  assert.deepEqual(regexToRules(/^(?:AB){2}$/u), { rules: 'start\n2 "AB"\nend', flags: "" });
  assert.equal(regexToRules(/(?:)+/u).rules, "0 any character");
  const translated = check(/^(?<year>\d{4})(?:-\d{2})?$/u, ["2026", "2026-10", "2026-1", "12026"]);
  assert.equal(
    translated.rules,
    'start\ncapture "year" {\n4 digit\n}\noptional group {\n"-"\n2 digit\n}\nend',
  );
});

test("generated group/reference combinations round-trip against native matches and indices", () => {
  for (const outer of ["", "optional ", "2 ", "between 0 and 2 "]) {
    for (const inner of ["", "optional ", "one or more "]) {
      for (const reference of ['"inner"', "2"]) {
        const rules = `start\n${outer}capture "outer" {\n${inner}capture "inner" {\n"a"\n}\noptional "b"\n}\nsame as capture ${reference}\nend`;
        for (const flags of ["", "i", "s", "is"]) check(toRegExp(compile(rules, { flags })));
      }
    }
  }
});

test("forward/open reference diagnostics point into original regex source without running it", () => {
  for (const [source, column, message] of [
    [String.raw`\1(a)`, 1, "A capture reference must follow its capture."],
    [String.raw`😀\k<later>(?<later>a)`, 3, "A capture reference must follow its capture."],
    [String.raw`(a\1)`, 3, "A capture reference must follow the capture's closing brace."],
    [String.raw`(?<a>😀\k<a>)`, 8, "A capture reference must follow the capture's closing brace."],
  ]) {
    const regex = new RegExp(source, "u");
    regex.lastIndex = 7;
    assert.throws(() => regexToRules(regex), {
      code: "UNSUPPORTED_REGEX",
      line: 1,
      column,
      message,
    });
    assert.equal(regex.lastIndex, 7);
  }
  const nested = (depth) => `${"(".repeat(depth)}a${")".repeat(depth)}`;
  check(new RegExp(nested(LIMITS.groupDepth), "u"));
  assert.throws(() => regexToRules(new RegExp(nested(LIMITS.groupDepth + 1), "u")), {
    code: "GROUP_DEPTH_LIMIT",
    line: 1,
    column: LIMITS.groupDepth + 1,
  });
});

test("CLI reverse imports captures and references as reusable JSON rules", () => {
  const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
  const literal = String.raw`/^(?<word>[A-Za-z]+)\s\k<word>$/iu`;
  const output = spawnSync(process.execPath, [cli, "--reverse", "--json", "-"], {
    input: literal,
    encoding: "utf8",
  });
  assert.equal(output.status, 0, output.stderr);
  const translated = JSON.parse(output.stdout);
  assert.equal(
    toRegExp(compile(translated.rules, { flags: translated.flags })).test("CAT cat"),
    true,
  );
  assert.deepEqual(translated, regexToRules(/^(?<word>[A-Za-z]+)\s\k<word>$/iu));
});
