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
        if (event.data.id !== id) return;
        if ("error" in event.data) finish(new TestRunError("WORKER_ERROR", event.data.error));
        else finish(null, event.data.results);
      };
      try {
        /** @type {TestRequest} */
        const request = { ...payload, id };
        worker.postMessage(request);
      } catch (error) {
        finish(
          new TestRunError("WORKER_ERROR", error instanceof Error ? error.message : String(error)),
        );
      }
    });
  }
}
