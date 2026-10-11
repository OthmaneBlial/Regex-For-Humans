import { compileAst } from "../src/compiler.js";
import { CompileError } from "../src/diagnostics.js";
import { parse, SHORTHAND_RULES } from "../src/parser.js";
import { tokenizeRules } from "./syntax.js";

const maxWords = Math.max(...SHORTHAND_RULES.map((text) => text.split(" ").length));

/** Complete shorthand atoms without adding captures or rewriting surrounding rules.
 * @param {string} source
 * @param {number} caret Native UTF-16 selection position.
 * @param {{flags?: string}} [options]
 * @returns {{text: string, rules: string, caret: number}[]}
 */
export function ruleCompletions(source, caret, options = {}) {
  if (typeof source !== "string") throw new TypeError("Rules must be a string.");
  if (!Number.isSafeInteger(caret) || caret < 0 || caret > source.length)
    throw new TypeError("The completion cursor must be within the rules.");
  const tokens = tokenizeRules(source);
  if (!tokens) return [];
  for (const token of tokens) {
    if (caret <= token.start || caret > token.end) continue;
    if (
      token.kind === "comment" ||
      (source[token.start] === '"' && (caret < token.end || token.kind === "invalid"))
    )
      return [];
  }
  const before = source.slice(0, caret);
  const lineStart =
    Math.max(...["\n", "\r", "\u2028", "\u2029"].map((c) => before.lastIndexOf(c))) + 1;
  const line = before.slice(lineStart);
  let fragmentStart = line.length;
  while (fragmentStart && /[A-Za-z\t ]/u.test(line[fragmentStart - 1])) fragmentStart--;
  const fragment = line.slice(fragmentStart);
  const prefixes = [];
  if (fragment) {
    for (const word of [...fragment.matchAll(/[A-Za-z]+/gu)].slice(-maxWords)) {
      const start = lineStart + fragmentStart + word.index;
      if (start > lineStart && !/[\t ]/u.test(source[start - 1])) continue;
      prefixes.push({
        start,
        text: before
          .slice(start)
          .toLowerCase()
          .replace(/[\t ]+/gu, " "),
      });
    }
  }
  if (!line || /[\t ]$/u.test(line)) prefixes.push({ start: caret, text: "" });
  const end = caret + (/^[A-Za-z]*/u.exec(source.slice(caret))?.[0].length ?? 0);
  const results = [];
  const seen = new Set();
  for (const prefix of prefixes) {
    for (const text of SHORTHAND_RULES) {
      if (!text.startsWith(prefix.text)) continue;
      const rules = source.slice(0, prefix.start) + text + source.slice(end);
      if (rules === source || seen.has(rules)) continue;
      try {
        compileAst(parse(rules), options);
      } catch (error) {
        if (error instanceof CompileError) continue;
        throw error;
      }
      seen.add(rules);
      results.push({ text, rules, caret: prefix.start + text.length });
    }
  }
  return results;
}
