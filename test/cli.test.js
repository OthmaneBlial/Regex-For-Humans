import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { LIMITS } from "../src/parser.js";

const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
const scenarios = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

function run(args, input) {
  return spawnSync(process.execPath, [cli, ...args], { input, encoding: "utf8" });
}

test("CLI accepts stdin and prints the same result as the library", () => {
  for (const scenario of scenarios) {
    const result = run(["--json", "-"], scenario.rules);
    assert.equal(result.status, 0, `${scenario.id}: ${result.stderr}`);
    const compiled = JSON.parse(result.stdout);
    assert.equal(compiled.source, scenario.source, scenario.id);
    assert.equal(compiled.flags, scenario.flags, scenario.id);
    assert.ok(compiled.segments.length >= 3, scenario.id);
  }
});

test("CLI accepts a file and prints a copyable JavaScript literal", () => {
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  const path = join(directory, "rules.txt");
  try {
    writeFileSync(path, scenarios[2].rules);
    const result = run([path]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "/^.*\\d{3}$/mu\n");
  } finally {
    unlinkSync(path);
    rmdirSync(directory);
  }
});

test("CLI keeps file read failures as JSON in machine mode", () => {
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  try {
    const result = run(["--json", join(directory, "missing.txt")]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    const error = JSON.parse(result.stderr).error;
    assert.equal(error.code, "CLI_ERROR");
    assert.match(error.message, /ENOENT/u);
    assert.equal("line" in error, false);
  } finally {
    rmdirSync(directory);
  }
});

test("CLI accepts a leading-dash filename after --", () => {
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  try {
    writeFileSync(join(directory, "-rules.txt"), scenarios[0].rules);
    const result = spawnSync(process.execPath, [cli, "--", "-rules.txt"], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "/^ABC\\d{3}$/u\n");
  } finally {
    unlinkSync(join(directory, "-rules.txt"));
    rmdirSync(directory);
  }
});

test("CLI exposes flags, help and version", () => {
  const result = run(["--ignore-case", "--dot-all", "-"], "any character");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "/./isu\n");
  assert.match(run(["--help"]).stdout, /Usage: regex-for-humans/u);
  assert.match(run(["--help"]).stdout, /--\s+Treat the following argument as the input path/u);
  assert.match(run(["--version"]).stdout, /^0\.1\.0-dev\n$/u);
  const explained = run(["--explain", "-"], "digit character");
  assert.equal(explained.status, 0, explained.stderr);
  assert.match(explained.stdout, /1:1 {2}\\d {2}One ASCII digit/u);
});

test("CLI reports an unknown rule with position and nonzero status", () => {
  const result = run(["-"], "digit character\n  unexpected words");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Line 2, column 3/u);
  const duplicate = run(["-"], "digit character 2 times 3 times");
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /Line 1, column 25: Use only one repetition/u);
  const prefixedDuplicate = run(["-"], "2 times for 3 digits");
  assert.equal(prefixedDuplicate.status, 1);
  assert.match(prefixedDuplicate.stderr, /Line 1, column 13: Use only one repetition/u);
  const duplicateJson = run(["--json", "-"], "3 digits 4 times");
  assert.equal(JSON.parse(duplicateJson.stderr).error.column, 10);
  const structured = run(["--json", "-"], "unexpected words");
  assert.equal(structured.status, 1);
  assert.equal(JSON.parse(structured.stderr).error.code, "UNKNOWN_RULE");
  const malformedQuote = run(["-"], String.raw`a "bad\q"`);
  assert.equal(malformedQuote.status, 1);
  assert.match(malformedQuote.stderr, /Line 1, column 7: Invalid JSON escape/u);
  const malformedQuoteJson = run(["--json", "-"], String.raw`a "bad\q"`);
  assert.equal(JSON.parse(malformedQuoteJson.stderr).error.column, 7);
  const trailingLiteral = run(["--json", "-"], '  start, a "A"  extra');
  assert.equal(JSON.parse(trailingLiteral.stderr).error.column, 17);
  assert.equal(run(["--bogus"]).status, 2);
});

test("CLI enforces the source limit while reading stdin and files", () => {
  const withinLimit = `a "${"😀".repeat((LIMITS.sourceLength - 4) / 2)}"`;
  assert.equal(withinLimit.length, LIMITS.sourceLength);
  assert.equal(run(["-"], withinLimit).status, 0);

  const input = `${withinLimit}x`;
  const stdinResult = run(["-"], input);
  assert.equal(stdinResult.status, 1);
  assert.match(stdinResult.stderr, /Rules cannot exceed 16384 UTF-16 code units/u);
  const multilineOverflow = `${"x".repeat(LIMITS.sourceLength - 5)}\nabcdef`;
  const located = run(["-"], multilineOverflow);
  assert.equal(located.status, 1);
  assert.match(located.stderr, /Line 2, column 5: Rules cannot exceed/u);

  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  const path = join(directory, "rules.txt");
  try {
    writeFileSync(path, input);
    const fileResult = run([path]);
    assert.equal(fileResult.status, 1);
    assert.match(fileResult.stderr, /Rules cannot exceed 16384 UTF-16 code units/u);
  } finally {
    unlinkSync(path);
    rmdirSync(directory);
  }
});
