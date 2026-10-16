import assert from "node:assert/strict";
import test from "node:test";
import { compile, toRegExp } from "../index.js";
import { LIMITS } from "../src/parser.js";
import { completeBlock } from "../web/insert-rule.js";
import { ruleCompletions } from "../web/rule-completions.js";
import { flagSets } from "./fixtures/unicode-set-corpus.js";

const sets = [
  ["character set union {", "[AB]", '"A"'],
  ["not character set union {", "[^AB]", '"A"'],
  ["character set intersection {", "[[A-Z]&&[AEIOU]]", 'range "A" to "Z"'],
  ["not character set intersection {", "[^[[A-Z]&&[AEIOU]]]", 'range "A" to "Z"'],
  ["character set subtraction {", "[[A-Z]--[AEIOU]]", 'range "A" to "Z"'],
  ["not character set subtraction {", "[^[[A-Z]--[AEIOU]]]", 'range "A" to "Z"'],
];

function choose(source, caret, text, flags = "dv") {
  const choice = ruleCompletions(source, caret, { flags }).find((item) => item.text === text);
  assert(choice, `Expected ${text} in ${JSON.stringify(source)}`);
  return choice;
}

test("all six set completions preserve native captures, indices and cursors across every v flag set", () => {
  for (const flags of flagSets)
    for (const [text, pattern, operand] of sets) {
      const fragment = text.slice(0, -2);
      const source = `capture "value" {\n  ${fragment}\n}\nsame as capture 1`;
      const choice = choose(source, source.indexOf("\n}"), text, flags);
      assert.equal(choice.preview, choice.rules);
      assert(choice.rules.slice(choice.caret).startsWith(operand));
      assert(choice.rules.endsWith("same as capture 1"));
      const actual = toRegExp(compile(choice.rules, { flags }));
      const expected = new RegExp(`(?<value>${pattern})\\1`, flags);
      for (const input of [
        "",
        "AA",
        "BB",
        "11",
        "aa",
        "bb",
        "ÉÉ",
        "😀😀",
        "KK",
        "ſſ",
        "\n\n",
        "\ud800\ud800",
      ])
        for (const cursor of [0, 1, 2]) {
          actual.lastIndex = cursor;
          expected.lastIndex = cursor;
          for (let step = 0; step < 3; step++) {
            assert.deepEqual(
              actual.exec(input),
              expected.exec(input),
              `${text}/${flags}: ${input}`,
            );
            assert.equal(actual.lastIndex, expected.lastIndex);
          }
        }
    }
});

test("nested set operands complete enclosing arity while retaining every separator and quoted Unicode", () => {
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"])
    for (const outer of ["union", "intersection", "subtraction"])
      for (const [text, , operand] of sets) {
        const fragment = text.startsWith("not ") ? "not character se" : "character se";
        const source = [
          '"😀\u2028"',
          'capture "target" {',
          '  "A"',
          "}",
          `character set ${outer} {`,
          `\t${fragment} # retained <img onerror=alert(1)>`,
          '  "A"',
          "}",
          "same as capture 1",
        ].join(separator);
        const caret = source.indexOf(" # retained");
        const choice = choose(source, caret, text);
        assert(choice.rules.startsWith(`"😀\u2028"${separator}`));
        assert(choice.rules.includes(`\t${text}${separator}\t  ${operand}`));
        assert(
          choice.rules.includes(`${separator}\t# retained <img onerror=alert(1)>${separator}`),
        );
        assert(choice.rules.slice(choice.caret).startsWith(operand));
        assert(choice.rules.endsWith("same as capture 1"));
        assert.equal(
          compile(choice.rules, { flags: "dv" }).segments.filter(
            (s) => s.kind === "group" && s.edge === "start" && s.capturing,
          ).length,
          1,
        );
      }
});

test("set proposals require v and retain grammar, quote, depth, size and line boundaries", () => {
  for (const flags of ["u", "iu", "uv", "vv"])
    assert.deepEqual(ruleCompletions("character se", 12, { flags }), []);
  assert.equal(
    ruleCompletions("", 0, { flags: "v" }).filter((c) => c.text.includes("{")).length,
    14,
  );
  for (const source of [
    '"character se"',
    "# character se",
    "2 character se",
    "character class: character se",
    "unknown\ncharacter se",
    "end\ncharacter se",
    "character se }",
    `#${"x".repeat(LIMITS.sourceLength)}\ncharacter se`,
    `${"#\n".repeat(LIMITS.lines - 3)}character se`,
    `${"character set union {\n".repeat(LIMITS.groupDepth)}character se\n${"}\n".repeat(LIMITS.groupDepth)}`,
  ]) {
    const caret = source.lastIndexOf("character se") + 12;
    assert(
      !ruleCompletions(source, caret, { flags: "v" }).some((c) => c.text.includes("set ")),
      source,
    );
  }
});

test("replacement completion repairs enclosing alternative arity and keeps capture reference targets", () => {
  const source = 'either {\n  cap\n  "B"\n}\ncapture {\n "A"\n}\nsame as capture 1';
  const choice = choose(source, source.indexOf('\n  "B"'), "capture {", "du");
  assert(choice.rules.includes("same as capture 2"));
  assert.deepEqual([...toRegExp(compile(choice.rules)).exec("1AA")], ["1AA", "1", "A"]);
});

test("block replacement rejects invalid caller ranges and non-block templates", () => {
  assert.throws(() => completeBlock(null, 0, 0, "group"), TypeError);
  for (const [start, end] of [
    [-1, 2],
    [2, 1],
    [0, 4],
    [0.5, 2],
    [0, NaN],
  ])
    assert.throws(() => completeBlock("gro", start, end, "group"), TypeError);
  for (const kind of ["class", "repetition", "constructor", "missing"])
    assert.throws(() => completeBlock("gro", 0, 3, kind), TypeError);
  assert.throws(() => completeBlock("digit gro", 6, 9, "group"), TypeError);
  assert.throws(() => completeBlock("x".repeat(LIMITS.sourceLength + 1), 0, 3, "group"), {
    code: "SOURCE_LIMIT",
  });
});
