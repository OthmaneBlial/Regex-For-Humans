import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const scenarios = JSON.parse(
  readFileSync(new URL("../fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

for (const scenario of scenarios) {
  test(`${scenario.id} loads the same pattern and preserves every sample`, async ({ page }) => {
    const browserErrors = [];
    const remoteRequests = [];
    const failedResponses = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("request", (request) => {
      if (!request.url().startsWith("http://127.0.0.1:4174/")) remoteRequests.push(request.url());
    });
    page.on("response", (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await page.goto(`/?example=${scenario.id}`);
    await expect(page.locator("#regex-output")).toHaveText(`/${scenario.source}/${scenario.flags}`);
    await expect(page.locator("#test-summary")).toHaveText(
      `${scenario.positive.length + scenario.negative.length} of ${scenario.positive.length + scenario.negative.length} examples behave as expected`,
    );
    await expect(page.locator("#match-mode")).toHaveValue(scenario.matchMode);
    const visibleSamples = await page
      .locator("#test-list textarea")
      .evaluateAll((elements) => elements.map((element) => element.value));
    expect(visibleSamples).toEqual([...scenario.positive, ...scenario.negative]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(browserErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
    expect(remoteRequests).toEqual([]);
  });
}

test("editing rules reports errors without stale output and recovers", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "One instruction per line" });
  await editor.fill("digit character\n  unsupported words");
  await expect(page.locator("#diagnostic")).toContainText("Line 2, column 3");
  await expect(page.locator("#regex-output")).toHaveText("No pattern generated");
  await expect(page.getByRole("button", { name: /Copy regex/ })).toBeDisabled();
  await editor.fill(
    'at the beginning of the input\na "ABC"\ndigit character 3 times\nend of the input',
  );
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  await expect(page.locator("#diagnostic")).toBeHidden();
  await page.locator("#ignore-case").check();
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/iu");
  await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
});

test("positive and negative examples expose a changed outcome", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  await page.getByRole("textbox", { name: "Example string" }).first().fill("ABC12");
  await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
  await page.getByRole("button", { name: "+ Add example" }).click();
  await page.getByRole("textbox", { name: "Example string" }).last().fill("ABC999");
  await expect(page.locator("#test-summary")).toHaveText("4 of 5 examples behave as expected");
  await page.getByRole("button", { name: "Remove example" }).last().click();
  await expect(page.locator("#test-summary")).toHaveText("3 of 4 examples behave as expected");
});

test("line-mode sample keeps its newline and changes under full-match mode", async ({ page }) => {
  await page.goto("/?example=line-rule");
  await expect(page.locator("#test-list textarea").nth(1)).toHaveValue("note\nitem 123");
  await page.locator("#match-mode").selectOption("full");
  await expect(page.locator("#test-summary")).toHaveText("2 of 3 examples behave as expected");
  await page.locator("#match-mode").selectOption("search");
  await expect(page.locator("#test-summary")).toHaveText("3 of 3 examples behave as expected");
});

test("Unicode literals and dot-all behavior are visible in example results", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "One instruction per line" });
  const firstSample = page.getByRole("textbox", { name: "Example string" }).first();
  await editor.fill("any character");
  await page.locator("#match-mode").selectOption("search");
  await firstSample.fill("\n");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "fail");
  await page.locator("#dot-all").check();
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  await editor.fill('a "😀"');
  await firstSample.fill("😀");
  await expect(page.locator("#regex-output")).toHaveText("/😀/su");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
});

test("copy button places the real generated regex on the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4174",
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Copy regex/ }).click();
  await expect(page.locator("#copy-button")).toContainText("Copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe("/^ABC\\d{3}$/u");
});

test("syntax link opens the local rendered guide", async ({ page, context }) => {
  await page.goto("/");
  const [guide] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: /Read the syntax/ }).click(),
  ]);
  await guide.waitForLoadState();
  await expect(guide).toHaveURL(/\/web\/language\.html$/u);
  await expect(guide.getByRole("heading", { name: "Match one thing" })).toBeVisible();
  await guide.close();
});
