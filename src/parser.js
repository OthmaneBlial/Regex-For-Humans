import { anchor, atom } from "./ast.js";
import { fail } from "./diagnostics.js";

/** @typedef {import('./ast.js').Location} Location */
/** @typedef {import('./ast.js').Repetition} Repetition */
/** @typedef {import('./ast.js').AtomNode} AtomNode */
/** @typedef {import('./ast.js').RuleNode} RuleNode */
/** @typedef {import('./ast.js').ParsedRules} ParsedRules */

export const LIMITS = Object.freeze({ sourceLength: 16_384, lines: 200, repetition: 1_000 });

/** @param {string} source */
export function validateSourceLength(source) {
  if (source.length > LIMITS.sourceLength) {
    const prefix = source.slice(0, LIMITS.sourceLength);
    const locationSource =
      prefix.endsWith("\r") && source[LIMITS.sourceLength] === "\n" ? prefix.slice(0, -1) : prefix;
    const lines = locationSource.split(/\r?\n/u);
    fail("SOURCE_LIMIT", `Rules cannot exceed ${LIMITS.sourceLength} UTF-16 code units.`, {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    });
  }
}

const SHORTHANDS = new Map([
  ["word", "\\w"],
  ["not word", "\\W"],
  ["non-alphanumeric character", "\\W"],
  ["alphanumeric character", "\\w"],
  ["not digit", "\\D"],
  ["digit", "\\d"],
  ["non-digit character", "\\D"],
  ["digit character", "\\d"],
  ["not space", "\\S"],
  ["space", "\\s"],
  ["non-whitespace character", "\\S"],
  ["any whitespace", "\\s"],
  ["digits", "\\d"],
]);

const REPETITION =
  "between [0-9]+ and [0-9]+ times|at least [0-9]+ times|[0-9]+ times|any number of times|at least one time|at most one time";
const PREFIX_REPETITION = new RegExp(`^(${REPETITION}) for\\s+`, "i");
const SUFFIX_REPETITION = new RegExp(`(?:,\\s*|\\s+)(${REPETITION})$`, "i");

/** @param {string} text @param {Location} location @returns {Repetition} */
function parseRepetition(text, location) {
  const normalized = text.toLowerCase();
  if (normalized === "any number of times") return { kind: "zeroOrMore" };
  if (normalized === "at least one time") return { kind: "oneOrMore" };
  if (normalized === "at most one time") return { kind: "optional" };
  const numberMatches = [...normalized.matchAll(/[0-9]+/g)];
  const numbers = numberMatches.map((match) => Number(match[0]));
  const invalidCount = numberMatches.find((match) => {
    const number = Number(match[0]);
    return !Number.isSafeInteger(number) || number > LIMITS.repetition;
  });
  if (invalidCount) {
    fail("REPETITION_LIMIT", `Repetition counts must be at most ${LIMITS.repetition}.`, {
      line: location.line,
      column: location.column + (invalidCount.index ?? 0),
    });
  }
  if (normalized.startsWith("between ")) {
    if (numbers[0] > numbers[1]) {
      fail("INVALID_RANGE", "The lower repetition bound must not exceed the upper bound.", {
        line: location.line,
        column: location.column + (numberMatches[1]?.index ?? 0),
      });
    }
    return { kind: "range", min: numbers[0], max: numbers[1] };
  }
  if (normalized.startsWith("at least ")) return { kind: "minimum", min: numbers[0] };
  return { kind: "exact", min: numbers[0] };
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

/** @param {string} text @param {Location} location @returns {string[]} */
function readCharacterList(text, location) {
  const items = [];
  let index = 0;
  while (index < text.length) {
    while (/\s/u.test(text[index] ?? "")) index += 1;
    if (index >= text.length) break;
    const itemStart = index;
    let value;
    if (text[index] === '"') {
      const quoted = readQuoted(text.slice(index), {
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
    if ([...value].length !== 1) {
      fail("INVALID_CHARACTER", "Each character-list item must be one Unicode code point.", {
        line: location.line,
        column: location.column + itemStart,
      });
    }
    items.push(value);
    while (/\s/u.test(text[index] ?? "")) index += 1;
    if (index === text.length) break;
    if (text[index] !== ",") {
      fail("INVALID_CHARACTER_LIST", "Separate character-list items with commas.", {
        line: location.line,
        column: location.column + index,
      });
    }
    index += 1;
    while (/\s/u.test(text[index] ?? "")) index += 1;
    if (index === text.length) {
      fail("INVALID_CHARACTER_LIST", "A character list cannot end with a comma.", {
        line: location.line,
        column: location.column + index,
      });
    }
  }
  if (items.length === 0)
    fail("EMPTY_CHARACTER_LIST", "A character list needs at least one item.", location);
  return items;
}

/** @param {string} text @param {Location} location @param {string} originalText @returns {AtomNode} */
function parseAtom(text, location, originalText) {
  let remaining = text;
  let repetition = null;
  let offset = 0;
  const prefix = PREFIX_REPETITION.exec(remaining);
  if (prefix) {
    repetition = parseRepetition(prefix[1], location);
    remaining = remaining.slice(prefix[0].length);
    offset += prefix[0].length;
  }

  const count = /^([0-9]+)\s+/u.exec(remaining);
  if (count) {
    if (repetition) {
      fail("DUPLICATE_REPETITION", "Use only one repetition per atom.", {
        line: location.line,
        column: location.column + offset,
      });
    }
    repetition = parseRepetition(`${count[1]} times`, location);
    remaining = remaining.slice(count[0].length);
    offset += count[0].length;
  }

  const suffix = SUFFIX_REPETITION.exec(remaining);
  if (suffix) {
    const suffixLocation = {
      line: location.line,
      column: location.column + offset + suffix.index + suffix[0].length - suffix[1].length,
    };
    if (repetition || SUFFIX_REPETITION.test(remaining.slice(0, suffix.index).trimEnd())) {
      fail("DUPLICATE_REPETITION", "Use only one repetition per atom.", suffixLocation);
    }
    repetition = parseRepetition(suffix[1], suffixLocation);
    remaining = remaining.slice(0, suffix.index).trimEnd();
  }

  const article = /^(?:a|an)\s+/i.exec(remaining);
  if (article && remaining[article[0].length] !== '"') {
    remaining = remaining.slice(article[0].length);
  }

  if (/^any character$/i.test(remaining))
    return atom("wildcard", ".", repetition, location, originalText);
  for (const [phrase, token] of SHORTHANDS) {
    if (remaining.toLowerCase() === phrase) {
      if (phrase === "digits" && !repetition)
        repetition = parseRepetition("at least one time", location);
      return atom("shorthand", token, repetition, location, originalText);
    }
  }

  const literalPrefix = /^(?:a|an)\s+/i.exec(remaining);
  const literal =
    literalPrefix && remaining[literalPrefix[0].length] === '"'
      ? remaining.slice(literalPrefix[0].length)
      : remaining.startsWith('"')
        ? remaining
        : null;
  if (literal !== null) {
    const offset = remaining.length - literal.length;
    const quoted = readQuoted(literal, {
      line: location.line,
      column: location.column + offset,
    });
    if (offset + quoted.length !== remaining.length) {
      const trailing = remaining.slice(offset + quoted.length);
      const leadingWhitespace = trailing.length - trailing.trimStart().length;
      fail("TRAILING_TEXT", "Unexpected text after the quoted literal.", {
        line: location.line,
        column: location.column + offset + quoted.length + leadingWhitespace,
      });
    }
    if (!quoted.value) fail("EMPTY_LITERAL", "A literal cannot be empty.", location);
    return atom("literal", quoted.value, repetition, location, originalText);
  }

  const classPrefix =
    /^(one of:|none of:|any of the following characters:|anything except the following characters:)\s*/i.exec(
      remaining,
    );
  if (classPrefix) {
    const values = readCharacterList(remaining.slice(classPrefix[0].length), {
      line: location.line,
      column: location.column + classPrefix[0].length,
    });
    return atom(
      "charSet",
      values,
      repetition,
      location,
      originalText,
      /^(?:none of:|anything except)/iu.test(classPrefix[1].toLowerCase()),
    );
  }

  fail(
    "UNKNOWN_RULE",
    `Unsupported instruction: ${JSON.stringify(originalText)}.`,
    location,
    "Use a phrase from docs/LANGUAGE.md.",
  );
}

/** @param {string} source @returns {ParsedRules} */
export function parse(source) {
  if (typeof source !== "string") throw new TypeError("Rules must be a string.");
  validateSourceLength(source);
  const lines = source.split(/\r?\n/u);
  if (lines.length - Number(source.endsWith("\n")) > LIMITS.lines) {
    fail("LINE_LIMIT", `Rules cannot exceed ${LIMITS.lines} lines.`, {
      line: LIMITS.lines + 1,
      column: 1,
    });
  }

  /** @type {RuleNode[]} */
  const nodes = [];
  /** @type {'input'|'line'|null} */
  let anchorMode = null;
  let sawEnd = false;
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.trim();
    if (!line) continue;
    let text = line;
    let column = raw.indexOf(line) + 1;
    const location = () => ({ line: index + 1, column });

    const start = /^(at the beginning of (the input|a line)|line start|start)(?:,\s*|\s+|$)/i.exec(
      text,
    );
    if (start) {
      const phrase = start[1];
      const mode = /(?:a line|line start)$/iu.test(phrase.toLowerCase()) ? "line" : "input";
      if (nodes.length !== 0)
        fail("MISPLACED_ANCHOR", "A beginning anchor must be the first instruction.", location());
      anchorMode = mode;
      nodes.push(anchor("start", mode, location(), phrase));
      text = text.slice(start[0].length);
      column += start[0].length;
      if (!text) continue;
    }

    const end = /^(end of the input|end of the line|line end|end)$/i.exec(text);
    if (end) {
      const mode = /(?:end of the line|line end)$/iu.test(end[1].toLowerCase()) ? "line" : "input";
      if (sawEnd) fail("DUPLICATE_ANCHOR", "Only one ending anchor is allowed.", location());
      if (anchorMode && anchorMode !== mode) {
        fail("MIXED_ANCHORS", "Input and line anchors cannot be mixed.", location());
      }
      anchorMode = mode;
      nodes.push(anchor("end", mode, location(), text));
      sawEnd = true;
      continue;
    }
    if (sawEnd) fail("MISPLACED_ANCHOR", "No instruction may follow an ending anchor.", location());

    const looking = /^I am looking for\s+/i.exec(text);
    if (looking) {
      text = text.slice(looking[0].length);
      column += looking[0].length;
    }
    nodes.push(parseAtom(text, location(), text));
  }

  if (nodes.length === 0)
    fail("EMPTY_SOURCE", "Enter at least one instruction.", { line: 1, column: 1 });
  return { nodes, anchorMode };
}
