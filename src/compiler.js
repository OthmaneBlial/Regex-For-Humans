import { fail } from "./diagnostics.js";
import { escapeControls, quoteText } from "./display.js";
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
  let source;
  switch (repetition.kind) {
    case "zeroOrMore":
      source = "*";
      break;
    case "oneOrMore":
      source = "+";
      break;
    case "exact":
      source = `{${repetition.min}}`;
      break;
    case "range":
      source = `{${repetition.min},${repetition.max}}`;
      break;
    case "atLeast":
      source = `{${repetition.min},}`;
      break;
    default:
      throw new TypeError("Unknown repetition kind.");
  }
  return source + (repetition.lazy ? "?" : "");
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
    case "unicodeProperty":
      source = `\\${node.negative ? "P" : "p"}{${node.value}}`;
      break;
    default:
      throw new TypeError("Unknown atom type.");
  }
  return escapeControls(source + repetitionSource(node.repetition));
}

/** @param {unknown} options */
function normalizeOptions(options) {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Options must be an object.");
  }
  let requested = "flags" in options ? options.flags : "";
  if (requested === undefined) requested = "";
  if (typeof requested !== "string" || !["", "i", "s", "is", "si"].includes(requested)) {
    fail(
      "UNSUPPORTED_FLAGS",
      "Version 1 accepts only unique i and s option flags; u is always enabled and m is controlled by line anchors.",
      locationOfOptions,
    );
  }
  return requested;
}

/** @param {ParsedRules} parsed @param {{flags?: string | undefined}} [options] */
export function compileAst(parsed, options = {}) {
  const requested = normalizeOptions(options);
  const flags = `${requested.includes("i") ? "i" : ""}${parsed.anchorMode === "line" ? "m" : ""}${requested.includes("s") ? "s" : ""}u`;
  let source = "";
  /** @type {import('../index.d.ts').RegexSegment[]} */
  const segments = [];
  let checkedLookbehind = false;
  let checkedUnicodeProperties = false;

  /** @param {import('./ast.js').RuleNode[]} nodes */
  function emit(nodes) {
    for (const [index, node] of nodes.entries()) {
      if (node.kind === "atom" && node.atomType === "unicodeProperty") {
        if (!checkedUnicodeProperties) {
          try {
            // biome-ignore lint/complexity/useRegexLiterals: feature detection must catch unsupported syntax at runtime.
            new RegExp("\\p{ASCII}", "u");
          } catch {
            fail(
              "UNSUPPORTED_TARGET_FEATURE",
              "This JavaScript runtime does not support Unicode property escapes.",
              node.location,
              "Use a runtime with native Unicode property support; the property cannot be approximated.",
            );
          }
          checkedUnicodeProperties = true;
        }
        try {
          new RegExp(`\\${node.negative ? "P" : "p"}{${node.value}}`, flags);
        } catch {
          fail(
            "INVALID_UNICODE_PROPERTY",
            `The Unicode property ${quoteText(node.value)} is not recognized by this JavaScript runtime.`,
            node.propertyLocation,
            "Use a case-sensitive character property such as `Letter`, `Script=Greek` or `Script_Extensions=Greek` supported in u mode.",
          );
        }
      }
      if (node.kind === "assertion") {
        if (node.direction === "behind" && !checkedLookbehind) {
          try {
            // biome-ignore lint/complexity/useRegexLiterals: feature detection must catch unsupported syntax at runtime.
            new RegExp("(?<=a)b", "u");
          } catch {
            fail(
              "UNSUPPORTED_TARGET_FEATURE",
              "This JavaScript runtime does not support lookbehind assertions.",
              node.location,
              "Use a runtime with native lookbehind support; the assertion cannot be approximated.",
            );
          }
          checkedLookbehind = true;
        }
        const sourceStart = source.length;
        const fragment = `(?${node.direction === "behind" ? "<" : ""}${node.negative ? "!" : "="}`;
        source += fragment;
        const details = { direction: node.direction, negative: node.negative };
        segments.push({
          kind: "assertion",
          edge: "start",
          ...details,
          sourceStart,
          sourceEnd: source.length,
          source: fragment,
          text: node.text,
          explanation: explainNode(node, flags),
          ...node.location,
        });
        emit(node.nodes);
        const endStart = source.length;
        source += ")";
        segments.push({
          kind: "assertion",
          edge: "end",
          ...details,
          sourceStart: endStart,
          sourceEnd: source.length,
          source: ")",
          text: "}",
          explanation: "End assertion. The input position is unchanged.",
          ...node.endLocation,
        });
        continue;
      }
      if (node.kind === "alternation") {
        const sourceStart = source.length;
        source += "(?:";
        segments.push({
          kind: "alternation",
          edge: "start",
          alternatives: node.branches.length,
          repetition: node.repetition,
          sourceStart,
          sourceEnd: source.length,
          source: "(?:",
          text: node.text,
          explanation: explainNode(node, flags),
          ...node.location,
        });
        for (const [branchIndex, branch] of node.branches.entries()) {
          if (branchIndex > 0) {
            const first = branch[0];
            const separatorStart = source.length;
            source += "|";
            segments.push({
              kind: "alternation",
              edge: "branch",
              alternatives: node.branches.length,
              repetition: node.repetition,
              sourceStart: separatorStart,
              sourceEnd: source.length,
              source: "|",
              text: first.text,
              explanation: `Alternative ${branchIndex + 1} of ${node.branches.length}. Earlier choices are tried first.`,
              ...first.location,
            });
          }
          emit(branch);
        }
        const endStart = source.length;
        const close = `)${repetitionSource(node.repetition)}`;
        source += close;
        segments.push({
          kind: "alternation",
          edge: "end",
          alternatives: node.branches.length,
          repetition: node.repetition,
          sourceStart: endStart,
          sourceEnd: source.length,
          source: close,
          text: "}",
          explanation: `End alternatives.${node.repetition ? " Repetition applies to the complete choice." : ""}`,
          ...node.endLocation,
        });
        continue;
      }
      if (node.kind === "group") {
        const sourceStart = source.length;
        const fragment = node.capturing ? (node.name === null ? "(" : `(?<${node.name}>`) : "(?:";
        source += fragment;
        const details = {
          kind: "group",
          capturing: node.capturing,
          name: node.name,
          captureIndex: node.captureIndex,
          repetition: node.repetition,
        };
        segments.push({
          ...details,
          kind: "group",
          edge: "start",
          sourceStart,
          sourceEnd: source.length,
          source: fragment,
          text: node.text,
          explanation: explainNode(node, flags),
          ...node.location,
        });
        emit(node.nodes);
        const endStart = source.length;
        const close = `)${repetitionSource(node.repetition)}`;
        source += close;
        segments.push({
          ...details,
          kind: "group",
          edge: "end",
          sourceStart: endStart,
          sourceEnd: source.length,
          source: close,
          text: "}",
          explanation: `End group.${node.repetition ? " Repetition applies to the entire group." : ""}`,
          ...node.endLocation,
        });
        continue;
      }
      // A numeric reference needs a boundary so a following digit cannot change its number.
      const fragment =
        node.kind === "anchor"
          ? node.edge === "start"
            ? "^"
            : "$"
          : node.kind === "boundary"
            ? node.negative
              ? "\\B"
              : "\\b"
            : node.kind === "backreference"
              ? (typeof node.reference === "string"
                  ? `\\k<${node.reference}>`
                  : `(?:\\${node.captureIndex})`) + repetitionSource(node.repetition)
              : atomSource(node);
      const sourceStart = source.length;
      source += fragment;
      segments.push({
        sourceStart,
        sourceEnd: source.length,
        source: fragment,
        text: node.text,
        explanation: explainNode(node, flags, index + 1 < nodes.length),
        line: node.location.line,
        column: node.location.column,
        ...(node.kind === "backreference"
          ? {
              kind: "backreference",
              reference: node.reference,
              captureIndex: node.captureIndex,
              repetition: node.repetition,
            }
          : node.kind === "anchor"
            ? { kind: "anchor", edge: node.edge, mode: node.mode }
            : node.kind === "boundary"
              ? { kind: "boundary", negative: node.negative }
              : node.atomType === "unicodeProperty"
                ? {
                    kind: "atom",
                    atomType: "unicodeProperty",
                    property: node.value,
                    negative: node.negative,
                    repetition: node.repetition,
                  }
                : node.atomType === "charSet"
                  ? {
                      kind: "atom",
                      atomType: "charSet",
                      repetition: node.repetition,
                      negative: node.negative,
                    }
                  : {
                      kind: "atom",
                      atomType: node.atomType,
                      repetition: node.repetition,
                    }),
      });
    }
  }
  emit(parsed.nodes);

  try {
    new RegExp(source, flags);
  } catch (error) {
    throw new Error(`Compiler emitted invalid JavaScript regex: ${String(error)}`, {
      cause: error,
    });
  }
  return { source, flags, segments };
}
