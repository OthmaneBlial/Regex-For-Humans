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
import { compile, toRegExp } from "../index.js";
import { cli, run, scenarios } from "./helpers/cli.js";

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
    for (const args of [["-"], ["--help"], ["--version"], ["--reverse", "-"]]) {
      const result = spawnSync(process.execPath, [cli, "--json", ...args], {
        input: args.includes("--reverse") ? "/digit/u" : "digit",
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

test("CLI rejects malformed UTF-8 in either mode without replacing bytes", () => {
  const message = "Input must be valid UTF-8. Save the input as UTF-8 and try again.";
  const directory = mkdtempSync(join(tmpdir(), "regex-for-humans-cli-"));
  const path = join(directory, "input.txt");
  try {
    for (const reverse of [false, true]) {
      const args = reverse ? ["--reverse"] : [];
      const prefix = reverse ? "/^" : 'start\n"';
      const suffix = reverse ? "$/u" : '"\nend';
      const inputs = [
        ...[[0x80], [0xc0, 0xaf], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80]].map((bytes) =>
          Buffer.concat([Buffer.from(prefix), Buffer.from(bytes), Buffer.from(suffix)]),
        ),
        Buffer.concat([Buffer.from(prefix), Buffer.from([0xe2, 0x82])]),
      ];
      for (const input of inputs) {
        writeFileSync(path, input);
        for (const file of ["-", path]) {
          for (const json of [false, true]) {
            const result = run(
              [...args, ...(json ? ["--json"] : []), file],
              file === "-" ? input : undefined,
            );
            assert.equal(result.status, 1);
            assert.equal(result.stdout, "");
            if (json)
              assert.deepEqual(JSON.parse(result.stderr), {
                error: { code: "CLI_ERROR", message },
              });
            else assert.equal(result.stderr, `Error: ${message}\n`);
          }
        }
      }
      const repaired = reverse ? "\ufeff /^�😀$/u\r\n" : '\ufeffstart "\ufffd"\nend';
      writeFileSync(path, repaired, "utf8");
      for (const file of ["-", path]) {
        const valid = run([...args, "--json", file], file === "-" ? repaired : undefined);
        assert.equal(valid.status, 0, valid.stderr);
        assert.equal(valid.stderr, "");
        const result = JSON.parse(valid.stdout);
        if (reverse) {
          assert.deepEqual(result, { rules: 'start\n"�😀"\nend', flags: "" });
          assert.equal(toRegExp(compile(result.rules)).test("�😀"), true);
        } else {
          assert.equal(result.source, "^\ufffd$");
          assert.equal(result.segments[0].column, 2);
        }
      }
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
  const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const shown = run(["--version"]);
  assert.equal(shown.status, 0, shown.stderr);
  assert.equal(shown.stderr, "");
  assert.equal(shown.stdout, `${version}\n`);
  const explained = run(["--explain", "-"], "digit");
  assert.equal(explained.status, 0, explained.stderr);
  assert.match(explained.stdout, /1:1 {2}\\d {2}One digit/u);
  assert.equal(
    run(["--explain", "-"], "hex digits").stdout,
    "/[0-9A-Fa-f]+/u\n1:1  [0-9A-Fa-f]+  One or more hexadecimal digits (0–9, A–F, a–f).\n",
  );
});
