import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, toRegExp } from "../index.js";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const recipes = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("README links every shared recipe exactly once", () => {
  const ids = [
    ...readme.matchAll(
      /^\| \[[^\]]+\]\(https:\/\/othmaneblial\.github\.io\/Regex-For-Humans\/workshop\/\?example=([a-z0-9-]+)\) \|/gmu,
    ),
  ].map(([, id]) => id);
  assert.deepEqual(ids.sort(), recipes.map(({ id }) => id).sort());
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
