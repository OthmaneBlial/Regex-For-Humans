/** @typedef {import('./ast.js').Location} Location */

export class CompileError extends Error {
  /** @param {string} code @param {string} message @param {Location} location @param {string=} hint */
  constructor(code, message, location, hint) {
    super(message);
    this.name = "CompileError";
    this.code = code;
    this.line = location.line;
    this.column = location.column;
    if (hint) this.hint = hint;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      line: this.line,
      column: this.column,
      ...(this.hint ? { hint: this.hint } : {}),
    };
  }
}

/** @param {string} code @param {string} message @param {Location} location @param {string=} hint @returns {never} */
export function fail(code, message, location, hint) {
  throw new CompileError(code, message, location, hint);
}
