import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, regexToRules } from "../index.js";
import { explainMismatch, failureRequirements } from "../web/failure-reasons.js";
import { translations } from "../web/translations.js";

const noMatch = { id: 1, actual: false, pass: false, detail: "", matchRange: null };

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
