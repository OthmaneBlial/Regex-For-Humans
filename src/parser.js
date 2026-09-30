import { anchor, atom } from "./ast.js";
import { fail } from "./diagnostics.js";
import { quoteText } from "./display.js";

/** @typedef {import('./ast.js').Location} Location */
/** @typedef {import('./ast.js').Repetition} Repetition */
/** @typedef {import('./ast.js').AtomNode} AtomNode */
/** @typedef {import('./ast.js').RuleNode} RuleNode */
/** @typedef {import('./ast.js').ParsedRules} ParsedRules */

const MAX_SOURCE_LENGTH = 16_384;
export const LIMITS = Object.freeze({
  sourceLength: MAX_SOURCE_LENGTH,
  regexSourceLength: MAX_SOURCE_LENGTH * 8, // U+2028 and U+2029 each escape to eight code units.
  lines: 200,
  repetition: 1_000,
});

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
  ["not word", "\\W"],
  ["not digit", "\\D"],
  ["digit", "\\d"],
  ["letter", "[A-Za-z]"],
  ["letters", "[A-Za-z]"],
  ["hex digit", "[0-9A-Fa-f]"],
  ["hex digits", "[0-9A-Fa-f]"],
  ["not space", "\\S"],
  ["space", "\\s"],
  ["digits", "\\d"],
]);

const START_ANCHOR = /^(line start|start)(?:,\s*|\s+|$)/i;
const DUPLICATE_START_ANCHOR_MESSAGE = "Use only one start anchor.";
const QUOTE_STYLES = /^['`“”‘’]/u;
const QUOTE_HINT = 'Use JSON double quotes for quoted text, such as `"A"`.';
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

/** @param {string} text @param {Location} location @param {string} rawLine @returns {string[]} */
function readCharacterList(text, location, rawLine) {
  const items = [];
  let index = 0;
  while (index < text.length) {
    while (/\s/u.test(text[index] ?? "")) index += 1;
    if (index >= text.length) break;
    const itemStart = index;
    let value;
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
    if ([...value].length !== 1) {
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

/** @param {string} text @param {Location} location @param {string} rawLine @returns {AtomNode} */
function parseAtom(text, location, rawLine) {
  let remaining = text;
  /** @type {Repetition|null} */
  let repetition = null;
  let offset = 0;
  const count = COUNT_PREFIX.exec(remaining);
  const range = /^(between\s+)(\S+)(\s+and\s+)(\S+)\s+/iu.exec(remaining);
  if (range) {
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
  if (COUNT_PREFIX.test(remaining) || anotherRange) {
    fail(
      "DUPLICATE_REPETITION",
      range || anotherRange
        ? "Put one count or range before the instruction."
        : "Put one exact count before the instruction.",
      { line: location.line, column: location.column + offset },
    );
  }
  if (repetition && /^(?:start|end|line start|line end)$/iu.test(remaining)) {
    fail(
      "ANCHOR_REPETITION",
      "Counts apply to items, not anchors.",
      { line: location.line, column: location.column + offset },
      "Remove the count or apply it to an item, such as `3 digits`.",
    );
  }

  const textWithout = /^text without:\s*/i.exec(remaining);
  if (textWithout || /^any text$/i.test(remaining)) {
    if (repetition) {
      fail("DUPLICATE_REPETITION", "This rule already matches a sequence.", {
        line: location.line,
        column: location.column + offset,
      });
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
      if (["digits", "hex digits", "letters"].includes(phrase) && !repetition)
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

  const classPrefix = /^(one of:|none of:)\s*/i.exec(remaining);
  if (classPrefix) {
    const values = readCharacterList(
      remaining.slice(classPrefix[0].length),
      {
        line: location.line,
        column: location.column + offset + classPrefix[0].length,
      },
      rawLine,
    );
    return atom(
      "charSet",
      values,
      repetition,
      location,
      text,
      classPrefix[1].toLowerCase() === "none of:",
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
        : /^letters?(?:\s|$)/i.test(remaining)
          ? "Use `letter` for one ASCII letter or `letters` for one or more."
          : "Try `line start`, `any text` or `3 digits`.",
  );
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
      anchorMode = mode;
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
      if (anchorMode && anchorMode !== mode) {
        fail("MIXED_ANCHORS", "Do not mix input and line anchors.", location());
      }
      anchorMode = mode;
      nodes.push(anchor("end", mode, location(), text));
      sawEnd = true;
      continue;
    }
    if (sawEnd) fail("MISPLACED_ANCHOR", "End anchor must be the last rule.", location());

    nodes.push(parseAtom(text, location(), raw));
  }

  if (nodes.length === 0)
    fail("EMPTY_SOURCE", "Enter at least one instruction.", { line: 1, column: 1 });
  return { nodes, anchorMode };
}
