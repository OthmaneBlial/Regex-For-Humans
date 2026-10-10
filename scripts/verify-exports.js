import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compile, exportRegex } from "../index.js";
import { EXPORT_CASES, FOREIGN_TARGETS } from "../test/fixtures/engine-exports.js";

const required = new Set(
  (process.argv.find((arg) => arg.startsWith("--require="))?.slice(10) ?? "")
    .split(",")
    .filter(Boolean),
);
for (const target of required)
  if (!FOREIGN_TARGETS.includes(target)) throw new Error(`Unknown required engine: ${target}`);
const commands = {
  python: "python3",
  ruby: "ruby",
  php: "php",
  go: "go",
  rust: "cargo",
  java: "java",
  csharp: "dotnet",
};
const root = mkdtempSync(join(tmpdir(), "regex-native-exports-"));
const env = {
  ...process.env,
  DOTNET_CLI_TELEMETRY_OPTOUT: "1",
  DOTNET_NOLOGO: "1",
  GOTOOLCHAIN: "local",
};

function run(command, args, cwd, timeout = 10000) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `${command} failed: ${result.error?.message ?? result.status}\n${result.stderr.slice(-2200)}`,
    );
  return result.stdout;
}

function rustQuote(value) {
  return `"${[...value].map((c) => (c === '"' ? '\\"' : c === "\\" ? "\\\\" : c.codePointAt(0) < 32 || c.codePointAt(0) > 126 ? `\\u{${c.codePointAt(0).toString(16)}}` : c)).join("")}"`;
}

function goQuote(value) {
  return `"${[...value]
    .map((c) => {
      const cp = c.codePointAt(0);
      return cp > 126
        ? cp <= 0xffff
          ? `\\u${cp.toString(16).padStart(4, "0")}`
          : `\\U${cp.toString(16).padStart(8, "0")}`
        : JSON.stringify(c).slice(1, -1);
    })
    .join("")}"`;
}

function validate(target, selected, output) {
  const rows = output.replace(/\r\n/gu, "\n").replace(/\n$/u, "").split("\n");
  let cursor = 0;
  for (const item of selected) {
    const compiled = compile(item.rules, { flags: item.flags });
    const expression = new RegExp(compiled.source, compiled.flags);
    for (const input of item.inputs) {
      const match = expression.exec(input);
      const expected = match
        ? {
            span: [match.index, match.index + match[0].length],
            captures: Array.from(match, (value) => value ?? null),
          }
        : null;
      const line = rows[cursor++];
      assert.ok(line !== undefined, `${target}: missing result for ${item.name}`);
      const fields = line.split("\t");
      assert.ok(line === "N" || fields[0] === "M", `${target}: invalid result marker`);
      if (line !== "N") {
        assert.ok(fields.length >= 4, `${target}: incomplete match result`);
        assert.ok(
          fields.slice(1, 3).every((value) => /^\d+$/u.test(value)),
          `${target}: invalid match span`,
        );
        for (const [index, hex] of fields.slice(3).entries())
          assert.ok(
            (index > 0 && hex === "-") || /^(?:[0-9a-f]{2})*$/iu.test(hex),
            `${target}: invalid capture encoding`,
          );
      }
      const actual =
        line === "N"
          ? null
          : {
              span: fields.slice(1, 3).map(Number),
              captures: fields
                .slice(3)
                .map((hex) => (hex === "-" ? null : Buffer.from(hex, "hex").toString("utf8"))),
            };
      assert.deepEqual(actual, expected, `${target}: ${item.name}, input ${JSON.stringify(input)}`);
    }
  }
  assert.equal(cursor, rows.length, `${target}: extra native output`);
  return cursor;
}

try {
  for (const target of FOREIGN_TARGETS) {
    const versionArgs =
      target === "go" ? ["version"] : target === "java" ? ["-version"] : ["--version"];
    const probe = spawnSync(commands[target], versionArgs, {
      env,
      encoding: "utf8",
      timeout: 10000,
    });
    if (probe.error || probe.status !== 0) {
      if (required.has(target))
        throw new Error(
          `Required runtime ${target} is unavailable: ${probe.error?.message ?? probe.status}`,
        );
      console.log(`SKIP ${target}: runtime unavailable; no parity claim.`);
      continue;
    }
    const selected = EXPORT_CASES.filter((item) => item.targets.includes(target));
    const exports = selected.map((item) => exportRegex(item.rules, { target, flags: item.flags }));
    const directory = join(root, target);
    mkdirSync(directory);
    const dataPath = join(directory, "inputs.json");
    writeFileSync(dataPath, JSON.stringify(selected.map((item) => item.inputs)));
    const version = `${probe.stdout}\n${probe.stderr}`.trim().split("\n")[0];
    console.log(`RUN ${target}: ${version}; ${selected.length} exported patterns.`);
    let output;
    if (target === "python") {
      const file = join(directory, "consumer.py");
      writeFileSync(
        file,
        `import json, sys\nwith open(sys.argv[1], encoding="utf8") as f: inputs = json.load(f)\n${exports.map((result, i) => `${result.code}\nfor text in inputs[${i}]:\n    m = regex.search(text)\n    print("N" if m is None else "M\\t" + str(len(text[:m.start()].encode("utf-16-le")) // 2) + "\\t" + str(len(text[:m.end()].encode("utf-16-le")) // 2) + "\\t" + "\\t".join("-" if s is None else s.encode("utf8").hex() for s in [m.group(0), *(m.groupdict().get(n) for n in ${JSON.stringify(result.captures.map((c) => c.targetName))})]))`).join("\n")}\n`,
      );
      output = run("python3", [file, dataPath], directory);
    } else if (target === "ruby") {
      const file = join(directory, "consumer.rb");
      writeFileSync(
        file,
        `require "json"\ninputs = JSON.parse(File.read(ARGV[0]))\n${exports.map((result, i) => `${result.code}\ninputs[${i}].each do |text|\n  m = regex.match(text)\n  puts(m.nil? ? "N" : "M\\t" + (text[0...m.begin(0)].encode("UTF-16LE").bytesize / 2).to_s + "\\t" + (text[0...m.end(0)].encode("UTF-16LE").bytesize / 2).to_s + "\\t" + ([m[0]] + ${JSON.stringify(result.captures.map((c) => c.targetName))}.map { |name| m.names.include?(name) ? m[name] : nil }).map { |s| s.nil? ? "-" : s.unpack("H*").first }.join("\\t"))\nend`).join("\n")}\n`,
      );
      output = run("ruby", [file, dataPath], directory);
    } else if (target === "php") {
      const file = join(directory, "consumer.php");
      writeFileSync(
        file,
        `<?php\nfunction u16($s) { return preg_match_all('~.~us', $s) + preg_match_all('~[\\x{10000}-\\x{10ffff}]~u', $s); }\n$inputs = json_decode(file_get_contents($argv[1]), true, 512, JSON_THROW_ON_ERROR);\n${exports.map((result, i) => `${result.code.replace(/^<\?php\s*/u, "")}\nforeach ($inputs[${i}] as $text) {\n  $ok = preg_match($regex, $text, $m, PREG_UNMATCHED_AS_NULL | PREG_OFFSET_CAPTURE);\n  if ($ok === false) throw new RuntimeException(preg_last_error_msg());\n  if ($ok === 0) { echo "N\\n"; continue; }\n  $values = [bin2hex($m[0][0])];\n  foreach (${JSON.stringify(result.captures.map((c) => c.targetName))} as $name) $values[] = ($m[$name][0] ?? null) === null ? "-" : bin2hex($m[$name][0]);\n  echo "M\\t" . u16(substr($text, 0, $m[0][1])) . "\\t" . u16(substr($text, 0, $m[0][1] + strlen($m[0][0]))) . "\\t" . implode("\\t", $values) . "\\n";\n}`).join("\n")}\n`,
      );
      output = run("php", [file, dataPath], directory);
    } else if (target === "java") {
      const files = [];
      for (const [i, result] of exports.entries()) {
        const folder = join(directory, `p${i}`);
        mkdirSync(folder);
        const file = join(folder, "RegexExample.java");
        writeFileSync(file, `package p${i};\n${result.code}\n`);
        files.push(file);
      }
      const file = join(directory, "Main.java");
      writeFileSync(
        file,
        `import java.nio.charset.StandardCharsets;\npublic class Main {\n  static String hex(String s) { if (s == null) return "-"; StringBuilder b = new StringBuilder(); for (byte c : s.getBytes(StandardCharsets.UTF_8)) b.append(String.format("%02x", c & 255)); return b.toString(); }\n  public static void main(String[] args) {\n${selected.map((item, i) => `    for (String input : new String[] {${item.inputs.map(JSON.stringify).join(",")}}) {\n      var m = p${i}.RegexExample.regex.matcher(input);\n      if (!m.find()) { System.out.println("N"); continue; }\n      var values = new StringBuilder("M\\t").append(m.start()).append("\\t").append(m.end()).append("\\t").append(hex(m.group(0)));\n      for (String name : new String[] {${exports[i].captures.map((c) => JSON.stringify(c.targetName)).join(",")}}) values.append("\\t").append(hex(m.group(name)));\n      System.out.println(values);\n    }`).join("\n")}\n  }\n}\n`,
      );
      run("javac", ["-encoding", "UTF-8", file, ...files], directory, 30000);
      output = run("java", ["-cp", directory, "Main"], directory);
    } else if (target === "csharp") {
      writeFileSync(
        join(directory, "consumer.csproj"),
        '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net10.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings></PropertyGroup></Project>',
      );
      writeFileSync(
        join(directory, "Program.cs"),
        `using System.Text;\nusing System.Text.Json;\nvar inputs = JsonDocument.Parse(File.ReadAllText(args[0])).RootElement;\n${exports.map((result, i) => `{\n${result.code}\nforeach (var value in inputs[${i}].EnumerateArray()) {\n  var match = regex.Match(value.GetString()!);\n  if (!match.Success) { Console.WriteLine("N"); continue; }\n  var values = new List<string>();\n  values.Add(Convert.ToHexString(Encoding.UTF8.GetBytes(match.Value)).ToLowerInvariant());\n  foreach (var name in new string[] {${result.captures.map((c) => JSON.stringify(c.targetName)).join(",")}}) { var group = match.Groups[name]; values.Add(group.Success ? Convert.ToHexString(Encoding.UTF8.GetBytes(group.Value)).ToLowerInvariant() : "-"); }\n  Console.WriteLine("M\\t" + match.Index + "\\t" + (match.Index + match.Length) + "\\t" + string.Join("\\t", values));\n}\n}`).join("\n")}\n`,
      );
      run("dotnet", ["build", "--nologo", "--verbosity", "quiet"], directory, 60000);
      output = run(
        "dotnet",
        [join(directory, "bin", "Debug", "net10.0", "consumer.dll"), dataPath],
        directory,
      );
    } else if (target === "go") {
      const files = [];
      for (const [i, result] of exports.entries()) {
        const file = join(directory, `case${i}.go`);
        const loop = `for _, input := range []string{${selected[i].inputs.map(goQuote).join(",")}} {\n    indices := regex.FindStringSubmatchIndex(input)\n    if indices == nil { fmt.Println("N"); continue }\n    fmt.Printf("M\\t%d\\t%d\\t%s", len(utf16.Encode([]rune(input[:indices[0]]))), len(utf16.Encode([]rune(input[:indices[1]]))), hex.EncodeToString([]byte(input[indices[0]:indices[1]])))\n    for _, name := range []string{${result.captures.map((c) => JSON.stringify(c.targetName)).join(",")}} {\n      n := regex.SubexpIndex(name) * 2\n      if n < 0 || indices[n] < 0 { fmt.Print("\\t-") } else { fmt.Print("\\t" + hex.EncodeToString([]byte(input[indices[n]:indices[n+1]]))) }\n    }\n    fmt.Println()\n  }`;
        writeFileSync(
          file,
          result.code
            .replace('import "regexp"', 'import ("regexp"; "encoding/hex"; "fmt"; "unicode/utf16")')
            .replace("func main()", `func case${i}()`)
            .replace("_ = regex", loop),
        );
        files.push(file);
      }
      const file = join(directory, "main.go"),
        binary = join(directory, "consumer");
      writeFileSync(
        file,
        `package main\nfunc main() { ${exports.map((_, i) => `case${i}()`).join(";")} }\n`,
      );
      run("go", ["build", "-o", binary, file, ...files], directory, 60000);
      output = run(binary, [], directory);
    } else {
      mkdirSync(join(directory, "src"));
      writeFileSync(
        join(directory, "Cargo.toml"),
        '[package]\nname = "regex-export-consumer"\nversion = "0.0.0"\nedition = "2021"\n[dependencies]\nregex = "=1.13.1"\n',
      );
      const modules = exports.map((result, i) => {
        const body = `for input in [${selected[i].inputs.map(rustQuote).join(",")}] {\n      if let Some(m) = _regex.captures(input) {\n        print!("M\\t{}\\t{}", input[..m.get(0).unwrap().start()].encode_utf16().count(), input[..m.get(0).unwrap().end()].encode_utf16().count());\n        for value in std::iter::once(m.get(0)).chain([${result.captures.map((c) => JSON.stringify(c.targetName)).join(",")}].into_iter().map(|name| m.name(name))) {\n          match value { Some(s) => { print!("\\t"); for byte in s.as_str().as_bytes() { print!("{:02x}", byte); } }, None => print!("\\t-") }\n        }\n        println!();\n      } else { println!("N"); }\n    }\n    Ok(())`;
        return `mod p${i} {\n${result.code.replace("fn main()", "pub fn run()").replace("Ok(())", body)}\n}`;
      });
      writeFileSync(
        join(directory, "src", "main.rs"),
        `${modules.join("\n")}\nfn main() -> Result<(), regex::Error> { ${exports.map((_, i) => `p${i}::run()?;`).join(" ")} Ok(()) }\n`,
      );
      run("cargo", ["build", "--offline", "--quiet"], directory, 60000);
      output = run(join(directory, "target", "debug", "regex-export-consumer"), [], directory);
    }
    const comparisons = validate(target, selected, output);
    console.log(
      `PASS ${target}: ${comparisons} full span/mapped-capture comparisons using generated code.`,
    );
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
