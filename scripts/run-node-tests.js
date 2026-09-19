import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const tests = readdirSync(resolve(root, "test"))
  .filter((name) => name.endsWith(".test.js"))
  .sort()
  .map((name) => resolve(root, "test", name));

if (tests.length === 0) throw new Error("No Node test files were found.");
const result = spawnSync(process.execPath, ["--test", ...tests], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
