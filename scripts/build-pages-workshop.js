import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "site", "workshop");
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(join(root, "dist"), output, { recursive: true });
const workshopVersion = readFileSync(join(output, "index.html"), "utf8").match(
  /src="\.\/web\/app\.js\?v=([\da-f]{12})"/u,
)?.[1];
if (!workshopVersion) throw new Error("The workshop build must have a versioned app module.");
const appVersion = createHash("sha256")
  .update(workshopVersion)
  .update(readFileSync(join(root, "site", "app.js")))
  .digest("hex")
  .slice(0, 12);
const stylesheetVersion = createHash("sha256")
  .update(readFileSync(join(root, "site", "styles.css")))
  .digest("hex")
  .slice(0, 12);
const homepagePath = join(root, "site", "index.html");
const homepage = readFileSync(homepagePath, "utf8");
const appReference = /src="\.\/app\.js(?:\?[^"\s]*)?"/u;
if (!appReference.test(homepage)) throw new Error("The homepage app module reference is missing.");
const stylesheetReference = /href="\.\/styles\.css(?:\?[^"\s]*)?"/u;
if (!stylesheetReference.test(homepage))
  throw new Error("The homepage stylesheet reference is missing.");
writeFileSync(
  homepagePath,
  homepage
    .replace(appReference, `src="./app.js?v=${appVersion}"`)
    .replace(stylesheetReference, `href="./styles.css?v=${stylesheetVersion}"`),
);
process.stdout.write(`Copied workshop to ${output}\n`);
