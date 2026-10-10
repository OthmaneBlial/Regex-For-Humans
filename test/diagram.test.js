import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CompileError, compile, regexToRules, toSVG } from "../index.js";
import { flagSets, patterns } from "./fixtures/advanced-flags-corpus.js";

function nodes(svg) {
  return [
    ...svg.matchAll(
      /<g class="diagram-rule" data-diagram-key="([^"]+)" data-line="(\d+)" data-column="(\d+)" data-source-start="(\d+)" data-source-end="(\d+)" data-kind="([^"]+)"/gu,
    ),
  ].map(([, key, line, column, start, end, kind]) => ({
    key,
    line: Number(line),
    column: Number(column),
    sourceStart: Number(start),
    sourceEnd: Number(end),
    kind,
  }));
}

function checkMetadata(rules, flags) {
  const compiled = compile(rules, { flags });
  const svg = toSVG(rules, { flags });
  const metadata = nodes(svg);
  assert.equal(new Set(metadata.map((node) => node.key)).size, metadata.length);
  const openings = compiled.segments.filter(
    (segment) => !("edge" in segment) || segment.edge === "start" || segment.kind === "anchor",
  );
  assert.equal(metadata.length, openings.length);
  for (const node of metadata) {
    const opening = openings.find(
      (segment) =>
        segment.kind === node.kind && segment.line === node.line && segment.column === node.column,
    );
    assert.ok(opening);
    assert.equal(node.sourceStart, opening.sourceStart);
    const closing = ["group", "alternation", "assertion"].includes(node.kind)
      ? compiled.segments.find(
          (segment) =>
            segment.kind === node.kind &&
            segment.edge === "end" &&
            segment.sourceEnd === node.sourceEnd,
        )
      : opening;
    assert.ok(closing);
    assert.equal(node.sourceEnd, closing.sourceEnd);
    assert.ok(node.sourceStart <= node.sourceEnd && node.sourceEnd <= compiled.source.length);
  }
  assert.ok(svg.includes(`data-flags="${compiled.flags}"`));
  assert.doesNotMatch(svg, /NaN|Infinity|undefined|<script|<foreignObject|\bhref=|\bon\w+="/u);
  return svg;
}

test("structural SVG covers the shared recipes and all native flag combinations", () => {
  const recipes = JSON.parse(
    readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url)),
  );
  for (const recipe of recipes) checkMetadata(recipe.rules, recipe.flags);
  for (const flags of flagSets) {
    for (const source of patterns) {
      const translated = regexToRules(new RegExp(source, flags));
      checkMetadata(translated.rules, translated.flags);
    }
  }
});

test("nested choices, repetition and assertions keep container spans and zero-width descriptions", () => {
  const translated = regexToRules(/(?<=a(?<x>b))(?:ab|)a{0,2}?(?!x)$/u);
  const svg = checkMetadata(translated.rules, translated.flags);
  assert.match(svg, /Check ends here · backwards · zero width/u);
  assert.match(svg, /Check starts here · zero width/u);
  assert.match(svg, /Empty sequence/u);
  assert.match(svg, /0–2 times · lazy/u);
  assert.match(svg, /class="branch-number"[^>]*>2</u);
  assert.match(svg, /Loops show repetition bounds, not runtime backtracking steps/u);
  assert.match(svg, /tile zero-width/u);
});

test("exactly zero repetition shows a bypass and a visibly inactive body", () => {
  const svg = checkMetadata('0 "x"', "u");
  assert.match(svg, /0 times/u);
  assert.match(svg, /<g class="never" opacity=".45">/u);
  assert.match(svg, /stroke-dasharray="4 4"/u);
  assert.match(checkMetadata('1000 "x"', "u"), /1000 times/u);
});

test("XML literals, bidi controls, astral text and lone surrogates stay visible and inert", () => {
  const value = `<script onclick="alert(1)">&'😀 العربية اردو\u202e\u0000\ud800\ufffe\uffff`;
  const svg = checkMetadata(JSON.stringify(value), "u");
  assert.match(svg, /&lt;script/u);
  assert.match(svg, /&amp;/u);
  assert.match(svg, /😀/u);
  assert.match(svg, /\\u202e/u);
  assert.doesNotMatch(svg, /[\p{Control}\u202e\ud800-\udfff\ufffe\uffff]/u);
  assert.match(toSVG(JSON.stringify("\ud800")), /\\ud800/u);
  assert.match(svg, /\\ufffe\\uffff/u);
});

test("Unicode sets remain a single semantic leaf, including nested and finite-string operands", () => {
  const translated = regexToRules(/[[a[\q{ab|a|}]]&&[\p{ASCII}]]+/v);
  const svg = checkMetadata(translated.rules, "v");
  assert.equal(nodes(svg).length, 1);
  assert.match(svg, /intersection/u);
});

test("the diagram uses the compiler's diagnostics and budgets", () => {
  for (const [rules, options] of [
    ["", undefined],
    ["not a rule", undefined],
    ["digit", { flags: "uv" }],
    ['same as capture "missing"', undefined],
    ["digit\n".repeat(201), undefined],
    [JSON.stringify("a".repeat(16384)), undefined],
  ]) {
    let diagnostic;
    try {
      compile(rules, options);
    } catch (error) {
      diagnostic = error;
    }
    assert.ok(diagnostic instanceof CompileError);
    assert.throws(
      () => toSVG(rules, options),
      (error) =>
        error instanceof CompileError &&
        error.code === diagnostic.code &&
        error.line === diagnostic.line &&
        error.column === diagnostic.column,
    );
  }
  const maximum = `${"digit\n".repeat(199)}digit`;
  assert.equal(nodes(toSVG(maximum)).length, 200);
});
