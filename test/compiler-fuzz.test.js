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
    'start\na "😀"\nend',
    "text without: a, b",
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
