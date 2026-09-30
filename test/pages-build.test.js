import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("Pages app URLs change with the homepage or compiler build and stay stable otherwise", () => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-pages-"));
  try {
    for (const directory of ["scripts", "site", "dist"]) mkdirSync(join(root, directory));
    const script = join(root, "scripts", "build-pages-workshop.js");
    cpSync(new URL("../scripts/build-pages-workshop.js", import.meta.url), script);
    for (const name of ["app.js", "index.html"]) {
      cpSync(new URL(`../site/${name}`, import.meta.url), join(root, "site", name));
    }
    const workshopPath = join(root, "dist", "index.html");
    const workshopHtml = (version) =>
      `<script type="module" src="./web/app.js?v=${version}"></script>`;
    writeFileSync(workshopPath, workshopHtml("123456abcdef"));
    const build = () => spawnSync(process.execPath, [script], { encoding: "utf8" });
    const version = () => {
      const result = build();
      assert.equal(result.status, 0, result.stderr);
      const html = readFileSync(join(root, "site", "index.html"), "utf8");
      const value = html.match(/src="\.\/app\.js\?v=([\da-f]{12})"/u)?.[1];
      assert.ok(value, "The homepage module needs a content version.");
      assert.equal(
        readFileSync(join(root, "site", "workshop", "index.html"), "utf8"),
        readFileSync(workshopPath, "utf8"),
      );
      return value;
    };
    const initial = version();
    assert.equal(version(), initial);
    const appPath = join(root, "site", "app.js");
    writeFileSync(appPath, `${readFileSync(appPath, "utf8")}\n// Changed homepage behavior.\n`);
    const changedApp = version();
    assert.notEqual(changedApp, initial);
    assert.equal(version(), changedApp);
    writeFileSync(workshopPath, workshopHtml("fedcba654321"));
    const changedCompiler = version();
    assert.notEqual(changedCompiler, changedApp);
    assert.equal(version(), changedCompiler);
    writeFileSync(workshopPath, '<script type="module" src="./web/app.js"></script>');
    const invalid = build();
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /versioned app module/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
