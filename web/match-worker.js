import { escapeControls, quoteText } from "../src/display.js";
import { LIMITS } from "../src/parser.js";

/** @typedef {import("./worker-protocol.d.ts").TestRequest} TestRequest */
/** @typedef {import("./worker-protocol.d.ts").WorkerReply} WorkerReply */
/** @typedef {import("./worker-protocol.d.ts").MatchDetail} MatchDetail */

const MAX_CASES = 100;
const MAX_TEXT_LENGTH = 2048;
const MAX_MATCHES = 100;

/** @param {MessageEvent<TestRequest>} event */
self.onmessage = (event) => {
  const { id, source, flags, mode, cases, captureCount } = event.data ?? {};
  try {
    if (
      typeof source !== "string" ||
      source.length > LIMITS.regexSourceLength ||
      typeof flags !== "string" ||
      !/^(?:i)?(?:m)?(?:s)?u$/u.test(flags)
    ) {
      throw new Error("Invalid regex test request.");
    }
    if (!Array.isArray(cases) || cases.length > MAX_CASES || !["full", "search"].includes(mode)) {
      throw new Error("Invalid example test request.");
    }
    if (
      captureCount !== undefined &&
      (!Number.isSafeInteger(captureCount) || captureCount < 0 || captureCount > 100)
    ) {
      throw new Error("Invalid capture metadata.");
    }
    // Reject the whole batch before an earlier example can start expensive matching.
    const ids = new Set();
    for (const sample of cases) {
      if (
        sample === null ||
        typeof sample !== "object" ||
        Array.isArray(sample) ||
        !Number.isSafeInteger(sample.id) ||
        ids.has(sample.id) ||
        typeof sample.text !== "string" ||
        sample.text.length > MAX_TEXT_LENGTH ||
        typeof sample.expected !== "boolean"
      ) {
        throw new Error("An example is too long or invalid.");
      }
      ids.add(sample.id);
    }
    const explore = captureCount !== undefined;
    let indicesAvailable = false;
    if (explore) {
      try {
        // biome-ignore lint/complexity/useRegexLiterals: Older engines must parse the worker before this feature probe.
        indicesAvailable = new RegExp("", "d").hasIndices;
      } catch {
        // Older engines can report capture values without guessing their positions.
      }
    }
    const testFlags = `${indicesAvailable ? "d" : ""}${flags}`;
    const expression = new RegExp(source, `${explore && mode === "search" ? "g" : ""}${testFlags}`);
    // A strict input end still applies when line mode enables the m flag.
    const fullExpression =
      mode === "full" ? new RegExp(`^(?:${source})(?![\\s\\S])`, testFlags) : null;
    const results = cases.map((sample) => {
      expression.lastIndex = 0;
      let match = expression.exec(sample.text);
      if (fullExpression && match?.index === 0 && match[0].length !== sample.text.length) {
        const complete = fullExpression.exec(sample.text);
        if (complete?.index === 0) match = complete;
      }
      const actual =
        mode === "search"
          ? match !== null
          : match !== null && match.index === 0 && match[0].length === sample.text.length;
      let detail = match ? `Matched ${quoteText(match[0])} at ${match.index}` : "No match";
      if (match && !actual)
        detail = `Found ${quoteText(match[0])} at ${match.index}, not the entire string`;
      /** @type {MatchDetail[]} */
      const matches = [];
      if (explore) {
        let next = match;
        while (next && matches.length < MAX_MATCHES) {
          if (next.length !== captureCount + 1) throw new Error("Invalid capture metadata.");
          const current = next;
          matches.push({
            value: current[0],
            range: { start: current.index, end: current.index + current[0].length },
            captures: current.slice(1).map((value, index) => {
              const range = current.indices?.[index + 1];
              return {
                value: value ?? null,
                range: range ? { start: range[0], end: range[1] } : null,
              };
            }),
          });
          if (mode !== "search" || matches.length === MAX_MATCHES) break;
          // Advance empty Unicode matches by a code point, including past the input end.
          if (current[0].length === 0)
            expression.lastIndex +=
              (sample.text.codePointAt(expression.lastIndex) ?? 0) > 0xffff ? 2 : 1;
          next = expression.exec(sample.text);
        }
      }
      return {
        id: sample.id,
        actual,
        pass: actual === sample.expected,
        detail,
        matchRange: match ? { start: match.index, end: match.index + match[0].length } : null,
        ...(explore
          ? {
              matches,
              indicesAvailable,
              limitReached: mode === "search" && matches.length === MAX_MATCHES,
            }
          : {}),
      };
    });
    /** @type {WorkerReply} */
    const reply = { id, results };
    self.postMessage(reply);
  } catch (error) {
    /** @type {WorkerReply} */
    const reply = {
      id,
      error: escapeControls(error instanceof Error ? error.message : String(error)),
    };
    self.postMessage(reply);
  }
};
