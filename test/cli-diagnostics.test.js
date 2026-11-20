import assert from "node:assert/strict";
import test from "node:test";
import { run } from "./helpers/cli.js";

test("CLI trailing-comma diagnostics identify the separator in text and JSON", () => {
  for (const prefix of [
    "one of:",
    "none of:",
    "text without:",
    "3 one of:",
    "between 2 and 4 none of:",
  ]) {
    const line = `  ${prefix} "😀", ",",`;
    const column = line.lastIndexOf(",") + 1;
    for (const json of [false, true]) {
      const output = run(json ? ["--json", "-"] : ["-"], `start\n${line}   \nend`);
      assert.equal(output.status, 1);
      assert.equal(output.stdout, "");
      if (json)
        assert.deepEqual(JSON.parse(output.stderr), {
          error: {
            code: "INVALID_CHARACTER_LIST",
            message: "A character list cannot end with a comma.",
            line: 2,
            column,
          },
        });
      else
        assert.equal(
          output.stderr,
          `Line 2, column ${column}: A character list cannot end with a comma.\n`,
        );
    }
    const repaired = run(["--json", "-"], `start\n${line.slice(0, -1)}\nend`);
    assert.equal(repaired.status, 0, repaired.stderr);
  }
});

test("CLI counted sequence errors offer repairs in plain text and JSON", () => {
  for (const [sequence, item, hint] of [
    ["any text", "any character", "Use counts with `any character`, such as `3 any character`."],
    [
      "text without: a, b",
      "none of: a, b",
      "Use counts with `none of:`, such as `3 none of: a, b`.",
    ],
  ]) {
    for (const json of [false, true]) {
      const result = run(json ? ["--json", "-"] : ["-"], `start\n3 ${sequence}\nend`);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, "");
      if (json)
        assert.deepEqual(JSON.parse(result.stderr), {
          error: {
            code: "DUPLICATE_REPETITION",
            message: "This rule already matches a sequence.",
            line: 2,
            column: 3,
            hint,
          },
        });
      else
        assert.equal(
          result.stderr,
          `Line 2, column 3: This rule already matches a sequence.\n${hint}\n`,
        );
    }
    const repaired = run(["--json", "-"], `start\n3 ${item}\nend`);
    assert.equal(repaired.status, 0, repaired.stderr);
    const result = JSON.parse(repaired.stdout);
    const regex = new RegExp(result.source, result.flags);
    assert.equal(regex.test("ccc"), true);
    assert.equal(regex.test("cc"), false);
    assert.equal(regex.test("cccc"), false);
  }
});

test("CLI mixed anchors preserve absolute input and native line boundaries", () => {
  for (const [rules, source] of [
    ["start\n3 digits\nline end", String.raw`^(?<![\s\S])\d{3}$`],
    ["line start\n3 digits\nend", String.raw`^\d{3}$(?![\s\S])`],
  ]) {
    for (const json of [false, true]) {
      const result = run(json ? ["--json", "-"] : ["-"], rules);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stderr, "");
      if (json) {
        const compiled = JSON.parse(result.stdout);
        assert.equal(compiled.source, source);
        assert.equal(compiled.flags, "mu");
        const native = new RegExp(source, "mu");
        for (const input of ["123", "123\nrest", "rest\n123", "12", "1234"])
          assert.deepEqual(
            new RegExp(compiled.source, compiled.flags).exec(input),
            native.exec(input),
          );
      } else assert.equal(result.stdout, `/${source}/mu\n`);
    }
  }
  for (const [rules, flags, newlineMatches] of [
    ["start\n3 digits\nend", "u", false],
    ["line start\n3 digits\nline end", "mu", true],
  ]) {
    const repaired = run(["--json", "-"], rules);
    assert.equal(repaired.status, 0, repaired.stderr);
    const result = JSON.parse(repaired.stdout);
    assert.equal(result.source, "^\\d{3}$");
    assert.equal(result.flags, flags);
    const regex = new RegExp(result.source, result.flags);
    assert.equal(regex.test("123"), true);
    assert.equal(regex.test("note\n123"), newlineMatches);
  }
});

test("CLI incomplete unbounded modifiers offer positioned repairs in text and JSON", () => {
  for (const [modifier, message, hint] of [
    [
      "at least",
      "A minimum repetition needs a count and an item.",
      "Use `at least 3 digits`, with the minimum count before the item.",
    ],
    [
      "at least 3",
      "A repetition modifier needs an item.",
      "Use `at least 3 digits`, with the minimum count before the item.",
    ],
    [
      "zero or more",
      "A repetition modifier needs an item.",
      "Use `zero or more digit`, with the modifier before the item.",
    ],
    [
      "one or more",
      "A repetition modifier needs an item.",
      "Use `one or more digit`, with the modifier before the item.",
    ],
  ]) {
    for (const json of [false, true]) {
      const result = run(json ? ["--json", "-"] : ["-"], `start\n  ${modifier}\nend`);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, "");
      if (json)
        assert.deepEqual(JSON.parse(result.stderr), {
          error: { code: "INVALID_REPETITION", message, line: 2, column: 3, hint },
        });
      else assert.equal(result.stderr, `Line 2, column 3: ${message}\n${hint}\n`);
    }
  }
  const repaired = run(["--json", "-"], "start\nat least 3 digits\nend");
  assert.equal(repaired.status, 0, repaired.stderr);
  const result = JSON.parse(repaired.stdout);
  const regex = new RegExp(result.source, result.flags);
  assert.equal(regex.test("123"), true);
  assert.equal(regex.test("1234"), true);
  assert.equal(regex.test("12"), false);
});

test("CLI spaces output, explanations and invalid counts use the shared language", () => {
  const output = run(["--json", "-"], "start\nspaces\nend");
  assert.equal(output.status, 0, output.stderr);
  const result = JSON.parse(output.stdout);
  assert.equal(result.source, "^\\s+$");
  assert.equal(
    result.segments[1].explanation,
    "One or more whitespace characters, including line breaks.",
  );
  assert.equal(new RegExp(result.source, result.flags).test(" \t\n"), true);
  const explained = run(["--explain", "-"], "spaces");
  assert.equal(explained.status, 0, explained.stderr);
  assert.match(explained.stdout, /One or more whitespace characters, including line breaks\./u);
  const invalid = run(["--json", "-"], "spaces 3 times");
  assert.equal(invalid.status, 1);
  assert.equal(invalid.stdout, "");
  assert.equal(JSON.parse(invalid.stderr).error.code, "UNKNOWN_RULE");
  assert.equal(
    JSON.parse(invalid.stderr).error.hint,
    "Use `space` for one whitespace character or `spaces` for one or more, including line breaks.",
  );
});

test("CLI empty-literal diagnostics include a usable repair in text and JSON", () => {
  const line = '  start between 0 and 1 ""';
  const hint = "Use `start` and `end` on separate lines to match an empty string.";
  for (const json of [false, true]) {
    const result = run(json ? ["--json", "-"] : ["-"], `\n${line}`);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    if (json) {
      assert.deepEqual(JSON.parse(result.stderr), {
        error: {
          code: "EMPTY_LITERAL",
          message: "A literal cannot be empty.",
          line: 2,
          column: line.indexOf('""') + 1,
          hint,
        },
      });
    } else {
      assert.equal(
        result.stderr,
        `Line 2, column ${line.indexOf('""') + 1}: A literal cannot be empty.\n${hint}\n`,
      );
    }
  }
  const repaired = run(["--json", "-"], "start\nend");
  assert.equal(repaired.status, 0, repaired.stderr);
  const result = JSON.parse(repaired.stdout);
  assert.equal(result.source, "^$");
  const regex = new RegExp(result.source, result.flags);
  assert.equal(regex.test(""), true);
  for (const text of [" ", "A", "\n"]) assert.equal(regex.test(text), false, JSON.stringify(text));
});

test("CLI help includes a working first-use example and exit codes", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const example = result.stdout.match(/printf '([^']+)' \| regex-for-humans/u);
  assert.ok(example, "Help should show rules piped into the CLI.");
  const compiled = run([], example[1].replaceAll("\\n", "\n"));
  assert.equal(compiled.status, 0, compiled.stderr);
  assert.equal(compiled.stdout, "/^ABC\\d{3}$/u\n");
  assert.ok(result.stdout.includes(`  # ${compiled.stdout.trim()}`));
  assert.match(result.stdout, /0 {2}Success, help or version/u);
  assert.match(result.stdout, /1 {2}Invalid rules, input or output error/u);
  assert.match(result.stdout, /2 {2}Invalid command arguments/u);
});
