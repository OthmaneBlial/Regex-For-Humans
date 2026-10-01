import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
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
