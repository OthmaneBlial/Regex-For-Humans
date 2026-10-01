import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";
import { LIMITS } from "../../src/parser.js";

test("pathological and compiler-generated bounded regexes time out without blocking recovery", async ({
  page,
}) => {
  await page.goto("/");
  const bounded = compile(
    ["start", ...Array(20).fill("between 1 and 1000 digits"), "end"].join("\n"),
  );
  const outcome = await page.evaluate(async (boundedSource) => {
    const { TestRunner } = await import("/web/test-runner.js");
    const makeRunner = (timeout) =>
      new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }), timeout);
    const normal = await makeRunner(1000).run({
      source: "^a+$",
      flags: "u",
      mode: "full",
      cases: [{ id: 1, text: "aaa", expected: true }],
    });
    const timedOut = [];
    for (const [source, text] of [
      ["^(a+)+$", `${"a".repeat(2047)}!`],
      ["(a+)+", `${"a".repeat(2047)}!`],
      [boundedSource, `${"7".repeat(2047)}!`],
    ]) {
      let stopped = false;
      try {
        await makeRunner(150).run({
          source,
          flags: "u",
          mode: "full",
          cases: [{ id: 2, text, expected: false }],
        });
      } catch (error) {
        stopped = error.code === "TIMEOUT";
      }
      timedOut.push(stopped);
    }
    const recovered = await makeRunner(1000).run({
      source: "^b+$",
      flags: "u",
      mode: "full",
      cases: [{ id: 3, text: "bbb", expected: true }],
    });
    return { normal, timedOut, recovered };
  }, bounded.source);
  expect(outcome.normal[0].pass).toBe(true);
  expect(outcome.timedOut).toEqual([true, true, true]);
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

test("worker rejects invalid flags without coercing them", async ({ page }) => {
  await page.goto("/");
  const outcome = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    const runner = new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }));
    const payload = {
      source: "a",
      flags: "u",
      mode: "full",
      cases: [{ id: 1, text: "a", expected: true }],
    };
    const errors = [];
    for (const flags of [["u"], null, 0, {}, "iuu", "gui", "miu"]) {
      try {
        await runner.run({ ...payload, flags });
        errors.push(null);
      } catch (error) {
        errors.push({ code: error.code, message: error.message });
      }
    }
    return { errors, recovered: await runner.run(payload) };
  });
  expect(outcome.errors).toEqual(
    Array(7).fill({ code: "WORKER_ERROR", message: "Invalid regex test request." }),
  );
  expect(outcome.recovered[0].pass).toBe(true);
});

test("worker startup errors use the regular error code and extra payload IDs cannot cause timeouts", async ({
  page,
}) => {
  await page.goto("/");
  const outcome = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    let blocked = true;
    const runner = new TestRunner(() => {
      if (blocked) {
        blocked = false;
        throw new Error("Worker construction blocked");
      }
      return new Worker("/web/match-worker.js", { type: "module" });
    });
    const payload = {
      source: "^a+$",
      flags: "u",
      mode: "full",
      cases: [
        { id: 101, text: "aaa", expected: true },
        { id: 102, text: "bbb", expected: false },
      ],
    };
    let startup;
    try {
      await runner.run(payload);
    } catch (error) {
      startup = { code: error.code, message: error.message };
    }
    const recovered = [];
    for (const id of [999, 0]) recovered.push(await runner.run({ ...payload, id }));
    return { startup, recovered };
  });
  expect(outcome.startup).toEqual({
    code: "WORKER_ERROR",
    message: "Worker construction blocked",
  });
  for (const results of outcome.recovered) {
    expect(results.map((result) => result.id)).toEqual([101, 102]);
    expect(results.every((result) => result.pass)).toBe(true);
  }
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
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

test("long literal explanations wrap within the trace viewport and keep source selection working", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const editor = page.locator("#rules-input");
  const viewport = page.viewportSize();
  for (const length of [4096, LIMITS.sourceLength - 2]) {
    const rules = JSON.stringify("x".repeat(length));
    const result = compile(rules);
    await editor.fill(rules);
    await expect(page.locator("#compile-state")).toHaveText("Compiled");
    await expect(page.locator("#regex-output")).toHaveText(`/${result.source}/${result.flags}`);
    await expect(page.locator("#copy-button")).toBeEnabled();
    for (const width of [viewport.width, 320]) {
      await page.setViewportSize({ width, height: viewport.height });
      expect(
        await page
          .locator("#trace-list")
          .evaluate((trace) => trace.scrollWidth <= trace.clientWidth),
      ).toBe(true);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const explanation = page.locator("#trace-list button").first();
      await explanation.focus();
      expect(
        await explanation.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const clip = element.parentElement.getBoundingClientRect();
          const style = getComputedStyle(element);
          const width = Number.parseFloat(style.outlineWidth);
          const extent = Number.parseFloat(style.outlineOffset) + width;
          return (
            element.matches(":focus-visible") &&
            width > 0 &&
            box.left - extent >= clip.left &&
            box.right + extent <= clip.right
          );
        }),
      ).toBe(true);
      await explanation.press("Enter");
      await expect(editor).toBeFocused();
      expect(await editor.evaluate((input) => [input.selectionStart, input.selectionEnd])).toEqual([
        0,
        rules.length,
      ]);
    }
  }
});

test("long unknown rules keep diagnostics within the viewport", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Write your rules" });
  await editor.fill("unsupported".repeat(500));
  await expect(page.locator("#diagnostic")).toContainText("Unsupported rule");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Go to error", exact: true }).click();
  await expect(editor).toBeFocused();
});
