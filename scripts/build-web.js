import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const buildLabel = version.includes("-") ? `DEV · ${version}` : `v${version}`;

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesIn(path) : [path];
    })
    .sort();
}

const assets = createHash("sha256").update(version);
for (const directory of ["web", "src", "test/fixtures"]) {
  for (const path of filesIn(join(root, directory))) {
    assets.update(path.slice(root.length)).update(readFileSync(path));
  }
}
assets.update(readFileSync(join(root, "index.js")));
const assetVersion = assets.digest("hex").slice(0, 12);
const versionAssetUrls = (text) =>
  text.replace(
    /(["'])(\.{1,2}\/[^"'?#]+\.(?:css|html|js|json|svg))(["'])/gu,
    (_match, quote, path) => `${quote}${path}?v=${assetVersion}${quote}`,
  );

function versionJavaScript(directory) {
  for (const path of filesIn(directory).filter((file) => file.endsWith(".js"))) {
    writeFileSync(path, versionAssetUrls(readFileSync(path, "utf8")));
  }
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(join(root, "web"), join(output, "web"), { recursive: true, force: true });
cpSync(join(root, "src"), join(output, "src"), { recursive: true, force: true });
cpSync(join(root, "docs"), join(output, "docs"), { recursive: true, force: true });
for (const name of ["README.md", "CHANGELOG.md", "SECURITY.md", "LICENSE"]) {
  cpSync(join(root, name), join(output, name));
}
mkdirSync(join(output, "test", "fixtures"), { recursive: true });
cpSync(
  join(root, "test", "fixtures", "product-scenarios.json"),
  join(output, "test", "fixtures", "product-scenarios.json"),
);
cpSync(join(root, "index.js"), join(output, "index.js"));
versionJavaScript(join(output, "web"));
versionJavaScript(join(output, "src"));
writeFileSync(
  join(output, "index.js"),
  versionAssetUrls(readFileSync(join(output, "index.js"), "utf8")),
);
for (const name of ["index.html", "language.html"]) {
  const html = versionAssetUrls(
    readFileSync(join(root, "web", name), "utf8").replaceAll("DEVELOPMENT BUILD", buildLabel),
  );
  writeFileSync(join(output, "web", name), html);
  if (name === "index.html") {
    const rootHtml = html.replace(/((?:href|src)=")\.\//gu, "$1./web/");
    writeFileSync(join(output, "index.html"), rootHtml);
  }
}
process.stdout.write(`Built static workshop in ${output}\n`);
