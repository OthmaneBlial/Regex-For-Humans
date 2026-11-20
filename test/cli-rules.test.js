import assert from "node:assert/strict";
import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { LIMITS } from "../src/parser.js";
import { run } from "./helpers/cli.js";

test("CLI explains zero-or-more positive and negative lists in text and JSON", () => {
  for (const flags of [[], ["--ignore-case"], ["--dot-all"], ["--ignore-case", "--dot-all"]]) {
    const note = flags.includes("--ignore-case") ? ", ignoring case (i)" : "";
    for (const excluded of [false, true]) {
      const rules = `start\nzero or more ${excluded ? "none" : "one"} of: a, b\nend`;
      const atom = `[${excluded ? "^" : ""}ab]*`;
      const explanation = excluded
        ? `Longest text without "a", "b"${note}.`
        : `One of "a", "b"${note}. Zero or more times.`;
      const explained = run([...flags, "--explain", "-"], rules);
      assert.equal(explained.status, 0, explained.stderr);
      assert.equal(explained.stderr, "");
      assert.equal(explained.stdout.split("\n")[2], `2:1  ${atom}  ${explanation}`);
      const json = run([...flags, "--json", "-"], rules);
      assert.equal(json.status, 0, json.stderr);
      assert.equal(json.stderr, "");
      const result = JSON.parse(json.stdout);
      assert.equal(result.source, `^${atom}$`);
      assert.equal(result.segments[1].explanation, explanation);
      assert.equal(new RegExp(result.source, result.flags).test("ab"), !excluded);
      assert.equal(new RegExp(result.source, result.flags).test("x"), excluded);
    }
  }
});

test("CLI compiles letter sequences, counts and case-folding explanations", () => {
  for (const [rule, source] of [
    ["letter", "[A-Za-z]"],
    ["letters", "[A-Za-z]+"],
    ["3 letters", "[A-Za-z]{3}"],
    ["between 2 and 4 letters", "[A-Za-z]{2,4}"],
  ]) {
    const output = run(["--json", "-"], `start ${rule}\nend`);
    assert.equal(output.status, 0, output.stderr);
    const result = JSON.parse(output.stdout);
    assert.equal(result.source, `^${source}$`);
    assert.equal(result.flags, "u");
    assert.match(result.segments[1].explanation, /ASCII letter/u);
  }
  const folded = run(["--ignore-case", "--explain", "-"], "letter");
  assert.equal(folded.status, 0, folded.stderr);
  assert.equal(
    folded.stdout,
    "/[A-Za-z]/iu\n1:1  [A-Za-z]  One ASCII letter (A–Z, a–z). With i, a few Unicode equivalents also match.\n",
  );
  const invalid = run(["--json", "-"], "2 letter characters");
  assert.equal(invalid.status, 1);
  assert.equal(invalid.stdout, "");
  assert.equal(JSON.parse(invalid.stderr).error.column, 3);
  assert.equal(
    JSON.parse(invalid.stderr).error.hint,
    "Use `letter` for one ASCII letter or `letters` for one or more.",
  );
});

test("CLI exposes bounded counts and positioned range errors", () => {
  const rules = 'start "INV-"\nbetween 2 and 4 digits\nend';
  const output = run(["--json", "-"], rules);
  assert.equal(output.status, 0, output.stderr);
  const result = JSON.parse(output.stdout);
  assert.equal(result.source, "^INV-\\d{2,4}$");
  assert.deepEqual(result.segments[2].repetition, { kind: "range", min: 2, max: 4 });
  assert.match(
    run(["--explain", "-"], rules).stdout,
    /Between 2 and 4 digits \(0–9\), inclusive\./u,
  );
  const invalid = "start between 4 and 2 digits";
  const failure = run(["--json", "-"], invalid);
  assert.equal(failure.status, 1);
  assert.equal(failure.stdout, "");
  assert.deepEqual(JSON.parse(failure.stderr).error, {
    code: "INVALID_RANGE",
    message: "The upper count cannot be smaller than the lower count.",
    line: 1,
    column: invalid.indexOf("2") + 1,
    endColumn: invalid.indexOf("2") + 2,
    hint: "Put the smaller count first, such as `between 2 and 4 digits`.",
  });
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
    message: "Repetition modifiers apply to items, not anchors.",
    line: 1,
    column: 3,
    hint: 'Remove the modifier or apply it to an item, such as `3 digits` or `optional "-"`.',
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

test("CLI offers the JSON quote hint without changing positioned literal or list errors", () => {
  const hint = 'Use JSON double quotes for quoted text, such as `"A"`.';
  for (const value of ["'ABC'", "`ABC`", "“ABC”", "‘ABC’"]) {
    for (const prefix of ["start 2 ", "one of: a, ", "none of: a, ", "text without: a, "]) {
      const literal = prefix.startsWith("start");
      const message = literal
        ? `Unsupported rule: ${JSON.stringify(`2 ${value}`)}.`
        : "Each character-list item must be one Unicode code point.";
      const line = `  ${prefix}${value}`;
      const input = `\n${line}`;
      const column = line.indexOf(value) + 1;
      const structured = run(["--json", "-"], input);
      assert.equal(structured.status, 1);
      assert.equal(structured.stdout, "");
      assert.deepEqual(JSON.parse(structured.stderr), {
        error: {
          code: literal ? "UNKNOWN_RULE" : "INVALID_CHARACTER",
          message,
          line: 2,
          column,
          ...(!literal ? { endColumn: column + value.length } : {}),
          hint,
        },
      });
      const plain = run(["-"], input);
      assert.equal(plain.status, 1);
      assert.equal(plain.stdout, "");
      assert.equal(plain.stderr, `Line 2, column ${column}: ${message}\n${hint}\n`);
    }
  }
});

test("CLI preserves quote positions and control-character ranges after trailing whitespace", () => {
  for (const prefix of ["start 2 ", "none of: a, ", "text without: a, "]) {
    for (const trailing of ["   ", "\u00a0 ", "\t "]) {
      const line = `  ${prefix}"😀${trailing}`;
      const rules = `\n${line}`;
      const control = trailing.includes("\t");
      const detail = {
        code: "INVALID_QUOTE",
        message: control
          ? "Escape control characters inside quoted values."
          : "Missing closing double quote.",
        line: 2,
        column: control ? line.indexOf("\t") + 1 : line.length + 1,
        ...(control ? { endColumn: line.indexOf("\t") + 2 } : {}),
      };
      const structured = run(["--json", "-"], rules);
      assert.equal(structured.status, 1);
      assert.equal(structured.stdout, "");
      assert.deepEqual(JSON.parse(structured.stderr), { error: detail });
      const plain = run(["-"], rules);
      assert.equal(plain.status, 1);
      assert.equal(plain.stdout, "");
      assert.equal(plain.stderr, `Line 2, column ${detail.column}: ${detail.message}\n`);
    }
  }
});

test("CLI reports malformed and incomplete exact counts with structured repair hints", () => {
  for (const [rules, message, hint, line, column, endColumn] of [
    [
      "start 1.5 digits",
      "Counts must be nonnegative integers.",
      "Write counts with digits 0–9 only, such as `3`.",
      1,
      7,
      10,
    ],
    [
      "start\n  -1 digits",
      "Counts must be nonnegative integers.",
      "Write counts with digits 0–9 only, such as `3`.",
      2,
      3,
      5,
    ],
    [
      "٣ digits",
      "Counts must be nonnegative integers.",
      "Write counts with digits 0–9 only, such as `3`.",
      1,
      1,
      2,
    ],
    ["start 3", "A count needs an item.", "Use `3 digits`, with the count before the item.", 1, 7],
  ]) {
    const result = run(["--json", "-"], rules);
    assert.equal(result.status, 1, rules);
    assert.equal(result.stdout, "", rules);
    assert.deepEqual(
      JSON.parse(result.stderr).error,
      {
        code: "INVALID_REPETITION",
        message,
        line,
        column,
        ...(endColumn === undefined ? {} : { endColumn }),
        hint,
      },
      rules,
    );
  }
  const text = run(["-"], "-1 digits");
  assert.equal(text.status, 1);
  assert.equal(text.stdout, "");
  assert.match(text.stderr, /Line 1, column 1: Counts must be nonnegative integers\./u);
  assert.match(text.stderr, /Write counts with digits 0–9 only/u);
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
  const plainUsage = run([option], "");
  assert.equal(plainUsage.status, 2);
  assert.equal(plainUsage.stdout, "");
  const visibleOption = `--${String.raw`\u0001`.repeat(16_000)}`;
  assert.ok(plainUsage.stderr.startsWith(`Unknown option: ${visibleOption}\nUsage:`));
  assert.equal(/\p{Control}/u.test(plainUsage.stderr.replaceAll("\n", "")), false);
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
