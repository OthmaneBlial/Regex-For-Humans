import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/verify-package.js", import.meta.url));
const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const filename = `${manifest.name}-${manifest.version}.tgz`;

function fixture() {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "regex-for-humans-archive-test-")));
  const npmCli = join(directory, "fake npm.cjs");
  const calls = join(directory, "calls.jsonl");
  writeFileSync(
    npmCli,
    `const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.PACKAGE_TEST_CALLS, JSON.stringify(args) + "\\n");
if (args[0] === "pack") {
  const destination = args[args.indexOf("--pack-destination") + 1];
  fs.writeFileSync(path.join(destination, ${JSON.stringify(filename)}), "new fixture archive");
  console.log(JSON.stringify([{name: ${JSON.stringify(manifest.name)}, filename: ${JSON.stringify(filename)}, size: 19}]));
} else {
  console.error("Stopped at clean consumer installation.");
  process.exitCode = 19;
}
`,
  );
  return {
    directory,
    run(args = [], output = "") {
      const result = spawnSync(process.execPath, [script, ...args], {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          npm_execpath: npmCli,
          PACK_OUTPUT_DIR: output,
          PACKAGE_TEST_CALLS: calls,
        },
      });
      assert.equal(result.error, undefined);
      return result;
    },
    calls() {
      return existsSync(calls)
        ? readFileSync(calls, "utf8")
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line))
        : [];
    },
  };
}

test("existing archive verification installs the supplied bytes without packing or replacing them", () => {
  const setup = fixture();
  try {
    mkdirSync(join(setup.directory, "sealed source"));
    const archive = join(setup.directory, "sealed source", "retained bytes.tgz");
    const bytes = Buffer.from([0, 1, 2, 127, 128, 255]);
    writeFileSync(archive, bytes);
    const result = setup.run(["--tarball", "sealed source/retained bytes.tgz"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Stopped at clean consumer installation/u);
    const calls = setup.calls();
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "install");
    assert.ok(calls[0].includes("--ignore-scripts"));
    assert.equal(calls[0].at(-1), archive);
    assert.deepEqual(readFileSync(archive), bytes);
  } finally {
    rmSync(setup.directory, { recursive: true, force: true });
  }
});

test("packing cannot overwrite an existing retained archive or start its consumer", () => {
  const setup = fixture();
  try {
    const output = join(setup.directory, "sealed output");
    mkdirSync(output);
    const archive = join(output, filename);
    writeFileSync(archive, "immutable release bytes");
    const result = setup.run([], output);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Refusing to overwrite retained archive/u);
    assert.equal(readFileSync(archive, "utf8"), "immutable release bytes");
    const calls = setup.calls();
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "pack");
    assert.notEqual(calls[0][calls[0].indexOf("--pack-destination") + 1], output);
  } finally {
    rmSync(setup.directory, { recursive: true, force: true });
  }
});

test("invalid archive arguments and mixed retention modes fail before npm runs", () => {
  const setup = fixture();
  try {
    const archive = join(setup.directory, "existing.tgz");
    writeFileSync(archive, "retained fixture bytes");
    for (const args of [["--unknown"], ["--tarball"], ["--tarball", archive, "extra"]]) {
      assert.match(setup.run(args).stderr, /Usage: npm run test:package/u);
    }
    assert.match(
      setup.run(["--tarball", archive], join(setup.directory, "output")).stderr,
      /Use --tarball without PACK_OUTPUT_DIR/u,
    );
    assert.match(setup.run(["--tarball", setup.directory]).stderr, /existing archive file/u);
    assert.match(setup.run(["--tarball", "missing.tgz"]).stderr, /ENOENT/u);
    assert.deepEqual(setup.calls(), []);
    assert.equal(readFileSync(archive, "utf8"), "retained fixture bytes");
  } finally {
    rmSync(setup.directory, { recursive: true, force: true });
  }
});

test("a failed clean consumer never retains an unverified new archive", () => {
  const setup = fixture();
  try {
    const output = join(setup.directory, "not yet retained");
    const result = setup.run([], output);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Stopped at clean consumer installation/u);
    assert.deepEqual(
      setup.calls().map((args) => args[0]),
      ["pack", "install"],
    );
    assert.equal(existsSync(output), false);
  } finally {
    rmSync(setup.directory, { recursive: true, force: true });
  }
});
