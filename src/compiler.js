import { classMayContainStrings } from "./ast.js";
import { fail } from "./diagnostics.js";
import { escapeControls, quoteText } from "./display.js";
import { explainNode } from "./explain.js";

/** @typedef {import('./ast.js').AtomNode} AtomNode */
/** @typedef {import('./ast.js').Repetition} Repetition */
/** @typedef {import('./ast.js').ParsedRules} ParsedRules */

const locationOfOptions = { line: 1, column: 1 };

/** @param {string} character @param {boolean} inClass @param {boolean} [unicodeSets] */
function escapeCharacter(character, inClass, unicodeSets = false) {
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
  const special = inClass
    ? unicodeSets
      ? /[\\()[\]{}/\-|!#$%&*+,.:;<=>?@^`~]/u
      : /[\\[\]\-^/]/u
    : /[\\.*+?^${}()|[\]/]/u;
  return special.test(character) ? `\\${character}` : character;
}

/** @param {string} value */
function escapeLiteral(value) {
  return [...value].map((character) => escapeCharacter(character, false)).join("");
}

/** @param {string[]} values @param {boolean} unicodeSets */
function escapeClass(values, unicodeSets) {
  return values.map((character) => escapeCharacter(character, true, unicodeSets)).join("");
}

/** @param {import('./ast.js').ClassMember} member @param {boolean} unicodeSets @param {import('./ast.js').ClassSetOperation} [operation] @returns {string} */
function classMemberSource(member, unicodeSets, operation = "union") {
  switch (member.kind) {
    case "literal":
      return escapeControls(escapeCharacter(member.value, true, unicodeSets));
    case "range": {
      const range = escapeControls(
        `${escapeCharacter(member.from, true, unicodeSets)}-${escapeCharacter(member.to, true, unicodeSets)}`,
      );
      return operation === "union" ? range : `[${range}]`;
    }
    case "shorthand":
      return member.value;
    case "strings":
      return escapeControls(
        `\\q{${member.values.map((value) => escapeClass([...value], true)).join("|")}}`,
      );
    case "stringCodePoints":
      return escapeControls(`\\q{${escapeClass(member.codePoints, true)}}`);
    case "unicodeProperty":
      return `\\${member.negative ? "P" : "p"}{${member.value}}`;
    case "set":
      return classSetSource(member, unicodeSets);
    default:
      throw new TypeError("Unknown character-class member.");
  }
}

/** @param {{members: import('./ast.js').ClassMember[], negative: boolean, operation?: import('./ast.js').ClassSetOperation}} set @param {boolean} unicodeSets @returns {string} */
function classSetSource(set, unicodeSets) {
  const operation = set.operation ?? "union";
  const separator = operation === "intersection" ? "&&" : operation === "subtraction" ? "--" : "";
  return `[${set.negative ? "^" : ""}${set.members.map((member) => classMemberSource(member, unicodeSets, operation)).join(separator)}]`;
}

/** @param {import('./ast.js').ClassMember[]} members @param {boolean} unicodeSets @param {number} start @param {import('./ast.js').ClassSetOperation} [operation] @returns {import('../index.d.ts').CharacterClassMember[]} */
function classMemberTraces(members, unicodeSets, start, operation = "union") {
  let cursor = start;
  return members.map((member, index) => {
    if (index && operation !== "union") cursor += 2;
    const source = classMemberSource(member, unicodeSets, operation);
    const sourceStart = cursor;
    cursor += source.length;
    const trace = { source, sourceStart, sourceEnd: cursor };
    return member.kind === "set"
      ? {
          ...member,
          ...trace,
          members: classMemberTraces(
            member.members,
            unicodeSets,
            sourceStart + 1 + Number(member.negative),
            member.operation,
          ),
        }
      : { ...member, ...trace };
  });
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

/** @param {AtomNode} node @param {boolean} unicodeSets */
function atomSource(node, unicodeSets) {
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
      source = `[${node.negative ? "^" : ""}${escapeClass(node.value, unicodeSets)}]`;
      break;
    case "unicodeProperty":
      source = `\\${node.negative ? "P" : "p"}{${node.value}}`;
      break;
    case "characterClass":
      source = classSetSource(node, unicodeSets);
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
  if (
    typeof requested !== "string" ||
    requested.length > 8 ||
    /[^dgimsuvy]/u.test(requested) ||
    new Set(requested).size !== requested.length ||
    (requested.includes("u") && requested.includes("v"))
  ) {
    fail(
      "UNSUPPORTED_FLAGS",
      "Use unique JavaScript flags d, g, i, m, s, u, v or y; u and v cannot be combined.",
      locationOfOptions,
    );
  }
  return requested;
}

/** @param {ParsedRules} parsed @param {{flags?: string | undefined}} [options] */
export function compileAst(parsed, options = {}) {
  const requested = normalizeOptions(options);
  const selected = new Set(requested);
  if (!selected.has("v")) selected.add("u");
  if (parsed.anchorMode === "line" || parsed.anchorMode === "mixed") selected.add("m");
  const flags = [..."dgimsuvy"].filter((flag) => selected.has(flag)).join("");
  const unicodeSets = selected.has("v");
  const unicodeMode = unicodeSets ? "v" : "u";
  try {
    new RegExp("", flags);
  } catch {
    fail(
      "UNSUPPORTED_TARGET_FEATURE",
      `This JavaScript runtime does not support the requested regex flags ${quoteText(flags)}.`,
      locationOfOptions,
      "Use a runtime with native support for the selected flags; they cannot be approximated.",
    );
  }
  let source = "";
  /** @type {import('../index.d.ts').RegexSegment[]} */
  const segments = [];
  let checkedLookbehind = false;
  let checkedUnicodeProperties = false;
  let checkedStringSets = false;
  let checkedSetOperations = false;

  /** @param {import('./ast.js').Location} location */
  function checkLookbehind(location) {
    if (checkedLookbehind) return;
    try {
      new RegExp("(?<=a)b", unicodeMode);
    } catch {
      fail(
        "UNSUPPORTED_TARGET_FEATURE",
        "This JavaScript runtime does not support lookbehind assertions.",
        location,
        "Use a runtime with native lookbehind support; the assertion cannot be approximated.",
      );
    }
    checkedLookbehind = true;
  }

  /** @param {import('./ast.js').PropertyAtomNode|Extract<import('./ast.js').ClassMember, {kind: 'unicodeProperty'}>} property @param {import('./ast.js').Location} location */
  function checkProperty(property, location) {
    if (property.propertyType === "string") {
      if (!unicodeSets)
        fail(
          "UNICODE_SETS_REQUIRED",
          "Unicode string properties require the v flag.",
          property.propertyLocation,
          "Select v mode; the compiler cannot replace a string property with characters.",
        );
      if (property.negative)
        fail(
          "INVALID_STRING_COMPLEMENT",
          "Unicode string properties cannot be complemented.",
          property.propertyLocation,
          "Use a positive string property or complement a character property instead.",
        );
      try {
        new RegExp(`\\p{${property.value}}`, flags);
      } catch {
        fail(
          "UNSUPPORTED_TARGET_FEATURE",
          `This JavaScript runtime does not support Unicode string property ${quoteText(property.value)}.`,
          property.propertyLocation,
          "Use a runtime with native support for this string property.",
        );
      }
      return;
    }
    if (!checkedUnicodeProperties) {
      try {
        new RegExp("\\p{ASCII}", unicodeMode);
      } catch {
        fail(
          "UNSUPPORTED_TARGET_FEATURE",
          "This JavaScript runtime does not support Unicode property escapes.",
          location,
          "Use a runtime with native Unicode property support; the property cannot be approximated.",
        );
      }
      checkedUnicodeProperties = true;
    }
    try {
      new RegExp(`\\${property.negative ? "P" : "p"}{${property.value}}`, flags);
    } catch {
      fail(
        "INVALID_UNICODE_PROPERTY",
        `The Unicode property ${quoteText(property.value)} is not recognized by this JavaScript runtime.`,
        property.propertyLocation,
        `Use a case-sensitive character property such as \`Letter\`, \`Script=Greek\` or \`Script_Extensions=Greek\` supported in ${unicodeMode} mode.`,
      );
    }
  }

  /** @param {{members: import('./ast.js').ClassMember[], negative: boolean, operation?: import('./ast.js').ClassSetOperation, location: import('./ast.js').Location}} set */
  function checkClass(set) {
    if (set.operation) {
      if (!unicodeSets)
        fail(
          "UNICODE_SETS_REQUIRED",
          "Character-set blocks require the v flag.",
          set.location,
          "Select v mode to use native nested sets, intersection or subtraction.",
        );
      if (!checkedSetOperations) {
        try {
          new RegExp("[[a]&&[a]]", flags);
          new RegExp("[[a]--[b]]", flags);
        } catch {
          fail(
            "UNSUPPORTED_TARGET_FEATURE",
            "This JavaScript runtime does not support native Unicode set operations.",
            set.location,
            "Use a runtime with native v-mode set-operation support.",
          );
        }
        checkedSetOperations = true;
      }
    }
    for (const member of set.members) {
      if (member.kind === "set") checkClass(member);
      if (member.kind === "unicodeProperty") checkProperty(member, set.location);
      if (member.kind === "strings" || member.kind === "stringCodePoints") {
        if (!unicodeSets)
          fail(
            "UNICODE_SETS_REQUIRED",
            "Finite string sets require the v flag.",
            member.location,
            "Select v mode; string sets use native longest-first matching.",
          );
        if (!checkedStringSets) {
          try {
            new RegExp("[\\q{ab}]", flags);
          } catch {
            fail(
              "UNSUPPORTED_TARGET_FEATURE",
              "This JavaScript runtime does not support finite string sets.",
              member.location,
              "Use a runtime with native v-mode string-set support.",
            );
          }
          checkedStringSets = true;
        }
      }
    }
    if (set.negative && classMayContainStrings(set.members, set.operation))
      fail(
        "INVALID_STRING_COMPLEMENT",
        "A negated class cannot contain empty or multi-code-point strings or string properties.",
        set.location,
        "A complemented union must have only characters; an intersection needs a character-only operand, and a subtraction needs a character-only left operand.",
      );
  }

  /** @param {import('./ast.js').RuleNode[]} nodes */
  function emit(nodes) {
    for (const [index, node] of nodes.entries()) {
      if (node.kind === "atom" && node.atomType === "unicodeProperty")
        checkProperty(node, node.location);
      if (node.kind === "atom" && node.atomType === "characterClass") checkClass(node);
      if (node.kind === "assertion") {
        if (node.direction === "behind") checkLookbehind(node.location);
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
      if (
        node.kind === "anchor" &&
        node.mode === "input" &&
        node.edge === "start" &&
        selected.has("m")
      )
        checkLookbehind(node.location);
      // Native edge guards keep absolute assertions out of surrogate pairs in some engines.
      const fragment =
        node.kind === "anchor"
          ? node.mode === "input" && selected.has("m")
            ? node.edge === "start"
              ? "^(?<![\\s\\S])"
              : "$(?![\\s\\S])"
            : node.edge === "start"
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
              : atomSource(node, unicodeSets);
      const sourceStart = source.length;
      source += fragment;
      const memberCursor =
        sourceStart +
        1 +
        Number(node.kind === "atom" && node.atomType === "characterClass" && node.negative);
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
              : node.atomType === "characterClass"
                ? {
                    kind: "atom",
                    atomType: "characterClass",
                    negative: node.negative,
                    repetition: node.repetition,
                    ...(node.operation
                      ? { operation: node.operation, endLocation: node.endLocation }
                      : {}),
                    members: classMemberTraces(
                      node.members,
                      unicodeSets,
                      memberCursor,
                      node.operation,
                    ),
                  }
                : node.atomType === "unicodeProperty"
                  ? {
                      kind: "atom",
                      atomType: "unicodeProperty",
                      property: node.value,
                      propertyType: node.propertyType,
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
