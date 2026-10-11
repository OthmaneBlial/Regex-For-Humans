import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { translate } from "../../web/i18n.js";

test("explanation levels preserve selection, source, tests and worker state", async ({ page }) => {
  await page.goto("/");
  const rules = page.locator("#rules-input");
  await rules.fill('start\ncapture "word" {\n"A"\n}\nsame as capture "word"\nend');
  await page.locator("#test-list textarea").first().fill("AA");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  await page.locator('#trace-list [data-line="2"]').click();
  const before = await page.evaluate(() => ({
    rules: document.querySelector("#rules-input").value,
    selection: [
      document.querySelector("#rules-input").selectionStart,
      document.querySelector("#rules-input").selectionEnd,
    ],
    output: document.querySelector("#regex-output").textContent,
    summary: document.querySelector("#test-summary").textContent,
    examples: [...document.querySelectorAll("#test-list textarea")].map((input) => input.value),
    flags: document.querySelector("#flags-summary").textContent,
  }));
  await page.evaluate(() => {
    window.levelRequests = 0;
    const send = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (...args) {
      window.levelRequests++;
      return send.apply(this, args);
    };
  });
  const canonical = await page.locator(".trace-meaning").allTextContents();
  const picker = page.locator("#explanation-mode");
  await picker.focus();
  for (const mode of ["beginner", "expert", "intermediate"]) {
    await picker.selectOption(mode);
    await expect(picker).toBeFocused();
    expect(await page.locator(".trace-meaning").allTextContents()).toEqual(canonical);
    if (mode !== "intermediate")
      await expect(page.locator(".trace-item").first()).toHaveAttribute(
        "aria-describedby",
        /^explanation-note-/u,
      );
    if (mode === "beginner")
      await expect(page.locator("#trace-list")).toContainText("A capture remembers");
    if (mode === "expert") {
      await expect(page.locator("#trace-list")).toContainText('Capture #1; name: "word".');
      await expect(page.locator("#trace-list")).toContainText("Resolved reference: capture #1.");
      await expect(page.locator("#explanation-help")).toContainText("Flags: u.");
    }
    if (mode === "intermediate") await expect(page.locator(".trace-note")).toHaveCount(0);
    await expect(rules).toHaveValue(before.rules);
    await expect(page.locator("#regex-output")).toHaveText(before.output);
    await expect(page.locator("#regex-output mark")).toHaveCount(1);
    await expect(page.locator("#test-summary")).toHaveText(before.summary);
    await expect(page.locator("#flags-summary")).toHaveText(before.flags);
    expect(
      await page
        .locator("#test-list textarea")
        .evaluateAll((fields) => fields.map((field) => field.value)),
    ).toEqual(before.examples);
    expect(await rules.evaluate((field) => [field.selectionStart, field.selectionEnd])).toEqual(
      before.selection,
    );
  }
  expect(await page.evaluate(() => window.levelRequests)).toBe(0);
});

test("explanation level survives delayed recipes, reverse translation and invalid rules", async ({
  page,
}) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/product-scenarios.json*", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#reverse-button")).toBeEnabled();
  await page.locator("#explanation-mode").selectOption("expert");
  release();
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  await expect(page.locator("#explanation-mode")).toHaveValue("expert");
  await expect(page.locator(".trace-note")).not.toHaveCount(0);
  await page.locator("#reverse-translator summary").click();
  await page.locator("#reverse-regex").fill("/(?<word>A)/iu");
  await page.locator("#reverse-button").click();
  await expect(page.locator("#trace-list")).toContainText('Capture #1; name: "word".');
  await expect(page.locator("#explanation-help")).toContainText("Flags: iu.");
  await page.locator("#rules-input").fill("invalid rule");
  await expect(page.locator("#rules-input")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator(".trace-note")).toHaveCount(0);
  await expect(page.locator("#explanation-help")).toContainText("Flags: —.");
});

for (const mode of ["beginner", "intermediate", "expert"]) {
  for (const locale of ["en", "zh-CN", "es", "fr"])
    test(`${locale} ${mode} explanations remain accessible in both themes at 320px`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.setViewportSize({ width: 320, height: 800 });
      await page.locator("#rules-input").fill('capture "word" {\n"<img>{line}"\n}');
      await expect(page.locator("#regex-output")).toContainText("word");
      const key = "Source line {line}, column {column}; regex UTF-16 range [{start}, {end}).";
      await page.locator("#interface-language").selectOption(locale);
      await expect(page.locator('label[for="explanation-mode"]')).toHaveText(
        translate(locale, "Explanation level"),
      );
      await page.locator("#explanation-mode").selectOption(mode);
      for (const theme of ["light", "dark"]) {
        await page.locator("#interface-theme").selectOption(theme);
        await expect(page.locator("#trace-list img")).toHaveCount(0);
        if (mode === "expert")
          await expect(page.locator(".trace-note").first()).toHaveText(
            translate(locale, key, { line: 1, column: 1, start: 0, end: 8 }),
          );
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      }
    });
}
