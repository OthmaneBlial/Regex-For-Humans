import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile } from "../index.js";
import { readExpectation } from "../web/expectations.js";
import { categories, filterRecipes, levels } from "../web/library.js";
import { translations } from "../web/translations.js";

const recipes = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("every requested category and difficulty has a valid shared recipe and localized label", () => {
  assert.equal(categories.length, 24);
  assert.equal(new Set(categories.map(([id]) => id)).size, 24);
  for (const [id, label] of categories) {
    assert.ok(
      recipes.some((recipe) => recipe.categories.includes(id)),
      id,
    );
    assert.ok(Object.hasOwn(translations, label), label);
  }
  for (const [id, label] of levels) {
    assert.ok(
      recipes.some((recipe) => recipe.level === id),
      id,
    );
    assert.ok(Object.hasOwn(translations, label), label);
  }
  for (const recipe of recipes) {
    assert.ok(recipe.positive.length && recipe.negative.length, recipe.id);
    assert.ok(recipe.note.trim(), recipe.id);
    assert.equal(new Set(recipe.categories).size, recipe.categories.length);
    assert.ok(recipe.categories.every((id) => categories.some(([known]) => id === known)));
    assert.ok(levels.some(([id]) => id === recipe.level));
    assert.equal(compile(recipe.rules).source, recipe.source, recipe.id);
  }
});

test("library search combines literal terms, translated text and filters without editing data", () => {
  const snapshot = JSON.stringify(recipes);
  const ids = (...args) => filterRecipes(recipes, ...args).map((recipe) => recipe.id);
  assert.deepEqual(
    ids("", "", "", "en"),
    recipes.map((recipe) => recipe.id),
  );
  assert.deepEqual(ids(" semver  SYNTAX ", "semantic-versions", "expert", "en"), [
    "semantic-version",
  ]);
  assert.deepEqual(ids("syntaxe", "semantic-versions", "expert", "fr"), ["semantic-version"]);
  assert.deepEqual(ids("预发布", "semantic-versions", "expert", "zh-CN"), ["semantic-version"]);
  assert.deepEqual(ids("prelanzamiento", "semantic-versions", "expert", "es"), [
    "semantic-version",
  ]);
  assert.deepEqual(ids("capture", "named-fields", "beginner", "en"), ["date-shape"]);
  assert.deepEqual(ids("العربية", "unicode-text", "", "en"), []);
  assert.deepEqual(ids("Unicode", "unicode-text", "beginner", "en"), []);
  assert.deepEqual(ids(".*", "", "", "en"), []);
  assert.deepEqual(ids('<img onerror="alert(1)">', "", "", "en"), []);
  assert.equal(JSON.stringify(recipes), snapshot);
});

test("SemVer syntax agrees with independently parsed identifier and zero rules", () => {
  const recipe = recipes.find(({ id }) => id === "semantic-version");
  const regex = new RegExp(recipe.source, recipe.flags);
  const digits = (value) => value.length > 0 && [...value].every((c) => c >= "0" && c <= "9");
  const allowed = (value) =>
    value.length > 0 &&
    [...value].every(
      (c) =>
        (c >= "0" && c <= "9") || (c >= "A" && c <= "Z") || (c >= "a" && c <= "z") || c === "-",
    );
  const valid = (value) => {
    const plus = value.split("+");
    if (plus.length > 2 || (plus.length === 2 && !plus[1].split(".").every(allowed))) return false;
    const dash = plus[0].indexOf("-");
    const core = (dash === -1 ? plus[0] : plus[0].slice(0, dash)).split(".");
    if (
      core.length !== 3 ||
      !core.every((part) => digits(part) && (part.length === 1 || part[0] !== "0"))
    )
      return false;
    return (
      dash === -1 ||
      plus[0]
        .slice(dash + 1)
        .split(".")
        .every((part) => allowed(part) && (!digits(part) || part.length === 1 || part[0] !== "0"))
    );
  };
  let count = 0;
  for (const major of ["0", "1", "01", "99", ""])
    for (const minor of ["0", "2", "02"])
      for (const patch of ["0", "3", "03"])
        for (const pre of [
          "",
          "-",
          "-0",
          "-00",
          "-00a",
          "-alpha.1",
          "-alpha.01",
          "--",
          "-a..b",
          "-α",
          "-a_b",
        ])
          for (const build of ["", "+", "+001", "+build.007", "+a..b", "+a_b", "+α"]) {
            const value = `${major}.${minor}.${patch}${pre}${build}`;
            assert.equal(regex.test(value), valid(value), value);
            count++;
          }
  assert.equal(count, 3465);
  assert.deepEqual(
    { ...regex.exec("1.2.3-alpha.1+001").groups },
    { major: "1", minor: "2", patch: "3", prerelease: "alpha.1", build: "001" },
  );
  assert.equal(regex.exec("1.2.3").groups.prerelease, undefined);
});

test("replacement recipe expectations retain native search spans, captures and non-global replacement", () => {
  const recipe = recipes.find(({ id }) => id === "replace-word");
  assert.equal(recipe.expectations.length, recipe.positive.length);
  for (const [index, text] of recipe.positive.entries()) {
    const expected = readExpectation(recipe.expectations[index]);
    const matches = [...text.matchAll(new RegExp(recipe.source, `${recipe.flags}g`))];
    assert.deepEqual(
      matches.map((m) => [m.index, m.index + m[0].length]),
      expected.spans,
    );
    assert.deepEqual(
      matches.map((m) => m.slice(1)),
      expected.captures,
    );
    assert.equal(
      text.replace(new RegExp(recipe.source, recipe.flags), expected.replacement.template),
      expected.replacement.result,
    );
  }
  assert.equal(
    recipe.positive[1].replace(new RegExp(recipe.source, `${recipe.flags}g`), "the"),
    "the then the",
  );
});
