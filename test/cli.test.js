import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  closeSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
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

test("CLI mixed-anchor diagnostics preserve locations and explain both repairs", () => {
  const hint = "Pair `start` with `end`, or `line start` with `line end`.";
  for (const rules of ["start\n3 digits\nline end", "line start\n3 digits\nend"]) {
    for (const json of [false, true]) {
      const result = run(json ? ["--json", "-"] : ["-"], rules);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, "");
      if (json)
        assert.deepEqual(JSON.parse(result.stderr), {
          error: {
            code: "MIXED_ANCHORS",
            message: "Do not mix input and line anchors.",
            line: 3,
            column: 1,
            hint,
          },
        });
      else
        assert.equal(
          result.stderr,
          `Line 3, column 1: Do not mix input and line anchors.\n${hint}\n`,
        );
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

test("CLI exposes direction controls while JSON preserves original rule text", () => {
  const points = [
    0x061c, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069,
  ];
  const text = `A${String.fromCodePoint(...points)}B`;
  const escaped = `A${points.map((point) => `\\u${point.toString(16).padStart(4, "0")}`).join("")}B`;
  const rule = JSON.stringify(text);
  for (const args of [["-"], ["--explain", "-"], ["--json", "-"]]) {
    const result = run(args, `start\n${rule}\nend`);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(/\p{Bidi_Control}/u.test(result.stdout), false);
    if (args.includes("--json")) {
      const decoded = JSON.parse(result.stdout);
      assert.equal(decoded.source, `^${escaped}$`);
      assert.equal(decoded.segments[1].text, rule);
      assert.equal(new RegExp(decoded.source, decoded.flags).test(text), true);
    } else {
      assert.ok(result.stdout.startsWith(`/^${escaped}$/u\n`));
      if (args.includes("--explain"))
        assert.ok(result.stdout.includes(`Literal text "${escaped}".`));
    }
  }
});

test("CLI displays direction controls in diagnostics without changing decoded path or argument data", () => {
  const character = String.fromCodePoint(0x202e);
  for (const json of [false, true]) {
    const invalid = run(json ? ["--json", "-"] : ["-"], `unsupported${character}words`);
    assert.equal(invalid.status, 1);
    assert.equal(/\p{Bidi_Control}/u.test(invalid.stderr), false);
    const message = json ? JSON.parse(invalid.stderr).error.message : invalid.stderr;
    assert.ok(message.includes(String.raw`unsupported\u202ewords`));
    const option = `--unknown${character}option`;
    const usage = run(json ? ["--json", option] : [option], "");
    assert.equal(usage.status, 2);
    assert.equal(/\p{Bidi_Control}/u.test(usage.stderr), false);
    if (json) assert.equal(JSON.parse(usage.stderr).error.message, `Unknown option: ${option}`);
    else assert.ok(usage.stderr.includes(String.raw`--unknown\u202eoption`));
  }
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  try {
    const filename = join(directory, `missing${character}.txt`);
    for (const json of [false, true]) {
      const result = run(json ? ["--json", filename] : [filename], "");
      assert.equal(result.status, 1);
      assert.equal(/\p{Bidi_Control}/u.test(result.stderr), false);
      if (json) assert.ok(JSON.parse(result.stderr).error.message.includes(filename));
      else assert.ok(result.stderr.includes(String.raw`missing\u202e.txt`));
    }
  } finally {
    rmdirSync(directory);
  }
});

test("CLI exposes terminal controls in errors while preserving decoded arguments and paths", () => {
  // NUL cannot be passed as an operating-system argument or filename.
  const points = [
    ...Array.from({ length: 31 }, (_, index) => index + 1),
    ...Array.from({ length: 33 }, (_, index) => index + 0x7f),
    0x2028,
    0x2029,
  ];
  const controls = String.fromCodePoint(...points);
  const escaped = points.map((point) => `\\u${point.toString(16).padStart(4, "0")}`).join("");
  const option = `--unknown${controls}🧠\\tail"`;
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  try {
    const filename = join(directory, `missing${controls}🧠.txt`);
    for (const json of [false, true]) {
      const usage = run(json ? ["--json", option] : [option], "");
      assert.equal(usage.status, 2);
      assert.equal(usage.stdout, "");
      assert.equal(/[\p{Control}\u2028\u2029]/u.test(usage.stderr.replaceAll("\n", "")), false);
      if (json) {
        assert.equal(JSON.parse(usage.stderr).error.message === `Unknown option: ${option}`, true);
      } else {
        assert.ok(usage.stderr.startsWith(`Unknown option: --unknown${escaped}🧠\\tail"\nUsage:`));
      }
      const file = run(json ? ["--json", filename] : [filename], "");
      assert.equal(file.status, 1);
      assert.equal(file.stdout, "");
      assert.equal(/[\p{Control}\u2028\u2029]/u.test(file.stderr.replaceAll("\n", "")), false);
      if (json) {
        assert.equal(JSON.parse(file.stderr).error.message.includes(filename), true);
      } else {
        assert.equal(file.stderr.includes(`missing${escaped}🧠.txt`), true);
        assert.equal(file.stderr.split("\n").length, 2);
      }
    }
  } finally {
    rmdirSync(directory);
  }
});

test("CLI exposes terminal controls in regexes and explanations without changing matching or JSON data", () => {
  const points = [
    ...Array.from({ length: 32 }, (_, index) => index),
    ...Array.from({ length: 33 }, (_, index) => index + 0x7f),
    0x2028,
    0x2029,
  ];
  const text = `A${String.fromCodePoint(...points)}🧠B`;
  const rule = JSON.stringify(text);
  const rules = `start\n${rule}\nend`;
  for (const args of [["-"], ["--explain", "-"], ["--json", "-"]]) {
    const result = run(args, rules);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(/[\p{Control}\u2028\u2029]/u.test(result.stdout.replaceAll("\n", "")), false);
    let regex;
    if (args.includes("--json")) {
      const decoded = JSON.parse(result.stdout);
      assert.equal(decoded.segments[1].text === rule, true);
      assert.equal(decoded.source.includes(String.raw`\u009b`), true);
      regex = new RegExp(decoded.source, decoded.flags);
    } else {
      const literal = result.stdout.split("\n")[0];
      const delimiter = literal.lastIndexOf("/");
      regex = new RegExp(literal.slice(1, delimiter), literal.slice(delimiter + 1));
      assert.ok(literal.includes(String.raw`\u009b`));
    }
    assert.equal(regex.test(text), true);
    assert.equal(regex.test("A🧠B"), false);
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

test("CLI reports stdout write failures as JSON without an unhandled exception", () => {
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  const path = join(directory, "readonly.txt");
  writeFileSync(path, "sentinel");
  const descriptor = openSync(path, "r");
  try {
    for (const args of [["-"], ["--help"], ["--version"]]) {
      const result = spawnSync(process.execPath, [cli, "--json", ...args], {
        input: "digit",
        encoding: "utf8",
        stdio: ["pipe", descriptor, "pipe"],
      });
      assert.equal(result.status, 1, args.join(" "));
      const error = JSON.parse(result.stderr).error;
      assert.equal(error.code, "CLI_ERROR");
      assert.match(error.message, /write/iu);
    }
    assert.equal(readFileSync(path, "utf8"), "sentinel");
  } finally {
    closeSync(descriptor);
    unlinkSync(path);
    rmdirSync(directory);
  }
});

test("CLI preserves nonzero status when stderr cannot accept diagnostics", () => {
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  const path = join(directory, "readonly.txt");
  writeFileSync(path, "sentinel");
  const descriptor = openSync(path, "r");
  try {
    for (const [args, status] of [
      [["--json", "-"], 1],
      [["--json", "--bogus"], 2],
    ]) {
      const result = spawnSync(process.execPath, [cli, ...args], {
        input: "unsupported",
        encoding: "utf8",
        stdio: ["pipe", "pipe", descriptor],
      });
      assert.equal(result.status, status);
      assert.equal(result.stdout, "");
    }
    assert.equal(readFileSync(path, "utf8"), "sentinel");
  } finally {
    closeSync(descriptor);
    unlinkSync(path);
    rmdirSync(directory);
  }
});

test("CLI rejects malformed UTF-8 in stdin and files instead of replacing bytes", () => {
  const message = "Input must be valid UTF-8. Save the rules as UTF-8 and try again.";
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  const path = join(directory, "rules.txt");
  const inputs = [
    ...[[0x80], [0xc0, 0xaf], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80]].map((bytes) =>
      Buffer.concat([Buffer.from('start\n"'), Buffer.from(bytes), Buffer.from('"\nend')]),
    ),
    Buffer.concat([Buffer.from('"'), Buffer.from([0xe2, 0x82])]),
  ];
  try {
    for (const input of inputs) {
      writeFileSync(path, input);
      for (const file of ["-", path]) {
        for (const json of [false, true]) {
          const result = run(json ? ["--json", file] : [file], file === "-" ? input : undefined);
          assert.equal(result.status, 1);
          assert.equal(result.stdout, "");
          if (json)
            assert.deepEqual(JSON.parse(result.stderr), { error: { code: "CLI_ERROR", message } });
          else assert.equal(result.stderr, `Error: ${message}\n`);
        }
      }
    }
    const repaired = '\ufeffstart "\ufffd"\nend';
    writeFileSync(path, repaired, "utf8");
    for (const file of ["-", path]) {
      const valid = run(["--json", file], file === "-" ? repaired : undefined);
      assert.equal(valid.status, 0, valid.stderr);
      const compiled = JSON.parse(valid.stdout);
      assert.equal(compiled.source, "^\ufffd$");
      assert.equal(compiled.segments[0].column, 2);
    }
  } finally {
    unlinkSync(path);
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
  assert.equal(
    run(["--explain", "-"], "hex digits").stdout,
    "/[0-9A-Fa-f]+/u\n1:1  [0-9A-Fa-f]+  One or more hexadecimal digits (0–9, A–F, a–f).\n",
  );
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

test("CLI preserves original quote error positions after trailing whitespace", () => {
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
  for (const [rules, message, hint, line, column] of [
    [
      "start 1.5 digits",
      "Counts must be nonnegative integers.",
      "Write counts with digits 0–9 only, such as `3`.",
      1,
      7,
    ],
    [
      "start\n  -1 digits",
      "Counts must be nonnegative integers.",
      "Write counts with digits 0–9 only, such as `3`.",
      2,
      3,
    ],
    [
      "٣ digits",
      "Counts must be nonnegative integers.",
      "Write counts with digits 0–9 only, such as `3`.",
      1,
      1,
    ],
    ["start 3", "A count needs an item.", "Use `3 digits`, with the count before the item.", 1, 7],
  ]) {
    const result = run(["--json", "-"], rules);
    assert.equal(result.status, 1, rules);
    assert.equal(result.stdout, "", rules);
    assert.deepEqual(
      JSON.parse(result.stderr).error,
      { code: "INVALID_REPETITION", message, line, column, hint },
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
