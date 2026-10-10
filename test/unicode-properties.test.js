import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";
import { parse } from "../src/parser.js";

test("Unicode property rules preserve aliases, polarity, repetition and exact source metadata", () => {
  const rules =
    'start\n  lazy between 1 and 3 UNICODE\tPROPERTY "Script=Greek"\nnot unicode property "Letter"\nend';
  const result = compile(rules);
  assert.equal(result.source, String.raw`^\p{Script=Greek}{1,3}?\P{Letter}$`);
  const node = parse(rules).nodes[1];
  assert.equal(node.atomType, "unicodeProperty");
  assert.equal(node.value, "Script=Greek");
  assert.deepEqual(node.propertyLocation, {
    line: 2,
    column: rules.split("\n")[1].indexOf("Script") + 1,
  });
  assert.deepEqual(
    result.segments
      .filter((segment) => segment.atomType === "unicodeProperty")
      .map((segment) => [segment.property, segment.negative, segment.repetition?.lazy]),
    [
      ["Script=Greek", false, true],
      ["Letter", true, undefined],
    ],
  );
  for (const segment of result.segments) {
    assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
    assert.equal(rules.split("\n")[segment.line - 1].trim(), segment.text);
  }
  assert.equal(toRegExp(result).test("αβ!"), true);
  assert.equal(toRegExp(result).test("αβa"), false);
  assert.match(result.segments[1].explanation, /runtime's Unicode data/u);
  assert.match(result.segments[1].explanation, /Lazy: try the fewest/u);
  assert.equal(compile(String.raw`unicode property "\u004c"`).source, String.raw`\p{L}`);
  for (const [prefix, suffix] of [
    ["", ""],
    ["optional ", "{0,1}"],
    ["zero or more ", "*"],
    ["one or more ", "+"],
    ["0 ", "{0}"],
    ["3 ", "{3}"],
    ["at least 2 ", "{2,}"],
    ["between 1 and 4 ", "{1,4}"],
    ["lazy one or more ", "+?"],
  ]) {
    assert.equal(
      compile(`${prefix}unicode property "Decimal_Number"`).source,
      String.raw`\p{Decimal_Number}` + suffix,
    );
  }
});

test("Unicode properties keep native code-point, script-extension and complement semantics", () => {
  const letters = toRegExp(compile('start\none or more unicode property "Letter"\nend'));
  for (const text of ["é", "Ελληνικά", "中文", "عربي", "اردو", "𐐀"])
    assert.equal(letters.test(text), true, text);
  for (const text of ["", "3", "٣", "😀", "e\u0301"]) assert.equal(letters.test(text), false, text);
  assert.equal(toRegExp(compile('unicode property "Script=Thaana"')).test("٢"), false);
  assert.equal(toRegExp(compile('unicode property "Script_Extensions=Thaana"')).test("٢"), true);
  assert.equal(
    toRegExp(compile('2 unicode property "Emoji_Presentation"')).exec("😀😀")[0].length,
    4,
  );
  assert.equal(toRegExp(compile('unicode property "Surrogate"')).test("\ud83d"), true);
  const complement = compile('not unicode property "Lowercase_Letter"', { flags: "i" });
  assert.equal(toRegExp(complement).test("a"), true);
  assert.equal(/[^\p{Lowercase_Letter}]/iu.test("a"), false);
  assert.match(complement.segments[0].explanation, /case folding happens after complementing/u);
  const roundtrip = regexToRules(/\P{Lowercase_Letter}/iu);
  assert.deepEqual(roundtrip, { rules: 'not unicode property "Lowercase_Letter"', flags: "i" });
  assert.equal(toRegExp(compile(roundtrip.rules, { flags: roundtrip.flags })).test("a"), true);
});

test("property imports preserve full native capture arrays and indices through every supported flag set", () => {
  const patterns = [
    String.raw`\p{L}`,
    String.raw`\p{Letter}`,
    String.raw`\p{General_Category=Letter}`,
    String.raw`\p{gc=Lu}`,
    String.raw`\p{Nd}`,
    String.raw`\p{Decimal_Number}+`,
    String.raw`\p{Sc}`,
    String.raw`\p{White_Space}`,
    String.raw`\p{ASCII}`,
    String.raw`\P{ASCII}`,
    String.raw`\p{Any}`,
    String.raw`\p{Assigned}`,
    String.raw`\p{Alphabetic}`,
    String.raw`\p{ID_Start}`,
    String.raw`\p{Join_Control}`,
    String.raw`\p{Surrogate}`,
    String.raw`\p{Script=Greek}+?`,
    String.raw`\p{sc=Latn}{1,3}`,
    String.raw`\p{Script=Arabic}`,
    String.raw`\p{Script_Extensions=Thaana}`,
    String.raw`\p{scx=Hira}`,
    String.raw`\p{Emoji}`,
    String.raw`\p{Emoji_Presentation}{2}`,
    String.raw`\P{Lowercase_Letter}`,
    String.raw`\P{General_Category=Lowercase_Letter}+?`,
    String.raw`(?<word>\p{L}+)`,
    String.raw`(?<word>\p{L}+?)\s\k<word>`,
    String.raw`(?<letter>\p{L})?(?<number>\p{Nd}*)`,
    String.raw`(\p{L}|\p{M})+`,
    String.raw`(?:(\p{Script=Greek})|a)`,
    String.raw`(?<empty>\p{Letter}{0})`,
    String.raw`(?:\p{L}\p{M}*){1,3}?`,
    String.raw`(?=(?<letter>\p{L}))`,
    String.raw`(?<=(?<letters>\p{L}+))\p{Nd}`,
    String.raw`(?<!\P{ASCII})\p{L}`,
    String.raw`(?!\p{L})\P{L}`,
    String.raw`^\p{L}+$`,
    String.raw`\b\p{L}+\b`,
    String.raw`[^]\p{L}.`,
    String.raw`\\p\p{L}`,
  ];
  const inputs = [
    "",
    "a",
    "A",
    "abc",
    "ABC",
    "aa aa",
    "é",
    "e\u0301",
    "É",
    "α",
    "αβ",
    "αβ1",
    "Ελληνικά",
    "中文",
    "عربي",
    "اردو",
    "٢",
    "٣",
    "12",
    "0",
    "a1",
    "é1",
    "हिन्दी",
    "क",
    "का",
    "𐐀",
    "😀",
    "😀😀",
    "👨‍👩‍👧",
    "👩🏽",
    "a\n",
    "\na\n",
    "a\r\nb",
    "\u2028a\u2029",
    " ",
    "\t",
    "\0",
    "\u200c",
    "\u200d",
    "\u0301",
    "₹",
    "K",
    "ſ",
    "\ud83d",
    "\ude00",
    "\\pa",
  ];
  for (let bits = 0; bits < 8; bits += 1) {
    const flags = `${bits & 1 ? "i" : ""}${bits & 2 ? "m" : ""}${bits & 4 ? "s" : ""}u`;
    for (const source of patterns) {
      const original = new RegExp(source, flags);
      const translated = regexToRules(original);
      const result = compile(translated.rules, { flags: translated.flags });
      const before = new RegExp(source, `d${flags}`);
      const after = new RegExp(result.source, `d${result.flags}`);
      for (const input of inputs)
        assert.deepEqual(
          after.exec(input),
          before.exec(input),
          JSON.stringify({ source, flags, input }),
        );
    }
  }
});

test("invalid property names, quotes, aliases and class contexts keep positioned diagnostics", () => {
  for (const value of [
    "",
    "Greek",
    "letter",
    "script=Greek",
    "Script=greek",
    "Bidi_Class=Left_To_Right",
    "ASCII=Yes",
    "Letter|Digit",
    "Letter}",
    "Letter ",
    "Script =Greek",
    "字",
    "Line\nBreak",
    "3Key=Letter",
  ]) {
    const rule = `  lazy optional unicode property ${JSON.stringify(value)}`;
    assert.throws(
      () => compile(rule),
      { code: "INVALID_UNICODE_PROPERTY", line: 1, column: rule.indexOf('"') + 2 },
      value,
    );
  }
  for (const suffix of ["", "Letter", "'Letter'"])
    assert.throws(() => compile(`unicode property ${suffix}`), {
      code: "INVALID_UNICODE_PROPERTY",
      line: 1,
      column: suffix ? 18 : 17,
    });
  assert.throws(() => compile('unicode property "Letter"  extra'), {
    code: "TRAILING_TEXT",
    line: 1,
    column: 28,
  });
  assert.throws(() => compile(String.raw`unicode property "\q"`), {
    code: "INVALID_QUOTE",
    line: 1,
    column: 19,
  });
  assert.throws(() => compile('unicode property "Letter'), {
    code: "INVALID_QUOTE",
    line: 1,
    column: 25,
  });
  assert.throws(() => compile('1001 unicode property "Letter"'), {
    code: "REPETITION_LIMIT",
    line: 1,
    column: 1,
  });
  assert.throws(() => compile('lazy unicode property "Letter"'), {
    code: "INVALID_LAZY_REPETITION",
    line: 1,
    column: 1,
  });
  for (const source of [
    String.raw`[\p{L}]`,
    String.raw`[^\p{L}]`,
    String.raw`[a\p{L}]`,
    String.raw`[\P{Lowercase_Letter}]`,
  ]) {
    const original = new RegExp(source, "iu");
    const translated = regexToRules(original);
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    for (const input of ["a", "A", "é", "اردو", "٣", "😀", "\ud83d", ""])
      assert.deepEqual(rebuilt.exec(input), original.exec(input));
  }
  assert.deepEqual(regexToRules(/\p{RGI_Emoji}/v), {
    rules: 'unicode property "RGI_Emoji"',
    flags: "v",
  });
});

test("Unicode property capability fails explicitly without ASCII or category approximations", () => {
  const NativeRegExp = globalThis.RegExp;
  globalThis.RegExp = class extends NativeRegExp {
    constructor(source, flags) {
      if (typeof source === "string" && source.includes("\\p{"))
        throw new SyntaxError("Unavailable properties");
      super(source, flags);
    }
  };
  try {
    assert.throws(() => compile('start\n  unicode property "Letter"\nend'), {
      code: "UNSUPPORTED_TARGET_FEATURE",
      line: 2,
      column: 3,
    });
    assert.throws(() => compile('not unicode property "Letter"'), {
      code: "UNSUPPORTED_TARGET_FEATURE",
      line: 1,
      column: 1,
    });
    assert.equal(toRegExp(compile("letter")).test("a"), true);
    assert.throws(() => compile('start\n  character class: digit, unicode property "L"\nend'), {
      code: "UNSUPPORTED_TARGET_FEATURE",
      line: 2,
      column: 3,
    });
  } finally {
    globalThis.RegExp = NativeRegExp;
  }
});

test("both CLI directions preserve Unicode aliases, complement flags and diagnostics", () => {
  const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
  const run = (args, input) =>
    spawnSync(process.execPath, [cli, ...args], { input, encoding: "utf8" });
  const forward = run(["--json", "--ignore-case"], 'not unicode property "Lowercase_Letter"');
  assert.equal(forward.status, 0, forward.stderr);
  const compiled = JSON.parse(forward.stdout);
  assert.equal(compiled.segments[0].property, "Lowercase_Letter");
  assert.equal(new RegExp(compiled.source, compiled.flags).test("a"), true);
  const reverse = run(["--reverse", "--json"], String.raw`/\p{Script_Extensions=Greek}+?/iu`);
  assert.equal(reverse.status, 0, reverse.stderr);
  assert.deepEqual(JSON.parse(reverse.stdout), {
    rules: 'lazy one or more unicode property "Script_Extensions=Greek"',
    flags: "i",
  });
  const invalid = run(["--json"], 'unicode property "script=Greek"');
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stderr).error.code, "INVALID_UNICODE_PROPERTY");
});
