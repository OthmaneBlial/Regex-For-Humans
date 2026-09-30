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

test("CLI preserves lone surrogate literals in its UTF-8 output", () => {
  for (const character of ["\ud800", "\udfff"]) {
    const input = `start\n${JSON.stringify(character)}\nend`;
    const result = run(["-"], input);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    assert.equal(result.stdout, `/^\\u{${character.charCodeAt(0).toString(16)}}$/u\n`);
    const json = JSON.parse(run(["--json", "-"], input).stdout);
    assert.equal(result.stdout.trim(), `/${json.source}/${json.flags}`);
    assert.equal(new RegExp(json.source, json.flags).test(character), true);
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
    writeFileSync(join(directory, "--json"), scenarios[0].rules);
    const result = spawnSync(process.execPath, [cli, "--", "-rules.txt"], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "/^ABC\\d{3}$/u\n");
    const jsonNamedFile = spawnSync(process.execPath, [cli, "--", "--json"], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(jsonNamedFile.status, 0, jsonNamedFile.stderr);
    assert.equal(jsonNamedFile.stdout, "/^ABC\\d{3}$/u\n");
  } finally {
    unlinkSync(join(directory, "-rules.txt"));
    unlinkSync(join(directory, "--json"));
    rmdirSync(directory);
  }
});

test("CLI exposes flags, help and version", () => {
  const result = run(["--ignore-case", "--dot-all", "-"], "any character");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "/./isu\n");
  const help = run(["--help"]).stdout;
  assert.match(help, /Usage: regex-for-humans/u);
  assert.match(
    help,
    /Compile controlled English into a JavaScript regex\.\nRead a file or stdin; use - for stdin\./u,
  );
  assert.match(help, /--\s+Treat the next argument as the input path/u);
  assert.match(run(["--version"]).stdout, /^0\.1\.0-dev\n$/u);
  const explained = run(["--explain", "-"], "digit");
  assert.equal(explained.status, 0, explained.stderr);
  assert.match(explained.stdout, /1:1 {2}\\d {2}One digit/u);
});

test("CLI reports an unknown rule with position and nonzero status", () => {
  const result = run(["-"], "digit\n  unexpected words");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Line 2, column 3/u);
  const duplicate = run(["-"], "3 4 digits");
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /Line 1, column 3: Put one exact count/u);
  const duplicateJson = run(["--json", "-"], "3 4 digits");
  assert.equal(JSON.parse(duplicateJson.stderr).error.column, 3);
  const countedAnchor = run(["--json", "-"], "3 start");
  assert.deepEqual(JSON.parse(countedAnchor.stderr).error, {
    code: "ANCHOR_REPETITION",
    message: "Counts apply to items, not anchors.",
    line: 1,
    column: 3,
    hint: "Remove the count or apply it to an item, such as `3 digits`.",
  });
  const structured = run(["--json", "-"], "unexpected words");
  assert.equal(structured.status, 1);
  assert.equal(JSON.parse(structured.stderr).error.code, "UNKNOWN_RULE");
  const misleading = run(["-"], "alphanumeric character");
  assert.equal(misleading.status, 1);
  assert.match(misleading.stderr, /Unsupported rule: "alphanumeric character"/u);
  const article = run(["-"], "a digit");
  assert.equal(article.status, 1);
  assert.match(article.stderr, /Unsupported rule: "a digit"/u);
  const malformedQuote = run(["-"], String.raw`"bad\q"`);
  assert.equal(malformedQuote.status, 1);
  assert.match(malformedQuote.stderr, /Line 1, column 5: Invalid JSON escape/u);
  const malformedQuoteJson = run(["--json", "-"], String.raw`"bad\q"`);
  assert.equal(JSON.parse(malformedQuoteJson.stderr).error.column, 5);
  const trailingInput = '  start, "A"  extra';
  const trailingLiteral = run(["--json", "-"], trailingInput);
  assert.equal(JSON.parse(trailingLiteral.stderr).error.column, trailingInput.indexOf("extra") + 1);
  const countedTrailing = run(["--json", "-"], '3 "A"  extra');
  assert.equal(JSON.parse(countedTrailing.stderr).error.column, 8);
  assert.equal(run(["--bogus"]).status, 2);
});

test("CLI reports usage errors as JSON when requested in any option position", () => {
  for (const args of [
    ["--json", "--bogus"],
    ["--bogus", "--json"],
    ["--json", "first.txt", "second.txt"],
  ]) {
    const result = run(args, "");
    assert.equal(result.status, 2, args.join(" "));
    assert.equal(result.stdout, "", args.join(" "));
    assert.deepEqual(JSON.parse(result.stderr), {
      error: {
        code: "CLI_USAGE",
        message: args.includes("--bogus")
          ? "Unknown option: --bogus"
          : "Only one input file is allowed.",
      },
    });
  }
});

test("CLI flushes large diagnostics before exiting", () => {
  const input = "\0".repeat(16_000);
  const message = `Unsupported rule: ${JSON.stringify(input)}.`;
  const hint = "Try `line start`, `any text` or `3 digits`.";
  const structured = run(["--json", "-"], input);
  assert.equal(structured.status, 1);
  assert.equal(structured.stdout, "");
  assert.deepEqual(JSON.parse(structured.stderr), {
    error: { code: "UNKNOWN_RULE", message, line: 1, column: 1, hint },
  });
  const plain = run(["-"], input);
  assert.equal(plain.status, 1);
  assert.equal(plain.stdout, "");
  assert.equal(plain.stderr, `Line 1, column 1: ${message}\n${hint}\n`);

  const option = `--${"\u0001".repeat(16_000)}`;
  const usage = run(["--json", option], "");
  assert.equal(usage.status, 2);
  assert.equal(usage.stdout, "");
  assert.deepEqual(JSON.parse(usage.stderr), {
    error: { code: "CLI_USAGE", message: `Unknown option: ${option}` },
  });
});

test("CLI enforces the source limit while reading stdin and files", () => {
  const lineLimit = run(["-"], "\n".repeat(LIMITS.lines + 1));
  assert.equal(lineLimit.status, 1);
  assert.match(lineLimit.stderr, /Line 201, column 1: Input cannot exceed 200 lines\./u);

  const withinLimit = `"${"😀".repeat((LIMITS.sourceLength - 2) / 2)}"`;
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
