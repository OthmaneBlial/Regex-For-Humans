/** @typedef {import("./worker-protocol.d.ts").TestPayload} TestPayload */
/** @typedef {import("./worker-protocol.d.ts").TestRequest} TestRequest */
/** @typedef {import("./worker-protocol.d.ts").TestResult} TestResult */
/** @typedef {import("./worker-protocol.d.ts").WorkerReply} WorkerReply */
/** @typedef {"CANCELLED" | "TIMEOUT" | "WORKER_ERROR"} TestRunErrorCode */

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
            result.pass !== (result.actual === expected)
          ) {
            invalid();
            return;
          }
          ids.add(result.id);
        }
        finish(null, data.results);
      };
      try {
        /** @type {TestRequest} */
        const request = { ...payload, id };
        if (Array.isArray(request.cases) && request.cases.length <= 100) {
          caseCount = request.cases.length;
          expectations = new Map(
            Array.from(request.cases, (sample) => [sample?.id, sample?.expected]),
          );
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
