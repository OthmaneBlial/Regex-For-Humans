import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("documentation checks ignore URL queries without stripping encoded filename characters", () => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-doc-query-"));
  try {
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "docs", "guide.md"), "# Guide\n");
    writeFileSync(join(root, "docs", "hash#name.md"), "# Hash\n");
    const links =
      "[Guide](docs/guide.md?v=1#section)\n" +
      "[Query data](docs/guide.md?v=%ZZ)\n" +
      "[Current page](?view=1#intro)\n" +
      "[Encoded hash](docs/hash%23name.md?raw=1)\n";
    writeFileSync(join(root, "README.md"), links);
    const check = () =>
      spawnSync(
        process.execPath,
        [fileURLToPath(new URL("../scripts/check-doc-links.js", import.meta.url)), root],
        { encoding: "utf8" },
      );
    const valid = check();
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(valid.stderr, "");
    assert.equal(valid.stdout, "Checked 3 local Markdown links in 3 files.\n");
    writeFileSync(join(root, "README.md"), `${links}[Missing](docs/missing.md?view=1#intro)\n`);
    const missing = check();
    assert.equal(missing.status, 1);
    assert.equal(missing.stdout, "");
    assert.equal(
      missing.stderr,
      "Missing local Markdown links:\nREADME.md: docs/missing.md?view=1#intro\n",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("documentation checks report malformed escapes and missing links together, then recover", () => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-doc-links-"));
  try {
    mkdirSync(join(root, "docs"));
    mkdirSync(join(root, ".github"));
    writeFileSync(
      join(root, "README.md"),
      "[Broken escape](docs/%ZZ.md)\n[Incomplete](docs/%2.md)\n" +
        "[Invalid UTF-8](docs/%FF.md)\n[Missing](docs/missing.md#section)\n",
    );
    writeFileSync(join(root, "docs", "guide.md"), "[Missing sibling](gone.md)\n");
    writeFileSync(
      join(root, ".github", "pull_request_template.md"),
      "[Missing root](../absent.md)\n",
    );
    const check = () =>
      spawnSync(
        process.execPath,
        [fileURLToPath(new URL("../scripts/check-doc-links.js", import.meta.url)), root],
        { encoding: "utf8" },
      );
    const invalid = check();
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
    assert.equal(
      invalid.stderr,
      "Missing local Markdown links:\n" +
        "README.md: docs/%ZZ.md (invalid URL escape)\n" +
        "README.md: docs/%2.md (invalid URL escape)\n" +
        "README.md: docs/%FF.md (invalid URL escape)\n" +
        "README.md: docs/missing.md#section\n" +
        "docs/guide.md: gone.md\n" +
        ".github/pull_request_template.md: ../absent.md\n",
    );

    writeFileSync(join(root, "docs", "space name.md"), "# Space\n");
    writeFileSync(join(root, "README.md"), "[Guide](docs/guide.md#section)\n");
    writeFileSync(
      join(root, "docs", "guide.md"),
      "[Encoded](space%20name.md)\n[Root](../README.md)\n[Section](#section)\n" +
        "[External](https://example.com/%ZZ)\n[Email](mailto:hello@example.com)\n",
    );
    writeFileSync(join(root, ".github", "pull_request_template.md"), "[Guide](../docs/guide.md)\n");
    const repaired = check();
    assert.equal(repaired.status, 0, repaired.stderr);
    assert.equal(repaired.stderr, "");
    assert.equal(repaired.stdout, "Checked 4 local Markdown links in 4 files.\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
