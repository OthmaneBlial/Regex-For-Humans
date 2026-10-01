import { CompileError, fail } from "./diagnostics.js";
import { quoteText } from "./display.js";
import { LIMITS, parse } from "./parser.js";

const ESCAPED_ATOMS = new Map([
  ["d", "digit"],
  ["D", "not digit"],
  ["w", "word"],
  ["W", "not word"],
  ["s", "space"],
  ["S", "not space"],
]);

const CLASS_ATOMS = new Map([
  ["0-9", "digit"],
  ["^0-9", "not digit"],
  ["A-Z", "uppercase letter"],
  ["a-z", "lowercase letter"],
  ["A-Za-z", "letter"],
  ["a-zA-Z", "letter"],
  ["0-9A-Fa-f", "hex digit"],
  ["0-9a-fA-F", "hex digit"],
  ["A-F0-9a-f", "hex digit"],
  ["A-Fa-f0-9", "hex digit"],
  ["a-f0-9A-F", "hex digit"],
  ["a-fA-F0-9", "hex digit"],
]);

const CONTROL_ESCAPES = new Map([
  ["f", "\f"],
  ["n", "\n"],
  ["r", "\r"],
  ["t", "\t"],
  ["v", "\v"],
]);

const UNSUPPORTED_HINT =
  "Supported syntax includes literals, anchors, common character classes, repetition, non-capturing literal groups and i/s/u/m flags. Capturing or complex groups, alternation, lookaround and backreferences are not supported.";

/** @typedef {{end: number, literal?: string, phrase?: string, category?: string, set?: {values: string[], negative: boolean}}} AtomToken */
/** @typedef {{end: number, kind: 'zeroOrMore'|'oneOrMore'|'optional'|'exact'|'range'|'atLeast'|null, min?: number, max?: number}} QuantifierToken */
/** @typedef {AtomToken & QuantifierToken & {index: number}} PositionedAtom */

/** @param {string} message @param {number} index @param {string} [hint] @returns {never} */
function unsupported(message, index, hint = UNSUPPORTED_HINT) {
  fail("UNSUPPORTED_REGEX", message, { line: 1, column: index + 1 }, hint);
}

/** @param {string} left @param {string} right */
function joinsSurrogates(left, right) {
  return /[\ud800-\udbff]$/u.test(left) && /^[\udc00-\udfff]/u.test(right);
}

/** @param {string} source @param {number} index @param {boolean} [inClass] @returns {AtomToken} */
function readEscape(source, index, inClass = false) {
  const escaped = source[index + 1];
  if (escaped === undefined) unsupported("The regex ends with an incomplete escape.", index);

  if (!inClass && ESCAPED_ATOMS.has(escaped)) {
    return { end: index + 2, phrase: ESCAPED_ATOMS.get(escaped) };
  }
  if (inClass && ESCAPED_ATOMS.has(escaped)) {
    return { end: index + 2, category: escaped };
  }

  if (escaped === "u") {
    if (source[index + 2] === "{") {
      const close = source.indexOf("}", index + 3);
      if (close < 0) unsupported("The Unicode code-point escape is incomplete.", index);
      const digits = source.slice(index + 3, close);
      if (!/^[0-9a-f]{1,6}$/iu.test(digits)) {
        unsupported("Use one to six hexadecimal digits in a Unicode code-point escape.", index);
      }
      const point = Number.parseInt(digits, 16);
      if (point > 0x10ffff) unsupported("The Unicode code point is out of range.", index);
      return { end: close + 1, literal: String.fromCodePoint(point) };
    }
    const digits = source.slice(index + 2, index + 6);
    if (!/^[0-9a-f]{4}$/iu.test(digits)) {
      unsupported("Use four hexadecimal digits in a Unicode escape.", index);
    }
    const unit = Number.parseInt(digits, 16);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const low = /^\\u([dD][c-fC-F][0-9a-fA-F]{2})$/u.exec(source.slice(index + 6, index + 12));
      if (low) {
        return {
          end: index + 12,
          literal: String.fromCharCode(unit, Number.parseInt(low[1], 16)),
        };
      }
    }
    return { end: index + 6, literal: String.fromCharCode(unit) };
  }

  if (escaped === "x") {
    const digits = source.slice(index + 2, index + 4);
    if (!/^[0-9a-f]{2}$/iu.test(digits)) {
      unsupported("Use two hexadecimal digits in a hexadecimal escape.", index);
    }
    return { end: index + 4, literal: String.fromCharCode(Number.parseInt(digits, 16)) };
  }

  if (escaped === "c" && /^[A-Za-z]$/u.test(source[index + 2] ?? "")) {
    return { end: index + 3, literal: String.fromCharCode(source.charCodeAt(index + 2) % 32) };
  }
  const control = CONTROL_ESCAPES.get(escaped);
  if (control !== undefined) return { end: index + 2, literal: control };
  if (escaped === "0") {
    if (/^[0-9]$/u.test(source[index + 2] ?? "")) {
      unsupported("Octal escapes cannot be translated.", index);
    }
    return { end: index + 2, literal: "\0" };
  }
  if (inClass && escaped === "b") return { end: index + 2, literal: "\b" };

  const special = inClass ? "\\[]^-/" : "\\^$.*+?()[]{}|/";
  if (special.includes(escaped)) return { end: index + 2, literal: escaped };
  unsupported(`The escape ${quoteText(`\\${escaped}`)} is not supported.`, index);
}

/** @param {string} source @param {number} start @returns {AtomToken} */
function readCharacterClass(source, start) {
  let contentStart = start + 1;
  let negative = false;
  if (source[contentStart] === "^") {
    negative = true;
    contentStart += 1;
  }

  let end = contentStart;
  let escaped = false;
  for (; end < source.length; end += 1) {
    const character = source[end];
    if (escaped) escaped = false;
    else if (character === "\\") escaped = true;
    else if (character === "]") break;
  }
  if (end === source.length) unsupported("The character class is not closed.", start);

  const body = source.slice(contentStart, end);
  const known = CLASS_ATOMS.get(`${negative ? "^" : ""}${body}`);
  if (known) return { end: end + 1, phrase: known };

  if (/^\\[dDwWsS]$/u.test(body)) {
    const category = body.charAt(1);
    const phrase = ESCAPED_ATOMS.get(negative ? swapClassCategory(category) : category);
    if (phrase) return { end: end + 1, phrase };
  }

  /** @type {string[]} */
  const values = [];
  for (let index = contentStart; index < end; ) {
    if (source[index] === "-") {
      unsupported("Character ranges are supported only for digit, letter and hex classes.", index);
    }
    if (source[index] === "\\") {
      const item = readEscape(source, index, true);
      if (item.category) {
        unsupported("A shorthand cannot be combined with other character-class items.", index);
      }
      if (item.phrase) unsupported("This character-class escape is not supported.", index);
      if (item.literal === undefined)
        unsupported("This character-class escape is not supported.", index);
      values.push(item.literal);
      index = item.end;
    } else {
      const point = source.codePointAt(index);
      if (point === undefined) unsupported("Invalid character class.", index);
      const value = String.fromCodePoint(point);
      values.push(value);
      index += value.length;
    }
  }

  if (values.length === 0)
    unsupported("An empty character class has no rule-language equivalent.", start);
  if (values.length === 1 && !negative) {
    return { end: end + 1, literal: values[0] };
  }
  const phrase = negative ? "none of:" : "one of:";
  return {
    end: end + 1,
    phrase: `${phrase} ${values.map(quoteText).join(", ")}`,
    set: { values, negative },
  };
}

/** @param {string} category */
function swapClassCategory(category) {
  return { d: "D", D: "d", w: "W", W: "w", s: "S", S: "s" }[category] ?? category;
}

/** @param {string} source @param {number} start @returns {AtomToken} */
function readLiteralGroup(source, start) {
  if (!source.startsWith("(?:", start)) {
    unsupported("Only non-capturing groups containing literal text can be translated.", start);
  }
  let value = "";
  for (let index = start + 3; index < source.length; ) {
    const atomStart = index;
    const character = source[index];
    if (character === ")") {
      if (!value) unsupported("An empty group has no rule-language equivalent.", start);
      return { end: index + 1, literal: value };
    }
    let literal;
    if (character === "\\") {
      const escapeResult = readEscape(source, index);
      if (escapeResult.literal === undefined) {
        unsupported("Groups can contain literal text only.", index);
      }
      literal = escapeResult.literal;
      index = escapeResult.end;
    } else if (".^$*+?()[]{}|".includes(character)) {
      unsupported("Groups can contain literal text only.", index);
    } else {
      const point = source.codePointAt(index);
      if (point === undefined) unsupported("Invalid character in group.", index);
      literal = String.fromCodePoint(point);
      index += literal.length;
    }
    if (joinsSurrogates(value, literal)) {
      unsupported(
        "Separate surrogate atoms in a literal group have no literal-rule equivalent.",
        atomStart,
        "Fixed-width surrogate pairs such as \\uD83D\\uDE00 and code-point escapes such as \\u{1f600} are supported.",
      );
    }
    value += literal;
  }
  unsupported("The non-capturing group is not closed.", start);
}

/** @param {string} source @param {number} index @returns {QuantifierToken} */
function readQuantifier(source, index) {
  const character = source[index];
  if (character === "*") return { end: index + 1, kind: "zeroOrMore" };
  if (character === "+") return { end: index + 1, kind: "oneOrMore" };
  if (character === "?") return { end: index + 1, kind: "optional" };
  if (character !== "{") return { end: index, kind: null };

  const match = /^\{([0-9]+)(?:,([0-9]*))?\}/u.exec(source.slice(index));
  if (!match) unsupported("This repetition form cannot be translated.", index);
  const min = Number(match[1]);
  if (!Number.isSafeInteger(min) || min > LIMITS.repetition) {
    unsupported(`Repetition counts cannot exceed ${LIMITS.repetition}.`, index);
  }
  if (match[2] === undefined) return { end: index + match[0].length, kind: "exact", min };
  if (match[2] === "") {
    const kind = min === 0 ? "zeroOrMore" : min === 1 ? "oneOrMore" : "atLeast";
    return { end: index + match[0].length, kind, min };
  }
  const max = Number(match[2]);
  if (!Number.isSafeInteger(max) || max > LIMITS.repetition) {
    unsupported(`Repetition counts cannot exceed ${LIMITS.repetition}.`, index);
  }
  if (max < min)
    unsupported("The repetition's upper bound is smaller than its lower bound.", index);
  if (min === 0 && max === 1) return { end: index + match[0].length, kind: "optional" };
  return { end: index + match[0].length, kind: "range", min, max };
}

/** Convert a supported Unicode JavaScript RegExp into controlled-English rules.
 * @param {RegExp} regex
 */
export function regexToRules(regex) {
  if (!(regex instanceof RegExp)) throw new TypeError("Expected a JavaScript RegExp.");
  if (/[^imsu]/u.test(regex.flags)) {
    fail("UNSUPPORTED_REGEX_FLAGS", "Only the i, s, m and u flags can be translated.", {
      line: 1,
      column: 1,
    });
  }
  if (!regex.unicode) {
    fail(
      "UNICODE_FLAG_REQUIRED",
      "Add the `u` flag before translating. The rule language always uses Unicode matching.",
      { line: 1, column: 1 },
    );
  }

  const source = regex.source;
  if (source.length > LIMITS.sourceLength) {
    fail(
      "REGEX_SOURCE_LIMIT",
      `Regex source cannot exceed ${LIMITS.sourceLength} UTF-16 code units.`,
      { line: 1, column: LIMITS.sourceLength + 1 },
    );
  }

  /** @type {PositionedAtom[]} */
  const atoms = [];
  const multiline = regex.multiline;
  let cursor = 0;
  if (source[cursor] === "^") {
    atoms.push({
      phrase: multiline ? "line start" : "start",
      kind: null,
      index: cursor,
      end: cursor + 1,
    });
    cursor += 1;
  }

  while (cursor < source.length) {
    const index = cursor;
    const character = source[cursor];
    if (character === "$" && cursor === source.length - 1) {
      atoms.push({ phrase: multiline ? "line end" : "end", kind: null, index, end: index + 1 });
      cursor += 1;
      break;
    }
    if (character === "^" || character === "$" || "|)".includes(character)) {
      unsupported(
        "Only a start anchor at the beginning and an end anchor at the end can be translated.",
        index,
      );
    }

    /** @type {AtomToken} */
    let atom;
    if (character === "[") atom = readCharacterClass(source, cursor);
    else if (character === "\\") atom = readEscape(source, cursor);
    else if (character === "(") atom = readLiteralGroup(source, cursor);
    else if (character === ".") atom = { phrase: "any character", end: cursor + 1 };
    else if ("*+?{}]".includes(character)) unsupported("Unexpected regex operator.", cursor);
    else {
      const point = source.codePointAt(cursor);
      if (point === undefined) unsupported("Invalid regex character.", cursor);
      const literal = String.fromCodePoint(point);
      atom = { literal, end: cursor + literal.length };
    }
    cursor = atom.end;

    const quantifier = readQuantifier(source, cursor);
    cursor = quantifier.end;
    if (source[cursor] === "?") {
      unsupported("Lazy quantifiers are not supported by the rule language.", cursor);
    }
    atoms.push({ ...atom, ...quantifier, index });
  }

  if (cursor !== source.length) unsupported("The regex contains unsupported syntax.", cursor);
  if (atoms.length === 0) {
    unsupported("An empty regex matches zero characters anywhere and cannot be translated.", 0);
  }

  const rules = [];
  let literalRun = "";
  const flushLiteral = () => {
    if (!literalRun) return;
    rules.push(quoteText(literalRun));
    literalRun = "";
  };
  for (const atom of atoms) {
    if (
      atom.phrase === "start" ||
      atom.phrase === "line start" ||
      atom.phrase === "end" ||
      atom.phrase === "line end"
    ) {
      flushLiteral();
      rules.push(atom.phrase);
      continue;
    }
    if (atom.literal !== undefined && atom.kind === null) {
      if (joinsSurrogates(literalRun, atom.literal)) flushLiteral();
      literalRun += atom.literal;
      continue;
    }
    flushLiteral();
    if (atom.literal !== undefined) atom.phrase = quoteText(atom.literal);
    if (!atom.phrase) unsupported("This regex atom has no rule-language equivalent.", atom.index);
    const set = atom.set;
    if (set?.negative && atom.kind === "zeroOrMore") {
      rules.push(`text without: ${set.values.map(quoteText).join(", ")}`);
      continue;
    }
    if (atom.phrase === "any character" && atom.kind === "zeroOrMore") {
      rules.push("any text");
      continue;
    }
    const prefix =
      atom.kind === null
        ? ""
        : atom.kind === "optional"
          ? "optional"
          : atom.kind === "zeroOrMore"
            ? "zero or more"
            : atom.kind === "oneOrMore"
              ? "one or more"
              : atom.kind === "exact"
                ? String(atom.min)
                : atom.kind === "range"
                  ? `between ${atom.min} and ${atom.max}`
                  : atom.kind === "atLeast"
                    ? `at least ${atom.min}`
                    : unsupported("Unknown repetition form.", atom.index);
    rules.push(prefix ? `${prefix} ${atom.phrase}` : atom.phrase);
  }
  flushLiteral();

  const translated = rules.join("\n");
  try {
    parse(translated);
  } catch (error) {
    if (error instanceof CompileError && ["SOURCE_LIMIT", "LINE_LIMIT"].includes(error.code)) {
      const limit =
        error.code === "LINE_LIMIT"
          ? `${LIMITS.lines} lines`
          : `${LIMITS.sourceLength} UTF-16 code units`;
      fail(
        error.code,
        `Translated rules cannot exceed ${limit}.`,
        { line: 1, column: 1 },
        "Simplify the regex so its translated rules fit these limits.",
      );
    }
    throw error;
  }
  return {
    rules: translated,
    flags: `${regex.ignoreCase ? "i" : ""}${regex.dotAll ? "s" : ""}`,
  };
}
