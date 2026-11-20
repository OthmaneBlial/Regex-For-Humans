import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { compile, exportRegex, regexToRules, toRegExp } from "../index.js";
import { LIMITS } from "../src/parser.js";
import { cli, run, scenarios } from "./helpers/cli.js";

test("CLI reverses stdin into reusable rules or the library's JSON result", () => {
  const literal = String.raw`/^ABC\d{3}$/u`;
  const rules = 'start\n"ABC"\n3 digit\nend';
  for (const args of [["--reverse"], ["--reverse", "-"], ["--reverse", "--reverse", "-"]]) {
    const output = run(args, `${literal}\n`);
    assert.equal(output.status, 0, output.stderr);
    assert.equal(output.stderr, "");
    assert.equal(output.stdout, `${rules}\n`);
    assert.equal(toRegExp(compile(output.stdout)).test("ABC123"), true);
  }
  const json = run(["--reverse", "--json", "-"], literal);
  assert.equal(json.status, 0, json.stderr);
  assert.equal(json.stderr, "");
  assert.deepEqual(JSON.parse(json.stdout), { rules, flags: "" });
});

test("CLI reverse preserves matching flags and explains plain-output compiler options", () => {
  for (const flags of ["u", "iu", "su", "isu", "mu", "imu", "msu", "imsu"]) {
    const regex = new RegExp("^A.$", flags);
    const expected = regexToRules(regex);
    const options = flags.includes("m")
      ? `--flags ${expected.flags}`
      : [flags.includes("i") ? "--ignore-case" : "", flags.includes("s") ? "--dot-all" : ""]
          .filter(Boolean)
          .join(" ");
    for (const json of [false, true]) {
      const output = run(["--reverse", ...(json ? ["--json"] : []), "-"], String(regex));
      assert.equal(output.status, 0, output.stderr);
      const result = json
        ? JSON.parse(output.stdout)
        : { rules: output.stdout.trim(), flags: expected.flags };
      assert.deepEqual(result, expected);
      assert.equal(
        output.stderr,
        json || !options
          ? ""
          : `Compile these rules with ${options} to preserve the regex flags, or use --json.\n`,
      );
      const rebuilt = toRegExp(compile(result.rules, { flags: result.flags }));
      assert.equal(rebuilt.flags, regex.flags);
      for (const sample of ["AB", "aB", "A\n", "a\n", "\nAB\n", "X", ""])
        assert.deepEqual(rebuilt.exec(sample), regex.exec(sample));
    }
  }
});

test("CLI reverse adds the dot-all option needed by an empty negative class", () => {
  const literal = "/^[^]$/u";
  const rules = "start\nany character\nend";
  const plain = run(["--reverse", "-"], literal);
  assert.equal(plain.status, 0, plain.stderr);
  assert.equal(plain.stdout, `${rules}\n`);
  assert.equal(
    plain.stderr,
    "Compile these rules with --dot-all to preserve the regex flags, or use --json.\n",
  );
  const json = run(["--reverse", "--json", "-"], literal);
  assert.equal(json.status, 0, json.stderr);
  assert.equal(json.stderr, "");
  const translated = JSON.parse(json.stdout);
  assert.deepEqual(translated, { rules, flags: "s" });
  assert.equal(toRegExp(compile(translated.rules, { flags: translated.flags })).test("\n"), true);
});

test("CLI reverse uses the existing translator for every shared recipe", () => {
  for (const scenario of scenarios) {
    const regex = new RegExp(scenario.source, scenario.flags);
    const output = run(["--json", "--reverse", "-"], String(regex));
    assert.equal(output.status, 0, `${scenario.id}: ${output.stderr}`);
    assert.equal(output.stderr, "");
    const translated = JSON.parse(output.stdout);
    assert.deepEqual(translated, regexToRules(regex), scenario.id);
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    for (const text of [...scenario.positive, ...scenario.negative])
      assert.deepEqual(
        rebuilt.exec(text),
        regex.exec(text),
        `${scenario.id}: ${JSON.stringify(text)}`,
      );
  }
});

test("CLI reverse reads UTF-8 files and accepts a leading-dash path after --", () => {
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  const path = join(directory, "-😀.regex");
  try {
    writeFileSync(path, "\ufeff /^(?:😀A){2}$/isu\n");
    const output = spawnSync(process.execPath, [cli, "--reverse", "--json", "--", "-😀.regex"], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(output.status, 0, output.stderr);
    assert.equal(output.stderr, "");
    assert.deepEqual(JSON.parse(output.stdout), { rules: 'start\n2 "😀A"\nend', flags: "is" });
  } finally {
    unlinkSync(path);
    rmdirSync(directory);
  }
});

test("CLI reverse rejects conflicting forward options before reading input", () => {
  const message =
    "--reverse cannot be combined with --explain, --ignore-case, --dot-all, --flags or --target.";
  for (const flag of ["--explain", "--ignore-case", "--dot-all", "--flags=u", "--target=python"]) {
    for (const json of [false, true]) {
      const output = run([flag, "--reverse", ...(json ? ["--json"] : []), "-"], "not a regex");
      assert.equal(output.status, 2);
      assert.equal(output.stdout, "");
      if (json)
        assert.deepEqual(JSON.parse(output.stderr), { error: { code: "CLI_USAGE", message } });
      else assert.ok(output.stderr.startsWith(`${message}\nUsage:`));
    }
  }
});

test("CLI exports source code, capture mappings and requirements without changing default compilation", () => {
  const rules = 'capture "اسم" {\ndigits\n}';
  for (const target of [
    "javascript",
    "typescript",
    "python",
    "rust",
    "go",
    "java",
    "csharp",
    "php",
    "ruby",
  ]) {
    const expected = exportRegex(rules, { target });
    const plain = run(["--target", target, "-"], rules);
    assert.equal(plain.status, 0);
    assert.equal(plain.stdout, `${expected.code}\n`);
    assert.ok(plain.stderr.includes(expected.requirements[0]));
    assert.ok(plain.stderr.includes("Capture mapping:"));
    const json = run([`--target=${target}`, "--json", "-"], rules);
    assert.equal(json.status, 0);
    assert.equal(json.stderr, "");
    assert.deepEqual(JSON.parse(json.stdout), expected);
  }
  assert.equal(run(["-"], "digit").stdout, "/\\d/u\n");
});

test("CLI target arguments and unsupported constructs report distinct usage/compiler errors", () => {
  for (const args of [
    ["--target"],
    ["--target="],
    ["--target=python", "--target=ruby"],
    ["--target=python", "--explain"],
  ]) {
    const result = run(["--json", ...args, "-"], "digit");
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.equal(JSON.parse(result.stderr).error.code, "CLI_USAGE");
  }
  for (const [target, rules, code] of [
    ["perl", "digit", "UNSUPPORTED_EXPORT_TARGET"],
    ["go", 'followed by {\n"a"\n}', "EXPORT_LOOKAROUND"],
  ]) {
    const result = run([`--target=${target}`, "--json", "-"], rules);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(JSON.parse(result.stderr).error.code, code);
  }
});

test("CLI reverse preserves positioned translator errors and reports literal syntax failures", () => {
  for (const [input, code, message, column] of [
    [
      "/^😀ab[]/u",
      "UNSUPPORTED_REGEX",
      "An empty character class has no rule-language equivalent.",
      6,
    ],
    [
      "/^A$/",
      "UNICODE_FLAG_REQUIRED",
      "Add the `u` or `v` flag before translating. The rule language always uses Unicode matching.",
      1,
    ],
    [
      "/a/g",
      "UNICODE_FLAG_REQUIRED",
      "Add the `u` or `v` flag before translating. The rule language always uses Unicode matching.",
      1,
    ],
    ["a", "CLI_ERROR", "Paste a slash-delimited JavaScript regex literal, such as `/\\d+/u`."],
    ["/a", "CLI_ERROR", "Add the closing `/` and any regex flags."],
    ["/a/z", "CLI_ERROR", "Put only JavaScript regex flags after the closing `/`."],
    ["/(/u", "CLI_ERROR", "That is not a valid JavaScript regex literal."],
    ["/a\nb/u", "CLI_ERROR", "Escape line breaks inside a regex literal, such as `\\n`."],
  ]) {
    for (const json of [false, true]) {
      const output = run(["--reverse", ...(json ? ["--json"] : []), "-"], input);
      assert.equal(output.status, 1, input);
      assert.equal(output.stdout, "", input);
      if (json) {
        const error = JSON.parse(output.stderr).error;
        assert.equal(error.code, code);
        assert.equal(error.message, message);
        assert.equal(error.column, column);
        assert.equal(error.line, column ? 1 : undefined);
      } else assert.ok(output.stderr.includes(message), output.stderr);
    }
  }
});

test("CLI reverse retains the regex source ceiling and enforces its streamed input budget", () => {
  const source = `^\\u{${"0".repeat(LIMITS.sourceLength - 8)}41}$`;
  assert.equal(source.length, LIMITS.sourceLength);
  const accepted = run(["--reverse", "--json", "-"], `/${source}/u\n`);
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.deepEqual(JSON.parse(accepted.stdout), { rules: 'start\n"A"\nend', flags: "" });
  const oversized = run(["--reverse", "--json", "-"], `/${source.replace("41", "041")}/u`);
  assert.equal(oversized.status, 1);
  assert.equal(oversized.stdout, "");
  assert.deepEqual(JSON.parse(oversized.stderr).error, {
    code: "REGEX_SOURCE_LIMIT",
    message: "Regex source cannot exceed 16384 UTF-16 code units.",
    line: 1,
    column: LIMITS.sourceLength + 1,
  });
  for (const input of [
    " ".repeat(LIMITS.sourceLength + 9),
    `/${"a".repeat(LIMITS.sourceLength + 9)}/u`,
    `${" ".repeat(LIMITS.sourceLength + 2)}/^😀$/u`,
    `/^😀$/u${"\u00a0".repeat(LIMITS.sourceLength + 2)}`,
  ]) {
    const output = run(["--reverse", "--json", "-"], input);
    assert.equal(output.status, 1);
    assert.equal(output.stdout, "");
    assert.deepEqual(JSON.parse(output.stderr), {
      error: {
        code: "CLI_ERROR",
        message:
          "Regex input cannot exceed 16392 UTF-16 code units, including delimiters, flags and outer whitespace.",
      },
    });
  }
  const literal = "/^😀$/u";
  const boundary = `${"\u00a0".repeat(LIMITS.sourceLength + 8 - literal.length)}${literal}`;
  const translated = run(["--reverse", "--json", "-"], boundary);
  assert.equal(translated.status, 0, translated.stderr);
  assert.deepEqual(JSON.parse(translated.stdout), { rules: 'start\n"😀"\nend', flags: "" });
});

test("CLI reverse file input reports the complete literal limit in text and JSON", () => {
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  const path = join(directory, "padded.regex");
  const message =
    "Regex input cannot exceed 16392 UTF-16 code units, including delimiters, flags and outer whitespace.";
  try {
    writeFileSync(path, " ".repeat(LIMITS.sourceLength + 9));
    for (const json of [false, true]) {
      const output = run(["--reverse", ...(json ? ["--json"] : []), path]);
      assert.equal(output.status, 1);
      assert.equal(output.stdout, "");
      if (json)
        assert.deepEqual(JSON.parse(output.stderr), { error: { code: "CLI_ERROR", message } });
      else assert.equal(output.stderr, `Error: ${message}\n`);
    }
  } finally {
    unlinkSync(path);
    rmdirSync(directory);
  }
});

test("CLI reverse exposes controls and preserves Unicode data through reusable rules", () => {
  const text = `A\u001b\u009b\u202e😀\ud800B`;
  const regex = new RegExp(`^${text.slice(0, -2)}\\uD800B$`, "u");
  for (const json of [false, true]) {
    const output = run(["--reverse", ...(json ? ["--json"] : []), "-"], String(regex));
    assert.equal(output.status, 0, output.stderr);
    assert.equal(output.stderr, "");
    assert.equal(
      /[\p{Bidi_Control}\p{Control}\u2028\u2029]/u.test(output.stdout.replaceAll("\n", "")),
      false,
    );
    const translated = json
      ? JSON.parse(output.stdout)
      : { rules: output.stdout.trim(), flags: "" };
    assert.deepEqual(translated, regexToRules(regex));
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    assert.equal(rebuilt.test(text), true);
    assert.equal(rebuilt.test(text.replace("\ud800", "\ufffd")), false);
  }
});
