import { PATH_SEGMENT_SOURCE } from "./ast.js";
import { quoteText } from "./display.js";

/** @param {import('./ast.js').Repetition|null} repetition @param {boolean} optional */
function repetitionText(repetition, optional) {
  if (!repetition) return "";
  switch (repetition.kind) {
    case "exact":
      return ` Exactly ${repetition.min} times.`;
    case "range":
      if (optional && repetition.min === 0 && repetition.max === 1) return " Optional.";
      return ` Between ${repetition.min} and ${repetition.max} times (inclusive).`;
    case "atLeast":
      return ` At least ${repetition.min} times.`;
    case "zeroOrMore":
      return " Zero or more times.";
    case "oneOrMore":
      return " One or more times.";
    default:
      throw new TypeError("Unexpected repetition kind.");
  }
}

/** @param {import('./ast.js').RuleNode} node @param {string} flags @param {boolean} [hasFollowingRule] */
export function explainNode(node, flags, hasFollowingRule = false) {
  const meaning = describeNode(node, flags, hasFollowingRule);
  if (node.kind === "anchor" || !node.repetition?.lazy) return meaning;
  return (
    meaning +
    (node.repetition.kind === "exact" ||
    (node.repetition.kind === "range" && node.repetition.min === node.repetition.max)
      ? " Lazy repetition has a fixed count here."
      : " Lazy: try the fewest repetitions first, then expand if following rules require it.")
  );
}

/** @param {import('./ast.js').RuleNode} node @param {string} flags @param {boolean} hasFollowingRule */
function describeNode(node, flags, hasFollowingRule) {
  if (node.kind === "boundary")
    return `${node.negative ? "Require the same" : "Require different"} word/non-word status on either side of the current position, without consuming characters. Word characters are ASCII letters, digits and underscore; input edges are non-word.${flags.includes("i") ? " With i, Unicode characters folding to ASCII word characters also count." : ""} This is not natural-language word segmentation.`;
  if (node.kind === "assertion")
    return `${node.negative ? "Require no match" : "Require a match"} ${node.direction === "ahead" ? "starting" : "ending"} at the current position, without consuming characters.${node.direction === "behind" ? " JavaScript tests this subpattern backwards." : ""}`;
  if (node.kind === "anchor") {
    if (node.mode === "line") {
      return node.edge === "start" ? "Start of each line (m)." : "End of each line (m).";
    }
    return node.edge === "start" ? "Input start." : "Input end.";
  }

  const caseNote = flags.includes("i") ? ", ignoring case (i)" : "";
  const optional = /^(?:lazy\s+)?optional\s/iu.test(node.text);

  if (node.kind === "backreference") {
    return (
      `Same text as capture #${node.captureIndex}${typeof node.reference === "string" ? ` named ${quoteText(node.reference)}` : ""}. A nonparticipating capture matches empty text.` +
      repetitionText(node.repetition, optional)
    );
  }

  if (node.kind === "group") {
    const label = node.capturing
      ? `Capture #${node.captureIndex}${node.name === null ? "" : ` named ${quoteText(node.name)}`}.`
      : "Group without capturing.";
    return label + repetitionText(node.repetition, optional);
  }

  if (node.kind === "alternation")
    return (
      `Choose one of ${node.branches.length} alternatives, tried in order.` +
      repetitionText(node.repetition, optional)
    );

  if (
    node.atomType === "shorthand" &&
    node.value === "\\s" &&
    node.repetition?.kind === "oneOrMore"
  )
    return "One or more whitespace characters, including line breaks.";

  if (node.repetition?.kind === "zeroOrMore" && !node.repetition.lazy) {
    if (node.atomType === "wildcard") {
      const context = hasFollowingRule ? " up to the next rule" : "";
      return flags.includes("s")
        ? `Longest text${context}, including line breaks.`
        : `Longest text${context}, excluding line breaks.`;
    }
    if (node.atomType === "charSet" && node.negative) {
      const characters = node.value.map(quoteText).join(", ");
      return `Longest text without ${characters}${caseNote}.`;
    }
  }

  if (
    node.atomType === "shorthand" &&
    ["\\d", "[0-9A-Fa-f]", "[A-Za-z]", "[a-z]", "[A-Z]"].includes(node.value)
  ) {
    const item =
      node.value === "\\d"
        ? "digit"
        : node.value === "[A-Za-z]"
          ? "ASCII letter"
          : node.value === "[a-z]"
            ? "lowercase ASCII letter"
            : node.value === "[A-Z]"
              ? "uppercase ASCII letter"
              : "hexadecimal digit";
    const range =
      node.value === "\\d"
        ? "0–9"
        : node.value === "[A-Za-z]"
          ? "A–Z, a–z"
          : node.value === "[a-z]"
            ? "a–z"
            : node.value === "[A-Z]"
              ? "A–Z"
              : "0–9, A–F, a–f";
    const caseFoldingNote =
      flags.includes("i") && node.value === "[A-Za-z]"
        ? " With i, a few Unicode equivalents also match."
        : flags.includes("i") && node.value === "[a-z]"
          ? " With i, uppercase ASCII letters and a few Unicode equivalents also match."
          : flags.includes("i") && node.value === "[A-Z]"
            ? " With i, lowercase ASCII letters and a few Unicode equivalents also match."
            : "";
    if (node.repetition?.kind === "oneOrMore")
      return `One or more ${item}s (${range}).${caseFoldingNote}`;
    if (node.repetition?.kind === "zeroOrMore")
      return `Zero or more ${item}s (${range}).${caseFoldingNote}`;
    if (node.repetition?.kind === "atLeast")
      return `At least ${node.repetition.min} ${item}s (${range}).${caseFoldingNote}`;
    if (node.repetition?.kind === "exact") {
      const items = node.repetition.min === 1 ? item : `${item}s`;
      return `Exactly ${node.repetition.min} ${items} (${range}).${caseFoldingNote}`;
    }
    if (node.repetition?.kind === "range") {
      if (optional && node.repetition.min === 0 && node.repetition.max === 1)
        return `Zero or one ${item} (${range}).${caseFoldingNote}`;
      return `Between ${node.repetition.min} and ${node.repetition.max} ${item}s (${range}), inclusive.${caseFoldingNote}`;
    }
    return `One ${item} (${range}).${caseFoldingNote}`;
  }

  let meaning;
  switch (node.atomType) {
    case "wildcard":
      meaning = flags.includes("s")
        ? "Any character, including line breaks."
        : "Any character except a line break.";
      break;
    case "shorthand": {
      /** @type {Record<string, string>} */
      const shorthandMeanings = {
        [PATH_SEGMENT_SOURCE]:
          "Path segment character: excludes slash, backslash, NUL and line breaks.",
        "\\w":
          "Word character: ASCII letter, digit or underscore. With i, a few Unicode equivalents match.",
        "\\W": flags.includes("i")
          ? "Any non-word character; i treats a few Unicode equivalents as words."
          : "Any non-word character.",
        "\\D": "Any character except 0–9.",
        "\\s": "Whitespace, including line breaks.",
        "\\S": "Any non-whitespace character.",
      };
      meaning = shorthandMeanings[node.value];
      break;
    }
    case "literal":
      meaning = `Literal text ${quoteText(node.value)}${caseNote}.`;
      break;
    case "unicodeProperty":
      meaning =
        node.propertyType === "string"
          ? `Unicode string selected by property ${quoteText(node.value)} (v). One match can contain multiple code points; native longer members are tried first.`
          : node.negative
            ? `Unicode complement of property ${quoteText(node.value)} (${flags.includes("v") ? "v" : "u"}).${flags.includes("i") ? (flags.includes("v") ? " With i in v mode, case folding happens before complementing." : " With i, case folding happens after complementing and can admit characters with this property.") : ""}`
            : `Unicode code point selected by property ${quoteText(node.value)} (${flags.includes("v") ? "v" : "u"}).${flags.includes("i") ? " With i, case-folded equivalents may also match." : ""}`;
      meaning += " Classification uses this runtime's Unicode data.";
      break;
    case "charSet":
      meaning = node.negative
        ? `Any character except ${node.value.map(quoteText).join(", ")}${caseNote}.`
        : `One of ${node.value.map(quoteText).join(", ")}${caseNote}.`;
      break;
    case "characterClass": {
      const members = node.members
        .map((member) => {
          if (member.kind === "range")
            return `code points ${quoteText(member.from)} through ${quoteText(member.to)} (inclusive)`;
          if (member.kind === "strings")
            return `finite strings ${member.values.map(quoteText).join(", ")}`;
          if (member.kind === "stringCodePoints")
            return `native code-point sequence ${member.codePoints.map(quoteText).join(" + ")}`;
          if (member.kind === "unicodeProperty")
            return `${member.negative ? "the Unicode complement of" : "Unicode property"} ${quoteText(member.value)}`;
          if (member.kind === "shorthand")
            return {
              "\\d": "ASCII digits 0–9",
              "\\D": "non-ASCII-digit characters",
              "\\w": "ASCII word characters",
              "\\W": "non-word characters",
              "\\s": "whitespace including line breaks",
              "\\S": "non-whitespace characters",
            }[member.value];
          return quoteText(member.value);
        })
        .join("; ");
      const containsStrings = node.members.some(
        (member) =>
          member.kind === "strings" ||
          member.kind === "stringCodePoints" ||
          (member.kind === "unicodeProperty" && member.propertyType === "string"),
      );
      meaning = `${node.negative ? "One Unicode code point outside" : containsStrings ? "One native string or Unicode code point in" : "One Unicode code point in"} the union of: ${members}.`;
      if (containsStrings && !node.negative)
        meaning +=
          " Native v sets try longer members first; later rules can require a shorter member.";
      if (node.members.some((member) => member.kind === "strings" && member.values.includes("")))
        meaning += " An empty member can match without consuming input.";
      if (flags.includes("i"))
        meaning += ` Native ${flags.includes("v") ? "v" : "u"}-mode case folding applies; property complements and outer-class negation remain distinct.`;
      if (node.members.some((member) => member.kind === "unicodeProperty"))
        meaning += " Property classification uses this runtime's Unicode data.";
      break;
    }
    default:
      throw new TypeError("Unknown atom type.");
  }
  return meaning + repetitionText(node.repetition, optional);
}
