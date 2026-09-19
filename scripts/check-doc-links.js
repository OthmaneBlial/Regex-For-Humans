import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = [
  "README.md",
  "ROADMAP.md",
  "CONTRIBUTING.md",
  ...readdirSync(resolve(root, "docs"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => `docs/${name}`),
];
let checked = 0;
const missing = [];

for (const file of files) {
  const content = readFileSync(resolve(root, file), "utf8");
  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split("#", 1)[0];
    if (!target || /^(?:https?:|mailto:)/u.test(target)) continue;
    checked += 1;
    if (!existsSync(resolve(root, dirname(file), decodeURIComponent(target)))) {
      missing.push(`${file}: ${match[1]}`);
    }
  }
}

if (missing.length) {
  process.stderr.write(`Missing local Markdown links:\n${missing.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Checked ${checked} local Markdown links in ${files.length} files.\n`);
}
