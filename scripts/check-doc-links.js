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
  // ponytail: scan inline links only; use a Markdown parser if reference links are needed.
  for (const match of content.matchAll(/\]\(\s*(?:<([^<>\r\n]*)>[^)]*|([^)]+))\)/g)) {
    const destination = match[1] ?? match[2].trim().split(/\s+(?=["'(])/u, 1)[0];
    const target = destination.split(/[?#]/u, 1)[0];
    // URI schemes use ASCII case; /iu would also fold the Unicode long s into s.
    if (!target || /^(?:https?:|mailto:)/i.test(target)) continue;
    checked += 1;
    let decoded;
    try {
      decoded = decodeURIComponent(target);
    } catch (error) {
      if (!(error instanceof URIError)) throw error;
      missing.push(`${file}: ${destination} (invalid URL escape)`);
      continue;
    }
    if (!existsSync(resolve(root, dirname(file), decoded))) {
      missing.push(`${file}: ${destination}`);
    }
  }
}

if (missing.length) {
  process.stderr.write(`Missing local Markdown links:\n${missing.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Checked ${checked} local Markdown links in ${files.length} files.\n`);
}
