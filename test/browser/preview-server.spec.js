import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

test("encoded preview slashes redirect before loading relative modules and styles", async ({
  page,
}) => {
  const root = mkdtempSync(join(tmpdir(), "regex-for-humans-preview-slashes-"));
  for (const name of ["nested", "résumé notes", "literal%2Fname"]) {
    mkdirSync(join(root, name));
    writeFileSync(
      join(root, name, "index.html"),
      '<link rel="stylesheet" href="./style.css"><p id="state">Loading</p><script type="module" src="./app.js"></script>',
    );
    writeFileSync(join(root, name, "style.css"), "#state { color: rgb(0, 128, 0); }");
    writeFileSync(
      join(root, name, "app.js"),
      'document.querySelector("#state").textContent = "Ready";',
    );
  }
  const server = spawn(
    process.execPath,
    [fileURLToPath(new URL("../../scripts/serve-dist.js", import.meta.url)), "0", root],
    { stdio: ["ignore", "pipe", "inherit"] },
  );
  const output = createInterface({ input: server.stdout });
  try {
    const [line] = await once(output, "line");
    const address = / at (http:\/\/127\.0\.0\.1:\d+\/)$/u.exec(line)?.[1];
    expect(address).toBeTruthy();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [path, canonical] of [
      ["nested%2F", "nested/"],
      ["nested%2findex.html", "nested/index.html"],
      ["r%C3%A9sum%C3%A9%20notes%2Findex.html", "r%C3%A9sum%C3%A9%20notes/index.html"],
      ["literal%252Fname/index.html", "literal%252Fname/index.html"],
    ]) {
      const query = "?text=a%2Fb%20c";
      const response = await page.goto(`${address}${path}${query}`);
      expect(response.status()).toBe(200);
      await expect(page).toHaveURL(`${address}${canonical}${query}`);
      await expect(page.locator("#state")).toHaveText("Ready");
      await expect(page.locator("#state")).toHaveCSS("color", "rgb(0, 128, 0)");
    }
    expect(errors).toEqual([]);
  } finally {
    output.close();
    if (server.exitCode === null && server.signalCode === null) {
      const stopped = once(server, "exit");
      server.kill();
      await stopped;
    }
    rmSync(root, { recursive: true, force: true });
  }
});
