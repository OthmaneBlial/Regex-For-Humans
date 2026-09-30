import { fail } from "./diagnostics.js";
import { explainNode } from "./explain.js";

/** @typedef {import('./ast.js').AtomNode} AtomNode */
/** @typedef {import('./ast.js').Repetition} Repetition */
/** @typedef {import('./ast.js').ParsedRules} ParsedRules */

const locationOfOptions = { line: 1, column: 1 };

/** @param {string} character @param {boolean} inClass */
function escapeCharacter(character, inClass) {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) throw new TypeError("Cannot escape an empty character.");
  if (
    codePoint < 0x20 ||
    codePoint === 0x7f ||
    codePoint === 0x2028 ||
    codePoint === 0x2029 ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff)
  ) {
    return `\\u{${codePoint.toString(16)}}`;
  }
  const special = inClass ? /[\\[\]\-^/]/u : /[\\.*+?^${}()|[\]/]/u;
  return special.test(character) ? `\\${character}` : character;
}

/** @param {string} value */
function escapeLiteral(value) {
  return [...value].map((character) => escapeCharacter(character, false)).join("");
}

/** @param {string[]} values */
function escapeClass(values) {
  return values.map((character) => escapeCharacter(character, true)).join("");
}

/** @param {Repetition|null} repetition */
function repetitionSource(repetition) {
  if (!repetition) return "";
  switch (repetition.kind) {
    case "zeroOrMore":
      return "*";
    case "oneOrMore":
      return "+";
    case "exact":
      return `{${repetition.min}}`;
    case "range":
      return `{${repetition.min},${repetition.max}}`;
    default:
      throw new TypeError("Unknown repetition kind.");
  }
}

/** @param {AtomNode} node */
function atomSource(node) {
  let source;
  switch (node.atomType) {
    case "wildcard":
    case "shorthand":
      source = node.value;
      break;
    case "literal":
      source = escapeLiteral(node.value);
      if (node.repetition && [...node.value].length > 1) source = `(?:${source})`;
      break;
    case "charSet":
      source = `[${node.negative ? "^" : ""}${escapeClass(node.value)}]`;
      break;
    default:
      throw new TypeError("Unknown atom type.");
  }
  return source + repetitionSource(node.repetition);
}

/** @param {unknown} options */
function normalizeOptions(options) {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Options must be an object.");
  }
  let requested = "flags" in options ? options.flags : "";
  if (requested === undefined) requested = "";
  if (
    typeof requested !== "string" ||
    /[^is]/u.test(requested) ||
    new Set(requested).size !== requested.length
  ) {
    fail(
      "UNSUPPORTED_FLAGS",
      "Version 1 accepts only unique i and s option flags; u is always enabled and m is controlled by line anchors.",
      locationOfOptions,
    );
  }
  return requested;
}

/** @param {ParsedRules} parsed @param {{flags?: string}} [options] */
export function compileAst(parsed, options = {}) {
  const requested = normalizeOptions(options);
  const flags = `${requested.includes("i") ? "i" : ""}${parsed.anchorMode === "line" ? "m" : ""}${requested.includes("s") ? "s" : ""}u`;
  let source = "";
  const segments = [];

  for (const [index, node] of parsed.nodes.entries()) {
    const fragment =
      node.kind === "anchor" ? (node.edge === "start" ? "^" : "$") : atomSource(node);
    const sourceStart = source.length;
    source += fragment;
    segments.push({
      sourceStart,
      sourceEnd: source.length,
      source: fragment,
      text: node.text,
      explanation: explainNode(node, flags, index + 1 < parsed.nodes.length),
      line: node.location.line,
      column: node.location.column,
      kind: node.kind,
      ...(node.kind === "anchor"
        ? { edge: node.edge, mode: node.mode }
        : {
            atomType: node.atomType,
            repetition: node.repetition,
            ...(node.atomType === "charSet" ? { negative: node.negative } : {}),
          }),
    });
  }

  try {
    new RegExp(source, flags);
  } catch (error) {
    throw new Error(`Compiler emitted invalid JavaScript regex: ${String(error)}`, {
      cause: error,
    });
  }
  return { source, flags, segments };
}
