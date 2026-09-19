export class TestRunError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "TestRunError";
    this.code = code;
  }
}

export class TestRunner {
  constructor(factory, timeoutMs = 1200) {
    this.factory = factory;
    this.timeoutMs = timeoutMs;
    this.active = null;
    this.sequence = 0;
  }

  cancel() {
    if (!this.active) return;
    const { worker, timer, reject } = this.active;
    this.active = null;
    clearTimeout(timer);
    worker.terminate();
    reject(new TestRunError("CANCELLED", "A newer example test replaced this one."));
  }

  run(payload) {
    this.cancel();
    const worker = this.factory();
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const finish = (error, result) => {
        if (this.active?.id !== id) return;
        clearTimeout(this.active.timer);
        worker.terminate();
        this.active = null;
        if (error) reject(error);
        else resolve(result);
      };
      const timer = setTimeout(() => finish(new TestRunError("TIMEOUT", "Example testing took too long and was stopped.")), this.timeoutMs);
      this.active = { id, worker, timer, reject };
      worker.onmessage = event => {
        if (event.data.id !== id) return;
        if (event.data.error) finish(new TestRunError("WORKER_ERROR", event.data.error));
        else finish(null, event.data.results);
      };
      worker.onerror = event => {
        event.preventDefault?.();
        finish(new TestRunError("WORKER_ERROR", "Example testing failed in its isolated worker."));
      };
      try {
        worker.postMessage({ id, ...payload });
      } catch (error) {
        finish(new TestRunError("WORKER_ERROR", error.message));
      }
    });
  }
}
