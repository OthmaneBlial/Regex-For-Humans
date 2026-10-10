import {
  anchor,
  atom,
  PATH_SEGMENT_EXCLUDED,
  PATH_SEGMENT_SOURCE,
  UNICODE_STRING_PROPERTIES,
} from "./ast.js";
import { fail } from "./diagnostics.js";
import { quoteText } from "./display.js";
import { LIMITS } from "./limits.js";

export { LIMITS };

/** @typedef {import('./ast.js').Location} Location */
/** @typedef {import('./ast.js').Repetition} Repetition */
/** @typedef {import('./ast.js').AtomNode} AtomNode */
/** @typedef {import('./ast.js').ClassMember} ClassMember */
/** @typedef {import('./ast.js').ClassAtomNode} ClassAtomNode */
/** @typedef {import('./ast.js').GroupNode} GroupNode */
/** @typedef {import('./ast.js').AlternationNode} AlternationNode */
/** @typedef {import('./ast.js').AssertionNode} AssertionNode */
/** @typedef {import('./ast.js').BoundaryNode} BoundaryNode */
/** @typedef {import('./ast.js').BackreferenceNode} BackreferenceNode */
/** @typedef {import('./ast.js').RuleNode} RuleNode */
/** @typedef {import('./ast.js').ParsedRules} ParsedRules */

/** @param {string} source @returns {string[]} */
export function splitLines(source) {
  const lines = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') {
      quoted = true;
      continue;
    }
    if (character === "\r" && source[index + 1] === "\n") {
      lines.push(source.slice(start, index));
      index += 1;
      start = index + 1;
    } else if ("\n\r\u2028\u2029".includes(character)) {
      lines.push(source.slice(start, index));
      start = index + 1;
    }
  }
  lines.push(source.slice(start));
  return lines;
}

/** @param {string} source */
export function validateSourceLength(source) {
  if (source.length > LIMITS.sourceLength) {
    const prefix = source.slice(0, LIMITS.sourceLength);
    let lines = splitLines(prefix);
    if (prefix.endsWith("\r") && source[LIMITS.sourceLength] === "\n" && lines.at(-1) === "") {
      lines = splitLines(prefix.slice(0, -1));
    }
    fail("SOURCE_LIMIT", `Rules cannot exceed ${LIMITS.sourceLength} UTF-16 code units.`, {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    });
  }
}

const SHORTHANDS = new Map([
  ["word", "\\w"],
  ["word character", "\\w"],
  ["word characters", "\\w"],
  ["not word", "\\W"],
  ["not digit", "\\D"],
  ["digit", "\\d"],
  ["letter", "[A-Za-z]"],
  ["letters", "[A-Za-z]"],
  ["lowercase letter", "[a-z]"],
  ["lowercase letters", "[a-z]"],
  ["uppercase letter", "[A-Z]"],
  ["uppercase letters", "[A-Z]"],
  ["hex digit", "[0-9A-Fa-f]"],
  ["hex digits", "[0-9A-Fa-f]"],
  ["not space", "\\S"],
  ["space", "\\s"],
  ["spaces", "\\s"],
  ["digits", "\\d"],
  ["path segment character", PATH_SEGMENT_SOURCE],
  ["path segment characters", PATH_SEGMENT_SOURCE],
]);

const START_ANCHOR = /^(line start|start)(?:,\s*|\s+|$)/i;
const DUPLICATE_START_ANCHOR_MESSAGE = "Use only one start anchor.";
const QUOTE_STYLES = /^['`“”‘’]/u;
const QUOTE_HINT = 'Use JSON double quotes for quoted text, such as `"A"`.';
const OPTIONAL_PREFIX = /^optional(?=\s|$)\s*/iu;
const SEQUENCE_PREFIX = /^(zero or more|one or more)(?=\s|$)\s*/iu;
const AT_LEAST_PREFIX = /^(at least(?:\s+|$))(?:(\S+)(?:\s+|$))?/iu;
const AT_LEAST_HINT = "Use `at least 3 digits`, with the minimum count before the item.";
const CAPTURE_NAME = /^[$_\p{ID_Start}](?:[$\p{ID_Continue}]|\u200c|\u200d)*$/u;
// Recognize malformed numeric tokens so parseCount owns their diagnostics.
const COUNT_PREFIX = /^([+-]?(?:\p{Nd}|\.\p{Nd})\S*)(?:\s+|$)/u;

/** @param {string} count @param {Location} location @returns {number} */
function parseCount(count, location) {
  if (!/^[0-9]+$/u.test(count)) {
    fail(
      "INVALID_REPETITION",
      "Counts must be nonnegative integers.",
      location,
      "Write counts with digits 0–9 only, such as `3`.",
    );
  }
  const number = Number(count);
  if (!Number.isSafeInteger(number) || number > LIMITS.repetition) {
    fail("REPETITION_LIMIT", `Repetition counts must be at most ${LIMITS.repetition}.`, location);
  }
  return number;
}

/** @param {string} text @param {Location} location @returns {{value: string, length: number}} */
function readQuoted(text, location) {
  if (!text.startsWith('"')) fail("INVALID_QUOTE", "Expected a double-quoted value.", location);
  /** @param {string} message @param {number} index @returns {never} */
  const failAt = (message, index) =>
    fail("INVALID_QUOTE", message, { line: location.line, column: location.column + index });
  let escapeStart = -1;
  for (let index = 1; index < text.length; index += 1) {
    const character = text[index];
    if (escapeStart >= 0) {
      if (character === "u") {
        if (!/^[0-9a-f]{4}$/iu.test(text.slice(index + 1, index + 5))) {
          failAt("Use four hexadecimal digits after \\u.", escapeStart);
        }
        index += 4;
      } else if (!'"\\/bfnrt'.includes(character)) {
        failAt("Invalid JSON escape.", escapeStart);
      }
      escapeStart = -1;
    } else if (character === "\\") {
      escapeStart = index;
    } else if (character === '"') {
      try {
        return { value: JSON.parse(text.slice(0, index + 1)), length: index + 1 };
      } catch {
        failAt("Invalid quoted value.", index);
      }
    } else if (character.charCodeAt(0) < 0x20) {
      failAt("Escape control characters inside quoted values.", index);
    }
  }
  if (escapeStart >= 0) failAt("Incomplete JSON escape.", escapeStart);
  return failAt("Missing closing double quote.", text.length);
}

/** @param {string} text @param {Location} location @param {string} rawLine @param {boolean} [strings] @returns {string[]} */
function readCharacterList(text, location, rawLine, strings = false) {
  const items = [];
  let index = 0;
  while (index < text.length) {
    while (/\s/u.test(text[index] ?? "")) index += 1;
    if (index >= text.length) break;
    const itemStart = index;
    let value;
    if (strings && text[index] !== '"')
      fail(
        "INVALID_STRING_LIST",
        "String-set items must use JSON double quotes.",
        {
          line: location.line,
          column: location.column + itemStart,
        },
        QUOTE_HINT,
      );
    if (text[index] === '"') {
      const quoted = readQuoted(rawLine.slice(location.column - 1 + index), {
        line: location.line,
        column: location.column + index,
      });
      value = quoted.value;
      index += quoted.length;
    } else {
      const nextComma = text.indexOf(",", index);
      const end = nextComma === -1 ? text.length : nextComma;
      value = text.slice(index, end).trim();
      index = end;
    }
    if (!strings && [...value].length !== 1) {
      fail(
        "INVALID_CHARACTER",
        "Each character-list item must be one Unicode code point.",
        { line: location.line, column: location.column + itemStart },
        QUOTE_STYLES.test(text.slice(itemStart)) ? QUOTE_HINT : undefined,
      );
    }
    items.push(value);
    while (/\s/u.test(text[index] ?? "")) index += 1;
    if (index === text.length) break;
    if (text[index] !== ",") {
      fail(
        strings ? "INVALID_STRING_LIST" : "INVALID_CHARACTER_LIST",
        strings
          ? "Separate string-set items with commas."
          : "Separate character-list items with commas.",
        {
          line: location.line,
          column: location.column + index,
        },
      );
    }
    const commaIndex = index;
    index += 1;
    while (/\s/u.test(text[index] ?? "")) index += 1;
    if (index === text.length) {
      fail(
        strings ? "INVALID_STRING_LIST" : "INVALID_CHARACTER_LIST",
        strings
          ? "A string list cannot end with a comma."
          : "A character list cannot end with a comma.",
        {
          line: location.line,
          column: location.column + commaIndex,
        },
      );
    }
  }
  if (items.length === 0)
    fail(
      strings ? "EMPTY_STRING_LIST" : "EMPTY_CHARACTER_LIST",
      strings
        ? "A string list needs at least one item."
        : "A character list needs at least one item.",
      location,
    );
  return items;
}

/** @param {string} text @param {Location} location @param {string} rawLine @returns {string[]} */
function readStringCodePoints(text, location, rawLine) {
  const points = [];
  let cursor = 0;
  while (cursor < text.length) {
    const pointLocation = { line: location.line, column: location.column + cursor };
    const quoted = readQuoted(rawLine.slice(pointLocation.column - 1), pointLocation);
    if ([...quoted.value].length !== 1)
      fail(
        "INVALID_STRING_SEQUENCE",
        "Each sequence item must be one Unicode code point.",
        pointLocation,
      );
    points.push(quoted.value);
    cursor += quoted.length;
    while (/\s/u.test(text[cursor] ?? "")) cursor += 1;
    if (cursor === text.length) break;
    if (text[cursor] !== "+")
      fail("INVALID_STRING_SEQUENCE", "Separate quoted sequence code points with `+`.", {
        line: location.line,
        column: location.column + cursor,
      });
    const separator = cursor++;
    while (/\s/u.test(text[cursor] ?? "")) cursor += 1;
    if (cursor === text.length)
      fail("INVALID_STRING_SEQUENCE", "A code-point sequence cannot end with `+`.", {
        line: location.line,
        column: location.column + separator,
      });
  }
  if (!points.length)
    fail("EMPTY_STRING_SEQUENCE", "A string sequence needs at least one code point.", location);
  return points;
}

/** @param {string} text @param {Location} location @param {string} rawLine @returns {AtomNode|GroupNode|AlternationNode|AssertionNode|BoundaryNode|BackreferenceNode} */
function parseAtom(text, location, rawLine) {
  const lazy = /^lazy(?:\s+|$)/iu.exec(text);
  if (!lazy) return parseItem(text, location, rawLine);
  if (!text.slice(lazy[0].length) || /^lazy(?:\s|$)/iu.test(text.slice(lazy[0].length)))
    fail(
      "INVALID_LAZY_REPETITION",
      "Write one lazy modifier before a repeated item.",
      location,
      'Use `lazy digits`, `lazy optional "-"` or `lazy one or more group {`.',
    );
  const node = parseItem(
    text.slice(lazy[0].length),
    { line: location.line, column: location.column + lazy[0].length },
    rawLine,
  );
  if (!node.repetition)
    fail(
      "INVALID_LAZY_REPETITION",
      "Lazy needs an explicit repetition or a rule that already matches a sequence.",
      location,
      "Use `lazy digits` or `lazy one or more digit` instead of `lazy digit`.",
    );
  node.repetition = { ...node.repetition, lazy: true };
  node.location = location;
  node.text = text;
  return node;
}

/** @param {string} text @param {Location} location @param {string} rawLine @returns {AtomNode|GroupNode|AlternationNode|AssertionNode|BoundaryNode|BackreferenceNode} */
function parseItem(text, location, rawLine, inClass = false) {
  let remaining = text;
  /** @type {Repetition|null} */
  let repetition = null;
  let offset = 0;
  const optional = OPTIONAL_PREFIX.exec(remaining);
  const sequence = SEQUENCE_PREFIX.exec(remaining);
  const atLeast = AT_LEAST_PREFIX.exec(remaining);
  const count = COUNT_PREFIX.exec(remaining);
  const range = /^(between\s+)(\S+)(\s+and\s+)(\S+)\s+/iu.exec(remaining);
  if (optional) {
    repetition = { kind: "range", min: 0, max: 1 };
    offset = optional[0].length;
    if (offset === remaining.length) {
      fail(
        "INVALID_REPETITION",
        "An optional modifier needs an item.",
        location,
        'Write `optional` before one item, such as `optional "-"`.',
      );
    }
  } else if (sequence) {
    repetition = {
      kind: sequence[1].toLowerCase() === "zero or more" ? "zeroOrMore" : "oneOrMore",
    };
    offset = sequence[0].length;
    if (offset === remaining.length) {
      fail(
        "INVALID_REPETITION",
        "A repetition modifier needs an item.",
        location,
        `Use \`${sequence[1].toLowerCase()} digit\`, with the modifier before the item.`,
      );
    }
  } else if (atLeast) {
    if (atLeast[2] === undefined) {
      fail(
        "INVALID_REPETITION",
        "A minimum repetition needs a count and an item.",
        location,
        AT_LEAST_HINT,
      );
    }
    repetition = {
      kind: "atLeast",
      min: parseCount(atLeast[2], {
        line: location.line,
        column: location.column + atLeast[1].length,
      }),
    };
    offset = atLeast[0].length;
    if (offset === remaining.length) {
      fail("INVALID_REPETITION", "A repetition modifier needs an item.", location, AT_LEAST_HINT);
    }
  } else if (range) {
    const min = parseCount(range[2], {
      line: location.line,
      column: location.column + range[1].length,
    });
    const maxLocation = {
      line: location.line,
      column: location.column + range[1].length + range[2].length + range[3].length,
    };
    const max = parseCount(range[4], maxLocation);
    if (max < min) {
      fail(
        "INVALID_RANGE",
        "The upper count cannot be smaller than the lower count.",
        maxLocation,
        "Put the smaller count first, such as `between 2 and 4 digits`.",
      );
    }
    repetition = { kind: "range", min, max };
    offset = range[0].length;
  } else if (count) {
    repetition = { kind: "exact", min: parseCount(count[1], location) };
    offset = count[0].length;
  } else if (/^between(?:\s|$)/iu.test(remaining)) {
    fail(
      "INVALID_REPETITION",
      "A range needs two counts and an item.",
      location,
      "Use `between 2 and 4 digits`, with the count range before the item.",
    );
  }
  remaining = remaining.slice(offset);
  if (!remaining) {
    fail(
      "INVALID_REPETITION",
      "A count needs an item.",
      location,
      "Use `3 digits`, with the count before the item.",
    );
  }
  const anotherRange = /^between(?:\s|$)/iu.test(remaining);
  const anotherOptional = OPTIONAL_PREFIX.test(remaining);
  const anotherSequence = SEQUENCE_PREFIX.test(remaining);
  const anotherAtLeast = AT_LEAST_PREFIX.test(remaining);
  if (
    COUNT_PREFIX.test(remaining) ||
    anotherRange ||
    anotherOptional ||
    anotherSequence ||
    anotherAtLeast
  ) {
    const duplicateLocation = { line: location.line, column: location.column + offset };
    if (optional || anotherOptional || sequence || anotherSequence || atLeast || anotherAtLeast) {
      fail(
        "DUPLICATE_REPETITION",
        "Use only one repetition modifier.",
        duplicateLocation,
        "Put one repetition modifier before the item.",
      );
    }
    fail(
      "DUPLICATE_REPETITION",
      range || anotherRange
        ? "Put one count or range before the instruction."
        : "Put one exact count before the instruction.",
      duplicateLocation,
    );
  }
  if (repetition && /^(?:start|end|line start|line end)$/iu.test(remaining)) {
    fail(
      "ANCHOR_REPETITION",
      "Repetition modifiers apply to items, not anchors.",
      { line: location.line, column: location.column + offset },
      'Remove the modifier or apply it to an item, such as `3 digits` or `optional "-"`.',
    );
  }

  const setBlock = /^(not\s+)?character\s+set\s+(union|intersection|subtraction)\s*\{$/iu.exec(
    remaining,
  );
  if (setBlock)
    return {
      kind: "atom",
      atomType: "characterClass",
      operation:
        setBlock[2].toLowerCase() === "union"
          ? "union"
          : setBlock[2].toLowerCase() === "intersection"
            ? "intersection"
            : "subtraction",
      negative: setBlock[1] !== undefined,
      members: [],
      repetition,
      location,
      text,
      endLocation: location,
    };
  if (/^(?:not\s+)?character\s+set(?:\s|$)/iu.test(remaining))
    fail(
      "INVALID_SET_BLOCK",
      "Open a character-set operation with `{` and close it with `}` on its own line.",
      { line: location.line, column: location.column + offset },
      "Use `character set union {`, `character set intersection {` or `character set subtraction {`, optionally prefixed by `not`.",
    );

  const boundary = /^(not\s+)?word\s+boundary$/iu.exec(remaining);
  if (boundary) {
    if (repetition)
      fail(
        "BOUNDARY_REPETITION",
        "Word boundaries do not consume characters and cannot be repeated directly.",
        { line: location.line, column: location.column + offset },
        "Repeat a group containing the boundary and consuming items instead.",
      );
    return {
      kind: "boundary",
      negative: boundary[1] !== undefined,
      repetition: null,
      location,
      text,
    };
  }

  const assertion = /^(not\s+)?(followed\s+by|preceded\s+by)(?=\s|\{|$)\s*/iu.exec(remaining);
  if (assertion) {
    if (repetition)
      fail(
        "ASSERTION_REPETITION",
        "Lookaround assertions do not consume characters and cannot be repeated directly.",
        { line: location.line, column: location.column + offset },
        "Repeat the consuming items inside the assertion, or a group containing it.",
      );
    if (remaining.slice(assertion[0].length) !== "{")
      fail(
        "INVALID_ASSERTION",
        "Open an assertion with `{` and close it with `}` on its own line.",
        { line: location.line, column: location.column + offset + assertion[0].length },
        "Use `followed by {`, `not followed by {`, `preceded by {` or `not preceded by {`.",
      );
    return {
      kind: "assertion",
      direction: assertion[2].toLowerCase().startsWith("followed") ? "ahead" : "behind",
      negative: assertion[1] !== undefined,
      nodes: [],
      repetition: null,
      location,
      text,
      endLocation: location,
    };
  }

  const group = /^(group|capture|either)(?=\s|\{|$)\s*/iu.exec(remaining);
  if (group) {
    const capturing = group[1].toLowerCase() === "capture";
    let suffix = remaining.slice(group[0].length);
    let name = null;
    const nameLocation = {
      line: location.line,
      column: location.column + offset + group[0].length,
    };
    if (capturing && suffix.startsWith('"')) {
      const quoted = readQuoted(suffix, nameLocation);
      name = quoted.value;
      if (!CAPTURE_NAME.test(name)) {
        fail(
          "INVALID_CAPTURE_NAME",
          "A capture name must be a JavaScript identifier.",
          nameLocation,
        );
      }
      suffix = suffix.slice(quoted.length).trim();
    }
    if (suffix !== "{") {
      fail(
        "INVALID_GROUP",
        "Open a group with `{` and close it with `}` on its own line.",
        nameLocation,
        'Use `group {`, `capture {`, `capture "name" {` or `either {`.',
      );
    }
    if (group[1].toLowerCase() === "either")
      return {
        kind: "alternation",
        branches: [],
        repetition,
        location,
        text,
        endLocation: location,
      };
    return {
      kind: "group",
      capturing,
      name,
      captureIndex: null,
      nodes: [],
      repetition,
      location,
      text,
      endLocation: location,
    };
  }

  const backreference = /^same as capture(?:\s+|$)/iu.exec(remaining);
  if (backreference) {
    const suffix = remaining.slice(backreference[0].length);
    const referenceLocation = {
      line: location.line,
      column: location.column + offset + backreference[0].length,
    };
    let reference;
    if (suffix.startsWith('"')) {
      const quoted = readQuoted(suffix, referenceLocation);
      if (quoted.length !== suffix.length || !CAPTURE_NAME.test(quoted.value)) {
        fail(
          "INVALID_CAPTURE_REFERENCE",
          "Use one quoted capture name or a positive capture number.",
          referenceLocation,
        );
      }
      reference = quoted.value;
    } else {
      reference = Number(suffix);
      if (!/^[0-9]+$/u.test(suffix) || !Number.isSafeInteger(reference) || reference < 1) {
        fail(
          "INVALID_CAPTURE_REFERENCE",
          "Use one quoted capture name or a positive capture number.",
          referenceLocation,
        );
      }
    }
    return {
      kind: "backreference",
      reference,
      captureIndex: 0,
      referenceLocation,
      repetition,
      location,
      text,
    };
  }

  const pointSequence = /^string\s+code\s+points:\s*/iu.exec(remaining);
  if (pointSequence) {
    const pointLocation = {
      line: location.line,
      column: location.column + offset + pointSequence[0].length,
    };
    return {
      kind: "atom",
      atomType: "characterClass",
      negative: false,
      repetition,
      location,
      text,
      members: [
        {
          kind: "stringCodePoints",
          codePoints: readStringCodePoints(
            remaining.slice(pointSequence[0].length),
            pointLocation,
            rawLine,
          ),
          location: pointLocation,
          text: remaining.slice(pointSequence[0].length),
        },
      ],
    };
  }
  const stringList = /^one\s+of\s+strings:\s*/iu.exec(remaining);
  const stringPrefix = /^string(?:\s+|$)/iu.exec(remaining);
  const stringsPrefix = stringList ?? stringPrefix;
  if (stringsPrefix) {
    const prefixLength = stringsPrefix[0].length;
    const memberLocation = { line: location.line, column: location.column + offset + prefixLength };
    const values = readCharacterList(remaining.slice(prefixLength), memberLocation, rawLine, true);
    if (stringPrefix && values.length !== 1)
      fail(
        "INVALID_STRING_LIST",
        "Use one quoted value after `string`, or use `one of strings:`.",
        memberLocation,
      );
    return {
      kind: "atom",
      atomType: "characterClass",
      negative: false,
      members: [
        { kind: "strings", values, location: memberLocation, text: remaining.slice(prefixLength) },
      ],
      repetition,
      location,
      text,
    };
  }

  const classPrefix = /^(not\s+)?character\s+class:\s*/iu.exec(remaining);
  if (classPrefix) {
    if (inClass)
      fail(
        "INVALID_CLASS_MEMBER",
        "A u-mode character class cannot contain another class.",
        location,
      );
    const members = readClassMembers(
      remaining.slice(classPrefix[0].length),
      { line: location.line, column: location.column + offset + classPrefix[0].length },
      rawLine,
    );
    return {
      kind: "atom",
      atomType: "characterClass",
      members,
      negative: classPrefix[1] !== undefined,
      repetition,
      location,
      text,
    };
  }

  const rangePrefix = /^range(?:\s+|$)/iu.exec(remaining);
  if (rangePrefix) {
    const fromLocation = {
      line: location.line,
      column: location.column + offset + rangePrefix[0].length,
    };
    const from = readQuoted(rawLine.slice(fromLocation.column - 1), fromLocation);
    const tail = remaining.slice(rangePrefix[0].length + from.length);
    const separator = /^\s+to\s+/iu.exec(tail);
    if (!separator)
      fail("INVALID_CHARACTER_RANGE", "Separate the two quoted endpoints with `to`.", {
        line: location.line,
        column: fromLocation.column + from.length,
      });
    const toLocation = {
      line: location.line,
      column: fromLocation.column + from.length + separator[0].length,
    };
    const to = readQuoted(rawLine.slice(toLocation.column - 1), toLocation);
    if (rangePrefix[0].length + from.length + separator[0].length + to.length !== remaining.length)
      fail("TRAILING_TEXT", "Unexpected text after the character range.", {
        line: location.line,
        column: toLocation.column + to.length,
      });
    /** @type {[string, Location][]} */
    const endpoints = [
      [from.value, fromLocation],
      [to.value, toLocation],
    ];
    for (const [value, endpointLocation] of endpoints) {
      if ([...value].length !== 1)
        fail(
          "INVALID_CHARACTER_RANGE",
          "Each range endpoint must be one Unicode code point.",
          endpointLocation,
        );
    }
    if ((from.value.codePointAt(0) ?? 0) > (to.value.codePointAt(0) ?? 0))
      fail(
        "INVALID_CHARACTER_RANGE",
        "The upper endpoint cannot precede the lower Unicode code point.",
        toLocation,
      );
    return {
      kind: "atom",
      atomType: "characterClass",
      negative: false,
      repetition,
      location,
      text,
      members: [
        {
          kind: "range",
          from: from.value,
          to: to.value,
          location: { line: location.line, column: location.column + offset },
          text: remaining,
        },
      ],
    };
  }

  const property = /^(not\s+)?unicode\s+property(?:\s+|$)/iu.exec(remaining);
  if (property) {
    const suffix = remaining.slice(property[0].length);
    const quoteLocation = {
      line: location.line,
      column: location.column + offset + property[0].length,
    };
    if (!suffix.startsWith('"'))
      fail(
        "INVALID_UNICODE_PROPERTY",
        "A Unicode property needs one JSON-quoted name or name=value pair.",
        quoteLocation,
        'Use `unicode property "Letter"` or `not unicode property "Script=Greek"`.',
      );
    const quoted = readQuoted(rawLine.slice(quoteLocation.column - 1), quoteLocation);
    if (quoted.length !== suffix.length) {
      const trailing = suffix.slice(quoted.length);
      fail("TRAILING_TEXT", "Unexpected text after the Unicode property.", {
        line: location.line,
        column:
          quoteLocation.column + quoted.length + trailing.length - trailing.trimStart().length,
      });
    }
    const propertyLocation = { line: location.line, column: quoteLocation.column + 1 };
    if (!/^(?:[A-Za-z0-9_]+|[A-Za-z_]+=[A-Za-z0-9_]+)$/u.test(quoted.value))
      fail(
        "INVALID_UNICODE_PROPERTY",
        "Use an ASCII Unicode property alias or a property=value pair, without spaces.",
        propertyLocation,
        "Use `Letter`, `General_Category=Letter` or `Script_Extensions=Greek`; aliases are case-sensitive.",
      );
    return {
      kind: "atom",
      atomType: "unicodeProperty",
      value: quoted.value,
      propertyType: UNICODE_STRING_PROPERTIES.includes(quoted.value) ? "string" : "character",
      negative: property[1] !== undefined,
      repetition,
      location,
      propertyLocation,
      text,
    };
  }

  const textWithout = /^text without:\s*/i.exec(remaining);
  if (textWithout || /^any text$/i.test(remaining)) {
    if (repetition) {
      fail(
        "DUPLICATE_REPETITION",
        "This rule already matches a sequence.",
        { line: location.line, column: location.column + offset },
        textWithout
          ? "Use counts with `none of:`, such as `3 none of: a, b`."
          : "Use counts with `any character`, such as `3 any character`.",
      );
    }
    if (textWithout) {
      const values = readCharacterList(
        remaining.slice(textWithout[0].length),
        {
          line: location.line,
          column: location.column + textWithout[0].length,
        },
        rawLine,
      );
      return atom("charSet", values, { kind: "zeroOrMore" }, location, text, true);
    }
    return atom("wildcard", ".", { kind: "zeroOrMore" }, location, text);
  }

  if (/^any character$/i.test(remaining)) return atom("wildcard", ".", repetition, location, text);
  for (const [phrase, token] of SHORTHANDS) {
    if (remaining.toLowerCase() === phrase) {
      if (
        [
          "digits",
          "hex digits",
          "letters",
          "lowercase letters",
          "uppercase letters",
          "spaces",
          "word characters",
          "path segment characters",
        ].includes(phrase) &&
        !repetition
      )
        repetition = { kind: "oneOrMore" };
      return atom("shorthand", token, repetition, location, text);
    }
  }

  if (remaining.startsWith('"')) {
    const quoted = readQuoted(rawLine.slice(location.column - 1 + offset), {
      line: location.line,
      column: location.column + offset,
    });
    if (quoted.length !== remaining.length) {
      const trailing = remaining.slice(quoted.length);
      const leadingWhitespace = trailing.length - trailing.trimStart().length;
      fail("TRAILING_TEXT", "Unexpected text after the quoted literal.", {
        line: location.line,
        column: location.column + offset + quoted.length + leadingWhitespace,
      });
    }
    if (!quoted.value) {
      fail(
        "EMPTY_LITERAL",
        "A literal cannot be empty.",
        { line: location.line, column: location.column + offset },
        "Use `start` and `end` on separate lines to match an empty string.",
      );
    }
    return atom("literal", quoted.value, repetition, location, text);
  }

  const listPrefix = /^(one of:|none of:)\s*/i.exec(remaining);
  if (listPrefix) {
    const values = readCharacterList(
      remaining.slice(listPrefix[0].length),
      {
        line: location.line,
        column: location.column + offset + listPrefix[0].length,
      },
      rawLine,
    );
    return atom(
      "charSet",
      values,
      repetition,
      location,
      text,
      listPrefix[1].toLowerCase() === "none of:",
    );
  }

  fail(
    "UNKNOWN_RULE",
    `Unsupported rule: ${quoteText(text)}.`,
    { line: location.line, column: location.column + offset },
    QUOTE_STYLES.test(remaining)
      ? QUOTE_HINT
      : /^hex(?:\s|$)/i.test(remaining)
        ? "Use `hex digit` for one character or `hex digits` for one or more."
        : /^lowercase(?:\s|$)/i.test(remaining)
          ? "Use `lowercase letter` for one ASCII lowercase letter or `lowercase letters` for one or more."
          : /^uppercase(?:\s|$)/i.test(remaining)
            ? "Use `uppercase letter` for one ASCII uppercase letter or `uppercase letters` for one or more."
            : /^letters?(?:\s|$)/i.test(remaining)
              ? "Use `letter` for one ASCII letter or `letters` for one or more."
              : /^path(?:\s|$)/i.test(remaining)
                ? "Use `path segment character` for one character or `path segment characters` for one or more."
                : /^spaces?(?:\s|$)/i.test(remaining)
                  ? "Use `space` for one whitespace character or `spaces` for one or more, including line breaks."
                  : /^words?(?:\s|$)/i.test(remaining)
                    ? "Use `word character` for one ASCII letter, digit or underscore, or `word characters` for one or more."
                    : "Try `line start`, `any text` or `3 digits`.",
  );
}

/** @param {string} text @param {Location} location @param {string} rawLine @returns {ClassMember[]} */
function readClassMembers(text, location, rawLine) {
  /** @type {ClassMember[]} */
  const members = [];
  let cursor = 0;
  while (cursor < text.length) {
    while (/\s/u.test(text[cursor] ?? "")) cursor += 1;
    const start = cursor;
    while (cursor < text.length && text[cursor] !== ",") {
      if (text[cursor] === '"') {
        cursor += readQuoted(rawLine.slice(location.column - 1 + cursor), {
          line: location.line,
          column: location.column + cursor,
        }).length;
      } else cursor += 1;
    }
    const memberText = text.slice(start, cursor).trimEnd();
    const memberLocation = { line: location.line, column: location.column + start };
    if (!memberText)
      fail(
        "INVALID_CLASS_MEMBER",
        "A character class cannot contain an empty member.",
        memberLocation,
      );
    const node = parseItem(memberText, memberLocation, rawLine, true);
    if (node.kind !== "atom" || node.repetition)
      fail(
        "INVALID_CLASS_MEMBER",
        "Class members must be single characters, ranges, singular shorthands or Unicode properties, without repetition.",
        memberLocation,
      );
    const base = { location: memberLocation, text: memberText };
    if (node.atomType === "literal" && [...node.value].length === 1)
      members.push({ ...base, kind: "literal", value: node.value });
    else if (node.atomType === "shorthand" && /^\\[dDwWsS]$/u.test(node.value))
      members.push({ ...base, kind: "shorthand", value: node.value });
    else if (node.atomType === "unicodeProperty")
      members.push({
        ...base,
        kind: "unicodeProperty",
        value: node.value,
        propertyType: node.propertyType,
        negative: node.negative,
        propertyLocation: node.propertyLocation,
      });
    else if (node.atomType === "characterClass" && node.members.length === 1)
      members.push(node.members[0]);
    else
      fail(
        "INVALID_CLASS_MEMBER",
        'Use a one-code-point literal, `range "a" to "z"`, `digit`, `not digit`, `word`, `not word`, `space`, `not space` or a Unicode property.',
        memberLocation,
      );
    if (cursor === text.length) break;
    const comma = cursor++;
    if (!text.slice(cursor).trim())
      fail("INVALID_CLASS_MEMBER", "A character class cannot end with a comma.", {
        line: location.line,
        column: location.column + comma,
      });
  }
  if (!members.length)
    fail("EMPTY_CHARACTER_CLASS", "A character class needs at least one member.", location);
  return members;
}

/** @param {ReturnType<typeof parseAtom>} node @returns {ClassMember} */
function setOperand(node) {
  const base = { location: node.location, text: node.text };
  if (node.kind === "atom" && !node.repetition) {
    if (node.atomType === "literal" && [...node.value].length === 1)
      return { ...base, kind: "literal", value: node.value };
    if (node.atomType === "unicodeProperty")
      return {
        ...base,
        kind: "unicodeProperty",
        value: node.value,
        propertyType: node.propertyType,
        negative: node.negative,
        propertyLocation: node.propertyLocation,
      };
    if (node.atomType === "characterClass") {
      if (!node.operation && !node.negative && node.members.length === 1) return node.members[0];
      return {
        ...base,
        kind: "set",
        operation: node.operation ?? "union",
        negative: node.negative,
        members: node.members,
        endLocation: node.endLocation ?? node.location,
      };
    }
    if (node.atomType === "charSet")
      return {
        ...base,
        kind: "set",
        operation: "union",
        negative: node.negative,
        members: node.value.map((value) => ({ ...base, kind: "literal", value })),
        endLocation: node.location,
      };
    if (node.atomType === "shorthand") {
      if (/^\\[dDwWsS]$/u.test(node.value))
        return { ...base, kind: "shorthand", value: node.value };
      if (node.value === PATH_SEGMENT_SOURCE)
        return {
          ...base,
          kind: "set",
          operation: "union",
          negative: true,
          members: PATH_SEGMENT_EXCLUDED.map((value) => ({ ...base, kind: "literal", value })),
          endLocation: node.location,
        };
      if (/^\[[A-Za-z0-9-]+\]$/u.test(node.value)) {
        /** @type {ClassMember[]} */
        const members = [];
        for (let index = 1; index < node.value.length - 1; ) {
          if (node.value[index + 1] === "-") {
            members.push({
              ...base,
              kind: "range",
              from: node.value[index],
              to: node.value[index + 2],
            });
            index += 3;
          } else members.push({ ...base, kind: "literal", value: node.value[index++] });
        }
        return {
          ...base,
          kind: "set",
          operation: "union",
          negative: false,
          members,
          endLocation: node.location,
        };
      }
    }
  }
  return fail(
    "INVALID_SET_OPERAND",
    "A set operand must be a character, range, singular class, property, finite string set or nested set, without repetition.",
    node.location,
    'Use `"a"`, `digit`, `range "a" to "z"`, `string "ab"`, a class/property or another character-set block.',
  );
}

/** @param {ClassAtomNode} node @param {string[]} lines @param {number} start @param {number} depth @returns {number} */
function readSetBlock(node, lines, start, depth) {
  if (depth >= LIMITS.groupDepth)
    fail(
      "SET_DEPTH_LIMIT",
      `Groups and sets cannot nest more than ${LIMITS.groupDepth} levels.`,
      node.location,
    );
  for (let index = start + 1; index < lines.length; index += 1) {
    const raw = lines[index];
    const text = raw.trim();
    if (!text) continue;
    const location = { line: index + 1, column: raw.indexOf(text) + 1 };
    if (text === "}") {
      if (node.operation !== "union" && node.members.length < 2)
        fail(
          "SET_OPERAND_COUNT",
          "Intersection and subtraction need at least two operands.",
          node.location,
        );
      node.endLocation = location;
      return index;
    }
    const operand = parseAtom(text, location, raw);
    if (operand.kind === "atom" && operand.atomType === "characterClass" && operand.operation) {
      if (operand.repetition) setOperand(operand);
      index = readSetBlock(operand, lines, index, depth + 1);
    }
    node.members.push(setOperand(operand));
  }
  return fail("UNCLOSED_SET", "Close this character set with `}` on its own line.", node.location);
}

/** @param {string} source @returns {ParsedRules} */
export function parse(source) {
  if (typeof source !== "string") throw new TypeError("Rules must be a string.");
  validateSourceLength(source);
  const lines = splitLines(source);
  if (lines.length - Number(lines.at(-1) === "") > LIMITS.lines) {
    fail("LINE_LIMIT", `Input cannot exceed ${LIMITS.lines} lines.`, {
      line: LIMITS.lines + 1,
      column: 1,
    });
  }

  /** @type {RuleNode[]} */
  const rootNodes = [];
  let nodes = rootNodes;
  /** @type {{node: GroupNode|AlternationNode|AssertionNode, parent: RuleNode[], sawEnd: boolean}[]} */
  const groups = [];
  /** @type {Map<string, GroupNode>} */
  const names = new Map();
  /** @type {GroupNode[]} */
  const captures = [];
  /** @type {{node: BackreferenceNode, openGroups: (GroupNode|AlternationNode|AssertionNode)[]}[]} */
  const references = [];
  let captureCount = 0;
  /** @type {'input'|'line'|'mixed'|null} */
  let anchorMode = null;
  let sawEnd = false;
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.trim();
    if (!line) continue;
    let text = line;
    let column = raw.indexOf(line) + 1;
    const location = () => ({ line: index + 1, column });

    if (text === "}") {
      const frame = groups.pop();
      if (!frame) fail("UNEXPECTED_GROUP_END", "There is no open group to close.", location());
      if (frame.node.kind === "alternation" && frame.node.branches.length < 2)
        fail(
          "ALTERNATIVE_COUNT",
          "An either block needs at least two choices.",
          frame.node.location,
          "Put each choice on its own line; use a group block for a sequence or an empty choice.",
        );
      frame.node.endLocation = location();
      nodes = frame.parent;
      sawEnd = frame.sawEnd;
      continue;
    }

    const parent = groups.at(-1)?.node;
    if (parent?.kind === "alternation") {
      nodes = [];
      parent.branches.push(nodes);
      sawEnd = false;
    }

    const start = START_ANCHOR.exec(text);
    if (start) {
      const phrase = start[1];
      const mode = phrase.toLowerCase() === "line start" ? "line" : "input";
      if (nodes.some((node) => node.kind === "anchor" && node.edge === "start")) {
        fail("DUPLICATE_ANCHOR", DUPLICATE_START_ANCHOR_MESSAGE, location());
      }
      if (nodes.length !== 0) {
        fail("MISPLACED_ANCHOR", "Start anchor must be the first rule.", location());
      }
      anchorMode = anchorMode && anchorMode !== mode ? "mixed" : mode;
      nodes.push(anchor("start", mode, location(), phrase));
      text = text.slice(start[0].length);
      column += start[0].length;
      if (START_ANCHOR.test(text)) {
        fail("DUPLICATE_ANCHOR", DUPLICATE_START_ANCHOR_MESSAGE, location());
      }
      if (!text) continue;
    }

    const end = /^(line end|end)$/i.exec(text);
    if (end) {
      const mode = end[1].toLowerCase() === "line end" ? "line" : "input";
      if (sawEnd) fail("DUPLICATE_ANCHOR", "Use only one end anchor.", location());
      anchorMode = anchorMode && anchorMode !== mode ? "mixed" : mode;
      nodes.push(anchor("end", mode, location(), text));
      sawEnd = true;
      continue;
    }
    if (sawEnd) fail("MISPLACED_ANCHOR", "End anchor must be the last rule.", location());

    const node = parseAtom(text, location(), raw);
    if (node.kind === "atom" && node.atomType === "characterClass" && node.operation)
      index = readSetBlock(node, lines, index, groups.length);
    if (node.kind === "group" || node.kind === "alternation" || node.kind === "assertion") {
      if (groups.length >= LIMITS.groupDepth) {
        fail(
          "GROUP_DEPTH_LIMIT",
          `Groups cannot nest more than ${LIMITS.groupDepth} levels.`,
          location(),
        );
      }
      if (node.kind === "group" && node.capturing) {
        node.captureIndex = ++captureCount;
        captures.push(node);
        if (node.name !== null) {
          if (names.has(node.name))
            fail(
              "DUPLICATE_CAPTURE_NAME",
              `Capture ${quoteText(node.name)} is already defined.`,
              location(),
            );
          names.set(node.name, node);
        }
      }
      nodes.push(node);
      groups.push({ node, parent: nodes, sawEnd });
      nodes = node.kind === "alternation" ? [] : node.nodes;
      sawEnd = false;
    } else {
      nodes.push(node);
      if (node.kind === "backreference")
        references.push({ node, openGroups: groups.map((frame) => frame.node) });
    }
  }

  if (groups.length)
    fail(
      "UNCLOSED_GROUP",
      "Close this group with `}` on its own line.",
      groups.at(-1)?.node.location ?? { line: 1, column: 1 },
    );
  if (rootNodes.length === 0)
    fail("EMPTY_SOURCE", "Enter at least one instruction.", { line: 1, column: 1 });
  for (const { node, openGroups } of references) {
    const target =
      typeof node.reference === "string" ? names.get(node.reference) : captures[node.reference - 1];
    if (!target)
      fail(
        "MISSING_CAPTURE_REFERENCE",
        `Capture ${typeof node.reference === "string" ? quoteText(node.reference) : node.reference} is not defined.`,
        node.referenceLocation,
      );
    if (target.location.line > node.location.line)
      fail(
        "FORWARD_CAPTURE_REFERENCE",
        "A capture reference must follow its capture.",
        node.referenceLocation,
      );
    if (openGroups.includes(target))
      fail(
        "SELF_CAPTURE_REFERENCE",
        "A capture reference must follow the capture's closing brace.",
        node.referenceLocation,
      );
    node.captureIndex = target.captureIndex ?? 0;
  }
  return { nodes: rootNodes, anchorMode };
}
