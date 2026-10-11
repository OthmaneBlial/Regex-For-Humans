import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, regexToRules } from "../index.js";
import { explanationNotes } from "../web/explanation-notes.js";
import { translations } from "../web/translations.js";

test("explanation levels retain canonical compiler output and localize every structural note", () => {
  const recipes = JSON.parse(
    readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
  );
  const extra = [
    /^(?<=A)(?<x>😀)?\k<x>(?!B)\b$/u,
    /[\q{ab|cd}]/v,
    /\p{RGI_Emoji}/v,
    /(?:a|b)+?/u,
    /\B/u,
  ].map(regexToRules);
  const kinds = new Set();
  for (const recipe of [...recipes, ...extra]) {
    const result = compile(recipe.rules, { flags: recipe.flags });
    const before = JSON.stringify(result);
    for (const segment of result.segments) {
      kinds.add(segment.kind);
      assert.deepEqual(explanationNotes(segment, "intermediate"), []);
      for (const mode of ["beginner", "expert"]) {
        const notes = explanationNotes(segment, mode);
        assert.ok(notes.length);
        for (const note of notes) assert.ok(Object.hasOwn(translations, note.key), note.key);
        if (mode === "expert") {
          const range = notes[0].values;
          assert.equal(result.source.slice(range.start, range.end), segment.source);
          assert.equal(range.line, segment.line);
          assert.equal(range.column, segment.column);
        }
      }
    }
    assert.equal(JSON.stringify(result), before);
  }
  assert.deepEqual([...kinds].sort(), [
    "alternation",
    "anchor",
    "assertion",
    "atom",
    "backreference",
    "boundary",
    "group",
  ]);
});

test("expert capture and reference metadata retain native numbering and verbatim Unicode names", () => {
  const original = /^(?<اسم>😀)(?<empty>)(B)?\k<اسم>$/du;
  const translated = regexToRules(original);
  const result = compile(translated.rules, { flags: translated.flags });
  const match = new RegExp(result.source, result.flags).exec("😀😀");
  assert.deepEqual(match.slice(1), ["😀", "", undefined]);
  const captures = result.segments.filter(
    (segment) => segment.kind === "group" && segment.edge === "start" && segment.capturing,
  );
  assert.deepEqual(
    captures.map((segment) => explanationNotes(segment, "expert")[1].values),
    [
      { index: 1, name: '"اسم"' },
      { index: 2, name: '"empty"' },
      { index: 3, name: "—" },
    ],
  );
  const reference = result.segments.find((segment) => segment.kind === "backreference");
  assert.equal(explanationNotes(reference, "expert")[1].values.index, 1);
});
