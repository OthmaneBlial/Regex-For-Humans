/** @param {import('./ast.js').Repetition|null} repetition */
function repetitionText(repetition) {
  if (!repetition) return "";
  switch (repetition.kind) {
    case "zeroOrMore":
      return " Repeated zero or more times, greedily.";
    case "oneOrMore":
      return " Repeated one or more times, greedily.";
    case "optional":
      return " Optional: zero or one occurrence.";
    case "exact":
      return ` Repeated exactly ${repetition.min} times.`;
    case "range":
      return ` Repeated between ${repetition.min} and ${repetition.max} times, greedily.`;
    case "minimum":
      return ` Repeated at least ${repetition.min} times, greedily.`;
    default:
      throw new TypeError(`Unknown repetition kind: ${repetition.kind}`);
  }
}

/** @param {import('./ast.js').RuleNode} node @param {string} flags */
export function explainNode(node, flags) {
  if (node.kind === "anchor") {
    if (node.mode === "line") {
      return node.edge === "start"
        ? "Start of a line. The m flag makes ^ work after line breaks."
        : "End of a line. The m flag lets $ match before a line break.";
    }
    return node.edge === "start"
      ? "Start of the input."
      : "End of the input, or just before a final line break in JavaScript.";
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
        "\\W": "One character outside JavaScript's word class.",
        "\\d": "One ASCII digit (0–9).",
        "\\D": "One character other than an ASCII digit.",
        "\\s": "One JavaScript whitespace character, including line breaks.",
        "\\S": "One character outside JavaScript's whitespace class.",
      };
      meaning = shorthandMeanings[node.value];
      break;
    }
    case "literal":
      meaning = `The literal text ${JSON.stringify(node.value)}${flags.includes("i") ? ", ignoring case according to JavaScript's Unicode rules" : ""}.`;
      break;
    case "charSet":
      meaning = node.negative
        ? `One Unicode code point except ${node.value.map((value) => JSON.stringify(value)).join(", ")}.`
        : `One of ${node.value.map((value) => JSON.stringify(value)).join(", ")}.`;
      break;
    default:
      throw new TypeError("Unknown atom type.");
  }
  if (node.atomType === "wildcard" && node.repetition?.kind === "zeroOrMore") {
    meaning += " This can accept a broad range of text.";
  }
  return meaning + repetitionText(node.repetition);
}
