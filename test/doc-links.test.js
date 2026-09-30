import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
