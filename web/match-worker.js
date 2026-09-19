const MAX_CASES = 100;
const MAX_TEXT_LENGTH = 2048;

self.onmessage = (event) => {
  const { id, source, flags, mode, cases } = event.data;
  try {
    if (typeof source !== "string" || source.length > 16_384 || !/^[ims]*u$/u.test(flags)) {
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
    self.postMessage({ id, results });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
