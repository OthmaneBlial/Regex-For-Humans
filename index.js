import { compileAst } from "./src/compiler.js";
import { parse } from "./src/parser.js";

/** Compile controlled-English rules into JavaScript regex source, flags and source mapping.
 * @param {string} source @param {{flags?: string}} [options]
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

/** Create a native RegExp from a successful compile result.
 * @param {ReturnType<typeof compile>} result
 */
export function toRegExp(result) {
  if (!result || typeof result.source !== "string" || typeof result.flags !== "string") {
    throw new TypeError("Expected a compile result with source and flags.");
  }
  return new RegExp(result.source, result.flags);
}

export { CompileError } from "./src/diagnostics.js";
