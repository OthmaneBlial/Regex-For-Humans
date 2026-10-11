import assert from "node:assert/strict";
import test from "node:test";
import { CompileError, compile, regexToRules, toRegExp } from "../index.js";
import { LIMITS } from "../src/limits.js";
import { insertRule } from "../web/insert-rule.js";

test("six builder templates remain editable and reverse-convert with native matching semantics", () => {
  const original = 'start\n"7"\nend';
  const cases = [
    ["capture", "^(\\d)7$", ["17"], ["7", "a7", "177"]],
    ["optional", "^(?:A){0,1}7$", ["7", "A7"], ["AA7", "B7"]],
    ["alternative", "^(?:A|B)7$", ["A7", "B7"], ["7", "C7"]],
    ["repetition", "^\\d{1,3}7$", ["17", "1237"], ["7", "12347", "a7"]],
    ["class", "^[AB]7$", ["A7", "B7"], ["7", "C7"]],
    ["assertion", "^(?=\\d)7$", ["7"], ["", "A7"]],
  ];
  for (const [kind, expected, positive, negative] of cases) {
    const added = insertRule(original, original.indexOf('"7"'), kind);
    const compiled = compile(added.rules);
    assert.equal(compiled.source, expected);
    assert.equal(added.line, 2);
    assert.equal(added.column, 1);
    const native = toRegExp(compiled);
    const reverse = regexToRules(native);
    const rebuilt = toRegExp(compile(reverse.rules, { flags: reverse.flags }));
    for (const input of positive) {
      assert.equal(native.test(input), true, kind);
      assert.deepEqual(rebuilt.exec(input), native.exec(input));
    }
    for (const input of negative) {
      assert.equal(native.test(input), false, kind);
      assert.equal(rebuilt.test(input), false, kind);
    }
  }
  const added = insertRule(original, 6, "capture");
  const edited = added.rules.replace("  digit", '  "A"');
  assert.equal(toRegExp(compile(edited)).test("A7"), true);
  assert.equal(toRegExp(compile(edited)).test("17"), false);
});

test("insertion respects outer anchors at the cursor, at EOF and on one line", () => {
  const original = 'start "ABC"\n3 digits\nend';
  assert.equal(compile(insertRule(original, 0, "capture").rules).source, "^ABC(\\d)\\d{3}$");
  assert.equal(
    compile(insertRule(original, original.length, "capture").rules).source,
    "^ABC\\d{3}(\\d)$",
  );
  for (const source of [
    "start end",
    "start, end",
    "  start end",
    '# quote "\nstart\nend\n# trailing "',
  ]) {
    const added = insertRule(source, source.length, "capture");
    assert.equal(compile(added.rules).source, "^(\\d)$");
    assert.equal(toRegExp(compile(added.rules)).test("1"), true);
  }
  assert.equal(compile(insertRule("", 0, "class").rules).source, "[AB]");
  assert.equal(compile(insertRule("  end", 0, "class").rules).source, "[AB]$");
  const nested = 'start\ncapture {\n  start\n  "A"\n}\nend';
  const added = insertRule(nested, nested.indexOf('"A"'), "repetition");
  assert.equal(added.line, 4);
  assert.equal(added.column, 3);
  assert.equal(toRegExp(compile(added.rules)).test("12A"), true);
});

test("a newly inserted capture preserves named and multi-digit numeric reference targets", () => {
  const letters = "ABCDEFGHIJ";
  const original =
    "start\n" +
    [...letters].map((letter) => `capture {\n"${letter}"\n}`).join("\n") +
    '\nsame as capture 10\n"0"\nend';
  for (const flags of ["u", "i", "dgimsyu", "v"]) {
    const added = insertRule(original, original.indexOf("capture"), "capture", { flags });
    assert.match(added.rules, /same as capture 11/u);
    const native = toRegExp(compile(added.rules, { flags }));
    const match = native.exec("7ABCDEFGHIJJ0");
    assert(match);
    assert.equal(match[1], "7");
    assert.equal(match[11], "J");
    assert.deepEqual(
      [...match].slice(2),
      [...toRegExp(compile(original, { flags })).exec("ABCDEFGHIJJ0")].slice(1),
    );
    native.lastIndex = 0;
    assert.equal(native.test("7ABCDEFGHIJI0"), false);
  }
  const named =
    '# same as capture 1 "\nstart\ncapture "word" {\n"A"\n}\nsame as capture "word"\nend';
  const added = insertRule(named, named.indexOf('capture "word"'), "capture");
  assert(added.rules.startsWith('# same as capture 1 "\nstart\n'));
  assert(added.rules.includes('same as capture "word"'));
  assert.equal(toRegExp(compile(added.rules)).exec("7AA").groups.word, "A");
});

test("logical line insertion preserves indentation, comments, Unicode and every separator", () => {
  const literal = "😀\u2028#";
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    const prefix = ['# unfinished "', "  start", ""].join(separator);
    const suffix = [`  ${JSON.stringify(literal)}`, "  end"].join(separator);
    const original = prefix + suffix;
    const added = insertRule(original, original.indexOf("😀") + 1, "capture");
    assert(added.rules.startsWith(prefix));
    assert(added.rules.endsWith(suffix));
    assert(added.rules.includes(["  capture {", "    digit", "  }"].join(separator)));
    assert.equal(added.line, 3);
    assert.equal(added.column, 3);
    assert.equal(toRegExp(compile(added.rules)).test(`7${literal}`), true);
  }
});

test("invalid edits and unchanged compiler budgets reject before returning replacement text", () => {
  for (const kind of ["constructor", "__proto__", "unknown"])
    assert.throws(() => insertRule("digit", 0, kind), TypeError);
  for (const caret of [-1, 6, 0.5, NaN, Infinity])
    assert.throws(() => insertRule("digit", caret, "class"), TypeError);
  assert.throws(() => insertRule(42, 0, "class"), TypeError);
  assert.throws(() => insertRule("bad rule", 0, "class"), { code: "UNKNOWN_RULE" });
  assert.throws(() => insertRule("digit", 0, "class", { flags: "uv" }), CompileError);
  const lineLimit = `${"# comment\n".repeat(LIMITS.lines - 1)}digit`;
  assert.throws(() => insertRule(lineLimit, lineLimit.length, "capture"), { code: "LINE_LIMIT" });
  const sourceLimit = `#${"x".repeat(LIMITS.sourceLength - 8)}\ndigit`;
  assert.throws(() => insertRule(sourceLimit, sourceLimit.length, "capture"), {
    code: "SOURCE_LIMIT",
  });
  const deep = `${"group {\n".repeat(LIMITS.groupDepth)}digit\n${"}\n".repeat(LIMITS.groupDepth)}`;
  assert.throws(() => insertRule(deep, deep.indexOf("digit"), "capture"), {
    code: "GROUP_DEPTH_LIMIT",
  });
});
