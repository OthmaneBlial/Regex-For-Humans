import assert from "node:assert/strict";
import test from "node:test";
import { compile, toRegExp } from "../index.js";
import { quoteText } from "../src/display.js";
import { LIMITS } from "../src/parser.js";
import { ruleCompletions } from "../web/rule-completions.js";
import { flagSets } from "./fixtures/unicode-set-corpus.js";

function choose(source, caret, name, flags = "du") {
  const choice = ruleCompletions(source, caret, { flags }).find(
    (item) => item.text === `same as capture ${quoteText(name)}`,
  );
  assert(choice, `Expected ${JSON.stringify(name)} at ${caret} in ${JSON.stringify(source)}`);
  return choice;
}

test("quoted references preserve native Unicode captures, lazy counts, spans and cursors", () => {
  let comparisons = 0;
  for (const name of [
    "field",
    "Field",
    "_value",
    "$value",
    "字",
    "حرف",
    "éclair",
    "e\u0301clair",
    "नमस्ते",
    "𝔘nicode",
    "a\u200cb",
    "a\u200db",
  ]) {
    const hex = name.charCodeAt(0).toString(16).padStart(4, "0");
    for (const raw of [
      name.slice(0, 1),
      `\\u${hex}`,
      `\\u${hex.slice(0, 3)}`,
      "\\",
      JSON.stringify(name.slice(0, 2)).slice(1, -1),
    ])
      for (const closed of [false, true])
        for (const flags of [...flagSets, ...flagSets.map((f) => f.replace("v", "u"))]) {
          const prefix = `capture ${quoteText(name)} {\n "😀"\n}\nLAZY\tbetween 1 and 3\tSAME AS CAPTURE\t`;
          const literal = `"${raw}${closed ? 'WRONG"' : ""}`;
          const suffix = '\n# retained <img onerror=alert(1)>\noptional "Z"';
          const source = prefix + literal + suffix;
          const choice = choose(source, prefix.length + 1 + raw.length, name, flags);
          assert.equal(choice.rules, prefix + quoteText(name) + suffix);
          assert.equal(choice.preview, choice.rules);
          assert.equal(choice.caret, prefix.length + quoteText(name).length);
          const actual = toRegExp(compile(choice.rules, { flags }));
          const native = new RegExp(`(?<${name}>😀)(?:\\k<${name}>){1,3}?(?:Z){0,1}`, flags);
          for (const input of ["", "😀", "😀😀", "😀😀😀", "😀😀😀😀", "😀😀Z", "😀😃", "!😀😀"])
            for (const cursor of [0, 1, 2]) {
              actual.lastIndex = cursor;
              native.lastIndex = cursor;
              for (let step = 0; step < 2; step++) {
                assert.deepEqual(actual.exec(input), native.exec(input));
                assert.equal(actual.lastIndex, native.lastIndex);
                comparisons++;
              }
            }
        }
  }
  assert.equal(comparisons, 737_280);
});

test("quoted targets retain native absent, empty and lookaround capture participation", () => {
  let comparisons = 0;
  for (const [definition, pattern] of [
    ['capture "field" {\n}', "(?<field>)"],
    ['optional capture "field" {\n "A"\n}', "(?<field>A){0,1}"],
    ['either {\n capture "field" {\n  "A"\n }\n "B"\n}', "(?:(?<field>A)|B)"],
    ['followed by {\n capture "field" {\n  "A"\n }\n}', "(?=(?<field>A))"],
    ['not followed by {\n capture "field" {\n  "A"\n }\n}', "(?!(?<field>A))"],
    ['preceded by {\n capture "field" {\n  "😀"\n }\n}', "(?<=(?<field>😀))"],
  ])
    for (const flags of [...flagSets, ...flagSets.map((f) => f.replace("v", "u"))]) {
      const source = `${definition}\nsame as capture "fi`;
      const choice = choose(source, source.length, "field", flags);
      const actual = toRegExp(compile(choice.rules, { flags }));
      const native = new RegExp(`${pattern}\\k<field>`, flags);
      for (const input of ["", "A", "AA", "B", "BA", "a", "😀", "😀😀"])
        for (const cursor of [0, 1, 2]) {
          actual.lastIndex = cursor;
          native.lastIndex = cursor;
          for (let step = 0; step < 2; step++) {
            assert.deepEqual(actual.exec(input), native.exec(input));
            assert.equal(actual.lastIndex, native.lastIndex);
            comparisons++;
          }
        }
    }
  assert.equal(comparisons, 36_864);
});

test("quoted matching is case sensitive and understands incomplete JSON and surrogate escapes", () => {
  const definitions =
    'capture "field" {\n "A"\n}\ncapture "Field" {\n "B"\n}\ncapture "𝔘nicode" {\n "C"\n}\ncapture "éclair" {\n "D"\n}\ncapture "éclair" {\n "E"\n}';
  for (const [raw, names] of [
    ["f", ["field"]],
    ["F", ["Field"]],
    ["\\u006", ["field", "éclair"]],
    ["\\uD835\\udD", ["𝔘nicode"]],
    ["é", ["éclair"]],
    ["e", ["éclair"]],
    ["\\U0066", []],
    ["\\u{66}", []],
    ["\\q", []],
    ["field\\", []],
  ]) {
    const source = `${definitions}\nsame as capture "${raw}`;
    assert.deepEqual(
      ruleCompletions(source, source.length, { flags: "diu" }).map((c) => c.text),
      names.map((name) => `same as capture ${quoteText(name)}`),
      raw,
    );
  }
});

test("quoted ranges retain following literals, comments, every separator and capture scope", () => {
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"])
    for (const tail of ['"', "", "eld"]) {
      const source = [
        '"😀\u2028"',
        'capture "outer" {',
        ' capture "field" {',
        '  "A"',
        " }",
        ` same as capture "fi${tail}`,
        " # kept",
        "}",
        '"Z"',
        "same as capture 2",
      ].join(separator);
      const caret = source.lastIndexOf('"fi') + 3;
      const choice = choose(source, caret, "field");
      assert(
        choice.rules.includes(
          ` same as capture "field"${separator} # kept${separator}}${separator}"Z"`,
        ),
      );
      assert(choice.rules.endsWith("same as capture 2"));
      const match = toRegExp(compile(choice.rules, { flags: "du" })).exec("😀\u2028AAZA");
      assert.deepEqual([...match], ["😀\u2028AAZA", "AA", "A"]);
      assert.deepEqual(match.indices.groups.field, [3, 4]);
      assert.equal(choice.rules[choice.caret - 1], '"');
    }
  for (const source of [
    'capture "field" {\n "A"\n}\nsame as capture "fi""unrelated"',
    'capture "field" {\n "A"\n}\nsame as capture "fiBAD # keep',
    'capture "open" {\n same as capture "op\n}',
    'same as capture "la\ncapture "later" {\n "A"\n}',
    '"same as capture \\"fi"',
  ]) {
    const caret = source.indexOf('"', source.indexOf("same as capture")) + 3;
    assert.deepEqual(ruleCompletions(source, caret), [], source);
  }
});

test("candidate budgets do not hide shorter names and discovery remains bounded", () => {
  const long = "long".repeat(64);
  const rest = `\ncapture ${quoteText(long)} {\n "A"\n}\ncapture "s" {\n "B"\n}\nsame as capture ""`;
  const source = `#${"x".repeat(LIMITS.sourceLength - rest.length - 3)}${rest}`;
  const choices = ruleCompletions(source, source.length - 1);
  assert.deepEqual(
    choices.map((c) => c.text),
    ['same as capture "s"'],
  );
  assert.deepEqual([...toRegExp(compile(choices[0].rules)).exec("ABB")], ["ABB", "A", "B"]);
  const many = `${Array.from({ length: 99 }, (_, i) => `capture "cap${i}" {\n}`).join("\n")}\nsame as capture "cap`;
  const all = ruleCompletions(many, many.length);
  assert.equal(all.length, 99);
  assert.equal(new Set(all.map((c) => c.rules)).size, 99);
  assert.equal(all.at(-1).text, 'same as capture "cap98"');
});

test("quoted completion preserves other quote contexts, invalid options, budgets and no-op boundaries", () => {
  const definitions = 'capture "field" {\n "A"\n}\n';
  for (const target of [
    '"fi"',
    'capture "fi" {\n digit\n}',
    'unicode property "fi"',
    'group with flags "fi" {\n digit\n}',
    '# same as capture "fi"',
    'character class: same as capture "fi"',
    'same as capture"fi"',
  ]) {
    const source = definitions + target;
    assert.deepEqual(ruleCompletions(source, source.lastIndexOf('"fi') + 3), [], target);
  }
  const complete = `${definitions}same as capture "field"`;
  assert.deepEqual(ruleCompletions(complete, complete.length - 1), []);
  assert.deepEqual(ruleCompletions(complete, complete.length), []);
  const partial = `${definitions}same as capture "fi`;
  assert.deepEqual(ruleCompletions(partial, partial.length, { flags: "uv" }), []);
  const oversized = `#${"x".repeat(LIMITS.sourceLength)}\n${partial}`;
  assert.deepEqual(ruleCompletions(oversized, oversized.length), []);
  const depth = `${"group {\n".repeat(LIMITS.groupDepth + 1)}${partial}\n${"}\n".repeat(LIMITS.groupDepth + 1)}`;
  assert.deepEqual(ruleCompletions(depth, depth.indexOf('"fi') + 3), []);
});
