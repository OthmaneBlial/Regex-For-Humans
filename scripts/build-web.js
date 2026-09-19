import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
mkdirSync(output, { recursive: true });
cpSync(join(root, "web"), join(output, "web"), { recursive: true, force: true });
cpSync(join(root, "src"), join(output, "src"), { recursive: true, force: true });
cpSync(join(root, "docs"), join(output, "docs"), { recursive: true, force: true });
cpSync(join(root, "README.md"), join(output, "README.md"));
mkdirSync(join(output, "test", "fixtures"), { recursive: true });
cpSync(
  join(root, "test", "fixtures", "product-scenarios.json"),
  join(output, "test", "fixtures", "product-scenarios.json"),
);
cpSync(join(root, "index.js"), join(output, "index.js"));
const html = readFileSync(join(root, "web", "index.html"), "utf8");
writeFileSync(join(output, "index.html"), html.replace("<head>", '<head>\n  <base href="./web/">'));
process.stdout.write(`Built static workshop in ${output}\n`);
