import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("documentation checks resolve balanced and escaped destination parentheses without truncation", () => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-doc-balanced-"));
  try {
    mkdirSync(join(root, "docs"));
    const deep = `nested${"(".repeat(12)}v${")".repeat(12)}.md`;
    const names = [
      "review(1).md",
      "nested(a(b(c))).md",
      "unbalanced(.md",
      "unbalanced).md",
      "sequence](link).md",
      "guide.md",
      "nbsp\u00a0(1).md",
      deep,
    ];
    for (const name of names) writeFileSync(join(root, "docs", name), "# Guide\n");
    const links = [
      "[Review](docs/review(1).md)",
      '[Nested](docs/nested(a(b(c))).md "Review (v1)")',
      String.raw`[Escaped](docs/review\(1\).md)`,
      String.raw`[Opening](docs/unbalanced\(.md)`,
      String.raw`[Closing](docs/unbalanced\).md)`,
      String.raw`[Angle escaped](<docs/review\(1\).md>)`,
      "[Query](docs/review(1).md?view=(1)#intro)",
      `[Deep](docs/${deep})`,
      "[Unicode](docs/nbsp\u00a0(1).md)",
      "[Adjacent](docs/sequence](link).md)[Guide](docs/guide.md)",
      "![Image](docs/review(1).md)",
    ].join("\n");
    const check = () =>
      spawnSync(
        process.execPath,
        [fileURLToPath(new URL("../scripts/check-doc-links.js", import.meta.url)), root],
        { encoding: "utf8" },
      );
    writeFileSync(join(root, "README.md"), links);
    const valid = check();
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(valid.stderr, "");
    assert.equal(valid.stdout, "Checked 12 local Markdown links in 9 files.\n");
    writeFileSync(
      join(root, "README.md"),
      `${links}\n` +
        '[Missing](docs/missing(1).md?view=(1)#intro "Title")\n' +
        String.raw`[Escaped missing](docs/missing\(2\).md)` +
        "\n[Bad escape](docs/%ZZ(1).md)\n",
    );
    const invalid = check();
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
    assert.equal(
      invalid.stderr,
      "Missing local Markdown links:\n" +
        "README.md: docs/missing(1).md?view=(1)#intro\n" +
        "README.md: docs/missing(2).md\n" +
        "README.md: docs/%ZZ(1).md (invalid URL escape)\n",
    );
    writeFileSync(join(root, "README.md"), links);
    assert.equal(check().status, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("documentation checks consume complete titles without treating their text as links", () => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-doc-title-end-"));
  try {
    mkdirSync(join(root, "docs"));
    for (const name of ["guide.md", "next.md"]) {
      writeFileSync(join(root, "docs", name), "# Guide\n");
    }
    const titles = [
      '"Read ) and ](ghost.md)"',
      "'Read ) and ](ghost.md)'",
      String.raw`"Read \"quote\" ) and ](ghost.md)"`,
      String.raw`'Read \'quote\' ) and ](ghost.md)'`,
      String.raw`(Read \) and ]\(ghost.md\))`,
      String.raw`"Read \\) and ](ghost.md)"`,
      '"Read )\ncontinued ](ghost.md)"',
      '""',
      "''",
      "()",
    ];
    const links = titles
      .flatMap((title) => [
        `[Guide](docs/guide.md ${title})[Next](docs/next.md)`,
        `![Image](<docs/guide.md> ${title})[Next](docs/next.md)`,
      ])
      .join("\n");
    const check = () =>
      spawnSync(
        process.execPath,
        [fileURLToPath(new URL("../scripts/check-doc-links.js", import.meta.url)), root],
        { encoding: "utf8" },
      );
    writeFileSync(join(root, "README.md"), links);
    const valid = check();
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(valid.stderr, "");
    assert.equal(valid.stdout, "Checked 40 local Markdown links in 3 files.\n");
    writeFileSync(
      join(root, "README.md"),
      `${links}\n` +
        '[Missing](docs/missing.md?view=1#intro "Read ) and ](ghost.md)")\n' +
        "[Bad escape](<docs/%ZZ.md> 'Read ) and ](ghost.md)')\n",
    );
    const invalid = check();
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
    assert.equal(
      invalid.stderr,
      "Missing local Markdown links:\n" +
        "README.md: docs/missing.md?view=1#intro\n" +
        "README.md: docs/%ZZ.md (invalid URL escape)\n",
    );
    writeFileSync(join(root, "README.md"), links);
    assert.equal(check().status, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("documentation checks ignore ASCII scheme case without ignoring Unicode lookalikes", () => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-doc-scheme-"));
  try {
    mkdirSync(join(root, "docs"));
    const links = ["[Local](README.md)"];
    for (const name of ["http", "https", "mailto"]) {
      for (const scheme of [name, name.toUpperCase(), name[0].toUpperCase() + name.slice(1)]) {
        const destination = `${scheme}:${name === "mailto" ? "hello@example.com" : "//example.com/%ZZ"}`;
        links.push(`[External](${destination})`, `[Titled](<${destination}> "External")`);
      }
    }
    const check = () =>
      spawnSync(
        process.execPath,
        [fileURLToPath(new URL("../scripts/check-doc-links.js", import.meta.url)), root],
        { encoding: "utf8" },
      );
    writeFileSync(join(root, "README.md"), links.join("\n"));
    const valid = check();
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(valid.stderr, "");
    assert.equal(valid.stdout, "Checked 1 local Markdown links in 1 files.\n");
    writeFileSync(join(root, "README.md"), `${links.join("\n")}\n[Lookalike](httpſ:missing.md)\n`);
    const invalid = check();
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
    assert.equal(invalid.stderr, "Missing local Markdown links:\nREADME.md: httpſ:missing.md\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("documentation checks unwrap angle-bracket destinations before resolving links", () => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-doc-angle-"));
  try {
    mkdirSync(join(root, "docs"));
    for (const name of [
      "guide.md",
      "space name.md",
      "review(1).md",
      "review(1.md",
      "hash#name.md",
    ]) {
      writeFileSync(join(root, "docs", name), "# Guide\n");
    }
    const links =
      "[Guide](<docs/guide.md>)\n" +
      '[Space](<docs/space name.md> "Read (v1)")\n' +
      "[Parentheses]( <docs/review(1).md> 'Review')\n" +
      "[Unbalanced](<docs/review(1.md>)\n" +
      "[Encoded hash](<docs/hash%23name.md?view=1#intro>)\n" +
      "[Empty](<>)\n[Section](<#intro>)\n[Query](<?view=1>)\n" +
      "[External](<https://example.com/(guide)?bad=%ZZ>)\n" +
      "[HTTP](<http://example.com>)\n[Email](<mailto:hello@example.com>)\n";
    const check = () =>
      spawnSync(
        process.execPath,
        [fileURLToPath(new URL("../scripts/check-doc-links.js", import.meta.url)), root],
        { encoding: "utf8" },
      );
    writeFileSync(join(root, "README.md"), links);
    const valid = check();
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(valid.stderr, "");
    assert.equal(valid.stdout, "Checked 5 local Markdown links in 6 files.\n");
    writeFileSync(
      join(root, "README.md"),
      links +
        '[Missing](<docs/missing (1).md?view=1#intro> "Optional title")\n' +
        "[Bad escape](<docs/%ZZ.md> 'Broken')\n",
    );
    const invalid = check();
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
    assert.equal(
      invalid.stderr,
      "Missing local Markdown links:\n" +
        "README.md: docs/missing (1).md?view=1#intro\n" +
        "README.md: docs/%ZZ.md (invalid URL escape)\n",
    );
    writeFileSync(join(root, "README.md"), links);
    assert.equal(check().status, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("documentation checks resolve destinations separately from optional link titles", () => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-doc-titles-"));
  try {
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "docs", "guide.md"), "# Guide\n");
    writeFileSync(join(root, "docs", "space name.md"), "# Space\n");
    writeFileSync(join(root, "docs", "author's.md"), "# Author\n");
    const links =
      '[Guide](docs/guide.md "Read the guide")\n' +
      "[Single](docs/guide.md 'Read the guide')\n" +
      "[Parentheses](docs/guide.md (Read the guide))\n" +
      '[Punctuation](docs/guide.md "Guide (v1)? #intro")\n' +
      '[Query](docs/guide.md?view=1#intro "Guide")\n' +
      '[Encoded space](docs/space%20name.md "Space")\n' +
      "[Filename quote](docs/author's.md)\n" +
      '[Section](#intro "Introduction")\n';
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
    assert.equal(valid.stdout, "Checked 7 local Markdown links in 4 files.\n");
    writeFileSync(
      join(root, "README.md"),
      links +
        '[Missing](docs/missing.md?view=1#intro "Optional title")\n' +
        "[Bad escape](docs/%ZZ.md 'Broken')\n",
    );
    const invalid = check();
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
    assert.equal(
      invalid.stderr,
      "Missing local Markdown links:\n" +
        "README.md: docs/missing.md?view=1#intro\n" +
        "README.md: docs/%ZZ.md (invalid URL escape)\n",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

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
