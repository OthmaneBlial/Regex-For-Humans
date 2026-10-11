/** @typedef {import('./worker-protocol.d.ts').ExpectedDetails} ExpectedDetails */
/** @typedef {import('./worker-protocol.d.ts').ExpectationChecks} ExpectationChecks */
/** @typedef {import('./worker-protocol.d.ts').MatchDetail} MatchDetail */

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Validate and snapshot detailed expectations before any native matching.
 * @param {unknown} value @returns {ExpectedDetails | undefined}
 */
export function readExpectation(value) {
  if (value === undefined) return undefined;
  if (
    !record(value) ||
    Object.keys(value).some((key) => !["spans", "captures", "replacement"].includes(key))
  )
    throw new TypeError("Expectations must contain only spans, captures or replacement.");
  if (JSON.stringify(value).length > 8192)
    throw new RangeError("Expectations exceed 8,192 UTF-16 code units.");
  /** @type {ExpectedDetails} */
  const expected = {};
  if (value.spans !== undefined) {
    if (!Array.isArray(value.spans) || value.spans.length > 100)
      throw new TypeError("Expected spans must be an array of at most 100 pairs.");
    expected.spans = [];
    for (const span of value.spans) {
      if (
        !Array.isArray(span) ||
        span.length !== 2 ||
        !Number.isSafeInteger(span[0]) ||
        !Number.isSafeInteger(span[1]) ||
        span[0] < 0 ||
        span[1] < span[0] ||
        span[1] > 2048
      )
        throw new TypeError("Expected spans need start/end pairs between 0 and 2,048.");
      expected.spans.push([span[0], span[1]]);
    }
  }
  if (value.captures !== undefined) {
    if (!Array.isArray(value.captures) || value.captures.length > 100)
      throw new TypeError("Expected captures must contain at most 100 match arrays.");
    expected.captures = [];
    for (const row of value.captures) {
      if (!Array.isArray(row) || row.length > 100)
        throw new TypeError("Each expected match must contain at most 100 capture values.");
      /** @type {Array<string|null>} */
      const values = [];
      for (const capture of row) {
        if (capture !== null && (typeof capture !== "string" || capture.length > 2048))
          throw new TypeError("Expected capture values must be strings or null for absence.");
        values.push(capture);
      }
      expected.captures.push(values);
    }
  }
  if (value.replacement !== undefined) {
    const replacement = value.replacement;
    if (
      !record(replacement) ||
      Object.keys(replacement).some((key) => !["template", "result"].includes(key)) ||
      typeof replacement.template !== "string" ||
      replacement.template.length > 128 ||
      typeof replacement.result !== "string" ||
      replacement.result.length > 65536
    )
      throw new TypeError(
        "Replacement needs a template of at most 128 units and a result of at most 65,536.",
      );
    expected.replacement = { template: replacement.template, result: replacement.result };
  }
  return expected;
}

/** @param {string} text @returns {ExpectedDetails | undefined} */
export function parseExpectation(text) {
  if (typeof text !== "string") throw new TypeError("Expectations must be JSON text.");
  if (text.length > 8192) throw new RangeError("Expectations exceed 8,192 UTF-16 code units.");
  return text.trim() ? readExpectation(JSON.parse(text)) : undefined;
}

/** Compare observable native results, including absent versus empty captures.
 * @param {ExpectedDetails} expected @param {MatchDetail[]} matches @param {string} [replacement] @param {boolean} [complete=true]
 * @returns {ExpectationChecks}
 */
export function expectationChecks(expected, matches, replacement, complete = true) {
  /** @type {ExpectationChecks} */
  const checks = {};
  if (expected.spans !== undefined)
    checks.spans =
      complete &&
      matches.length === expected.spans.length &&
      expected.spans.every(
        (span, index) =>
          span[0] === matches[index].range.start && span[1] === matches[index].range.end,
      );
  if (expected.captures !== undefined)
    checks.captures =
      complete &&
      matches.length === expected.captures.length &&
      expected.captures.every(
        (row, index) =>
          row.length === matches[index].captures.length &&
          row.every((value, capture) => value === matches[index].captures[capture].value),
      );
  if (expected.replacement !== undefined)
    checks.replacement = replacement === expected.replacement.result;
  return checks;
}
