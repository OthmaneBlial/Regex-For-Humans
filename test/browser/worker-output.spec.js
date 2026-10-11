import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";
import { translate } from "../../web/i18n.js";

const outputError = "Example output is too large. Use fewer examples, captures or matches.";

test("native workers reject aggregate output atomically and recover at unchanged deadlines", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const source = compile(Array(100).fill("capture {\n}").join("\n")).source;
  const outcome = await page.evaluate(async (source) => {
    const { TestRunner } = await import("/web/test-runner.js");
    let starts = 0;
    const runner = new TestRunner(() => {
      starts += 1;
      return new Worker("/web/match-worker.js", { type: "module" });
    });
    const samples = (count, text) =>
      Array.from({ length: count }, (_, id) => ({ id, text, expected: true }));
    const normal = { source: "a", flags: "u", mode: "full", cases: samples(1, "a") };
    const failures = [];
    const recovered = [];
    try {
      await runner.run(normal);
      const requests = [
        {
          ...normal,
          source,
          mode: "search",
          captureCount: 100,
          cases: samples(100, "A".repeat(99)),
        },
        {
          ...normal,
          source: "",
          mode: "search",
          captureCount: 0,
          cases: samples(11, "A".repeat(99)),
        },
        { ...normal, source: ".+", flags: "su", cases: samples(100, "\u2028".repeat(2048)) },
        {
          ...normal,
          flags: "gu",
          mode: "search",
          cases: samples(100, "a".repeat(100) + "x".repeat(1948)).map((sample) => ({
            ...sample,
            expect: { replacement: { template: "b".repeat(128), result: "wrong" } },
          })),
        },
      ];
      for (const request of requests) {
        try {
          await runner.run(request);
          failures.push(null);
        } catch (error) {
          failures.push({ code: error.code, message: error.message });
        }
        recovered.push((await runner.run(normal))[0].pass);
      }
      const captures = await runner.run({
        ...normal,
        source,
        mode: "search",
        captureCount: 100,
        cases: samples(2, "A".repeat(99)),
      });
      const matches = await runner.run({
        ...normal,
        source: "",
        mode: "search",
        captureCount: 0,
        cases: samples(10, "A".repeat(99)),
      });
      return {
        failures,
        recovered,
        starts,
        captures: captures
          .flatMap((result) => result.matches)
          .reduce((count, match) => count + match.captures.length, 0),
        matches: matches.flatMap((result) => result.matches).length,
      };
    } finally {
      runner.cancel();
    }
  }, source);
  expect(outcome).toEqual({
    failures: Array(4).fill({ code: "WORKER_ERROR", message: outputError }),
    recovered: Array(4).fill(true),
    starts: 5,
    captures: 20000,
    matches: 1000,
  });
  expect(errors).toEqual([]);
  await expect(page.locator("#rules-input")).toBeEnabled();
});

test("workshop translates output limits and keeps every example editable for recovery", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  const rows = page.locator("#test-list .test-row");
  for (const row of await rows.all()) await row.locator("textarea").fill("A".repeat(99));
  await page.locator("#match-mode").selectOption("search");
  await page.locator("#rules-input").fill(Array(100).fill("capture {\n}").join("\n"));
  for (const language of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(language);
    await expect(page.locator("#test-summary")).toHaveText(translate(language, outputError));
    for (const row of await rows.all()) {
      await expect(row).toHaveAttribute("data-result", "pending");
      await expect(row.locator("textarea")).toHaveValue("A".repeat(99));
    }
  }
  await page.locator("#interface-language").selectOption("en");
  await page.locator("#rules-input").fill('"A"');
  await expect(rows.first()).toHaveAttribute("data-result", "pass");
  await expect(page.locator("#test-summary")).not.toHaveText(outputError);
});
