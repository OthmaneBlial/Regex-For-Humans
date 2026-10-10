import { PATH_SEGMENT_EXCLUDED } from "./ast.js";
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
  "Supported syntax includes literals, anchors, common character classes, greedy/lazy repetition, nested groups, captures, backward capture references, ordered alternatives, lookahead/lookbehind and d/g/i/m/s/u/v/y flags. Forward/open references are not supported.";
const LINE_TERMINATORS = ["\n", "\r", "\u2028", "\u2029"];

/** @typedef {{end: number, literal?: string, phrase?: string, empty?: boolean, allCharacters?: boolean, nativeDot?: boolean, category?: string, set?: {values: string[], negative: boolean}, group?: {capturing: boolean, name: string|null, atoms: PositionedAtom[], close: number}, assertion?: {direction: 'ahead'|'behind', negative: boolean, atoms: PositionedAtom[], close: number}, alternation?: {branches: {atoms: PositionedAtom[], index: number}[], close: number}}} AtomToken */
/** @typedef {{end: number, kind: 'zeroOrMore'|'oneOrMore'|'optional'|'exact'|'range'|'atLeast'|null, min?: number, max?: number, lazy?: boolean}} QuantifierToken */
/** @typedef {AtomToken & QuantifierToken & {index: number}} PositionedAtom */

/** @param {string} message @param {number} index @param {string} [hint] @returns {never} */
function unsupported(message, index, hint = UNSUPPORTED_HINT) {
  fail("UNSUPPORTED_REGEX", message, { line: 1, column: index + 1 }, hint);
}

/** @param {string} left @param {string} right */
function joinsSurrogates(left, right) {
  return /[\ud800-\udbff]$/u.test(left) && /^[\udc00-\udfff]/u.test(right);
}

/** @param {string} source @param {number} index @param {boolean} [inClass] @param {boolean} [unicodeSets] @returns {AtomToken} */
function readEscape(source, index, inClass = false, unicodeSets = false) {
  const escaped = source[index + 1];
  if (escaped === undefined) unsupported("The regex ends with an incomplete escape.", index);

  if (!inClass && /^[1-9]$/u.test(escaped)) {
    let end = index + 2;
    while (/^[0-9]$/u.test(source[end] ?? "")) end += 1;
    return { end, phrase: `same as capture ${Number(source.slice(index + 1, end))}` };
  }
  if (!inClass && source.startsWith("\\k<", index)) {
    const close = source.indexOf(">", index + 3);
    if (close < 0) unsupported("The named reference is not closed.", index);
    return {
      end: close + 1,
      phrase: `same as capture ${quoteText(readCaptureName(source, index + 3, close))}`,
    };
  }

  if (!inClass && ESCAPED_ATOMS.has(escaped)) {
    return { end: index + 2, phrase: ESCAPED_ATOMS.get(escaped) };
  }
  if (inClass && ESCAPED_ATOMS.has(escaped)) {
    return { end: index + 2, category: escaped };
  }

  if (escaped === "p" || escaped === "P") {
    const close = source.indexOf("}", index + 3);
    if (source[index + 2] !== "{" || close < 0)
      unsupported("The Unicode property escape is incomplete.", index);
    if (unicodeSets) {
      try {
        new RegExp(`\\p{${source.slice(index + 3, close)}}`, "u");
      } catch {
        unsupported(
          "Unicode string properties cannot yet be represented by character-property rules.",
          index,
        );
      }
    }
    return {
      end: close + 1,
      phrase: `${escaped === "P" ? "not " : ""}unicode property ${quoteText(source.slice(index + 3, close))}`,
    };
  }

  if (escaped === "u") {
    if (source[index + 2] === "{") {
      const close = source.indexOf("}", index + 3);
      if (close < 0) unsupported("The Unicode code-point escape is incomplete.", index);
      const digits = source.slice(index + 3, close);
      if (!/^[0-9a-f]+$/iu.test(digits)) {
        unsupported("Use hexadecimal digits in a Unicode code-point escape.", index);
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
  if (!inClass && (escaped === "b" || escaped === "B"))
    return { end: index + 2, phrase: escaped === "b" ? "word boundary" : "not word boundary" };

  const special = inClass
    ? unicodeSets
      ? "\\()[]{}/-|!#$%&*+,.:;<=>?@^`~"
      : "\\[]^-/"
    : "\\^$.*+?()[]{}|/";
  if (special.includes(escaped)) return { end: index + 2, literal: escaped };
  unsupported(`The escape ${quoteText(`\\${escaped}`)} is not supported.`, index);
}

/** @param {string} source @param {number} start @returns {AtomToken} */
function readCharacterClass(source, start, unicodeSets = false) {
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
    else if (character === "\\") {
      if (unicodeSets && source[end + 1] === "q")
        unsupported("Unicode string-set escapes cannot yet be translated.", end);
      escaped = true;
    } else if (
      unicodeSets &&
      (character === "[" || source.startsWith("&&", end) || source.startsWith("--", end))
    )
      unsupported(
        "Nested Unicode sets, intersection and subtraction cannot yet be translated.",
        end,
      );
    else if (character === "]") break;
  }
  if (end === source.length) unsupported("The character class is not closed.", start);

  const body = source.slice(contentStart, end);
  const known = CLASS_ATOMS.get(`${negative ? "^" : ""}${body}`);
  if (known) return { end: end + 1, phrase: known };

  const wordParts = body.match(/A-Z|a-z|0-9|_/gu);
  if (wordParts && wordParts.join("") === body && new Set(wordParts).size === 4) {
    return { end: end + 1, phrase: negative ? "not word" : "word" };
  }

  if (/^\\[dDwWsS]$/u.test(body)) {
    const category = body.charAt(1);
    const phrase = ESCAPED_ATOMS.get(negative ? swapClassCategory(category) : category);
    if (phrase) return { end: end + 1, phrase };
  }

  /** @type {string[]} */
  const values = [];
  /** @type {string[]} */
  const members = [];
  let complex = false;
  /** @param {number} index @returns {AtomToken} */
  const readItem = (index) => {
    if (source[index] === "\\") return readEscape(source, index, true, unicodeSets);
    const point = source.codePointAt(index);
    if (point === undefined) unsupported("Invalid character class.", index);
    const value = String.fromCodePoint(point);
    return { end: index + value.length, literal: value };
  };
  for (let index = contentStart; index < end; ) {
    const item = readItem(index);
    if (source[item.end] === "-" && item.end + 1 < end) {
      const upper = readItem(item.end + 1);
      if (item.literal === undefined || upper.literal === undefined)
        unsupported("A character range needs two single-code-point endpoints.", item.end);
      members.push(`range ${quoteText(item.literal)} to ${quoteText(upper.literal)}`);
      complex = true;
      index = upper.end;
    } else if (item.literal !== undefined) {
      values.push(item.literal);
      members.push(quoteText(item.literal));
      index = item.end;
    } else {
      const phrase = item.category ? ESCAPED_ATOMS.get(item.category) : item.phrase;
      if (!phrase) unsupported("This character-class escape is not supported.", index);
      members.push(phrase);
      complex = true;
      index = item.end;
    }
  }

  if (members.length === 0) {
    if (negative) return { end: end + 1, phrase: "any character", allCharacters: true };
    unsupported("An empty character class has no rule-language equivalent.", start);
  }
  if (complex)
    return {
      end: end + 1,
      phrase: `${negative ? "not " : ""}character class: ${members.join(", ")}`,
    };
  if (negative) {
    const excluded = new Set(values);
    if (
      excluded.size === PATH_SEGMENT_EXCLUDED.length &&
      PATH_SEGMENT_EXCLUDED.every((value) => excluded.has(value))
    )
      return { end: end + 1, phrase: "path segment character" };
  }
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

/** @param {string} source @param {number} start @param {number} end */
function readCaptureName(source, start, end) {
  let name = "";
  for (let index = start; index < end; ) {
    if (source[index] === "\\") {
      const escaped = readEscape(source, index);
      if (escaped.literal === undefined) unsupported("Unsupported capture-name escape.", index);
      name += escaped.literal;
      index = escaped.end;
    } else {
      name += source[index];
      index += 1;
    }
  }
  return name;
}

/** @param {string} source @param {number} start @param {boolean} multiline @param {number} depth @param {boolean} unicodeSets @returns {AtomToken} */
function readGroup(source, start, multiline, depth, unicodeSets) {
  if (depth >= LIMITS.groupDepth) {
    fail("GROUP_DEPTH_LIMIT", `Groups cannot nest more than ${LIMITS.groupDepth} levels.`, {
      line: 1,
      column: start + 1,
    });
  }
  const assertion = /^\(\?(<)?([=!])/u.exec(source.slice(start));
  if (assertion) {
    const { atoms, end: close } = readDisjunction(
      source,
      start + assertion[0].length,
      multiline,
      depth + 1,
      unicodeSets,
    );
    if (source[close] !== ")") unsupported("The assertion is not closed.", start);
    return {
      end: close + 1,
      assertion: {
        direction: assertion[1] ? "behind" : "ahead",
        negative: assertion[2] === "!",
        atoms,
        close,
      },
    };
  }
  const capturing = !source.startsWith("(?:", start);
  let name = null;
  let contentStart = start + (capturing ? 1 : 3);
  if (source.startsWith("(?<", start)) {
    const close = source.indexOf(">", start + 3);
    if (close < 0) unsupported("The capture name is not closed.", start);
    name = readCaptureName(source, start + 3, close);
    contentStart = close + 1;
  } else if (capturing && source[start + 1] === "?") {
    unsupported("Only capturing and noncapturing groups can be translated.", start);
  }
  const { atoms, end: close } = readDisjunction(
    source,
    contentStart,
    multiline,
    depth + 1,
    unicodeSets,
  );
  if (source[close] !== ")") unsupported("The group is not closed.", start);
  const end = close + 1;
  if (capturing) return { end, group: { capturing, name, atoms, close } };
  if (atoms.length === 0) return { end, phrase: "any character", empty: true };
  if (atoms.length === 1 && atoms[0].alternation && atoms[0].kind === null)
    return { end, alternation: { ...atoms[0].alternation, close } };

  // Keep the existing compact literal-group output when merging cannot join surrogate atoms.
  let value = "";
  for (const atom of atoms) {
    if (atom.literal === undefined || atom.kind !== null || joinsSurrogates(value, atom.literal)) {
      return { end, group: { capturing, name, atoms, close } };
    }
    value += atom.literal;
  }
  return { end, literal: value };
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

/** @param {string} source @param {number} start @param {boolean} multiline @param {number} depth @param {boolean} unicodeSets @returns {{atoms: PositionedAtom[], end: number}} */
function readSequence(source, start, multiline, depth, unicodeSets) {
  /** @type {PositionedAtom[]} */
  const atoms = [];
  let cursor = start;
  while (cursor < source.length) {
    const index = cursor;
    const character = source[cursor];
    if (character === "|" || (character === ")" && depth > 0)) break;
    if (character === "^" && atoms.length === 0) {
      const absolute = source.startsWith("^(?<![\\s\\S])", cursor);
      cursor += absolute ? "^(?<![\\s\\S])".length : 1;
      atoms.push({
        phrase: absolute || !multiline ? "start" : "line start",
        kind: null,
        index,
        end: cursor,
      });
      continue;
    }
    const absoluteEnd = character === "$" && source.startsWith("$(?![\\s\\S])", cursor);
    const anchorEnd = cursor + (absoluteEnd ? "$(?![\\s\\S])".length : 1);
    if (
      character === "$" &&
      (anchorEnd === source.length ||
        source[anchorEnd] === "|" ||
        (depth > 0 && source[anchorEnd] === ")"))
    ) {
      cursor = anchorEnd;
      atoms.push({
        phrase: absoluteEnd || !multiline ? "end" : "line end",
        kind: null,
        index,
        end: cursor,
      });
      continue;
    }
    if (character === "^" || character === "$" || character === ")") {
      unsupported(
        "Only a start anchor at the beginning and an end anchor at the end can be translated.",
        index,
      );
    }
    /** @type {AtomToken} */
    let atom;
    if (character === "[") atom = readCharacterClass(source, cursor, unicodeSets);
    else if (character === "\\") atom = readEscape(source, cursor, false, unicodeSets);
    else if (character === "(") atom = readGroup(source, cursor, multiline, depth, unicodeSets);
    else if (character === ".")
      atom = { phrase: "any character", end: cursor + 1, nativeDot: true };
    else if ("*+?{}]".includes(character)) unsupported("Unexpected regex operator.", cursor);
    else {
      const point = source.codePointAt(cursor);
      if (point === undefined) unsupported("Invalid regex character.", cursor);
      const literal = String.fromCodePoint(point);
      atom = { literal, end: cursor + literal.length };
    }
    cursor = atom.end;
    let quantifier = readQuantifier(source, cursor);
    cursor = quantifier.end;
    if (quantifier.kind !== null && source[cursor] === "?")
      quantifier = { ...quantifier, lazy: true, end: ++cursor };
    if (atom.empty) quantifier = { ...quantifier, end: cursor, kind: "exact", min: 0 };
    atoms.push({ ...atom, ...quantifier, index });
  }
  return { atoms, end: cursor };
}

/** @param {string} source @param {number} start @param {boolean} multiline @param {number} depth @param {boolean} unicodeSets @returns {{atoms: PositionedAtom[], end: number}} */
function readDisjunction(source, start, multiline, depth, unicodeSets) {
  /** @type {{atoms: PositionedAtom[], index: number}[]} */
  const branches = [];
  let cursor = start;
  while (true) {
    const { atoms, end } = readSequence(source, cursor, multiline, depth, unicodeSets);
    branches.push({ atoms, index: cursor });
    cursor = end;
    if (source[cursor] !== "|") break;
    cursor += 1;
  }
  return {
    atoms:
      branches.length === 1
        ? branches[0].atoms
        : [{ alternation: { branches, close: cursor }, index: start, kind: null, end: cursor }],
    end: cursor,
  };
}

/** Convert a supported Unicode JavaScript RegExp into controlled-English rules.
 * @param {RegExp} regex
 */
export function regexToRules(regex) {
  /** @param {PropertyKey} property */
  const nativeValue = (property) => Reflect.get(RegExp.prototype, property, regex);
  try {
    // The native getter checks the RegExp brand across contexts without running the pattern.
    if (typeof nativeValue("global") !== "boolean") throw new TypeError();
  } catch {
    throw new TypeError("Expected a JavaScript RegExp.");
  }
  // The flags accessor reads properties; route them to native getters, not instance overrides.
  const nativeFlags = Reflect.get(
    RegExp.prototype,
    "flags",
    new Proxy({}, { get: (_target, property) => nativeValue(property) }),
  );
  if (/[^dgimsuvy]/u.test(nativeFlags)) {
    fail(
      "UNSUPPORTED_REGEX_FLAGS",
      "Only JavaScript flags d, g, i, m, s, u, v and y can be translated.",
      {
        line: 1,
        column: 1,
      },
    );
  }
  const unicodeSets = nativeValue("unicodeSets") === true;
  if (!nativeValue("unicode") && !unicodeSets) {
    fail(
      "UNICODE_FLAG_REQUIRED",
      "Add the `u` or `v` flag before translating. The rule language always uses Unicode matching.",
      { line: 1, column: 1 },
    );
  }

  /** @type {string} */
  const source = nativeValue("source");
  if (source.length > LIMITS.sourceLength) {
    fail(
      "REGEX_SOURCE_LIMIT",
      `Regex source cannot exceed ${LIMITS.sourceLength} UTF-16 code units.`,
      { line: 1, column: LIMITS.sourceLength + 1 },
    );
  }

  const multiline = nativeValue("multiline");
  const { atoms, end: cursor } = readDisjunction(source, 0, multiline, 0, unicodeSets);

  if (cursor !== source.length) unsupported("The regex contains unsupported syntax.", cursor);
  if (atoms.length === 0) {
    unsupported("An empty regex matches zero characters anywhere and cannot be translated.", 0);
  }

  const originalDotAll = nativeValue("dotAll");
  /** @type {PositionedAtom[]} */
  const allAtoms = [];
  /** @param {PositionedAtom[]} list */
  const collect = (list) => {
    for (const atom of list) {
      allAtoms.push(atom);
      if (atom.group) collect(atom.group.atoms);
      if (atom.assertion) collect(atom.assertion.atoms);
      if (atom.alternation) for (const branch of atom.alternation.branches) collect(branch.atoms);
    }
  };
  collect(atoms);
  const needsDotAll = allAtoms.some(
    (atom) =>
      atom.allCharacters &&
      !(atom.kind === "exact" && atom.min === 0) &&
      !(atom.kind === "range" && atom.min === 0 && atom.max === 0),
  );
  const dotAll = originalDotAll || needsDotAll;
  const optionFlags = [..."dgimsvy"]
    .filter((flag) => (flag === "s" ? dotAll : nativeFlags.includes(flag)))
    .join("");
  if (needsDotAll && !originalDotAll) {
    const nonLineTerminator = `none of: ${LINE_TERMINATORS.map(quoteText).join(", ")}`;
    for (const atom of allAtoms) {
      if (!atom.nativeDot || atom.empty) continue;
      atom.phrase = nonLineTerminator;
      atom.set = { values: LINE_TERMINATORS, negative: true };
    }
  }

  /** @type {string[]} */
  const rules = [];
  /** @type {number[]} */
  const positions = [];
  /** @param {string} rule @param {number} index */
  const addRule = (rule, index) => {
    rules.push(rule);
    positions.push(index);
  };
  let literalRun = "";
  let literalIndex = 0;
  const flushLiteral = () => {
    if (!literalRun) return;
    addRule(quoteText(literalRun), literalIndex);
    literalRun = "";
  };
  /** @param {PositionedAtom[]} list */
  function emit(list) {
    for (const atom of list) {
      if (
        atom.phrase === "start" ||
        atom.phrase === "line start" ||
        atom.phrase === "end" ||
        atom.phrase === "line end"
      ) {
        flushLiteral();
        addRule(atom.phrase, atom.index);
        continue;
      }
      if (atom.literal !== undefined && atom.kind === null) {
        if (joinsSurrogates(literalRun, atom.literal)) flushLiteral();
        if (!literalRun) literalIndex = atom.index;
        literalRun += atom.literal;
        continue;
      }
      flushLiteral();
      let prefix =
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
      if (atom.lazy) prefix = `lazy ${prefix}`;
      if (atom.assertion) {
        const assertion = atom.assertion;
        const label = `${assertion.negative ? "not " : ""}${assertion.direction === "ahead" ? "followed" : "preceded"} by`;
        addRule(`${label} {`, atom.index);
        emit(assertion.atoms);
        addRule("}", assertion.close);
        continue;
      }
      if (atom.alternation) {
        addRule(`${prefix ? `${prefix} ` : ""}either {`, atom.index);
        for (const branch of atom.alternation.branches) {
          const before = rules.length;
          emit(branch.atoms);
          const count = rules.length - before;
          if (count === 0) {
            addRule("group {", branch.index);
            addRule("}", atom.alternation.close);
          } else if (count > 1) {
            rules.splice(before, 0, "group {");
            positions.splice(before, 0, branch.index);
            addRule("}", atom.alternation.close);
          }
        }
        addRule("}", atom.alternation.close);
        continue;
      }
      if (atom.group) {
        const group = atom.group;
        const label = group.capturing
          ? group.name === null
            ? "capture"
            : `capture ${quoteText(group.name)}`
          : "group";
        addRule(`${prefix ? `${prefix} ` : ""}${label} {`, atom.index);
        emit(group.atoms);
        addRule("}", group.close);
        continue;
      }
      if (atom.literal !== undefined) atom.phrase = quoteText(atom.literal);
      if (!atom.phrase) unsupported("This regex atom has no rule-language equivalent.", atom.index);
      const set = atom.set;
      if (set?.negative && atom.kind === "zeroOrMore") {
        addRule(
          `${atom.lazy ? "lazy " : ""}text without: ${set.values.map(quoteText).join(", ")}`,
          atom.index,
        );
        continue;
      }
      if (atom.phrase === "any character" && atom.kind === "zeroOrMore") {
        addRule(`${atom.lazy ? "lazy " : ""}any text`, atom.index);
        continue;
      }
      addRule(prefix ? `${prefix} ${atom.phrase}` : atom.phrase, atom.index);
    }
    flushLiteral();
  }
  emit(atoms);

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
    if (error instanceof CompileError && error.code === "GROUP_DEPTH_LIMIT") {
      fail(
        error.code,
        `Translated rules cannot nest more than ${LIMITS.groupDepth} levels.`,
        { line: 1, column: (positions[error.line - 1] ?? 0) + 1 },
        "Simplify nested alternatives or groups so their translated blocks fit this limit.",
      );
    }
    if (
      error instanceof CompileError &&
      [
        "MISSING_CAPTURE_REFERENCE",
        "FORWARD_CAPTURE_REFERENCE",
        "SELF_CAPTURE_REFERENCE",
        "INVALID_CAPTURE_REFERENCE",
        "DUPLICATE_CAPTURE_NAME",
      ].includes(error.code)
    ) {
      unsupported(error.message, positions[error.line - 1] ?? 0);
    }
    throw error;
  }
  return {
    rules: translated,
    flags: optionFlags,
  };
}
