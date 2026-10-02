import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";

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
