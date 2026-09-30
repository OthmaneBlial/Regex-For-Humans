import assert from "node:assert/strict";
import test from "node:test";
import { TestRunner } from "../web/test-runner.js";

class FakeWorker {
  constructor(reply = true) {
    this.reply = reply;
    this.terminated = false;
  }

  postMessage(request) {
    this.request = request;
    if (this.reply)
      queueMicrotask(() =>
        this.onmessage({
          data: {
            id: request.id,
            results: [{ id: 1, actual: true, pass: true, detail: 'Matched "a" at 0' }],
          },
        }),
      );
  }

  terminate() {
    this.terminated = true;
  }
}

test("isolated runner returns the current worker result and terminates it", async () => {
  const worker = new FakeWorker();
  const runner = new TestRunner(() => worker, 100);
  const result = await runner.run({ source: "a", flags: "u", mode: "search", cases: [] });
  assert.deepEqual(result, [{ id: 1, actual: true, pass: true, detail: 'Matched "a" at 0' }]);
  assert.equal(worker.terminated, true);
  assert.equal(worker.request.source, "a");
});

test("isolated runner stops a worker that does not answer", async () => {
  const worker = new FakeWorker(false);
  const runner = new TestRunner(() => worker, 5);
  await assert.rejects(runner.run({}), { code: "TIMEOUT" });
  assert.equal(worker.terminated, true);
});

test("isolated runner reports non-Error worker failures", async () => {
  const worker = new FakeWorker();
  worker.postMessage = () => {
    throw "worker unavailable";
  };
  const runner = new TestRunner(() => worker, 100);
  await assert.rejects(runner.run({}), {
    code: "WORKER_ERROR",
    message: "worker unavailable",
  });
  assert.equal(worker.terminated, true);
});

test("worker startup failures reject promises, cancel the old run and allow recovery", async () => {
  const oldWorker = new FakeWorker(false);
  const recoveredWorker = new FakeWorker();
  const creations = [
    oldWorker,
    new Error("Worker construction blocked"),
    "worker unavailable",
    recoveredWorker,
  ];
  const runner = new TestRunner(() => {
    const creation = creations.shift();
    if (creation instanceof FakeWorker) return creation;
    throw creation;
  }, 100);
  const first = runner.run({ source: "old" });
  const cancelled = assert.rejects(first, { code: "CANCELLED" });
  for (const message of ["Worker construction blocked", "worker unavailable"]) {
    const attempt = runner.run({ source: "new" });
    assert.equal(typeof attempt.then, "function");
    await assert.rejects(attempt, { code: "WORKER_ERROR", message });
  }
  await cancelled;
  assert.equal(oldWorker.terminated, true);
  const recovered = await runner.run({ source: "a", flags: "u", mode: "full", cases: [] });
  assert.equal(recovered[0].pass, true);
  assert.equal(recoveredWorker.terminated, true);
  assert.notEqual(recoveredWorker.request.id, oldWorker.request.id);
});

test("the controller owns request IDs even when a payload has an extra id", async () => {
  const workers = [];
  const runner = new TestRunner(() => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker;
  }, 100);
  for (const [index, id] of [999, 1, undefined].entries()) {
    const payload = { source: "a", flags: "u", mode: "full", cases: [], id };
    const result = await runner.run(payload);
    assert.equal(result[0].pass, true);
    assert.equal(workers[index].request.id, index + 1);
    assert.equal(workers[index].terminated, true);
    assert.equal(payload.id, id);
  }
});

test("a new run cancels the old one without showing its stale result", async () => {
  const oldWorker = new FakeWorker(false);
  const newWorker = new FakeWorker();
  const workers = [oldWorker, newWorker];
  const runner = new TestRunner(() => workers.shift(), 100);
  const first = runner.run({ source: "old" });
  const second = runner.run({ source: "new" });
  await assert.rejects(first, { code: "CANCELLED" });
  assert.deepEqual(await second, [{ id: 1, actual: true, pass: true, detail: 'Matched "a" at 0' }]);
  assert.equal(oldWorker.terminated, true);
  assert.equal(newWorker.terminated, true);
});
