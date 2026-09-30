/** @param {import('./ast.js').Repetition|null} repetition */
function repetitionText(repetition) {
  if (!repetition) return "";
  switch (repetition.kind) {
    case "exact":
      return ` Exactly ${repetition.min} times.`;
    case "range":
      return ` Between ${repetition.min} and ${repetition.max} times (inclusive).`;
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

  const caseNote = flags.includes("i") ? ", ignoring case (i)" : "";

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

  if (node.atomType === "shorthand" && ["\\d", "[0-9A-Fa-f]", "[A-Za-z]"].includes(node.value)) {
    const item =
      node.value === "\\d"
        ? "digit"
        : node.value === "[A-Za-z]"
          ? "ASCII letter"
          : "hexadecimal digit";
    const range =
      node.value === "\\d" ? "0–9" : node.value === "[A-Za-z]" ? "A–Z, a–z" : "0–9, A–F, a–f";
    const caseFoldingNote =
      node.value === "[A-Za-z]" && flags.includes("i")
        ? " With i, a few Unicode equivalents also match."
        : "";
    if (node.repetition?.kind === "oneOrMore")
      return `One or more ${item}s (${range}).${caseFoldingNote}`;
    if (node.repetition?.kind === "exact") {
      const items = node.repetition.min === 1 ? item : `${item}s`;
      return `Exactly ${node.repetition.min} ${items} (${range}).${caseFoldingNote}`;
    }
    if (node.repetition?.kind === "range") {
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
      meaning = `Literal text ${JSON.stringify(node.value)}${caseNote}.`;
      break;
    case "charSet":
      meaning = node.negative
        ? `Any character except ${node.value.map((value) => JSON.stringify(value)).join(", ")}${caseNote}.`
        : `One of ${node.value.map((value) => JSON.stringify(value)).join(", ")}${caseNote}.`;
      break;
    default:
      throw new TypeError("Unknown atom type.");
  }
  return meaning + repetitionText(node.repetition);
}
