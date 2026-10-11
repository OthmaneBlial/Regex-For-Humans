import assert from "node:assert/strict";
import test from "node:test";
import { fixtureLimit, parseFixture } from "../web/fixtures.js";

const fixture = {
  format: "regex-for-humans-tests",
  version: 1,
  rules: 'capture "letter" {\n  "A"\n}',
  flags: "dgu",
  mode: "search",
  cases: [
    {
      text: "😀A\r\nA",
      expected: true,
      expect: {
        spans: [
          [2, 3],
          [5, 6],
        ],
        captures: [["A"], ["A"]],
        replacement: { template: "$1!", result: "😀A!\r\nA!" },
      },
    },
    { text: "", expected: false },
  ],
};

test("versioned regression fixtures round-trip exact strings and optional expectations", () => {
  assert.deepEqual(parseFixture(JSON.stringify(fixture)), fixture);
  const parsed = parseFixture(JSON.stringify(fixture));
  parsed.cases[0].expect.captures[0][0] = "changed";
  assert.equal(fixture.cases[0].expect.captures[0][0], "A");
  for (const flags of ["u", "v", "dgimsuy", "dgimsvy"])
    assert.equal(parseFixture(JSON.stringify({ ...fixture, flags })).flags, flags);
  assert.equal(
    parseFixture(JSON.stringify({ ...fixture, rules: "invalid editable rule" })).rules,
    "invalid editable rule",
  );
  assert.equal(parseFixture(JSON.stringify({ ...fixture, cases: [] })).cases.length, 0);
});

test("fixture trust boundary rejects oversized, unknown and malformed data atomically", () => {
  for (const change of [
    { version: 2 },
    { format: "other" },
    { rules: "a".repeat(16385) },
    { flags: "guv" },
    { flags: "ygdu" },
    { flags: "g" },
    { flags: "uu" },
    { mode: "partial" },
    { cases: Array(101).fill(fixture.cases[1]) },
    { cases: [{ text: "a".repeat(2049), expected: true }] },
    { cases: [{ text: "a", expected: "true" }] },
    { cases: [{ text: "a", expected: true, id: 1 }] },
    { cases: [{ text: "a", expected: true, expect: { spans: [[1, 0]] } }] },
    { cases: [{ text: "a", expected: true, expect: { captures: [[42]] } }] },
    { extra: "unknown" },
    { cases: [null] },
    { cases: {} },
  ])
    assert.throws(() => parseFixture(JSON.stringify({ ...fixture, ...change })));
  assert.throws(() => parseFixture('{"__proto__":{},"format":"regex-for-humans-tests"}'));
  assert.throws(() => parseFixture(" ".repeat(fixtureLimit + 1)), /4 MiB/u);
  assert.throws(() => parseFixture("{"), SyntaxError);
  assert.deepEqual(parseFixture(JSON.stringify(fixture)), fixture);
});
