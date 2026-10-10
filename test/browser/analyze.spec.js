import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { analyze, compile, regexToRules } from "../../index.js";

async function openReview(page, expression = /(a+)+$/u) {
  const translated = regexToRules(expression);
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "Write your rules", exact: true });
  await page.getByLabel("Unicode mode").selectOption(translated.flags.includes("v") ? "v" : "u");
  await editor.fill(translated.rules);
  await expect(page.locator("#review-findings button")).toHaveCount(0);
  await expect(page.locator("#review-count")).toHaveText("Open to review");
  await page.locator("#pattern-review > summary").press("Enter");
  await expect(page.locator("#review-status")).not.toContainText("Open this panel");
  return { editor, rules: translated.rules };
}

test("review is on demand and notes connect source, regex, explanation and diagram without moving the caret", async ({
  page,
}) => {
  const { editor, rules } = await openReview(page);
  const result = compile(rules);
  const finding = analyze(rules).warnings.find((item) => item.code === "NESTED_REPETITION");
  const note = page.locator('#review-findings [data-code="NESTED_REPETITION"]');
  await expect(note).toHaveCount(1);
  await expect(note).toContainText("REVIEW");
  await expect(page.locator("#review-status")).toContainText("not measured runtime results");
  await expect(page.locator("#review-limitations")).toContainText("not a proof of safety");
  await page.locator("#structure-diagram > summary").press("Enter");
  await page.getByLabel("Diagram view", { exact: true }).selectOption("fit");
  await editor.press("ControlOrMeta+A");
  await editor.press("ArrowLeft");
  const before = await editor.evaluate((field) => ({
    start: field.selectionStart,
    end: field.selectionEnd,
    top: field.scrollTop,
  }));
  await note.hover();
  await expect(page.locator("#regex-output mark")).toHaveText(
    result.source.slice(finding.sourceStart, finding.sourceEnd),
  );
  await expect(page.locator("#trace-list .is-related")).not.toHaveCount(0);
  await expect(page.locator("g.diagram-rule.is-related")).toHaveAttribute(
    "data-line",
    String(finding.line),
  );
  expect(
    await editor.evaluate((field) => ({
      start: field.selectionStart,
      end: field.selectionEnd,
      top: field.scrollTop,
    })),
  ).toEqual(before);
  await note.press("Enter");
  await expect(editor).toBeFocused();
  expect(
    await editor.evaluate((field) => field.value.slice(field.selectionStart, field.selectionEnd)),
  ).toBe(rules.split("\n")[finding.line - 1]);
  await expect(page.locator("#regex-output")).toHaveText(`/${result.source}/${result.flags}`);
  await expect(page.getByRole("button", { name: "Copy regex ↗", exact: true })).toBeEnabled();
});

test("flag, invalid-input, group and recipe edits refresh review notes while worker matching remains available", async ({
  page,
}) => {
  const { editor } = await openReview(page, /a+A+$/u);
  await expect(page.locator("#review-count")).toHaveText("No findings");
  await expect(page.locator("#review-status")).toContainText("does not prove performance safety");
  await page.getByRole("checkbox", { name: "Ignore case i", exact: true }).check();
  await expect(page.locator('[data-code="ADJACENT_REPETITIONS"]')).toHaveCount(1);
  await editor.fill("not a rule");
  await expect(page.locator("#review-count")).toHaveText("Needs valid rules");
  await expect(page.locator("#review-findings button")).toHaveCount(0);
  await expect(page.locator("#review-limitations li")).toHaveCount(0);
  await editor.fill('start\ncapture "value" {\none or more digit\n}\nend');
  await expect(page.locator("#review-count")).toHaveText("No findings");
  await page.getByLabel("Example 1 string", { exact: true }).fill("7");
  await expect(page.locator(".test-row").first()).toContainText('Matched "7" at 0');
  await page.locator("#group-editor > summary").press("Enter");
  await page.getByLabel("Capture name", { exact: true }).fill("renamed");
  await page.getByRole("button", { name: "Apply group edit", exact: true }).press("Enter");
  await expect(editor).toHaveValue('start\ncapture "renamed" {\none or more digit\n}\nend');
  await expect(page.locator("#review-count")).toHaveText("No findings");
  await page.locator("#example-list button").first().click();
  await expect(page.locator("#review-count")).toHaveText("No findings");
  await expect(page.locator("#review-status")).toContainText("does not prove performance safety");
  await editor.fill("any text");
  await expect(page.locator('[data-code="DOT_ALL_WILDCARD"]')).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Dot matches newlines s", exact: true }).check();
  await expect(page.locator('[data-code="DOT_ALL_WILDCARD"]')).toHaveCount(1);
  await expect(page.locator("#review-findings")).toContainText("includes line breaks");
});

test("Unicode-set witnesses and unknown class subtraction never imply a safety verdict", async ({
  page,
}) => {
  const { editor } = await openReview(page, /[[a-c]&&[b-d]]+[b]+$/v);
  await expect(page.locator('[data-code="ADJACENT_REPETITIONS"]')).toHaveCount(1);
  const translated = regexToRules(/[[a]--[A]]+a+$/iv);
  await page.getByRole("checkbox", { name: "Ignore case i", exact: true }).check();
  await editor.fill(translated.rules);
  await expect(page.locator("#review-count")).toHaveText("No findings");
  await expect(page.locator("#review-limitations")).toContainText(
    "unknown, not proven disjointness",
  );
  await expect(page.locator("#review-status")).toContainText("does not prove performance safety");
  const lineRules = regexToRules(/^a$/mu).rules;
  await editor.fill(lineRules);
  await expect(page.locator('[data-code="LINE_ANCHORS"]')).toHaveCount(2);
  await expect(page.locator("#review-findings")).toContainText("beside a line break");
});

test("review renders inert source text and remains accessible at 320 pixels", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const { editor } = await openReview(page);
  const literal = '<img src=x onerror="alert(1)"> العربية اردو\u202e😀';
  await editor.fill(`one or more group {\none or more ${JSON.stringify(literal)}\n}`);
  await page.locator('#review-findings [data-code="NESTED_REPETITION"]').press("Enter");
  await expect(page.locator("#regex-output")).toContainText("<img");
  expect(
    await page
      .locator("#review-findings script, #review-findings img, #regex-output img, #rule-focus img")
      .count(),
  ).toBe(0);
  await expect(page.locator("#rule-focus")).toContainText("Line 1");
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(errors).toEqual([]);
  await page
    .locator("#pattern-review")
    .screenshot({ path: testInfo.outputPath("review-panel.png") });
});
