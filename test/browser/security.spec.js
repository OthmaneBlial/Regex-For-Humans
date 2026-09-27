import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";
import { LIMITS } from "../../src/parser.js";

test("a pathological regex times out in a worker and normal tests still run", async ({ page }) => {
  await page.goto("/");
  const outcome = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    const makeRunner = (timeout) =>
      new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }), timeout);
    const normal = await makeRunner(1000).run({
      source: "^a+$",
      flags: "u",
      mode: "full",
      cases: [{ id: 1, text: "aaa", expected: true }],
    });
    let timedOut = false;
    try {
      await makeRunner(150).run({
        source: "^(a+)+$",
        flags: "u",
        mode: "full",
        cases: [{ id: 2, text: `${"a".repeat(2047)}!`, expected: false }],
      });
    } catch (error) {
      timedOut = error.code === "TIMEOUT";
    }
    const recovered = await makeRunner(1000).run({
      source: "^b+$",
      flags: "u",
      mode: "full",
      cases: [{ id: 3, text: "bbb", expected: true }],
    });
    return { normal, timedOut, recovered };
  });
  expect(outcome.normal[0].pass).toBe(true);
  expect(outcome.timedOut).toBe(true);
  expect(outcome.recovered[0].pass).toBe(true);
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
});

test("worker accepts regex source expanded by Unicode escaping", async ({ page }) => {
  await page.goto("/");
  const character = "\u2028";
  const rules = `"${character.repeat(LIMITS.sourceLength - 2)}"`;
  const result = compile(rules);
  expect(rules.length).toBe(LIMITS.sourceLength);
  expect(result.source.length).toBeGreaterThan(LIMITS.sourceLength);
  expect(result.source.length).toBe((LIMITS.sourceLength - 2) * 8);
  expect(result.source.length).toBeLessThanOrEqual(LIMITS.regexSourceLength);

  const outcome = await page.evaluate(
    async ({ source, flags, sample, maxSourceLength }) => {
      const { TestRunner } = await import("/web/test-runner.js");
      const runner = new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }));
      const match = await runner.run({
        source,
        flags,
        mode: "full",
        cases: [{ id: 1, text: sample, expected: false }],
      });
      let oversizedRejected = false;
      try {
        await runner.run({
          source: "x".repeat(maxSourceLength + 1),
          flags: "u",
          mode: "full",
          cases: [],
        });
      } catch (error) {
        oversizedRejected = error.code === "WORKER_ERROR";
      }
      return { match, oversizedRejected };
    },
    {
      source: result.source,
      flags: result.flags,
      sample: "x",
      maxSourceLength: LIMITS.regexSourceLength,
    },
  );
  expect(outcome.match[0].pass).toBe(true);
  expect(outcome.oversizedRejected).toBe(true);
});

test("oversized and HTML-like rules are rejected or rendered as text", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Write your rules" });
  await editor.fill(`"${"x".repeat(16_385)}"`);
  await expect(page.locator("#diagnostic")).toContainText(
    "Rules cannot exceed 16384 UTF-16 code units",
  );
  await editor.fill('"<img src=x onerror=alert(1)>"');
  await expect(page.locator("#regex-output")).toContainText("<img src=x onerror=alert");
  await expect(page.locator("img")).toHaveCount(0);
});
