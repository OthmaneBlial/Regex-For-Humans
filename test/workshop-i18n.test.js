import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile } from "../index.js";
import { languages, translate } from "../web/i18n.js";
import { translations } from "../web/translations.js";

const placeholders = (text) => [...new Set(text.match(/\{\w+\}/gu) ?? [])].sort();

test("all workshop translations retain every interpolation token in all three languages", () => {
  assert.deepEqual(languages, ["en", "zh-CN", "es", "fr"]);
  for (const [key, values] of Object.entries(translations)) {
    assert.equal(values.length, 3, key);
    for (const value of values) {
      assert.ok(value.trim(), key);
      assert.deepEqual(placeholders(value), placeholders(key), key);
      assert.doesNotMatch(value, /[\u202a-\u202e\u2066-\u2069]/u, key);
    }
  }
});

test("all explicitly bound literal workshop messages have translations", () => {
  const source = readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
  let count = 0;
  for (const [, literal] of source.matchAll(/\bmessage\(\s*("(?:\\.|[^"\\])*")/gu)) {
    const key = JSON.parse(literal);
    if (key) {
      assert.ok(Object.hasOwn(translations, key), key);
      count += 1;
    }
  }
  assert.ok(count > 45);
});

test("every recipe title and limitation note is available in all interface languages", () => {
  const recipes = JSON.parse(
    readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
  );
  for (const recipe of recipes) {
    for (const key of [recipe.title, recipe.note]) {
      assert.ok(Object.hasOwn(translations, key), recipe.id);
      for (const language of languages.slice(1)) assert.notEqual(translate(language, key), key);
    }
  }
});

test("interpolation is single-pass and preserves user data and code verbatim", () => {
  const value = 'Ready <img onerror="alert(1)"> {line} $& العربية اردو 😀';
  assert.equal(
    translate("fr", "Line {line}: {text}", { line: 3, text: value }),
    `Ligne 3 : ${value}`,
  );
  assert.equal(
    translate("en", "Line {line}: {text}", { line: 3, text: value }),
    `Line 3: ${value}`,
  );
  assert.equal(translate("fr", "{unknown}", { text: value }), "{unknown}");
});

test("unknown locales and inherited catalog names fall back without invoking object properties", () => {
  for (const language of ["__proto__", "toString", "constructor", "ar", "", "FR"])
    assert.equal(translate(language, "Ready"), "Ready");
  for (const text of ["__proto__", "toString", "constructor"])
    assert.equal(translate("fr", text), text);
  const values = Object.create({ line: "inherited" });
  assert.equal(translate("fr", "Line {line}: {text}", values), "Ligne {line} : {text}");
});

test("translated interface text does not change the controlled English grammar", () => {
  assert.equal(compile('start\n"Ready"\nend').source, "^Ready$");
  for (const text of ["début", "inicio", "开始"])
    assert.throws(() => compile(text), { code: "UNKNOWN_RULE" });
});
