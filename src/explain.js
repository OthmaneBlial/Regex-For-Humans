/** @param {import('./ast.js').Repetition|null} repetition */
function repetitionText(repetition) {
  if (!repetition) return "";
  switch (repetition.kind) {
    case "exact":
      return ` Exactly ${repetition.min} times.`;
    default:
      throw new TypeError("Unexpected repetition kind.");
  }
}

/** @param {import('./ast.js').RuleNode} node @param {string} flags @param {boolean} [hasFollowingRule] */
export function explainNode(node, flags, hasFollowingRule = false) {
  if (node.kind === "anchor") {
    if (node.mode === "line") {
      return node.edge === "start" ? "Start of each line (m)." : "End of each line (m).";
    }
    return node.edge === "start" ? "Input start." : "Input end.";
  }

  const caseNote = flags.includes("i")
    ? ", ignoring case according to JavaScript's Unicode rules"
    : "";

  if (node.repetition?.kind === "zeroOrMore") {
    if (node.atomType === "wildcard") {
      const context = hasFollowingRule ? " up to the next rule" : "";
      return flags.includes("s")
        ? `Longest text${context}, including line breaks.`
        : `Longest text${context}, excluding line breaks.`;
    }
    if (node.atomType === "charSet") {
      const characters = node.value.map((value) => JSON.stringify(value)).join(", ");
      return `Longest text without ${characters}${caseNote}.`;
    }
  }

  if (node.atomType === "shorthand" && node.value === "\\d") {
    if (node.repetition?.kind === "oneOrMore") return "One or more digits (0–9).";
    if (node.repetition?.kind === "exact") {
      const digits = node.repetition.min === 1 ? "digit" : "digits";
      return `Exactly ${node.repetition.min} ${digits} (0–9).`;
    }
  }

  let meaning;
  switch (node.atomType) {
    case "wildcard":
      meaning = flags.includes("s")
        ? "Any one Unicode code point, including a line break."
        : "Any one Unicode code point except a line break.";
      break;
    case "shorthand": {
      /** @type {Record<string, string>} */
      const shorthandMeanings = {
        "\\w":
          "One JavaScript word character: ASCII letter, digit or underscore. With i and u, a few Unicode case-folding equivalents also match.",
        "\\W": flags.includes("i")
          ? "One character outside JavaScript's word class. With i and u, a few Unicode case-folding equivalents count as word characters."
          : "One character outside JavaScript's word class.",
        "\\d": "One digit (0–9).",
        "\\D": "One character other than an ASCII digit.",
        "\\s": "One JavaScript whitespace character, including line breaks.",
        "\\S": "One character outside JavaScript's whitespace class.",
      };
      meaning = shorthandMeanings[node.value];
      break;
    }
    case "literal":
      meaning = `Literal text ${JSON.stringify(node.value)}${caseNote}.`;
      break;
    case "charSet":
      meaning = node.negative
        ? `One Unicode code point except ${node.value.map((value) => JSON.stringify(value)).join(", ")}${caseNote}.`
        : `One of ${node.value.map((value) => JSON.stringify(value)).join(", ")}${caseNote}.`;
      break;
    default:
      throw new TypeError("Unknown atom type.");
  }
  return meaning + repetitionText(node.repetition);
}
