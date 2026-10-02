import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";
import compatibility from "../playwright.compat.config.js";
import workshop from "../playwright.config.js";
import homepage from "../playwright.site.config.js";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
const recipes = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("security policy distinguishes the published preview from stable support", () => {
  const policy = readFileSync(new URL("../SECURITY.md", import.meta.url), "utf8");
  const preview = /https:\/\/www\.npmjs\.com\/package\/regex-for-humans\/v\/[^)]+/u.exec(readme);
  assert.ok(preview, "README links the published npm preview");
  assert.ok(policy.includes(preview[0]), "Security policy links the same published preview");
  assert.match(policy, /experimental npm preview/u);
  assert.match(policy, /No stable release is supported yet/u);
  assert.match(policy, /Security fixes target `main`/u);
  assert.doesNotMatch(policy, /no published npm|there are no released versions/u);
});

test("README links every shared recipe exactly once", () => {
  const ids = [
    ...readme.matchAll(
      /^\| \[[^\]]+\]\(https:\/\/othmaneblial\.github\.io\/Regex-For-Humans\/workshop\/\?example=([a-z0-9-]+)\) \|/gmu,
    ),
  ].map(([, id]) => id);
  assert.deepEqual(ids.sort(), recipes.map(({ id }) => id).sort());
});

test("README documents every CLI option shown by --help", () => {
  const help = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.equal(help.status, 0, help.stderr);
  const options = [...help.stdout.matchAll(/^ {2}(--[a-z-]*)(?=\s)/gmu)].map(
    ([, option]) => option,
  );
  assert.ok(options.length > 0, "CLI help lists its options");
  for (const option of options) {
    assert.ok(readme.includes(`\`${option}\``), `README omits ${option}`);
  }
});

test("local verification instructions install every configured browser before running the gate", () => {
  const browsers = [
    ...new Set([
      workshop.use.browserName,
      homepage.use.browserName,
      ...compatibility.projects.map(({ use }) => use.browserName),
    ]),
  ].sort();
  for (const file of ["README.md", "CONTRIBUTING.md", "docs/TESTING.md"]) {
    const content = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    const blocks = [...content.matchAll(/```sh\n([\s\S]*?)\n```/gu)].map(([, code]) => code);
    for (const [command, required] of [
      ["npm run verify", browsers.filter((browser) => browser !== "chromium")],
      ["CI=1 npm run verify", browsers],
    ]) {
      const setup = blocks.find((code) => code.split("\n").includes(command));
      assert.ok(setup, `${file} needs a runnable ${command} example`);
      const install = /^npm exec -- playwright install ([a-z ]+)$/mu.exec(setup);
      assert.ok(install, `${file} needs its browser installation command`);
      assert.ok(install.index < setup.indexOf(command), `${file} installs engines before testing`);
      assert.deepEqual(install[1].split(" ").sort(), required, `${file}: ${command}`);
    }
  }
});

test("individual testing commands mirror the complete local verification gate", () => {
  const guide = readFileSync(new URL("../docs/TESTING.md", import.meta.url), "utf8");
  const { scripts } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const block = [...guide.matchAll(/```sh\n([\s\S]*?)\n```/gu)].find(([, code]) =>
    code.startsWith("npm run check\n"),
  );
  assert.ok(block, "Testing guide lists its individual checks");
  assert.deepEqual(block[1].split("\n"), [
    ...scripts.verify.split(" && "),
    "npm pack --dry-run --json",
  ]);
});

test("README reverse-translation example round-trips through the public API", () => {
  const reverse = regexToRules(/^[A-Z]{2}-\d{4}$/u);
  assert.ok(readme.includes("regexToRules(/^[A-Z]{2}-\\d{4}$/u)"));
  assert.equal(reverse.rules, 'start\n2 uppercase letter\n"-"\n4 digit\nend');
  const rebuilt = compile(reverse.rules, { flags: reverse.flags });
  assert.equal(rebuilt.source, "^[A-Z]{2}-\\d{4}$");
});

test("README's lead demo and optional shortcut match the compiler", () => {
  const demo =
    /<tr><td>\s*```text\r?\n([\s\S]*?)\r?\n```\s*<\/td><td>\s*```js\r?\n(\/[^\n]+\/[a-z]*)\r?\n```\s*✅ ([^\n]*)<br>\s*❌ ([^\n]*)/u.exec(
      readme,
    );
  assert.ok(demo, "README lead example is present");
  const [, rules, shownLiteral, positiveLine, negativeLine] = demo;
  const shown = /^\/(.*)\/([a-z]+)$/u.exec(shownLiteral);
  assert.ok(shown, "README example uses a JavaScript regex literal");

  const result = compile(rules);
  assert.equal(result.source, shown[1]);
  assert.equal(result.flags, shown[2]);
  const regex = toRegExp(result);
  const examples = (line) => [...line.matchAll(/`([^`]+)`/gu)].map(([, value]) => value);
  for (const value of examples(positiveLine)) assert.equal(regex.test(value), true, value);
  for (const value of examples(negativeLine)) assert.equal(regex.test(value), false, value);

  const row = readme.split(/\r?\n/u).find((line) => line.includes('`optional "-"`'));
  assert.ok(row, "README optional shortcut is present");
  const shortcut = /^\| `([^`]+)` \| `([^`]+)` \|/u.exec(row);
  assert.ok(shortcut, "README optional shortcut has a rule and regex fragment");
  const optional = compile(shortcut[1]);
  assert.equal(optional.source, shortcut[2]);
  const wholeInput = new RegExp(`^(?:${optional.source})$`, optional.flags);
  assert.equal(wholeInput.test(""), true);
  assert.equal(wholeInput.test("-"), true);
  assert.equal(wholeInput.test("--"), false);
});
