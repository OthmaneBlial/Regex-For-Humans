import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";
import { LIMITS, parse } from "../src/parser.js";

test("four explicit assertions require context without consuming it and preserve trace spans", () => {
  for (const [rules, source, input, expected, position, direction, negative] of [
    ['"USD"\nfollowed by {\ndigits\n}', String.raw`USD(?=\d+)`, "USD123", "USD", 0, "ahead", false],
    [
      '"USD"\nnot followed by {\ndigit\n}',
      String.raw`USD(?!\d)`,
      "USDabc",
      "USD",
      0,
      "ahead",
      true,
    ],
    [
      'preceded by {\n"USD"\n}\ndigits',
      String.raw`(?<=USD)\d+`,
      "USD123",
      "123",
      3,
      "behind",
      false,
    ],
    ['not preceded by {\n"USD"\n}\n"123"', "(?<!USD)123", "EUR123", "123", 3, "behind", true],
  ]) {
    const result = compile(rules);
    assert.equal(result.source, source);
    const match = toRegExp(result).exec(input);
    assert.equal(match[0], expected);
    assert.equal(match.index, position);
    const edges = result.segments.filter((s) => s.kind === "assertion");
    assert.deepEqual(
      edges.map((s) => [s.edge, s.direction, s.negative]),
      [
        ["start", direction, negative],
        ["end", direction, negative],
      ],
    );
    assert.match(edges[0].explanation, /without consuming characters/u);
    for (const segment of result.segments) {
      assert.equal(result.source.slice(segment.sourceStart, segment.sourceEnd), segment.source);
      assert.equal(rules.split("\n")[segment.line - 1].trim(), segment.text);
    }
    assert.equal(parse(rules).nodes.find((node) => node.kind === "assertion").direction, direction);
  }
  assert.equal(toRegExp(compile('"USD"\nnot followed by {\ndigit\n}')).test("USD123"), false);
  assert.equal(toRegExp(compile('not preceded by {\n"USD"\n}\n"123"')).test("USD123"), false);
  assert.equal(compile('NOT\tPRECEDED\tBY {\n"x"\n}\n"a"').source, "(?<!x)a");
});

test("assertion captures may lie outside consuming spans and negative captures stay absent", () => {
  const before = compile(
    'preceded by {\ncapture "currency" {\n"USD"\n}\n}\ncapture "amount" {\ndigits\n}',
  );
  const behind = new RegExp(before.source, "du").exec("USD123");
  assert.deepEqual([...behind], ["123", "USD", "123"]);
  assert.deepEqual(
    [...behind.indices],
    [
      [3, 6],
      [0, 3],
      [3, 6],
    ],
  );
  const after = compile('"USD"\nfollowed by {\ncapture "amount" {\ndigits\n}\n}');
  const ahead = new RegExp(after.source, "du").exec("USD123");
  assert.deepEqual([...ahead], ["USD", "123"]);
  assert.deepEqual(
    [...ahead.indices],
    [
      [0, 3],
      [3, 6],
    ],
  );
  const absent = compile(
    'not followed by {\ncapture "forbidden" {\n"x"\n}\n}\n"a"\nsame as capture "forbidden"',
  );
  assert.equal(toRegExp(absent).exec("a").groups.forbidden, undefined);
  assert.equal(toRegExp(absent).test("ax"), true);
  const rtl = regexToRules(/(?<=([ab]+)([bc]+))$/u);
  assert.deepEqual([...toRegExp(compile(rtl.rules)).exec("abc")], ["", "a", "bc"]);
});

const patterns = [
  "a(?=b)",
  "a(?!b)",
  "(?<=a)b",
  "(?<!a)b",
  "(?=)",
  "(?!)",
  "(?<=)",
  "(?<!)",
  "(?=(a+))a*b\\1",
  "(.*?)a(?!(a+)b\\2c)\\2(.*)",
  "(?<=([ab]+)([bc]+))$",
  "(?<=(?<x>a+?))b",
  "(?<=a|bc)d",
  "(?<!a|bc)d",
  "(?=(?<x>a|b))\\k<x>",
  "(?:(?=a)a|(?<=b)c)",
  "(?=(?:a(?=b)))ab",
  "(?<=a(?=b))b",
  "(?<!a(?!b))b",
  "(?<=😀)(?<x>a)",
  "(?=(?<emoji>😀))",
  String.raw`(?<=\uD83D\uDE00)a`,
  String.raw`(?<=\u{D83D}\u{DE00})a`,
  "(?<=(a)b)\\1",
  "(?<=(?<x>a)\\k<x>)b",
  "(?<x>a)(?=\\k<x>)",
  "(?!(?<x>a))b\\k<x>",
  "(?=(?:.[^]))",
  "(?<=[^].)a",
  "(?<=^(?<word>[A-Za-z]+))b$",
  "(?=(?<empty>))",
  "(?:(?<x>a)(?=b)b)+?",
  "(?=(?:a|))",
  "(?<=((a)|(b))+)c",
  "(?<=(a{1,3}?))b",
];
const samples = [
  "",
  "a",
  "aa",
  "aaa",
  "aaaa",
  "b",
  "bb",
  "ab",
  "aab",
  "aaab",
  "aba",
  "abc",
  "abac",
  "baabac",
  "baaabaac",
  "aaabaaaaab",
  "bca",
  "abcd",
  "bcd",
  "d",
  "bcbd",
  "bcabc",
  "AB",
  "ABC",
  "K",
  "K",
  "😀",
  "😀a",
  "a😀",
  "😀😀",
  "\ud83d",
  "\ude00",
  "\ud83d\ude00a",
  "a\nb",
  "\na\n",
  "\nbc\n",
  "\n",
  "é",
  "é",
];

test("lookarounds round-trip with native direction, atomicity, capture values and indices across flags", () => {
  for (const source of patterns)
    for (const flags of ["u", "iu", "mu", "imu", "su", "isu", "msu", "imsu"]) {
      const regex = new RegExp(source, flags);
      regex.lastIndex = 8;
      const translated = regexToRules(regex);
      assert.equal(regex.lastIndex, 8);
      const result = compile(translated.rules, { flags: translated.flags });
      const original = new RegExp(source, `d${flags}`);
      const rebuilt = new RegExp(result.source, `d${result.flags}`);
      for (const text of samples)
        assert.deepEqual(
          rebuilt.exec(text),
          original.exec(text),
          `${regex}: ${JSON.stringify(text)}\n${translated.rules}`,
        );
    }
});

test("assertions retain brace, direct-repetition, capture, anchor and mixed depth diagnostics", () => {
  for (const [rules, code, line, column] of [
    ["followed by", "INVALID_ASSERTION", 1, 12],
    ["preceded by (", "INVALID_ASSERTION", 1, 13],
    ['  followed by {\n"a"', "UNCLOSED_GROUP", 1, 3],
    ["optional followed by {\n}", "ASSERTION_REPETITION", 1, 10],
    ["2 not preceded by {\n}", "ASSERTION_REPETITION", 1, 3],
    ["lazy followed by {\n}", "INVALID_LAZY_REPETITION", 1, 1],
    [
      'followed by {\ncapture "x" {\n"a"\n}\n}\ncapture "x" {\n"b"\n}',
      "DUPLICATE_CAPTURE_NAME",
      6,
      1,
    ],
    ['capture "x" {\nfollowed by {\nsame as capture "x"\n}\n}', "SELF_CAPTURE_REFERENCE", 3, 17],
    ["followed by {\nstart\nstart\n}\nline end", "DUPLICATE_ANCHOR", 3, 1],
  ])
    assert.throws(() => compile(rules), { code, line, column });
  const nested = (depth) => `${"followed by {\n".repeat(depth)}"a"\n${"}\n".repeat(depth)}`;
  assert.equal(toRegExp(compile(nested(LIMITS.groupDepth))).test("a"), true);
  assert.throws(() => compile(nested(LIMITS.groupDepth + 1)), {
    code: "GROUP_DEPTH_LIMIT",
    line: 65,
  });
  assert.throws(() => regexToRules(new RegExp(`${"(?=".repeat(65)}a${")".repeat(65)}`, "u")), {
    code: "GROUP_DEPTH_LIMIT",
    line: 1,
    column: 193,
  });
  const forward = String.raw`(?<=\k<x>(?<x>a))b`;
  assert.throws(() => regexToRules(new RegExp(forward, "u")), {
    code: "UNSUPPORTED_REGEX",
    line: 1,
    column: 5,
  });
});

test("lookbehind capability is checked explicitly without weakening or approximating the pattern", () => {
  const NativeRegExp = globalThis.RegExp;
  let probes = 0;
  globalThis.RegExp = class extends NativeRegExp {
    constructor(source, flags) {
      if (String(source).includes("(?<=")) {
        probes += 1;
        throw new SyntaxError("Lookbehind unavailable");
      }
      super(source, flags);
    }
  };
  try {
    assert.throws(() => compile('"a"\n  preceded by {\n"b"\n}'), {
      code: "UNSUPPORTED_TARGET_FEATURE",
      line: 2,
      column: 3,
    });
    assert.throws(() => compile('not preceded by {\n"a"\n}'), {
      code: "UNSUPPORTED_TARGET_FEATURE",
    });
    assert.equal(compile('followed by {\n"a"\n}').source, "(?=a)");
    assert.equal(probes, 2);
  } finally {
    globalThis.RegExp = NativeRegExp;
  }
});

test("CLI assertion compilation and import share zero-width and capture semantics", () => {
  const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
  const forward = spawnSync(process.execPath, [cli, "--json", "-"], {
    input: 'preceded by {\n"USD"\n}\ndigits',
    encoding: "utf8",
  });
  assert.equal(forward.status, 0, forward.stderr);
  const result = JSON.parse(forward.stdout);
  assert.equal(result.segments[0].direction, "behind");
  assert.equal(toRegExp(result).exec("USD123")[0], "123");
  const reverse = spawnSync(process.execPath, [cli, "--reverse", "--json", "-"], {
    input: "/(?=(?<field>[A-Za-z]+))\\k<field>/u",
    encoding: "utf8",
  });
  assert.equal(reverse.status, 0, reverse.stderr);
  const translated = JSON.parse(reverse.stdout);
  assert.equal(toRegExp(compile(translated.rules)).exec("abc").groups.field, "abc");
});
