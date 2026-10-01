import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";

test("worker preserves every canonical flag combination and recovers from invalid flags", async ({
  page,
}) => {
  await page.goto("/");
  const requests = [];
  for (const flags of ["u", "iu", "mu", "su", "imu", "isu", "msu", "imsu"]) {
    const i = flags.includes("i");
    const m = flags.includes("m");
    const s = flags.includes("s");
    const rules = [m ? "line start" : "start", '"A"', "any character", m ? "line end" : "end"];
    const result = compile(rules.join("\n"), { flags: `${i ? "i" : ""}${s ? "s" : ""}` });
    expect(result).toMatchObject({ source: "^A.$", flags });
    for (const mode of ["full", "search"]) {
      const lineSearch = mode === "search" && m;
      requests.push({
        source: result.source,
        flags,
        mode,
        cases: [
          ["Ax", true],
          ["ax", i],
          ["A\n", s],
          ["a\n", i && s],
          ["prefix\nAx\nsuffix", lineSearch],
          ["prefix\nax\nsuffix", lineSearch && i],
          ["prefix\nA\n\nsuffix", lineSearch && s],
          ["prefix\na\n\nsuffix", lineSearch && i && s],
          ["", false],
          ["A😀", true],
        ].map(([text, expected], id) => ({ id, text, expected })),
      });
    }
  }
  const outcome = await page.evaluate(async (requests) => {
    const { TestRunner } = await import("/web/test-runner.js");
    let starts = 0;
    const runner = new TestRunner(() => {
      starts += 1;
      return new Worker("/web/match-worker.js", { type: "module" });
    });
    const results = [];
    const errors = [];
    const recovered = [];
    try {
      for (const request of requests) results.push(await runner.run(request));
      const validStarts = starts;
      const invalid = [
        ["u"],
        null,
        0,
        {},
        "",
        "U",
        "uu",
        "iuu",
        "gui",
        "miu",
        "siu",
        "du",
        "gu",
        "vu",
        "yu",
        " u",
        "u ",
        "i".repeat(1_048_576),
        ...["\n", "\r", "\u2028", "\u2029"].flatMap((ending) => [`${ending}u`, `u${ending}`]),
      ];
      for (const flags of invalid) {
        try {
          await runner.run({ ...requests[0], flags });
          errors.push(null);
        } catch (error) {
          errors.push({ code: error.code, message: error.message });
        }
        recovered.push(await runner.run(requests[0]));
      }
      return { results, validStarts, errors, recovered, starts };
    } finally {
      runner.cancel();
    }
  }, requests);
  const states = (results) => results.map(({ id, actual, pass }) => ({ id, actual, pass }));
  expect(outcome.results).toHaveLength(requests.length);
  for (const [index, results] of outcome.results.entries()) {
    expect(states(results)).toEqual(
      requests[index].cases.map(({ id, expected }) => ({ id, actual: expected, pass: true })),
    );
  }
  expect(outcome.validStarts).toBe(1);
  expect(outcome.errors).toEqual(
    Array(26).fill({ code: "WORKER_ERROR", message: "Invalid regex test request." }),
  );
  expect(outcome.recovered).toHaveLength(26);
  for (const results of outcome.recovered) {
    expect(states(results)).toEqual(
      requests[0].cases.map(({ id, expected }) => ({ id, actual: expected, pass: true })),
    );
  }
  expect(outcome.starts).toBe(27);
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
});
