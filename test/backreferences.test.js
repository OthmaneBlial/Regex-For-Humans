import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, toRegExp } from "../index.js";

test("named and numbered references match captured text with native case and Unicode semantics", () => {
  for (const reference of ['"word"', "1", "01"]) {
    const rules = `start\ncapture "word" {\none or more any character\n}\n" "\nsame as capture ${reference}\nend`;
    const result = compile(rules);
    const segment = result.segments.find((s) => s.kind === "backreference");
    assert.equal(segment.captureIndex, 1);
    assert.match(segment.explanation, /Same text as capture #1/u);
    assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
    for (const flags of ["", "i", "s", "is"]) {
      const actual = toRegExp(compile(rules, { flags }));
      const expected = new RegExp(String.raw`^(?<word>.+) \k<word>$`, `${flags}u`);
      for (const value of [
        "cat cat",
        "cat dog",
        "CAT cat",
        "😀 😀",
        "é é",
        "é é",
        "a\nb a\nb",
        " ",
        "",
      ]) {
        assert.deepEqual(
          actual.exec(value),
          expected.exec(value),
          `${flags} ${reference} ${value}`,
        );
      }
    }
  }
});

test("numeric references remain separate from following digits including capture #10", () => {
  for (const count of [1, 10]) {
    const rules = `start\n${'capture {\n"A"\n}\n'.repeat(count)}same as capture ${count}\n"2"\nend`;
    const expression = toRegExp(compile(rules));
    assert.equal(expression.test(`${"A".repeat(count + 1)}2`), true);
    assert.equal(expression.test(`${"A".repeat(count)}2`), false);
    assert.ok(expression.source.includes(`(?:\\${count})2`));
  }
});

test("references inside later nested groups use opening order and final capture values", () => {
  const rules =
    'start\ncapture "outer" {\n2 capture "last" {\ndigit\n}\n}\ngroup {\nsame as capture 2\nsame as capture "outer"\n}\nend';
  const result = compile(rules);
  assert.equal(toRegExp(result).test("12212"), true);
  assert.equal(toRegExp(result).test("12112"), false);
  assert.deepEqual(
    result.segments.filter((s) => s.kind === "backreference").map((s) => s.captureIndex),
    [2, 1],
  );
  assert.equal(
    toRegExp(compile('start\noptional capture "a" {\n"A"\n}\nsame as capture "a"\nend')).test(""),
    true,
  );
  assert.equal(
    toRegExp(compile('start\ncapture "a" {\n}\n2 same as capture "a"\nend')).test(""),
    true,
  );
  assert.equal(
    toRegExp(compile('start\ncapture "année" {\n"é"\n}\nsame as capture "année"\nend')).test("éé"),
    true,
  );
});

test("missing, forward, open and malformed references have precise diagnostics", () => {
  for (const [rules, code, line, column] of [
    ['same as capture "missing"', "MISSING_CAPTURE_REFERENCE", 1, 17],
    ["optional same as capture 2", "MISSING_CAPTURE_REFERENCE", 1, 26],
    ["same as capture 1\ncapture {\n}", "FORWARD_CAPTURE_REFERENCE", 1, 17],
    ['same as capture "future"\ncapture "future" {\n}', "FORWARD_CAPTURE_REFERENCE", 1, 17],
    ['capture "a" {\n  same as capture "a"\n}', "SELF_CAPTURE_REFERENCE", 2, 19],
    ["capture {\ncapture {\nsame as capture 1\n}\n}", "SELF_CAPTURE_REFERENCE", 3, 17],
    ["same as capture", "INVALID_CAPTURE_REFERENCE", 1, 16],
    ["same as capture 0", "INVALID_CAPTURE_REFERENCE", 1, 17],
    ["same as capture -1", "INVALID_CAPTURE_REFERENCE", 1, 17],
    ['same as capture "a" extra', "INVALID_CAPTURE_REFERENCE", 1, 17],
  ])
    assert.throws(() => compile(rules), { code, line, column }, rules);
});

test("CLI exposes the shared reference compiler and positioned JSON diagnostics", () => {
  const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
  const rules = 'capture "word" {\nletters\n}\nspace\nsame as capture "word"';
  const output = spawnSync(process.execPath, [cli, "--json", "-"], {
    input: rules,
    encoding: "utf8",
  });
  assert.equal(output.status, 0, output.stderr);
  assert.deepEqual(JSON.parse(output.stdout), compile(rules));
  const invalid = spawnSync(process.execPath, [cli, "--json", "-"], {
    input: "same as capture 1",
    encoding: "utf8",
  });
  assert.notEqual(invalid.status, 0);
  assert.equal(JSON.parse(invalid.stderr).error.code, "MISSING_CAPTURE_REFERENCE");
});
