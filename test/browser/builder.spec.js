import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { languages, translate } from "../../web/i18n.js";

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  await page.locator("#rule-builder summary").click();
}

test("all six keyboard actions keep examples and flags while inserting editable native rules", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await page.locator("#indices-flag").check();
  await page.locator("#ignore-case").check();
  await page.locator("#unicode-mode").selectOption("v");
  const editor = page.locator("#rules-input");
  const examples = page.locator("#test-list textarea");
  const cases = [
    ["capture", "^(\\d)7$", "17"],
    ["optional", "^(?:A){0,1}7$", "7"],
    ["alternative", "^(?:A|B)7$", "A7"],
    ["repetition", "^\\d{1,3}7$", "1237"],
    ["class", "^[AB]7$", "B7"],
    ["assertion", "^(?=\\d)7$", "7"],
  ];
  for (const [kind, expected, input] of cases) {
    await editor.fill('start\n"7"\nend');
    await editor.evaluate((el) => el.setSelectionRange(6, 9));
    const previous = await examples.evaluateAll((fields) => fields.map((el) => el.value));
    await page.locator("#builder-kind").selectOption(kind);
    await page.locator("#builder-insert").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#regex-output")).toHaveText(`/${expected}/div`);
    await expect(page.locator("#builder-feedback")).toHaveAttribute("data-state", "success");
    await expect(editor).toBeFocused();
    expect(await examples.evaluateAll((fields) => fields.map((el) => el.value))).toEqual(previous);
    await expect(page.locator("#indices-flag")).toBeChecked();
    await expect(page.locator("#ignore-case")).toBeChecked();
    await expect(page.locator("#unicode-mode")).toHaveValue("v");
    expect(await page.locator("#rules-syntax .syntax-source").textContent()).toBe(
      await editor.inputValue(),
    );
    await examples.first().fill(input);
    await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  }
  const reference = 'start\ncapture "word" {\n"A"\n}\nsame as capture 1\nend';
  await editor.fill(reference);
  await editor.evaluate((el) =>
    el.setSelectionRange(el.value.indexOf("capture"), el.value.indexOf("capture")),
  );
  await page.locator("#builder-kind").selectOption("capture");
  await page.locator("#builder-insert").click();
  await expect(editor).toHaveValue(/same as capture 2/u);
  await expect(page.locator("#group-type")).toHaveValue("numbered");
  await examples.first().fill("7AA");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  const explorer = page.locator(".test-row").first().locator(".capture-explorer");
  await explorer.locator(":scope > summary").click();
  await explorer.locator(".capture-match summary").click();
  await expect(explorer.locator(".capture-value")).toHaveText(['"7AA"', '"7"', '"A"']);
  await page.locator("#example-list button").first().click();
  await expect(page.locator("#builder-feedback")).toHaveText("");
  expect(errors).toEqual([]);
});

test("rejected insertions retain source, selection and examples; manual repairs stay editable", async ({
  page,
}) => {
  await ready(page);
  const editor = page.locator("#rules-input");
  const bad = 'start\n<img onerror="window.injected=1">\nend';
  for (const source of [bad, "x".repeat(16385), `${"# comment\n".repeat(199)}digit`]) {
    await editor.fill(source);
    await editor.evaluate((el) => el.setSelectionRange(1, 5));
    const values = await page
      .locator("#test-list textarea")
      .evaluateAll((fields) => fields.map((el) => el.value));
    await page.locator("#builder-kind").selectOption("capture");
    await page.locator("#builder-insert").click();
    await expect(page.locator("#builder-feedback")).toHaveAttribute("data-state", "error");
    await expect(editor).toHaveValue(source);
    expect(await editor.evaluate((el) => [el.selectionStart, el.selectionEnd])).toEqual([1, 5]);
    expect(
      await page
        .locator("#test-list textarea")
        .evaluateAll((fields) => fields.map((el) => el.value)),
    ).toEqual(values);
    expect(await page.locator("#builder-feedback img, #builder-feedback script").count()).toBe(0);
  }
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await editor.fill("");
  await expect(page.locator("#builder-feedback")).toHaveText("");
  await page.locator("#builder-kind").selectOption("class");
  await page.locator("#builder-insert").click();
  await expect(page.locator("#regex-output")).toHaveText("/[AB]/u");
  await editor.fill('one of: "C", "D"');
  await expect(page.locator("#regex-output")).toHaveText("/[CD]/u");
  await page.locator("#test-list textarea").first().fill("C");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
});

test("construction controls and feedback stay accessible in all locales and palettes at 320px", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await ready(page);
  const editor = page.locator("#rules-input");
  for (const language of languages) {
    await page.locator("#interface-language").selectOption(language);
    await expect(page.locator("#rule-builder summary")).toHaveText(
      translate(language, "Build a rule"),
    );
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      await editor.fill('start\n"7"\nend');
      await editor.evaluate((el) => el.setSelectionRange(6, 6));
      await page.locator("#builder-kind").selectOption("optional");
      await page.locator("#builder-insert").click();
      await expect(page.locator("#builder-feedback")).toHaveText(
        translate(language, "Rule inserted on line {line}. Edit the template in the rule field.", {
          line: 2,
        }),
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(audit.violations).toEqual([]);
      if (language === "fr") {
        await page.locator("#rule-builder").scrollIntoViewIfNeeded();
        await page.screenshot({
          path: testInfo.outputPath(`builder-${theme}-320.png`),
          fullPage: true,
        });
      }
    }
  }
});

test("choosing a builder during recipe loading keeps defaults; an actual insertion survives delayed loading", async ({
  page,
}) => {
  for (const insert of [false, true]) {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await page.route("**/product-scenarios.json*", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("#builder-insert")).toBeEnabled();
    await page.locator("#rule-builder summary").click();
    await page.locator("#builder-kind").selectOption("class");
    if (insert) await page.locator("#builder-insert").click();
    release();
    await expect(page.locator("#example-list button").first()).toBeEnabled();
    await expect(page.locator("#regex-output")).toHaveText(insert ? "/[AB]/u" : "/^ABC\\d{3}$/u");
    await expect(page.locator("#builder-kind")).toHaveValue("class");
    await page.unroute("**/product-scenarios.json*");
  }
});
