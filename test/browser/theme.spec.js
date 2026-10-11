import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const storageKey = "regex-for-humans:workshop-theme";

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  await expect(page.locator("#test-summary")).not.toHaveText("Checking examples…");
}

test("system theme follows media changes; explicit preferences survive reloads and ignore system changes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await ready(page);
  const picker = page.getByRole("combobox", { name: "Theme", exact: true });
  await expect(picker).toHaveValue("system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  for (const theme of ["dark", "light"]) {
    await picker.selectOption(theme);
    await page.emulateMedia({ colorScheme: theme === "dark" ? "light" : "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(theme);
    await page.reload();
    await expect(picker).toHaveValue(theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  }
  await picker.selectOption("system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe("system");
});

test("invalid saved themes fall back to the system without becoming selectors or markup", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(({ key }) => localStorage.setItem(key, "__proto__"), {
    key: storageKey,
  });
  await ready(page);
  await expect(page.locator("#interface-theme")).toHaveValue("system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("#interface-theme").selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("denied storage keeps theme selection and matching usable", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    for (const method of ["getItem", "setItem"])
      Object.defineProperty(Storage.prototype, method, {
        value() {
          throw new DOMException("Denied", "SecurityError");
        },
      });
  });
  await ready(page);
  await page.locator("#interface-theme").selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("#rules-input").fill('start "ABC"\nend');
  await page.locator("#test-list textarea").first().fill("ABC");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  expect(errors).toEqual([]);
});

for (const theme of ["light", "dark"])
  for (const width of [1280, 320])
    test(`${theme} theme keeps captures, controls, errors and diagrams accessible at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await ready(page);
      await page.locator("#interface-theme").selectOption(theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(
        await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme),
      ).toBe(theme);
      await page
        .locator("#rules-input")
        .fill('start\ncapture "value" {\n"ABC"\n}\noptional "-"\nend');
      await page.locator("#indices-flag").check();
      await page.locator("#test-list textarea").first().fill("ABC-");
      await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
      await page.locator("#test-list textarea").nth(1).fill("ABC-");
      await expect(page.locator(".test-row").nth(1)).toHaveAttribute("data-result", "fail");
      for (const id of [
        "group-editor",
        "language-export",
        "structure-diagram",
        "pattern-review",
        "reverse-translator",
      ])
        await page.locator(`#${id} > summary`).press("Enter");
      await page.locator(".capture-explorer").first().locator(":scope > summary").press("Enter");
      await page.locator(".capture-match").first().locator(":scope > summary").press("Enter");
      await expect(page.locator(".capture-value").first()).toHaveText('"ABC-"');
      await page.locator("#group-name").fill("bad name");
      await page.locator("#group-apply").click();
      await expect(page.locator("#group-feedback")).toHaveAttribute("data-state", "error");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.evaluate(() => scrollTo({ top: 0, left: 0, behavior: "instant" }));
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath(`theme-${theme}-${width}.png`),
        fullPage: true,
      });
      await page.locator("#rules-input").fill("not a rule");
      await expect(page.locator("#diagnostic")).toContainText("Line 1");
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    });
