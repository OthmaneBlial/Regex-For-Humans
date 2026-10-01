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
  const expectedKeywords = [
    "javascript",
    "typescript",
    "regex-compiler",
    "regex-builder",
    "pattern-matching",
  ];
  if (!expectedKeywords.every((keyword) => manifest.keywords?.includes(keyword))) {
    throw new Error("The packed package is missing its JavaScript regex discovery keywords.");
  }
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
  const controlText = `A${String.fromCodePoint(0, 0x1b, 0x7f, 0x9b, 0x9d, 0x2028, 0x2029)}B`;
  const controlRules = JSON.stringify(controlText);
  const unicodePairSource = String.raw`^[\uD83D\uDE00]{2}$`;
  const controlLetterSource = String.raw`^[\cjX]{2}$`;
  const reverseLimitCases = [
    [String.raw`\d`.repeat(201), "LINE_LIMIT", "Translated rules cannot exceed 200 lines."],
    [
      `${"A\u202e".repeat(2340)}BCD`,
      "SOURCE_LIMIT",
      "Translated rules cannot exceed 16384 UTF-16 code units.",
    ],
  ];
  const smoke = join(consumer, "smoke.mjs");
  writeFileSync(
    smoke,
    `import { compile, regexToRules, toRegExp, CompileError } from "regex-for-humans";
const result = compile(${JSON.stringify(rules)});
const reverse = regexToRules(/^[A-Z]{2}-\\d{4}$/u);
if (reverse.rules !== 'start\\n2 uppercase letter\\n"-"\\n4 digit\\nend' || reverse.flags !== "") throw new Error("Wrong reverse-translation behavior");
if (compile(reverse.rules, { flags: reverse.flags }).source !== "^[A-Z]{2}-\\\\d{4}$") throw new Error("Reverse translation did not round-trip");
for (const [body, canonical, sample] of [["a-zA-Z", "A-Za-z", "Ab"], ["0-9a-fA-F", "0-9A-Fa-f", "0F"]]) {
  const translated = regexToRules(new RegExp("^[" + body + "]{2}$", "u"));
  const rebuilt = compile(translated.rules, { flags: translated.flags });
  if (rebuilt.source !== "^[" + canonical + "]{2}$" || !toRegExp(rebuilt).test(sample) || toRegExp(rebuilt).test("!?")) throw new Error("Wrong reordered class translation");
}
const emojiReverse = regexToRules(new RegExp(${JSON.stringify(unicodePairSource)}, "u"));
const emojiPattern = toRegExp(compile(emojiReverse.rules, { flags: emojiReverse.flags }));
if (!emojiPattern.test("😀😀") || emojiPattern.test("😀")) throw new Error("Reverse translation split a Unicode surrogate pair");
const controlReverse = regexToRules(new RegExp(${JSON.stringify(controlLetterSource)}, "u"));
const controlPattern = toRegExp(compile(controlReverse.rules, { flags: controlReverse.flags }));
if (!controlPattern.test(${JSON.stringify("\n\n")}) || !controlPattern.test("XX") || controlPattern.test(${JSON.stringify("\n")}) || controlPattern.test("jj") || /[\\u0000-\\u0009\\u000b-\\u001f]/u.test(controlReverse.rules)) throw new Error("Reverse translation changed control-letter matching or display");
for (const [source, code, message] of ${JSON.stringify(reverseLimitCases)}) {
  try { regexToRules(new RegExp(source, "u")); throw new Error("Oversized translated rules accepted"); }
  catch (error) { if (!(error instanceof CompileError) || error.code !== code || error.message !== message || error.line !== 1 || error.column !== 1 || error.hint !== ${JSON.stringify("Simplify the regex so its translated rules fit these limits.")}) throw error; }
}
try { compile("start at least"); throw new Error("Incomplete minimum accepted"); }
catch (error) { if (!(error instanceof CompileError) || error.code !== "INVALID_REPETITION" || error.column !== 7 || error.hint !== ${JSON.stringify("Use `at least 3 digits`, with the minimum count before the item.")}) throw error; }
const trailingList = ${JSON.stringify('one of: "😀", ",",')};
try { compile(trailingList); throw new Error("Trailing list comma accepted"); }
catch (error) { if (!(error instanceof CompileError) || error.code !== "INVALID_CHARACTER_LIST" || error.column !== trailingList.length) throw error; }
try { compile("start line end"); throw new Error("Mixed anchors accepted"); }
catch (error) { if (!(error instanceof CompileError) || error.code !== "MIXED_ANCHORS" || error.column !== 7 || error.hint !== ${JSON.stringify("Pair `start` with `end`, or `line start` with `line end`.")}) throw error; }
const lineRepair = compile("line start\\n3 digits\\nline end");
if (lineRepair.flags !== "mu" || !toRegExp(lineRepair).test("note\\n123")) throw new Error("Mixed-anchor line repair changed");
const whitespace = compile("start\\nspaces\\nend");
if (whitespace.source !== "^\\\\s+$" || !toRegExp(whitespace).test(" \\t\\n") || toRegExp(whitespace).test("") || whitespace.segments[1].explanation !== "One or more whitespace characters, including line breaks.") throw new Error("Wrong whitespace sequence behavior");
if (!toRegExp(compile("start\\nbetween 0 and 2 spaces\\nend")).test("") || toRegExp(compile('start\\n3 " "\\nend')).test("\\t\\t\\t")) throw new Error("Wrong whitespace count or literal behavior");
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
const optional = compile("start\\noptional \\"-\\"\\nend");
const optionalPattern = toRegExp(optional);
if (
  optional.source !== "^-{0,1}$" ||
  !optionalPattern.test("") ||
  !optionalPattern.test("-") ||
  optionalPattern.test("--")
)
  throw new Error("Wrong optional repetition behavior");
if (
  optional.segments[1].repetition?.kind !== "range" ||
  optional.segments[1].repetition.min !== 0 ||
  optional.segments[1].repetition.max !== 1
)
  throw new Error("Missing optional range metadata");
const directional = compile(${JSON.stringify(directionRules)});
if (directional.source !== ${JSON.stringify(directionSource)} || !toRegExp(directional).test(${JSON.stringify(directionText)}) || directional.segments[0].text !== ${JSON.stringify(directionRules)}) throw new Error("Wrong direction-control behavior");
const controlled = compile(${JSON.stringify(controlRules)});
if (/[\\p{Control}\\u2028\\u2029]/u.test(controlled.source + controlled.segments[0].explanation) || !toRegExp(controlled).test(${JSON.stringify(controlText)}) || controlled.segments[0].text !== ${JSON.stringify(controlRules)}) throw new Error("Wrong control display or matching behavior");
const unfinished = ${JSON.stringify('start 2 "😀   ')};
try { compile(unfinished); throw new Error("Unfinished quote accepted"); }
catch (error) { if (!(error instanceof CompileError) || error.code !== "INVALID_QUOTE" || error.column !== unfinished.length + 1) throw error; }
for (const [rules, code, column] of ${JSON.stringify([
      ["start 2 'A'", "UNKNOWN_RULE", 9],
      ["one of: a, ‘B’", "INVALID_CHARACTER", 12],
      ["text without: a, `B`", "INVALID_CHARACTER", 18],
    ])}) {
  try { compile(rules); throw new Error("Unsupported quote style accepted"); }
  catch (error) { if (!(error instanceof CompileError) || error.code !== code || error.line !== 1 || error.column !== column || error.hint !== ${JSON.stringify('Use JSON double quotes for quoted text, such as `"A"`.')}) throw error; }
}
const quoteData = ${JSON.stringify("'A'")};
if (!toRegExp(compile(JSON.stringify(quoteData))).test(quoteData)) throw new Error("Quote data changed");
try { compile('start 3 ""'); throw new Error("Empty literal accepted"); }
catch (error) { if (!(error instanceof CompileError) || error.code !== "EMPTY_LITERAL" || error.column !== 9 || error.hint !== ${JSON.stringify("Use `start` and `end` on separate lines to match an empty string.")}) throw error; }
const emptyPattern = toRegExp(compile(${JSON.stringify("start\nend")}));
if (!emptyPattern.test("") || emptyPattern.test(${JSON.stringify("\n")})) throw new Error("Empty-input repair changed");
try { compile("unsupported words"); throw new Error("Unknown rule accepted"); }
catch (error) { if (!(error instanceof CompileError)) throw error; }
`,
  );
  run([smoke], { cwd: consumer });
  const typeSmoke = join(consumer, "type-smoke.mts");
  writeFileSync(
    typeSmoke,
    `import { CompileError, compile, regexMatchingThroughLines, regexToRules, toRegExp } from "regex-for-humans";
import type { CompileResult, RegexSegment, Repetition, ReverseTranslation } from "regex-for-humans";
const result: CompileResult = compile("start 3 digits\\nend", { flags: "i" });
const regex: RegExp = toRegExp(result);
const segment: RegexSegment = result.segments[0];
const source: string = regexMatchingThroughLines("digits");
const range: Repetition = { kind: "range", min: 2, max: 4 };
const max: number = range.max;
const atLeast: Repetition = { kind: "atLeast", min: 3 };
const reverse: ReverseTranslation = regexToRules(/^\\d{3,}$/u);
const rules: string = reverse.rules;
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
  const invalidUtf8 = spawnSync(process.execPath, [...cliArgs, "--json", "-"], {
    cwd: consumer,
    input: Buffer.from([0xff]),
    encoding: "utf8",
  });
  if (
    invalidUtf8.status !== 1 ||
    invalidUtf8.stdout !== "" ||
    JSON.parse(invalidUtf8.stderr).error.code !== "CLI_ERROR" ||
    JSON.parse(invalidUtf8.stderr).error.message !==
      "Input must be valid UTF-8. Save the rules as UTF-8 and try again."
  ) {
    throw new Error("Installed CLI did not explain how to repair malformed UTF-8.");
  }
  const version = run([...cliArgs, "--version"], { cwd: consumer });
  if (version !== manifest.version) throw new Error("Installed CLI reported a different version.");
  const help = run([...cliArgs, "--help"], { cwd: consumer });
  const example = help.match(/printf '([^']+)' \| regex-for-humans/u);
  if (!example) throw new Error("Installed CLI help is missing its first-use example.");
  const exampleResult = run(cliArgs, {
    cwd: consumer,
    input: example[1].replaceAll("\\n", "\n"),
  });
  if (exampleResult !== "/^ABC\\d{3}$/u" || !help.includes(`  # ${exampleResult}`)) {
    throw new Error("Installed CLI help example did not produce its documented expression.");
  }
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
