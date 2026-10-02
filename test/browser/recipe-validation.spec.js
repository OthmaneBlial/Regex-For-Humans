import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const scenarios = JSON.parse(
  readFileSync(new URL("../fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("malformed workshop recipes keep manual editing usable and valid reloads recover", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const editor = page.locator("#rules-input");
  const output = page.locator("#regex-output");
  const buttons = page.locator("#example-list button");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copiedPattern = text;
        },
      },
    });
  });
  const last = scenarios.at(-1);
  const invalid = [
    null,
    {},
    [],
    [null],
    [...scenarios, null],
    [...scenarios, scenarios[0]],
    ...[
      { id: " " },
      { title: null },
      { title: " " },
      { note: null },
      { rules: null },
      { rules: "unsupported recipe rule" },
      { matchMode: "unknown" },
      { positive: null },
      { positive: [null] },
      { negative: null },
      { negative: [false] },
      { positive: Array(101).fill("a") },
      { negative: ["a".repeat(2049)] },
    ].map((patch) => [...scenarios.slice(0, -1), { ...last, ...patch }]),
  ];
  for (const payload of invalid) {
    await page.route("**/product-scenarios.json*", (route) => route.fulfill({ json: payload }));
    await page.goto("/");
    await expect(page.locator("#example-list")).toContainText("Example recipes could not load");
    await expect(buttons).toHaveCount(0);
    await expect(page.locator("#recipe-count")).toHaveText("");
    await expect(editor).toHaveValue("");
    await editor.fill('start\n"Manual"\nend');
    await expect(output).toHaveText("/^Manual$/u");
    await expect(page.locator("#copy-button")).toBeEnabled();
    await page.locator("#copy-button").click();
    expect(await page.evaluate(() => window.copiedPattern)).toBe("/^Manual$/u");
    await page.locator("#add-example").click();
    await page.locator("#test-list textarea").first().fill("Manual");
    await expect(page.locator("#test-list .test-result").first()).toHaveText(
      '✓ Matched "Manual" at 0',
    );
    await page.locator("#test-list textarea").first().fill("Other");
    await expect(page.locator("#test-list .test-result").first()).toHaveText("! No match");
    await page.unroute("**/product-scenarios.json*");
  }
  await page.reload();
  await expect(buttons).toHaveCount(scenarios.length);
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  await expect(editor).toHaveValue(scenarios[0].rules);
  expect(errors).toEqual([]);
});

test("late malformed recipes preserve edits and valid normalized boundary data loads", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let release;
  await page.route("**/product-scenarios.json*", async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.fulfill({ json: [null] });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => typeof release).toBe("function");
  const editor = page.locator("#rules-input");
  await editor.fill('start\n"Manual"\nend');
  await page.locator("#ignore-case").check();
  await page.locator("#dot-all").check();
  await page.locator("#match-mode").selectOption("search");
  await page.locator("#add-example").click();
  const input = page.locator("#test-list textarea").first();
  await input.fill("manual");
  await expect(page.locator("#test-list .test-result").first()).toHaveText(
    '✓ Matched "manual" at 0',
  );
  release();
  await expect(page.locator("#example-list")).toContainText("Example recipes could not load");
  await expect(editor).toHaveValue('start\n"Manual"\nend');
  await expect(page.locator("#regex-output")).toHaveText("/^Manual$/isu");
  await expect(page.locator("#ignore-case")).toBeChecked();
  await expect(page.locator("#dot-all")).toBeChecked();
  await expect(page.locator("#match-mode")).toHaveValue("search");
  await expect(input).toHaveValue("manual");
  await editor.fill('start\n"Changed"\nend');
  await input.fill("changed");
  await expect(page.locator("#test-list .test-result").first()).toHaveText(
    '✓ Matched "changed" at 0',
  );
  await page.unroute("**/product-scenarios.json*");
  const boundary = {
    ...scenarios[0],
    id: "normalized-boundary",
    note: "",
    rules: "any text",
    matchMode: "search",
    positive: ["", ...Array(99).fill(`${"a".repeat(2047)}\r\n`)],
    negative: [],
  };
  await page.route("**/product-scenarios.json*", (route) => route.fulfill({ json: [boundary] }));
  await page.goto("/");
  await expect(page.locator("#example-list button")).toHaveCount(1);
  await expect(page.locator("#recipe-note")).toBeHidden();
  await expect(page.locator("#test-list textarea")).toHaveCount(100);
  await expect(page.locator("#test-list textarea").first()).toHaveValue("");
  await expect(page.locator("#test-list textarea").nth(1)).toHaveValue(`${"a".repeat(2047)}\n`);
  await expect(page.locator("#test-summary")).toHaveText("100 of 100 examples behave as expected");
  await expect(page.locator("#add-example")).toBeDisabled();
  await page.unroute("**/product-scenarios.json*");
  await page.reload();
  await expect(page.locator("#example-list button")).toHaveCount(scenarios.length);
  await page.locator("#example-list button").first().click();
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  expect(errors).toEqual([]);
});
