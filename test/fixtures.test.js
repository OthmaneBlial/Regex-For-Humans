import assert from "node:assert/strict";
import test from "node:test";
import {
  createFixtureLink,
  fixtureLimit,
  parseFixture,
  readFixtureLink,
  shareLinkLimit,
} from "../web/fixtures.js";
import { flagSets } from "./fixtures/advanced-flags-corpus.js";

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

const fragment = (value) => `#tests=${Buffer.from(JSON.stringify(value)).toString("base64url")}`;

test("share links contain a validated fixture snapshot and omit unrelated URL data", () => {
  const href =
    "https://user:password@example.test/Regex-For-Humans/workshop/?example=old&token=private#old";
  const link = new URL(createFixtureLink(JSON.stringify(fixture, null, 2), href));
  assert.equal(link.origin, "https://example.test");
  assert.equal(link.pathname, "/Regex-For-Humans/workshop/");
  assert.equal(link.username, "");
  assert.equal(link.password, "");
  assert.equal(link.search, "");
  assert.equal(link.hash, fragment(fixture));
  assert.deepEqual(readFixtureLink(link.hash), fixture);
  assert.equal(createFixtureLink(JSON.stringify(fixture), href), link.href);
  for (const base of [
    "file:///tmp/workshop",
    "javascript:alert(1)",
    "data:text/html,x",
    "relative",
  ])
    assert.throws(() => createFixtureLink(JSON.stringify(fixture), base));
});

test("shared fixtures retain Unicode, exact line endings, captures and every flag set", () => {
  for (const flags of flagSets) {
    const value = {
      ...fixture,
      rules: 'invalid editable rule العربية اردو 😀 "<img>{line}"',
      flags,
      cases: [
        ...fixture.cases,
        {
          text: "العربية اردو 😀 e\u0301\r\n\r\u2028\u2029\u0000\ud800\udc00\ud800",
          expected: false,
        },
        { text: "", expected: true, expect: { captures: [[null, ""]], spans: [[0, 0]] } },
      ],
    };
    const link = new URL(createFixtureLink(JSON.stringify(value), "http://localhost:4175/"));
    assert.deepEqual(readFixtureLink(link.hash), value);
    assert.equal(link.hash, fragment(parseFixture(JSON.stringify(value))));
  }
});

test("share-link limits reject oversized snapshots and URLs without truncating valid data", () => {
  const text = JSON.stringify(fixture);
  const short = createFixtureLink(text, "https://example.test/");
  const extra = shareLinkLimit - short.length;
  const exact = createFixtureLink(text, `https://example.test/${"a".repeat(extra)}`);
  assert.equal(exact.length, shareLinkLimit);
  assert.deepEqual(readFixtureLink(new URL(exact).hash), fixture);
  assert.throws(
    () => createFixtureLink(text, `https://example.test/${"a".repeat(extra + 1)}`),
    /Export JSON/u,
  );
  const large = {
    ...fixture,
    cases: Array(100).fill({ text: "😀".repeat(1024), expected: false }),
  };
  assert.deepEqual(parseFixture(JSON.stringify(large)), large);
  assert.throws(
    () => createFixtureLink(JSON.stringify(large), "https://example.test/"),
    /Export JSON/u,
  );
  assert.throws(() => readFixtureLink(`#tests=${"A".repeat(shareLinkLimit)}`), /Export JSON/u);
  assert.deepEqual(readFixtureLink(fragment(fixture)), fixture);
});

test("untrusted share fragments reject invalid encoding and fixtures before application", () => {
  for (const hash of ["", "#intro", "#other=value"]) assert.equal(readFixtureLink(hash), null);
  for (const hash of [
    "#tests=",
    "#tests=A",
    "#tests=YWJj=",
    "#tests=%41",
    "#tests=+abc",
    "#tests=/abc",
    "#tests=_w",
    "#tests=wIA",
    "#tests=ew",
    fragment(null),
    fragment([]),
    fragment({ ...fixture, version: 2 }),
    fragment({ ...fixture, flags: "guv" }),
    fragment({ ...fixture, extra: "unknown" }),
    fragment({ ...fixture, cases: [{ text: "A", expected: true, expect: { captures: [[42]] } }] }),
  ])
    assert.throws(() => readFixtureLink(hash), hash);
  assert.throws(() =>
    createFixtureLink(JSON.stringify({ ...fixture, version: 2 }), "https://example.test/"),
  );
  assert.deepEqual(readFixtureLink(fragment(fixture)), fixture);
});

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
