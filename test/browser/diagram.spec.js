import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compile, toSVG } from "../../index.js";

const rules =
  'start\ncapture "word" {\n  either {\n    "ab"\n    "cd"\n  }\n}\noptional "/"\nsame as capture "word"\nend';

async function openDiagram(page, source = rules) {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Write your rules", exact: true });
  await editor.fill(source);
  await expect(page.locator("#diagram-viewport svg")).toHaveCount(0);
  await page.locator("#structure-diagram > summary").press("Enter");
  await expect(
    page.getByRole("group", { name: "Interactive regex structure", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("#diagram-viewport path.rail")
      .first()
      .evaluate((node) => getComputedStyle(node).stroke),
  ).not.toBe("none");
  expect(
    await page
      .locator("#diagram-viewport rect.tile, #diagram-viewport rect.scope")
      .first()
      .evaluate((node) => getComputedStyle(node).fill),
  ).not.toBe("rgb(0, 0, 0)");
  return editor;
}

test("diagram hover connects four views without changing source selection; keyboard returns to rules", async ({
  page,
}) => {
  const editor = await openDiagram(page);
  const pattern = compile(rules);
  await page.getByLabel("Diagram view", { exact: true }).selectOption("fit");
  await editor.press("ControlOrMeta+A");
  await editor.press("ArrowLeft");
  const cursor = await editor.evaluate((field) => ({
    start: field.selectionStart,
    end: field.selectionEnd,
    top: field.scrollTop,
  }));
  const reference = page.locator('g.diagram-rule[data-line="9"]');
  await reference.hover();
  await expect(page.locator("#regex-output mark")).toHaveText(
    pattern.segments.find((segment) => segment.line === 9).source,
  );
  await expect(page.locator('.trace-item.is-related[data-line="9"]')).toHaveCount(1);
  await expect(editor).toHaveAttribute("data-highlight", "9");
  await expect(page.locator("#rule-focus")).toContainText('Line 9: same as capture "word"');
  expect(
    await editor.evaluate((field) => ({
      start: field.selectionStart,
      end: field.selectionEnd,
      top: field.scrollTop,
    })),
  ).toEqual(cursor);
  await page.locator('g.diagram-rule[data-line="2"]').press("Space");
  expect(
    await editor.evaluate((field) => field.value.slice(field.selectionStart, field.selectionEnd)),
  ).toBe('capture "word" {');
  await expect(page.locator("#regex-output mark")).toHaveText("(?<word>(?:ab|cd))");
  await expect(page.locator("#regex-output")).toHaveText(`/${pattern.source}/u`);
  await expect(page.locator("#diagram-message")).toContainText("not a runtime backtracking trace");
  await editor.press("ControlOrMeta+A");
  await editor.press("ArrowLeft");
  await editor.press("ArrowDown");
  await editor.press("ArrowDown");
  await expect(editor).toHaveAttribute("data-highlight", "3");
  await expect(page.locator("g.diagram-rule.is-related")).toHaveAttribute("data-line", "3");
  await page
    .getByRole("button", {
      name: 'Rule on line 5: Literal text "cd". Select source line.',
      exact: true,
    })
    .hover();
  await expect(page.locator("#regex-output mark")).toHaveText("cd");
  await expect(page.locator("g.diagram-rule.is-related")).toHaveAttribute("data-line", "5");
});

test("selecting generated regex connects the structure while preserving the selected text", async ({
  page,
}) => {
  const editor = await openDiagram(page, 'start\n"abc"\n3 digits\nend');
  await editor.press("ControlOrMeta+A");
  await editor.press("ArrowLeft");
  await page.locator("#regex-output").evaluate((output) => {
    const node = [...output.childNodes].find((child) => child.textContent.includes("\\d"));
    const text = node.textContent;
    const start = text.indexOf("\\d");
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, start + 5);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    output.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  await expect(page.locator("#regex-output mark")).toHaveText("\\d{3}");
  expect(await page.evaluate(() => window.getSelection().toString())).toBe("\\d{3}");
  await expect(editor).toHaveAttribute("data-highlight", "3");
  await expect(page.locator("g.diagram-rule.is-related")).toHaveAttribute("data-line", "3");
  expect(await editor.evaluate((field) => field.selectionStart)).toBe(0);
});

test("SVG export is standalone and current; flag edits and invalid rules clear old diagrams", async ({
  page,
}) => {
  const editor = await openDiagram(page);
  await page.getByLabel("Ignore case i", { exact: true }).check();
  await expect(page.locator("#diagram-viewport svg")).toHaveAttribute("data-flags", "iu");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export SVG ↗", exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("regex-structure.svg");
  const svg = readFileSync(await download.path(), "utf8");
  assert.equal(svg, toSVG(rules, { flags: "iu" }));
  expect(svg).not.toContain('role="button"');
  expect(svg).not.toContain("is-related");
  const document = await page.evaluate((value) => {
    const parsed = new DOMParser().parseFromString(value, "image/svg+xml");
    return {
      errors: parsed.querySelectorAll("parsererror").length,
      scripts: parsed.querySelectorAll("script,foreignObject,[href]").length,
      name: parsed.documentElement.localName,
    };
  }, svg);
  expect(document).toEqual({ errors: 0, scripts: 0, name: "svg" });
  await editor.fill("not a rule");
  await expect(page.locator("#diagram-viewport svg")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Export SVG ↗", exact: true })).toBeDisabled();
  await expect(editor).not.toHaveAttribute("data-highlight", /./);
  await editor.fill("digit");
  await expect(page.locator("#diagram-viewport svg")).toHaveAttribute("data-flags", "iu");
  await expect(page.locator("g.diagram-rule")).toHaveCount(1);
});

test("inert Unicode/XML labels, nested sets and responsive diagram controls remain accessible", async ({
  page,
}) => {
  const literal = '<script onclick="alert(1)">&😀 العربية اردو\u202e\ud800\ufffe\uffff';
  const editor = await openDiagram(page, JSON.stringify(literal));
  const diagram = page.locator("#diagram-viewport");
  expect(await diagram.locator("script,foreignObject,[href]").count()).toBe(0);
  await expect(diagram.locator("g.diagram-rule > title")).toContainText("<script");
  await expect(diagram.locator("g.diagram-rule > title")).toContainText("\\u202e");
  await expect(diagram.locator("g.diagram-rule > title")).toContainText("\\ufffe\\uffff");
  await page.getByLabel("Diagram view", { exact: true }).selectOption("fit");
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(diagram).toHaveAttribute("data-scale", "fit");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.getByLabel("Unicode mode").selectOption("v");
  await editor.fill(
    'character set intersection {\n  character set union {\n    one of strings: "a", "ab", ""\n  }\n  character set union {\n    range "a" to "z"\n  }\n}',
  );
  await expect(page.locator("g.diagram-rule")).toHaveCount(1);
  await page.setViewportSize({ width: 1280, height: 800 });
  await editor.press("ControlOrMeta+A");
  await editor.press("ArrowLeft");
  await editor.press("ArrowDown");
  await editor.press("ArrowDown");
  await expect(page.locator("#regex-output mark")).toHaveText("\\q{a|ab|}");
  await expect(page.locator("g.diagram-rule.is-related")).toHaveAttribute("data-line", "1");
});

test("long native-wrapped source lines get a row highlight without moving their caret", async ({
  page,
}) => {
  const source = `${JSON.stringify("😀<&".repeat(55))}\ndigit`;
  const editor = await openDiagram(page, source);
  await page.setViewportSize({ width: 320, height: 800 });
  await editor.press("ControlOrMeta+A");
  await editor.press("ArrowLeft");
  const original = await editor.evaluate((field) => ({
    start: field.selectionStart,
    end: field.selectionEnd,
    top: field.scrollTop,
  }));
  await page.locator('g.diagram-rule[data-line="1"]').hover();
  const highlight = await editor.evaluate((field) => {
    const style = getComputedStyle(field);
    return {
      top: Number.parseFloat(style.getPropertyValue("--rule-highlight-top")),
      bottom: Number.parseFloat(style.getPropertyValue("--rule-highlight-bottom")),
      row: Number.parseFloat(style.lineHeight),
      background: getComputedStyle(document.getElementById("rules-syntax")).backgroundImage,
    };
  });
  expect(highlight.bottom - highlight.top).toBeGreaterThan(highlight.row * 5);
  expect(highlight.background).toContain("linear-gradient");
  expect(
    await editor.evaluate((field) => ({
      start: field.selectionStart,
      end: field.selectionEnd,
      top: field.scrollTop,
    })),
  ).toEqual(original);
  await page.locator('g.diagram-rule[data-line="2"]').press("Enter");
  expect(
    await editor.evaluate((field) => field.value.slice(field.selectionStart, field.selectionEnd)),
  ).toBe("digit");
});
