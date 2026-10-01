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

function readDestination(content, start) {
  const angle = content[start] === "<";
  let destination = "";
  let depth = 0;
  let index = start + Number(angle);
  for (; index < content.length; index += 1) {
    const character = content[index];
    const escaped = content[index + 1] ?? "";
    if (character === "\\" && /[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/u.test(escaped)) {
      destination += escaped;
      index += 1;
      continue;
    }
    if (angle) {
      if (character === ">") break;
      if (/[\r\n<]/u.test(character)) return null;
    } else {
      if (content.charCodeAt(index) <= 0x20 || content.charCodeAt(index) === 0x7f) break;
      if (character === "(") depth += 1;
      else if (character === ")") {
        if (depth === 0) break;
        depth -= 1;
      }
    }
    destination += character;
  }
  if (index === content.length || depth !== 0) return null;
  const end = content.indexOf(")", index + Number(angle));
  return end < 0 ? null : { destination, end: end + 1 };
}

for (const file of files) {
  const content = readFileSync(resolve(root, file), "utf8");
  // ponytail: scan inline syntax only; use a Markdown parser to resolve references and ignore code.
  const links = /\]\([ \t\r\n]*/g;
  for (let match = links.exec(content); match; match = links.exec(content)) {
    const result = readDestination(content, links.lastIndex);
    if (!result) continue;
    links.lastIndex = result.end;
    const { destination } = result;
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
