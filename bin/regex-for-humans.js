#!/usr/bin/env node

import { readFile, readFileSync } from "node:fs";
import { stdin, stdout, stderr, exit } from "node:process";
import { fileURLToPath } from "node:url";
import { compile, CompileError } from "../index.js";

const usage = `Usage: regex-for-humans [--json] [file|-]

Compile controlled-English rules from a file or standard input.
Use - to read standard input explicitly.

Options:
  --json      Print source and flags as JSON
  --explain   Print each generated fragment and its meaning
  --ignore-case  Add the JavaScript i flag
  --dot-all      Add the JavaScript s flag
  --help      Show this help
  --version   Show the package version
`;

const args = process.argv.slice(2);
let json = false;
let explain = false;
let flags = "";
let file;

for (const arg of args) {
  if (arg === "--help" || arg === "-h") {
    stdout.write(usage);
    exit(0);
  }
  if (arg === "--version") {
    const packagePath = fileURLToPath(new URL("../package.json", import.meta.url));
    stdout.write(`${JSON.parse(readFileSync(packagePath, "utf8")).version}\n`);
    exit(0);
  }
  if (arg === "--json") {
    json = true;
    continue;
  }
  if (arg === "--explain") {
    explain = true;
    continue;
  }
  if (arg === "--ignore-case") {
    if (!flags.includes("i")) flags += "i";
    continue;
  }
  if (arg === "--dot-all") {
    if (!flags.includes("s")) flags += "s";
    continue;
  }
  if (arg.startsWith("-") && arg !== "-") {
    stderr.write(`Unknown option: ${arg}\n${usage}`);
    exit(2);
  }
  if (file !== undefined) {
    stderr.write(`Only one input file is allowed.\n${usage}`);
    exit(2);
  }
  file = arg;
}

if (file === undefined && stdin.isTTY) {
  stderr.write(usage);
  exit(2);
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stdin.setEncoding("utf8");
    stdin.on("data", chunk => chunks.push(chunk));
    stdin.on("end", () => resolve(chunks.join("")));
    stdin.on("error", reject);
  });
}

try {
  const input = file === undefined || file === "-"
    ? await readStdin()
    : await new Promise((resolve, reject) => readFile(file, "utf8", (error, data) => error ? reject(error) : resolve(data)));
  const result = compile(input, { flags });
  if (json) {
    stdout.write(`${JSON.stringify(result)}\n`);
  } else {
    stdout.write(`/${result.source}/${result.flags}\n`);
    if (explain) {
      for (const segment of result.segments) {
        stdout.write(`${segment.line}:${segment.column}  ${segment.source}  ${segment.explanation}\n`);
      }
    }
  }
} catch (error) {
  if (error instanceof CompileError) {
    stderr.write(json
      ? `${JSON.stringify({ error: error.toJSON() })}\n`
      : `Line ${error.line}, column ${error.column}: ${error.message}${error.hint ? `\n${error.hint}` : ""}\n`);
  } else {
    stderr.write(`${error.message}\n`);
  }
  exit(1);
}
