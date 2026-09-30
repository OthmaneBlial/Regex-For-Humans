import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const { version } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
const versionLabel = version.includes("-") ? `DEV · ${version}` : `v${version}`;

for (const state of ["ready", "error"]) {
  test(`${state} workshop has no automatically detectable WCAG A/AA violation`, async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
    if (state === "error") {
      const editor = page.getByRole("textbox", { name: "Write your rules" });
      await editor.fill("unknown rule");
      await expect(editor).toHaveAttribute("aria-invalid", "true");
      await expect(editor).toHaveAttribute("aria-describedby", "rules-help recipe-note diagnostic");
      await expect(page.locator("#diagnostic")).toBeVisible();
    }
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      })),
    ).toEqual([]);
  });
}

test("keyboard can reach the editor, options, copy and test controls", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to workshop" })).toBeFocused();
  await page.getByRole("textbox", { name: "Write your rules" }).focus();
  await expect(page.getByRole("textbox", { name: "Write your rules" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /Read the syntax/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#ignore-case")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.locator("#ignore-case")).toBeChecked();
  await page.locator("#copy-button").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#copy-button")).toContainText("Copied");
  await page.locator("#match-mode").focus();
  await expect(page.locator("#match-mode")).toBeFocused();
});

test("a diagnostic can focus its exact source position from the keyboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  const editor = page.locator("#rules-input");
  for (const [rules, marker] of [
    ['start "😀"\u2028  unexpected words', "unexpected"],
    ['start "😀"\n"bad\\q"', "\\q"],
    ['start "😀"\n"missing', null],
  ]) {
    await editor.fill(rules);
    await page.getByRole("button", { name: "Go to error", exact: true }).press("Enter");
    await expect(editor).toBeFocused();
    const position = marker === null ? rules.length : rules.indexOf(marker);
    expect(
      await editor.evaluate((input) => ({ start: input.selectionStart, end: input.selectionEnd })),
    ).toEqual({ start: position, end: position + Number(marker !== null) });
  }
  const longRules = `${"digit\n".repeat(199)}unsupported words`;
  await editor.fill(longRules);
  await editor.evaluate((input) => {
    input.scrollTop = 0;
  });
  await page.getByRole("button", { name: "Go to error", exact: true }).press("Enter");
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((input) => input.selectionStart)).toBe(
    longRules.indexOf("unsupported"),
  );
  await expect
    .poll(() =>
      editor.evaluate((input) => input.scrollHeight - input.clientHeight - input.scrollTop),
    )
    .toBeLessThanOrEqual(1);
  await editor.fill("digit");
  await expect(page.getByRole("button", { name: "Go to error", exact: true })).toHaveCount(0);
});

test("skip link focuses the workshop without resetting edited rules", async ({ page }) => {
  await page.goto("/?example=line-rule");
  const editor = page.getByRole("textbox", { name: "Write your rules" });
  await editor.fill('start "XYZ"\nend');
  await page.getByRole("link", { name: "Skip to workshop" }).press("Enter");
  await expect(page).toHaveURL(/\/\?example=line-rule#main$/u);
  await expect(page.locator("#main")).toBeFocused();
  await expect(editor).toHaveValue('start "XYZ"\nend');
  await page.keyboard.press("Tab");
  await expect(editor).toBeFocused();
});

test("example controls have distinct numbered accessible names", async ({ page }) => {
  await page.goto("/");
  const names = await page
    .locator("#test-list .test-row")
    .evaluateAll((rows) =>
      rows.map((row) => [
        row.querySelector("textarea").getAttribute("aria-label"),
        row.querySelector("select").getAttribute("aria-label"),
        row.querySelector("button").getAttribute("aria-label"),
      ]),
    );
  expect(names).toEqual(
    [1, 2, 3, 4].map((number) => [
      `Example ${number} string`,
      `Expected match result for example ${number}`,
      `Remove example ${number}`,
    ]),
  );
});

test("removing examples keeps keyboard focus in the example controls", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#test-list .test-row")).toHaveCount(4);
  let remaining = 4;
  for (const number of [2, 3, 2, 1]) {
    const remove = page.getByRole("button", { name: `Remove example ${number}`, exact: true });
    await remove.focus();
    await remove.press("Enter");
    remaining -= 1;
    await expect(page.locator("#test-list .test-row")).toHaveCount(remaining);
    const next =
      remaining === 0
        ? page.locator("#add-example")
        : page.getByRole("textbox", {
            name: `Example ${Math.min(number, remaining)} string`,
            exact: true,
          });
    await expect(next).toBeFocused();
  }
  await page.locator("#add-example").press("Enter");
  await expect(page.getByRole("textbox", { name: "Example 1 string", exact: true })).toBeFocused();
});

test("syntax guide is readable without horizontal overflow or detectable WCAG A/AA issues", async ({
  page,
}) => {
  const failedResponses = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/web/language.html");
  await expect(page.getByRole("heading", { name: /Say only/ })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(2);
  await expect(page.locator(".guide-table").first()).toContainText(
    "Longest text up to the next rule. s includes line breaks.",
  );
  await expect(page.locator(".guide-table").first()).toContainText(
    "One ASCII hexadecimal digit, in either letter case",
  );
  await expect(page.locator(".guide-table").first()).toContainText(
    "One or more hexadecimal digits; no prefix or separators",
  );
  await expect(page.getByRole("link", { name: /Back to the workshop/ }).last()).toHaveAttribute(
    "href",
    "../",
  );
  const viewport = page.viewportSize();
  for (const width of [viewport.width, 320]) {
    await page.setViewportSize({ width, height: viewport.height });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(
      await page
        .locator(".guide-table-wrap")
        .evaluateAll((tables) =>
          tables.every((element) => element.scrollWidth <= element.clientWidth),
        ),
    ).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  }
  expect(failedResponses).toEqual([]);
});

test("the tested build version is visible in the workshop and guide", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".build-label")).toBeVisible();
  await expect(page.locator(".build-label")).toHaveText(versionLabel);
  await page.goto("/web/language.html");
  await expect(page.locator(".build-label")).toBeVisible();
  await expect(page.locator(".build-label")).toHaveText(versionLabel);
});
