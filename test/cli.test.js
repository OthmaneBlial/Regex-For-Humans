import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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

test("CLI exposes flags, help and version", () => {
  const result = run(["--ignore-case", "--dot-all", "-"], "any character");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "/./isu\n");
  assert.match(run(["--help"]).stdout, /Usage: regex-for-humans/u);
  assert.match(run(["--version"]).stdout, /^0\.1\.0-dev\n$/u);
  const explained = run(["--explain", "-"], "digit character");
  assert.equal(explained.status, 0, explained.stderr);
  assert.match(explained.stdout, /1:1 {2}\\d {2}One ASCII digit/u);
});

test("CLI reports an unknown rule with position and nonzero status", () => {
  const result = run(["-"], "digit character\n  unexpected words");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Line 2, column 3/u);
  const structured = run(["--json", "-"], "unexpected words");
  assert.equal(structured.status, 1);
  assert.equal(JSON.parse(structured.stderr).error.code, "UNKNOWN_RULE");
  assert.equal(run(["--bogus"]).status, 2);
});
