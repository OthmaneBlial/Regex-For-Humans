import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";
import { fixtureStorageKey, shareLinkLimit } from "../../web/fixtures.js";
import { translate } from "../../web/i18n.js";

const fixture = {
  format: "regex-for-humans-tests",
  version: 1,
  rules: 'capture "letter" {\n"A"\n}\ncapture "empty" {\n}\noptional capture "bee" {\n"B"\n}',
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
    { text: 'العربية اردو 😀 <img onerror="alert(1)"> {count}\ud800', expected: false },
  ],
};
const fragment = (value) => `#tests=${Buffer.from(JSON.stringify(value)).toString("base64url")}`;

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
  await page.locator("#test-fixtures > summary").press("Enter");
}

async function importFixture(page, value = fixture) {
  await page.locator("#fixture-file").setInputFiles({
    name: "tests.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(value)),
  });
  await expect(page.locator("#fixture-status")).toHaveText(
    `Imported ${value.cases.length} examples. Review the rules and test results.`,
  );
}

async function exported(page) {
  const pending = page.waitForEvent("download");
  await page.locator("#fixture-export").click();
  const download = await pending;
  return JSON.parse(await readFile(await download.path(), "utf8"));
}

async function mockClipboard(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.sharedClipboard = text;
        },
      },
    });
  });
}

test("a copied share link restores exact captures, line endings and replacements in a fresh page", async ({
  page,
  context,
}) => {
  await mockClipboard(page);
  await ready(page);
  await importFixture(page);
  const originalURL = page.url();
  await page.locator("#fixture-share").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#fixture-status")).toHaveText("Share link copied.");
  const link = await page.locator("#fixture-link").inputValue();
  expect(await page.evaluate(() => window.sharedClipboard)).toBe(link);
  expect(new URL(link).search).toBe("");
  expect(new URL(link).hash).toBe(fragment(fixture));
  expect(page.url()).toBe(originalURL);
  expect(await page.evaluate((key) => localStorage.getItem(key), fixtureStorageKey)).toBeNull();
  const receiver = await context.newPage();
  const requests = [];
  receiver.on("request", (request) =>
    requests.push({ url: request.url(), method: request.method(), body: request.postData() }),
  );
  try {
    await receiver.goto(link);
    await expect(receiver.locator("#fixture-status")).toHaveText("Loaded 2 shared examples.");
    await expect(receiver.locator("#rules-input")).toHaveValue(fixture.rules);
    await expect(receiver.locator("#match-mode")).toHaveValue("search");
    const compiled = compile(fixture.rules, { flags: fixture.flags });
    await expect(receiver.locator("#regex-output")).toHaveText(
      `/${compiled.source}/${compiled.flags}`,
    );
    await expect(receiver.locator(".test-row")).toHaveCount(2);
    await expect(receiver.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
    for (const check of ["Exact spans", "Capture values", "Replacement result"])
      await expect(receiver.locator(".expectation-checks").first()).toContainText(
        `✓ ${check} agrees`,
      );
    await expect(receiver.locator(".test-row img")).toHaveCount(0);
    expect(await exported(receiver)).toEqual(fixture);
    expect(requests.length).toBeGreaterThan(3);
    for (const request of requests) {
      expect(request.url).not.toContain("#tests=");
      expect(request.url).not.toContain(new URL(link).hash.slice(7));
      expect(request.method).toBe("GET");
      expect(request.body).toBeNull();
    }
  } finally {
    await receiver.close();
  }
});

test("shared initialization precedes delayed recipes and recipe selection removes the old snapshot", async ({
  page,
}) => {
  let release;
  let requested = false;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/product-scenarios.json*", async (route) => {
    requested = true;
    await gate;
    await route.continue();
  });
  await page.goto(`/${fragment(fixture)}`, { waitUntil: "domcontentloaded" });
  await expect.poll(() => requested).toBe(true);
  await expect(page.locator("#fixture-status")).toHaveText("Loaded 2 shared examples.");
  await expect(page.locator(".test-row").first()).toHaveAttribute("data-result", "pass");
  await page.locator("#rules-input").fill('start\n"newer"\nend');
  release();
  await expect(page.locator("#example-list button")).toHaveCount(31);
  await expect(page.locator("#rules-input")).toHaveValue('start\n"newer"\nend');
  await expect(page.locator(".test-row")).toHaveCount(2);
  await page.locator("#example-list button").first().click();
  expect(new URL(page.url()).hash).toBe("");
  expect(new URL(page.url()).searchParams.get("example")).toBeTruthy();
  await page.reload();
  await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
});

test("navigation within a document offers explicit loading without overwriting current edits", async ({
  page,
}) => {
  await ready(page);
  const rules = 'start\n"keep me"\nend';
  await page.locator("#rules-input").fill(rules);
  const before = await exported(page);
  await page.evaluate((hash) => {
    location.hash = hash;
  }, fragment(fixture));
  await expect(page.locator("#fixture-load-link")).toBeVisible();
  await expect(page.locator("#fixture-status")).toHaveText(
    "Load the shared link to replace the current rules and examples.",
  );
  expect(await exported(page)).toEqual(before);
  await page.locator("#fixture-load-link").click();
  await expect(page.locator("#fixture-load-link")).toBeHidden();
  expect(await exported(page)).toEqual(fixture);
  await page.evaluate(
    (hash) => {
      location.hash = hash;
    },
    fragment({ ...fixture, version: 2 }),
  );
  await expect(page.locator("#fixture-load-link")).toBeVisible();
  await page.locator("#fixture-load-link").click();
  await expect(page.locator("#fixture-status")).toHaveAttribute("data-state", "error");
  expect(await exported(page)).toEqual(fixture);
});

test("rules edited before the app arrives are preserved until the shared link is explicitly loaded", async ({
  page,
}) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/web/app.js*", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto(`/${fragment(fixture)}`, { waitUntil: "commit" });
  await page.locator("#rules-input").fill('start\n"EARLY"\nend');
  release();
  await expect(page.locator("#regex-output")).toHaveText("/^EARLY$/u");
  await expect(page.locator("#fixture-load-link")).toBeVisible();
  await page.locator("#fixture-load-link").click();
  expect(await exported(page)).toEqual(fixture);
});

test("malformed and oversized initial links preserve saved data and leave the editor usable", async ({
  page,
}) => {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: fixtureStorageKey,
    value: fixture,
  });
  const invalid = [
    "#tests=_w",
    fragment({ ...fixture, version: 2 }),
    `#tests=${"A".repeat(shareLinkLimit)}`,
  ];
  for (const [index, hash] of invalid.entries()) {
    await page.goto(`/?invalid=${index}${hash}`);
    await expect(page.locator("#fixture-status")).toHaveAttribute("data-state", "error");
    await expect(page.locator("#regex-output")).toHaveText("/^ABC\\d{3}$/u");
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), fixtureStorageKey),
    ).toEqual(fixture);
    await page.locator("#rules-input").fill('start\n"recovered"\nend');
    await expect(page.locator("#regex-output")).toHaveText("/^recovered$/u");
  }
});

test("editable invalid rules and empty suites survive sharing while oversized or invalid expectation drafts cannot be copied", async ({
  page,
}) => {
  await mockClipboard(page);
  await ready(page);
  const draft = { ...fixture, rules: "invalid editable rule", flags: "v", mode: "full", cases: [] };
  await importFixture(page, draft);
  await page.locator("#fixture-share").click();
  const link = await page.locator("#fixture-link").inputValue();
  await page.goto(`/?draft=1${new URL(link).hash}`);
  await expect(page.locator("#rules-input")).toHaveValue(draft.rules);
  await expect(page.locator("#rules-input")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#unicode-mode")).toHaveValue("v");
  expect(await exported(page)).toEqual(draft);
  await importFixture(page);
  await page.locator("#fixture-share").click();
  await expect(page.locator("#fixture-status")).toHaveText("Share link copied.");
  const previous = await page.evaluate(() => window.sharedClipboard);
  await page.locator(".expectation-input").first().fill("{");
  await page.locator("#fixture-share").click();
  await expect(page.locator("#fixture-status")).toContainText("Fix the expectation JSON");
  await expect(page.locator("#fixture-link-output")).toBeHidden();
  expect(await page.evaluate(() => window.sharedClipboard)).toBe(previous);
  const near = { ...fixture, cases: Array(11).fill({ text: "Z".repeat(2048), expected: false }) };
  await importFixture(page, near);
  await page.locator("#fixture-share").click();
  await expect(page.locator("#fixture-status")).toHaveText("Share link copied.");
  const nearLink = await page.locator("#fixture-link").inputValue();
  expect(nearLink.length).toBeGreaterThan(30000);
  expect(nearLink.length).toBeLessThanOrEqual(shareLinkLimit);
  await page.goto(`/?near=1${new URL(nearLink).hash}`);
  await expect(page.locator("#fixture-status")).toHaveText("Loaded 11 shared examples.");
  expect(await exported(page)).toEqual(near);
  const lastCopied = await page.evaluate(() => window.sharedClipboard);
  const large = { ...fixture, cases: Array(25).fill({ text: "Z".repeat(2048), expected: false }) };
  await importFixture(page, large);
  await page.locator("#fixture-share").click();
  await expect(page.locator("#fixture-status")).toContainText(
    "Share link exceeds 32 KiB. Export JSON",
  );
  await expect(page.locator("#fixture-link-output")).toBeHidden();
  expect(await page.evaluate(() => window.sharedClipboard)).toBe(lastCopied);
  expect(await exported(page)).toEqual(large);
});

for (const failure of ["denied", "absent", "pending"])
  test(`clipboard ${failure} leaves a selected share link for manual keyboard copying`, async ({
    page,
  }) => {
    await page.addInitScript((mode) => {
      Object.defineProperty(navigator, "clipboard", {
        value:
          mode === "absent"
            ? undefined
            : {
                writeText: () =>
                  mode === "pending" ? new Promise(() => {}) : Promise.reject(new Error("Denied")),
              },
      });
    }, failure);
    await ready(page);
    await importFixture(page);
    await page.locator("#fixture-share").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#fixture-status")).toHaveText(
      "Clipboard unavailable. Select the share link and use your copy shortcut.",
    );
    const input = page.locator("#fixture-link");
    await expect(input).toBeFocused();
    expect(
      await input.evaluate((element) => [element.selectionStart, element.selectionEnd]),
    ).toEqual([0, (await input.inputValue()).length]);
    expect(await exported(page)).toEqual(fixture);
  });

for (const success of [true, false])
  test(`a late clipboard ${success ? "success" : "failure"} cannot overwrite newer fixture feedback`, async ({
    page,
  }) => {
    await page.addInitScript((ok) => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            new Promise((resolve, reject) => {
              window.finishShare = () => (ok ? resolve() : reject(new Error("Denied")));
            }),
        },
      });
    }, success);
    await ready(page);
    await importFixture(page);
    await page.locator("#fixture-share").click();
    await expect(page.locator("#fixture-status")).toHaveText("Share link ready.");
    await page.locator("#rules-input").fill('start\n"newer"\nend');
    await expect(page.locator("#fixture-status")).toHaveText(
      "Workspace changed. Copy a new share link.",
    );
    await page.evaluate(async () => {
      window.finishShare();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await expect(page.locator("#fixture-link-output")).toBeHidden();
    await expect(page.locator("#fixture-status")).toHaveText(
      "Workspace changed. Copy a new share link.",
    );
    await expect(page.locator("#rules-input")).toBeFocused();
  });

test("a late share response preserves newer save feedback for an unchanged workspace", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          new Promise((resolve) => {
            window.finishShare = resolve;
          }),
      },
    });
  });
  await ready(page);
  await importFixture(page);
  await page.locator("#fixture-share").click();
  await page.locator("#fixture-save").focus();
  await page.keyboard.press("Enter");
  const saved = "Tests saved in this browser. Export JSON for a durable copy.";
  await expect(page.locator("#fixture-status")).toHaveText(saved);
  await page.evaluate(async () => {
    window.finishShare();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await expect(page.locator("#fixture-status")).toHaveText(saved);
  await expect(page.locator("#fixture-save")).toBeFocused();
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), fixtureStorageKey),
  ).toEqual(fixture);
});

for (const success of [true, false])
  test(`the latest share copy ${success ? "success" : "failure"} survives an older clipboard reply`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.shareReplies = [];
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            new Promise((resolve, reject) => {
              window.shareReplies.push({ resolve, reject });
            }),
        },
      });
    });
    await ready(page);
    await page.locator("#fixture-share").click();
    await page.locator("#fixture-share").click();
    await page.evaluate(async (ok) => {
      const newer = window.shareReplies[1];
      if (ok) newer.resolve();
      else newer.reject(new Error("Denied"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }, success);
    const message = success
      ? "Share link copied."
      : "Clipboard unavailable. Select the share link and use your copy shortcut.";
    await expect(page.locator("#fixture-status")).toHaveText(message);
    await page.evaluate(async (ok) => {
      const older = window.shareReplies[0];
      if (ok) older.reject(new Error("Old denial"));
      else older.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }, success);
    await expect(page.locator("#fixture-status")).toHaveText(message);
    await expect(page.locator("#fixture-link")).toBeVisible();
  });

test("clipboard failure preserves focus moved to another control", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          new Promise((_, reject) => {
            window.finishShare = () => reject(new Error("Denied"));
          }),
      },
    });
  });
  await ready(page);
  await page.locator("#fixture-share").click();
  await page.locator("#rules-input").focus();
  await page.evaluate(() => window.finishShare());
  await expect(page.locator("#fixture-status")).toContainText("Clipboard unavailable.");
  await expect(page.locator("#rules-input")).toBeFocused();
  await expect(page.locator("#fixture-link")).toBeVisible();
});

for (const locale of ["en", "zh-CN", "es", "fr"])
  test(`${locale} share controls and long links remain accessible in both themes at 320px`, async ({
    page,
  }, testInfo) => {
    await mockClipboard(page);
    await ready(page);
    await page.setViewportSize({ width: 320, height: 800 });
    await importFixture(page, {
      ...fixture,
      cases: [{ text: "العربية اردو 😀".repeat(100), expected: false }],
    });
    await page.locator("#interface-language").selectOption(locale);
    await expect(page.locator("#fixture-share")).toHaveText(translate(locale, "Copy share link"));
    await expect(page.locator("#fixture-share-help")).toHaveText(
      translate(
        locale,
        "Links include your rules, examples and expectations. Anyone with the link can read them.",
      ),
    );
    await page.locator("#fixture-share").click();
    await expect(page.locator("#fixture-status")).toHaveText(
      translate(locale, "Share link copied."),
    );
    await expect(
      page.getByRole("textbox", { name: translate(locale, "Share link"), exact: true }),
    ).toHaveAttribute("readonly", "");
    await page.evaluate((hash) => {
      location.hash = hash;
    }, fragment(fixture));
    await expect(page.locator("#fixture-load-link")).toHaveText(
      translate(locale, "Load shared link"),
    );
    await expect(page.locator("#fixture-status")).toHaveText(
      translate(locale, "Load the shared link to replace the current rules and examples."),
    );
    for (const theme of ["light", "dark"]) {
      await page.locator("#interface-theme").selectOption(theme);
      await expect(page.locator("#fixture-link")).toBeVisible();
      await expect(page.locator("#fixture-link")).toHaveAttribute("dir", "ltr");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      if (locale === "fr")
        await page
          .locator("#test-fixtures")
          .screenshot({ path: testInfo.outputPath(`share-fr-320-${theme}.png`) });
    }
  });
