import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const buildLabel = version.includes("-") ? `DEV · ${version}` : `v${version}`;
rmSync(output, { recursive: true, force: true });
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
for (const name of ["index.html", "language.html"]) {
  const html = readFileSync(join(root, "web", name), "utf8").replaceAll(
    "DEVELOPMENT BUILD",
    buildLabel,
  );
  writeFileSync(join(output, "web", name), html);
  if (name === "index.html") {
    writeFileSync(
      join(output, "index.html"),
      html.replace("<head>", '<head>\n  <base href="./web/">'),
    );
  }
}
process.stdout.write(`Built static workshop in ${output}\n`);
