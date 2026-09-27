#!/usr/bin/env node

import { createReadStream, readFileSync } from "node:fs";
import { exit, stderr, stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { CompileError, compile } from "../index.js";
import { LIMITS, validateSourceLength } from "../src/parser.js";

const usage = `Usage: regex-for-humans [options] [--] [file|-]

Compile controlled-English rules from a file or standard input.
Use - to read standard input explicitly.

Options:
  --json      Print a result or error as JSON
  --explain   Print each generated fragment and its meaning
  --ignore-case  Add the JavaScript i flag
  --dot-all      Add the JavaScript s flag
  --          Treat the following argument as the input path
  --help      Show this help
  --version   Show the package version
`;

const args = process.argv.slice(2);
let json = false;
for (const arg of args) {
  if (arg === "--") break;
  if (arg === "--json") {
    json = true;
    break;
  }
}
let explain = false;
let flags = "";
let optionsEnded = false;
/** @type {string|undefined} */
let file;

/** @param {string} message */
function usageError(message) {
  if (json) stderr.write(`${JSON.stringify({ error: { code: "CLI_USAGE", message } })}\n`);
  else stderr.write(`${message}\n${usage}`);
  exit(2);
}

for (const arg of args) {
  if (!optionsEnded && arg === "--") {
    optionsEnded = true;
    continue;
  }
  if (!optionsEnded && (arg === "--help" || arg === "-h")) {
    stdout.write(usage);
    exit(0);
  }
  if (!optionsEnded && arg === "--version") {
    const packagePath = fileURLToPath(new URL("../package.json", import.meta.url));
    stdout.write(`${JSON.parse(readFileSync(packagePath, "utf8")).version}\n`);
    exit(0);
  }
  if (!optionsEnded && arg === "--json") {
    json = true;
    continue;
  }
  if (!optionsEnded && arg === "--explain") {
    explain = true;
    continue;
  }
  if (!optionsEnded && arg === "--ignore-case") {
    if (!flags.includes("i")) flags += "i";
    continue;
  }
  if (!optionsEnded && arg === "--dot-all") {
    if (!flags.includes("s")) flags += "s";
    continue;
  }
  if (!optionsEnded && arg.startsWith("-") && arg !== "-") {
    usageError(`Unknown option: ${arg}`);
  }
  if (file !== undefined) {
    usageError("Only one input file is allowed.");
  }
  file = arg;
}

if (file === undefined && stdin.isTTY) {
  usageError("Pass an input file or pipe rules to standard input.");
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
      validateSourceLength(chunks.join("") + text);
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
  if (json) {
    const detail =
      error instanceof CompileError
        ? error.toJSON()
        : {
            code: "CLI_ERROR",
            message: error instanceof Error ? error.message : String(error),
          };
    stderr.write(`${JSON.stringify({ error: detail })}\n`);
  } else if (error instanceof CompileError) {
    stderr.write(
      `Line ${error.line}, column ${error.column}: ${error.message}${error.hint ? `\n${error.hint}` : ""}\n`,
    );
  } else {
    stderr.write(`${String(error)}\n`);
  }
  exit(1);
}
