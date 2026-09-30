import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL("../", import.meta.url));
const files = [
  ...readdirSync(root).filter((name) => name.endsWith(".md")),
  ...readdirSync(resolve(root, "docs"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => `docs/${name}`),
];
if (existsSync(resolve(root, ".github/pull_request_template.md"))) {
  files.push(".github/pull_request_template.md");
}
let checked = 0;
const missing = [];

for (const file of files) {
  const content = readFileSync(resolve(root, file), "utf8");
  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split(/[?#]/u, 1)[0];
    if (!target || /^(?:https?:|mailto:)/u.test(target)) continue;
    checked += 1;
    let decoded;
    try {
      decoded = decodeURIComponent(target);
    } catch (error) {
      if (!(error instanceof URIError)) throw error;
      missing.push(`${file}: ${match[1]} (invalid URL escape)`);
      continue;
    }
    if (!existsSync(resolve(root, dirname(file), decoded))) {
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
