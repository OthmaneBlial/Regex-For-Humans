/** Expose directional controls while preserving other text. @param {string} text */
export function escapeDirectionControls(text) {
  return text.replace(/\p{Bidi_Control}/gu, (character) =>
    character
      .split("")
      .map((unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, "0")}`)
      .join(""),
  );
}

/** Quote data visibly as JSON. @param {string} text */
export function quoteText(text) {
  return escapeDirectionControls(JSON.stringify(text));
}
