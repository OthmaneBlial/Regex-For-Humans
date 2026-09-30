import { LIMITS } from "../src/parser.js";

/** @typedef {import("./worker-protocol.d.ts").TestRequest} TestRequest */
/** @typedef {import("./worker-protocol.d.ts").WorkerReply} WorkerReply */

const MAX_CASES = 100;
const MAX_TEXT_LENGTH = 2048;

/** @param {MessageEvent<TestRequest>} event */
self.onmessage = (event) => {
  const { id, source, flags, mode, cases } = event.data;
  try {
    if (
      typeof source !== "string" ||
      source.length > LIMITS.regexSourceLength ||
      typeof flags !== "string" ||
      !/^[ims]*u$/u.test(flags)
    ) {
      throw new Error("Invalid regex test request.");
    }
    if (!Array.isArray(cases) || cases.length > MAX_CASES || !["full", "search"].includes(mode)) {
      throw new Error("Invalid example test request.");
    }
    const expression = new RegExp(source, flags);
    const results = cases.map((sample) => {
      if (
        typeof sample.text !== "string" ||
        sample.text.length > MAX_TEXT_LENGTH ||
        typeof sample.expected !== "boolean"
      ) {
        throw new Error("An example is too long or invalid.");
      }
      const match = expression.exec(sample.text);
      const actual =
        mode === "search"
          ? match !== null
          : match !== null && match.index === 0 && match[0].length === sample.text.length;
      let detail = match ? `Matched ${JSON.stringify(match[0])} at ${match.index}` : "No match";
      if (match && !actual) detail = `Found ${JSON.stringify(match[0])}, not the entire string`;
      return { id: sample.id, actual, pass: actual === sample.expected, detail };
    });
    /** @type {WorkerReply} */
    const reply = { id, results };
    self.postMessage(reply);
  } catch (error) {
    /** @type {WorkerReply} */
    const reply = { id, error: error instanceof Error ? error.message : String(error) };
    self.postMessage(reply);
  }
};
