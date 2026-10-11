import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  createFixtureLink,
  draftStorageKey,
  fixtureLimit,
  fixtureStorageKey,
} from "../../web/fixtures.js";
import { translate } from "../../web/i18n.js";

const fixture = {
  format: "regex-for-humans-tests",
  version: 1,
  rules: 'capture "word" {\n"A"\n}',
  flags: "dgu",
  mode: "search",
  cases: [
    {
      text: "😀A\r\nA",
      expected: true,
      expect: {
        spans: [
          [2, 3],
          [5, 6],
        ],
        captures: [["A"], ["A"]],
      },
    },
  ],
};
const draft = {
  format: "regex-for-humans-draft",
  version: 1,
  rules: fixture.rules,
  flags: fixture.flags,
  mode: fixture.mode,
  reverseRegex: "/(?<word>A)/dgu",
  example: null,
  cases: fixture.cases.map((c) => ({
    text: c.text,
    expected: c.expected,
    expectation: JSON.stringify(c.expect),
  })),
};

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  await page.locator("#test-fixtures > summary").press("Enter");
  await page.locator("#reverse-translator > summary").press("Enter");
}
async function stored(page) {
  return page.evaluate((key) => localStorage.getItem(key), draftStorageKey);
}

test("draft saving is opt-in and survives an immediate reload with invalid editable text", async ({
  page,
}) => {
  await ready(page);
  await expect(page.locator("#draft-save")).not.toBeChecked();
  expect(await stored(page)).toBeNull();
  await page.locator("#fixture-file").setInputFiles({
    name: "tests.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await expect(page.locator("#fixture-status")).toContainText("Imported 1 examples.");
  await page.locator("#fixture-save").click();
  await page.locator("#draft-save").check();
  await page.locator("#rules-input").fill('capture "unfinished" {');
  await page.locator("#reverse-regex").fill("/(?<unfinished>");
  await page.locator(".expectation-input").fill('{"captures":');
  await page.reload();
  await expect(page.locator("#rules-input")).toHaveValue('capture "unfinished" {');
  await expect(page.locator("#reverse-regex")).toHaveValue("/(?<unfinished>");
  await expect(page.locator(".expectation-input")).toHaveValue('{"captures":');
  await expect(page.locator(".expectation-input")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#test-summary")).toContainText("Fix the expectation JSON");
  await expect(page.locator("#draft-save")).toBeChecked();
  expect(JSON.parse(await stored(page)).cases[0].text).toBe("😀A\r\nA");
  expect(
    JSON.parse(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)),
  ).toEqual(fixture);
  await page.locator("#fixture-save").click();
  await expect(page.locator("#fixture-status")).toContainText("Fix the expectation JSON");
  expect(
    JSON.parse(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)),
  ).toEqual(fixture);
  await page.locator("#draft-save").uncheck();
  expect(await stored(page)).toBeNull();
  await page.reload();
  await expect(page.locator("#draft-save")).not.toBeChecked();
  await expect(page.locator("#rules-input")).not.toHaveValue('capture "unfinished" {');
});

test("restored drafts preserve flags, native spans/captures, exact line endings and row edits", async ({
  page,
}) => {
  await page.route("**/product-scenarios.json*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
    },
    { key: draftStorageKey, value: draft },
  );
  await page.goto("/");
  await expect(page.locator(".test-row")).toHaveAttribute("data-result", "pass");
  await expect(page.locator("#match-mode")).toHaveValue("search");
  await expect(page.locator("#global-flag")).toBeChecked();
  await expect(page.locator("#indices-flag")).toBeChecked();
  await page.locator("#add-example").click();
  await page.locator(".remove-example").last().click();
  // Open fixture controls through recovery; export must retain original CRLF.
  const download = page.waitForEvent("download");
  await page.locator("#fixture-export").click();
  expect(JSON.parse(await readFile(await (await download).path(), "utf8"))).toEqual(fixture);
  await page.locator("#test-list textarea").first().fill("😀A\nA!");
  await page.reload();
  await expect(page.locator("#test-list textarea").first()).toHaveValue("😀A\nA!");
  expect(JSON.parse(await stored(page)).cases[0].text).toBe("😀A\nA!");
});

test("incoming shared snapshots and a different recipe outrank a saved draft", async ({ page }) => {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: draftStorageKey,
    value: { ...draft, example: "unrelated-old-recipe" },
  });
  await page.goto("/?example=hex-color");
  await expect(page.locator('#example-list button[data-scenario="hex-color"]')).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.locator("#rules-input")).not.toHaveValue(draft.rules);
  const incoming = {
    ...fixture,
    rules: '"incoming"',
    cases: [{ text: "incoming", expected: true }],
  };
  await page.goto(createFixtureLink(JSON.stringify(incoming), page.url()));
  await expect(page.locator("#rules-input")).toHaveValue(incoming.rules);
  await expect(page.locator(".test-row")).toHaveAttribute("data-result", "pass");
});

test("corrupt, denied and oversized draft storage leaves editing and old data intact", async ({
  page,
}) => {
  await page.addInitScript((key) => localStorage.setItem(key, "{broken"), draftStorageKey);
  await ready(page);
  await expect(page.locator("#draft-status")).toContainText("Invalid version 1 workshop draft");
  expect(await stored(page)).toBe("{broken");
  await page.locator("#draft-save").check();
  const old = await stored(page);
  await page.evaluate((limit) => {
    const input = document.querySelector("#reverse-regex");
    input.value = "a".repeat(limit);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, fixtureLimit);
  await expect(page.locator("#draft-status")).toContainText("Draft exceeds the 4 MiB limit");
  expect(await stored(page)).toBe(old);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.locator("#reverse-regex").fill("/A/u");
  await expect(page.locator("#draft-status")).toContainText("Quota exceeded");
  expect(await stored(page)).toBe(old);
  await page.locator("#rules-input").fill('"still editable"');
  await expect(page.locator("#regex-output")).toContainText("still editable");
});

test("another tab pauses draft saving without replacing current work", async ({
  page,
  context,
}) => {
  await ready(page);
  await page.locator("#draft-save").check();
  const other = await context.newPage();
  await other.goto("/");
  await expect(other.locator("#draft-save")).toBeChecked();
  await other.locator("#rules-input").fill('"other tab"');
  await expect(page.locator("#draft-status")).toContainText("Draft changed in another tab");
  await expect(page.locator("#draft-save")).not.toBeChecked();
  const old = await stored(page);
  await page.locator("#rules-input").fill('"keep my work"');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide")));
  expect(await stored(page)).toBe(old);
  await expect(page.locator("#rules-input")).toHaveValue('"keep my work"');
  await other.close();
});

test("denied storage keeps rules editable and never reports a removed draft", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    }),
  );
  await ready(page);
  await expect(page.locator("#draft-status")).toContainText("Storage blocked");
  await page.locator("#draft-save").check();
  await expect(page.locator("#draft-status")).toContainText("could not be read or removed");
  await page.locator("#rules-input").fill('"still editable"');
  await expect(page.locator("#regex-output")).toContainText("still editable");
  await page.locator("#draft-save").uncheck();
  await expect(page.locator("#draft-status")).toContainText("could not be read or removed");
});

test("edits before module initialization and invalid incoming links preserve recoverable work", async ({
  page,
}) => {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: draftStorageKey,
    value: draft,
  });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/web/app.js*", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await page.locator("#rules-input").fill('"typed before loading"');
  await page.locator("#ignore-case").check();
  await page.locator("#dot-all").check();
  await page.locator("#match-mode").selectOption("search");
  release();
  await expect(page.locator("#example-list button").first()).toBeEnabled();
  await expect(page.locator("#rules-input")).toHaveValue('"typed before loading"');
  await expect(page.locator("#ignore-case")).toBeChecked();
  await expect(page.locator("#dot-all")).toBeChecked();
  await expect(page.locator("#match-mode")).toHaveValue("search");
  await expect(page.locator("#regex-output")).toHaveText("/typed before loading/isu");
  await expect
    .poll(async () => JSON.parse(await stored(page)).rules)
    .toBe('"typed before loading"');
  await page.goto("/#tests=bad");
  await page.reload();
  await expect(page.locator("#rules-input")).toHaveValue(draft.rules);
  await expect(page.locator("#fixture-status")).toContainText("Invalid share link");
  await expect(page.locator("#draft-save")).toBeChecked();
});

test("draft controls and recovery status translate and remain keyboard accessible", async ({
  page,
}) => {
  await ready(page);
  for (const locale of ["en", "zh-CN", "es", "fr"]) {
    await page.locator("#interface-language").selectOption(locale);
    await expect(page.locator("#draft-save")).toHaveAccessibleName(
      translate(locale, "Keep a draft in this browser"),
    );
    await page.locator("#draft-save").focus();
    await page.locator("#draft-save").press("Space");
    await expect(page.locator("#draft-status")).toHaveText(
      translate(locale, "Draft saved in this browser."),
    );
    await page.locator("#draft-save").press("Space");
    await expect(page.locator("#draft-status")).toHaveText(
      translate(locale, "Draft saving is off; the saved draft was removed."),
    );
  }
  expect((await new AxeBuilder({ page }).include("#test-fixtures").analyze()).violations).toEqual(
    [],
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
