import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { Worker } from "node:worker_threads";
import { compile } from "../index.js";
import { OUTPUT_LIMITS, OutputBudget } from "../web/output-budget.js";
import { TestRunner } from "../web/test-runner.js";

const outputError = "Example output is too large. Use fewer examples, captures or matches.";
const normal = {
  id: 1,
  source: "a",
  flags: "u",
  mode: "full",
  cases: [{ id: 1, text: "a", expected: true }],
};

async function workerFixture(t) {
  const worker = new Worker(
    `const {parentPort, workerData} = require('node:worker_threads');
     globalThis.self = {postMessage: data => parentPort.postMessage(data)};
     import(workerData).then(() => {
       parentPort.on('message', data => self.onmessage({data}));
       parentPort.postMessage('ready');
     });`,
    { eval: true, workerData: new URL("../web/match-worker.js", import.meta.url).href },
  );
  t.after(() => worker.terminate());
  assert.deepEqual(await once(worker, "message"), ["ready"]);
  return async (request) => {
    const reply = once(worker, "message");
    worker.postMessage(request);
    return (await reply)[0];
  };
}

const samples = (count, text) =>
  Array.from({ length: count }, (_, id) => ({ id, text, expected: true }));

function assertOutputError(reply) {
  assert.equal(reply.error, outputError);
  assert.deepEqual(reply, { id: 1, error: outputError });
}

test("worker rejects the million-capture batch atomically and accepts the next request", async (t) => {
  const send = await workerFixture(t);
  const compiled = compile(Array(100).fill("capture {\n}").join("\n"));
  assert.equal(new RegExp(compiled.source, compiled.flags).exec("").length - 1, 100);
  const reply = await send({
    ...normal,
    source: compiled.source,
    mode: "search",
    captureCount: 100,
    cases: samples(100, "A".repeat(99)),
  });
  assertOutputError(reply);
  assert.ok(JSON.stringify(reply).length < 200);
  assert.equal((await send(normal)).results[0].pass, true);
});

test("aggregate output budgets include the exact boundary and reject one unit beyond it", () => {
  for (const field of ["matches", "captures", "text"]) {
    const budget = new OutputBudget();
    const values = { matches: 0, captures: 0, text: 0, [field]: OUTPUT_LIMITS[field] };
    assert.equal(budget.add(values.matches, values.captures, values.text), true);
    values[field] = 1;
    assert.equal(budget.add(values.matches, values.captures, values.text), false);
  }
  assert.equal(new OutputBudget().add(1000, 20000, 1048576), true);
});

function captureReply(cases, count) {
  return cases.map((sample) => {
    const matches = Array.from({ length: sample.text.length + 1 }, (_, index) => ({
      value: "",
      range: { start: index, end: index },
      captures: Array.from({ length: count }, () => ({
        value: "",
        range: { start: index, end: index },
      })),
    }));
    return {
      id: sample.id,
      actual: true,
      pass: true,
      detail: 'Matched "" at 0',
      matchRange: { start: 0, end: 0 },
      matches,
      indicesAvailable: true,
      limitReached: matches.length === 100,
    };
  });
}

test("controller bounds match and capture batches before accepting their results", async () => {
  for (const [count, size] of [
    [0, 10],
    [100, 2],
  ]) {
    for (const overflow of [false, true]) {
      const cases = samples(size, "A".repeat(99));
      if (overflow) cases.push({ id: size, text: "", expected: true });
      await checkController(
        { ...normal, mode: "search", captureCount: count, cases },
        { results: captureReply(cases, count) },
        overflow,
      );
    }
  }
});

test("controller bounds aggregate details, replacements and error text, then recovers", async () => {
  const result = { id: 1, actual: true, pass: true, detail: "" };
  await checkController(normal, { results: [{ ...result, detail: "a".repeat(1048576) }] }, false);
  await checkController(normal, { results: [{ ...result, detail: "a".repeat(1048577) }] }, true);
  await checkController(normal, { error: "a".repeat(1048577) }, true);
  const cases = samples(17, "a").map((sample) => ({
    ...sample,
    expect: { replacement: { template: "b", result: "wrong" } },
  }));
  await checkController(
    { ...normal, cases },
    {
      results: cases.map((sample) => ({
        ...result,
        id: sample.id,
        pass: false,
        replacement: "b".repeat(65536),
        checks: { replacement: false },
      })),
    },
    true,
  );
});

async function checkController(payload, reply, invalid) {
  const workers = [];
  const runner = new TestRunner(() => {
    const worker = {
      postMessage(request) {
        this.request = request;
      },
      addEventListener() {},
      terminate() {
        this.terminated = true;
      },
    };
    workers.push(worker);
    return worker;
  });
  try {
    const pending = runner.run(payload);
    workers[0].onmessage({ data: { id: workers[0].request.id, ...reply } });
    if (invalid) {
      await assert.rejects(pending, {
        code: "WORKER_ERROR",
        message: "Invalid example test reply.",
      });
      assert.equal(workers[0].terminated, true);
      const recovery = runner.run(normal);
      assert.equal(workers.length, 2);
      workers[1].onmessage({
        data: {
          id: workers[1].request.id,
          results: [{ id: 1, actual: true, pass: true, detail: "Matched" }],
        },
      });
      assert.equal((await recovery)[0].pass, true);
    } else assert.deepEqual(await pending, reply.results);
  } finally {
    runner.cancel();
  }
}

test("worker preserves exactly 20,000 captures and rejects an additional capture record", async (t) => {
  const send = await workerFixture(t);
  const payload = {
    ...normal,
    source: "()".repeat(100),
    mode: "search",
    captureCount: 100,
    cases: samples(2, "A".repeat(99)),
  };
  const reply = await send(payload);
  assert.equal(reply.results.flatMap((result) => result.matches).length, 200);
  assert.ok(reply.results.every((result) => result.pass && result.limitReached));
  assertOutputError(
    await send({ ...payload, cases: [...payload.cases, { id: 2, text: "", expected: true }] }),
  );
});

test("worker preserves exactly 1,000 search records and rejects an additional record", async (t) => {
  const send = await workerFixture(t);
  const payload = {
    ...normal,
    source: "",
    mode: "search",
    captureCount: 0,
    cases: samples(10, "A".repeat(99)),
  };
  const reply = await send(payload);
  assert.equal(reply.results.flatMap((result) => result.matches).length, 1000);
  assertOutputError(
    await send({ ...payload, cases: [...payload.cases, { id: 10, text: "", expected: true }] }),
  );
});

test("worker bounds escaped details and replacement output across the entire batch", async (t) => {
  const send = await workerFixture(t);
  assert.equal(
    (await send({ ...normal, source: ".+", cases: samples(100, "a".repeat(2048)) })).results.length,
    100,
  );
  assertOutputError(
    await send({
      ...normal,
      source: ".+",
      flags: "su",
      cases: samples(100, "\u2028".repeat(2048)),
    }),
  );
  const cases = samples(100, "a".repeat(100) + "x".repeat(1948)).map((sample) => ({
    ...sample,
    expect: { replacement: { template: "b".repeat(128), result: "wrong" } },
  }));
  assertOutputError(await send({ ...normal, flags: "gu", mode: "search", cases }));
  assert.equal((await send(normal)).results[0].pass, true);
});

test("worker counts native capture strings in UTF-16 units without changing accepted values", async (t) => {
  const send = await workerFixture(t);
  const text = "😀".repeat(1024);
  const payload = {
    ...normal,
    source: "(?=([\\s\\S]+))".repeat(100) + "[\\s\\S]+",
    captureCount: 100,
    cases: samples(5, text),
  };
  const reply = await send(payload);
  assert.equal(reply.results.length, 5);
  assert.ok(
    reply.results.every(
      (result) =>
        result.pass && result.matches[0].captures.every((capture) => capture.value === text),
    ),
  );
  assertOutputError(await send({ ...payload, cases: samples(6, text) }));
});

test("worker also bounds escaped native error messages and preserves recovery", async (t) => {
  const send = await workerFixture(t);
  const reply = await send({ ...normal, source: "[" + "\u2028".repeat(131071) });
  assert.equal(typeof reply.error, "string");
  assert.ok(reply.error.length <= OUTPUT_LIMITS.text);
  assert.equal(reply.results, undefined);
  assert.equal((await send(normal)).results[0].pass, true);
});
