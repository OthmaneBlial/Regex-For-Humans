/** @typedef {import("./worker-protocol.d.ts").TestPayload} TestPayload */
/** @typedef {import("./worker-protocol.d.ts").TestRequest} TestRequest */
/** @typedef {import("./worker-protocol.d.ts").TestResult} TestResult */
/** @typedef {import("./worker-protocol.d.ts").WorkerReply} WorkerReply */
/** @typedef {import("./worker-protocol.d.ts").MatchRange} MatchRange */
/** @typedef {import("./worker-protocol.d.ts").MatchMode} MatchMode */
/** @typedef {"CANCELLED" | "TIMEOUT" | "WORKER_ERROR"} TestRunErrorCode */

/** @param {unknown} value @param {MatchRange | null | undefined} range @param {string} text */
function validSpan(value, range, text) {
  return (
    typeof value === "string" &&
    range !== null &&
    typeof range === "object" &&
    !Array.isArray(range) &&
    Number.isSafeInteger(range.start) &&
    Number.isSafeInteger(range.end) &&
    range.start >= 0 &&
    range.end >= range.start &&
    range.end <= text.length &&
    text.slice(range.start, range.end) === value
  );
}

/** @param {TestResult} result @param {string} text @param {number} count @param {MatchMode} mode */
function validMatches(result, text, count, mode) {
  const matches = result.matches;
  if (
    !Number.isSafeInteger(count) ||
    count < 0 ||
    count > 100 ||
    !Array.isArray(matches) ||
    matches.length > (mode === "search" ? 100 : 1) ||
    typeof result.indicesAvailable !== "boolean" ||
    typeof result.limitReached !== "boolean" ||
    result.limitReached !== (mode === "search" && matches.length === 100)
  )
    return false;
  let nextStart = 0;
  for (const match of matches) {
    if (
      !match ||
      typeof match !== "object" ||
      Array.isArray(match) ||
      !validSpan(match.value, match.range, text) ||
      match.range.start < nextStart ||
      !Array.isArray(match.captures) ||
      match.captures.length !== count
    )
      return false;
    nextStart = match.range.end;
    if (match.value === "") nextStart += (text.codePointAt(nextStart) ?? 0) > 0xffff ? 2 : 1;
    for (const capture of match.captures) {
      if (!capture || typeof capture !== "object" || Array.isArray(capture)) return false;
      if (capture.value === null) {
        if (capture.range !== null) return false;
      } else if (
        typeof capture.value !== "string" ||
        capture.value.length > text.length ||
        (result.indicesAvailable
          ? !validSpan(capture.value, capture.range, text)
          : capture.range !== null)
      )
        return false;
    }
  }
  const first = matches[0];
  if (
    first
      ? result.matchRange?.start !== first.range.start || result.matchRange?.end !== first.range.end
      : result.matchRange !== null
  )
    return false;
  return (
    result.actual ===
    (first !== undefined &&
      (mode === "search" || (first.range.start === 0 && first.range.end === text.length)))
  );
}

export class TestRunError extends Error {
  /** @param {TestRunErrorCode} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = "TestRunError";
    this.code = code;
  }
}

export class TestRunner {
  /** @param {() => Worker} factory @param {number} [timeoutMs=1200] */
  constructor(factory, timeoutMs = 1200) {
    this.factory = factory;
    this.timeoutMs = timeoutMs;
    this.active = null;
    /** @type {Worker | null} */
    this.worker = null;
    this.sequence = 0;
  }

  /** @param {TestRunError} [error] */
  cancel(error = new TestRunError("CANCELLED", "A newer example test replaced this one.")) {
    const active = this.active;
    this.active = null;
    if (active) clearTimeout(active.timer);
    this.worker?.terminate();
    this.worker = null;
    active?.reject(error);
  }

  /** @param {TestPayload} payload @returns {Promise<TestResult[]>} */
  run(payload) {
    if (this.active) this.cancel();
    /** @type {Worker} */
    let worker;
    try {
      worker = this.worker ?? this.factory();
      if (!this.worker) {
        this.worker = worker;
        /** @param {Event} event */
        const handleError = (event) => {
          event.preventDefault?.();
          if (this.worker !== worker) return;
          this.cancel(
            new TestRunError("WORKER_ERROR", "Example testing failed in its isolated worker."),
          );
        };
        worker.onerror = handleError;
        worker.addEventListener("messageerror", handleError);
      }
    } catch (error) {
      return Promise.reject(
        new TestRunError("WORKER_ERROR", error instanceof Error ? error.message : String(error)),
      );
    }
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      let caseCount = -1;
      /** @type {Map<number, boolean> | null} */
      let expectations = null;
      /** @type {Map<number, number> | null} */
      let caseLengths = null;
      /** @type {Map<number, string> | null} */
      let caseTexts = null;
      /** @type {number | undefined} */
      let captureCount;
      /** @type {MatchMode} */
      let mode = "full";
      /** @param {Error | null} error @param {TestResult[]} [result=[]] */
      const finish = (error, result = []) => {
        if (this.active?.id !== id) return;
        clearTimeout(this.active.timer);
        this.active = null;
        if (error) {
          this.cancel();
          reject(error);
        } else resolve(result);
      };
      const timer = setTimeout(
        () => finish(new TestRunError("TIMEOUT", "Example testing took too long and was stopped.")),
        this.timeoutMs,
      );
      this.active = { id, timer, reject };
      /** @param {MessageEvent<WorkerReply>} event */
      worker.onmessage = (event) => {
        if (this.worker !== worker || this.active?.id !== id) return;
        const data = event.data;
        const invalid = () =>
          finish(new TestRunError("WORKER_ERROR", "Invalid example test reply."));
        if (
          !data ||
          typeof data !== "object" ||
          Array.isArray(data) ||
          !Number.isSafeInteger(data.id)
        ) {
          invalid();
          return;
        }
        if (data.id !== id) return;
        if ("error" in data) {
          if (typeof data.error !== "string" || "results" in data) invalid();
          else finish(new TestRunError("WORKER_ERROR", data.error));
          return;
        }
        if (
          !expectations ||
          !caseLengths ||
          !Array.isArray(data.results) ||
          data.results.length > 100 ||
          data.results.length !== caseCount
        ) {
          invalid();
          return;
        }
        const ids = new Set();
        for (const result of data.results) {
          const expected = expectations.get(result?.id);
          const length = caseLengths.get(result?.id);
          const range = result?.matchRange;
          if (
            !result ||
            typeof result !== "object" ||
            Array.isArray(result) ||
            !Number.isSafeInteger(result.id) ||
            ids.has(result.id) ||
            typeof result.actual !== "boolean" ||
            typeof result.pass !== "boolean" ||
            typeof result.detail !== "string" ||
            typeof expected !== "boolean" ||
            (range !== undefined &&
              range !== null &&
              (typeof range !== "object" ||
                Array.isArray(range) ||
                !Number.isSafeInteger(range.start) ||
                !Number.isSafeInteger(range.end) ||
                range.start < 0 ||
                range.end < range.start ||
                length === undefined ||
                range.end > length)) ||
            result.pass !== (result.actual === expected)
          ) {
            invalid();
            return;
          }
          ids.add(result.id);
          const text = caseTexts?.get(result.id);
          if (
            captureCount !== undefined
              ? typeof text !== "string" || !validMatches(result, text, captureCount, mode)
              : result.matches !== undefined ||
                result.indicesAvailable !== undefined ||
                result.limitReached !== undefined
          ) {
            invalid();
            return;
          }
        }
        finish(null, data.results);
      };
      try {
        /** @type {TestRequest} */
        const request = { ...payload, id };
        captureCount = request.captureCount;
        mode = request.mode;
        if (Array.isArray(request.cases) && request.cases.length <= 100) {
          caseCount = request.cases.length;
          expectations = new Map(
            Array.from(request.cases, (sample) => [sample?.id, sample?.expected]),
          );
          caseLengths = new Map(
            Array.from(request.cases, (sample) => [sample?.id, sample?.text?.length]),
          );
          caseTexts = new Map(Array.from(request.cases, (sample) => [sample?.id, sample?.text]));
        }
        worker.postMessage(request);
      } catch (error) {
        finish(
          new TestRunError("WORKER_ERROR", error instanceof Error ? error.message : String(error)),
        );
      }
    });
  }
}
