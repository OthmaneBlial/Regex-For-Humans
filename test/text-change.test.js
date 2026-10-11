import assert from "node:assert/strict";
import test from "node:test";
import { LIMITS } from "../src/limits.js";
import { textChange, textChanges } from "../web/text-change.js";

test("text changes retain exact context for replacements, additions, removals and no-ops", () => {
  assert.deepEqual(textChange("old\nkept\nold", "new\nkept\nnew"), {
    prefix: "",
    before: "old\nkept\nold",
    after: "new\nkept\nnew",
    suffix: "",
  });
  assert.deepEqual(textChange("abc", "abXYc"), {
    prefix: "ab",
    before: "",
    after: "XY",
    suffix: "c",
  });
  assert.deepEqual(textChange("abXYc", "abc"), {
    prefix: "ab",
    before: "XY",
    after: "",
    suffix: "c",
  });
  assert.deepEqual(textChange("same", "same"), {
    prefix: "same",
    before: "",
    after: "",
    suffix: "",
  });
  assert.deepEqual(textChange("", ""), { prefix: "", before: "", after: "", suffix: "" });
});

test("text changes keep complete Unicode code points and make controls visible", () => {
  assert.deepEqual(textChange("x𐐀z", "x𐐁z"), {
    prefix: "x",
    before: "𐐀",
    after: "𐐁",
    suffix: "z",
  });
  const source = '# <img onerror="alert(1)">\u202e\r\n\t"😀"\u2028\u0000';
  const change = textChange(source, source);
  assert.equal(
    change.prefix,
    '# <img onerror="alert(1)">\\u202e\\u000d\n\\u0009"😀"\\u2028\\u0000',
  );
  assert.equal(change.before + change.after + change.suffix, "");
  assert.equal(textChange("\ud800", "x").before, "\ud800");
});

test("bounded random text changes reconstruct both sides without overlapping context", () => {
  const alphabet = ["a", "b", "𐐀", "𐐁", "😀", "\n", "\ud800"];
  let seed = 17;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % 7;
  };
  const text = () => Array.from({ length: 1 + random() * 3 }, () => alphabet[random()]).join("");
  for (let index = 0; index < 500; index += 1) {
    const before = text();
    const after = text();
    const change = textChange(before, after);
    assert.equal(change.prefix + change.before + change.suffix, before);
    assert.equal(change.prefix + change.after + change.suffix, after);
    const changes = textChanges(before, after);
    assert.equal(changes.map((part) => part.prefix + part.before + part.suffix).join(""), before);
    assert.equal(changes.map((part) => part.prefix + part.after + part.suffix).join(""), after);
  }
});

test("line alignment keeps unchanged bodies outside separated edits and handles insertions, repeats and budgets", () => {
  const before = 'capture "word" {\n  letter\n}\nsame as capture "word"\n';
  const after = before.replaceAll("word", "label");
  const changes = textChanges(before, after);
  assert.deepEqual(
    changes.filter((part) => part.before || part.after).map((part) => [part.before, part.after]),
    [
      ["word", "label"],
      ["word", "label"],
    ],
  );
  for (const [old, next] of [
    ["a\nx\nx\nb\n", "a\nx\nb\n"],
    ["a\nb\n", "a\nx\nb\n"],
    ["", "a\n"],
    ["a\n", ""],
    ["a\n", "a"],
    ["x\n".repeat(LIMITS.lines), "x\n".repeat(LIMITS.lines - 1)],
  ]) {
    const parts = textChanges(old, next);
    assert.equal(parts.map((part) => part.prefix + part.before + part.suffix).join(""), old);
    assert.equal(parts.map((part) => part.prefix + part.after + part.suffix).join(""), next);
  }
  const oversized = "x\n".repeat(LIMITS.lines + 1);
  assert.deepEqual(textChanges(oversized, "changed"), [textChange(oversized, "changed")]);
});
