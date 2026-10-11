export const OUTPUT_LIMITS = Object.freeze({ matches: 1000, captures: 20000, text: 1048576 });
export const OUTPUT_LIMIT_MESSAGE =
  "Example output is too large. Use fewer examples, captures or matches.";

export class OutputBudget {
  matches = 0;
  captures = 0;
  text = 0;

  /** @param {number} matches @param {number} captures @param {number} text */
  add(matches, captures, text) {
    this.matches += matches;
    this.captures += captures;
    this.text += text;
    return (
      this.matches <= OUTPUT_LIMITS.matches &&
      this.captures <= OUTPUT_LIMITS.captures &&
      this.text <= OUTPUT_LIMITS.text
    );
  }
}
