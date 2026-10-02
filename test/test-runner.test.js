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

  addEventListener(type, listener) {
    assert.equal(type, "messageerror");
    assert.equal(this.onmessageerror, undefined, "Register the listener only once per worker.");
    this.onmessageerror = listener;
  }
}

test("isolated runner reuses a completed worker until explicitly cancelled", async () => {
  const worker = new FakeWorker();
  let starts = 0;
  const runner = new TestRunner(() => {
    starts += 1;
    return worker;
  }, 100);
  const result = await runner.run({ source: "a", flags: "u", mode: "search", cases: [] });
  assert.deepEqual(result, [{ id: 1, actual: true, pass: true, detail: 'Matched "a" at 0' }]);
  assert.equal(worker.terminated, false);
  assert.equal(worker.request.source, "a");
  await runner.run({ source: "b", flags: "iu", mode: "full", cases: [] });
  assert.equal(starts, 1);
  assert.equal(worker.request.source, "b");
  assert.equal(worker.request.flags, "iu");
  assert.equal(worker.request.mode, "full");
  runner.cancel();
  assert.equal(worker.terminated, true);
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
  assert.equal(recoveredWorker.terminated, false);
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
    assert.equal(workers.length, 1);
    assert.equal(workers[0].request.id, index + 1);
    assert.equal(workers[0].terminated, false);
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
  assert.equal(newWorker.terminated, false);
});

test("a stalled reused worker is terminated and a later run gets a fresh worker", async () => {
  const warm = new FakeWorker();
  const fresh = new FakeWorker();
  const workers = [warm, fresh];
  const runner = new TestRunner(() => workers.shift(), 5);
  await runner.run({ source: "a" });
  warm.reply = false;
  await assert.rejects(runner.run({ source: "stalled" }), { code: "TIMEOUT" });
  assert.equal(warm.terminated, true);
  assert.equal(runner.worker, null);
  assert.equal((await runner.run({ source: "recovered" }))[0].pass, true);
  assert.equal(fresh.request.source, "recovered");
});

test("cancelling a pending reused worker ignores late messages and errors before recovery", async () => {
  const warm = new FakeWorker();
  const fresh = new FakeWorker();
  const workers = [warm, fresh];
  const runner = new TestRunner(() => workers.shift(), 100);
  await runner.run({ source: "a" });
  warm.reply = false;
  const old = runner.run({ source: "pending" });
  const rejected = assert.rejects(old, { code: "CANCELLED" });
  const message = warm.onmessage;
  const failure = warm.onerror;
  runner.cancel();
  const current = runner.run({ source: "recovered" });
  message({ data: { id: warm.request.id, results: [{ pass: false }] } });
  failure({ preventDefault() {} });
  await rejected;
  assert.equal((await current)[0].pass, true);
  assert.equal(warm.terminated, true);
  assert.equal(fresh.terminated, false);
});

test("an idle worker failure discards it and allows a fresh run", async () => {
  const failed = new FakeWorker();
  const fresh = new FakeWorker();
  const workers = [failed, fresh];
  const runner = new TestRunner(() => workers.shift(), 100);
  await runner.run({ source: "a" });
  failed.onerror({ preventDefault() {} });
  assert.equal(failed.terminated, true);
  assert.equal(runner.worker, null);
  assert.equal((await runner.run({ source: "recovered" }))[0].pass, true);
  assert.equal(fresh.request.source, "recovered");
});

test("a reused worker error reply or send failure retires it before recovery", async () => {
  for (const failure of ["reply", "send", "event"]) {
    const failed = new FakeWorker();
    const fresh = new FakeWorker();
    const workers = [failed, fresh];
    const runner = new TestRunner(() => workers.shift(), 100);
    await runner.run({ source: "a" });
    failed.postMessage = (request) => {
      if (failure === "send") throw new Error("send failed");
      if (failure === "event") failed.onerror({ preventDefault() {} });
      else failed.onmessage({ data: { id: request.id, error: "bad request" } });
    };
    await assert.rejects(runner.run({ source: "invalid" }), { code: "WORKER_ERROR" });
    assert.equal(failed.terminated, true);
    assert.equal(runner.worker, null);
    assert.equal((await runner.run({ source: "recovered" }))[0].pass, true);
  }
});

test("worker message decode failures retire pending and idle workers before recovery", async () => {
  for (const pending of [true, false]) {
    const failed = new FakeWorker();
    const fresh = new FakeWorker();
    const workers = [failed, fresh];
    const runner = new TestRunner(() => workers.shift(), 20);
    await runner.run({ source: "warm" });
    failed.reply = false;
    const attempt = pending ? runner.run({ source: "pending" }) : null;
    const rejected = attempt
      ? assert.rejects(attempt, {
          code: "WORKER_ERROR",
          message: "Example testing failed in its isolated worker.",
        })
      : null;
    failed.onmessageerror?.({ preventDefault() {} });
    if (rejected) await rejected;
    assert.equal(failed.terminated, true);
    assert.equal(runner.worker, null);
    const recovered = runner.run({ source: "recovered" });
    failed.onmessageerror?.({ preventDefault() {} });
    assert.equal((await recovered)[0].pass, true);
    assert.equal(runner.worker, fresh);
    assert.equal(fresh.terminated, false);
    runner.cancel();
  }
});

test("malformed worker replies fail immediately and retire the worker before recovery", async () => {
  const result = { id: 1, actual: true, pass: true, detail: 'Matched "a" at 0' };
  const malformed = [
    null,
    undefined,
    false,
    3,
    "reply",
    [],
    {},
    { id: "current" },
    { id: NaN },
    { id: 1.5 },
    { id: Number.MAX_SAFE_INTEGER + 1 },
    ...[undefined, null, false, 3, [], {}].map((error) => ({ id: "current", error })),
    { id: "current", error: "failed", results: [] },
    ...[undefined, null, false, 3, "results", {}].map((results) => ({ id: "current", results })),
    { id: "current", results: [null] },
    { id: "current", results: [[]] },
    { id: "current", results: Array(1) },
    ...[
      { id: undefined },
      { id: "1" },
      { id: NaN },
      { id: 1.5 },
      { id: Number.MAX_SAFE_INTEGER + 1 },
      { actual: "true" },
      { actual: undefined },
      { pass: "false" },
      { pass: undefined },
      { detail: undefined },
      { detail: 3 },
    ].map((invalid) => ({ id: "current", results: [{ ...result, ...invalid }] })),
    { id: "current", results: [result, result] },
    { id: "current", results: Array.from({ length: 101 }, (_, id) => ({ ...result, id })) },
  ];
  for (const reply of malformed) {
    const failed = new FakeWorker(false);
    const fresh = new FakeWorker();
    const workers = [failed, fresh];
    const runner = new TestRunner(() => workers.shift(), 100);
    const attempt = runner.run({ source: "a", flags: "u", mode: "full", cases: [] });
    const outcome = attempt.then(
      (results) => ({ results }),
      (error) => ({ code: error.code, message: error.message }),
    );
    const data = reply?.id === "current" ? { ...reply, id: failed.request.id } : reply;
    const lateMessage = failed.onmessage;
    try {
      assert.doesNotThrow(() => lateMessage({ data }));
      assert.equal(runner.active, null, "Do not leave malformed replies waiting for a timeout.");
      assert.deepEqual(await outcome, {
        code: "WORKER_ERROR",
        message: "Invalid example test reply.",
      });
      assert.equal(failed.terminated, true);
      assert.equal(runner.worker, null);
      const recovered = runner.run({ source: "recovered" });
      assert.doesNotThrow(() => lateMessage({ data: null }));
      assert.equal((await recovered)[0].pass, true);
      assert.equal(fresh.terminated, false);
    } finally {
      runner.cancel();
    }
  }
});

test("valid worker replies retain boundary IDs, empty results and stale-message handling", async () => {
  const worker = new FakeWorker(false);
  const runner = new TestRunner(() => worker, 100);
  try {
    for (const results of [
      [],
      Array.from({ length: 100 }, (_, index) => ({
        id:
          index === 0
            ? Number.MIN_SAFE_INTEGER
            : index === 99
              ? Number.MAX_SAFE_INTEGER
              : index - 50,
        actual: index % 2 === 0,
        pass: index % 3 === 0,
        detail: index === 0 ? "" : `Result ${index}`,
      })),
    ]) {
      const attempt = runner.run({ source: "a", flags: "u", mode: "full", cases: [] });
      const id = worker.request.id;
      worker.onmessage({ data: { id: id - 1, results: null } });
      assert.equal(runner.active.id, id, "Ignore replies from an older request.");
      worker.onmessage({ data: { id, results } });
      assert.deepEqual(await attempt, results);
      assert.equal(worker.terminated, false);
      assert.equal(runner.worker, worker);
    }
    assert.doesNotThrow(() => worker.onmessage({ data: null }));
    assert.equal(worker.terminated, false, "Ignore messages when no request is pending.");
  } finally {
    runner.cancel();
  }
});
