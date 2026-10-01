import { LIMITS } from "./parser.js";

export const REGEX_LITERAL_INPUT_LIMIT = LIMITS.sourceLength + 8;

/** @param {string} input */
export function validateRegexLiteralLength(input) {
  if (input.length > REGEX_LITERAL_INPUT_LIMIT) {
    throw new Error(
      `Regex input cannot exceed ${REGEX_LITERAL_INPUT_LIMIT} UTF-16 code units, including delimiters, flags and outer whitespace.`,
    );
  }
}

/** @param {string} input */
export function parseRegexLiteral(input) {
  validateRegexLiteralLength(input);
  const literal = input.trim();
  if (!literal.startsWith("/")) {
    throw new Error("Paste a slash-delimited JavaScript regex literal, such as `/\\d+/u`.");
  }
  let inClass = false;
  let escaped = false;
  let closingSlash = -1;
  for (let index = 1; index < literal.length; index += 1) {
    const character = literal[index];
    if ("\n\r\u2028\u2029".includes(character)) {
      throw new Error("Escape line breaks inside a regex literal, such as `\\n`.");
    }
    if (escaped) escaped = false;
    else if (character === "\\") escaped = true;
    else if (character === "[" && !inClass) inClass = true;
    else if (character === "]" && inClass) inClass = false;
    else if (character === "/" && !inClass) {
      closingSlash = index;
      break;
    }
  }
  if (closingSlash < 0) throw new Error("Add the closing `/` and any regex flags.");
  const source = literal.slice(1, closingSlash);
  const flags = literal.slice(closingSlash + 1);
  if (!/^[dgimsuvy]*$/u.test(flags)) {
    throw new Error("Put only JavaScript regex flags after the closing `/`.");
  }
  try {
    return new RegExp(source, flags);
  } catch {
    throw new Error("That is not a valid JavaScript regex literal.");
  }
}
