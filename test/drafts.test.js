import assert from "node:assert/strict";
import test from "node:test";
import {
  draftStorageKey,
  fixtureLimit,
  fixtureStorageKey,
  parseDraft,
  parseFixture,
} from "../web/fixtures.js";
import { flagSets } from "./fixtures/advanced-flags-corpus.js";

const draft = {
  format: "regex-for-humans-draft",
  version: 1,
  rules: 'capture "unfinished" {',
  flags: "dgu",
  mode: "search",
  reverseRegex: "/(?<unfinished>",
  example: "date-captures",
  cases: [{ text: "العربية اردو 😀\r\n\ud800", expected: true, expectation: '{"captures":' }],
};

test("drafts preserve incomplete source, raw expectation text, Unicode and every flag set", () => {
  for (const flags of flagSets) {
    const value = { ...draft, flags };
    assert.deepEqual(parseDraft(JSON.stringify(value)), value);
  }
  const oversizedFields = {
    ...draft,
    rules: "x".repeat(16385),
    cases: [{ text: "x".repeat(2049), expected: false, expectation: "x".repeat(8193) }],
  };
  assert.deepEqual(parseDraft(JSON.stringify(oversizedFields)), oversizedFields);
  assert.deepEqual(parseDraft(JSON.stringify({ ...draft, example: null, cases: [] })), {
    ...draft,
    example: null,
    cases: [],
  });
  assert.notEqual(draftStorageKey, fixtureStorageKey);
  assert.throws(() => parseFixture(JSON.stringify(draft)));
});

test("draft validation rejects incompatible or corrupt storage before application", () => {
  for (const changes of [
    { format: "regex-for-humans-tests" },
    { version: 2 },
    { rules: null },
    { flags: "uv" },
    { flags: "uu" },
    { flags: "x" },
    { mode: "unknown" },
    { reverseRegex: 42 },
    { example: [] },
    { cases: {} },
    { extra: true },
    { cases: Array(101).fill(draft.cases[0]) },
    ...[{ text: null }, { expected: "true" }, { expectation: {} }, { expect: {} }].map(
      (change) => ({ cases: [{ ...draft.cases[0], ...change }] }),
    ),
  ])
    assert.throws(() => parseDraft(JSON.stringify({ ...draft, ...changes })), TypeError);
  for (const text of ["", "null", "[]", "{}", "{"]) assert.throws(() => parseDraft(text));
});

test("draft storage has an exact shared size bound without truncating editable text", () => {
  const base = JSON.stringify(draft).length;
  const exact = { ...draft, reverseRegex: draft.reverseRegex + "a".repeat(fixtureLimit - base) };
  const text = JSON.stringify(exact);
  assert.equal(text.length, fixtureLimit);
  assert.deepEqual(parseDraft(text), exact);
  assert.throws(() => parseDraft(`${text} `), RangeError);
});
