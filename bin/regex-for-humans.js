#!/usr/bin/env node

import { createReadStream, readFileSync } from "node:fs";
import { exit, stderr, stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { CompileError, compile } from "../index.js";
import { LIMITS, validateSourceLength } from "../src/parser.js";

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
/** @type {string|undefined} */
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

/** @param {import("node:stream").Readable} stream */
async function readInput(stream) {
  /** @type {string[]} */
  const chunks = [];
  let length = 0;
  stream.setEncoding("utf8");
  for await (const chunk of stream) {
    const text = String(chunk);
    length += text.length;
    if (length > LIMITS.sourceLength) {
      stream.destroy();
      validateSourceLength(length);
    }
    chunks.push(text);
  }
  return chunks.join("");
}

try {
  const input = await readInput(
    file === undefined || file === "-" ? stdin : createReadStream(file),
  );
  const result = compile(input, { flags });
  if (json) {
    stdout.write(`${JSON.stringify(result)}\n`);
  } else {
    stdout.write(`/${result.source}/${result.flags}\n`);
    if (explain) {
      for (const segment of result.segments) {
        stdout.write(
          `${segment.line}:${segment.column}  ${segment.source}  ${segment.explanation}\n`,
        );
      }
    }
  }
} catch (error) {
  if (error instanceof CompileError) {
    stderr.write(
      json
        ? `${JSON.stringify({ error: error.toJSON() })}\n`
        : `Line ${error.line}, column ${error.column}: ${error.message}${error.hint ? `\n${error.hint}` : ""}\n`,
    );
  } else {
    stderr.write(`${String(error)}\n`);
  }
  exit(1);
}
