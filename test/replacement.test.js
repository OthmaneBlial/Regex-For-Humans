import assert from "node:assert/strict";
import test from "node:test";
import { replaceBounded } from "../web/replacement.js";

test("bounded substitution matches native replacement tokens, absent captures and UTF-16 context", () => {
  const patterns = [
    "(?<word>A)(B)?",
    "(A)(B)?",
    "(A)|(B)",
    "(?<empty>)",
    "(?=(?<rest>.*))",
    "😀|A",
    "()".repeat(100),
  ];
  const inputs = ["", "A", "AB", "BA", "😀AB\r\nA", "A\u2028B", "\ud800A", "AaB"];
  const templates = [
    "",
    "X",
    "$$",
    "$&",
    "$`",
    "$'",
    "$0",
    "$00",
    "$01",
    "$09",
    "$10",
    "$19",
    "$99",
    "$100",
    "$<word>",
    "$<empty>",
    "$<missing>",
    "$<broken$&",
    "$<other$&>",
    "$$&$1$2$<word>$`$'",
    "😀$1\t\n",
  ];
  let comparisons = 0;
  for (const source of patterns)
    for (const flags of ["u", "gu", "iyu", "gimsuy", "v", "gv"]) {
      for (const input of inputs)
        for (const template of templates) {
          assert.equal(
            replaceBounded(source, flags, input, template),
            input.replace(new RegExp(source, flags), template),
            JSON.stringify({ source, flags, input, template }),
          );
          comparisons += 1;
        }
    }
  assert.equal(comparisons, 7056);
});

test("seeded replacement templates agree with native one-pass substitution", () => {
  let seed = 719;
  const alphabet = ["$", "<", ">", "1", "0", "9", "&", "`", "'", "A", "😀", "\n"];
  for (let index = 0; index < 400; index++) {
    let template = "";
    for (let token = 0; token < 24; token++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      template += alphabet[seed % alphabet.length];
    }
    for (const source of ["(A)(B)?", "(?<A>A)?(?<B>B)", "(?<rest>.*)"]) {
      const input = "😀ABA\r\n";
      assert.equal(
        replaceBounded(source, "gu", input, template),
        input.replace(new RegExp(source, "gu"), template),
        JSON.stringify({ source, template }),
      );
    }
  }
});

test("replacement budgets reject without returning a partial result", () => {
  assert.throws(() => replaceBounded("", "gu", "A".repeat(100), ""), /100 matches/u);
  assert.equal(replaceBounded("A", "gu", "A".repeat(100), "B"), "B".repeat(100));
  assert.throws(() => replaceBounded("", "gu", "A", "x".repeat(129)), TypeError);
  assert.throws(() => replaceBounded("A", "u", "x".repeat(2049), ""), TypeError);
  assert.throws(
    () => replaceBounded("(?=(.*))", "gu", "A".repeat(2048), "$1".repeat(64)),
    /65,536/u,
  );
  assert.equal(replaceBounded("A", "u", "AB", ""), "B");
});
