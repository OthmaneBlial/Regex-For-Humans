import assert from "node:assert/strict";
import test from "node:test";
import { CompileError, compile } from "../index.js";
import { splitLines } from "../src/parser.js";

test("seeded arbitrary rules compile deterministically or fail with a valid location", () => {
  let state = 0x51a7_2026;
  const next = () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
  const alphabet = [
    ...'start end line digit text without any character "\\,:*?[]-^$+|().',
    "\n",
    "\r",
    "\t",
    "\0",
    "😀",
    "\u2028",
    "\u2029",
    "\ud800",
    "\udc00",
  ];
  const validRules = [
    "start\n3 digits\nend",
    "line start\nany text\n3 digits\nline end",
    'start\n"😀"\nend',
    "text without: a, b",
    "start\n2 hex digits\nend",
    "start between 2 and 4 digits\nend",
    "start\noptional digit\nend",
  ];
  const cases = [...validRules];

  for (let index = 0; index < 512; index += 1) {
    const length = next() % 96;
    let source = Array.from({ length }, () => alphabet[next() % alphabet.length]).join("");
    if (index % 8 === 0) {
      const valid = validRules[next() % validRules.length];
      const offset = next() % (source.length + 1);
      source = source.slice(0, offset) + valid + source.slice(offset);
    }
    cases.push(source);
  }

  for (const source of cases) {
    let result;
    try {
      result = compile(source);
    } catch (error) {
      assert.ok(error instanceof CompileError, `unexpected error for ${JSON.stringify(source)}`);
      const lines = splitLines(source);
      assert.ok(error.line >= 1 && error.line <= lines.length, JSON.stringify(source));
      assert.ok(error.column >= 1 && error.column <= lines[error.line - 1].length + 1);
      continue;
    }

    assert.deepEqual(compile(source), result, JSON.stringify(source));
    assert.doesNotThrow(() => new RegExp(result.source, result.flags));
    let end = 0;
    for (const segment of result.segments) {
      assert.equal(segment.sourceStart, end, JSON.stringify(source));
      assert.ok(segment.sourceEnd > segment.sourceStart, JSON.stringify(source));
      assert.equal(
        result.source.slice(segment.sourceStart, segment.sourceEnd),
        segment.source,
        JSON.stringify(source),
      );
      end = segment.sourceEnd;
    }
    assert.equal(end, result.source.length, JSON.stringify(source));
  }
});

test("seeded valid literals and character lists preserve exact matching through UTF-8", () => {
  let state = 0x7e57_2026;
  const next = () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
  const boundaries = [
    ...'"\\,:*?[]-^$+|().',
    "\0",
    "\n",
    "\r",
    "\t",
    "\u0085",
    "\u009b",
    "\u2028",
    "\u2029",
    "\u202e",
    "\ud800",
    "\udbff",
    "\udc00",
    "\udfff",
    "😀",
    "𐀀",
    "\ufffd",
  ];
  const lists = [boundaries, ["\ud800", "\udc00"], ["\ud800\udc00"], ["]", "-", "^", "\\"]];
  for (let index = 0; index < 512; index += 1) {
    lists.push(
      Array.from({ length: 3 }, () =>
        next() >>> 31 === 0
          ? boundaries[next() % boundaries.length]
          : String.fromCodePoint(next() % 0x110000),
      ),
    );
  }
  for (const items of lists) {
    const value = items.join("");
    const literal = compile(`start\n${JSON.stringify(value)}\nend`);
    const source = Buffer.from(literal.source).toString("utf8");
    assert.equal(source, literal.source, JSON.stringify(value));
    const regex = new RegExp(source, literal.flags);
    for (const candidate of [value, `${value}X`, `X${value}`, value.slice(1), `${value}\n`]) {
      assert.equal(
        regex.test(candidate),
        candidate === value,
        JSON.stringify({ value, candidate }),
      );
    }
    const repeated = compile(`start\nbetween 0 and 2 ${JSON.stringify(value)}\nend`);
    const repeatRegex = new RegExp(Buffer.from(repeated.source).toString("utf8"), repeated.flags);
    for (let count = 0; count <= 3; count += 1) {
      const candidate = value.repeat(count);
      // Joining a trailing high surrogate to a leading low surrogate changes the code points.
      const expected = count <= 2 && [...candidate].length === [...value].length * count;
      assert.equal(repeatRegex.test(candidate), expected, JSON.stringify({ value, count }));
    }
    for (const negative of [false, true]) {
      const rule = `${negative ? "none" : "one"} of: ${items.map((item) => JSON.stringify(item)).join(", ")}`;
      const result = compile(`start\n${rule}\nend`);
      const transported = Buffer.from(result.source).toString("utf8");
      assert.equal(transported, result.source, rule);
      const classRegex = new RegExp(transported, result.flags);
      for (const candidate of [...items, ...boundaries, "", "AB"]) {
        const expected = [...candidate].length === 1 && items.includes(candidate) !== negative;
        assert.equal(classRegex.test(candidate), expected, JSON.stringify({ rule, candidate }));
      }
    }
  }
});
