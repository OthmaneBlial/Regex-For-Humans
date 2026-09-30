#!/usr/bin/env node

import { createReadStream, readFileSync } from "node:fs";
import { stderr, stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { CompileError, compile } from "../index.js";
import { escapeControls } from "../src/display.js";
import { LIMITS, validateSourceLength } from "../src/parser.js";

const usage = `Usage: regex-for-humans [options] [--] [file|-]

Compile controlled English into a JavaScript regex.
Read a file or stdin; use - for stdin.

Options:
  --json         Print a result or error as JSON
  --explain      Explain each generated fragment
  --ignore-case  Add the JavaScript i flag
  --dot-all      Add the JavaScript s flag
  --             Treat the next argument as the input path
  --help         Show this help
  --version      Show the package version
`;

async function main() {
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

  /** @param {unknown} error */
  function reportError(error) {
    process.exitCode = 1;
    if (json) {
      const detail =
        error instanceof CompileError
          ? error.toJSON()
          : {
              code: "CLI_ERROR",
              message: error instanceof Error ? error.message : String(error),
            };
      stderr.write(`${escapeControls(JSON.stringify({ error: detail }))}\n`);
    } else if (error instanceof CompileError) {
      stderr.write(
        `Line ${error.line}, column ${error.column}: ${escapeControls(error.message)}${error.hint ? `\n${escapeControls(error.hint)}` : ""}\n`,
      );
    } else {
      stderr.write(`${escapeControls(String(error))}\n`);
    }
  }

  stdout.on("error", reportError);
  stderr.on("error", () => {
    // A broken diagnostic stream cannot report its own write failure.
    process.exitCode ||= 1;
  });

  /** @param {string} message */
  function usageError(message) {
    if (json)
      stderr.write(
        `${escapeControls(JSON.stringify({ error: { code: "CLI_USAGE", message } }))}\n`,
      );
    else stderr.write(`${escapeControls(message)}\n${usage}`);
    process.exitCode = 2;
  }

  for (const arg of args) {
    if (!optionsEnded && arg === "--") {
      optionsEnded = true;
      continue;
    }
    if (!optionsEnded && (arg === "--help" || arg === "-h")) {
      stdout.write(usage);
      return;
    }
    if (!optionsEnded && arg === "--version") {
      const packagePath = fileURLToPath(new URL("../package.json", import.meta.url));
      stdout.write(`${JSON.parse(readFileSync(packagePath, "utf8")).version}\n`);
      return;
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
      return usageError(`Unknown option: ${arg}`);
    }
    if (file !== undefined) {
      return usageError("Only one input file is allowed.");
    }
    file = arg;
  }

  if (file === undefined && stdin.isTTY) {
    return usageError("Pass an input file or pipe rules to standard input.");
  }

  /** @param {import("node:stream").Readable} stream */
  async function readInput(stream) {
    /** @type {string[]} */
    const chunks = [];
    let length = 0;
    // Keep a leading BOM in source positions while rejecting malformed UTF-8.
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    for await (const chunk of stream) {
      const text = decoder.decode(chunk, { stream: true });
      length += text.length;
      if (length > LIMITS.sourceLength) {
        stream.destroy();
        validateSourceLength(chunks.join("") + text);
      }
      chunks.push(text);
    }
    decoder.decode();
    return chunks.join("");
  }

  try {
    const input = await readInput(
      file === undefined || file === "-" ? stdin : createReadStream(file),
    );
    const result = compile(input, { flags });
    if (json) {
      stdout.write(`${escapeControls(JSON.stringify(result))}\n`);
    } else {
      stdout.write(`/${escapeControls(result.source)}/${result.flags}\n`);
      if (explain) {
        for (const segment of result.segments) {
          stdout.write(
            `${segment.line}:${segment.column}  ${escapeControls(segment.source)}  ${escapeControls(segment.explanation)}\n`,
          );
        }
      }
    }
  } catch (error) {
    reportError(error);
  }
}

await main();
