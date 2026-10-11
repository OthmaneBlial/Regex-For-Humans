import { compile } from "../index.js";
import { escapeControls, quoteText } from "../src/display.js";
import { parseFixture } from "./fixtures.js";

/** @param {string} text @param {string} language */
function fenced(text, language) {
  let width = 3;
  for (const run of text.matchAll(/`+/gu)) width = Math.max(width, run[0].length + 1);
  const delimiter = "`".repeat(width);
  return `${delimiter}${language}\n${text}\n${delimiter}`;
}

/** Preserve JSON values while exposing controls without escaping formatting newlines.
 * @param {object} value
 */
function visibleJSON(value) {
  return JSON.stringify(value, null, 2).split("\n").map(escapeControls).join("\n");
}

/** Export validated intended tests without running example matching or claiming a pass.
 * @param {string} text Versioned fixture JSON.
 * @param {string} buildLabel The workshop's displayed build label.
 */
export function createMarkdownReport(text, buildLabel) {
  if (typeof buildLabel !== "string") throw new TypeError("The build label must be a string.");
  const fixture = parseFixture(text);
  const result = compile(fixture.rules, { flags: fixture.flags });
  const sections = [
    "# Regex For Humans test report",
    "This snapshot records intended expectations. Exporting does not run the tests or certify that they pass.",
    "## Build",
    fenced(buildLabel, "text"),
    "## Matching options",
    `Flags: \`${result.flags}\`\n\nMatch mode: \`${fixture.mode}\``,
    "Full mode requires a match covering the entire input. Search mode reports up to 100 nonoverlapping native matches. Each example starts at position 0; sticky matching stops at the first gap.",
    "## Readable rules",
    fenced(fixture.rules, "text"),
    "## JavaScript regex",
    fenced(`/${result.source}/${result.flags}`, "javascript"),
    "## Intended test cases",
    "Input is a JSON string. Exact spans use UTF-16 positions; capture null means absent, while an empty string means an empty capture.",
  ];
  fixture.cases.forEach((sample, index) => {
    sections.push(
      `### Case ${index + 1}: must ${sample.expected ? "match" : "not match"}`,
      fenced(quoteText(sample.text), "json"),
    );
    if (sample.expect)
      sections.push("Exact expectations:", fenced(visibleJSON(sample.expect), "json"));
  });
  if (!fixture.cases.length) sections.push("No test cases.");
  sections.push(
    "## Reimportable regression fixture",
    "Copy this JSON into a file and use Import JSON in the workshop. Review the resulting tests there.",
    fenced(visibleJSON(fixture), "json"),
  );
  return `${sections.join("\n\n")}\n`;
}
