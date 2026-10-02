import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";

test("malformed worker replies stop pending tests and allow fresh-worker recovery", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const outcome = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    let starts = 0;
    const runner = new TestRunner(() => {
      starts += 1;
      return new Worker("/web/match-worker.js", { type: "module" });
    });
    const normal = {
      source: "^a+$",
      flags: "u",
      mode: "full",
      cases: [{ id: 7, text: "aaa", expected: true }],
    };
    const result = { id: 7, actual: true, pass: true, detail: 'Matched "aaa" at 0' };
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
        { id: "7" },
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
    const outcomes = [];
    try {
      for (const reply of malformed) {
        await runner.run(normal);
        const failed = runner.worker;
        const attempt = runner.run(normal);
        const data = reply?.id === "current" ? { ...reply, id: runner.active.id } : reply;
        failed.dispatchEvent(new MessageEvent("message", { data }));
        const immediate = runner.active === null && runner.worker === null;
        let error = null;
        try {
          await attempt;
        } catch (failure) {
          error = { code: failure.code, message: failure.message };
        }
        const recovered = runner.run(normal);
        // A malformed late event from a retired worker must not cancel its replacement.
        failed.dispatchEvent(new MessageEvent("message", { data: null }));
        outcomes.push({ immediate, error, results: await recovered });
      }
      const stale = runner.run(normal);
      runner.worker.dispatchEvent(
        new MessageEvent("message", {
          data: { id: runner.active.id - 1, results: null },
        }),
      );
      const staleIgnored = runner.active !== null;
      const staleResults = await stale;
      runner.worker.dispatchEvent(new MessageEvent("message", { data: null }));
      const idlePreserved = runner.worker !== null;
      const boundary = await runner.run({
        ...normal,
        cases: Array.from({ length: 100 }, (_, index) => ({
          id:
            index === 0
              ? Number.MIN_SAFE_INTEGER
              : index === 99
                ? Number.MAX_SAFE_INTEGER
                : index - 50,
          text: "aaa",
          expected: true,
        })),
      });
      const empty = await runner.run({ ...normal, cases: [] });
      return { outcomes, starts, staleIgnored, staleResults, idlePreserved, boundary, empty };
    } finally {
      runner.cancel();
    }
  });
  const result = [{ id: 7, actual: true, pass: true, detail: 'Matched "aaa" at 0' }];
  expect(outcome.outcomes).toEqual(
    Array.from({ length: 40 }, () => ({
      immediate: true,
      error: { code: "WORKER_ERROR", message: "Invalid example test reply." },
      results: result,
    })),
  );
  expect(outcome.starts).toBe(41);
  expect(outcome.staleIgnored).toBe(true);
  expect(outcome.staleResults).toEqual(result);
  expect(outcome.idlePreserved).toBe(true);
  expect(outcome.boundary).toEqual(
    Array.from({ length: 100 }, (_, index) => ({
      id:
        index === 0 ? Number.MIN_SAFE_INTEGER : index === 99 ? Number.MAX_SAFE_INTEGER : index - 50,
      actual: true,
      pass: true,
      detail: 'Matched "aaa" at 0',
    })),
  );
  expect(outcome.empty).toEqual([]);
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  expect(errors).toEqual([]);
});

test("invalid result fields show a stable UI failure and preserve editing before recovery", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.workerStarts = 0;
    window.invalidReply = false;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        window.workerStarts += 1;
      }
      postMessage(request) {
        if (window.invalidReply)
          this.dispatchEvent(
            new MessageEvent("message", {
              data: {
                id: request.id,
                results: [
                  {
                    id: request.cases[0].id,
                    actual: true,
                    pass: "false",
                    detail: "Invalid result",
                  },
                ],
              },
            }),
          );
        else super.postMessage(request);
      }
    };
  });
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  const rules = await page.locator("#rules-input").inputValue();
  const pattern = await page.locator("#regex-output").textContent();
  const input = page.locator("#test-list textarea").first();
  await page.evaluate(() => {
    window.invalidReply = true;
  });
  await input.fill("ABC456");
  await expect(page.locator("#test-summary")).toHaveText("Invalid example test reply.");
  await expect(page.locator("#test-summary")).toHaveAttribute("data-state", "error");
  await expect(page.locator("#test-list .test-row").first()).toContainText("Testing stopped");
  await expect(input).toHaveValue("ABC456");
  await expect(input).toBeFocused();
  await expect(page.locator("#rules-input")).toHaveValue(rules);
  await expect(page.locator("#regex-output")).toHaveText(pattern);
  await expect(page.locator("#copy-button")).toBeEnabled();
  expect(await page.evaluate(() => window.workerStarts)).toBe(1);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.evaluate(() => {
    window.invalidReply = false;
  });
  await input.fill("ABC123");
  await expect(page.locator("#test-summary")).toHaveText(/4 of 4 examples behave as expected/u);
  await expect(input).toBeFocused();
  expect(await page.evaluate(() => window.workerStarts)).toBe(2);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(errors).toEqual([]);
});

test("worker message decode errors retire pending and idle workers before recovery", async ({
  page,
}) => {
  await page.goto("/");
  const outcome = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    let starts = 0;
    const runner = new TestRunner(() => {
      starts += 1;
      return new Worker("/web/match-worker.js", { type: "module" });
    });
    const normal = {
      source: "^a+$",
      flags: "u",
      mode: "full",
      cases: [{ id: 7, text: "aaa", expected: true }],
    };
    const outcomes = [];
    try {
      for (const pending of [true, false]) {
        await runner.run(normal);
        const failed = runner.worker;
        const attempt = pending ? runner.run(normal) : null;
        const event = new MessageEvent("messageerror", { cancelable: true });
        failed.dispatchEvent(event);
        let error = null;
        if (attempt) {
          try {
            await attempt;
          } catch (failure) {
            error = { code: failure.code, message: failure.message };
          }
        }
        const retired = runner.worker === null;
        const recovered = runner.run(normal);
        // A late decode error from the retired worker cannot cancel its replacement.
        failed.dispatchEvent(new MessageEvent("messageerror"));
        outcomes.push({
          error,
          retired,
          prevented: event.defaultPrevented,
          results: await recovered,
        });
      }
      return { outcomes, starts };
    } finally {
      runner.cancel();
    }
  });
  const result = [{ id: 7, actual: true, pass: true, detail: 'Matched "aaa" at 0' }];
  expect(outcome).toEqual({
    starts: 3,
    outcomes: [
      {
        error: {
          code: "WORKER_ERROR",
          message: "Example testing failed in its isolated worker.",
        },
        retired: true,
        prevented: true,
        results: result,
      },
      { error: null, retired: true, prevented: true, results: result },
    ],
  });
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
});

test("worker rejects nullish request data with a reply and keeps accepting valid requests", async ({
  page,
}) => {
  await page.goto("/");
  const replies = await page.evaluate(async () => {
    const worker = new Worker("/web/match-worker.js", { type: "module" });
    const send = (data) =>
      new Promise((resolve, reject) => {
        worker.onmessage = (event) => resolve(event.data);
        worker.onerror = (event) => {
          event.preventDefault();
          reject(new Error(event.message));
        };
        worker.postMessage(data);
      });
    const valid = {
      id: 1,
      source: "^a+$",
      flags: "u",
      mode: "full",
      cases: [{ id: 7, text: "aaa", expected: true }],
    };
    const replies = [];
    try {
      replies.push(await send(valid));
      for (const data of [null, undefined]) {
        replies.push(await send(data));
        replies.push(await send(valid));
      }
      return replies;
    } finally {
      worker.terminate();
    }
  });
  const valid = {
    id: 1,
    results: [{ id: 7, actual: true, pass: true, detail: 'Matched "aaa" at 0' }],
  };
  const invalid = { id: undefined, error: "Invalid regex test request." };
  expect(replies).toEqual([valid, invalid, valid, invalid, valid]);
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
});

test("worker validates the whole batch before running an earlier expensive example", async ({
  page,
}) => {
  await page.goto("/");
  const bounded = compile(
    ["start", ...Array(20).fill("between 1 and 1000 digits"), "end"].join("\n"),
  );
  const outcome = await page.evaluate(async (boundedSource) => {
    const { TestRunner } = await import("/web/test-runner.js");
    let starts = 0;
    const runner = new TestRunner(() => {
      starts += 1;
      return new Worker("/web/match-worker.js", { type: "module" });
    });
    const normal = {
      source: "^a+$",
      flags: "u",
      mode: "full",
      cases: [{ id: 1, text: "aaa", expected: true }],
    };
    const errors = [];
    const recovered = [];
    try {
      for (const [index, mode] of ["full", "search", "full", "search"].entries()) {
        // Warm the worker so a validation error cannot be confused with startup time.
        await runner.run(normal);
        const cases = [
          { id: 1, text: `${(index < 2 ? "a" : "7").repeat(2047)}!`, expected: false },
        ];
        if (index === 0) cases.push(null);
        else if (index === 1) cases.push({ id: 1, text: "b", expected: false });
        else if (index === 2) cases.push({ id: 2, text: "a".repeat(2049), expected: false });
        else cases.length += 1; // A sparse entry must be rejected too.
        try {
          await runner.run({
            source: index < 2 ? "^(a+)+$" : boundedSource,
            flags: "u",
            mode,
            cases,
          });
          errors.push(null);
        } catch (error) {
          errors.push({ code: error.code, message: error.message });
        }
        recovered.push(await runner.run(normal));
      }
      const boundary = await runner.run({
        ...normal,
        cases: Array.from({ length: 100 }, (_, index) => ({
          id: index - 50,
          text: "a".repeat(2048),
          expected: true,
        })),
      });
      return { errors, recovered, boundary, starts };
    } finally {
      runner.cancel();
    }
  }, bounded.source);
  expect(outcome.errors).toEqual(
    Array(4).fill({ code: "WORKER_ERROR", message: "An example is too long or invalid." }),
  );
  expect(outcome.recovered.every((results) => results[0].pass)).toBe(true);
  expect(outcome.boundary.map((result) => result.id)).toEqual(
    Array.from({ length: 100 }, (_, index) => index - 50),
  );
  expect(outcome.boundary.every((result) => result.actual && result.pass)).toBe(true);
  expect(outcome.starts).toBe(5);
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
});
