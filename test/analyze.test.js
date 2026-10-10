import assert from "node:assert/strict";
import test from "node:test";
import { analyze, CompileError, compile, regexToRules } from "../index.js";
import { flagSets, patterns } from "./fixtures/advanced-flags-corpus.js";

function inspect(expression) {
  const translated = regexToRules(expression);
  return analyze(translated.rules, { flags: translated.flags });
}

test("analysis detects canonical nested, adjacent and prefix-choice repetition candidates", () => {
  for (const [expression, code] of [
    [/(a+)+$/u, "NESTED_REPETITION"],
    [/(a+){2}$/u, "NESTED_REPETITION"],
    [/(?:(?:a+))+$/u, "NESTED_REPETITION"],
    [/a+a+$/u, "ADJACENT_REPETITIONS"],
    [/(?:a+)a+$/u, "ADJACENT_REPETITIONS"],
    [/(?:a+){2}a+$/u, "ADJACENT_REPETITIONS"],
    [/a?a?$/u, "ADJACENT_REPETITIONS"],
    [/(a|aa)+$/u, "OVERLAPPING_ALTERNATIVES"],
    [/(\p{L}+)+$/u, "NESTED_REPETITION"],
    [/(a+)+$/iu, "NESTED_REPETITION"],
    [/\d+[0-9]+$/u, "ADJACENT_REPETITIONS"],
    [/a+A+$/iu, "ADJACENT_REPETITIONS"],
    [/(?:\w|[a-z])+$/u, "OVERLAPPING_ALTERNATIVES"],
    [/(?:[a-c]|[c-f])+$/u, "OVERLAPPING_ALTERNATIVES"],
    [/(?:a|A)+$/iu, "OVERLAPPING_ALTERNATIVES"],
    [/[[a-c]&&[b-d]]+[b]+$/v, "ADJACENT_REPETITIONS"],
  ])
    assert.ok(inspect(expression).warnings.some((finding) => finding.code === code));
  assert.equal(
    inspect(/a|ab/u).warnings.find((finding) => finding.code === "OVERLAPPING_ALTERNATIVES")
      .severity,
    "info",
  );
});

test("inactive, fixed and disjoint units do not get the basic repetition findings", () => {
  for (const expression of [
    /a{3}a{4}$/u,
    /a+b+$/u,
    /(a+b)+$/u,
    /(?:a+){0}$/u,
    /[a-c]+[d-f]+$/u,
    /a+A+$/u,
    /[[a]--[A]]+a+$/iv,
  ])
    assert.equal(inspect(expression).warnings.length, 0);
  assert.ok(inspect(/a+b+$/u).limitations.some((limit) => limit.includes("not a proof")));
  assert.equal("safe" in inspect(/a+b+$/u), false);
});

test("wildcard and source-size review notes use the canonical flags and generated source", () => {
  const broad = inspect(/.*$/su);
  assert.equal(broad.flags, "su");
  assert.deepEqual(
    broad.warnings.map((finding) => finding.code),
    ["UNBOUNDED_WILDCARD", "DOT_ALL_WILDCARD"],
  );
  assert.equal(
    inspect(/^a$/mu).warnings.filter((finding) => finding.code === "LINE_ANCHORS").length,
    2,
  );
  assert.equal(analyze('start\n"a"\nend', { flags: "m" }).warnings.length, 0);
  const largeRules = `start\n${JSON.stringify("\u2028".repeat(5000))}\nend`;
  const sizeFinding = analyze(largeRules).warnings.find(
    (finding) => finding.code === "LARGE_GENERATED_SOURCE",
  );
  assert.ok(sizeFinding);
  assert.equal(sizeFinding.sourceStart, 0);
  assert.equal(sizeFinding.sourceEnd, compile(largeRules).source.length);
});

test("findings retain shared opening locations and full block spans", () => {
  const translated = regexToRules(/(?<value>a+)+$/u);
  const compiled = compile(translated.rules, { flags: translated.flags });
  const finding = analyze(translated.rules, { flags: translated.flags }).warnings[0];
  const opening = compiled.segments.find((segment) => segment.kind === "group");
  const closing = compiled.segments.find(
    (segment) => segment.kind === "group" && segment.edge === "end",
  );
  assert.equal(finding.line, opening.line);
  assert.equal(finding.column, opening.column);
  assert.equal(finding.sourceStart, opening.sourceStart);
  assert.equal(finding.sourceEnd, closing.sourceEnd);
  assert.ok(finding.message && finding.hint);
});

test("analysis preserves compiler diagnostics and budgets instead of returning partial warnings", () => {
  for (const [source, options] of [
    ["not a rule", undefined],
    ['same as capture "missing"', undefined],
    ["digit", { flags: "uv" }],
    ["digit\n".repeat(201), undefined],
  ]) {
    let expected;
    try {
      compile(source, options);
    } catch (error) {
      expected = error;
    }
    assert.ok(expected instanceof CompileError);
    assert.throws(
      () => analyze(source, options),
      (error) =>
        error instanceof CompileError &&
        error.code === expected.code &&
        error.line === expected.line &&
        error.column === expected.column,
    );
  }
});

test("analysis metadata remains bounded and valid across the shared native flag corpus", () => {
  for (const flags of flagSets) {
    for (const source of patterns) {
      const translated = regexToRules(new RegExp(source, flags));
      const compiled = compile(translated.rules, { flags });
      const result = analyze(translated.rules, { flags });
      assert.equal(result.flags, compiled.flags);
      assert.ok(result.limitations.length > 0);
      for (const finding of result.warnings) {
        assert.ok(Number.isSafeInteger(finding.line) && finding.line > 0);
        assert.ok(Number.isSafeInteger(finding.column) && finding.column > 0);
        assert.ok(finding.sourceStart >= 0 && finding.sourceStart <= finding.sourceEnd);
        assert.ok(finding.sourceEnd <= compiled.source.length);
        assert.ok(["warning", "info"].includes(finding.severity));
        assert.ok(finding.code && finding.message && finding.hint);
      }
      assert.doesNotMatch(JSON.stringify(result), /NaN|Infinity/u);
    }
  }
});
