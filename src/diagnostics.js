export class CompileError extends Error {
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
      ...(this.hint ? { hint: this.hint } : {})
    };
  }
}

export function fail(code, message, location, hint) {
  throw new CompileError(code, message, location, hint);
}
