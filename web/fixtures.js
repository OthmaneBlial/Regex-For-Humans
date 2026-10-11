import { readExpectation } from "./expectations.js";

/** @typedef {{format: 'regex-for-humans-tests', version: 1, rules: string, flags: string, mode: import('./worker-protocol.d.ts').MatchMode, cases: Array<Omit<import('./worker-protocol.d.ts').TestCase, 'id'>>}} TestFixture */

export const fixtureLimit = 4 * 1024 * 1024;
export const fixtureStorageKey = "regex-for-humans:tests.v1";
export const shareLinkLimit = 32 * 1024;
const shareSizeMessage = "Share link exceeds 32 KiB. Export JSON to share this workspace.";

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

/** @param {string} text @param {string} href */
export function createFixtureLink(text, href) {
  const base = new URL(href);
  if (base.protocol !== "https:" && base.protocol !== "http:")
    throw new TypeError("Share links require an HTTP or HTTPS workshop URL.");
  const compact = JSON.stringify(parseFixture(text));
  if (compact.length > shareLinkLimit) throw new RangeError(shareSizeMessage);
  const bytes = new TextEncoder().encode(compact);
  if (bytes.length > shareLinkLimit) throw new RangeError(shareSizeMessage);
  const payload = btoa(String.fromCharCode(...bytes))
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(/=+$/u, "");
  const url = new URL(`${base.origin}${base.pathname}`);
  url.hash = `tests=${payload}`;
  if (url.href.length > shareLinkLimit) throw new RangeError(shareSizeMessage);
  return url.href;
}

/** @param {string} hash @returns {TestFixture|null} */
export function readFixtureLink(hash) {
  if (!hash.startsWith("#tests=")) return null;
  if (hash.length > shareLinkLimit) throw new RangeError(shareSizeMessage);
  try {
    const payload = hash.slice(7);
    if (!/^[A-Za-z0-9_-]+$/u.test(payload) || payload.length % 4 === 1) throw new TypeError();
    const binary = atob(payload.replace(/-/gu, "+").replace(/_/gu, "/"));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return parseFixture(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new TypeError("Invalid share link. Import JSON or copy a new link.");
  }
}
