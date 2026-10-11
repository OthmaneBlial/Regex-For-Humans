import assert from "node:assert/strict";
import test from "node:test";
import { expectationChecks, parseExpectation, readExpectation } from "../web/expectations.js";

test("expectations snapshot spans, empty/absent captures and replacement text", () => {
  const original = {
    spans: [[0, 0]],
    captures: [["", null]],
    replacement: { template: "$1", result: "" },
  };
  const read = readExpectation(original);
  assert.deepEqual(read, original);
  original.spans[0][0] = 1;
  original.captures[0][0] = "changed";
  original.replacement.result = "changed";
  assert.deepEqual(read, {
    spans: [[0, 0]],
    captures: [["", null]],
    replacement: { template: "$1", result: "" },
  });
  assert.equal(parseExpectation("  "), undefined);
  assert.deepEqual(parseExpectation('{"spans":[],"captures":[]}'), { spans: [], captures: [] });
});

test("precise checks compare native UTF-16 ranges and participation without guessing values", () => {
  const input = "😀AB";
  const match = /(?<A>A)(?<empty>)(B)?(C)?/du.exec(input);
  assert(match);
  const matches = [
    {
      value: match[0],
      range: { start: match.index, end: match.index + match[0].length },
      captures: match.slice(1).map((value, index) => ({
        value: value ?? null,
        range: match.indices[index + 1]
          ? { start: match.indices[index + 1][0], end: match.indices[index + 1][1] }
          : null,
      })),
    },
  ];
  assert.deepEqual(
    expectationChecks(
      {
        spans: [[2, 4]],
        captures: [["A", "", "B", null]],
        replacement: { template: "$<A>", result: "😀A" },
      },
      matches,
      input.replace(/(?<A>A)(?<empty>)(B)?(C)?/u, "$<A>"),
    ),
    { spans: true, captures: true, replacement: true },
  );
  assert.deepEqual(
    expectationChecks(
      {
        spans: [[1, 3]],
        captures: [["A", null, "B", ""]],
        replacement: { template: "$<A>", result: "A" },
      },
      matches,
      "😀A",
    ),
    { spans: false, captures: false, replacement: false },
  );
  assert.deepEqual(expectationChecks({ spans: [], captures: [] }, []), {
    spans: true,
    captures: true,
  });
  assert.deepEqual(expectationChecks({ captures: [["A"]] }, matches), { captures: false });
});

test("untrusted detailed expectations reject malformed fields and unchanged native budgets", () => {
  for (const value of [
    null,
    [],
    1,
    "{}",
    { unknown: true },
    { spans: [[1, 0]] },
    { spans: [[0, 2049]] },
    { spans: new Array(1) },
    { captures: [new Array(1)] },
    { captures: [[undefined]] },
    { captures: [new Array(101).fill("")] },
    { replacement: { template: "x".repeat(129), result: "" } },
    { replacement: { template: "", result: "", extra: 1 } },
  ])
    assert.throws(() => readExpectation(value));
  assert.throws(() => parseExpectation(" ".repeat(8193)), RangeError);
  assert.throws(() => parseExpectation('{"__proto__":{}}'), TypeError);
  assert.throws(() => parseExpectation("{"), SyntaxError);
});
