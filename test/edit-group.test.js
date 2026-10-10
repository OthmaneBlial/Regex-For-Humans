import assert from "node:assert/strict";
import test from "node:test";
import { CompileError, compile, editGroup, toRegExp } from "../index.js";
import { flagSets } from "./fixtures/advanced-flags-corpus.js";

function group(rules, index = 1, flags = "u") {
  return compile(rules, { flags }).segments.find(
    (node) => node.kind === "group" && node.edge === "start" && node.captureIndex === index,
  );
}

test("renaming uses resolved references, preserves literals and all native flag/cursor behavior", () => {
  const literal = JSON.stringify('same as capture "word"');
  const rules = `start\noptional capture "\\u0077ord" {\n  letter\n}\n"/"\noptional same as capture "\\u0077ord"\n${literal}\nend`;
  for (const flags of flagSets) {
    const options = { flags };
    const renamed = editGroup(
      rules,
      group(rules, 1, options.flags),
      {
        capturing: true,
        name: "كلمة",
      },
      options,
    );
    assert.ok(renamed.includes(literal), "a lookalike literal is unchanged");
    assert.ok(renamed.includes('optional same as capture "كلمة"'));
    const before = toRegExp(compile(rules, options));
    const after = toRegExp(compile(renamed, options));
    for (const text of [
      'A/Asame as capture "word"',
      '/same as capture "word"',
      'A/asame as capture "word"',
      '😀A/Asame as capture "word"',
      "",
    ])
      for (const cursor of [0, 2, 20]) {
        before.lastIndex = cursor;
        after.lastIndex = cursor;
        for (let step = 0; step < 3; step += 1) {
          const original = before.exec(text);
          const changed = after.exec(text);
          assert.deepEqual(changed && [...changed], original && [...original]);
          assert.equal(changed?.index, original?.index);
          assert.equal(changed?.groups?.كلمة, original?.groups?.word);
          assert.deepEqual(changed?.indices?.groups?.كلمة, original?.indices?.groups?.word);
          assert.deepEqual(
            changed?.indices?.map((range) => range),
            original?.indices?.map((range) => range),
          );
          assert.equal(after.lastIndex, before.lastIndex);
        }
      }
  }
});

test("capture insertion/removal preserves nested and later reference targets", () => {
  const rules =
    'start\ncapture {\n  "X"\n  capture "inner" {\n    digit\n  }\n}\ncapture {\n  "B"\n}\nsame as capture "inner"\nlazy 2 same as capture 3\nend';
  const edited = editGroup(rules, group(rules), { capturing: false, name: null });
  assert.ok(edited.includes("lazy 2 same as capture 2"));
  assert.equal(toRegExp(compile(edited)).test("X1B1BB"), true);
  const captures = compile(edited).segments.filter(
    (s) => s.kind === "group" && s.edge === "start" && s.capturing,
  );
  assert.deepEqual(
    captures.map((s) => [s.captureIndex, s.name]),
    [
      [1, "inner"],
      [2, null],
    ],
  );
  const restored = editGroup(edited, { line: 2, column: 1 }, { capturing: true, name: null });
  assert.equal(restored, rules);
  assert.deepEqual(
    toRegExp(compile(restored)).exec("X1B1BB"),
    toRegExp(compile(rules)).exec("X1B1BB"),
  );
});

test("changing named and numbered forms updates only references that need it", () => {
  const rules = 'capture "word" {\nletter\n}\nsame as capture "word"\nsame as capture 1';
  const numbered = editGroup(rules, group(rules), { capturing: true, name: null });
  assert.equal(numbered, "capture {\nletter\n}\nsame as capture 1\nsame as capture 1");
  assert.equal(toRegExp(compile(numbered)).test("AAA"), true);
  const named = editGroup(numbered, group(numbered), { capturing: true, name: "𝒳" });
  assert.ok(named.includes('capture "𝒳" {'));
  assert.ok(named.includes("same as capture 1\nsame as capture 1"));
  assert.equal(toRegExp(compile(named)).exec("AAA").groups.𝒳, "A");
});

test("capture insertion preserves multi-digit references beside a digit literal", () => {
  const rules = [
    "start",
    "group {",
    '  "X"',
    "}",
    ...Array.from({ length: 12 }, () => "capture {\ndigit\n}"),
    "same as capture 10",
    '"1"',
    "end",
  ].join("\n");
  const edited = editGroup(rules, { line: 2, column: 1 }, { capturing: true, name: null });
  assert.ok(edited.includes("same as capture 11"));
  const input = "X12345678901201";
  const original = toRegExp(compile(rules)).exec(input);
  const changed = toRegExp(compile(edited)).exec(input);
  assert.equal(changed?.[0], original?.[0]);
  assert.equal(changed?.[11], original?.[10]);
  assert.equal(toRegExp(compile(edited)).test(input.slice(0, -1)), false);
});

test("editing preserves exact line endings, indentation, lazy modifiers and quoted separators", () => {
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    const quoted = JSON.stringify("capture \u2028 same as capture old");
    const rules = [
      '  start lazy optional CAPTURE "old" {  ',
      `\t${quoted}`,
      "  }",
      '\tlazy 2 same as capture "old"   ',
      "end",
    ].join(separator);
    const target = group(rules);
    const edited = editGroup(rules, target, { capturing: true, name: "new" });
    assert.equal(
      edited,
      rules
        .replace('CAPTURE "old" ', 'capture "new" ')
        .replace('same as capture "old"', 'same as capture "new"'),
    );
    assert.equal(editGroup(edited, target, { capturing: true, name: "new" }), edited);
  }
});

test("groups inside alternatives and assertions edit through the shared AST", () => {
  const rules =
    'start\neither {\n  group {\n    capture "word" {\n      letter\n    }\n    followed by {\n      capture "suffix" {\n        digit\n      }\n    }\n    digit\n    same as capture "word"\n    same as capture "suffix"\n  }\n  "none"\n}\nend';
  const edited = editGroup(rules, group(rules, 2), { capturing: true, name: "number" });
  assert.equal(toRegExp(compile(edited)).test("A1A1"), true);
  assert.equal(toRegExp(compile(edited)).exec("A1A1").groups.number, "1");
  const inserted = editGroup(edited, { line: 3, column: 3 }, { capturing: true, name: "branch" });
  assert.equal(toRegExp(compile(inserted)).exec("A1A1").groups.branch, "A1A1");
  const v =
    'capture "emoji" {\ncharacter set intersection {\nunicode property "RGI_Emoji"\none of strings: "😀"\n}\n}\nsame as capture "emoji"';
  const renamed = editGroup(
    v,
    group(v, 1, "v"),
    { capturing: true, name: "picture" },
    { flags: "v" },
  );
  assert.equal(toRegExp(compile(renamed, { flags: "v" })).exec("😀😀").groups.picture, "😀");
});

test("invalid edits and referenced removals fail without producing partial rules", () => {
  const rules = 'capture "word" {\nletter\n}\nsame as capture "word"';
  assert.throws(
    () => editGroup(rules, group(rules), { capturing: false, name: null }),
    (e) =>
      e instanceof CompileError &&
      e.code === "REFERENCED_CAPTURE" &&
      e.line === 4 &&
      e.column === 17,
  );
  assert.throws(
    () => editGroup(rules, group(rules), { capturing: true, name: "bad name" }),
    (e) => e instanceof CompileError && e.code === "INVALID_CAPTURE_NAME",
  );
  const duplicate = `${rules}\ncapture "other" {\nletter\n}`;
  assert.throws(
    () => editGroup(duplicate, group(duplicate), { capturing: true, name: "other" }),
    (e) => e instanceof CompileError && e.code === "DUPLICATE_CAPTURE_NAME",
  );
  assert.throws(
    () => editGroup(rules, { line: 2, column: 1 }, { capturing: true, name: "ok" }),
    (e) => e instanceof CompileError && e.code === "UNKNOWN_GROUP",
  );
  for (const location of [null, { line: 0, column: 1 }, { line: 1, column: Infinity }])
    assert.throws(() => editGroup(rules, location, { capturing: true, name: "ok" }), TypeError);
  for (const definition of [
    null,
    { capturing: "yes", name: null },
    { capturing: false, name: "word" },
  ])
    assert.throws(() => editGroup(rules, group(rules), definition), TypeError);
  const bounded = rules + " ".repeat(16384 - rules.length);
  assert.throws(
    () => editGroup(bounded, group(bounded), { capturing: true, name: "longer" }),
    (e) => e instanceof CompileError && e.code === "SOURCE_LIMIT",
  );
  assert.throws(
    () => editGroup(rules, group(rules), { capturing: true, name: "a".repeat(16385) }),
    (e) => e instanceof CompileError && e.code === "SOURCE_LIMIT" && e.line === 1,
  );
  assert.equal(compile(rules).source, "(?<word>[A-Za-z])\\k<word>");
});
