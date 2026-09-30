import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CompileError, compile, regexMatchingThroughLines, toRegExp } from "../index.js";

const scenarios = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("reference scenarios compile to exact source and flags and match both ways", () => {
  for (const scenario of scenarios) {
    const result = compile(scenario.rules);
    assert.equal(result.source, scenario.source, scenario.id);
    assert.equal(result.flags, scenario.flags, scenario.id);
    const regex = toRegExp(result);
    for (const sample of scenario.positive)
      assert.equal(regex.test(sample), true, `${scenario.id}: ${JSON.stringify(sample)}`);
    for (const sample of scenario.negative)
      assert.equal(regex.test(sample), false, `${scenario.id}: ${JSON.stringify(sample)}`);
    assert.equal(regexMatchingThroughLines(scenario.rules), scenario.source, scenario.id);
  }
});

test("JavaScript line terminators separate rules and match line anchors", () => {
  for (const separator of ["\n", "\r\n", "\r", "\u2028", "\u2029"]) {
    const result = compile(`line start${separator}3 digits${separator}line end`);
    assert.equal(result.source, "^\\d{3}$");
    assert.equal(result.flags, "mu");
    assert.deepEqual(
      result.segments.map(({ line }) => line),
      [1, 2, 3],
    );
    const regex = toRegExp(result);
    assert.equal(regex.test(`${separator}123${separator}`), true, JSON.stringify(separator));
    assert.equal(regex.test(`${separator}12${separator}`), false, JSON.stringify(separator));
  }
});

test("input end anchor rejects a final JavaScript line terminator", () => {
  const result = compile('start "A"\nend');
  assert.equal(result.source, "^A$");
  assert.equal(result.flags, "u");
  assert.equal(result.segments.at(-1).explanation, "Input end.");
  const regex = toRegExp(result);
  assert.equal(regex.test("A"), true);
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"])
    assert.equal(regex.test(`A${separator}`), false, JSON.stringify(separator));
});

test("negative classes and concise repetition forms compile exactly", () => {
  assert.equal(compile("not word").source, "\\W");
  assert.equal(compile("not digit").source, "\\D");
  assert.equal(compile("3 digit").source, "\\d{3}");
  assert.equal(compile("digits").source, "\\d+");
  assert.equal(compile("any text").source, ".*");
  assert.equal(compile("text without: a, b").source, "[^ab]*");
});

test("bounded counts preserve atom escaping, inclusive matches and explanations", () => {
  for (const [item, source, positive, negative] of [
    ["digits", "\\d", ["12", "123", "1234"], ["", "1", "12345", "١٢"]],
    ["hex digits", "[0-9A-Fa-f]", ["0F", "09a", "09aF"], ["f", "0xFF", "abcde", "ＦＦ"]],
    ["letters", "[A-Za-z]", ["ab", "aBc", "AbCd"], ["a", "a1", "abcde", "éé"]],
    ["not digit", "\\D", ["ab", "abc", "abcd"], ["a", "a1", "abcde"]],
    ["any character", ".", ["😀😀", "abc", "abcd"], ["😀", "a\nb", "abcde"]],
    ['"a.b"', "(?:a\\.b)", ["a.ba.b", "a.ba.ba.b"], ["a.b", "axba.b", "a.b".repeat(5)]],
    ["one of: a, b", "[ab]", ["ab", "aba", "abab"], ["a", "ac", "ababa"]],
    ["none of: a, b", "[^ab]", ["😀😀", "xyz", "xyzz"], ["😀", "xa", "xyzzz"]],
  ]) {
    const result = compile(`start\nbetween 2 and 4 ${item}\nend`);
    assert.equal(result.source, `^${source}{2,4}$`, item);
    assert.deepEqual(result.segments[1].repetition, { kind: "range", min: 2, max: 4 });
    assert.match(result.segments[1].explanation, /Between 2 and 4/u);
    assert.match(result.segments[1].explanation, /inclusive/u);
    for (const value of positive) assert.equal(toRegExp(result).test(value), true, value);
    for (const value of negative) assert.equal(toRegExp(result).test(value), false, value);
  }
  assert.equal(
    compile("between 2 and 4 digits").segments[0].explanation,
    "Between 2 and 4 digits (0–9), inclusive.",
  );
  assert.equal(
    compile("between 2 and 4 hex digits").segments[0].explanation,
    "Between 2 and 4 hexadecimal digits (0–9, A–F, a–f), inclusive.",
  );
  assert.equal(toRegExp(compile("between 2 and 4 digits")).exec("12345")[0], "1234");
});

test("bounded counts include zero, equal endpoints and the numeric ceiling", () => {
  for (const [item, unit] of [
    ["digit", "7"],
    ['"A😀"', "A😀"],
    ["none of: a, b", "😀"],
  ]) {
    for (let min = 0; min <= 4; min += 1) {
      for (let max = min; max <= 6; max += 1) {
        const regex = toRegExp(compile(`start\nbetween ${min} and ${max} ${item}\nend`));
        for (let count = 0; count <= 7; count += 1) {
          assert.equal(
            regex.test(unit.repeat(count)),
            count >= min && count <= max,
            `${item}: ${min}–${max}, count ${count}`,
          );
        }
      }
    }
  }
  const ceiling = compile("start between 1000 and 1000 digits\nend");
  assert.equal(ceiling.source, "^\\d{1000,1000}$");
  assert.equal(toRegExp(ceiling).test("7".repeat(1000)), true);
  assert.equal(toRegExp(ceiling).test("7".repeat(1001)), false);
  assert.equal(compile(String.raw`between 2 and 4 "\ud800"`).source, "\\u{d800}{2,4}");
});

test("literal and character-class metacharacters are escaped in their contexts", () => {
  const literal = compile('start\n"a.b/c[1]"\nend');
  assert.equal(literal.source, "^a\\.b\\/c\\[1\\]$");
  assert.equal(toRegExp(literal).test("a.b/c[1]"), true);
  assert.equal(toRegExp(literal).test("axb/c[1]"), false);

  const list = compile('one of: "]", "-", "^", "\\\\", ",", "😀"');
  const regex = toRegExp(list);
  for (const character of ["]", "-", "^", "\\", ",", "😀"])
    assert.equal(regex.test(character), true, character);
  assert.equal(regex.test("z"), false);
  assert.equal(compile('2 "AB"').source, "(?:AB){2}");
  assert.equal(compile('"\\n"').source, "\\u{a}");
});

test("lone surrogates survive UTF-8 transport in literals and character sets", () => {
  for (const character of ["\ud800", "\udbff", "\udc00", "\udfff"]) {
    const quoted = JSON.stringify(character);
    const escaped = `\\u{${character.charCodeAt(0).toString(16)}}`;
    for (const [rule, source, sample, expected] of [
      [quoted, escaped, character, true],
      [`2 ${quoted}`, `${escaped}{2}`, character.repeat(2), true],
      [`one of: ${quoted}`, `[${escaped}]`, character, true],
      [`none of: ${quoted}`, `[^${escaped}]`, character, false],
      [`text without: ${quoted}`, `[^${escaped}]*`, character, false],
    ]) {
      const result = compile(`start\n${rule}\nend`);
      assert.equal(result.source, `^${source}$`, rule);
      assert.equal(Buffer.from(result.source).toString("utf8"), result.source, rule);
      assert.equal(toRegExp(result).test(sample), expected, rule);
      assert.equal(toRegExp(result).test("\ufffd"), !expected, rule);
    }
  }
  assert.equal(compile('"😀"').source, "😀");
  const separateSurrogates = compile(String.raw`one of: "\ud800", "\udc00"`);
  assert.equal(separateSurrogates.source, "[\\u{d800}\\u{dc00}]");
  for (const character of ["\ud800", "\udc00"])
    assert.equal(toRegExp(separateSurrogates).test(character), true);
  assert.equal(toRegExp(separateSurrogates).test("\ud800\udc00"), false);
});

test("direction and C1 controls have visible escapes without changing literal or class matching", () => {
  for (const codePoint of [
    ...Array.from({ length: 32 }, (_, index) => index + 0x80),
    0x061c,
    0x200e,
    0x200f,
    0x202a,
    0x202b,
    0x202c,
    0x202d,
    0x202e,
    0x2066,
    0x2067,
    0x2068,
    0x2069,
  ]) {
    const character = String.fromCodePoint(codePoint);
    const quoted = JSON.stringify(character);
    const escaped = `\\u${codePoint.toString(16).padStart(4, "0")}`;
    for (const flags of ["", "i", "s", "is"]) {
      for (const [rule, source, sample, expected] of [
        [quoted, escaped, character, true],
        [`2 ${quoted}`, `${escaped}{2}`, character.repeat(2), true],
        [`one of: ${quoted}`, `[${escaped}]`, character, true],
        [`none of: ${quoted}`, `[^${escaped}]`, character, false],
        [`text without: ${quoted}`, `[^${escaped}]*`, character, false],
      ]) {
        const result = compile(`start\n${rule}\nend`, { flags });
        assert.equal(/[\p{Bidi_Control}\p{Control}]/u.test(result.source), false);
        assert.equal(result.source, `^${source}$`);
        assert.equal(toRegExp(result).test(sample), expected);
        assert.equal(toRegExp(result).test("A"), !expected);
        assert.equal(result.segments[1].text, rule);
        assert.equal(/[\p{Bidi_Control}\p{Control}]/u.test(result.segments[1].explanation), false);
        for (const segment of result.segments)
          assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
      }
    }
  }
  const text = "مرحبا שלום 👩‍💻";
  assert.equal(compile(JSON.stringify(text)).source, text);
  const escapedText = String.raw`\u202e`;
  const escapedLiteral = toRegExp(compile(JSON.stringify(escapedText)));
  assert.equal(escapedLiteral.test(escapedText), true);
  assert.equal(escapedLiteral.test(String.fromCodePoint(0x202e)), false);
});

test("explanations and diagnostics expose controls while preserving original source positions", () => {
  for (const point of [0x202e, ...Array.from({ length: 32 }, (_, index) => index + 0x80)]) {
    const character = String.fromCodePoint(point);
    const escaped = `\\u${point.toString(16).padStart(4, "0")}`;
    const rules = JSON.stringify(`A${character}B`);
    const result = compile(rules);
    assert.equal(/[\p{Bidi_Control}\p{Control}]/u.test(result.segments[0].explanation), false);
    assert.equal(result.segments[0].explanation, `Literal text "A${escaped}B".`);
    assert.equal(result.segments[0].text, rules);
    assert.deepEqual([result.segments[0].line, result.segments[0].column], [1, 1]);
    assert.throws(
      () => compile(`digit\n  unsupported${character}words`),
      (error) => {
        assert.ok(error instanceof CompileError);
        assert.equal(/[\p{Bidi_Control}\p{Control}]/u.test(error.message), false);
        assert.equal(error.message, `Unsupported rule: "unsupported${escaped}words".`);
        assert.deepEqual([error.code, error.line, error.column], ["UNKNOWN_RULE", 2, 3]);
        return true;
      },
    );
  }
  for (const point of [0x2028, 0x2029]) {
    const result = compile(JSON.stringify(String.fromCodePoint(point)));
    assert.equal(result.source, `\\u{${point.toString(16)}}`);
    assert.equal(result.segments[0].explanation, `Literal text "\\u${point.toString(16)}".`);
  }
});

test("flags and segment positions describe the emitted expression", () => {
  const result = compile("line start\nany character\nline end", {
    flags: "is",
  });
  assert.equal(result.flags, "imsu");
  assert.equal(result.source, "^.$");
  assert.equal(result.segments.length, 3);
  for (const segment of result.segments) {
    assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
    assert.ok(segment.line > 0);
    assert.ok(segment.column > 0);
  }
  assert.equal(toRegExp(result).test("\n"), true);
});

test("explanations reflect JavaScript flags, greedy matching and shorthand limits", () => {
  const lineRule = compile(scenarios[2].rules);
  assert.equal(lineRule.segments[0].explanation, "Start of each line (m).");
  assert.equal(
    lineRule.segments[1].explanation,
    "Longest text up to the next rule, excluding line breaks.",
  );
  const excludedRule = compile(scenarios[1].rules);
  assert.equal(excludedRule.segments[1].explanation, 'Longest text without "a", "b", "c", "d".');
  assert.equal(lineRule.segments[2].explanation, "Exactly 3 digits (0–9).");
  assert.equal(lineRule.segments[3].explanation, "End of each line (m).");
  assert.equal(compile("digit").segments[0].explanation, "One digit (0–9).");
  assert.equal(compile("not digit").segments[0].explanation, "Any character except 0–9.");
  assert.equal(compile("space").segments[0].explanation, "Whitespace, including line breaks.");
  assert.equal(compile("not space").segments[0].explanation, "Any non-whitespace character.");
  assert.equal(
    compile("any character").segments[0].explanation,
    "Any character except a line break.",
  );
  assert.equal(
    compile("any character", { flags: "s" }).segments[0].explanation,
    "Any character, including line breaks.",
  );
  assert.equal(compile("digits").segments[0].explanation, "One or more digits (0–9).");
  assert.equal(compile("1 digit").segments[0].explanation, "Exactly 1 digit (0–9).");
  assert.equal(compile("3 digits").segments[0].explanation, "Exactly 3 digits (0–9).");
  assert.equal(
    compile("any text", { flags: "s" }).segments[0].explanation,
    "Longest text, including line breaks.",
  );
  assert.equal(
    compile('"ABC"', { flags: "i" }).segments[0].explanation,
    'Literal text "ABC", ignoring case (i).',
  );
  assert.equal(
    compile("word").segments[0].explanation,
    "Word character: ASCII letter, digit or underscore. With i, a few Unicode equivalents match.",
  );
  assert.equal(compile("not word").segments[0].explanation, "Any non-word character.");
});

test("case-insensitive class explanations include JavaScript Unicode folding", () => {
  const positive = compile("one of: K", { flags: "i" });
  assert.equal(positive.segments[0].explanation, 'One of "K", ignoring case (i).');
  assert.equal(toRegExp(positive).test("K"), true);

  const repeatedPositive = compile("3 one of: K", { flags: "i" });
  assert.equal(
    repeatedPositive.segments[0].explanation,
    'One of "K", ignoring case (i). Exactly 3 times.',
  );
  assert.equal(toRegExp(repeatedPositive).test("KKk"), true);

  const negative = compile("none of: K", { flags: "i" });
  assert.equal(negative.segments[0].explanation, 'Any character except "K", ignoring case (i).');
  assert.equal(toRegExp(negative).test("K"), false);

  const excludedText = compile("start\ntext without: K\nend", { flags: "i" });
  assert.match(excludedText.segments[1].explanation, /ignoring case \(i\)/u);
  assert.equal(toRegExp(excludedText).test("k"), false);

  const notWord = compile("not word", { flags: "i" });
  assert.match(notWord.segments[0].explanation, /i treats a few Unicode equivalents as words/u);
  assert.equal(toRegExp(notWord).test("K"), false);
});

test("invalid input fails explicitly rather than returning partial output", () => {
  for (const source of [
    "unknown phrase",
    "digit\nsurprise",
    "digit between 9 and 2 times",
    "one of:",
  ]) {
    assert.throws(() => compile(source), CompileError, source);
  }
  assert.throws(() => compile("digit", { flags: "g" }), { code: "UNSUPPORTED_FLAGS" });
  assert.throws(() => compile("digit", { flags: "ii" }), { code: "UNSUPPORTED_FLAGS" });
  assert.throws(() => toRegExp({ source: 1, flags: "u" }), TypeError);
});

test("API options reject non-string flags while preserving omitted defaults", () => {
  for (const options of [null, [], "i", 1, false]) {
    assert.throws(() => compile("digit", options), {
      name: "TypeError",
      message: "Options must be an object.",
    });
  }
  for (const flags of [null, false, 0, [], {}, Symbol("i")]) {
    assert.throws(() => compile("digit", { flags }), {
      name: "CompileError",
      code: "UNSUPPORTED_FLAGS",
      line: 1,
      column: 1,
    });
  }
  for (const options of [undefined, {}, { flags: undefined }, { flags: "" }]) {
    assert.equal(compile("digit", options).flags, "u");
  }
});

test("hex rules match exactly the ASCII hexadecimal characters and explain counts", () => {
  const characters = [
    ...Array.from({ length: 128 }, (_, index) => String.fromCodePoint(index)),
    "٣",
    "Ｆ",
    "K",
    "ſ",
    "😀",
  ];
  for (const flags of ["", "i", "s", "is"]) {
    const single = compile("start\nhex digit\nend", { flags });
    assert.equal(single.source, "^[0-9A-Fa-f]$");
    assert.equal(single.segments[1].explanation, "One hexadecimal digit (0–9, A–F, a–f).");
    for (const character of characters) {
      assert.equal(
        toRegExp(single).test(character),
        "0123456789abcdefABCDEF".includes(character),
        `${JSON.stringify(character)} with flags ${flags}`,
      );
    }
  }
  const plural = compile("start\nhex digits\nend");
  assert.equal(plural.source, "^[0-9A-Fa-f]+$");
  assert.equal(plural.segments[1].explanation, "One or more hexadecimal digits (0–9, A–F, a–f).");
  assert.equal(toRegExp(plural).test("09aF"), true);
  for (const value of ["", "0xFF", "ag", "F\n"]) assert.equal(toRegExp(plural).test(value), false);
  for (const count of [0, 1, 3, 1000]) {
    const counted = compile(`start ${count} hex digits\nend`);
    assert.equal(counted.source, `^[0-9A-Fa-f]{${count}}$`);
    assert.equal(toRegExp(counted).test("f".repeat(count)), true);
    assert.equal(toRegExp(counted).test("f".repeat(count + 1)), false);
    assert.equal(
      counted.segments[1].explanation,
      `Exactly ${count} hexadecimal ${count === 1 ? "digit" : "digits"} (0–9, A–F, a–f).`,
    );
  }
});

test("letter rules match ASCII letters and explain Unicode case folding and counts", () => {
  const characters = [
    ...Array.from({ length: 128 }, (_, index) => String.fromCodePoint(index)),
    "é",
    "α",
    "Ж",
    "Ａ",
    "K",
    "ſ",
    "😀",
  ];
  for (const flags of ["", "i", "s", "is"]) {
    const single = compile("start\nletter\nend", { flags });
    assert.equal(single.source, "^[A-Za-z]$");
    const caseNote = flags.includes("i") ? " With i, a few Unicode equivalents also match." : "";
    assert.equal(single.segments[1].explanation, `One ASCII letter (A–Z, a–z).${caseNote}`);
    const regex = toRegExp(single);
    for (const character of characters) {
      const point = character.codePointAt(0);
      const ascii = (point >= 65 && point <= 90) || (point >= 97 && point <= 122);
      assert.equal(
        regex.test(character),
        ascii || (flags.includes("i") && ["K", "ſ"].includes(character)),
        `${JSON.stringify(character)} with flags ${flags}`,
      );
    }
  }
  const plural = compile("start\nletters\nend");
  assert.equal(plural.source, "^[A-Za-z]+$");
  assert.equal(plural.segments[1].explanation, "One or more ASCII letters (A–Z, a–z).");
  assert.equal(toRegExp(plural).test("aBcZ"), true);
  for (const value of ["", "A3", "a_b", "é", "ſ", "A\n"])
    assert.equal(toRegExp(plural).test(value), false, value);
  for (const count of [0, 1, 3, 1000]) {
    const counted = compile(`start ${count} letters\nend`);
    assert.equal(counted.source, `^[A-Za-z]{${count}}$`);
    assert.equal(toRegExp(counted).test("a".repeat(count)), true);
    assert.equal(toRegExp(counted).test("a".repeat(count + 1)), false);
    assert.equal(
      counted.segments[1].explanation,
      `Exactly ${count} ASCII ${count === 1 ? "letter" : "letters"} (A–Z, a–z).`,
    );
  }
  assert.equal(
    compile("between 2 and 4 letters").segments[0].explanation,
    "Between 2 and 4 ASCII letters (A–Z, a–z), inclusive.",
  );
});
