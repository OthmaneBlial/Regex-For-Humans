import { compileAst } from "../src/compiler.js";
import { CompileError } from "../src/diagnostics.js";
import { editGroup } from "../src/edit-group.js";
import { parse, splitLines, validateSourceLength } from "../src/parser.js";

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
  setUnion: ["character set union {", '  "A"', '  "B"', "}"],
  negativeSetUnion: ["not character set union {", '  "A"', '  "B"', "}"],
  setIntersection: [
    "character set intersection {",
    '  range "A" to "Z"',
    '  one of: "A", "E", "I", "O", "U"',
    "}",
  ],
  negativeSetIntersection: [
    "not character set intersection {",
    '  range "A" to "Z"',
    '  one of: "A", "E", "I", "O", "U"',
    "}",
  ],
  setSubtraction: [
    "character set subtraction {",
    '  range "A" to "Z"',
    '  one of: "A", "E", "I", "O", "U"',
    "}",
  ],
  negativeSetSubtraction: [
    "not character set subtraction {",
    '  range "A" to "Z"',
    '  one of: "A", "E", "I", "O", "U"',
    "}",
  ],
};

/** Replace a partial block opener before validating the enclosing block's arity.
 * @param {string} source
 * @param {number} start
 * @param {number} end
 * @param {string} kind
 * @param {{flags?: string}} [options]
 * @param {string} [modifier] Existing single-line repetition prefix at the start of the replacement.
 * @returns {{rules: string, caret: number, header: string}}
 */
export function completeBlock(source, start, end, kind, options = {}, modifier = "") {
  if (typeof source !== "string") throw new TypeError("Rules must be a string.");
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    end > source.length
  )
    throw new TypeError("The completion range must be within the rules.");
  if (!Object.hasOwn(templates, kind) || templates[kind].length < 2)
    throw new TypeError("Choose a supported block type.");
  validateSourceLength(source);
  if (
    typeof modifier !== "string" ||
    modifier.length > end - start ||
    /[\r\n\u2028\u2029]/u.test(modifier) ||
    !source.startsWith(modifier, start)
  )
    throw new TypeError("Keep the existing repetition prefix within the completion range.");
  const before = source.slice(0, start);
  const lines = splitLines(before);
  const indent = lines.at(-1) ?? "";
  if (!/^[\t ]*$/u.test(indent)) throw new TypeError("Complete a standalone rule prefix.");
  const firstLineEnd = splitLines(source)[0].length;
  const separator = source.startsWith("\r\n", firstLineEnd)
    ? "\r\n"
    : (source[firstLineEnd] ?? "\n");
  const template = templates[kind];
  const optional =
    kind === "optional"
      ? /^(optional)([\t ]+|$)/iu.exec(source.slice(start + modifier.length, end))
      : null;
  const opener = optional
    ? `${optional[1]}${optional[2] || " "}${templates.group[0]}`
    : template[0];
  let rules =
    before +
    template.map((text, index) => (index ? indent + text : modifier + opener)).join(separator) +
    separator +
    indent +
    source.slice(end).replace(/^[\t ]+/u, "");
  if (kind === "capture") {
    rules = editGroup(
      rules,
      { line: lines.length, column: indent.length + 1 },
      { capturing: true, name: null },
      options,
    );
  } else compileAst(parse(rules), options);
  const header = splitLines(rules)[lines.length - 1];
  const bodyIndent = template[1].length - template[1].trimStart().length;
  return {
    rules,
    caret: start + header.length + separator.length + bodyIndent,
    header: header.slice(indent.length),
  };
}

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
