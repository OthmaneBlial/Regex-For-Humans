import assert from "node:assert/strict";
import test from "node:test";
import { CompileError, compile, editGroup, exportRegex, toRegExp, toSVG } from "../index.js";
import { LIMITS, splitLines } from "../src/parser.js";
import { tokenizeRules } from "../web/syntax.js";

test("whole-line comments ignore quotes and structural punctuation across every line separator", () => {
  for (const separator of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    const lines = [
      '  # unfinished " } capture 99',
      "start",
      '# slash \\ and a second quote "',
      '"#"',
      "end",
    ];
    const rules = lines.join(separator);
    assert.deepEqual(splitLines(rules), lines);
    const result = compile(rules);
    assert.equal(result.source, "^#$");
    assert.deepEqual(
      result.segments.map((segment) => segment.line),
      [2, 4, 5],
    );
    assert.equal(toRegExp(result).test("#"), true);
    assert.throws(
      () => compile(['# unfinished "', "bad rule"].join(separator)),
      (error) => error instanceof CompileError && error.line === 2 && error.column === 1,
    );
  }
});

test("comments do not create alternative branches or set operands and group edits retain them", () => {
  const rules =
    '# outside "\nstart\ncapture "word" {\n  either {\n    # between branches "\n    "A"\n    # another }\n    "B"\n  }\n}\n# before reference "\nsame as capture "word"\nend';
  assert.equal(compile(rules).source, "^(?<word>(?:A|B))\\k<word>$");
  const renamed = editGroup(rules, { line: 3, column: 1 }, { capturing: true, name: "label" });
  assert.equal(renamed, rules.replaceAll('"word"', '"label"'));
  assert.equal(toRegExp(compile(renamed)).test("AA"), true);
  assert.match(toSVG(rules), /<svg/u);
  assert.match(exportRegex(rules, { target: "python" }).code, /g1/u);
  const set =
    'start\ncharacter set intersection {\n # first "\n range "A" to "Z"\n # second }\n "A"\n}\nend';
  assert.equal(toRegExp(compile(set, { flags: "v" })).test("A"), true);
  assert.equal(toRegExp(compile(set, { flags: "v" })).test("B"), false);
  assert.throws(
    () => compile('either {\n# does not count\n"A"\n}'),
    (error) => error instanceof CompileError && error.code === "ALTERNATIVE_COUNT",
  );
});

test("comments retain source and line budgets; quoted hashes are literals and inline comments are rejected", () => {
  assert.throws(
    () => compile(`#${"x".repeat(LIMITS.sourceLength)}`),
    (error) => error instanceof CompileError && error.code === "SOURCE_LIMIT",
  );
  assert.throws(
    () => compile(`${"# comment\n".repeat(LIMITS.lines)}"A"`),
    (error) => error instanceof CompileError && error.code === "LINE_LIMIT",
  );
  assert.throws(
    () => compile('# comment "'),
    (error) => error instanceof CompileError && error.code === "EMPTY_SOURCE",
  );
  assert.equal(compile('"# comment"').source, "# comment");
  assert.throws(
    () => compile('"A" # inline'),
    (error) => error instanceof CompileError,
  );
});

test("syntax tokens cover the original source exactly with every requested lexical category", () => {
  const source =
    '# untouched " <img onerror=alert(1)>\nstart\noptional capture "اسم" {\n  either {\n    2 digits\n    "A\\"😀"\n  }\n}\nfollowed by {\n word boundary\n}\nend';
  const tokens = tokenizeRules(source);
  assert(tokens);
  assert.equal(tokens.map((token) => source.slice(token.start, token.end)).join(""), source);
  let end = 0;
  for (const token of tokens) {
    assert.equal(token.start, end);
    assert(token.end > token.start);
    end = token.end;
  }
  assert.equal(end, source.length);
  for (const kind of [
    "keyword",
    "string",
    "capture",
    "quantifier",
    "assertion",
    "alternation",
    "comment",
  ])
    assert(
      tokens.some((token) => token.kind === kind),
      kind,
    );
  const literal = tokens.find((token) => token.kind === "string");
  assert.equal(source.slice(literal.start, literal.end), '"A\\"😀"');
});

test("compiler positions underline diagnosed tokens without inventing later errors", () => {
  const source = '# quote "\r\nstart\r\nnonsense\r\nend';
  let diagnostic;
  try {
    compile(source);
  } catch (error) {
    diagnostic = error;
  }
  assert(diagnostic instanceof CompileError);
  const tokens = tokenizeRules(source, diagnostic);
  assert(tokens);
  assert.deepEqual(
    tokens
      .filter((token) => token.kind === "invalid")
      .map((token) => source.slice(token.start, token.end)),
    ["nonsense"],
  );
  assert.equal(tokens.map((token) => source.slice(token.start, token.end)).join(""), source);
  assert.equal(tokenizeRules('"unfinished')[0].kind, "invalid");
  assert.equal(tokenizeRules("start\n", { line: 2, column: 1 }).at(-1).kind, "invalid");
});

test("syntax highlighting stays bounded, supports blank trailing lines and distinguishes references from counts", () => {
  assert.equal(tokenizeRules("x".repeat(LIMITS.sourceLength + 1)), null);
  assert.equal(tokenizeRules("\n".repeat(LIMITS.lines + 1)), null);
  assert.notEqual(tokenizeRules("# c\n".repeat(LIMITS.lines)), null);
  assert.deepEqual(tokenizeRules(""), []);
  const source = 'same as capture 2\n3 digits\n"capture optional # text"';
  const tokens = tokenizeRules(source);
  assert(tokens);
  assert.equal(
    tokens
      .filter((token) => token.kind === "capture")
      .map((token) => source.slice(token.start, token.end))
      .join("|"),
    "same as capture|2",
  );
  assert.equal(tokens.find((token) => token.kind === "quantifier").start, source.indexOf("3"));
  assert.equal(tokens.at(-1).kind, "string");
});
