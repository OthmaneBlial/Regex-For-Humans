import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { CompileError, compile, regexToRules, toRegExp } from "../index.js";

const scenarios = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("every shared recipe translates back to rules with the same regex and flags", () => {
  for (const scenario of scenarios) {
    const original = new RegExp(scenario.source, scenario.flags);
    const translated = regexToRules(original);
    const rebuilt = compile(translated.rules, { flags: translated.flags });
    assert.equal(rebuilt.source, original.source, scenario.id);
    assert.equal(rebuilt.flags, original.flags, scenario.id);
    for (const sample of scenario.positive) assert.equal(toRegExp(rebuilt).test(sample), true);
    for (const sample of scenario.negative) assert.equal(toRegExp(rebuilt).test(sample), false);
  }
});

test("genuine regexes from another context translate with the same rules, flags and diagnostics", () => {
  for (const source of [
    "^😀[A-Z]{2}$",
    "^(?:AB){2}$",
    "^(?:)$",
    String.raw`^\d{2,}$`,
    "^[._-]+$",
  ]) {
    for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
      const original = runInNewContext("new RegExp(source, flags)", { source, flags });
      assert.equal(original instanceof RegExp, false);
      original.lastIndex = 7;
      const translated = regexToRules(original);
      assert.deepEqual(translated, regexToRules(new RegExp(source, flags)));
      assert.equal(original.lastIndex, 7);
      const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
      for (const sample of [
        "",
        "😀AB",
        "😀ab",
        "\n😀AB\n",
        "ABAB",
        "abab",
        "1",
        "12",
        "123",
        "._-",
      ]) {
        const expected = original.exec(sample);
        const actual = rebuilt.exec(sample);
        assert.equal(actual?.[0], expected?.[0]);
        assert.equal(actual?.index, expected?.index);
      }
    }
  }
  for (const [source, flags] of [
    ["a", ""],
    ["a", "gu"],
    ["^😀(AB)$", "u"],
    ["a".repeat(16_385), "u"],
  ]) {
    let expected;
    try {
      regexToRules(new RegExp(source, flags));
      assert.fail("Unsupported input accepted");
    } catch (error) {
      assert.ok(error instanceof CompileError);
      expected = error.toJSON();
    }
    assert.throws(
      () => regexToRules(runInNewContext("new RegExp(source, flags)", { source, flags })),
      (error) => {
        assert.ok(error instanceof CompileError);
        assert.deepEqual(error.toJSON(), expected);
        return true;
      },
    );
  }
  for (const input of [
    "a",
    null,
    undefined,
    42,
    [],
    {},
    RegExp.prototype,
    Object.create(RegExp.prototype),
    { source: "a", flags: "u", unicode: true, [Symbol.toStringTag]: "RegExp" },
  ]) {
    assert.throws(() => regexToRules(input), {
      name: "TypeError",
      message: "Expected a JavaScript RegExp.",
    });
  }
});

test("translation uses the stored native pattern and flags instead of overridden metadata", () => {
  class AnnotatedRegExp extends RegExp {
    get source() {
      return "^B$";
    }
    get [Symbol.match]() {
      throw new Error("The matching protocol getter was called");
    }
  }
  const annotated = new AnnotatedRegExp("^A$", "u");
  assert.deepEqual(regexToRules(annotated), { rules: 'start\n"A"\nend', flags: "" });

  for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
    for (const original of [
      new RegExp("^😀[A-Z]{2}$", flags),
      runInNewContext("new RegExp(source, flags)", { source: "^😀[A-Z]{2}$", flags }),
    ]) {
      const expected = new RegExp("^😀[A-Z]{2}$", flags);
      const untouched = () => assert.fail("Overridden metadata or matching method was called");
      for (const name of [
        "source",
        "flags",
        "unicode",
        "ignoreCase",
        "multiline",
        "dotAll",
        "global",
        "sticky",
        "hasIndices",
        "unicodeSets",
        Symbol.match,
      ]) {
        Object.defineProperty(original, name, { get: untouched });
      }
      original.exec = untouched;
      original.test = untouched;
      original.lastIndex = 7;
      Object.freeze(original);
      const translated = regexToRules(original);
      assert.deepEqual(translated, regexToRules(expected));
      assert.equal(original.lastIndex, 7);
      const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
      for (const sample of ["😀AB", "😀ab", "\n😀AB\n", "😀A", "", "😀ABC"]) {
        assert.deepEqual(rebuilt.exec(sample), expected.exec(sample));
      }
    }
  }
  for (const [source, flags, code] of [
    ["a", "", "UNICODE_FLAG_REQUIRED"],
    ["a", "gu", "UNSUPPORTED_REGEX_FLAGS"],
    ["(a)", "u", "UNSUPPORTED_REGEX"],
    ["a".repeat(16_385), "u", "REGEX_SOURCE_LIMIT"],
  ]) {
    const original = new AnnotatedRegExp(source, flags);
    Object.defineProperty(original, "flags", { value: "u" });
    Object.defineProperty(original, "unicode", { value: true });
    assert.throws(() => regexToRules(original), { code });
  }
});

test("translates literal groups, generic repetition and open-ended counts", () => {
  for (const [regex, rules] of [
    [/^(?:a\.b){2,4}$/u, 'start\nbetween 2 and 4 "a.b"\nend'],
    [/^\d{3,}$/u, "start\nat least 3 digit\nend"],
    [/^.+$/su, "start\none or more any character\nend"],
    [/^[^,]*$/u, 'start\ntext without: ","\nend'],
  ]) {
    const translated = regexToRules(regex);
    assert.equal(translated.rules, rules);
    const rebuilt = compile(translated.rules, { flags: translated.flags });
    assert.equal(rebuilt.source, regex.source);
    assert.equal(rebuilt.flags, regex.flags);
  }
});

test("empty non-capturing groups translate to zero-count rules with equivalent matching", () => {
  for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
    for (const [source, rules] of [
      ["", "0 any character"],
      ["(?:)", "0 any character"],
      ["(?:)*", "0 any character"],
      ["(?:)+", "0 any character"],
      ["(?:)?", "0 any character"],
      ["(?:){0}", "0 any character"],
      ["(?:){3}", "0 any character"],
      ["(?:){1000}", "0 any character"],
      ["(?:){0,1}", "0 any character"],
      ["(?:){0,4}", "0 any character"],
      ["(?:){2,4}", "0 any character"],
      ["(?:){2,}", "0 any character"],
      ["a(?:)b", '"a"\n0 any character\n"b"'],
      ["😀(?:)+", '"😀"\n0 any character'],
      [
        String.raw`\uD83D(?:)\uDE00`,
        `${JSON.stringify("\ud83d")}\n0 any character\n${JSON.stringify("\ude00")}`,
      ],
      ["^(?:)$", "start\n0 any character\nend"],
      ["^K(?:){3}$", 'start\n"K"\n0 any character\nend'],
    ]) {
      const regex = new RegExp(source, flags);
      const translated = regexToRules(regex);
      assert.equal(translated.flags, `${regex.ignoreCase ? "i" : ""}${regex.dotAll ? "s" : ""}`);
      assert.equal(
        translated.rules,
        flags.includes("m")
          ? rules.replace(/^start\n/u, "line start\n").replace(/\nend$/u, "\nline end")
          : rules,
      );
      const rebuilt = compile(translated.rules, { flags: translated.flags });
      const pattern = toRegExp(rebuilt);
      assert.match(rebuilt.source, /\.\{0\}/u);
      for (const sample of [
        "",
        "x",
        "\n",
        "😀",
        "😀😀",
        "ab",
        "AabB",
        "K",
        "k",
        "K",
        "\nK\n",
        "\ud83d",
        "\ude00",
      ]) {
        const expected = regex.exec(sample);
        const actual = pattern.exec(sample);
        assert.equal(actual?.[0], expected?.[0], `${regex}: ${JSON.stringify(sample)}`);
        assert.equal(actual?.index, expected?.index, `${regex}: ${JSON.stringify(sample)}`);
      }
    }
  }
  for (const [source, column] of [
    ["(?:)*?", 6],
    ["(?:){1001}", 5],
    ["()", 1],
    ["(?:(?:))", 4],
    ["[]", 1],
  ]) {
    assert.throws(() => regexToRules(new RegExp(source, "u")), {
      code: "UNSUPPORTED_REGEX",
      line: 1,
      column,
    });
  }
});

test("maps multiline anchors and matching flags without changing their meaning", () => {
  const original = /^a.*$/imsu;
  const translated = regexToRules(original);
  assert.equal(translated.rules, 'line start\n"a"\nany text\nline end');
  assert.equal(translated.flags, "is");
  const rebuilt = compile(translated.rules, { flags: translated.flags });
  assert.equal(rebuilt.source, original.source);
  assert.equal(rebuilt.flags, original.flags);
});

test("letter and hex range orders translate with equivalent matching and canonical output", () => {
  const samples = [
    ...Array.from({ length: 256 }, (_, point) => String.fromCodePoint(point)),
    "K",
    "ſ",
    "é",
    "😀",
    "𐀀",
    "\u2028",
    "\ud800",
    "\udc00",
    "",
  ];
  for (const [body, phrase, canonical] of [
    ["A-Za-z", "letter", "A-Za-z"],
    ["a-zA-Z", "letter", "A-Za-z"],
    ...["0-9A-Fa-f", "0-9a-fA-F", "A-F0-9a-f", "A-Fa-f0-9", "a-f0-9A-F", "a-fA-F0-9"].map(
      (body) => [body, "hex digit", "0-9A-Fa-f"],
    ),
  ]) {
    for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
      const regex = new RegExp(`^[${body}]{1,2}$`, flags);
      const translated = regexToRules(regex);
      const anchor = regex.multiline ? "line " : "";
      assert.equal(translated.rules, `${anchor}start\nbetween 1 and 2 ${phrase}\n${anchor}end`);
      const result = compile(translated.rules, { flags: translated.flags });
      assert.equal(result.source, `^[${canonical}]{1,2}$`);
      assert.equal(result.flags, regex.flags);
      const rebuilt = toRegExp(result);
      for (const sample of samples) {
        for (const candidate of [sample, sample.repeat(2), `X${sample}`, `${sample}\n`]) {
          assert.deepEqual(
            rebuilt.exec(candidate),
            regex.exec(candidate),
            `${regex}: ${JSON.stringify(candidate)}`,
          );
        }
      }
    }
  }
  for (const regex of [/^[a-c]+$/u, /^[0-9a-f]+$/u, /^[^a-zA-Z]+$/u, /^[a-zA-Z0-9]+$/u]) {
    assert.throws(() => regexToRules(regex), { code: "UNSUPPORTED_REGEX" });
  }
});

test("edge hyphens stay literal in positive and negative character lists", () => {
  assert.equal(regexToRules(/^[._-]+$/u).rules, 'start\none or more one of: ".", "_", "-"\nend');
  assert.equal(regexToRules(/^[^-._]*$/u).rules, 'start\ntext without: "-", ".", "_"\nend');
  assert.equal(regexToRules(/^[-]$/u).rules, 'start\n"-"\nend');
  const samples = [
    ...Array.from({ length: 256 }, (_, point) => String.fromCodePoint(point)),
    "😀",
    "𐀀",
    "K",
    "ſ",
    "\ud800",
    "\udc00",
    "",
    "._-",
    "-😀",
    "\n-",
  ];
  for (const body of [
    "-",
    "--",
    "-._",
    "._-",
    "-a",
    "a-",
    "-😀",
    "😀-",
    String.raw`-\cJ`,
    String.raw`\cJ-`,
    String.raw`a\-b`,
  ]) {
    for (const negative of ["", "^"]) {
      for (const suffix of ["", "*", "+", "?", "{2,3}"]) {
        for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
          const regex = new RegExp(`^[${negative}${body}]${suffix}$`, flags);
          const translated = regexToRules(regex);
          const result = compile(translated.rules, { flags: translated.flags });
          assert.equal(result.flags, regex.flags);
          const rebuilt = toRegExp(result);
          for (const sample of samples) {
            for (const candidate of [sample, sample.repeat(2), `😀${sample}`, `${sample}\n`]) {
              assert.deepEqual(
                rebuilt.exec(candidate),
                regex.exec(candidate),
                `${regex}: ${JSON.stringify(candidate)}`,
              );
            }
          }
        }
      }
    }
  }
  for (const [regex, column] of [
    [/^[a-c-]+$/u, 4],
    [/^[--a]+$/u, 4],
    [/^[---]+$/u, 4],
    [/^[\u002d-a]+$/u, 9],
  ]) {
    assert.throws(() => regexToRules(regex), { code: "UNSUPPORTED_REGEX", line: 1, column });
  }
});

test("escapes literal punctuation and decodes Unicode escapes", () => {
  for (const regex of [/^a\/b\+c$/u, /^\u{1f600}$/u, /^[,\]]$/u]) {
    const translated = regexToRules(regex);
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    for (const sample of ["a/b+c", "😀", ",", "]", "other"]) {
      assert.equal(rebuilt.test(sample), regex.test(sample), `${regex}: ${sample}`);
    }
  }
});

test("code-point escapes with leading zeros preserve literals, lists, groups and limits", () => {
  for (const point of [0, 10, 0x41, 0x7f, 0xd83d, 0xde00, 0x10000, 0x1f600, 0x10ffff]) {
    const value = String.fromCodePoint(point);
    for (const padding of [7, 12, 32]) {
      const escaped = `\\u{${point.toString(16).padStart(padding, "0")}}`;
      for (const source of [
        `^${escaped}$`,
        `^${escaped}{2}$`,
        `^[${escaped}X]{1,2}$`,
        `^[^${escaped}X]+$`,
        `^(?:${escaped}A){2}$`,
      ]) {
        for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
          const original = new RegExp(source, flags);
          const translated = regexToRules(original);
          const result = compile(translated.rules, { flags: translated.flags });
          assert.equal(result.flags, original.flags);
          const rebuilt = toRegExp(result);
          for (const sample of [
            "",
            value,
            value.repeat(2),
            `${value}A${value}A`,
            "X",
            "XX",
            "a",
            "😀",
            "\n",
            `\n${value}\n`,
          ]) {
            assert.deepEqual(rebuilt.exec(sample), original.exec(sample), String(original));
          }
        }
      }
    }
  }
  const limit = new RegExp(`^\\u{${"0".repeat(16_384 - 8)}41}$`, "u");
  assert.equal(limit.source.length, 16_384);
  assert.deepEqual(regexToRules(limit), { rules: 'start\n"A"\nend', flags: "" });
  const tooLong = new RegExp(`^\\u{${"0".repeat(16_384 - 7)}41}$`, "u");
  assert.throws(() => regexToRules(tooLong), { code: "REGEX_SOURCE_LIMIT", column: 16_385 });
});

test("ASCII control-letter escapes preserve matching in literals, lists and literal groups", () => {
  assert.equal(regexToRules(/^\cJ$/u).rules, 'start\n"\\n"\nend');
  assert.equal(regexToRules(/^(?:\cM\cj){2}$/u).rules, 'start\n2 "\\r\\n"\nend');
  const samples = [
    ...Array.from({ length: 128 }, (_, point) => String.fromCharCode(point)),
    "😀",
    "",
  ];
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") {
    const escaped = `\\c${letter}`;
    const control = String.fromCharCode(letter.charCodeAt(0) % 32);
    for (const source of [
      `^${escaped}{2}$`,
      `^[${escaped}X]+$`,
      `^[^${escaped}X]+$`,
      `^(?:${escaped}a){2}$`,
      `${escaped}+`,
    ]) {
      for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
        const regex = new RegExp(source, flags);
        const translated = regexToRules(regex);
        assert.doesNotMatch(translated.rules.replaceAll("\n", ""), /\p{Control}/u);
        const result = compile(translated.rules, { flags: translated.flags });
        assert.equal(
          result.flags,
          source.startsWith("^") ? regex.flags : regex.flags.replace("m", ""),
        );
        assert.doesNotMatch(result.source, /\p{Control}/u);
        const rebuilt = toRegExp(result);
        for (const sample of [...samples, control.repeat(2), `${control}a${control}a`, letter]) {
          for (const candidate of [sample, `😀${sample}${control}\n`]) {
            assert.deepEqual(
              rebuilt.exec(candidate),
              regex.exec(candidate),
              `${regex}: ${JSON.stringify(candidate)}`,
            );
          }
        }
      }
    }
  }
  for (const source of [String.raw`\c0`, String.raw`[\c_]`, String.raw`\cK`]) {
    assert.throws(() => new RegExp(source, "u"), SyntaxError);
    assert.throws(() => regexToRules(new RegExp(source)), { code: "UNICODE_FLAG_REQUIRED" });
  }
});

test("fixed-width surrogate escapes preserve Unicode atoms in repetition and character classes", () => {
  const samples = ["", "😀", "😀😀", "A😀B", "😀\ude00", "\ud83d", "\ude00", "A"];
  for (const regex of [
    /\uD83D\uDE00+/u,
    /^\uD83D\uDE00{2}$/u,
    /^[\uD83D\uDE00]+$/u,
    /^[^\uD83D\uDE00]+$/u,
    /^(?:\uD83D\uDE00)+$/u,
  ]) {
    const translated = regexToRules(regex);
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    for (const sample of samples) {
      const expected = regex.exec(sample);
      const actual = rebuilt.exec(sample);
      assert.equal(actual?.[0], expected?.[0], `${regex}: ${JSON.stringify(sample)}`);
      assert.equal(actual?.index, expected?.index, `${regex}: ${JSON.stringify(sample)}`);
    }
  }
});

test("separate lone-surrogate atoms remain separate when literal rules are merged", () => {
  for (const regex of [
    /^\u{D83D}\u{DE00}$/u,
    /^\uD83D(?:\uDE00)$/u,
    /^(?:\uD83D)\uDE00$/u,
    new RegExp(`^\ud83d${String.raw`\uDE00`}$`, "u"),
    new RegExp(`^${String.raw`\uD83D`}\ude00$`, "u"),
  ]) {
    const translated = regexToRules(regex);
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    for (const sample of ["", "😀", "😀😀", "\ud83d", "\ude00"]) {
      assert.equal(rebuilt.test(sample), regex.test(sample), `${regex}: ${JSON.stringify(sample)}`);
    }
  }
});

test("literal groups reject separate surrogate atoms that one literal rule cannot preserve", () => {
  assert.throws(() => regexToRules(/^(?:\u{D83D}\u{DE00})+$/u), {
    code: "UNSUPPORTED_REGEX",
    line: 1,
    column: 13,
  });
});

test("translated line limits describe the whole regex rather than a generated line", () => {
  const atLimit = new RegExp(String.raw`\d`.repeat(200), "u");
  const translated = regexToRules(atLimit);
  assert.equal(translated.rules.split("\n").length, 200);
  assert.equal(compile(translated.rules, { flags: translated.flags }).source, atLimit.source);
  for (const source of [String.raw`\d`.repeat(201), `^${String.raw`\d`.repeat(199)}$`]) {
    assert.throws(
      () => regexToRules(new RegExp(source, "u")),
      (error) => {
        assert.ok(error instanceof CompileError);
        assert.deepEqual(error.toJSON(), {
          code: "LINE_LIMIT",
          message: "Translated rules cannot exceed 200 lines.",
          line: 1,
          column: 1,
          hint: "Simplify the regex so its translated rules fit these limits.",
        });
        return true;
      },
    );
  }
});

test("translated length limits account for escaping and retain the accepted boundary", () => {
  // Each direction control expands to six visible code units in the rules.
  const value = `${"A\u202e".repeat(2340)}BC`;
  const translated = regexToRules(new RegExp(value, "u"));
  assert.equal(translated.rules.length, 16_384);
  assert.equal(toRegExp(compile(translated.rules)).exec(value)?.[0], value);
  assert.throws(
    () => regexToRules(new RegExp(`${value}D`, "u")),
    (error) => {
      assert.ok(error instanceof CompileError);
      assert.deepEqual(error.toJSON(), {
        code: "SOURCE_LIMIT",
        message: "Translated rules cannot exceed 16384 UTF-16 code units.",
        line: 1,
        column: 1,
        hint: "Simplify the regex so its translated rules fit these limits.",
      });
      return true;
    },
  );
});

test("oversized regex input keeps its own source-limit code and position", () => {
  assert.throws(() => regexToRules(new RegExp("a".repeat(16_385), "u")), {
    code: "REGEX_SOURCE_LIMIT",
    message: "Regex source cannot exceed 16384 UTF-16 code units.",
    line: 1,
    column: 16_385,
  });
});

test("alternation reports its operator and repair hint while literal pipes still round-trip", () => {
  for (const [regex, column] of [
    [/a|b/u, 2],
    [/^a|b$/u, 3],
    [/😀|b/u, 3],
    [/|a/u, 1],
    [/^(?:a|b)$/u, 6],
    [/^(?:😀|b)$/u, 7],
    [/^(?:|a)$/u, 5],
    [/^a\|b|c$/u, 6],
    [/^[|]a|b$/u, 6],
    [/^(?:a\|b|c)$/u, 9],
  ]) {
    assert.throws(
      () => regexToRules(regex),
      (error) => {
        assert.ok(error instanceof CompileError);
        assert.deepEqual(error.toJSON(), {
          code: "UNSUPPORTED_REGEX",
          message: "Alternation (`|`) cannot be translated.",
          line: 1,
          column,
          hint: "Translate each alternative as a separate regex.",
        });
        return true;
      },
    );
  }
  for (const regex of [/^a\|b$/u, /^(?:a\|b){2}$/u, /^[|]$/u, /^[a|b]{2}$/iu, /^[^|]+$/u]) {
    const translated = regexToRules(regex);
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    for (const sample of ["a|b", "a|ba|b", "|", "||", "ab", "AB", "", "😀|", "a\nb"]) {
      assert.deepEqual(
        rebuilt.exec(sample),
        regex.exec(sample),
        `${regex}: ${JSON.stringify(sample)}`,
      );
    }
  }
  assert.throws(() => regexToRules(/a^b/u), {
    code: "UNSUPPORTED_REGEX",
    line: 1,
    column: 2,
    message: "Only a start anchor at the beginning and an end anchor at the end can be translated.",
  });
});

test("unsupported groups identify captures and lookaround at their opening parenthesis", () => {
  for (const [source, message] of [
    ["()", "Capturing groups cannot be translated."],
    ["(AB)", "Capturing groups cannot be translated."],
    ["(?<letters>AB)", "Capturing groups cannot be translated."],
    ["(?=AB)AB", "Lookahead assertions cannot be translated."],
    ["(?!AB)CD", "Lookahead assertions cannot be translated."],
    ["(?<=A)B", "Lookbehind assertions cannot be translated."],
    ["(?<!A)B", "Lookbehind assertions cannot be translated."],
  ]) {
    for (const [prefix, suffix] of [
      ["", ""],
      ["^", ""],
      ["^😀", ""],
      [String.raw`\(`, ""],
      ["[(]", ""],
      ["(?:X", ")"],
      ["(?:😀", ")"],
    ]) {
      for (const flags of ["u", "imsu"]) {
        assert.throws(
          () => regexToRules(new RegExp(`${prefix}${source}${suffix}`, flags)),
          (error) => {
            assert.ok(error instanceof CompileError);
            assert.deepEqual(error.toJSON(), {
              code: "UNSUPPORTED_REGEX",
              message,
              line: 1,
              column: prefix.length + 1,
              hint: "Supported syntax includes literals, anchors, common character classes, repetition, non-capturing literal or empty groups and i/s/u/m flags. Capturing or complex groups, alternation, lookaround and backreferences are not supported.",
            });
            return true;
          },
        );
      }
    }
  }
  for (const regex of [/^\(AB\)$/u, /^[()]$/u, /^(?:AB){2}$/iu, /^(?:)$/u]) {
    const translated = regexToRules(regex);
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    for (const sample of ["(AB)", "(", ")", "ABAB", "abab", "", "😀AB"]) {
      assert.deepEqual(rebuilt.exec(sample), regex.exec(sample));
    }
  }
  assert.throws(() => regexToRules(/^(?:a+)$/u), {
    code: "UNSUPPORTED_REGEX",
    message: "Groups can contain literal text only.",
    line: 1,
    column: 6,
  });
});

test("rejects features it cannot preserve and non-Unicode matching", () => {
  for (const [regex, column] of [
    [/^a|b$/u, 3],
    [/(?=a)a/u, 1],
    [/\bword/u, 1],
    [/a*?/u, 3],
    [/\p{L}/u, 1],
  ]) {
    assert.throws(() => regexToRules(regex), {
      code: "UNSUPPORTED_REGEX",
      line: 1,
      column,
    });
  }
  assert.throws(() => regexToRules(/\d+/), { code: "UNICODE_FLAG_REQUIRED" });
  assert.throws(() => regexToRules(/a/gu), { code: "UNSUPPORTED_REGEX_FLAGS" });
  assert.throws(() => regexToRules("a"), { name: "TypeError" });
});
