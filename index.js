import { compileAst } from "./src/compiler.js";
import { fail } from "./src/diagnostics.js";
import { modifierGroupStart, supportsModifiers } from "./src/flags.js";
import { parse } from "./src/parser.js";
import { regexToRules } from "./src/regex-to-rules.js";

/** Compile controlled-English rules into JavaScript regex source, flags and source mapping.
 * @param {string} source @param {{flags?: string | undefined}} [options]
 */
export function compile(source, options = {}) {
  return compileAst(parse(source), options);
}

/** Preserve the original function name for callers who only need the source.
 * @param {string} lines
 */
export function regexMatchingThroughLines(lines) {
  return compile(lines).source;
}

/** Create a native RegExp from a compile result or its source/flags metadata.
 * @param {ReturnType<typeof compile> | Pick<ReturnType<typeof compile>, "source" | "flags">} result
 */
export function toRegExp(result) {
  const source = result ? result.source : undefined;
  const flags = typeof source === "string" ? result.flags : undefined;
  if (typeof source !== "string" || typeof flags !== "string") {
    throw new TypeError("Expected a compile result with source and flags.");
  }
  const regex = new RegExp(source, flags);
  const groupStart = modifierGroupStart(source, regex.flags.includes("v"));
  if (groupStart >= 0 && !supportsModifiers(regex.flags)) {
    const lines = source.slice(0, groupStart).split(/\r\n|[\n\r\u2028\u2029]/u);
    fail(
      "UNSUPPORTED_TARGET_FEATURE",
      "This JavaScript runtime does not support native scoped i/m/s flag groups correctly.",
      { line: lines.length, column: (lines.at(-1) ?? "").length + 1 },
      "Use a runtime with verified native scoped modifier support; cached source cannot bypass runtime compatibility.",
    );
  }
  return regex;
}

export { analyze } from "./src/analyze.js";
export { CompileError } from "./src/diagnostics.js";
export { toSVG } from "./src/diagram.js";
export { editGroup } from "./src/edit-group.js";
export { exportRegex } from "./src/export.js";
export { regexToRules };
