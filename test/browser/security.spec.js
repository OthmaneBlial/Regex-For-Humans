import { test, expect } from "@playwright/test";

test("a pathological regex times out in a worker and normal tests still run", async ({ page }) => {
  await page.goto("/");
  const outcome = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    const makeRunner = timeout => new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }), timeout);
    const normal = await makeRunner(1000).run({
      source: "^a+$", flags: "u", mode: "full", cases: [{ id: 1, text: "aaa", expected: true }]
    });
    let timedOut = false;
    try {
      await makeRunner(150).run({
        source: "^(a+)+$", flags: "u", mode: "full", cases: [{ id: 2, text: `${"a".repeat(2047)}!`, expected: false }]
      });
    } catch (error) {
      timedOut = error.code === "TIMEOUT";
    }
    const recovered = await makeRunner(1000).run({
      source: "^b+$", flags: "u", mode: "full", cases: [{ id: 3, text: "bbb", expected: true }]
    });
    return { normal, timedOut, recovered };
  });
  expect(outcome.normal[0].pass).toBe(true);
  expect(outcome.timedOut).toBe(true);
  expect(outcome.recovered[0].pass).toBe(true);
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
});

test("oversized and HTML-like rules are rejected or rendered as text", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "One instruction per line" });
  await editor.fill(`a "${"x".repeat(16_385)}"`);
  await expect(page.locator("#diagnostic")).toContainText("Rules cannot exceed 16384 characters");
  await editor.fill('a "<img src=x onerror=alert(1)>"');
  await expect(page.locator("#regex-output")).toContainText("<img src=x onerror=alert");
  await expect(page.locator("img")).toHaveCount(0);
});
