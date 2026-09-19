import { anchor, atom } from "./ast.js";
import { fail } from "./diagnostics.js";

export const LIMITS = Object.freeze({ sourceLength: 16_384, lines: 200, repetition: 1_000 });

const SHORTHANDS = new Map([
  ["non-alphanumeric character", "\\W"],
  ["alphanumeric character", "\\w"],
  ["non-digit character", "\\D"],
  ["digit character", "\\d"],
  ["non-whitespace character", "\\S"],
  ["any whitespace", "\\s"]
]);

const REPETITION = "between [0-9]+ and [0-9]+ times|at least [0-9]+ times|[0-9]+ times|any number of times|at least one time|at most one time";
const PREFIX_REPETITION = new RegExp(`^(${REPETITION}) for\\s+`, "i");
const SUFFIX_REPETITION = new RegExp(`(?:,\\s*|\\s+)(${REPETITION})$`, "i");

function parseRepetition(text, location) {
  const normalized = text.toLowerCase();
  if (normalized === "any number of times") return { kind: "zeroOrMore" };
  if (normalized === "at least one time") return { kind: "oneOrMore" };
  if (normalized === "at most one time") return { kind: "optional" };
  const numbers = [...normalized.matchAll(/[0-9]+/g)].map(match => Number(match[0]));
  if (numbers.some(number => !Number.isSafeInteger(number) || number > LIMITS.repetition)) {
    fail("REPETITION_LIMIT", `Repetition counts must be at most ${LIMITS.repetition}.`, location);
  }
  if (normalized.startsWith("between ")) {
    if (numbers[0] > numbers[1]) {
      fail("INVALID_RANGE", "The lower repetition bound must not exceed the upper bound.", location);
    }
    return { kind: "range", min: numbers[0], max: numbers[1] };
  }
  if (normalized.startsWith("at least ")) return { kind: "minimum", min: numbers[0] };
  return { kind: "exact", min: numbers[0] };
}

function readQuoted(text, location) {
  if (!text.startsWith('"')) fail("INVALID_QUOTE", "Expected a double-quoted value.", location);
  let escaped = false;
  for (let index = 1; index < text.length; index += 1) {
    const character = text[index];
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === '"') {
      try {
        return { value: JSON.parse(text.slice(0, index + 1)), length: index + 1 };
      } catch {
        fail("INVALID_QUOTE", "Use JSON-style escapes inside quoted values.", location);
      }
    }
  }
  fail("INVALID_QUOTE", "Missing closing double quote.", location);
}

function readCharacterList(text, location) {
  const items = [];
  let index = 0;
  while (index < text.length) {
    while (/\s/u.test(text[index] ?? "")) index += 1;
    if (index >= text.length) break;
    let value;
    if (text[index] === '"') {
      const quoted = readQuoted(text.slice(index), { line: location.line, column: location.column + index });
      value = quoted.value;
      index += quoted.length;
    } else {
      const nextComma = text.indexOf(",", index);
      const end = nextComma === -1 ? text.length : nextComma;
      value = text.slice(index, end).trim();
      index = end;
    }
    if ([...value].length !== 1) {
      fail("INVALID_CHARACTER", "Each character-list item must be one Unicode code point.", { line: location.line, column: location.column + index });
    }
    items.push(value);
    while (/\s/u.test(text[index] ?? "")) index += 1;
    if (index === text.length) break;
    if (text[index] !== ",") {
      fail("INVALID_CHARACTER_LIST", "Separate character-list items with commas.", { line: location.line, column: location.column + index });
    }
    index += 1;
    while (/\s/u.test(text[index] ?? "")) index += 1;
    if (index === text.length) {
      fail("INVALID_CHARACTER_LIST", "A character list cannot end with a comma.", { line: location.line, column: location.column + index });
    }
  }
  if (items.length === 0) fail("EMPTY_CHARACTER_LIST", "A character list needs at least one item.", location);
  return items;
}

function parseAtom(text, location, originalText) {
  let remaining = text;
  let repetition = null;
  const prefix = PREFIX_REPETITION.exec(remaining);
  if (prefix) {
    repetition = parseRepetition(prefix[1], location);
    remaining = remaining.slice(prefix[0].length);
  }

  const suffix = SUFFIX_REPETITION.exec(remaining);
  if (suffix) {
    if (repetition) fail("DUPLICATE_REPETITION", "Use only one repetition per atom.", location);
    repetition = parseRepetition(suffix[1], { line: location.line, column: location.column + suffix.index });
    remaining = remaining.slice(0, suffix.index).trimEnd();
  }

  const article = /^(?:a|an)\s+/i.exec(remaining);
  if (article && remaining[article[0].length] !== '"') {
    remaining = remaining.slice(article[0].length);
  }

  if (/^any character$/i.test(remaining)) return atom("wildcard", ".", repetition, location, originalText);
  for (const [phrase, token] of SHORTHANDS) {
    if (remaining.toLowerCase() === phrase) return atom("shorthand", token, repetition, location, originalText);
  }

  const literalPrefix = /^(?:a|an)\s+/i.exec(remaining);
  if (literalPrefix && remaining[literalPrefix[0].length] === '"') {
    const quoted = readQuoted(remaining.slice(literalPrefix[0].length), {
      line: location.line,
      column: location.column + literalPrefix[0].length
    });
    if (literalPrefix[0].length + quoted.length !== remaining.length) {
      fail("TRAILING_TEXT", "Unexpected text after the quoted literal.", location);
    }
    if (!quoted.value) fail("EMPTY_LITERAL", "A literal cannot be empty.", location);
    return atom("literal", quoted.value, repetition, location, originalText);
  }

  const classPrefix = /^(any of the following characters:|anything except the following characters:)\s*/i.exec(remaining);
  if (classPrefix) {
    const values = readCharacterList(remaining.slice(classPrefix[0].length), {
      line: location.line,
      column: location.column + classPrefix[0].length
    });
    return atom("charSet", values, repetition, location, originalText, classPrefix[1].toLowerCase().startsWith("anything except"));
  }

  fail("UNKNOWN_RULE", `Unsupported instruction: ${JSON.stringify(originalText)}.`, location, "Use a phrase from docs/LANGUAGE.md.");
}

export function parse(source) {
  if (typeof source !== "string") throw new TypeError("Rules must be a string.");
  if (source.length > LIMITS.sourceLength) {
    fail("SOURCE_LIMIT", `Rules cannot exceed ${LIMITS.sourceLength} characters.`, { line: 1, column: 1 });
  }
  const lines = source.split(/\r?\n/u);
  if (lines.length > LIMITS.lines) {
    fail("LINE_LIMIT", `Rules cannot exceed ${LIMITS.lines} lines.`, { line: LIMITS.lines + 1, column: 1 });
  }

  const nodes = [];
  let anchorMode = null;
  let sawEnd = false;
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.trim();
    if (!line) continue;
    let text = line;
    let column = raw.indexOf(line) + 1;
    const location = () => ({ line: index + 1, column });

    const start = /^at the beginning of (the input|a line)(?:,\s*|$)/i.exec(text);
    if (start) {
      const mode = start[1].toLowerCase() === "a line" ? "line" : "input";
      if (nodes.length !== 0) fail("MISPLACED_ANCHOR", "A beginning anchor must be the first instruction.", location());
      anchorMode = mode;
      nodes.push(anchor("start", mode, location(), start[0].replace(/,\s*$/u, "")));
      text = text.slice(start[0].length);
      column += start[0].length;
      if (!text) continue;
    }

    const end = /^(end of the input|end of the line)$/i.exec(text);
    if (end) {
      const mode = end[1].toLowerCase().endsWith("line") ? "line" : "input";
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
    nodes.push(parseAtom(text, location(), line));
  }

  if (nodes.length === 0) fail("EMPTY_SOURCE", "Enter at least one instruction.", { line: 1, column: 1 });
  return { nodes, anchorMode };
}
