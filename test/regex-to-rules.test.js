import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, regexToRules, toRegExp } from "../index.js";

const scenarios = JSON.parse(
  readFileSync(new URL("./fixtures/product-scenarios.json", import.meta.url), "utf8"),
);

test("every shared recipe translates back to rules with the same regex and flags", () => {
  for (const scenario of scenarios) {
    const original = new RegExp(scenario.source, scenario.flags);
    const translated = regexToRules(original);
    const rebuilt = compile(translated.rules, { flags: translated.flags });
    assert.equal(rebuilt.source, original.source, scenario.id);
    assert.equal(rebuilt.flags, original.flags, scenario.id);
    for (const sample of scenario.positive) assert.equal(toRegExp(rebuilt).test(sample), true);
    for (const sample of scenario.negative) assert.equal(toRegExp(rebuilt).test(sample), false);
  }
});

test("translates literal groups, generic repetition and open-ended counts", () => {
  for (const [regex, rules] of [
    [/^(?:a\.b){2,4}$/u, 'start\nbetween 2 and 4 "a.b"\nend'],
    [/^\d{3,}$/u, "start\nat least 3 digit\nend"],
    [/^.+$/su, "start\none or more any character\nend"],
    [/^[^,]*$/u, 'start\ntext without: ","\nend'],
  ]) {
    const translated = regexToRules(regex);
    assert.equal(translated.rules, rules);
    const rebuilt = compile(translated.rules, { flags: translated.flags });
    assert.equal(rebuilt.source, regex.source);
    assert.equal(rebuilt.flags, regex.flags);
  }
});

test("maps multiline anchors and matching flags without changing their meaning", () => {
  const original = /^a.*$/imsu;
  const translated = regexToRules(original);
  assert.equal(translated.rules, 'line start\n"a"\nany text\nline end');
  assert.equal(translated.flags, "is");
  const rebuilt = compile(translated.rules, { flags: translated.flags });
  assert.equal(rebuilt.source, original.source);
  assert.equal(rebuilt.flags, original.flags);
});

test("escapes literal punctuation and decodes Unicode escapes", () => {
  for (const regex of [/^a\/b\+c$/u, /^\u{1f600}$/u, /^[,\]]$/u]) {
    const translated = regexToRules(regex);
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    for (const sample of ["a/b+c", "😀", ",", "]", "other"]) {
      assert.equal(rebuilt.test(sample), regex.test(sample), `${regex}: ${sample}`);
    }
  }
});

test("fixed-width surrogate escapes preserve Unicode atoms in repetition and character classes", () => {
  const samples = ["", "😀", "😀😀", "A😀B", "😀\ude00", "\ud83d", "\ude00", "A"];
  for (const regex of [
    /\uD83D\uDE00+/u,
    /^\uD83D\uDE00{2}$/u,
    /^[\uD83D\uDE00]+$/u,
    /^[^\uD83D\uDE00]+$/u,
    /^(?:\uD83D\uDE00)+$/u,
  ]) {
    const translated = regexToRules(regex);
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    for (const sample of samples) {
      const expected = regex.exec(sample);
      const actual = rebuilt.exec(sample);
      assert.equal(actual?.[0], expected?.[0], `${regex}: ${JSON.stringify(sample)}`);
      assert.equal(actual?.index, expected?.index, `${regex}: ${JSON.stringify(sample)}`);
    }
  }
});

test("separate lone-surrogate atoms remain separate when literal rules are merged", () => {
  for (const regex of [
    /^\u{D83D}\u{DE00}$/u,
    /^\uD83D(?:\uDE00)$/u,
    /^(?:\uD83D)\uDE00$/u,
    new RegExp(`^\ud83d${String.raw`\uDE00`}$`, "u"),
    new RegExp(`^${String.raw`\uD83D`}\ude00$`, "u"),
  ]) {
    const translated = regexToRules(regex);
    const rebuilt = toRegExp(compile(translated.rules, { flags: translated.flags }));
    for (const sample of ["", "😀", "😀😀", "\ud83d", "\ude00"]) {
      assert.equal(rebuilt.test(sample), regex.test(sample), `${regex}: ${JSON.stringify(sample)}`);
    }
  }
});

test("literal groups reject separate surrogate atoms that one literal rule cannot preserve", () => {
  assert.throws(() => regexToRules(/^(?:\u{D83D}\u{DE00})+$/u), {
    code: "UNSUPPORTED_REGEX",
    line: 1,
    column: 13,
  });
});

test("rejects features it cannot preserve and non-Unicode matching", () => {
  for (const [regex, column] of [
    [/^a|b$/u, 3],
    [/(?=a)a/u, 1],
    [/\bword/u, 1],
    [/a*?/u, 3],
    [/\p{L}/u, 1],
  ]) {
    assert.throws(() => regexToRules(regex), {
      code: "UNSUPPORTED_REGEX",
      line: 1,
      column,
    });
  }
  assert.throws(() => regexToRules(/\d+/), { code: "UNICODE_FLAG_REQUIRED" });
  assert.throws(() => regexToRules(/a/gu), { code: "UNSUPPORTED_REGEX_FLAGS" });
  assert.throws(() => regexToRules("a"), { name: "TypeError" });
});
