import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const packageFile = fileURLToPath(new URL("../package.json", import.meta.url));
const { version } = JSON.parse(readFileSync(packageFile, "utf8"));
const tag = process.env.RELEASE_TAG ?? "";

if (!/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(tag) || tag !== `v${version}`) {
  process.stderr.write(`Stable tag ${tag || "(missing)"} does not match package ${version}.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Stable tag ${tag} matches package ${version}.\n`);
}
