/** Expose control characters and line separators while preserving other text. @param {string} text */
export function escapeControls(text) {
  return text.replace(/[\p{Bidi_Control}\p{Control}\u2028\u2029]/gu, (character) =>
    character
      .split("")
      .map((unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, "0")}`)
      .join(""),
  );
}

/** Quote data visibly as JSON. @param {string} text */
export function quoteText(text) {
  return escapeControls(JSON.stringify(text));
}
