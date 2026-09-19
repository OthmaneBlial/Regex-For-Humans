import test from "node:test";
import assert from "node:assert/strict";
import { TestRunner } from "../web/test-runner.js";

class FakeWorker {
  constructor(reply = true) {
    this.reply = reply;
    this.terminated = false;
  }

  postMessage(request) {
    this.request = request;
    if (this.reply) queueMicrotask(() => this.onmessage({ data: { id: request.id, results: [{ id: 1, pass: true }] } }));
  }

  terminate() {
    this.terminated = true;
  }
}

test("isolated runner returns the current worker result and terminates it", async () => {
  const worker = new FakeWorker();
  const runner = new TestRunner(() => worker, 100);
  const result = await runner.run({ source: "a", flags: "u", mode: "search", cases: [] });
  assert.deepEqual(result, [{ id: 1, pass: true }]);
  assert.equal(worker.terminated, true);
  assert.equal(worker.request.source, "a");
});

test("isolated runner stops a worker that does not answer", async () => {
  const worker = new FakeWorker(false);
  const runner = new TestRunner(() => worker, 5);
  await assert.rejects(runner.run({}), { code: "TIMEOUT" });
  assert.equal(worker.terminated, true);
});

test("a new run cancels the old one without showing its stale result", async () => {
  const oldWorker = new FakeWorker(false);
  const newWorker = new FakeWorker();
  const workers = [oldWorker, newWorker];
  const runner = new TestRunner(() => workers.shift(), 100);
  const first = runner.run({ source: "old" });
  const second = runner.run({ source: "new" });
  await assert.rejects(first, { code: "CANCELLED" });
  assert.deepEqual(await second, [{ id: 1, pass: true }]);
  assert.equal(oldWorker.terminated, true);
  assert.equal(newWorker.terminated, true);
});
