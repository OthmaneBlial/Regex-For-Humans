import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";
import { parse } from "../src/parser.js";
import { inputs, patterns } from "./fixtures/character-class-corpus.js";

test("class unions preserve typed members, polarity, quantifiers and UTF-16 source spans", () => {
  const rules =
    'start\n  lazy between 1 and 3 character class: unicode property "L", range "α" to "ω", digit, ",", "😀"\nend';
  const result = compile(rules);
  assert.equal(result.source, String.raw`^[\p{L}α-ω\d,😀]{1,3}?$`);
  const segment = result.segments[1];
  assert.equal(segment.atomType, "characterClass");
  assert.equal(segment.negative, false);
  assert.deepEqual(
    segment.members.map((m) => m.kind),
    ["unicodeProperty", "range", "shorthand", "literal", "literal"],
  );
  assert.equal(parse(rules).nodes[1].members[0].value, "L");
  for (const member of segment.members) {
    assert.equal(result.source.slice(member.sourceStart, member.sourceEnd), member.source);
    assert.equal(
      rules
        .split("\n")
        [member.location.line - 1].slice(
          member.location.column - 1,
          member.location.column - 1 + member.text.length,
        ),
      member.text,
    );
  }
  assert.match(segment.explanation, /union/u);
  assert.match(segment.explanation, /Lazy: try the fewest/u);
  assert.equal(toRegExp(result).test("😀α1"), true);
  assert.equal(compile('range "😀" to "🙏"').source, "[😀-🙏]");
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
  ])
    assert.equal(
      compile(`${prefix}character class: digit, "_"`).source,
      String.raw`[\d_]` + suffix,
    );
});

test("property complements and outer class negation retain different native u/i semantics", () => {
  const positive = compile('character class: not unicode property "Lowercase_Letter"', {
    flags: "i",
  });
  const outer = compile('not character class: unicode property "Lowercase_Letter"', { flags: "i" });
  assert.equal(toRegExp(positive).test("a"), true);
  assert.equal(toRegExp(outer).test("a"), false);
  assert.equal(positive.source, String.raw`[\P{Lowercase_Letter}]`);
  assert.equal(outer.source, String.raw`[^\p{Lowercase_Letter}]`);
  assert.match(outer.segments[0].explanation, /negation remain distinct/u);
  const word = toRegExp(
    compile(
      'start\none or more character class: unicode property "L", unicode property "M", "_"\nend',
    ),
  );
  for (const input of ["e\u0301", "हिन्दी", "اردو", "中文", "عربي", "𐐀_"])
    assert.equal(word.test(input), true, input);
  for (const input of ["", "3", "😀", "a b"]) assert.equal(word.test(input), false, input);
});

test("class imports preserve native full match arrays, captures and indices for every supported flag set", () => {
  for (let bits = 0; bits < 8; bits += 1) {
    const flags = `${bits & 1 ? "i" : ""}${bits & 2 ? "m" : ""}${bits & 4 ? "s" : ""}u`;
    for (const source of patterns) {
      const translated = regexToRules(new RegExp(source, flags));
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

test("seeded generated Unicode class unions preserve native semantics without normalizing complements", () => {
  const atoms = [
    "a-c",
    "E-f",
    "α-ω",
    "😀-🙏",
    String.raw`\p{L}`,
    String.raw`\P{Ll}`,
    String.raw`\p{M}`,
    String.raw`\d`,
    String.raw`\W`,
    String.raw`\s`,
    String.raw`\-`,
    String.raw`\u{d800}-\u{dfff}`,
  ];
  let seed = 0x1a2b3c4d;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  for (let index = 0; index < 128; index += 1) {
    const body = Array.from({ length: (next() % 4) + 1 }, () => atoms[next() % atoms.length]).join(
      "",
    );
    const source = `(?<value>[${next() % 2 ? "^" : ""}${body}]{0,3}?)_?`;
    const flags = next() % 2 ? "iu" : "u";
    const translated = regexToRules(new RegExp(source, flags));
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
});

test("class escaping keeps literal syntax, control characters and lone surrogate members exact", () => {
  for (const value of [
    "-",
    "[",
    "]",
    "\\",
    "^",
    "/",
    ",",
    '"',
    "\0",
    "\b",
    "\n",
    "\u2028",
    "\ud83d",
    "\ude00",
    "😀",
    "\u009b",
    "\u202e",
    "\u2066",
  ]) {
    const result = compile(`character class: ${JSON.stringify(value)}, digit`);
    for (const member of result.segments[0].members)
      assert.equal(result.source.slice(member.sourceStart, member.sourceEnd), member.source);
    for (const input of [value, "0", "a", "😀", "\ud83d", "\ude00"])
      assert.equal(
        toRegExp(result).test(input),
        input === value || input === "0",
        JSON.stringify({ value, input }),
      );
  }
  const controlledRange = compile('character class: range "\u009b" to "\u009d", "\u202e"');
  for (const member of controlledRange.segments[0].members)
    assert.equal(controlledRange.source.slice(member.sourceStart, member.sourceEnd), member.source);
  assert.equal(toRegExp(controlledRange).test("\u009c"), true);
  assert.equal(toRegExp(controlledRange).test("\u202e"), true);
});

test("invalid class members and range endpoints fail at their original rule columns", () => {
  for (const [rule, code, column] of [
    ["character class:", "EMPTY_CHARACTER_CLASS", 17],
    ['character class: "a",', "INVALID_CLASS_MEMBER", 21],
    ['character class: , "a"', "INVALID_CLASS_MEMBER", 18],
    ['character class: "ab"', "INVALID_CLASS_MEMBER", 18],
    ["character class: digits", "INVALID_CLASS_MEMBER", 18],
    ["character class: 2 digit", "INVALID_CLASS_MEMBER", 18],
    ['character class: character class: "a"', "INVALID_CLASS_MEMBER", 18],
    ['range "ab" to "z"', "INVALID_CHARACTER_RANGE", 7],
    ['range "a" to ""', "INVALID_CHARACTER_RANGE", 14],
    ['range "z" to "a"', "INVALID_CHARACTER_RANGE", 14],
    ['range "a" "z"', "INVALID_CHARACTER_RANGE", 10],
    ['character class: unicode property "script=Greek"', "INVALID_UNICODE_PROPERTY", 36],
  ])
    assert.throws(() => compile(rule), { code, line: 1, column }, rule);
  // biome-ignore lint/correctness/noEmptyCharacterClassInRegex: the empty native class is deliberately unsupported by the DSL.
  assert.throws(() => regexToRules(/😀[]/u), { code: "UNSUPPORTED_REGEX", column: 3 });
});

test("class CLI output, metadata and imports use the same compiler", () => {
  const bin = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
  const rules = 'one or more character class: unicode property "L", unicode property "M", "_"';
  const forward = spawnSync(process.execPath, [bin, "--json", "-"], {
    input: rules,
    encoding: "utf8",
  });
  assert.equal(forward.status, 0, forward.stderr);
  assert.equal(JSON.parse(forward.stdout).segments[0].members[1].value, "M");
  const reverse = spawnSync(process.execPath, [bin, "--reverse", "--json", "-"], {
    input: String.raw`/[\p{L}\p{M}_]+/u`,
    encoding: "utf8",
  });
  assert.equal(reverse.status, 0, reverse.stderr);
  assert.deepEqual(JSON.parse(reverse.stdout), { rules, flags: "" });
});
