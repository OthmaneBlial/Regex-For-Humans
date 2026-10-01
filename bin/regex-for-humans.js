#!/usr/bin/env node

import { createReadStream, readFileSync } from "node:fs";
import { stderr, stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { CompileError, compile, regexToRules } from "../index.js";
import { escapeControls } from "../src/display.js";
import { LIMITS, validateSourceLength } from "../src/parser.js";
import {
  parseRegexLiteral,
  REGEX_LITERAL_INPUT_LIMIT,
  validateRegexLiteralLength,
} from "../src/regex-literal.js";

const usage = String.raw`Usage: regex-for-humans [options] [--] [file|-]

Compile controlled English into a JavaScript regex.
Read a file or stdin; use - for stdin.
Use --reverse to translate a slash-delimited regex back into rules.

Options:
  --json         Print a result or error as JSON
  --reverse      Translate a JavaScript regex literal into rules
  --explain      Explain each generated fragment
  --ignore-case  Add the JavaScript i flag
  --dot-all      Add the JavaScript s flag
  --             Treat the next argument as the input path
  --help         Show this help
  --version      Show the package version

Example (POSIX shell):
  printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
  # /^ABC\d{3}$/u

Exit codes:
  0  Success, help or version
  1  Invalid rules, input or output error
  2  Invalid command arguments
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
  let reverse = false;
  let flags = "";
  let optionsEnded = false;
  /** @type {string|undefined} */
  let file;

  /** @param {unknown} error */
  function reportError(error) {
    if (
      error instanceof TypeError &&
      "code" in error &&
      error.code === "ERR_ENCODING_INVALID_ENCODED_DATA"
    ) {
      error = new Error("Input must be valid UTF-8. Save the input as UTF-8 and try again.");
    }
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
    if (!optionsEnded && arg === "--reverse") {
      reverse = true;
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

  if (reverse && (explain || flags)) {
    return usageError("--reverse cannot be combined with --explain, --ignore-case or --dot-all.");
  }

  if (file === undefined && stdin.isTTY) {
    return usageError(
      reverse
        ? "Pass an input file or pipe a regex literal to standard input."
        : "Pass an input file or pipe rules to standard input.",
    );
  }

  /** @param {import("node:stream").Readable} stream */
  async function readInput(stream) {
    /** @type {string[]} */
    const chunks = [];
    let length = 0;
    const inputLimit = reverse ? REGEX_LITERAL_INPUT_LIMIT : LIMITS.sourceLength;
    // Keep a leading BOM in source positions while rejecting malformed UTF-8.
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    for await (const chunk of stream) {
      const text = decoder.decode(chunk, { stream: true });
      length += text.length;
      if (length > inputLimit) {
        stream.destroy();
        const source = chunks.join("") + text;
        if (reverse) validateRegexLiteralLength(source);
        else validateSourceLength(source);
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
    if (reverse) {
      const translated = regexToRules(parseRegexLiteral(input));
      if (json) stdout.write(`${escapeControls(JSON.stringify(translated))}\n`);
      else {
        stdout.write(`${translated.rules}\n`);
        if (translated.flags) {
          const options = [...translated.flags]
            .map((flag) => (flag === "i" ? "--ignore-case" : "--dot-all"))
            .join(" ");
          stderr.write(
            `Compile these rules with ${options} to preserve the regex flags, or use --json.\n`,
          );
        }
      }
      return;
    }
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
