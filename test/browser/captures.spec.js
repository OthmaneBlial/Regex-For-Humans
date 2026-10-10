import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("date captures expose native values and keyboard links to their rules", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?example=date-shape");
  await expect(page.locator("#test-summary")).toContainText("6 of 6 examples behave as expected");
  const row = page.locator("#test-list .test-row").first();
  await row.locator("textarea").fill("2026-10-10");
  const explorer = row.locator(".capture-explorer");
  await expect(explorer.locator(":scope > summary")).toHaveText("1 match · 3 captures per match");
  await explorer.locator(":scope > summary").press("Enter");
  await explorer.locator(".capture-match summary").press("Enter");
  await expect(explorer.locator(".capture-value")).toHaveText([
    '"2026-10-10"',
    '"2026"',
    '"10"',
    '"10"',
  ]);
  await expect(explorer.locator(".capture-span")).toHaveText(["0–10", "0–4", "5–7", "8–10"]);
  const regex = await page.locator("#regex-output").textContent();
  expect(regex).toBe(String.raw`/^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u`);
  await explorer
    .getByRole("button", { name: "Go to capture #2 month rule", exact: true })
    .press("Enter");
  await expect(page.locator("#rules-input")).toBeFocused();
  expect(
    await page
      .locator("#rules-input")
      .evaluate((field) => field.value.slice(field.selectionStart, field.selectionEnd)),
  ).toBe('capture "month" {');
  await page.locator("#add-example").click();
  await expect(row.locator(".capture-explorer")).toHaveAttribute("open", "");
  await row.locator(".capture-match summary").press("Enter");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("absent, empty, repeated and escaped capture values stay distinct", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  const row = page.locator("#test-list .test-row").first();
  const rules = page.locator("#rules-input");
  await rules.fill(
    'start\noptional capture "absent" {\n"x"\n}\ncapture "empty" {\noptional "y"\n}\nend',
  );
  await row.locator("textarea").fill("");
  await row.locator(".capture-explorer > summary").press("Enter");
  await row.locator(".capture-match summary").press("Enter");
  await expect(row.locator(".capture-value")).toHaveText([
    '"" (empty)',
    "Not captured",
    '"" (empty)',
  ]);
  await expect(row.locator(".capture-span")).toHaveText(["0–0", "—", "0–0"]);
  await rules.fill('start\none or more capture "outer" {\ncapture "inner" {\ndigit\n}\n}\nend');
  await row.locator("textarea").fill("123");
  await row.locator(".capture-match summary").press("Enter");
  await expect(row.locator(".capture-value")).toHaveText(['"123"', '"3"', '"3"']);
  await expect(row.locator(".capture-span")).toHaveText(["0–3", "2–3", "2–3"]);
  const untrusted = '<img src=x onerror="window.injected=1">';
  await rules.fill(`capture {\n${JSON.stringify(untrusted)}\n}`);
  await row.locator("textarea").fill(untrusted);
  await row.locator(".capture-match summary").press("Enter");
  await expect(row.locator(".capture-value").last()).toHaveText(JSON.stringify(untrusted));
  await expect(row.locator("img")).toHaveCount(0);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await row.locator("textarea").fill("no match");
  await expect(row.locator(".capture-explorer")).toBeHidden();
  await expect(row.locator(".capture-table")).toHaveCount(0);
});

test("search lists nonoverlapping Unicode and empty matches with an honest display limit", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  await page.locator("#match-mode").selectOption("search");
  const row = page.locator("#test-list .test-row").first();
  const rules = page.locator("#rules-input");
  await rules.fill('capture "letter" {\n"a"\n}');
  await row.locator("textarea").fill("😀a a");
  await expect(row.locator(".capture-explorer > summary")).toHaveText(
    "2 matches · 1 capture per match",
  );
  await row.locator(".capture-explorer > summary").press("Enter");
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "a" at 2',
    'Match 2: "a" at 4',
  ]);
  await row.locator(".capture-match summary").nth(1).press("Enter");
  await expect(row.locator(".capture-span")).toHaveText(["4–5", "4–5"]);
  await rules.fill('capture "empty" {\n}');
  await row.locator("textarea").fill("😀a");
  await expect(row.locator(".capture-explorer > summary")).toHaveText(
    "3 matches · 1 capture per match",
  );
  await expect(row.locator(".capture-match > summary")).toHaveText([
    'Match 1: "" at 0',
    'Match 2: "" at 2',
    'Match 3: "" at 3',
  ]);
  await row.locator("textarea").fill("a".repeat(120));
  await expect(row.locator(".capture-match")).toHaveCount(100);
  await expect(row.locator(".capture-explorer")).toContainText(
    "The 100-match display limit was reached",
  );
  await expect(row.locator(".capture-table")).toHaveCount(0);
  await row.locator(".capture-match summary").last().press("Enter");
  await expect(row.locator(".capture-span")).toHaveText(["99–99", "99–99"]);
  expect(await page.locator("#regex-output").textContent()).toBe("/(?<empty>)/u");
});

test("worker exploration agrees with native matchAll across captures, Unicode and every flag combination", async ({
  page,
}) => {
  await page.goto("/");
  const comparisons = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    const runner = new TestRunner(() => new Worker("/web/match-worker.js", { type: "module" }));
    const fixtures = [
      {
        source: String.raw`(?<outer>(?<year>\d{4})-(?<month>\d{2}))`,
        text: "😀2026-10 2000-01",
        count: 3,
      },
      { source: "(a)?(b*)", text: "😀bb aBB", count: 2 },
      { source: String.raw`(?<digit>\d)+`, text: "😀12 3", count: 1 },
      { source: "(?<empty>)", text: "😀a", count: 1 },
      { source: String.raw`(a)\1`, text: "aa AA aa", count: 1 },
      { source: "(?<x>.)", text: "😀\na", count: 1 },
      { source: "^([A-Za-z]+)$", text: "a\nB", count: 1 },
      { source: "(?<x>x)", text: "ABC", count: 1 },
    ];
    const comparisons = [];
    try {
      for (let bits = 0; bits < 8; bits += 1) {
        const flags = `${bits & 1 ? "i" : ""}${bits & 2 ? "m" : ""}${bits & 4 ? "s" : ""}u`;
        for (const fixture of fixtures) {
          const native = Array.from(
            fixture.text.matchAll(new RegExp(fixture.source, `dg${flags}`)),
          );
          const [result] = await runner.run({
            source: fixture.source,
            flags,
            mode: "search",
            captureCount: fixture.count,
            cases: [{ id: 1, text: fixture.text, expected: native.length > 0 }],
          });
          const expected = native.map((match) => ({
            value: match[0],
            range: { start: match.index, end: match.index + match[0].length },
            captures: match.slice(1).map((value, index) => ({
              value: value ?? null,
              range: match.indices[index + 1]
                ? { start: match.indices[index + 1][0], end: match.indices[index + 1][1] }
                : null,
            })),
          }));
          comparisons.push({
            flags,
            source: fixture.source,
            matches: JSON.stringify(result.matches) === JSON.stringify(expected),
            actual: result.actual === native.length > 0,
            pass: result.pass,
            indicesAvailable: result.indicesAvailable,
          });
        }
      }
      const [complete] = await runner.run({
        source: "(?<piece>a|aa)",
        flags: "u",
        mode: "full",
        captureCount: 1,
        cases: [{ id: 1, text: "aa", expected: true }],
      });
      comparisons.push({
        fullBacktracking:
          complete.actual &&
          complete.matches[0].value === "aa" &&
          complete.matches[0].captures[0].value === "aa",
      });
      return comparisons;
    } finally {
      runner.cancel();
    }
  });
  expect(comparisons).toHaveLength(65);
  for (const comparison of comparisons) {
    if ("fullBacktracking" in comparison) expect(comparison.fullBacktracking).toBe(true);
    else
      expect(comparison).toMatchObject({
        matches: true,
        actual: true,
        pass: true,
        indicesAvailable: true,
      });
  }
});

test("engines without capture indices return values and reject invalid capture metadata", async ({
  page,
}) => {
  await page.context().route("**/capture-worker-without-indices.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "import '/web/match-worker.js'; const NativeRegExp = RegExp; globalThis.RegExp = class extends NativeRegExp { constructor(source, flags) { if (flags?.includes('d')) throw new SyntaxError('No indices'); super(source, flags); } };",
    }),
  );
  await page.goto("/");
  const outcome = await page.evaluate(async () => {
    const { TestRunner } = await import("/web/test-runner.js");
    const runner = new TestRunner(
      () => new Worker("/capture-worker-without-indices.js", { type: "module" }),
    );
    const normal = {
      source: "(?<x>a)(b)?()",
      flags: "u",
      mode: "full",
      captureCount: 3,
      cases: [{ id: 1, text: "a", expected: true }],
    };
    try {
      const [result] = await runner.run(normal);
      const errors = [];
      for (const captureCount of [-1, 101, 1.5, "3", null, NaN]) {
        try {
          await runner.run({ ...normal, captureCount });
        } catch (error) {
          errors.push(error.message);
        }
      }
      try {
        await runner.run({ ...normal, captureCount: 2 });
      } catch (error) {
        errors.push(error.message);
      }
      const [recovered] = await runner.run(normal);
      return { result, errors, recovered: recovered.pass };
    } finally {
      runner.cancel();
    }
  });
  expect(outcome.result).toMatchObject({
    actual: true,
    pass: true,
    indicesAvailable: false,
    limitReached: false,
    matches: [
      {
        value: "a",
        range: { start: 0, end: 1 },
        captures: [
          { value: "a", range: null },
          { value: null, range: null },
          { value: "", range: null },
        ],
      },
    ],
  });
  expect(outcome.errors).toEqual(Array(7).fill("Invalid capture metadata."));
  expect(outcome.recovered).toBe(true);
});
