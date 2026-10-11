import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, regexToRules } from "../index.js";
import { explainMismatch, failureRequirements } from "../web/failure-reasons.js";
import { translations } from "../web/translations.js";
import { flagSets } from "./fixtures/advanced-flags-corpus.js";

const noMatch = { id: 1, actual: false, pass: false, detail: "", matchRange: null };

test("anchored failures explain literals present at the wrong input edge", () => {
  const rules = 'start\n"ABC"\n1 digit\n"XYZ"\nend';
  const compiled = compile(rules);
  const required = failureRequirements(rules, compiled.flags);
  for (const [input, key, literal] of [
    ["!ABC1XYZ", "The input must begin with {literal}.", "ABC"],
    ["ABC1XYZ!", "The input must end with {literal}.", "XYZ"],
  ]) {
    assert.equal(new RegExp(compiled.source, compiled.flags).exec(input), null);
    assert.deepEqual(explainMismatch(required, input, true, noMatch), {
      key,
      values: { literal },
    });
  }
});

const edgePatterns = [
  [/(?<tag>ABC)\dXYZ/u, "ABC", "XYZ"],
  [/(?:ab){2}\d!/u, "abab", "!"],
  [/(?:AB){2,}XYZ/u, "ABAB", "ABABXYZ"],
  [/(?:incoming\/foo|incoming\/bar)\dXYZ/u, "incoming/", "XYZ"],
  [/(?:😀A|😀B)Z?!/u, "😀", "!"],
  [/(?:😀|😁)!/u, undefined, "!"],
  [/X?A!/u, undefined, "A!"],
  [/(?:)*A!/u, "A!", "A!"],
  [/\d{0}A!/u, "A!", "A!"],
  [/(?=A)A\d!/u, "A", "!"],
  [/(?!B)A\d!/u, "A", "!"],
  [/\bA\dZ\b/u, "A", "Z"],
  [/(?<a>A)?\k<a>!/u, undefined, "!"],
  [/(?:A|)!/u, undefined, "!"],
  [/اردو\dالعربية/u, "اردو", "العربية"],
];

test("literal edge proofs preserve groups, alternatives, repetition and Unicode boundaries", () => {
  for (const [pattern, startLiteral, endLiteral] of edgePatterns) {
    const rules = `start\n${regexToRules(pattern).rules}\nend`;
    const required = failureRequirements(rules, "u");
    assert.equal(required.startLiteral, startLiteral, String(pattern));
    assert.equal(required.endLiteral, endLiteral, String(pattern));
    const folded = failureRequirements(rules, "iu");
    assert.equal(folded.startLiteral, undefined);
    assert.equal(folded.endLiteral, undefined);
  }
  const fixed = failureRequirements('start\neither {\n"A"\n"A"\n}\n"!"\nend', "u");
  assert.equal(fixed.startLiteral, "A!");
  assert.equal(fixed.endLiteral, "A!");
  const lines = failureRequirements('line start\n"A"\nline end', "mu");
  assert.equal(lines.startLiteral, undefined);
  assert.equal(lines.endLiteral, undefined);
  for (const [rules, input, startLiteral, endLiteral] of [
    ['line start\n"A"\nend', "before\nA", undefined, "A"],
    ['start\n"A"\nline end', "A\nafter", "A", undefined],
    ['"A"', "beforeAafter", undefined, undefined],
  ]) {
    const compiled = compile(rules, { flags: "mu" });
    assert(new RegExp(compiled.source, compiled.flags).exec(input));
    const required = failureRequirements(rules, compiled.flags);
    assert.equal(required.startLiteral, startLiteral);
    assert.equal(required.endLiteral, endLiteral);
  }
  const huge = `${"1000 group {\n".repeat(12)}"A"\n${"}\n".repeat(12)}`;
  const bounded = failureRequirements(`start\n"edge"\n${huge}"tail"\nend`, "u");
  assert.equal(bounded.minimum, 2049);
  assert.equal(bounded.startLiteral, "edge");
  assert.equal(bounded.endLiteral, "tail");
});

test("all 128 flag combinations retain necessary edges for native successful matches", () => {
  const examples = [
    "ABC1XYZ",
    "abc1xyz",
    "abab1!",
    "ABABXYZ",
    "ABABABXYZ",
    "incoming/foo1XYZ",
    "incoming/bar2XYZ",
    "😀A!",
    "😀BZ!",
    "😀!",
    "😁!",
    "A!",
    "XA!",
    "A1!",
    "A1Z",
    "!",
    "AA!",
    "اردو1العربية",
    "e\u0301",
    "\r",
    "\n",
    "\u2028",
    "\u2029",
  ];
  const corpus = [
    ...new Set(["", ...examples.flatMap((s) => [s, `!${s}`, `${s}!`, `\n${s}`, `${s}\n`])]),
  ];
  let matches = 0;
  for (const [pattern] of edgePatterns) {
    const rules = `start\n${regexToRules(pattern).rules}\nend`;
    for (const flags of flagSets) {
      const compiled = compile(rules, { flags });
      const required = failureRequirements(rules, compiled.flags);
      const native = new RegExp(compiled.source, compiled.flags);
      for (const input of corpus) {
        native.lastIndex = 0;
        if (!native.exec(input)) continue;
        matches++;
        assert(input.length >= required.minimum);
        for (const literal of required.literals) assert(input.includes(literal), literal);
        if (required.startLiteral) assert(input.startsWith(required.startLiteral));
        if (required.endLiteral) assert(input.endsWith(required.endLiteral));
      }
    }
  }
  assert(matches > 1000);
});

test("necessary conditions respect optional branches, assertions, strings and case folding", () => {
  for (const [regex, minimum, literals] of [
    [/^(?:incoming\/)?widget_\d{8}$/u, 15, ["widget_"]],
    [/^(?:cat|dog)$/u, 3, []],
    [/(?<=prefix)A(?=suffix)/u, 1, ["prefix", "A", "suffix"]],
    [/(?!forbidden)A/u, 1, ["A"]],
    [/(?<empty>)(?:A){0}\1/u, 0, []],
    [/😀a/iu, 0, []],
    [/[\q{|ab}]/v, 0, []],
    [/\p{RGI_Emoji}/v, 0, []],
  ]) {
    const translated = regexToRules(regex);
    assert.deepEqual(failureRequirements(translated.rules, translated.flags), {
      minimum,
      literals,
    });
  }
  const huge = `${"at least 1000 group {\n".repeat(12)}"A"\n${"}\n".repeat(12)}`;
  assert.equal(failureRequirements(huge, "u").minimum, 2049);
});

test("proofs agree with native matches across the library and a small Unicode corpus", () => {
  const recipes = JSON.parse(
    readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
  );
  const patterns = [
    /(?:a|ab)+/u,
    /(?:(?:a)?b){1,3}/u,
    /(?<a>a)?\k<a>b/u,
    /(?<=a)b(?=a)/u,
    /a(?!b)/u,
    /a(?=b)|c(?=d)/u,
    /^(?:😀|a){2,4}$/u,
    /[\q{|a|😀}]+/v,
    /[[\q{a|ab}]&&[\q{a|ab}]]/v,
    /[[\q{a|ab}]--[\q{ab}]]/v,
    /[\q{|ab}]/iv,
    /\p{Basic_Emoji}/v,
    /(?:A|ſ)\w/iu,
    /^a$/mu,
    /./su,
  ].map((regex) => regexToRules(regex));
  let corpus = [""];
  for (let i = 0, batch = [""]; i < 4; i++) {
    batch = batch.flatMap((prefix) => ["a", "b", "c", "d", "\n", "😀"].map((c) => prefix + c));
    corpus = corpus.concat(batch);
  }
  let matches = 0;
  for (const item of [...patterns, ...recipes]) {
    const compiled = compile(item.rules, { flags: item.flags });
    const required = failureRequirements(item.rules, compiled.flags);
    for (const input of [...corpus, ...(item.positive ?? []), ...(item.negative ?? [])]) {
      const match = new RegExp(compiled.source, compiled.flags).exec(input);
      if (!match) continue;
      matches++;
      assert.ok(
        match[0].length >= required.minimum,
        `${compiled.source}: ${JSON.stringify(input)}`,
      );
      for (const literal of required.literals) assert.ok(input.includes(literal), literal);
    }
  }
  assert.ok(matches > 1000);
});

test("failure reasons preserve native ranges, distinguish expectations and admit unknown steps", () => {
  const required = failureRequirements('"widget_"\n8 digits', "u");
  const short = explainMismatch(required, "x", true, noMatch);
  assert.equal(short.values.minimum, 15);
  const missing = explainMismatch(required, "123456789012345", true, noMatch);
  assert.equal(missing.values.literal, "widget_");
  const unknown = explainMismatch(required, "widget_notdigits", true, noMatch);
  assert.equal(
    unknown.key,
    "The native engine found no match. A precise failing step is unavailable.",
  );
  assert.equal(explainMismatch(required, "", false, { ...noMatch, pass: true }), null);
  const partial = explainMismatch(required, "😀widget_12345678!", true, {
    ...noMatch,
    matchRange: { start: 2, end: 17 },
  });
  assert.deepEqual(partial.values, { start: 2, end: 17, length: 18 });
  const unexpected = explainMismatch(required, "widget_12345678", false, {
    ...noMatch,
    actual: true,
    matchRange: { start: 0, end: 15 },
  });
  for (const reason of [short, missing, unknown, partial, unexpected])
    assert.ok(Object.hasOwn(translations, reason.key), reason.key);
});
