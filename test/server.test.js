import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import test from "node:test";
import { fileURLToPath } from "node:url";

async function startServer(t, root) {
  const script = fileURLToPath(new URL("../scripts/serve-dist.js", import.meta.url));
  const child = spawn(process.execPath, [script, "0", root], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  const output = createInterface({ input: child.stdout });
  t.after(async () => {
    output.close();
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
  });
  const [line] = await once(output, "line", { signal: t.signal });
  const address = line.match(/ at (http:\/\/127\.0\.0\.1:(\d+)\/)$/u);
  assert.ok(address, "The startup message needs a loopback URL.");
  assert.ok(Number(address[2]) > 0, "The startup URL must use the actual assigned port.");
  return address[1];
}

test("the local server reports its assigned port and serves its selected root", {
  timeout: 10000,
}, async (t) => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-server-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "nested"));
  writeFileSync(join(root, "index.html"), "<h1>Local workshop</h1>");
  writeFileSync(join(root, "nested", "app.js"), "export const ready = true;\n");
  const address = await startServer(t, root);
  const index = await fetch(address, { signal: t.signal });
  assert.equal(index.status, 200);
  assert.equal(index.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(index.headers.get("x-content-type-options"), "nosniff");
  assert.equal(await index.text(), "<h1>Local workshop</h1>");
  const asset = await fetch(new URL("nested/app.js", address), { signal: t.signal });
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get("content-type"), "text/javascript; charset=utf-8");
  assert.equal(await asset.text(), "export const ready = true;\n");
  const missing = await fetch(new URL("missing.html", address), { signal: t.signal });
  assert.equal(missing.status, 404);
});

test("the local server reports nonexistent paths below files as not found", {
  timeout: 10000,
}, async (t) => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-server-not-directory-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "nested"));
  writeFileSync(join(root, "nested", "app.js"), "export const ready = true;\n");
  const address = await startServer(t, root);
  for (const path of [
    "nested/app.js/child",
    "nested/app.js/",
    "nested/app.js/child/index.html",
    "nested/app.js%2Fchild",
  ]) {
    for (const method of ["GET", "HEAD"]) {
      const response = await fetch(`${address}${path}?v=missing`, { method, signal: t.signal });
      assert.equal(response.status, 404, `${method} ${path}`);
      assert.equal(response.headers.get("location"), null);
      assert.equal(await response.text(), "");
    }
  }
  const malformed = await fetch(`${address}%ZZ`, { signal: t.signal });
  assert.equal(malformed.status, 400);
  assert.equal(await malformed.text(), "");
  const asset = await fetch(`${address}nested/app.js`, { signal: t.signal });
  assert.equal(asset.status, 200);
  assert.equal(await asset.text(), "export const ready = true;\n");
});

test("the local server classifies known asset extensions regardless of case", {
  timeout: 10000,
}, async (t) => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-server-mime-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const address = await startServer(t, root);
  for (const [extension, type] of [
    ["html", "text/html; charset=utf-8"],
    ["js", "text/javascript; charset=utf-8"],
    ["css", "text/css; charset=utf-8"],
    ["json", "application/json; charset=utf-8"],
    ["md", "text/markdown; charset=utf-8"],
    ["png", "image/png"],
    ["svg", "image/svg+xml"],
    ["woff2", "font/woff2"],
    ["bin", "application/octet-stream"],
  ]) {
    for (const variant of [
      extension,
      extension.toUpperCase(),
      extension[0].toUpperCase() + extension.slice(1),
    ]) {
      const path = `asset.${variant}`;
      const content = `Fixture for ${variant}`;
      writeFileSync(join(root, path), content);
      for (const method of ["GET", "HEAD"]) {
        const response = await fetch(`${address}${path}?v=case`, { method, signal: t.signal });
        assert.equal(response.status, 200, `${method} ${path}`);
        assert.equal(response.headers.get("content-type"), type, `${method} ${path}`);
        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
        assert.equal(await response.text(), method === "GET" ? content : "");
      }
    }
  }
});

test("the local server redirects encoded forward slashes before resolving relative assets", {
  timeout: 10000,
}, async (t) => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-server-encoded-slash-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const content = '<script src="./app.js"></script>';
  const script = "export const ready = true;\n";
  for (const name of ["nested", "résumé notes", "example.com", "literal%2Fname"]) {
    mkdirSync(join(root, name));
    writeFileSync(join(root, name, "index.html"), content);
    writeFileSync(join(root, name, "app.js"), script);
  }
  writeFileSync(join(root, "index.html"), content);
  writeFileSync(join(root, "app.js"), script);
  const address = await startServer(t, root);
  const query = "?example=hex-color&text=a%2Fb%20c";
  for (const [path, canonical] of [
    ["nested%2F", "nested/"],
    ["nested%2findex.html", "nested/index.html"],
    ["nested%2Fapp.js", "nested/app.js"],
    ["r%C3%A9sum%C3%A9%20notes%2F", "r%C3%A9sum%C3%A9%20notes/"],
    ["r%C3%A9sum%C3%A9%20notes%2findex.html", "r%C3%A9sum%C3%A9%20notes/index.html"],
    ["%2Fexample.com", "example.com/"],
    ["%2F%2Fexample.com%2Findex.html", "example.com/index.html"],
    ["%2F", ""],
  ]) {
    for (const method of ["GET", "HEAD"]) {
      const redirected = await fetch(`${address}${path}${query}`, {
        method,
        redirect: "manual",
        signal: t.signal,
      });
      assert.equal(redirected.status, 308, `${method} ${path}`);
      assert.equal(redirected.headers.get("location"), `/${canonical}${query}`);
      assert.equal(await redirected.text(), "");
      const followed = await fetch(`${address}${path}${query}`, { method, signal: t.signal });
      assert.equal(followed.status, 200);
      assert.equal(followed.url, `${address}${canonical}${query}`);
      const body = canonical.endsWith("app.js") ? script : content;
      assert.equal(await followed.text(), method === "GET" ? body : "");
      const asset = await fetch(new URL("./app.js", followed.url), { signal: t.signal });
      assert.equal(asset.status, 200);
      assert.equal(await asset.text(), script);
    }
  }
  const literal = await fetch(`${address}literal%252Fname/index.html${query}`, {
    redirect: "manual",
    signal: t.signal,
  });
  assert.equal(literal.status, 200, "Double-encoded percent text stays filename data");
  assert.equal(literal.headers.get("location"), null);
  assert.equal(await literal.text(), content);
  for (const path of ["missing%2Findex.html", "nested%2Fapp.js%2Fchild", "missing%2F"]) {
    const missing = await fetch(`${address}${path}${query}`, {
      redirect: "manual",
      signal: t.signal,
    });
    assert.equal(missing.status, 404);
    assert.equal(missing.headers.get("location"), null);
    assert.equal(await missing.text(), "");
  }
});

test("the local server redirects directory URLs while preserving encoded paths and queries", {
  timeout: 10000,
}, async (t) => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-server-directory-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of ["nested", "résumé notes"]) {
    mkdirSync(join(root, name));
    writeFileSync(join(root, name, "index.html"), '<script src="./app.js"></script>');
    writeFileSync(join(root, name, "app.js"), "export const ready = true;\n");
  }
  mkdirSync(join(root, "no-index"));
  const address = await startServer(t, root);
  for (const name of ["nested", "résumé notes"]) {
    const path = encodeURIComponent(name);
    const query = "?example=hex-color&text=a%2Fb%20c";
    for (const method of ["GET", "HEAD"]) {
      const redirect = await fetch(`${address}${path}${query}`, {
        method,
        redirect: "manual",
        signal: t.signal,
      });
      assert.equal(redirect.status, 308);
      assert.equal(redirect.headers.get("location"), `/${path}/${query}`);
      assert.equal(await redirect.text(), "");
    }
    const page = await fetch(`${address}${path}${query}`, { signal: t.signal });
    assert.equal(page.status, 200);
    assert.equal(page.url, `${address}${path}/${query}`);
    assert.equal(await page.text(), '<script src="./app.js"></script>');
    const asset = await fetch(new URL("./app.js", page.url), { signal: t.signal });
    assert.equal(asset.status, 200);
    assert.equal(await asset.text(), "export const ready = true;\n");
  }
  const missingIndex = await fetch(`${address}no-index`, { signal: t.signal });
  assert.equal(missingIndex.status, 404);
  const missingPath = await fetch(`${address}missing?example=hex-color`, {
    redirect: "manual",
    signal: t.signal,
  });
  assert.equal(missingPath.status, 404);
  assert.equal(missingPath.headers.get("location"), null);
});

test("the local server confines symlink targets to its selected root", {
  timeout: 10000,
}, async (t) => {
  const scratch = mkdtempSync(join(tmpdir(), "regex-for-humans-server-links-"));
  t.after(() => rmSync(scratch, { recursive: true, force: true }));
  const root = join(scratch, "site");
  const outside = join(scratch, "site-outside");
  const alias = join(scratch, "site-alias");
  mkdirSync(join(root, "nested"), { recursive: true });
  mkdirSync(outside);
  writeFileSync(join(root, "index.html"), "<h1>Selected root</h1>");
  writeFileSync(join(root, "nested", "index.html"), "<h1>Inside root</h1>");
  writeFileSync(join(outside, "index.html"), "Outside root sentinel");
  symlinkSync(root, alias, "junction");
  symlinkSync(root, join(root, "root alias"), "junction");
  symlinkSync(join(root, "nested"), join(root, "inside"), "junction");
  symlinkSync(outside, join(root, "outside"), "junction");
  const address = await startServer(t, alias);
  for (const path of [
    "outside",
    "outside/",
    "outside/index.html",
    "outside%2Findex.html",
    "%2Foutside%2Findex.html",
    "%2e%2e%2fsite-outside/index.html",
  ]) {
    for (const method of ["GET", "HEAD"]) {
      const response = await fetch(new URL(path, address), {
        method,
        redirect: "manual",
        signal: t.signal,
      });
      assert.equal(response.status, 403, `${method} ${path}`);
      assert.equal(response.headers.get("location"), null);
      assert.equal(await response.text(), "", path);
    }
  }
  for (const path of ["inside", "root%20alias"]) {
    for (const method of ["GET", "HEAD"]) {
      const redirect = await fetch(new URL(`${path}?example=hex-color`, address), {
        method,
        redirect: "manual",
        signal: t.signal,
      });
      assert.equal(redirect.status, 308, `${method} ${path}`);
      assert.equal(redirect.headers.get("location"), `/${path}/?example=hex-color`);
      assert.equal(await redirect.text(), "");
    }
  }
  for (const [path, content] of [
    ["", "<h1>Selected root</h1>"],
    ["root%20alias/", "<h1>Selected root</h1>"],
    ["root%20alias/index.html", "<h1>Selected root</h1>"],
    ["inside/", "<h1>Inside root</h1>"],
    ["inside/index.html", "<h1>Inside root</h1>"],
  ]) {
    const response = await fetch(new URL(path, address), { signal: t.signal });
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
    assert.equal(await response.text(), content, path);
  }
});
