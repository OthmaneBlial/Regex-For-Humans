import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";

const { version } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);

const stylesheetVersion = createHash("sha256")
  .update(readFileSync(new URL("../../site/styles.css", import.meta.url)))
  .digest("hex")
  .slice(0, 12);
const workshopPreview = readFileSync(
  new URL("../../site/assets/workshop-preview.png", import.meta.url),
);
const workshopPreviewVersion = createHash("sha256")
  .update(workshopPreview)
  .digest("hex")
  .slice(0, 12);
const workshopPreviewWidth = workshopPreview.readUInt32BE(16);
const workshopPreviewHeight = workshopPreview.readUInt32BE(20);

test("homepage links the published npm preview with its install command and Node requirement", async ({
  page,
}) => {
  await page.goto("/");
  const install = page.locator(".npm-install");
  await expect(install).toBeVisible();
  await expect(install.locator("code")).toHaveText("npm install regex-for-humans@preview");
  await expect(install.getByRole("link", { name: "Get the npm preview ↗" })).toHaveAttribute(
    "href",
    `https://www.npmjs.com/package/regex-for-humans/v/${version}`,
  );
  await expect(install).toContainText("Library + CLI · Node.js 22+");
});

test("homepage points readers to the complete complex examples included in the workshop", async ({
  page,
}) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: "Explore four complex examples ↗", exact: true });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    "href",
    "https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/docs/COMPLEX-EXAMPLES.md",
  );
  const response = await page.request.get("/workshop/docs/COMPLEX-EXAMPLES.md");
  expect(response.status()).toBe(200);
  expect(await response.text()).toBe(
    readFileSync(new URL("../../docs/COMPLEX-EXAMPLES.md", import.meta.url), "utf8"),
  );
});

test("homepage requests its current stylesheet and bypasses an obsolete cached style", async ({
  page,
}) => {
  const stylesheets = [];
  await page.route("**/styles.css*", async (route) => {
    const url = new URL(route.request().url());
    stylesheets.push(url);
    if (url.searchParams.get("v") === stylesheetVersion) await route.continue();
    else
      await route.fulfill({ contentType: "text/css", body: "body { background: rgb(0, 0, 0); }" });
  });
  await page.goto("/");
  await expect(page.locator("#demo-input")).toBeEnabled();
  expect(stylesheets).toHaveLength(1);
  expect(stylesheets[0].searchParams.get("v")).toBe(stylesheetVersion);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(255, 253, 245)");
});

test("homepage removes decorative motion when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#demo-input")).toBeEnabled();
  const motion = await page.evaluate(() => ({
    animation: getComputedStyle(document.querySelector(".hero-copy")).animationName,
    transition: getComputedStyle(document.querySelector(".recipe-card")).transitionDuration,
  }));
  expect(motion).toEqual({ animation: "none", transition: "0s" });
});

const recipes = JSON.parse(
  readFileSync(new URL("../fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("homepage exposes a working, dimensioned social preview", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://othmaneblial.github.io/Regex-For-Humans/",
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://othmaneblial.github.io/Regex-For-Humans/",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const image = page.locator('meta[property="og:image"]');
  await expect(image).toHaveAttribute(
    "content",
    "https://othmaneblial.github.io/Regex-For-Humans/assets/social-card.png",
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    "https://othmaneblial.github.io/Regex-For-Humans/assets/social-card.png",
  );
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    "content",
    /colorful Regex For Humans card/u,
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630");
  const imageResponse = await page.request.get(new URL("/assets/social-card.png", page.url()).href);
  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()["content-type"]).toContain("image/png");
  const bytes = await imageResponse.body();
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
});

test("homepage uses the current, dimensioned workshop screenshot", async ({ page }) => {
  await page.goto("/");
  const image = page.locator(".workshop-preview img");
  await expect(image).toHaveAttribute(
    "src",
    `./assets/workshop-preview.png?v=${workshopPreviewVersion}`,
  );
  await expect(image).toHaveAttribute("width", String(workshopPreviewWidth));
  await expect(image).toHaveAttribute("height", String(workshopPreviewHeight));
  await expect(image).toHaveAttribute("alt", /recipe list/u);
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((element) => element.naturalWidth))
    .toBe(workshopPreviewWidth);
  await expect
    .poll(() => image.evaluate((element) => element.naturalHeight))
    .toBe(workshopPreviewHeight);
});

test("workshop and syntax guide expose their own canonical social previews", async ({ page }) => {
  for (const [path, canonical, title] of [
    [
      "/workshop/",
      "https://othmaneblial.github.io/Regex-For-Humans/workshop/",
      "Regex For Humans — Workshop",
    ],
    [
      "/workshop/web/language.html",
      "https://othmaneblial.github.io/Regex-For-Humans/workshop/web/language.html",
      "Language guide — Regex For Humans",
    ],
  ]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://othmaneblial.github.io/Regex-For-Humans/assets/social-card.png",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
  }
});

test("homepage waits for its app before enabling controls or claiming a match", async ({
  page,
}) => {
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  let requested;
  const started = new Promise((resolve) => {
    requested = resolve;
  });
  await page.route("**/app.js*", async (route) => {
    requested();
    await pending;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "commit" });
    await started;
    await expect(page.locator("#demo-input")).toBeDisabled();
    await expect(page.locator("#demo-result")).toHaveText("Not checked");
    for (const button of await page.locator("[data-copy]").all())
      await expect(button).toBeDisabled();
    await expect(page.getByRole("link", { name: /Open the playground/ })).toBeVisible();
    release();
    await expect(page.locator("#demo-input")).toBeEnabled();
    await expect(page.locator("#demo-result")).toHaveText("✓ Match");
  } finally {
    release();
  }
});

test("homepage copies static patterns while its compiler loads, then enables matching", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  let requested;
  const started = new Promise((resolve) => {
    requested = resolve;
  });
  await page.route("**/workshop/index.js*", async (route) => {
    requested();
    await pending;
    await route.continue();
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copiedText = text;
        },
      },
    });
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await started;
    await expect(page.locator("#demo-input")).toBeDisabled();
    await expect(page.locator("#demo-result")).toHaveText("Loading…");
    await expect(page.locator("#demo-result")).not.toHaveAttribute("data-match", /.+/);
    await expect(page.locator('[data-recipe="hex-color"]')).toBeDisabled();
    for (const target of ["rules-code", "regex-code"]) {
      await page.locator(`[data-copy="${target}"]`).click();
      await expect(page.locator(`[data-copy="${target}"]`)).toHaveText("Copied ✓");
      expect(await page.evaluate(() => window.copiedText)).toBe(
        await page.locator(`#${target}`).textContent(),
      );
    }
    await page.evaluate(() => {
      navigator.clipboard.writeText = () =>
        new Promise((resolve) => {
          window.finishLoadingCopy = resolve;
        });
    });
    await page.locator('[data-copy="regex-code"]').click();
    release();
    await expect(page.locator("#demo-input")).toBeEnabled();
    await expect(page.locator("#demo-result")).toHaveText("✓ Match");
    await page.locator("#demo-input").fill("not a hex color");
    await expect(page.locator("#demo-result")).toHaveText("× No match");
    await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
    await page.evaluate(() => window.finishLoadingCopy());
    await expect(page.locator('[data-copy="regex-code"]')).toHaveText("Copied ✓");
  } finally {
    release();
  }
});

test("a failed homepage compiler keeps copy and workshop navigation available and recovers on reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/workshop/index.js*", (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copiedText = text;
        },
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("#demo-input")).toBeDisabled();
  await expect(page.locator("#demo-result")).toHaveText("Demo unavailable");
  await expect(page.locator("#demo-note")).toContainText("The demo couldn't load");
  await expect(page.locator('[data-recipe="hex-color"]')).toBeDisabled();
  for (const target of ["rules-code", "regex-code"]) {
    await page.locator(`[data-copy="${target}"]`).click();
    await expect(page.locator(`[data-copy="${target}"]`)).toHaveText("Copied ✓");
    expect(await page.evaluate(() => window.copiedText)).toBe(
      await page.locator(`#${target}`).textContent(),
    );
  }
  await expect(page.locator("#demo-open")).toHaveAttribute("href", "./workshop/?example=hex-color");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(errors).toEqual([]);
  await page.unroute("**/workshop/index.js*");
  await page.reload();
  await expect(page.locator("#demo-input")).toBeEnabled();
  await expect(page.locator("#demo-result")).toHaveText("✓ Match");
  await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
});

test("homepage without JavaScript keeps readable patterns and explains the inactive demo", async ({
  browser,
  baseURL,
  viewport,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport });
  try {
    const page = await context.newPage();
    await page.goto(baseURL);
    await expect(page.locator("#demo-input")).toBeDisabled();
    await expect(page.locator("#demo-result")).toHaveText("Not checked");
    await expect(page.locator("noscript p")).toContainText("The demo needs JavaScript");
    await expect(page.locator("#regex-code")).toHaveText("/^#[0-9A-Fa-f]{6}$/u");
    for (const button of await page.locator("[data-copy]").all())
      await expect(button).toBeDisabled();
    await expect(page.getByRole("link", { name: /Open the playground/ })).toBeVisible();
  } finally {
    await context.close();
  }
});

test("homepage requests a versioned compiler and skips an obsolete cached module", async ({
  page,
}) => {
  const compilerUrls = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/workshop/index.js*", async (route) => {
    const url = new URL(route.request().url());
    compilerUrls.push(url);
    if (url.searchParams.has("v")) await route.continue();
    else {
      await route.fulfill({
        contentType: "text/javascript",
        body: 'export function compile() { throw new Error("Obsolete cached compiler"); } export function toRegExp() {}',
      });
    }
  });
  await page.goto("/");
  const appUrl = new URL(
    await page.locator('script[type="module"]').getAttribute("src"),
    page.url(),
  );
  expect(compilerUrls).toHaveLength(1);
  expect(compilerUrls[0].search).toBe(appUrl.search);
  expect(appUrl.searchParams.get("v")).toMatch(/^[\da-f]{12}$/u);
  await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
  await page.locator("#demo-input").fill("#badbad");
  await expect(page.locator("#demo-result")).toHaveText("✓ Match");
  await page.locator("#demo-input").fill("#bad");
  await expect(page.locator("#demo-result")).toHaveText("× No match");
  expect(errors).toEqual([]);
});

test("homepage demo requests literal text entry and preserves typed case", async ({ page }) => {
  await page.goto("/");
  const recipe = page.locator('[data-recipe="prefixed-identifier"]');
  await expect(recipe).toBeEnabled();
  await recipe.click();
  const input = page.locator("#demo-input");
  for (const [attribute, value] of [
    ["spellcheck", "false"],
    ["autocomplete", "off"],
    ["autocapitalize", "off"],
    ["autocorrect", "off"],
  ]) {
    await expect(input).toHaveAttribute(attribute, value);
  }
  await input.fill("");
  await input.pressSequentially("abc123");
  await expect(input).toHaveValue("abc123");
  await expect(page.locator("#demo-result")).toHaveText("× No match");
  await input.fill("");
  await input.pressSequentially("ABC123");
  await expect(input).toHaveValue("ABC123");
  await expect(page.locator("#demo-result")).toHaveText("✓ Match");
});

test("homepage keeps oversized demo input and validates its limit without testing a prefix", async ({
  page,
}) => {
  await page.goto("/");
  const version = page.locator('[data-recipe="version-shape"]');
  await expect(version).toBeEnabled();
  await version.click();
  const input = page.locator("#demo-input");
  const result = page.locator("#demo-result");
  const valid = `${"1".repeat(76)}.2.3`;
  const oversized = `${valid}BBB`;
  const compiled = compile(await page.locator("#rules-code").textContent());
  const expression = new RegExp(compiled.source, compiled.flags);
  expect(valid.length).toBe(80);
  expect(expression.test(valid)).toBe(true);
  expect(expression.test(oversized)).toBe(false);
  await input.fill("");
  await input.focus();
  await page.keyboard.insertText(oversized);
  await expect(input).toHaveValue(oversized);
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(result).toHaveText("Too long");
  await expect(result).toHaveAttribute("data-match", "invalid");
  const limits =
    "Demo limit: 80 UTF-16 code units. Longer input is kept but cannot be tested. The workshop accepts up to 2,048.";
  await expect(page.locator("#demo-limits")).toBeVisible();
  await expect(input).toHaveAccessibleDescription(`${limits} Too long`);
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished)),
  );
  const viewport = page.viewportSize();
  for (const width of [viewport.width, 320]) {
    await page.setViewportSize({ width, height: viewport.height });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const check = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      check.violations.map(({ id, nodes }) => ({
        id,
        nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
      })),
    ).toEqual([]);
  }
  await input.fill(valid);
  await expect(input).toHaveValue(valid);
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(result).toHaveText("✓ Match");
  await input.fill("");
  await input.focus();
  await page.keyboard.insertText("🧠".repeat(41));
  await expect(input).toHaveValue("🧠".repeat(41));
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(result).toHaveText("Too long");
  await input.fill("🧠".repeat(40));
  await expect(input).toHaveValue("🧠".repeat(40));
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(result).toHaveText("× No match");
  await page.locator('[data-recipe="hex-color"]').click();
  await expect(input).toHaveValue("#ff6b6b");
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(result).toHaveText("✓ Match");
});

test("landing recipes compile with the real library and copy the current rules and regex", async ({
  page,
}) => {
  await page.goto("/");
  for (const id of ["hex-color", "prefixed-identifier", "version-shape"]) {
    const recipe = recipes.find((item) => item.id === id);
    const button = page.locator(`[data-recipe="${id}"]`);
    await expect(button).toBeEnabled();
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    const compiled = compile(recipe.rules);
    const literal = `/${compiled.source}/${compiled.flags}`;
    await expect(page.locator("#rules-code")).toHaveText(recipe.rules);
    await expect(page.locator("#demo-note")).toHaveText(recipe.note);
    await expect(page.locator("#regex-code")).toHaveText(literal);
    await expect(page.locator("#demo-result")).toHaveText("✓ Match");
    await page.locator("#demo-input").fill(recipe.negative[0]);
    await expect(page.locator("#demo-result")).toHaveText("× No match");
    await page.locator("#demo-input").fill(recipe.positive[0]);
    await expect(page.locator("#demo-result")).toHaveText("✓ Match");
    await expect(page.locator("#demo-open")).toHaveAttribute("href", `./workshop/?example=${id}`);
    await page.evaluate(() => {
      window.copiedText = "";
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.copiedText = text;
          },
        },
      });
    });
    for (const [target, text] of [
      ["rules-code", recipe.rules],
      ["regex-code", literal],
    ]) {
      await page.locator(`[data-copy="${target}"]`).click();
      await expect.poll(() => page.evaluate(() => window.copiedText)).toBe(text);
    }
  }
});

test("landing is accessible at desktop, mobile and 320px, with working workshop links and assets", async ({
  page,
}) => {
  const failed = [];
  const errors = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failed.push(response.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  const viewport = page.viewportSize();
  for (const width of [viewport.width, 320]) {
    await page.setViewportSize({ width, height: viewport.height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    for (const button of await page.locator("[data-copy]").all())
      await expect(button).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  }
  await page.locator('.recipe-card[href*="hex-color"]').click();
  await expect(page.locator("#regex-output")).toHaveText("/^#[0-9A-Fa-f]{6}$/u");
  await page.getByRole("link", { name: /Read the syntax/ }).click();
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test("the initial hex demo still works when extra recipes cannot load", async ({ page }) => {
  await page.route("**/product-scenarios.json*", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#demo-note")).toContainText("Extra recipes couldn't load");
  await page.locator("#demo-input").fill("#xyzxyz");
  await expect(page.locator("#demo-result")).toHaveText("× No match");
  await expect(page.locator("#demo-open")).toHaveAttribute("href", "./workshop/?example=hex-color");
});

test("malformed homepage recipes preserve the initial demo and recover on reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.copiedText = text;
        },
      },
    });
  });
  let payload;
  await page.route("**/product-scenarios.json*", (route) => route.fulfill({ json: payload }));
  const hex = recipes.find((recipe) => recipe.id === "hex-color");
  const literal = `/${hex.source}/${hex.flags}`;
  const malformed = [
    null,
    {},
    [],
    [null],
    ...[
      { note: null },
      { positive: [] },
      { positive: [null] },
      { negative: null },
      { rules: "unsupported recipe rule" },
    ].map((patch) =>
      recipes.map((recipe) => (recipe.id === "version-shape" ? { ...recipe, ...patch } : recipe)),
    ),
  ];
  for (payload of malformed) {
    await page.goto("/");
    await expect(page.locator("#demo-note")).toContainText("Extra recipes couldn't load");
    for (const button of await page.locator("[data-recipe]").all())
      await expect(button).toBeDisabled();
    await expect(page.locator("#rules-code")).toHaveText(hex.rules);
    await expect(page.locator("#regex-code")).toHaveText(literal);
    await expect(page.locator("#demo-open")).toHaveAttribute(
      "href",
      "./workshop/?example=hex-color",
    );
    await page.locator("#demo-input").fill("#xyzxyz");
    await expect(page.locator("#demo-result")).toHaveText("× No match");
    await page.locator("#demo-input").fill("#12aBcF");
    await expect(page.locator("#demo-result")).toHaveText("✓ Match");
    await page.locator('[data-copy="regex-code"]').click();
    await expect.poll(() => page.evaluate(() => window.copiedText)).toBe(literal);
  }
  await page.unroute("**/product-scenarios.json*");
  await page.reload();
  for (const id of ["hex-color", "prefixed-identifier", "version-shape"]) {
    const recipe = recipes.find((item) => item.id === id);
    const button = page.locator(`[data-recipe="${id}"]`);
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.locator("#rules-code")).toHaveText(recipe.rules);
    await expect(page.locator("#regex-code")).toHaveText(`/${recipe.source}/${recipe.flags}`);
    await expect(page.locator("#demo-result")).toHaveText("✓ Match");
  }
  expect(errors).toEqual([]);
});

test("recipe cards cover every shared recipe and open editable shapes", async ({ page }) => {
  await page.goto("/");
  const ids = await page
    .locator(".recipe-card")
    .evaluateAll((cards) => cards.map((card) => new URL(card.href).searchParams.get("example")));
  expect(ids.sort()).toEqual(recipes.map((recipe) => recipe.id).sort());
  await expect(page.locator(".syntax-list")).toContainText("between 2 and 6 digits");
  await expect(page.locator(".syntax-list")).toContainText("letters");
  await expect(page.locator(".syntax-list")).toContainText("lowercase letters");
  for (const id of [
    "invoice-number",
    "username-shape",
    "mac-address-shape",
    "uuid-shape",
    "product-code-shape",
    "time-shape",
    "phone-shape",
    "filename-shape",
    "artifact-manifest",
    "access-log",
    "structured-event",
  ]) {
    if (id !== "invoice-number") await page.goto("/");
    const recipe = recipes.find((item) => item.id === id);
    await page.locator(`.recipe-card[href*="${id}"]`).click();
    expect(new URL(page.url()).searchParams.get("example")).toBe(id);
    await expect(page.locator("#rules-input")).toHaveValue(recipe.rules);
    await expect(page.locator("#regex-output")).toHaveText(`/${recipe.source}/${recipe.flags}`);
    await expect(page.locator("#recipe-note")).toHaveText(recipe.note);
    const count = recipe.positive.length + recipe.negative.length;
    await expect(page.locator("#test-summary")).toHaveText(
      `${count} of ${count} examples behave as expected`,
    );
  }
});

test("copying a second snippet keeps its feedback after the first timer expires", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => {} },
    });
  });
  await page.goto("/");
  await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
  await page.locator('[data-copy="rules-code"]').click();
  await page.clock.fastForward(1000);
  await page.locator('[data-copy="regex-code"]').click();
  await page.clock.fastForward(900);
  await expect(page.locator("#copy-status")).toContainText("regex copied");
  await page.clock.fastForward(1000);
  await expect(page.locator("#copy-status")).toBeEmpty();
  await expect(page.locator('[data-copy="regex-code"]')).toHaveText("Copy regex");
});

for (const timeout of [false, true]) {
  test(`a homepage copy ${timeout ? "timeout" : "rejection"} preserves a newly focused input and selection`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
    await page.addInitScript(() => {
      window.copyRequests = [];
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            new Promise((resolve, reject) => window.copyRequests.push({ resolve, reject })),
        },
      });
    });
    await page.goto("/");
    await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
    const button = page.locator('[data-copy="regex-code"]');
    const input = page.locator("#demo-input");
    await button.focus();
    await page.keyboard.press("Enter");
    await input.focus();
    await input.evaluate((element) => element.setSelectionRange(1, 3));
    if (timeout) await page.clock.fastForward(1001);
    else await page.evaluate(() => window.copyRequests[0].reject(new Error("Clipboard denied")));
    await expect(page.locator("#copy-status")).toHaveText(
      "Clipboard access is unavailable. Select the text to copy it.",
    );
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("#ff6b6b");
    expect(
      await input.evaluate((element) => [element.selectionStart, element.selectionEnd]),
    ).toEqual([1, 3]);
    await button.focus();
    await page.keyboard.press("Enter");
    await page.evaluate(() => window.copyRequests[1].resolve());
    await expect(button).toHaveText("Copied ✓");
    await expect(button).toBeFocused();
  });
}

for (const unavailable of [true, false]) {
  test(`homepage selects snippets for keyboard copying when clipboard access is ${unavailable ? "unavailable" : "blocked"}`, async ({
    page,
  }) => {
    await page.addInitScript((unavailable) => {
      window.copyEvents = [];
      Object.defineProperty(navigator, "clipboard", {
        value: unavailable
          ? undefined
          : {
              writeText: async () => {
                throw new Error("Clipboard access blocked");
              },
            },
      });
      document.addEventListener("copy", (event) => {
        window.copyEvents.push(window.getSelection()?.toString());
        event.preventDefault();
      });
    }, unavailable);
    await page.goto("/");
    for (const target of ["rules-code", "regex-code"]) {
      const button = page.locator(`[data-copy="${target}"]`);
      await expect(button).toBeEnabled();
      const text = await page.locator(`#${target}`).textContent();
      await button.focus();
      await page.keyboard.press("Enter");
      await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe(text);
      await expect(button).toBeFocused();
      await expect(page.locator("#copy-status")).toHaveText(
        "Clipboard access is unavailable. The text is selected; press your keyboard copy shortcut.",
      );
      await page.keyboard.press("ControlOrMeta+C");
      expect(await page.evaluate(() => window.copyEvents.at(-1))).toBe(text);
      await expect(button).toBeFocused();
      await expect(button).toHaveText(target === "rules-code" ? "Copy rules" : "Copy regex");
    }
  });
}

test("a stalled copy clears old confirmation, offers manual copying and recovers", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.addInitScript(() => {
    window.stallCopy = false;
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          window.stallCopy
            ? new Promise((resolve) => {
                window.finishStalledCopy = resolve;
              })
            : Promise.resolve(),
      },
    });
  });
  await page.goto("/");
  await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
  const button = page.locator('[data-copy="regex-code"]');
  const status = page.locator("#copy-status");
  await button.click();
  await expect(button).toHaveText("Copied ✓");
  await page.evaluate(() => {
    window.stallCopy = true;
  });
  await button.click();
  await page.clock.fastForward(1000);
  await expect(status).toHaveText(
    "Clipboard access is unavailable. The text is selected; press your keyboard copy shortcut.",
  );
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
    await page.locator("#regex-code").textContent(),
  );
  await expect(button).toBeFocused();
  await expect(button).toHaveText("Copy regex");
  await page.evaluate(async () => {
    window.finishStalledCopy();
    await Promise.resolve();
    window.stallCopy = false;
  });
  await expect(status).toContainText("The text is selected");
  await page.locator('[data-recipe="prefixed-identifier"]').click();
  await expect(status).toBeEmpty();
  await button.click();
  await expect(button).toHaveText("Copied ✓");
  await expect(status).toHaveText("regex copied. Ready to paste!");
});

for (const success of [true, false]) {
  test(`a newer copy keeps its feedback when an older request ${success ? "resolves" : "rejects"} for the same recipe`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
    await page.addInitScript(() => {
      window.pendingCopies = [];
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            new Promise((resolve, reject) => {
              window.pendingCopies.push({ resolve, reject });
            }),
        },
      });
    });
    await page.goto("/");
    await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
    const rules = page.locator('[data-copy="rules-code"]');
    const regex = page.locator('[data-copy="regex-code"]');
    const status = page.locator("#copy-status");
    await rules.click();
    await page.clock.fastForward(100);
    await regex.click();
    await page.evaluate(async () => {
      window.pendingCopies[1].resolve();
      await Promise.resolve();
    });
    await expect(regex).toHaveText("Copied ✓");
    await expect(status).toHaveText("regex copied. Ready to paste!");
    await page.evaluate(async (success) => {
      const previous = window.pendingCopies[0];
      if (success) previous.resolve();
      else previous.reject(new Error("Clipboard access blocked"));
      await Promise.resolve();
    }, success);
    await expect(rules).toHaveText("Copy rules");
    await expect(status).toHaveText("regex copied. Ready to paste!");
    await page.clock.fastForward(900);
    await expect(regex).toHaveText("Copied ✓");
    await expect(status).toHaveText("regex copied. Ready to paste!");
    await page.clock.fastForward(1000);
    await expect(regex).toHaveText("Copy regex");
    await expect(status).toBeEmpty();
  });
}

for (const success of [true, false]) {
  test(`recipe changes clear copied labels and ignore ${success ? "resolved" : "rejected"} older clipboard requests`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
    await page.addInitScript((success) => {
      window.pendingCopies = [];
      window.deferCopies = false;
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            window.deferCopies
              ? new Promise((resolve, reject) => {
                  window.pendingCopies.push(() =>
                    success ? resolve() : reject(new Error("Clipboard blocked")),
                  );
                })
              : Promise.resolve(),
        },
      });
    }, success);
    await page.goto("/");
    await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
    const rules = page.locator('[data-copy="rules-code"]');
    const regex = page.locator('[data-copy="regex-code"]');
    const status = page.locator("#copy-status");
    await rules.click();
    await regex.click();
    await expect(rules).toHaveText("Copied ✓");
    await expect(regex).toHaveText("Copied ✓");
    await page.clock.fastForward(1000);
    await page.locator('[data-recipe="prefixed-identifier"]').click();
    await expect(rules).toHaveText("Copy rules");
    await expect(regex).toHaveText("Copy regex");
    await expect(status).toBeEmpty();

    await page.evaluate(() => {
      window.deferCopies = true;
    });
    await rules.click();
    await regex.click();
    await expect.poll(() => page.evaluate(() => window.pendingCopies.length)).toBe(2);
    await page.locator('[data-recipe="version-shape"]').click();
    await page.evaluate(() => {
      window.deferCopies = false;
    });
    await regex.click();
    await page.evaluate(async () => {
      for (const finish of window.pendingCopies) finish();
      await Promise.resolve();
    });
    await expect(rules).toHaveText("Copy rules");
    await expect(regex).toHaveText("Copied ✓");
    await expect(status).toHaveText("regex copied. Ready to paste!");
    await page.clock.fastForward(900);
    await expect(regex).toHaveText("Copied ✓");
    await expect(status).toHaveText("regex copied. Ready to paste!");
    await page.clock.fastForward(1000);
    await expect(regex).toHaveText("Copy regex");
    await expect(status).toBeEmpty();
  });
}

test("copy and the initial demo remain usable while extra recipes are still loading", async ({
  page,
}) => {
  let pendingRecipe;
  await page.route("**/product-scenarios.json*", (route) => {
    pendingRecipe = route;
  });
  await page.addInitScript(() => {
    window.copiedText = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedText = text;
        },
      },
    });
  });
  await page.goto("/", { waitUntil: "commit" });
  await expect.poll(() => Boolean(pendingRecipe)).toBe(true);
  const appUrl = new URL(
    await page.locator('script[type="module"]').getAttribute("src"),
    page.url(),
  );
  expect(appUrl.searchParams.has("v")).toBe(true);
  expect(new URL(pendingRecipe.request().url()).search).toBe(appUrl.search);
  await expect(page.locator('[data-recipe="hex-color"]')).toBeDisabled();
  await expect(page.locator("#demo-note")).toHaveText(
    recipes.find((recipe) => recipe.id === "hex-color").note,
  );
  await page.locator("#demo-input").fill("#123");
  await expect(page.locator("#demo-result")).toHaveText("× No match");
  for (const [target, text] of [
    ["rules-code", 'start "#"\n6 hex digits\nend'],
    ["regex-code", "/^#[0-9A-Fa-f]{6}$/u"],
  ]) {
    await page.locator(`[data-copy="${target}"]`).click();
    await expect.poll(() => page.evaluate(() => window.copiedText), { timeout: 1500 }).toBe(text);
  }
  await pendingRecipe.fulfill({ json: recipes });
  await expect(page.locator('[data-recipe="hex-color"]')).toBeEnabled();
  await expect(page.locator("#demo-input")).toHaveValue("#123");
  await page.locator('[data-recipe="prefixed-identifier"]').click();
  await expect(page.locator("#regex-code")).toHaveText("/^ABC\\d{3}$/u");
});

test("the static workshop serves its README and each linked root document intact", async ({
  request,
}) => {
  for (const name of ["README.md", "CHANGELOG.md", "SECURITY.md", "LICENSE"]) {
    const response = await request.get(`/workshop/${name}`);
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe(
      readFileSync(new URL(`../../${name}`, import.meta.url), "utf8"),
    );
  }
});
