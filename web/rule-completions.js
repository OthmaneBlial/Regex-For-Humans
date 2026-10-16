import { compileAst } from "../src/compiler.js";
import { CompileError } from "../src/diagnostics.js";
import { quoteText } from "../src/display.js";
import { BACKREFERENCE_RULE, parse, SHORTHAND_RULES, splitLines } from "../src/parser.js";
import { completeBlock } from "./insert-rule.js";
import { tokenizeRules } from "./syntax.js";

const blocks = [
  ["group {", "group"],
  ["capture {", "capture"],
  ["optional group {", "optional"],
  ["either {", "alternative"],
  ["followed by {", "assertion"],
  ["not followed by {", "negativeAhead"],
  ["preceded by {", "behind"],
  ["not preceded by {", "negativeBehind"],
  ["character set union {", "setUnion"],
  ["not character set union {", "negativeSetUnion"],
  ["character set intersection {", "setIntersection"],
  ["not character set intersection {", "negativeSetIntersection"],
  ["character set subtraction {", "setSubtraction"],
  ["not character set subtraction {", "negativeSetSubtraction"],
];

const maxWords = Math.max(
  ...SHORTHAND_RULES.map((text) => text.split(" ").length),
  BACKREFERENCE_RULE.split(" ").length + 1,
);

/** Complete validated atoms, references and balanced builder templates.
 * @param {string} source
 * @param {number} caret Native UTF-16 selection position.
 * @param {{flags?: string}} [options]
 * @returns {{text: string, rules: string, caret: number, preview?: string}[]}
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
  while (fragmentStart && /[A-Za-z0-9\t ]/u.test(line[fragmentStart - 1])) fragmentStart--;
  const fragment = line.slice(fragmentStart);
  const prefixes = [];
  if (fragment) {
    for (const word of [...fragment.matchAll(/[A-Za-z0-9]+/gu)].slice(-maxWords)) {
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
  const end = caret + (/^[A-Za-z0-9]*/u.exec(source.slice(caret))?.[0].length ?? 0);
  const suffix = source.slice(end).split(/[\r\n\u2028\u2029]/u, 1)[0];
  const logicalLines = splitLines(before);
  const cursor = { line: logicalLines.length, column: (logicalLines.at(-1)?.length ?? 0) + 1 };
  const results = [];
  const seen = new Set();
  const blockHeaders = new Set();
  for (const prefix of prefixes) {
    const candidates = [...SHORTHAND_RULES];
    if (
      BACKREFERENCE_RULE.startsWith(prefix.text) ||
      prefix.text.startsWith(`${BACKREFERENCE_RULE} `)
    ) {
      try {
        // A harmless atom repairs this phrase only; existing captures and reference targets stay intact.
        const context = compileAst(
          parse(source.slice(0, prefix.start) + "digit" + source.slice(end)),
          options,
        );
        const captures = context.segments
          .flatMap((segment) =>
            segment.kind === "group" &&
            segment.edge === "end" &&
            segment.capturing &&
            typeof segment.captureIndex === "number" &&
            (segment.line < cursor.line ||
              (segment.line === cursor.line && segment.column < cursor.column))
              ? [{ index: segment.captureIndex, name: segment.name }]
              : [],
          )
          .sort((a, b) => a.index - b.index);
        for (const capture of captures) {
          candidates.push(`${BACKREFERENCE_RULE} ${capture.index}`);
          if (capture.name !== null)
            candidates.push(`${BACKREFERENCE_RULE} ${quoteText(capture.name)}`);
        }
      } catch (error) {
        if (!(error instanceof CompileError)) throw error;
      }
    }
    for (const text of candidates) {
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
    if (!/^[\t ]*(?:#.*)?$/u.test(suffix)) continue;
    const leading = source.slice(lineStart, prefix.start);
    const indent = /^[\t ]*/u.exec(leading)?.[0] ?? "";
    const modifier = leading.slice(indent.length);
    const modifierTokens = tokenizeRules(modifier);
    if (
      !modifierTokens ||
      modifierTokens.some(
        (token) =>
          token.kind !== "quantifier" && !/^[\t ]*$/u.test(modifier.slice(token.start, token.end)),
      )
    )
      continue;
    for (const [text, kind] of blocks) {
      if (!text.startsWith(prefix.text)) continue;
      const header = modifier + text;
      const headerKey = header.toLowerCase().replace(/[\t ]+/gu, " ");
      if (blockHeaders.has(headerKey)) continue;
      try {
        const added = completeBlock(
          source,
          lineStart + indent.length,
          end,
          kind,
          options,
          modifier,
        );
        if (seen.has(added.rules)) continue;
        seen.add(added.rules);
        blockHeaders.add(headerKey);
        // Capturing templates remap existing numbered references; preview the whole proposed document.
        results.push({
          text: added.header,
          rules: added.rules,
          caret: added.caret,
          preview: added.rules,
        });
      } catch (error) {
        if (!(error instanceof CompileError)) throw error;
      }
    }
  }
  return results;
}
