import assert from "node:assert/strict";
import test from "node:test";
import { compile, toRegExp } from "../index.js";
import { CompileError } from "../src/diagnostics.js";
import { fixtureLimit, parseFixture } from "../web/fixtures.js";
import { createMarkdownReport } from "../web/markdown-report.js";

const fixture = {
  format: "regex-for-humans-tests",
  version: 1,
  rules: 'capture "letter" {\n  "A"\n}\ncapture "empty" {\n}\noptional capture "bee" {\n  "B"\n}',
  flags: "dgu",
  mode: "search",
  cases: [
    {
      text: "😀AB\r\nA",
      expected: true,
      expect: {
        spans: [
          [2, 4],
          [6, 7],
        ],
        captures: [
          ["A", "", "B"],
          ["A", "", null],
        ],
        replacement: { template: "$<letter>$2$3!", result: "😀AB!\r\nA!" },
      },
    },
    { text: "Z", expected: false },
  ],
};

// Inspect complete code blocks independently of the report's section labels.
const codeBlocks = (report) => [...report.matchAll(/^(`{3,})([a-z]+)\n([\s\S]*?)\n\1(?=\n|$)/gm)];

test("Markdown retains the exact regex and reimportable native capture/span/replacement expectations", () => {
  const text = JSON.stringify(fixture);
  const report = createMarkdownReport(text, "DEV · 0.1.0-dev.11");
  const blocks = codeBlocks(report);
  assert.equal(blocks[0][3], "DEV · 0.1.0-dev.11");
  assert.equal(blocks[1][3], fixture.rules);
  const compiled = compile(fixture.rules, { flags: fixture.flags });
  assert.equal(blocks[2][3], `/${compiled.source}/${compiled.flags}`);
  assert.deepEqual(parseFixture(blocks.at(-1)[3]), fixture);
  assert.equal(JSON.parse(blocks[3][3]), fixture.cases[0].text);
  assert.deepEqual(JSON.parse(blocks[4][3]), fixture.cases[0].expect);
  const native = toRegExp(compiled);
  const matches = [...fixture.cases[0].text.matchAll(native)];
  assert.deepEqual(
    matches.map((match) => match.indices[0]),
    fixture.cases[0].expect.spans,
  );
  assert.deepEqual(
    matches.map((match) => match.slice(1).map((value) => value ?? null)),
    fixture.cases[0].expect.captures,
  );
  assert.equal(
    fixture.cases[0].text.replace(native, fixture.cases[0].expect.replacement.template),
    fixture.cases[0].expect.replacement.result,
  );
  assert.match(report, /Match mode: `search`/u);
  assert.match(report, /does not run the tests or certify that they pass/u);
  assert.match(report, /Case 2: must not match/u);
});

test("user Markdown/HTML and arbitrary backtick runs stay fenced while JSON exposes controls losslessly", () => {
  const sample =
    "😀\r\n\t\u0000\u202e字\u2028\u2029\n``````\n# owned\n<img src=x onerror=alert(1)>";
  const data = {
    ...fixture,
    rules: '# ````````````\n"A"',
    cases: [{ text: sample, expected: false, expect: { captures: [[sample, "", null]] } }],
  };
  const build = "DEV\n```\n# owned\n<script>alert(1)</script>";
  const report = createMarkdownReport(JSON.stringify(data), build);
  const blocks = codeBlocks(report);
  assert.equal(blocks.length, 6);
  assert.equal(blocks[0][3], build);
  assert.equal(blocks[1][3], data.rules);
  assert.equal(blocks[1][1].length, 13);
  assert.equal(JSON.parse(blocks[3][3]), sample);
  assert.deepEqual(JSON.parse(blocks[4][3]), data.cases[0].expect);
  assert.deepEqual(parseFixture(blocks.at(-1)[3]), data);
  assert(!report.replace(/^(`{3,})([a-z]+)\n([\s\S]*?)\n\1(?=\n|$)/gm, "").includes("# owned"));
  for (const block of [blocks[3], blocks[4], blocks.at(-1)]) {
    assert(!/[\p{Bidi_Control}\u2028\u2029]/u.test(block[3]));
    assert(!block[3].includes("\u0000"));
    assert(block[3].includes("\\u202e"));
  }
});

test("invalid source, expectations, schema and existing budgets cannot produce a misleading report", () => {
  for (const data of [
    { ...fixture, version: 2 },
    { ...fixture, flags: "uv" },
    { ...fixture, rules: "A".repeat(16385) },
    { ...fixture, cases: Array.from({ length: 101 }, () => ({ text: "A", expected: true })) },
    { ...fixture, cases: [{ text: "A".repeat(2049), expected: true }] },
    { ...fixture, cases: [{ text: "A", expected: true, expect: { spans: [[1, 0]] } }] },
  ])
    assert.throws(() => createMarkdownReport(JSON.stringify(data), "DEVELOPMENT BUILD"));
  assert.throws(() => createMarkdownReport(JSON.stringify(fixture), null), TypeError);
  assert.throws(() => createMarkdownReport("{", "DEVELOPMENT BUILD"), SyntaxError);
  assert.throws(
    () => createMarkdownReport(" ".repeat(fixtureLimit + 1), "DEVELOPMENT BUILD"),
    RangeError,
  );
  assert.throws(
    () =>
      createMarkdownReport(
        JSON.stringify({ ...fixture, rules: "same as capture 1" }),
        "DEVELOPMENT BUILD",
      ),
    CompileError,
  );
  assert.throws(
    () => createMarkdownReport(JSON.stringify({ ...fixture, rules: "" }), "DEVELOPMENT BUILD"),
    CompileError,
  );
});

test("all existing case slots and both match modes retain intended data without inventing results", () => {
  for (const mode of ["full", "search"]) {
    const data = {
      ...fixture,
      flags: "div",
      mode,
      cases: Array.from({ length: 100 }, (_, index) => ({
        text: `字${index}`,
        expected: index % 2 === 0,
      })),
    };
    const report = createMarkdownReport(JSON.stringify(data), "DEVELOPMENT BUILD");
    assert.equal([...report.matchAll(/^### Case /gm)].length, 100);
    assert.deepEqual(parseFixture(codeBlocks(report).at(-1)[3]), data);
    assert(!report.includes("✓"));
    assert.match(report, /Flags: `div`/u);
  }
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    const data = { ...fixture, rules: fixture.rules.replaceAll("\n", separator) };
    const report = createMarkdownReport(JSON.stringify(data), "DEVELOPMENT BUILD");
    assert.deepEqual(parseFixture(codeBlocks(report).at(-1)[3]), data);
    assert.equal(codeBlocks(report)[1][3], data.rules);
  }
  const report = createMarkdownReport(
    JSON.stringify({ ...fixture, cases: [] }),
    "DEVELOPMENT BUILD",
  );
  assert.match(report, /No test cases\./u);
  const full = {
    ...fixture,
    rules: '"A"',
    flags: "u",
    mode: "full",
    cases: [{ text: "BA", expected: false }],
  };
  const snapshot = createMarkdownReport(JSON.stringify(full), "DEVELOPMENT BUILD");
  assert.equal(toRegExp(compile(full.rules, { flags: full.flags })).test("BA"), true);
  assert(snapshot.includes("/A/u"));
  assert(snapshot.includes("Full mode requires a match covering the entire input."));
  assert.deepEqual(parseFixture(codeBlocks(snapshot).at(-1)[3]), full);
});
