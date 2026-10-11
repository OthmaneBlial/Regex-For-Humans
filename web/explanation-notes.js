import { quoteText } from "../src/display.js";

/** @typedef {{key: string, values?: Record<string, string | number>}} Note */

/** Enrich the compiler's explanation without interpreting regex text or changing semantics.
 * @param {import('../index.d.ts').RegexSegment} segment @param {string} mode @returns {Note[]}
 */
export function explanationNotes(segment, mode) {
  if (mode === "expert") {
    /** @type {Note[]} */
    const notes = [
      {
        key: "Source line {line}, column {column}; regex UTF-16 range [{start}, {end}).",
        values: {
          line: segment.line,
          column: segment.column,
          start: segment.sourceStart,
          end: segment.sourceEnd,
        },
      },
    ];
    if (segment.kind === "group" && segment.capturing)
      notes.push({
        key: "Capture #{index}; name: {name}.",
        values: {
          index: segment.captureIndex ?? "—",
          name: segment.name === null ? "—" : quoteText(segment.name),
        },
      });
    if (segment.kind === "backreference")
      notes.push({
        key: "Resolved reference: capture #{index}.",
        values: { index: segment.captureIndex },
      });
    return notes;
  }
  if (mode !== "beginner") return [];
  const notes = [];
  if (
    (segment.kind === "group" || segment.kind === "assertion" || segment.kind === "alternation") &&
    segment.edge === "end"
  ) {
    notes.push({
      key: "This closes the nested rules above; it does not itself match a closing brace.",
    });
  } else if (segment.kind === "group") {
    notes.push({
      key: segment.capturing
        ? "A capture remembers the text matched by its inner rules. Its number or name lets you read that text later."
        : "A noncapturing group keeps inner rules together without storing a separate captured value.",
    });
  } else if (segment.kind === "assertion") {
    notes.push({
      key: "An assertion checks a condition at the current position without advancing the match. Lookahead checks forward; lookbehind checks backward.",
    });
  } else if (segment.kind === "alternation") {
    notes.push({
      key: "An alternative is one possible path. The engine tries paths in their written order; later rules can make it try another path.",
    });
  } else if (segment.kind === "anchor") {
    notes.push({
      key: "An anchor checks a position at an edge of the input or a line. It adds no text to the match.",
    });
  } else if (segment.kind === "boundary") {
    notes.push({
      key: "A word boundary compares word-character status on either side of a position. It does not identify natural-language words.",
    });
  } else if (segment.kind === "backreference") {
    notes.push({
      key: "A backreference matches text from an earlier capture, not the spelling of that capture's name.",
    });
  } else if (segment.kind === "atom") {
    notes.push({
      key:
        segment.atomType === "literal"
          ? "A literal matches the written text. Punctuation in that text is escaped by the compiler."
          : segment.atomType === "unicodeProperty"
            ? "A Unicode property selects characters or strings from the runtime's Unicode data; it does not normalize text."
            : segment.atomType === "characterClass" || segment.atomType === "charSet"
              ? "A character set lists possible matching values. In Unicode sets mode it can also contain strings."
              : "A shorthand or wildcard is a regex abbreviation for permitted characters. The meaning above describes its actual scope.",
    });
  }
  if ("repetition" in segment && segment.repetition)
    notes.push({
      key: "A quantifier says how often this unit may repeat. Greedy tries more repetitions first; lazy tries fewer first, subject to the rest of the pattern.",
    });
  return notes;
}
