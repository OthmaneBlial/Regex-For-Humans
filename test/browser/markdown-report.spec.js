import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";
import { draftStorageKey, fixtureStorageKey, parseFixture } from "../../web/fixtures.js";
import { translate } from "../../web/i18n.js";

const fixture = {
  format: "regex-for-humans-tests",
  version: 1,
  rules: 'capture "letter" {\n  "A"\n}\ncapture "empty" {\n}\noptional capture "bee" {\n  "B"\n}',
  flags: "dgu",
  mode: "search",
  cases: [
    {
      text: "😀AB\r\nA",
      expected: true,
      expect: {
        spans: [
          [2, 4],
          [6, 7],
        ],
        captures: [
          ["A", "", "B"],
          ["A", "", null],
        ],
        replacement: { template: "$<letter>$2$3!", result: "😀AB!\r\nA!" },
      },
    },
    { text: "\u202e`````<img src=x onerror=alert(1)>字", expected: false },
  ],
};

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  await expect(page.locator("#test-summary")).not.toHaveText("Checking examples…");
  await page.locator("#test-fixtures > summary").press("Enter");
}

async function load(page) {
  await page.locator("#fixture-file").setInputFiles({
    name: "tests.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await expect(page.locator("#fixture-status")).toContainText("Imported 2 examples.");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
}

async function report(page, keyboard = false) {
  const downloading = page.waitForEvent("download");
  const button = page.locator("#fixture-markdown");
  if (keyboard) await button.press("Enter");
  else await button.click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("regex-report.md");
  return readFile(await download.path(), "utf8");
}

function regressionJSON(markdown) {
  const blocks = [...markdown.matchAll(/^(`{3,})json\n([\s\S]*?)\n\1(?=\n|$)/gm)];
  return blocks.at(-1)[2];
}

async function stored(page) {
  return page.evaluate(
    ({ fixture, draft }) => ({
      fixture: localStorage.getItem(fixture),
      draft: localStorage.getItem(draft),
    }),
    { fixture: fixtureStorageKey, draft: draftStorageKey },
  );
}

test("Markdown downloads preserve native expectations, imported CRLF and both saved stores without claiming results", async ({
  page,
}) => {
  await ready(page);
  await load(page);
  await page.locator("#fixture-save").click();
  await page.locator("#draft-save").check();
  await expect.poll(async () => (await stored(page)).draft).not.toBeNull();
  const before = await stored(page);
  const source = await page.locator("#rules-input").inputValue();
  const expectedDraft = await page.locator(".expectation-input").first().inputValue();
  const compiled = compile(fixture.rules, { flags: fixture.flags });
  const markdown = await report(page, true);
  expect(markdown).toContain("# Regex For Humans test report");
  expect(markdown).toContain(await page.locator(".build-label").textContent());
  expect(markdown).toContain(`/${compiled.source}/${compiled.flags}`);
  expect(markdown).toContain("Match mode: `search`");
  expect(markdown).toContain("does not run the tests or certify that they pass");
  expect(markdown).toContain("Case 2: must not match");
  expect(markdown).toContain("\\u202e");
  expect(parseFixture(regressionJSON(markdown))).toEqual(fixture);
  await expect(page.locator("#fixture-status")).toHaveText("Markdown report download started.");
  await expect(page.locator("#rules-input")).toHaveValue(source);
  await expect(page.locator(".expectation-input").first()).toHaveValue(expectedDraft);
  await expect(page.locator("#match-mode")).toHaveValue("search");
  await expect(page.locator("#global-flag")).toBeChecked();
  await expect(page.locator("#indices-flag")).toBeChecked();
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  expect(await stored(page)).toEqual(before);
  await page.locator("#rules-input").fill('start\n"new"\nend');
  const fresh = await report(page);
  const snapshot = parseFixture(regressionJSON(fresh));
  expect(snapshot.rules).toBe('start\n"new"\nend');
  expect(fresh).toContain(
    `/${compile(snapshot.rules, { flags: snapshot.flags }).source}/${snapshot.flags}`,
  );
  expect(snapshot.cases).toEqual(fixture.cases);
  await page.locator("#rules-input").fill('"A"');
  await page.locator("#match-mode").selectOption("full");
  const full = await report(page);
  expect(parseFixture(regressionJSON(full)).mode).toBe("full");
  expect(full).toContain("/A/dgu");
  expect(full).toContain("Full mode requires a match covering the entire input.");
});

test("invalid expectation drafts and invalid rules cannot export stale Markdown or overwrite saved fixtures", async ({
  page,
}) => {
  await ready(page);
  await load(page);
  await page.locator("#fixture-save").click();
  const before = await stored(page);
  const expectation = page.locator(".expectation-input").first();
  await expectation.fill("{");
  await expect(expectation).toHaveAttribute("aria-invalid", "true");
  let downloads = 0;
  page.on("download", () => {
    downloads++;
  });
  await page.locator("#fixture-markdown").click();
  await expect(page.locator("#fixture-status")).toContainText("Fix the expectation JSON");
  await expect(expectation).toHaveValue("{");
  expect(downloads).toBe(0);
  expect(await stored(page)).toEqual(before);
  await expectation.fill(JSON.stringify(fixture.cases[0].expect));
  await page.locator("#rules-input").fill("same as capture 99");
  await expect(page.locator("#fixture-markdown")).toBeDisabled();
  expect(downloads).toBe(0);
  expect(await stored(page)).toEqual(before);
  await page.locator("#rules-input").fill(fixture.rules);
  await expect(page.locator("#fixture-markdown")).toBeEnabled();
  const recovered = await report(page);
  expect(parseFixture(regressionJSON(recovered))).toEqual(fixture);
  expect(await stored(page)).toEqual(before);
});

test("Markdown controls, status and keyboard downloads translate and fit both themes at 320px", async ({
  page,
}, testInfo) => {
  await ready(page);
  await load(page);
  await page.setViewportSize({ width: 320, height: 900 });
  for (const language of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(language);
    const button = page.locator("#fixture-markdown");
    await expect(button).toHaveText(translate(language, "Export Markdown report"));
    await expect(button).toHaveAttribute("aria-describedby", "fixture-markdown-help");
    await expect(page.locator("#fixture-markdown-help")).toHaveText(
      translate(
        language,
        "Download a Markdown snapshot of the build, rules, JavaScript regex, options and intended tests. The export does not run tests.",
      ),
    );
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      const markdown = await report(page, true);
      expect(parseFixture(regressionJSON(markdown))).toEqual(fixture);
      await expect(page.locator("#fixture-status")).toHaveText(
        translate(language, "Markdown report download started."),
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (
          await new AxeBuilder({ page })
            .include("#test-fixtures")
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      if (language === "fr")
        await page
          .locator("#test-fixtures")
          .screenshot({ path: testInfo.outputPath(`markdown-${theme}-320.png`) });
    }
  }
});
