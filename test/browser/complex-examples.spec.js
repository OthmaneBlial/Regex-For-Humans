import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { compile, regexToRules, toRegExp } from "../../index.js";
import { quoteText } from "../../src/display.js";

const guide = readFileSync(new URL("../../docs/COMPLEX-EXAMPLES.md", import.meta.url), "utf8");
const examples = [
  ...guide.matchAll(/<a id="([a-z-]+)"><\/a>\n([\s\S]*?)(?=\n<a id=|\n## Captures)/gu),
];

for (const [id, cases] of [
  ["artifact-manifest", 9],
  ["access-log", 8],
  ["structured-event", 9],
]) {
  test(`loading ${id} starts the rules, explanation and regex at the beginning`, async ({
    page,
  }) => {
    await page.goto(`/?example=${id}`);
    const editor = page.locator("#rules-input");
    const trace = page.locator("#trace-list");
    const pattern = page.locator(".pattern-box");
    await expect(page.locator("#test-summary")).toHaveText(
      `${cases} of ${cases} examples behave as expected`,
    );
    for (const action of ["recipe", "reverse"]) {
      await editor.evaluate((field) => {
        field.setSelectionRange(field.value.length, field.value.length);
        field.scrollTop = field.scrollHeight;
      });
      expect(await editor.evaluate((field) => field.scrollTop)).toBeGreaterThan(0);
      await trace.evaluate((list) => {
        list.scrollTop = list.scrollHeight;
      });
      expect(await trace.evaluate((list) => list.scrollTop)).toBeGreaterThan(0);
      await pattern.evaluate((box) => {
        box.scrollLeft = box.scrollWidth;
      });
      expect(await pattern.evaluate((box) => box.scrollLeft)).toBeGreaterThan(0);
      if (action === "recipe") {
        const recipe = page.locator(`[data-scenario="${id}"]`);
        await recipe.press("Enter");
        await expect(recipe).toBeFocused();
      } else {
        await page.locator("#reverse-translator summary").click();
        await page
          .locator("#reverse-regex")
          .fill(await page.locator("#regex-output").textContent());
        await page.locator("#reverse-regex").press("Control+Enter");
        await expect(editor).toBeFocused();
      }
      expect(
        await editor.evaluate((field) => [
          field.selectionStart,
          field.selectionEnd,
          field.scrollTop,
        ]),
      ).toEqual([0, 0, 0]);
      await expect.poll(() => trace.evaluate((list) => list.scrollTop)).toBe(0);
      await expect.poll(() => pattern.evaluate((box) => box.scrollLeft)).toBe(0);
      await expect(trace.locator(".trace-text").first()).toHaveText("1:1 start");
      await expect(page.locator('#test-list .test-row[data-result="pass"]')).toHaveCount(cases);
    }
  });
}

test("editing and failed translation retain regex and explanation scroll positions", async ({
  page,
}) => {
  await page.goto("/?example=access-log");
  const editor = page.locator("#rules-input");
  const trace = page.locator("#trace-list");
  const pattern = page.locator(".pattern-box");
  await expect(trace.locator("button")).toHaveCount(43);
  await trace.evaluate((list) => {
    list.scrollTop = list.scrollHeight / 2;
  });
  const previous = await trace.evaluate((list) => list.scrollTop);
  expect(previous).toBeGreaterThan(0);
  await pattern.evaluate((box) => {
    box.scrollLeft = box.scrollWidth / 2;
  });
  const previousPattern = await pattern.evaluate((box) => box.scrollLeft);
  expect(previousPattern).toBeGreaterThan(0);
  await editor.fill(`${await editor.inputValue()}\n`);
  expect(await trace.evaluate((list) => list.scrollTop)).toBe(previous);
  expect(await pattern.evaluate((box) => box.scrollLeft)).toBe(previousPattern);
  for (const option of ["#ignore-case", "#dot-all"]) {
    await page.locator(option).check();
    expect(await trace.evaluate((list) => list.scrollTop)).toBe(previous);
    expect(await pattern.evaluate((box) => box.scrollLeft)).toBe(previousPattern);
  }
  const rules = await editor.inputValue();
  const output = await page.locator("#regex-output").textContent();
  await page.locator("#reverse-translator summary").click();
  await page.locator("#reverse-regex").fill("/^(Hello)$/u");
  await page.locator("#reverse-regex").press("Control+Enter");
  await expect(page.locator("#reverse-feedback")).toContainText(
    "Capturing groups cannot be translated",
  );
  await expect(editor).toHaveValue(rules);
  await expect(page.locator("#regex-output")).toHaveText(output);
  expect(await trace.evaluate((list) => list.scrollTop)).toBe(previous);
  expect(await pattern.evaluate((box) => box.scrollLeft)).toBe(previousPattern);
});

for (const [, id, section] of examples) {
  test(`complex guide works in the workshop: ${id}`, async ({ page }) => {
    const rules = /### Rules\n\n```text\n([\s\S]*?)\n```/u.exec(section)[1];
    const cases = [...section.matchAll(/^\| (✅ Match|❌ No match) \| `([^`]+)` \|/gmu)].map(
      ([, outcome, json]) => [outcome === "✅ Match", JSON.parse(json)],
    );
    const compiled = compile(rules);
    const reverse = regexToRules(toRegExp(compiled));
    const rebuilt = compile(reverse.rules, { flags: reverse.flags });
    const preloaded = id !== "multiline-order";
    await page.goto(preloaded ? `/?example=${id}` : "/");
    await expect(page.locator("#test-list textarea")).toHaveCount(preloaded ? cases.length : 4);
    if (preloaded) {
      await expect(page.locator("#rules-input")).toHaveValue(rules);
      await expect(page.locator("#test-summary")).toHaveText(
        `${cases.length} of ${cases.length} examples behave as expected`,
      );
    }
    const editor = page.locator("#rules-input");
    const sample = page.locator("#test-list textarea").first();
    const feedback = page.locator("#test-list .test-result").first();
    await editor.fill(rules);
    await expect(page.locator("#regex-output")).toHaveText(`/${compiled.source}/${compiled.flags}`);
    await expect(page.locator("#trace-list .trace-fragment")).toHaveText(
      compiled.segments.map(({ source }) => source),
    );
    await expect(page.locator("#copy-button")).toBeEnabled();

    for (const translated of [false, true]) {
      if (translated) {
        await page.locator("#reverse-translator summary").click();
        await page.locator("#reverse-regex").fill(`/${compiled.source}/${compiled.flags}`);
        await page.locator("#reverse-regex").press("Control+Enter");
        await expect(editor).toHaveValue(reverse.rules);
        await expect(editor).toBeFocused();
        await expect(page.locator("#regex-output")).toHaveText(
          `/${rebuilt.source}/${rebuilt.flags}`,
        );
      }
      for (const [expected, value] of cases) {
        await sample.fill(value);
        const normalized = value.replace(/\r\n?/gu, "\n");
        await expect(sample).toHaveValue(normalized);
        // Browser textareas normalize CRLF; the guide's Node checks preserve it.
        const matches = value === normalized ? expected : toRegExp(compiled).test(normalized);
        await expect(feedback).toHaveText(
          matches ? `✓ Matched ${quoteText(normalized)} at 0` : "! No match",
        );
      }
    }
  });
}
