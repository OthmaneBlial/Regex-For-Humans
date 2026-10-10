import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { exportRegex } from "../../index.js";
import { languageStorageKey, languages, translate } from "../../web/i18n.js";

async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  await expect(page.locator("#test-summary")).not.toHaveText("Checking examples…");
}

async function snapshot(page) {
  return page.evaluate(() => ({
    fields: [...document.querySelectorAll("textarea, input, select:not(#interface-language)")].map(
      (node) => ({
        id: node.id,
        value: node.value,
        checked: node.checked,
        start: node.selectionStart,
        end: node.selectionEnd,
        top: node.scrollTop,
        left: node.scrollLeft,
        height: node.style.height,
      }),
    ),
    open: [...document.querySelectorAll("details")].map((node) => node.open),
    regex: document.querySelector("#regex-output").textContent,
    code: document.querySelector("#export-code").textContent,
    svg: [...document.querySelectorAll("#diagram-viewport text")].map((node) => node.textContent),
    results: [...document.querySelectorAll(".test-row")].map((node) => node.dataset.result),
    scroll: [
      ...document.querySelectorAll(".pattern-box, #export-code-region, #diagram-viewport"),
    ].map((node) => [node.scrollTop, node.scrollLeft]),
  }));
}

test("all four languages update existing labels without recompilation or changes to user data, selections and results", async ({
  page,
}) => {
  await ready(page);
  const rules = `start\ncapture "Ready" {\n"Ready"\n}\n${"\n".repeat(60)}end`;
  await page.locator("#rules-input").fill(rules);
  await page.locator("#multiline-flag").check();
  await page.locator("#indices-flag").check();
  await page.locator("#unicode-mode").selectOption("v");
  await page.locator("#match-mode").selectOption("search");
  await page.locator("#test-list textarea").first().fill("Ready");
  await expect(page.locator(".test-row").first()).toContainText('Matched "Ready" at 0');
  for (const id of [
    "language-export",
    "group-editor",
    "structure-diagram",
    "pattern-review",
    "reverse-translator",
  ])
    await page.locator(`#${id} > summary`).press("Enter");
  await page.locator("#export-target").selectOption("typescript");
  await page.locator("#group-name").fill("pending_name");
  await page.locator("#reverse-regex").fill("/^Ready$/u");
  await page.locator(".capture-explorer").first().locator(":scope > summary").press("Enter");
  await page.locator(".capture-match").first().locator(":scope > summary").press("Enter");
  await expect(page.locator(".capture-value").first()).toHaveText('"Ready"');
  await page.locator("#rules-input").evaluate((node) => {
    node.style.height = "40px";
    node.setSelectionRange(6, 21);
    node.scrollTop = 10;
  });
  await page.evaluate(() => {
    window.i18nWorkerCalls = 0;
    const send = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (...args) {
      window.i18nWorkerCalls += 1;
      return send.apply(this, args);
    };
  });
  const before = await snapshot(page);
  expect(before.fields.find((field) => field.id === "rules-input").top).toBeGreaterThan(0);
  for (const language of ["zh-CN", "es", "fr", "en"]) {
    await page.locator("#interface-language").selectOption(language);
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    await expect(page.locator("#rules-title")).toHaveText(translate(language, "Write your rules"));
    await expect(page.locator("#compile-state")).toHaveText(translate(language, "Compiled"));
    await expect(page.locator("#export-download")).toHaveText(translate(language, "Download code"));
    await expect(page.locator("#test-list textarea").first()).toHaveAttribute(
      "aria-label",
      translate(language, "Example {index} string", { index: 1 }),
    );
    await expect(page.locator(".capture-value").first()).toHaveText('"Ready"');
    expect(await snapshot(page)).toEqual(before);
  }
  expect(await page.evaluate(() => window.i18nWorkerCalls)).toBe(0);
});

test("localized errors keep source navigation; reverse translation and downloads retain English rules and exact code", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#interface-language").selectOption("fr");
  await page.locator("#rules-input").fill("début");
  await expect(page.locator("#diagnostic")).toContainText("Ligne 1, colonne 1");
  await expect(page.locator("#copy-button")).toBeDisabled();
  await page.locator("#interface-language").selectOption("es");
  await expect(page.locator("#diagnostic")).toContainText("Línea 1, columna 1");
  await page.getByRole("button", { name: "Ir al error", exact: true }).press("Enter");
  await expect(page.locator("#rules-input")).toBeFocused();
  await page.locator("#reverse-translator > summary").press("Enter");
  await page.locator("#reverse-regex").fill("/^Ready$/u");
  await page.getByRole("button", { name: "Traducir a reglas", exact: true }).press("Enter");
  await expect(page.locator("#rules-input")).toHaveValue('start\n"Ready"\nend');
  await page.locator("#language-export > summary").press("Enter");
  await page.locator("#export-target").selectOption("python");
  const result = exportRegex('start\n"Ready"\nend', { target: "python" });
  await expect(page.locator("#export-code")).toHaveText(result.code);
  const request = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar código", exact: true }).press("Enter");
  const download = await request;
  expect(await readFile(await download.path(), "utf8")).toBe(`${result.code}\n`);
  await page.locator("#interface-language").selectOption("zh-CN");
  await page.locator("#test-list textarea").first().fill("Ready");
  await expect(page.locator(".test-row").first()).toContainText('匹配 "Ready"');
  await page.locator("#rules-input").fill("未知规则");
  await expect(page.locator("#export-code")).toHaveText("");
  await expect(page.locator("#export-status")).toHaveText(
    translate("zh-CN", "Compile valid rules to export source code."),
  );
});

test("the chosen language persists, invalid storage falls back and denied storage does not block the workshop", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await page.locator("#interface-language").selectOption("fr");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("#compile-state")).toHaveText("Compilé");
  await page.evaluate((key) => localStorage.setItem(key, "__proto__"), languageStorageKey);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.addInitScript(() => {
    for (const name of ["getItem", "setItem"])
      Object.defineProperty(Storage.prototype, name, {
        value() {
          throw new DOMException("Denied", "SecurityError");
        },
      });
  });
  await ready(page);
  await page.locator("#interface-language").selectOption("es");
  await expect(page.locator("#compile-state")).toHaveText("Compilado");
  expect(errors).toEqual([]);
});

test("language selection is disabled until its handler loads; choosing during recipe loading still loads examples", async ({
  page,
}) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let releaseApp;
  const appGate = new Promise((resolve) => {
    releaseApp = resolve;
  });
  await page.route("**/app.js*", async (route) => {
    await appGate;
    await route.continue();
  });
  await page.route("**/product-scenarios.json*", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator("#interface-language")).toBeDisabled();
  releaseApp();
  await expect(page.locator("#interface-language")).toBeEnabled();
  await expect(page.locator("#test-list textarea")).toHaveCount(0);
  await page.locator("#interface-language").selectOption("fr");
  await expect(page.locator("#regex-output")).toHaveText(
    translate("fr", "Select a recipe or write a rule"),
  );
  release();
  await expect(page.locator("#test-list textarea")).toHaveCount(4);
  await expect(page.locator("#compile-state")).toHaveText("Compilé");
  await expect(page.locator("#example-list button").first()).toHaveText(
    /Valider un identifiant avec préfixe/,
  );
  await expect(page.locator("#rules-input")).not.toHaveValue("");
});

for (const language of languages)
  test(`${language} remains accessible at 320 pixels and user strings never become markup or interface translations`, async ({
    page,
  }, testInfo) => {
    await ready(page);
    await page.setViewportSize({ width: 320, height: 800 });
    const text = 'Ready <img src=x onerror="alert(1)"> {line} العربية اردو 😀';
    await page.locator("#rules-input").fill(JSON.stringify(text));
    await page.locator("#test-list textarea").first().fill(text);
    await page.locator("#language-export > summary").press("Enter");
    await page.locator("#interface-language").selectOption(language);
    await expect(page.locator("#test-list textarea").first()).toHaveValue(text);
    await expect(page.locator("#export-code")).toContainText("<img");
    await expect(page.locator("#trace-list img, #language-export img, #test-list img")).toHaveCount(
      0,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page
      .locator(".hero")
      .screenshot({ path: testInfo.outputPath(`localized-${language}.png`) });
  });
