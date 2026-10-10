import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";
import { parse } from "../src/parser.js";

test("word boundaries have explicit zero-width AST nodes and exact source metadata", () => {
  const rules = '  WORD\tBOUNDARY\n"cat"\n  not word boundary';
  const parsed = parse(rules);
  assert.deepEqual(
    parsed.nodes.map((node) => node.kind),
    ["boundary", "atom", "boundary"],
  );
  assert.equal(parsed.anchorMode, null);
  const result = compile(rules);
  assert.equal(result.source, String.raw`\bcat\B`);
  assert.deepEqual(
    result.segments
      .filter((segment) => segment.kind === "boundary")
      .map((segment) => [segment.negative, segment.line, segment.column]),
    [
      [false, 1, 3],
      [true, 3, 3],
    ],
  );
  for (const segment of result.segments) {
    assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
    assert.equal(rules.split("\n")[segment.line - 1].trim(), segment.text);
  }
  assert.equal(toRegExp(result).exec("cats")[0], "cat");
  assert.equal(toRegExp(result).test("cat"), false);
  const explanation = result.segments[0].explanation;
  assert.match(explanation, /without consuming characters/u);
  assert.match(explanation, /ASCII letters, digits and underscore/u);
  assert.match(explanation, /not natural-language word segmentation/u);
  assert.match(
    compile("not word boundary", { flags: "i" }).segments[0].explanation,
    /Unicode characters folding/u,
  );
});

test("native word status includes input edges, empty strings, Unicode folding and combining marks", () => {
  const word = toRegExp(compile('word boundary\n"cat"\nword boundary'));
  for (const input of ["cat", " cat!", "😀cat😀", "écaté", "cat\u0301"])
    assert.equal(word.test(input), true, input);
  for (const input of ["scat", "cats", "_cat_", "1cat2"])
    assert.equal(word.test(input), false, input);
  assert.equal(toRegExp(compile("start\nnot word boundary\nend")).test(""), true);
  assert.equal(toRegExp(compile("start\nword boundary\nend")).test(""), false);
  assert.equal(toRegExp(compile('start\nword boundary\n"é"\nword boundary\nend')).test("é"), false);
  const kelvin = 'start\nword boundary\n"K"\nword boundary\nend';
  const longS = 'start\nword boundary\n"ſ"\nword boundary\nend';
  for (const [rules, input] of [
    [kelvin, "K"],
    [longS, "ſ"],
  ]) {
    assert.equal(toRegExp(compile(rules)).test(input), false);
    assert.equal(toRegExp(compile(rules, { flags: "i" })).test(input), true);
  }
  assert.equal(compile('"\\b"').source, String.raw`\u{8}`);
  assert.equal(compile('"\\\\b"').source, String.raw`\\b`);
  assert.equal(regexToRules(/[\b]/u).rules, '"\\b"');
  assert.equal(toRegExp(compile(regexToRules(/[\b]/u).rules)).test("\b"), true);
});

test("boundary imports preserve full native captures and indices across flags and structures", () => {
  const patterns = [
    String.raw`\b`,
    String.raw`\B`,
    String.raw`^\B$`,
    String.raw`^\b$`,
    String.raw`\bcat\b`,
    String.raw`\Bcat\B`,
    String.raw`\b\w+\b`,
    String.raw`\b(?<word>\w+)\b`,
    String.raw`\b(?<word>\w+?)\b`,
    String.raw`(?<edge>\b)cat(?<end>\b)`,
    String.raw`(?<edge>\B)`,
    String.raw`(?:\bcat|\Bcat)`,
    String.raw`(?:(\b)cat|(\B)cat)`,
    String.raw`(?:(\b)?a)+`,
    String.raw`(?:\b\w+\s?){1,3}?`,
    String.raw`(?<word>\w+)\s\b\k<word>\b`,
    String.raw`(?=\bcat)cat`,
    String.raw`(?<=\bcat)\B`,
    String.raw`(?<!\B)cat`,
    String.raw`(?!\b)cat`,
    String.raw`^\b\w+\b$`,
    String.raw`^\B.\B$`,
    String.raw`\bK\b`,
    String.raw`\bſ\b`,
    String.raw`\Bé\B`,
    String.raw`\b😀\B`,
    String.raw`[\b]\b`,
    String.raw`\\b\B`,
  ];
  const inputs = [
    "",
    "cat",
    "CAT",
    "scat",
    "cats",
    " cat!",
    " cat ",
    "cat cat",
    "cat dog",
    "aa",
    "a",
    "a a",
    "_",
    "0",
    "1cat2",
    "_cat_",
    "foo_bar",
    "é",
    "écaté",
    "écat",
    "caté",
    "K",
    "k",
    "K",
    "ſ",
    "s",
    "😀",
    "😀cat😀",
    "cat\u0301",
    "é\u0301",
    "中文",
    "عربي",
    "اردو",
    "\ncat\n",
    "\r\ncat\r\n",
    "\u2028cat\u2029",
    "\bcat",
    "\\b",
    " ",
    "\t",
    "\ud83d",
    "\ude00",
  ];
  let comparisons = 0;
  for (let bits = 0; bits < 8; bits += 1) {
    const flags = `${bits & 1 ? "i" : ""}${bits & 2 ? "m" : ""}${bits & 4 ? "s" : ""}u`;
    for (const source of patterns) {
      const original = new RegExp(source, flags);
      const translated = regexToRules(original);
      const result = compile(translated.rules, { flags: translated.flags });
      const before = new RegExp(original.source, `d${flags}`);
      const after = new RegExp(result.source, `d${result.flags}`);
      for (const input of inputs) {
        assert.deepEqual(
          after.exec(input),
          before.exec(input),
          JSON.stringify({ source, flags, input }),
        );
        comparisons += 1;
      }
    }
  }
  assert.equal(comparisons, patterns.length * 8 * inputs.length);
  assert.equal(regexToRules(/\bcat\B/u).rules, 'word boundary\n"cat"\nnot word boundary');
});

test("boundaries reject direct counts and lazy modifiers without changing anchor policy", () => {
  for (const prefix of [
    "optional",
    "zero or more",
    "one or more",
    "0",
    "3",
    "at least 2",
    "between 1 and 3",
  ]) {
    for (const boundary of ["word boundary", "not word boundary"]) {
      assert.throws(() => compile(`\n  ${prefix} ${boundary}`), {
        code: "BOUNDARY_REPETITION",
        line: 2,
        column: prefix.length + 4,
      });
    }
  }
  assert.throws(() => compile("lazy word boundary"), {
    code: "INVALID_LAZY_REPETITION",
    line: 1,
    column: 1,
  });
  assert.throws(() => compile("lazy optional word boundary"), {
    code: "BOUNDARY_REPETITION",
    line: 1,
    column: 15,
  });
  assert.throws(() => compile("word boundary\nstart"), {
    code: "MISPLACED_ANCHOR",
    line: 2,
    column: 1,
  });
  assert.throws(() => compile("end\nnot word boundary"), {
    code: "MISPLACED_ANCHOR",
    line: 2,
    column: 1,
  });
  assert.throws(() => compile("word boundaries"), { code: "UNKNOWN_RULE", line: 1, column: 1 });
  assert.throws(() => compile("not word boundary extra"), {
    code: "UNKNOWN_RULE",
    line: 1,
    column: 1,
  });
  assert.equal(compile('2 group {\nword boundary\n"a "\n}').source, String.raw`(?:\ba ){2}`);
});

test("both CLI directions preserve boundaries and their positioned diagnostics", () => {
  const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
  const run = (args, input) =>
    spawnSync(process.execPath, [cli, ...args], { input, encoding: "utf8" });
  const forward = run(["--json"], 'word boundary\n"cat"\nword boundary');
  assert.equal(forward.status, 0, forward.stderr);
  const result = JSON.parse(forward.stdout);
  assert.equal(result.source, String.raw`\bcat\b`);
  assert.equal(result.segments[0].kind, "boundary");
  const reverse = run(["--reverse", "--json"], String.raw`/\bcat\B/iu`);
  assert.equal(reverse.status, 0, reverse.stderr);
  assert.deepEqual(JSON.parse(reverse.stdout), {
    rules: 'word boundary\n"cat"\nnot word boundary',
    flags: "i",
  });
  const invalid = run(["--json"], "optional word boundary");
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stderr).error.code, "BOUNDARY_REPETITION");
});
