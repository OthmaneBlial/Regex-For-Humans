import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { compile } from "../../index.js";

const stylesheetVersion = createHash("sha256")
  .update(readFileSync(new URL("../../site/styles.css", import.meta.url)))
  .digest("hex")
  .slice(0, 12);

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

const recipes = JSON.parse(
  readFileSync(new URL("../fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

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

test("recipe cards cover every shared recipe and open bounded invoice and username shapes", async ({
  page,
}) => {
  await page.goto("/");
  const ids = await page
    .locator(".recipe-card")
    .evaluateAll((cards) => cards.map((card) => new URL(card.href).searchParams.get("example")));
  expect(ids.sort()).toEqual(recipes.map((recipe) => recipe.id).sort());
  await expect(page.locator(".syntax-list")).toContainText("between 2 and 6 digits");
  await expect(page.locator(".syntax-list")).toContainText("letters");
  for (const id of ["invoice-number", "username-shape"]) {
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
  await expect(status).toHaveText("Clipboard access is unavailable. Select the text to copy it.");
  await expect(button).toHaveText("Copy regex");
  await page.evaluate(async () => {
    window.finishStalledCopy();
    await Promise.resolve();
    window.stallCopy = false;
  });
  await expect(status).toContainText("Select the text to copy it");
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
