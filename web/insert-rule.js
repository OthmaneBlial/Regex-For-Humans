import { compileAst } from "../src/compiler.js";
import { CompileError } from "../src/diagnostics.js";
import { editGroup } from "../src/edit-group.js";
import { parse, splitLines } from "../src/parser.js";

/** @type {Record<string, string[]>} */
const templates = {
  group: ["group {", "  digit", "}"],
  capture: ["group {", "  digit", "}"],
  optional: ["optional group {", '  "A"', "}"],
  alternative: ["either {", '  "A"', '  "B"', "}"],
  repetition: ["between 1 and 3 digits"],
  class: ['one of: "A", "B"'],
  assertion: ["followed by {", "  digit", "}"],
  negativeAhead: ["not followed by {", "  digit", "}"],
  behind: ["preceded by {", "  digit", "}"],
  negativeBehind: ["not preceded by {", "  digit", "}"],
};

/** Insert a validated template without changing existing reference targets.
 * @param {string} source
 * @param {number} caret Native UTF-16 selection start.
 * @param {string} kind
 * @param {{flags?: string}} [options]
 * @returns {{rules: string, line: number, column: number}}
 */
export function insertRule(source, caret, kind, options = {}) {
  if (typeof source !== "string") throw new TypeError("Rules must be a string.");
  if (!Number.isSafeInteger(caret) || caret < 0 || caret > source.length)
    throw new TypeError("The insertion cursor must be within the rules.");
  if (!Object.hasOwn(templates, kind)) throw new TypeError("Choose a supported rule type.");
  /** @type {import('../src/ast.js').ParsedRules|null} */
  let parsed = null;
  try {
    parsed = parse(source);
    compileAst(parsed, options);
  } catch (error) {
    if (!(error instanceof CompileError) || error.code !== "EMPTY_SOURCE") throw error;
  }
  const lines = splitLines(source);
  const offsets = [];
  const separators = [];
  let position = 0;
  for (const line of lines) {
    offsets.push(position);
    position += line.length;
    const separator =
      source.slice(position, position + 2) === "\r\n"
        ? "\r\n"
        : source.slice(position, position + 1);
    separators.push(separator);
    position += separator.length;
  }
  const separator = separators.find(Boolean) ?? "\n";
  let offset = offsets[offsets.findLastIndex((start) => start <= caret)];
  const first = parsed?.nodes[0];
  const last = parsed?.nodes.at(-1);
  if (first?.kind === "anchor" && first.edge === "start") {
    const index = first.location.line - 1;
    offset = Math.max(offset, offsets[index] + lines[index].length + separators[index].length);
  }
  if (last?.kind === "anchor" && last.edge === "end") {
    const start = offsets[last.location.line - 1];
    // Same-line anchors need insertion before the end token rather than before its line.
    offset = Math.min(
      offset,
      first?.kind === "anchor" &&
        first.edge === "start" &&
        first.location.line === last.location.line
        ? start + last.location.column - 1
        : start,
    );
  }
  const lineIndex = offsets.findLastIndex((start) => start <= offset);
  const indent = /^[^\S\r\n\u2028\u2029]*/u.exec(lines[lineIndex])?.[0] ?? "";
  const prefix = source.slice(0, offset);
  const before = prefix && !/[\r\n\u2028\u2029]$/u.test(prefix) ? separator : "";
  const line = splitLines(prefix).length + Number(before !== "");
  const column = indent.length + 1;
  let rules =
    prefix +
    before +
    templates[kind].map((text) => indent + text).join(separator) +
    separator +
    source.slice(offset);
  if (kind === "capture") {
    // Convert a noncapturing prototype so existing numbered references can be remapped safely.
    rules = editGroup(rules, { line, column }, { capturing: true, name: null }, options);
  } else compileAst(parse(rules), options);
  return { rules, line, column };
}
