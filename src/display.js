/**
 * Escape invisible characters (controls, format, private use, unassigned, line separators and
 * non-ASCII spaces) so they stay visible; other text is preserved. @param {string} text
 */
export function escapeControls(text) {
  // Joiners and emoji tags stay: they are part of readable emoji, Persian and Indic text.
  const invisible =
    /(?! )\p{Zs}|(?!\u200c|\u200d|[\u{e0020}-\u{e007f}])[\p{Cc}\p{Cf}\p{Co}\p{Cn}\p{Zl}\p{Zp}]/gu;
  return text.replace(invisible, (character) =>
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
