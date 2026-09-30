import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("the local server reports its assigned port and serves its selected root", {
  timeout: 10000,
}, async (t) => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-server-"));
  const script = fileURLToPath(new URL("../scripts/serve-dist.js", import.meta.url));
  const child = spawn(process.execPath, [script, "0", root], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  const output = createInterface({ input: child.stdout });
  try {
    mkdirSync(join(root, "nested"));
    writeFileSync(join(root, "index.html"), "<h1>Local workshop</h1>");
    writeFileSync(join(root, "nested", "app.js"), "export const ready = true;\n");
    const [line] = await once(output, "line", { signal: t.signal });
    const address = line.match(/ at (http:\/\/127\.0\.0\.1:(\d+)\/)$/u);
    assert.ok(address, "The startup message needs a loopback URL.");
    assert.ok(Number(address[2]) > 0, "The startup URL must use the actual assigned port.");
    const index = await fetch(address[1], { signal: t.signal });
    assert.equal(index.status, 200);
    assert.equal(index.headers.get("content-type"), "text/html; charset=utf-8");
    assert.equal(index.headers.get("x-content-type-options"), "nosniff");
    assert.equal(await index.text(), "<h1>Local workshop</h1>");
    const asset = await fetch(new URL("nested/app.js", address[1]), { signal: t.signal });
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get("content-type"), "text/javascript; charset=utf-8");
    assert.equal(await asset.text(), "export const ready = true;\n");
    const missing = await fetch(new URL("missing.html", address[1]), { signal: t.signal });
    assert.equal(missing.status, 404);
  } finally {
    output.close();
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
    rmSync(root, { recursive: true, force: true });
  }
});
