import assert from "node:assert/strict";
import test from "node:test";
import {
  analyze,
  compile,
  editGroup,
  exportRegex,
  regexToRules,
  toRegExp,
  toSVG,
} from "../index.js";
import { supportsModifiers } from "../src/flags.js";
import { parse } from "../src/parser.js";
import { failureRequirements } from "../web/failure-reasons.js";
import { flagSets } from "./fixtures/advanced-flags-corpus.js";
import { scopedInputs, scopedPatterns } from "./fixtures/scoped-flags-corpus.js";

const supported = supportsModifiers();

test("scoped flag groups are native, bounded and leave enclosing flags unchanged", () => {
  const rules = 'start\ngroup with flags "i-s" {\n"a"\nany character\n}\n"B"\nend';
  if (!supported) {
    assert.throws(() => compile(rules), { code: "UNSUPPORTED_TARGET_FEATURE", line: 2, column: 1 });
    return;
  }
  const compiled = compile(rules, { flags: "s" });
  assert.equal(compiled.source, "^(?i-s:a.)B$");
  assert.equal(compiled.flags, "su");
  const regex = toRegExp(compiled);
  for (const [value, expected] of [
    ["AxB", true],
    ["axB", true],
    ["A\nB", false],
    ["Axb", false],
  ])
    assert.equal(regex.test(value), expected);
  const translated = regexToRules(regex);
  const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
  assert.equal(rebuilt.source, regex.source);
  assert.equal(rebuilt.flags, regex.flags);
});

test("scoped flag syntax validates duplicate, conflicting and unsupported flags at their quoted token", () => {
  for (const value of ["", "g", "u", "v", "d", "y", "I", "ii", "i-i", "m-m", "-", "i--s", "is-s"]) {
    assert.throws(() => parse(`group with flags "${value}" {\n"a"\n}`), {
      code: "INVALID_GROUP_FLAGS",
      line: 1,
      column: 18,
      endColumn: 20 + value.length,
    });
  }
  for (const value of ["i", "m", "s", "ims", "-i", "im-s", "i-"])
    assert.equal(parse(`group with flags "${value}" {\n"a"\n}`).nodes[0].modifiers, value);
});

test("scoped grammar retains original escape ranges and the existing structural budget", () => {
  assert.equal(parse('group with flags "i\\u006d" {\n"a"\n}').nodes[0].modifiers, "im");
  assert.throws(() => parse('  optional group with flags "i\\u0069" {\n"a"\n}'), {
    code: "INVALID_GROUP_FLAGS",
    line: 1,
    column: 29,
    endColumn: 38,
  });
  for (const header of ['capture with flags "i" {', 'capture "name" with flags "i" {'])
    assert.throws(() => parse(`${header}\n"a"\n}`), { code: "INVALID_GROUP" });
  const nested = (depth) =>
    `${'group with flags "i" {\n'.repeat(depth)}"a"\n${"}\n".repeat(depth)}`;
  assert.equal(parse(nested(64)).nodes[0].kind, "group");
  assert.throws(() => parse(nested(65)), { code: "GROUP_DEPTH_LIMIT", line: 65, column: 1 });
});

test("scoped native imports preserve matches, captures, indices and cursors across all flag combinations", {
  skip: !supported,
}, () => {
  for (const flags of flagSets) {
    for (const [source, witness, mode] of scopedPatterns) {
      if (mode && !flags.includes(mode)) continue;
      assert.ok(
        new RegExp(source, flags.replace(/[gy]/gu, "")).test(witness),
        `${source}/${flags} witness`,
      );
      const original = new RegExp(source, flags);
      original.lastIndex = 7;
      const translated = regexToRules(original);
      assert.equal(original.lastIndex, 7);
      const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
      assert.equal(rebuilt.flags, original.flags, `${source}/${flags}`);
      for (const input of scopedInputs) {
        for (const cursor of [0, 1, 2]) {
          original.lastIndex = cursor;
          rebuilt.lastIndex = cursor;
          for (let step = 0; step < 2; step += 1) {
            assert.deepEqual(
              rebuilt.exec(input),
              original.exec(input),
              `${source}/${flags}: ${JSON.stringify(input)}, cursor ${cursor}, step ${step}`,
            );
            assert.equal(rebuilt.lastIndex, original.lastIndex);
          }
        }
      }
    }
  }
});

test("explicit input/line anchors keep their meaning inside enabled and disabled multiline scopes", {
  skip: !supported,
}, () => {
  for (const [rules, accepted, rejected] of [
    ['group with flags "m" {\nstart\n"a"\nend\n}', "a", "x\na\ny"],
    ['group with flags "-m" {\nline start\n"a"\nline end\n}', "x\na\ny", "ba"],
  ]) {
    const result = compile(rules);
    assert.equal(result.flags, "u");
    assert.equal(toRegExp(result).test(accepted), true);
    assert.equal(toRegExp(result).test(rejected), false);
    const imported = regexToRules(toRegExp(result));
    for (const value of [accepted, rejected, "a\n", "\ra\r", "a\r\n"])
      assert.deepEqual(
        toRegExp(compile(imported.rules, { flags: imported.flags })).exec(value),
        toRegExp(result).exec(value),
      );
  }
  const nested = `${'group with flags "-m" {\n'.repeat(64)}line start\n"a"\nline end\n${"}\n".repeat(64)}`;
  const result = compile(nested);
  const imported = regexToRules(toRegExp(result));
  assert.deepEqual(
    toRegExp(compile(imported.rules, { flags: imported.flags })).exec("x\na\ny"),
    toRegExp(result).exec("x\na\ny"),
  );
});

test("local options reach explanation metadata, analysis, diagrams, failure proofs and exports", {
  skip: !supported,
}, () => {
  const rules = 'start\ngroup with flags "is" {\n"a"\nany character\n}\n"B"\nend';
  const result = compile(rules);
  const literal = result.segments.find((segment) => segment.text === '"a"');
  const outside = result.segments.find((segment) => segment.text === '"B"');
  assert.equal(literal.flags, "isu");
  assert.match(literal.explanation, /ignoring case/u);
  assert.equal(outside.flags, undefined);
  assert.doesNotMatch(outside.explanation, /ignoring case/u);
  for (const segment of result.segments)
    assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
  assert.ok(analyze(rules).warnings.some((warning) => warning.code === "DOT_ALL_WILDCARD"));
  assert.ok(
    !analyze('group with flags "-s" {\nany character\n}', { flags: "s" }).warnings.some(
      (warning) => warning.code === "DOT_ALL_WILDCARD",
    ),
  );
  assert.match(toSVG(rules), /ignoring case/u);
  assert.deepEqual(failureRequirements(rules, "u"), {
    minimum: 2,
    literals: ["B"],
    endLiteral: "B",
  });
  assert.equal(exportRegex(rules).source, result.source);
  for (const target of ["python", "rust", "go", "java", "csharp", "php", "ruby"])
    assert.throws(() => exportRegex(rules, { target }), {
      code: "EXPORT_SCOPED_FLAGS",
      line: 2,
      column: 1,
    });
});

test("converting a scoped group to a capture retains options, newline spelling and reference targets", {
  skip: !supported,
}, () => {
  for (const separator of ["\n", "\r\n", "\r", "\u2028", "\u2029"]) {
    const rules = [
      'group with flags "i" {',
      'capture "inner" {',
      '"a"',
      "}",
      "same as capture 1",
      "}",
    ].join(separator);
    const edited = editGroup(rules, { line: 1, column: 1 }, { capturing: true, name: "outer" });
    assert.ok(edited.startsWith(`capture "outer" {${separator}group with flags "i" {`));
    assert.match(edited, /same as capture 2/u);
    const regex = toRegExp(compile(edited));
    const matched = regex.exec("aA");
    assert.equal(matched.groups.outer, "aA");
    assert.equal(matched.groups.inner, "a");
  }
});
