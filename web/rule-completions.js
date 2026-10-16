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

/** @param {string} source @param {number} start @param {number} end
 * @param {{line: number, column: number}} cursor @param {{flags?: string}} options
 */
function closedCaptures(source, start, end, cursor, options) {
  // Repair only this reference while inspecting the surrounding closed capture scope.
  const context = compileAst(parse(`${source.slice(0, start)}digit${source.slice(end)}`), options);
  return context.segments
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
}

/** @param {string} raw @returns {{value: string, hex: string|null}|null} */
function namePrefix(raw) {
  try {
    return { value: JSON.parse(`"${raw}"`), hex: null };
  } catch {
    const pendingEscape = /\\(?:u[0-9a-fA-F]{0,3})?$/u.exec(raw);
    if (!pendingEscape) return null;
    try {
      return {
        value: JSON.parse(`"${raw.slice(0, pendingEscape.index)}"`),
        hex: pendingEscape[0].slice(2).toLowerCase(),
      };
    } catch {
      return null;
    }
  }
}

/** @param {string} name @param {{value: string, hex: string|null}} prefix */
function startsName(name, prefix) {
  return (
    name.startsWith(prefix.value) &&
    (prefix.hex === null ||
      (name.length > prefix.value.length &&
        name.charCodeAt(prefix.value.length).toString(16).padStart(4, "0").startsWith(prefix.hex)))
  );
}

/** @param {string} source @param {number} caret @param {import('./syntax.js').SyntaxToken[]} tokens
 * @param {number} index @param {{flags?: string}} options
 * @returns {{text: string, rules: string, caret: number, preview: string}[]}
 */
function quotedReferences(source, caret, tokens, index, options) {
  const quote = tokens[index];
  const gap = tokens[index - 1];
  const phrase = tokens[index - 2];
  if (
    !gap ||
    !phrase ||
    !/^[^\S\r\n\u2028\u2029]+$/u.test(source.slice(gap.start, gap.end)) ||
    phrase.kind !== "capture" ||
    source.slice(phrase.start, phrase.end).toLowerCase().replace(/\s+/gu, " ") !==
      BACKREFERENCE_RULE
  )
    return [];
  const separator = source.slice(quote.start).search(/[\r\n\u2028\u2029]/u);
  const lineEnd = separator < 0 ? source.length : quote.start + separator;
  if (caret > lineEnd) return [];
  let closed = false;
  let end = quote.start + 1;
  // Highlight tokens can merge adjacent strings; retain this literal's own boundary.
  for (; end < lineEnd; end++) {
    if (source[end] === "\\") end++;
    else if (source[end] === '"') {
      end++;
      closed = true;
      break;
    }
  }
  if (closed && caret >= end) return [];
  if (!closed) {
    const boundary = source.slice(quote.start + 1, lineEnd).search(/[\s#]/u);
    end = boundary < 0 ? lineEnd : quote.start + 1 + boundary;
  }
  if (caret > end) return [];
  const prefix = namePrefix(source.slice(quote.start + 1, caret));
  const whole = closed ? null : namePrefix(source.slice(quote.start + 1, end));
  if (!prefix || (!closed && !whole)) return [];
  const lines = splitLines(source.slice(0, quote.start));
  const cursor = { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
  try {
    const results = [];
    for (const capture of closedCaptures(source, phrase.start, end, cursor, options)) {
      if (
        capture.name === null ||
        !startsName(capture.name, prefix) ||
        (whole && !startsName(capture.name, whole))
      )
        continue;
      const text = quoteText(capture.name);
      const rules = source.slice(0, quote.start) + text + source.slice(end);
      if (rules === source) continue;
      try {
        compileAst(parse(rules), options);
      } catch (error) {
        if (error instanceof CompileError) continue;
        throw error;
      }
      results.push({
        text: `${BACKREFERENCE_RULE} ${text}`,
        rules,
        caret: quote.start + text.length,
        preview: rules,
      });
    }
    return results;
  } catch (error) {
    if (error instanceof CompileError) return [];
    throw error;
  }
}

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
  for (const [index, token] of tokens.entries()) {
    if (caret <= token.start || caret > token.end) continue;
    if (token.kind === "comment") return [];
    if (source[token.start] === '"' && (caret < token.end || token.kind === "invalid"))
      return quotedReferences(source, caret, tokens, index, options);
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
        const captures = closedCaptures(source, prefix.start, end, cursor, options);
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
