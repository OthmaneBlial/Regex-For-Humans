import { expect, test } from "@playwright/test";

test("worker verifies exact native spans, participation and original-flag replacements", async ({
  page,
}) => {
  await page.goto("/");
  const output = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    const runner = new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }));
    const records = [];
    try {
      for (const flags of ["du", "dgu", "dv", "dgv"]) {
        for (const [source, text, count, template] of [
          ["(?<letter>A)(?<empty>)(B)?(C)?", "😀AB\r\nA", 4, "$<letter>$2$3$4"],
          ["(😀)|(?<empty>)", "😀A", 2, "<$1$<empty>>"],
          ["(?<=(?<previous>😀))A", "😀A", 1, "$`-$<previous>-$&-$'"],
          ["()".repeat(100), "A", 100, "$01/$99/$100"],
        ]) {
          const native = new RegExp(source, flags.includes("g") ? flags : `${flags}g`);
          const spans = [];
          const captures = [];
          for (let match = native.exec(text); match; match = native.exec(text)) {
            spans.push([match.index, match.index + match[0].length]);
            captures.push(match.slice(1).map((value) => value ?? null));
            if (match[0] === "")
              native.lastIndex += (text.codePointAt(native.lastIndex) ?? 0) > 0xffff ? 2 : 1;
          }
          const expected = {
            spans,
            captures,
            replacement: { template, result: text.replace(new RegExp(source, flags), template) },
          };
          const request = {
            source,
            flags,
            mode: "search",
            captureCount: count,
            cases: [{ id: 1, text, expected: true, expect: expected }],
          };
          const [correct] = await runner.run(request);
          expected.replacement.result += "wrong";
          const [wrong] = await runner.run(request);
          records.push({
            pass: correct.pass,
            checks: correct.checks,
            replacement: correct.replacement,
            truncated: correct.matchesTruncated,
            wrongPass: wrong.pass,
            wrongChecks: wrong.checks,
          });
        }
      }
      return records;
    } finally {
      runner.cancel();
    }
  });
  expect(output).toHaveLength(16);
  for (const record of output) {
    expect(record).toMatchObject({
      pass: true,
      checks: { spans: true, captures: true, replacement: true },
      truncated: false,
      wrongPass: false,
      wrongChecks: { spans: true, captures: true, replacement: false },
    });
  }
});

test("exact expectations never pass when the native search list is truncated", async ({ page }) => {
  await page.goto("/");
  const output = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    const runner = new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }));
    const records = [];
    try {
      for (const length of [100, 101]) {
        const [result] = await runner.run({
          source: "(a)",
          flags: "gu",
          mode: "search",
          captureCount: 1,
          cases: [
            {
              id: 1,
              text: "a".repeat(length),
              expected: true,
              expect: {
                spans: Array.from({ length: 100 }, (_, index) => [index, index + 1]),
                captures: Array.from({ length: 100 }, () => ["a"]),
              },
            },
          ],
        });
        records.push({
          length,
          pass: result.pass,
          checks: result.checks,
          truncated: result.matchesTruncated,
          matches: result.matches.length,
          limitReached: result.limitReached,
        });
      }
      return records;
    } finally {
      runner.cancel();
    }
  });
  expect(output).toEqual([
    {
      length: 100,
      pass: true,
      checks: { spans: true, captures: true },
      truncated: false,
      matches: 100,
      limitReached: true,
    },
    {
      length: 101,
      pass: false,
      checks: { spans: false, captures: false },
      truncated: true,
      matches: 100,
      limitReached: true,
    },
  ]);
});

test("worker validates the entire batch before matching and bounded replacements recover", async ({
  page,
}) => {
  await page.goto("/");
  const output = await page.evaluate(async () => {
    const worker = new Worker("/web/match-worker.js", { type: "module" });
    let timer;
    const rejected = await new Promise((resolve) => {
      timer = setTimeout(() => resolve({ error: "Validation probe timed out" }), 3000);
      worker.onmessage = (event) => resolve(event.data);
      worker.postMessage({
        id: 71,
        source: "(a+)+$",
        flags: "u",
        mode: "full",
        captureCount: 1,
        cases: [
          { id: 1, text: `${"a".repeat(1900)}!`, expected: false },
          { id: 2, text: "a", expected: true, expect: { spans: [[1, 0]] } },
        ],
      });
    });
    clearTimeout(timer);
    worker.terminate();
    const { TestRunner } = await import("/web/test-runner.js");
    const runner = new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }));
    let stopped;
    try {
      try {
        await runner.run({
          source: "(?=(.*))",
          flags: "gu",
          mode: "full",
          captureCount: 1,
          cases: [
            {
              id: 1,
              text: "a".repeat(2048),
              expected: false,
              expect: { replacement: { template: "$1".repeat(64), result: "" } },
            },
          ],
        });
      } catch (error) {
        stopped = { code: error.code, message: error.message };
      }
      const [recovered] = await runner.run({
        source: "(a)",
        flags: "u",
        mode: "full",
        captureCount: 1,
        cases: [
          {
            id: 1,
            text: "a",
            expected: true,
            expect: { captures: [["a"]], replacement: { template: "B", result: "B" } },
          },
        ],
      });
      return { rejected, stopped, pass: recovered.pass, replacement: recovered.replacement };
    } finally {
      runner.cancel();
    }
  });
  expect(output.rejected).toMatchObject({
    id: 71,
    error: expect.stringContaining("Expected spans"),
  });
  expect(output.stopped).toEqual({
    code: "WORKER_ERROR",
    message: "Replacement output exceeds 65,536 UTF-16 code units.",
  });
  expect(output).toMatchObject({ pass: true, replacement: "B" });
});
