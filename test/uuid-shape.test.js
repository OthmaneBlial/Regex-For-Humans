import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, regexToRules, toRegExp } from "../index.js";

const recipes = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("UUID shape fixes five hexadecimal group lengths without claiming semantic validation", () => {
  const recipe = recipes.find(({ id }) => id === "uuid-shape");
  assert.ok(recipe, "UUID shape is available in the shared recipe catalogue");
  assert.match(recipe.note, /version, variant and uniqueness separately/u);
  const lengths = [8, 4, 4, 4, 12];
  const source = "^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$";
  assert.equal(recipe.source, source);
  assert.equal(recipe.flags, "u");
  assert.equal(recipe.matchMode, "full");
  const base = "12345678-9abc-fdef-0123-456789abcdef";
  assert.ok(
    recipe.positive.includes(base),
    "The shape deliberately permits arbitrary field values",
  );
  for (const flags of ["", "i", "s", "is"]) {
    const result = compile(recipe.rules, { flags });
    assert.equal(result.source, source);
    assert.equal(result.segments.length, 11);
    assert.deepEqual(
      result.segments
        .filter(({ atomType }) => atomType === "shorthand")
        .map(({ repetition }) => repetition.min),
      lengths,
    );
    const regex = toRegExp(result);
    const reversed = regexToRules(regex);
    const rebuilt = toRegExp(compile(reversed.rules, { flags: reversed.flags }));
    assert.equal(rebuilt.source, source);
    assert.equal(rebuilt.flags, result.flags);
    const check = (text, expected) => {
      assert.equal(regex.test(text), expected, JSON.stringify({ flags, text }));
      assert.equal(rebuilt.test(text), expected, JSON.stringify({ flags, text, reverse: true }));
    };
    for (const text of recipe.positive) check(text, true);
    for (const text of recipe.negative) check(text, false);
    for (let index = 0; index < base.length; index += 1) {
      const replace = (text) => base.slice(0, index) + text + base.slice(index + 1);
      if (base[index] === "-") {
        for (const text of ["", "--", ":", "–", "_", " "]) check(replace(text), false);
      } else {
        for (const text of "0123456789abcdefABCDEF") check(replace(text), true);
        for (const text of [
          "g",
          "G",
          "é",
          "K",
          "ſ",
          "０",
          "١",
          "😀",
          "\0",
          "\n",
          "\r",
          "\u2028",
          "\u2029",
        ])
          check(replace(text), false);
      }
    }
    for (let group = 0; group < lengths.length; group += 1) {
      for (const difference of [-1, 0, 1]) {
        check(
          lengths
            .map((length, index) => "a".repeat(length + (index === group ? difference : 0)))
            .join("-"),
          difference === 0,
        );
      }
    }
    for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
      check(base + separator, false);
      check(separator + base, false);
    }
  }
});
