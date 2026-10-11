import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";
import { fixtureLimit, fixtureStorageKey } from "../../web/fixtures.js";
import { translate } from "../../web/i18n.js";

const rules =
  'capture "letter" {\n  "A"\n}\ncapture "empty" {\n}\noptional capture "bee" {\n  "B"\n}';
const fixture = {
  format: "regex-for-humans-tests",
  version: 1,
  rules,
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
    { text: "Z", expected: false },
  ],
};

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  await expect(page.locator("#test-summary")).not.toHaveText("Checking examples…");
  await page.locator("#test-fixtures > summary").press("Enter");
}

async function importText(page, text) {
  await page
    .locator("#fixture-file")
    .setInputFiles({ name: "tests.json", mimeType: "application/json", buffer: Buffer.from(text) });
}

async function load(page, data = fixture) {
  await importText(page, JSON.stringify(data));
  await expect(page.locator("#fixture-status")).toContainText(
    `Imported ${data.cases.length} examples.`,
  );
}

async function exported(page) {
  const download = page.waitForEvent("download");
  await page.locator("#fixture-export").click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("regex-tests.json");
  return JSON.parse(await readFile(await file.path(), "utf8"));
}

test("imported expectations distinguish absent captures, empty captures and exact native replacements", async ({
  page,
}) => {
  await ready(page);
  await load(page);
  const compiled = compile(rules, { flags: fixture.flags });
  await expect(page.locator("#regex-output")).toHaveText(`/${compiled.source}/${compiled.flags}`);
  const row = page.locator(".test-row").first();
  await expect(row).toHaveAttribute("data-result", "pass");
  for (const check of ["Exact spans", "Capture values", "Replacement result"])
    await expect(row.locator(".expectation-checks")).toContainText(`✓ ${check} agrees`);
  await expect(row.locator(".replacement-result").last()).toContainText('"😀AB!\\r\\nA!"');
  const input = row.locator(".expectation-input");
  const wrong = structuredClone(fixture.cases[0].expect);
  wrong.captures[1][2] = "";
  await input.fill(JSON.stringify(wrong));
  await expect(row).toHaveAttribute("data-result", "fail");
  await expect(row.locator(".expectation-checks")).toContainText("! Capture values differs");
  wrong.captures[1][2] = null;
  wrong.replacement.result += "wrong";
  await input.fill(JSON.stringify(wrong));
  await expect(row.locator(".expectation-checks")).toContainText("! Replacement result differs");
  await input.fill(JSON.stringify(fixture.cases[0].expect));
  await expect(row).toHaveAttribute("data-result", "pass");
});

test("exports, manual storage and row rerenders preserve imported CRLF until actual text editing", async ({
  page,
}) => {
  await ready(page);
  await load(page);
  const url = page.url();
  await expect(page.locator("#test-list textarea").first()).toHaveValue("😀AB\nA");
  await expect(page.locator(".test-row").first()).toContainText(
    "Imported line endings are preserved",
  );
  await page.locator("#add-example").click();
  await page.locator(".remove-example").last().click();
  expect(await exported(page)).toEqual(fixture);
  expect(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)).toBeNull();
  await page.locator("#fixture-save").click();
  expect(
    JSON.parse(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)),
  ).toEqual(fixture);
  await page.locator("#rules-input").fill('start\n"changed"\nend');
  await page.reload();
  await expect(page.locator("#fixture-status")).toHaveText(
    "No fixture loaded. Import limit: 4 MiB.",
  );
  await expect(page.locator(".test-row")).not.toHaveCount(2);
  expect(
    JSON.parse(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)),
  ).toEqual(fixture);
  await page.locator("#test-fixtures > summary").press("Enter");
  await page.locator("#fixture-restore").click();
  await expect(page.locator("#fixture-status")).toHaveText("Restored 2 saved examples.");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  expect(await exported(page)).toEqual(fixture);
  expect(page.url()).toBe(url);
  const example = page.locator("#test-list textarea").first();
  await example.fill("changed");
  await example.fill("😀AB\nA");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "fail");
  expect((await exported(page)).cases[0].text).toBe("😀AB\nA");
});

test("invalid expectation drafts survive rerenders and cannot replace the last saved regression fixture", async ({
  page,
}) => {
  await ready(page);
  await load(page);
  await page.locator("#fixture-save").click();
  const saved = await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey);
  const input = page.locator(".expectation-input").first();
  await input.fill('{"spans":[[1,0]]}');
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#test-summary")).toHaveText(
    "Fix the expectation JSON to run the examples.",
  );
  await page.locator("#add-example").click();
  await page.locator(".remove-example").last().click();
  await expect(input).toHaveValue('{"spans":[[1,0]]}');
  await page.locator("#fixture-save").click();
  await expect(page.locator("#fixture-status")).toContainText("Fix the expectation JSON");
  expect(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)).toBe(saved);
  await input.fill(" ".repeat(8193));
  await expect(input).toHaveValue(" ".repeat(8193));
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.fill("");
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  await input.fill("{");
  await expect(page.locator("#test-summary")).toHaveText(
    "Fix the expectation JSON to run the examples.",
  );
  await page.locator(".example-button").first().click();
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  await expect(page.locator(".expectation-input").first()).toHaveValue("");
  await expect(page.locator(".expectation-input[aria-invalid=true]")).toHaveCount(0);
  await expect(page.locator("#test-summary")).toHaveText("4 of 4 examples behave as expected");
  expect(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)).toBe(saved);
});

test("malformed or oversized fixture files leave all current data intact and invalid rules remain editable", async ({
  page,
}) => {
  await ready(page);
  await load(page);
  for (const text of [
    "{",
    JSON.stringify({ ...fixture, version: 2 }),
    JSON.stringify({
      ...fixture,
      cases: [{ text: "A", expected: true, expect: { captures: [[1]] } }],
    }),
    " ".repeat(fixtureLimit + 1),
  ]) {
    await importText(page, text);
    await expect(page.locator("#fixture-status")).toHaveAttribute("data-state", "error");
    await expect(page.locator("#rules-input")).toHaveValue(rules);
    expect(await exported(page)).toEqual(fixture);
  }
  await load(page, { ...fixture, rules: "invalid editable rule" });
  await expect(page.locator("#rules-input")).toHaveValue("invalid editable rule");
  await expect(page.locator("#rules-input")).toHaveAttribute("aria-invalid", "true");
  expect((await exported(page)).rules).toBe("invalid editable rule");
  await page.locator("#rules-input").fill(rules);
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
});

test("storage refusal and corrupt stored fixtures keep matching and the current workspace usable", async ({
  page,
}) => {
  await ready(page);
  await load(page);
  await page.evaluate((key) => localStorage.setItem(key, "{"), fixtureStorageKey);
  await page.locator("#fixture-restore").click();
  await expect(page.locator("#fixture-status")).toHaveAttribute("data-state", "error");
  expect(await exported(page)).toEqual(fixture);
  await page.evaluate((key) => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (name) {
      if (name === key) throw new DOMException("Denied", "SecurityError");
      return get.call(this, name);
    };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException("Quota exceeded", "QuotaExceededError");
      return set.call(this, name, value);
    };
  }, fixtureStorageKey);
  for (const id of ["fixture-save", "fixture-restore"]) {
    await page.locator(`#${id}`).click();
    await expect(page.locator("#fixture-status")).toHaveAttribute("data-state", "error");
    await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
    expect(await exported(page)).toEqual(fixture);
  }
});

test("a pending native file read cannot overwrite newer edits or a newer fixture", async ({
  page,
}) => {
  await ready(page);
  await load(page);
  await page.evaluate(() => {
    const read = File.prototype.text;
    File.prototype.text = async function () {
      const text = await read.call(this);
      window.fixtureReadPending = true;
      await new Promise((resolve) => {
        window.releaseFixtureRead = resolve;
      });
      return text;
    };
  });
  await importText(page, JSON.stringify({ ...fixture, rules: 'start\n"obsolete"\nend' }));
  await expect.poll(() => page.evaluate(() => window.fixtureReadPending)).toBe(true);
  await page.locator("#rules-input").fill('start\n"newer"\nend');
  await page.evaluate(() => window.releaseFixtureRead());
  await expect(page.locator("#fixture-status")).toContainText(
    "Import cancelled because the workshop changed.",
  );
  await expect(page.locator("#rules-input")).toHaveValue('start\n"newer"\nend');
  await page.locator("#fixture-save").click();
  await page.evaluate(() => {
    window.fixtureReadPending = false;
  });
  await importText(page, JSON.stringify({ ...fixture, rules: 'start\n"obsolete"\nend' }));
  await expect.poll(() => page.evaluate(() => window.fixtureReadPending)).toBe(true);
  await page.locator("#fixture-restore").click();
  await page.evaluate(() => window.releaseFixtureRead());
  await expect(page.locator("#rules-input")).toHaveValue('start\n"newer"\nend');
});

test("fixture controls and dynamic expectations localize without changing data and remain accessible at 320 pixels", async ({
  page,
}, testInfo) => {
  await ready(page);
  await load(page);
  for (const language of ["zh-CN", "es", "fr", "en"]) {
    await page.locator("#interface-language").selectOption(language);
    await expect(page.locator("#fixture-export")).toHaveText(translate(language, "Export tests"));
    await expect(page.locator(".expectation-input").first()).toHaveAccessibleName(
      translate(language, "Expected details for example {index}", { index: 1 }),
    );
    await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
    await expect(page.locator(".expectation-input").first()).toHaveValue(
      JSON.stringify(fixture.cases[0].expect),
    );
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.locator("#interface-language").selectOption("fr");
  for (const theme of ["light", "dark"]) {
    await page.locator("#interface-theme").selectOption(theme);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBe(0);
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(report.violations).toEqual([]);
    if (testInfo.project.name === "desktop")
      await page
        .locator(".examples-panel")
        .screenshot({ path: testInfo.outputPath(`fixtures-fr-320-${theme}.png`) });
  }
});
