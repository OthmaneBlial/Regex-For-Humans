import { readExpectation } from "./expectations.js";

/** @typedef {{format: 'regex-for-humans-tests', version: 1, rules: string, flags: string, mode: import('./worker-protocol.d.ts').MatchMode, cases: Array<Omit<import('./worker-protocol.d.ts').TestCase, 'id'>>}} TestFixture */

export const fixtureLimit = 4 * 1024 * 1024;
export const fixtureStorageKey = "regex-for-humans:tests.v1";

/** @param {unknown} value @param {string[]} keys @returns {value is Record<string, unknown>} */
function hasOnlyKeys(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => keys.includes(key))
  );
}

/** Validate the complete file before changing workshop state; rules may still need editing.
 * @param {string} text @returns {TestFixture}
 */
export function parseFixture(text) {
  if (typeof text !== "string" || text.length > fixtureLimit)
    throw new RangeError("Test fixture exceeds the 4 MiB limit.");
  const value = JSON.parse(text);
  if (
    !hasOnlyKeys(value, ["format", "version", "rules", "flags", "mode", "cases"]) ||
    value.format !== "regex-for-humans-tests" ||
    value.version !== 1 ||
    typeof value.rules !== "string" ||
    value.rules.length > 16384 ||
    typeof value.flags !== "string" ||
    !/^d?g?i?m?s?(?:u|v)y?$/u.test(value.flags) ||
    (value.mode !== "full" && value.mode !== "search") ||
    !Array.isArray(value.cases) ||
    value.cases.length > 100
  )
    throw new TypeError("Invalid version 1 test fixture, rules, flags or match mode.");
  /** @type {TestFixture['cases']} */
  const cases = [];
  for (const sample of value.cases) {
    if (
      !hasOnlyKeys(sample, ["text", "expected", "expect"]) ||
      typeof sample.text !== "string" ||
      sample.text.length > 2048 ||
      typeof sample.expected !== "boolean"
    )
      throw new TypeError("Fixture examples need a string of at most 2,048 units and a boolean.");
    const expect = readExpectation(sample.expect);
    cases.push({ text: sample.text, expected: sample.expected, ...(expect ? { expect } : {}) });
  }
  return {
    format: "regex-for-humans-tests",
    version: 1,
    rules: value.rules,
    flags: value.flags,
    mode: value.mode,
    cases,
  };
}
