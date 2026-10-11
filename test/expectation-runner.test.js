import assert from "node:assert/strict";
import test from "node:test";
import { TestRunner } from "../web/test-runner.js";

class ExpectationWorker {
  postMessage(request) {
    this.request = request;
  }
  addEventListener() {}
  terminate() {
    this.terminated = true;
  }
}

const payload = () => ({
  source: "(a)",
  flags: "u",
  mode: "full",
  captureCount: 1,
  cases: [
    {
      id: 1,
      text: "a",
      expected: true,
      expect: { spans: [[0, 1]], captures: [["a"]], replacement: { template: "$1", result: "a" } },
    },
  ],
});
const result = () => ({
  id: 1,
  actual: true,
  pass: true,
  detail: 'Matched "a" at 0',
  matchRange: { start: 0, end: 1 },
  matches: [
    {
      value: "a",
      range: { start: 0, end: 1 },
      captures: [{ value: "a", range: { start: 0, end: 1 } }],
    },
  ],
  indicesAvailable: true,
  limitReached: false,
  checks: { spans: true, captures: true, replacement: true },
  replacement: "a",
  matchesTruncated: false,
});

test("controller snapshots detailed expectations and accepts consistent native mismatches", async () => {
  const worker = new ExpectationWorker();
  const runner = new TestRunner(() => worker);
  try {
    const input = payload();
    const attempt = runner.run(input);
    input.cases[0].expect.spans[0][0] = 1;
    input.cases[0].expect.captures[0][0] = "changed";
    input.cases[0].expect.replacement.result = "changed";
    const accepted = result();
    worker.onmessage({ data: { id: worker.request.id, results: [accepted] } });
    assert.deepEqual(await attempt, [accepted]);
    const wrongExpected = payload();
    wrongExpected.cases[0].expect.replacement.result = "b";
    const mismatch = runner.run(wrongExpected);
    const failed = {
      ...result(),
      pass: false,
      checks: { spans: true, captures: true, replacement: false },
    };
    worker.onmessage({ data: { id: worker.request.id, results: [failed] } });
    assert.deepEqual(await mismatch, [failed]);
  } finally {
    runner.cancel();
  }
});

test("controller rejects forged expectation checks and invalid requests before posting", async () => {
  for (const change of [
    { checks: undefined },
    { checks: { spans: true, captures: true, replacement: false } },
    { checks: { spans: true, captures: true, replacement: true, extra: true } },
    { replacement: undefined },
    { replacement: "x".repeat(65537) },
    { replacement: "wrong" },
    { matchesTruncated: undefined },
    { matchesTruncated: true },
    { pass: false },
  ]) {
    const worker = new ExpectationWorker();
    const runner = new TestRunner(() => worker);
    const attempt = runner.run(payload());
    worker.onmessage({ data: { id: worker.request.id, results: [{ ...result(), ...change }] } });
    await assert.rejects(attempt, { code: "WORKER_ERROR", message: "Invalid example test reply." });
    assert.equal(worker.terminated, true);
  }
  for (const input of [
    { ...payload(), captureCount: undefined },
    { ...payload(), cases: [{ id: 1, text: "a", expected: true, expect: { spans: [[1, 0]] } }] },
  ]) {
    const worker = new ExpectationWorker();
    const runner = new TestRunner(() => worker);
    await assert.rejects(runner.run(input), { code: "WORKER_ERROR" });
    assert.equal(worker.request, undefined);
    assert.equal(worker.terminated, true);
  }
});
