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
  run([join(root, "scripts", "check-doc-links.js"), installed], { cwd: consumer });
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

  const rules = 'start "ABC"\n3 digits\nend';
  const boundedRules = "start between 2 and 4 digits\nend";
  const boundedSource = "^\\d{2,4}$";
  const directionText = `A${String.fromCodePoint(0x202e)}B`;
  const directionRules = JSON.stringify(directionText);
  const directionSource = String.raw`A\u202eB`;
  const smoke = join(consumer, "smoke.mjs");
  writeFileSync(
    smoke,
    `import { compile, toRegExp, CompileError } from "regex-for-humans";
const result = compile(${JSON.stringify(rules)});
if (result.source !== "^ABC\\\\d{3}$" || result.flags !== "u") throw new Error("Wrong source or flags");
if (!toRegExp(result).test("ABC123") || toRegExp(result).test("ABC12")) throw new Error("Wrong matching behavior");
if (result.segments.length !== 4 || !result.segments[2].explanation) throw new Error("Missing trace");
const excluded = compile("start\\ntext without: a, b\\nend");
if (excluded.source !== "^[^ab]*$" || !toRegExp(excluded).test("xyz") || toRegExp(excluded).test("cab")) throw new Error("Wrong text-exclusion behavior");
const hex = compile("2 hex digits");
if (hex.source !== "[0-9A-Fa-f]{2}" || !toRegExp(hex).test("0F") || toRegExp(hex).test("0G")) throw new Error("Wrong hexadecimal behavior");
const letters = compile("start between 2 and 4 letters\\nend");
if (letters.source !== "^[A-Za-z]{2,4}$" || !toRegExp(letters).test("aBc") || toRegExp(letters).test("A3") || toRegExp(letters).test("éé")) throw new Error("Wrong alphabetic behavior");
const foldedLetter = compile("start letter\\nend", { flags: "i" });
if (!toRegExp(foldedLetter).test("K") || !foldedLetter.segments[1].explanation.includes("Unicode equivalents")) throw new Error("Wrong letter case-folding behavior");
const bounded = compile(${JSON.stringify(boundedRules)});
if (bounded.source !== ${JSON.stringify(boundedSource)} || !toRegExp(bounded).test("12") || !toRegExp(bounded).test("1234") || toRegExp(bounded).test("1") || toRegExp(bounded).test("12345")) throw new Error("Wrong bounded repetition behavior");
if (bounded.segments[1].repetition?.kind !== "range" || bounded.segments[1].repetition.min !== 2 || bounded.segments[1].repetition.max !== 4) throw new Error("Missing range metadata");
const directional = compile(${JSON.stringify(directionRules)});
if (directional.source !== ${JSON.stringify(directionSource)} || !toRegExp(directional).test(${JSON.stringify(directionText)}) || directional.segments[0].text !== ${JSON.stringify(directionRules)}) throw new Error("Wrong direction-control behavior");
try { compile("unsupported words"); throw new Error("Unknown rule accepted"); }
catch (error) { if (!(error instanceof CompileError)) throw error; }
`,
  );
  run([smoke], { cwd: consumer });
  const typeSmoke = join(consumer, "type-smoke.mts");
  writeFileSync(
    typeSmoke,
    `import { CompileError, compile, regexMatchingThroughLines, toRegExp } from "regex-for-humans";
import type { CompileResult, RegexSegment, Repetition } from "regex-for-humans";
const result: CompileResult = compile("start 3 digits\\nend", { flags: "i" });
const regex: RegExp = toRegExp(result);
const segment: RegexSegment = result.segments[0];
const source: string = regexMatchingThroughLines("digits");
const range: Repetition = { kind: "range", min: 2, max: 4 };
const max: number = range.max;
const line: number = new CompileError("UNKNOWN_RULE", "Invalid rule", { line: 1, column: 1 }).toJSON().line;
// @ts-expect-error rules must be a string
compile(3);
// @ts-expect-error flags must be a string
compile("digits", { flags: 3 });
void [regex, segment, source, line, max];
`,
  );
  run(
    [
      join(root, "node_modules", "typescript", "bin", "tsc"),
      "--strict",
      "--noEmit",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      typeSmoke,
    ],
    { cwd: consumer },
  );
  const cliArgs = [npmCli, "exec", "--offline", "--yes=false", "--", "regex-for-humans"];
  const version = run([...cliArgs, "--version"], { cwd: consumer });
  if (version !== manifest.version) throw new Error("Installed CLI reported a different version.");
  const cliResult = JSON.parse(run([...cliArgs, "--json", "-"], { cwd: consumer, input: rules }));
  if (cliResult.source !== "^ABC\\d{3}$" || cliResult.flags !== "u") {
    throw new Error("Installed CLI produced an unexpected expression.");
  }
  const boundedCli = JSON.parse(
    run([...cliArgs, "--json", "-"], { cwd: consumer, input: boundedRules }),
  );
  if (boundedCli.source !== boundedSource || boundedCli.segments[1].repetition?.max !== 4) {
    throw new Error("Installed CLI did not preserve bounded repetition.");
  }
  const directionOutput = run([...cliArgs, "--json", "-"], {
    cwd: consumer,
    input: directionRules,
  });
  const directionCli = JSON.parse(directionOutput);
  if (
    /\p{Bidi_Control}/u.test(directionOutput) ||
    directionCli.source !== directionSource ||
    directionCli.segments[0].text !== directionRules
  ) {
    throw new Error(
      "Installed CLI did not expose direction controls or preserve original rule text.",
    );
  }
  const controlText = `A${String.fromCodePoint(0, 0x1b, 0x7f, 0x9b, 0x9d, 0x2028, 0x2029)}B`;
  const controlRules = JSON.stringify(controlText);
  const controlOutput = run([...cliArgs, "--json", "-"], {
    cwd: consumer,
    input: controlRules,
  });
  const controlCli = JSON.parse(controlOutput);
  if (
    /[\p{Control}\u2028\u2029]/u.test(controlOutput) ||
    controlCli.segments[0].text !== controlRules ||
    !new RegExp(controlCli.source, controlCli.flags).test(controlText)
  ) {
    throw new Error("Installed CLI did not expose terminal controls or preserve matching data.");
  }
  process.stdout.write(
    `Verified ${packageInfo.filename} (${packageInfo.size} bytes) in a clean consumer.\n`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
