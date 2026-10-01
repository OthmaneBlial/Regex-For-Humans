import assert from "node:assert/strict";
import test from "node:test";
import {
  parseRegexLiteral,
  REGEX_LITERAL_INPUT_LIMIT,
  validateRegexLiteralLength,
} from "../src/regex-literal.js";

test("regex literal parsing respects escaped slashes, classes and outer whitespace", () => {
  for (const [literal, source, sample] of [
    [String.raw`/^a\/b$/u`, String.raw`^a\/b$`, "a/b"],
    ["/^[a/]{2}$/u", "^[a/]{2}$", "a/"],
    [String.raw`/^[\]\/\\]{2}$/u`, String.raw`^[\]\/\\]{2}$`, "]\\"],
    [String.raw`/^\[\/\]$/u`, String.raw`^\[\/\]$`, "[/]"],
    ["\n \ufeff/^😀$/u\r\n", "^😀$", "😀"],
    ["//u", "(?:)", ""],
  ]) {
    const regex = parseRegexLiteral(literal);
    assert.equal(regex.source, source, literal);
    assert.equal(regex.flags, "u", literal);
    assert.equal(regex.test(sample), true, literal);
  }
});

test("regex literal parsing leaves native flag support to the reverse translator", () => {
  for (const flags of [
    "",
    "u",
    "iu",
    "su",
    "isu",
    "mu",
    "imu",
    "msu",
    "imsu",
    "gu",
    "yu",
    "du",
    "v",
  ]) {
    const regex = parseRegexLiteral(`/a/${flags}`);
    assert.equal(regex.source, "a");
    assert.equal(regex.flags, new RegExp("a", flags).flags);
  }
});

test("regex literal parsing rejects incomplete delimiters, invalid flags and native syntax", () => {
  for (const [input, message] of [
    ["a", "Paste a slash-delimited JavaScript regex literal, such as `/\\d+/u`."],
    ["", "Paste a slash-delimited JavaScript regex literal, such as `/\\d+/u`."],
    ["/a", "Add the closing `/` and any regex flags."],
    ["/[a/u", "Add the closing `/` and any regex flags."],
    [String.raw`/a\/u`, "Add the closing `/` and any regex flags."],
    ["/a/ u", "Put only JavaScript regex flags after the closing `/`."],
    ["/a/z", "Put only JavaScript regex flags after the closing `/`."],
    ["/a/b/u", "Put only JavaScript regex flags after the closing `/`."],
    ["/a/uu", "That is not a valid JavaScript regex literal."],
    ["/a/uv", "That is not a valid JavaScript regex literal."],
    ["/(/u", "That is not a valid JavaScript regex literal."],
  ])
    assert.throws(() => parseRegexLiteral(input), { name: "Error", message }, input);
});

test("regex literal parsing rejects raw JavaScript line breaks even after an escape", () => {
  for (const separator of ["\n", "\r", "\u2028", "\u2029"]) {
    for (const prefix of ["a", "a\\"]) {
      assert.throws(() => parseRegexLiteral(`/${prefix}${separator}b/u`), {
        name: "Error",
        message: "Escape line breaks inside a regex literal, such as `\\n`.",
      });
    }
  }
});

test("regex literal input budgets apply before native construction and support streamed input", () => {
  const literal = `/${"a".repeat(REGEX_LITERAL_INPUT_LIMIT - 3)}/u`;
  assert.equal(literal.length, REGEX_LITERAL_INPUT_LIMIT);
  assert.doesNotThrow(() => validateRegexLiteralLength(literal));
  assert.equal(parseRegexLiteral(` ${literal}\n`).source.length, literal.length - 3);
  const expected = {
    name: "Error",
    message: "Regex input cannot exceed 16384 code units, plus its delimiters and flags.",
  };
  assert.throws(() => parseRegexLiteral(literal.replace("/u", "a/u")), expected);
  assert.throws(() => validateRegexLiteralLength(` ${literal}`), expected);
});
