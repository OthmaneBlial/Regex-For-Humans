import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

test("the static build versions independent copies of linked files without rewriting their targets", (t) => {
  const scratch = mkdtempSync(join(tmpdir(), "regex-for-humans-web-links-"));
  const root = join(scratch, "project");
  const originals = join(scratch, "originals");
  const linked = [
    ["web/app.js", 'import "../index.js";\n'],
    ["web/index.html", '<script type="module" src="./app.js"></script>DEVELOPMENT BUILD'],
    ["web/styles.css", "body { color: black; }\n"],
    ["src/compiler.js", "export const ready = true;\n"],
    ["index.js", 'export * from "./src/compiler.js";\n'],
    ["docs/LANGUAGE.md", "# Language guide\n"],
    ["README.md", "# Linked README\n"],
    ["test/fixtures/product-scenarios.json", "[]\n"],
  ];
  try {
    for (const directory of ["scripts", "web", "src", "docs", "test/fixtures"]) {
      mkdirSync(join(root, directory), { recursive: true });
    }
    const script = join(root, "scripts", "build-web.js");
    cpSync(new URL("../scripts/build-web.js", import.meta.url), script);
    writeFileSync(join(root, "package.json"), JSON.stringify({ version: "0.1.0-dev" }));
    writeFileSync(join(root, "web", "language.html"), "<h1>DEVELOPMENT BUILD</h1>");
    for (const name of ["CHANGELOG.md", "SECURITY.md", "LICENSE"]) {
      writeFileSync(join(root, name), name);
    }
    for (const [path, content] of linked) {
      const original = join(originals, path);
      mkdirSync(dirname(original), { recursive: true });
      writeFileSync(original, content);
      try {
        symlinkSync(original, join(root, path), "file");
      } catch (error) {
        if (process.platform === "win32" && ["EPERM", "EACCES"].includes(error.code)) {
          t.skip("File symlinks require Windows Developer Mode or elevated permissions.");
          return;
        }
        throw error;
      }
    }
    const result = spawnSync(process.execPath, [script], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    for (const [path, content] of linked) {
      assert.equal(readFileSync(join(originals, path), "utf8"), content, path);
      assert.equal(lstatSync(join(root, "dist", path)).isSymbolicLink(), false, path);
    }
    assert.match(
      readFileSync(join(root, "dist", "web", "app.js"), "utf8"),
      /import "\.\.\/index\.js\?v=[\da-f]{12}";/u,
    );
    assert.match(
      readFileSync(join(root, "dist", "index.js"), "utf8"),
      /export \* from "\.\/src\/compiler\.js\?v=[\da-f]{12}";/u,
    );
    assert.match(
      readFileSync(join(root, "dist", "web", "index.html"), "utf8"),
      /src="\.\/app\.js\?v=[\da-f]{12}".*DEV · 0\.1\.0-dev/u,
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
