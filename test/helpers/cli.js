import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const cli = fileURLToPath(new URL("../../bin/regex-for-humans.js", import.meta.url));
export const scenarios = JSON.parse(
  readFileSync(new URL("../fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

/** Run the CLI synchronously; the CLI suite is split across files so Node runs them in parallel. */
export function run(args, input) {
  return spawnSync(process.execPath, [cli, ...args], { input, encoding: "utf8" });
}
