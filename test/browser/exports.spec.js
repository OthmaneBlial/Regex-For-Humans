import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compile, exportRegex } from "../../index.js";

async function openExports(page, rules) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  const editor = page.getByRole("textbox", { name: "Write your rules", exact: true });
  await editor.fill(rules);
  await expect(page.locator("#export-code")).toHaveText("");
  await page.locator("#language-export > summary").press("Enter");
  await expect(page.getByRole("button", { name: "Download code", exact: true })).toBeEnabled();
  return editor;
}

test("all target formats show their generated code, capture mapping and requirements; downloads retain exact data", async ({
  page,
}) => {
  const rules = 'start\ncapture "اسم" {\n3 digits\n}\n"😀"\nend';
  await openExports(page, rules);
  for (const target of [
    "javascript",
    "typescript",
    "python",
    "rust",
    "go",
    "java",
    "csharp",
    "php",
    "ruby",
  ]) {
    await page.getByLabel("Target language", { exact: true }).selectOption(target);
    const result = exportRegex(rules, { target });
    await expect(page.locator("#export-code")).toHaveText(result.code);
    await expect(page.locator("#export-status")).toContainText(result.engine);
    await expect(page.locator("#export-requirements li")).toHaveText(result.requirements);
    if (target === "php") {
      await expect(page.locator("#export-target option:checked")).toHaveText("PHP / PCRE2");
      await expect(page.locator("#export-requirements")).toContainText("PHP 8.5.11 / PCRE2 10.44");
    }
    await expect(page.locator("#export-captures")).toContainText(
      `#1 "اسم" → ${target === "javascript" || target === "typescript" ? "اسم" : "g1"}`,
    );
  }
  await page.getByLabel("Target language", { exact: true }).selectOption("python");
  const result = exportRegex(rules, { target: "python" });
  const codeRequest = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download code", exact: true }).press("Enter");
  const code = await codeRequest;
  expect(code.suggestedFilename()).toBe("regex_export.py");
  expect(await readFile(await code.path(), "utf8")).toBe(`${result.code}\n`);
  const dataRequest = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download export JSON", exact: true }).click();
  const data = await dataRequest;
  expect(data.suggestedFilename()).toBe("regex-export-python.json");
  expect(JSON.parse(await readFile(await data.path(), "utf8"))).toEqual(result);
  await expect(page.locator("#regex-output")).toHaveText(`/${compile(rules).source}/u`);
});

test("target errors locate the unsupported rule and edits invalidate stale code without blocking JavaScript tests", async ({
  page,
}) => {
  const rules = 'capture "value" {\n"a"\n}\nsame as capture "value"';
  const editor = await openExports(page, rules);
  await page.getByLabel("Target language", { exact: true }).selectOption("go");
  await expect(page.locator("#export-status")).toContainText("EXPORT_BACKREFERENCE");
  await expect(page.locator("#export-code")).toHaveText("");
  await expect(page.locator("#export-requirements li")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download code", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Go to export error", exact: true }).press("Enter");
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((field) => field.selectionStart)).toBeGreaterThan(
    rules.indexOf("same as capture"),
  );
  await expect(page.getByRole("button", { name: "Copy regex ↗", exact: true })).toBeEnabled();
  await page.getByLabel("Example 1 string", { exact: true }).fill("aa");
  await expect(page.locator(".test-row").first()).toContainText('Matched "aa" at 0');
  await page.getByLabel("Target language", { exact: true }).selectOption("python");
  await expect(page.locator("#export-code")).toHaveText(
    exportRegex(rules, { target: "python" }).code,
  );
  await page.getByRole("checkbox", { name: "Ignore case i", exact: true }).check();
  await expect(page.locator("#export-status")).toContainText("UNSUPPORTED_EXPORT_FLAGS");
  await expect(page.locator("#export-code")).toHaveText("");
  await page.getByLabel("Target language", { exact: true }).selectOption("typescript");
  await expect(page.locator("#export-code")).toContainText("const regex: RegExp");
  await page.getByRole("checkbox", { name: "Ignore case i", exact: true }).uncheck();
  await page.getByLabel("Target language", { exact: true }).selectOption("python");
  await page.locator("#group-editor > summary").press("Enter");
  await page.getByLabel("Capture name", { exact: true }).fill("renamed");
  await page.getByRole("button", { name: "Apply group edit", exact: true }).press("Enter");
  await expect(page.locator("#export-captures")).toContainText('#1 "renamed" → g1');
  await editor.fill("not a rule");
  await expect(page.locator("#export-code")).toHaveText("");
  await expect(page.locator("#export-status")).toHaveText(
    "Compile valid rules to export source code.",
  );
  await expect(page.locator("#export-captures li")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Download export JSON", exact: true }),
  ).toBeDisabled();
  await page.locator("#example-list button").first().click();
  await expect(page.getByRole("button", { name: "Download code", exact: true })).toBeEnabled();
  await expect(page.locator("#export-code")).toHaveText(
    exportRegex(await editor.inputValue(), { target: "python" }).code,
  );
});

test("export code remains inert, keyboard scrollable and accessible at 320 pixels", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const value = '<img src=x onerror="alert(1)"> العربية اردو\u202e😀';
  await openExports(page, JSON.stringify(value));
  await expect(page.locator("#export-code")).toContainText("<img");
  await expect(page.locator("#language-export img, #language-export script")).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const region = page.getByRole("region", { name: "Generated source code", exact: true });
  expect(await region.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  await region.evaluate((node) =>
    node.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" }),
  );
  await region.focus();
  await expect(region).toBeFocused();
  await region.evaluate((node) => node.scrollTo({ left: 0, behavior: "instant" }));
  await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBe(0);
  await region.press("ArrowRight");
  await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await region.press("ArrowLeft");
  await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBe(0);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(errors).toEqual([]);
  await page
    .locator("#language-export")
    .screenshot({ path: testInfo.outputPath("export-panel.png") });
});
