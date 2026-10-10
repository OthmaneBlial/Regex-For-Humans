import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, toRegExp } from "../index.js";

const canonical = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const blocks = (text) => [...text.matchAll(/```([^\n]*)\n([\s\S]*?)\n```/gu)].map((m) => m[0]);
const recipes = (text) => [...text.matchAll(/\?example=([a-z0-9-]+)\)/gu)].map((m) => m[1]);

test("all nine README translations retain complete sections and executable examples", () => {
  const homepage = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  for (const locale of ["zh-CN", "es", "fr", "pt-BR", "ja", "de", "hi", "ar", "ur"]) {
    const name = `README.${locale}.md`;
    const translated = readFileSync(new URL(`../docs/i18n/${name}`, import.meta.url), "utf8");
    assert.deepEqual(
      blocks(translated),
      blocks(canonical),
      `${locale}: preserve code and commands`,
    );
    assert.deepEqual(recipes(translated), recipes(canonical), `${locale}: cover every recipe`);
    assert.equal(
      translated.match(/^## /gmu)?.length,
      canonical.match(/^## /gmu)?.length,
      `${locale}: retain the major sections`,
    );
    assert.ok(translated.includes("../../README.md"), `${locale}: link back to English`);
    assert.ok(translated.includes("0.1.0-dev.3"), `${locale}: name the published preview`);
    assert.ok(canonical.includes(`docs/i18n/${name}`));
    assert.ok(homepage.includes(`docs/i18n/${name}`));
  }
});

test("Arabic and Urdu preserve RTL prose with isolated LTR code", () => {
  for (const locale of ["ar", "ur"]) {
    const translated = readFileSync(
      new URL(`../docs/i18n/README.${locale}.md`, import.meta.url),
      "utf8",
    );
    assert.ok(translated.startsWith(`<div dir="rtl" lang="${locale}">`));
    assert.ok(translated.trimEnd().endsWith("</div>"));
    const wrapped = [
      ...translated.matchAll(
        /<div dir="ltr" align="left">\s*(```[^\n]*\n[\s\S]*?\n```)\s*<\/div>/gu,
      ),
    ].map((match) => match[1]);
    assert.deepEqual(wrapped, blocks(canonical), `${locale}: every code block stays LTR`);
    const prose = translated.replace(/```[^\n]*\n[\s\S]*?\n```/gu, "");
    assert.equal(prose.includes("`"), false, `${locale}: isolate inline code explicitly`);
    assert.ok(prose.includes('<code dir="ltr">'));
    assert.equal(
      /[\u202a-\u202e\u2066-\u2069]/u.test(translated),
      false,
      "Use visible direction attributes instead of hidden bidi controls",
    );
  }
});

test("the README's named date capture example extracts native fields", () => {
  const example = /<!-- captures:date -->\s*```text\n([\s\S]*?)\n```/u.exec(canonical);
  assert.ok(example);
  const result = compile(example[1]);
  const match = toRegExp(result).exec("2026-10-10");
  assert.ok(match);
  assert.deepEqual({ ...match.groups }, { year: "2026", month: "10", day: "10" });
  assert.deepEqual(match.slice(1), ["2026", "10", "10"]);
  assert.equal(toRegExp(result).test("2026-1-10"), false);
});
