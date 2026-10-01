import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { compile, regexToRules, toRegExp } from "../../index.js";
import { quoteText } from "../../src/display.js";

const guide = readFileSync(new URL("../../docs/COMPLEX-EXAMPLES.md", import.meta.url), "utf8");
const examples = [
  ...guide.matchAll(/<a id="([a-z-]+)"><\/a>\n([\s\S]*?)(?=\n<a id=|\n## Captures)/gu),
];

test("loading long rules starts the editor at the first rule through either action", async ({
  page,
}) => {
  await page.goto("/?example=artifact-manifest");
  const editor = page.locator("#rules-input");
  await expect(page.locator("#test-summary")).toHaveText("9 of 9 examples behave as expected");
  for (const action of ["recipe", "reverse"]) {
    await editor.evaluate((field) => {
      field.setSelectionRange(field.value.length, field.value.length);
      field.scrollTop = field.scrollHeight;
    });
    expect(await editor.evaluate((field) => field.scrollTop)).toBeGreaterThan(0);
    if (action === "recipe") {
      const recipe = page.getByRole("button", { name: "Read a complex artifact manifest" });
      await recipe.press("Enter");
      await expect(recipe).toBeFocused();
    } else {
      await page.locator("#reverse-translator summary").click();
      await page.locator("#reverse-regex").fill(await page.locator("#regex-output").textContent());
      await page.locator("#reverse-regex").press("Control+Enter");
      await expect(editor).toBeFocused();
    }
    expect(
      await editor.evaluate((field) => [field.selectionStart, field.selectionEnd, field.scrollTop]),
    ).toEqual([0, 0, 0]);
    await expect(page.locator('#test-list .test-row[data-result="pass"]')).toHaveCount(9);
  }
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
