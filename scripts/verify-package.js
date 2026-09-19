import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this script with npm run test:package.");

function run(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: options.cwd ?? root,
    input: options.input,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${args.join(" ")} failed:\n${result.stdout}${result.stderr}`);
  }
  return result.stdout.trim();
}

const scratch = mkdtempSync(join(tmpdir(), "regex-for-humans-package-"));
const output = process.env.PACK_OUTPUT_DIR ? resolve(process.env.PACK_OUTPUT_DIR) : scratch;
const consumer = join(scratch, "consumer");
mkdirSync(output, { recursive: true });
mkdirSync(consumer);

try {
  const packJson = run([npmCli, "pack", "--json", "--pack-destination", output]);
  const packageInfo = JSON.parse(packJson)[0];
  const tarball = join(output, packageInfo.filename);
  if (!existsSync(tarball)) throw new Error("npm pack did not create its reported tarball.");
  run([
    npmCli,
    "install",
    "--prefix",
    consumer,
    "--no-audit",
    "--no-fund",
    "--ignore-scripts",
    tarball,
  ]);

  const installed = join(consumer, "node_modules", ...packageInfo.name.split("/"));
  const manifest = JSON.parse(readFileSync(join(installed, "package.json"), "utf8"));
  if (manifest.bin?.["regex-for-humans"] !== "./bin/regex-for-humans.js") {
    throw new Error("The installed package does not expose the expected CLI binary.");
  }
  const binLink = join(
    consumer,
    "node_modules",
    ".bin",
    `regex-for-humans${process.platform === "win32" ? ".cmd" : ""}`,
  );
  if (!existsSync(binLink)) throw new Error("npm install did not create the CLI binary link.");

  const rules = 'at the beginning of the input\na "ABC"\ndigit character 3 times\nend of the input';
  const smoke = join(consumer, "smoke.mjs");
  writeFileSync(
    smoke,
    `import { compile, toRegExp, CompileError } from "regex-for-humans";
const result = compile(${JSON.stringify(rules)});
if (result.source !== "^ABC\\\\d{3}$" || result.flags !== "u") throw new Error("Wrong source or flags");
if (!toRegExp(result).test("ABC123") || toRegExp(result).test("ABC12")) throw new Error("Wrong matching behavior");
if (result.segments.length !== 4 || !result.segments[2].explanation) throw new Error("Missing trace");
try { compile("unsupported words"); throw new Error("Unknown rule accepted"); }
catch (error) { if (!(error instanceof CompileError)) throw error; }
`,
  );
  run([smoke], { cwd: consumer });
  const bin = join(installed, "bin", "regex-for-humans.js");
  const version = run([bin, "--version"], { cwd: consumer });
  if (version !== manifest.version) throw new Error("Installed CLI reported a different version.");
  const cliResult = JSON.parse(run([bin, "--json", "-"], { cwd: consumer, input: rules }));
  if (cliResult.source !== "^ABC\\d{3}$" || cliResult.flags !== "u") {
    throw new Error("Installed CLI produced an unexpected expression.");
  }
  process.stdout.write(
    `Verified ${packageInfo.filename} (${packageInfo.size} bytes) in a clean consumer.\n`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
