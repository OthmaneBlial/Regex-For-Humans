import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { compile, exportRegex } from "../index.js";
import { LIMITS } from "../src/parser.js";
import { EXPORT_CASES, FOREIGN_TARGETS } from "./fixtures/engine-exports.js";

test("JavaScript and TypeScript code preserve the complete native source/flags and safely quote data", () => {
  for (const item of EXPORT_CASES) {
    for (const target of ["javascript", "typescript"]) {
      const value = exportRegex(item.rules, { target, flags: item.flags });
      assert.equal(value.source, compile(item.rules, { flags: item.flags }).source);
      assert.equal(value.flags, compile(item.rules, { flags: item.flags }).flags);
      const code =
        target === "typescript" ? value.code.replace("regex: RegExp", "regex") : value.code;
      const regex = vm.runInNewContext(`${code}\nregex`);
      assert.equal(regex.source, new RegExp(value.source, value.flags).source);
      for (const input of item.inputs)
        assert.deepEqual(
          Array.from(regex.exec(input) ?? []).map((x) => x ?? null),
          Array.from(new RegExp(value.source, value.flags).exec(input) ?? []).map((x) => x ?? null),
        );
    }
  }
  const injected = '"; globalThis.exportWasInjected = true; //\u2028\u2029\u202e\u2067😀';
  const output = exportRegex(JSON.stringify(injected));
  const context = { exportWasInjected: false };
  const regex = vm.runInNewContext(`${output.code}\nregex`, context);
  assert.equal(regex.test(injected), true);
  assert.equal(context.exportWasInjected, false);
  assert.equal(/[\u2028-\u202e\u2066-\u2069]/u.test(output.code), false);
  assert.equal(exportRegex('"a"', { flags: "dgimsy" }).flags, "dgimsuy");
});

test("all target profiles translate the shared corpus and preserve capture identities", () => {
  let count = 0;
  for (const item of EXPORT_CASES) {
    for (const target of item.targets) {
      const result = exportRegex(item.rules, { target, flags: item.flags });
      assert.equal(result.target, target);
      assert.equal(result.originalFlags, compile(item.rules, { flags: item.flags }).flags);
      assert.ok(result.source.length <= LIMITS.regexSourceLength);
      assert.ok(result.requirements.some((s) => /well-formed Unicode/u.test(s)));
      assert.deepEqual(
        result.captures.map((c) => c.targetName),
        result.captures.map((c) => `g${c.index}`),
      );
      count += 1;
    }
  }
  assert.ok(count > 150);
  const capture = exportRegex(EXPORT_CASES.find((x) => x.name === "mixed-named-captures").rules, {
    target: "ruby",
  });
  assert.deepEqual(capture.captures, [
    { index: 1, name: "اسم", targetName: "g1" },
    { index: 2, name: null, targetName: "g2" },
  ]);
  assert.match(exportRegex('"a"', { target: "csharp" }).code, /FromMilliseconds\(1200\)/u);
  assert.ok(
    exportRegex('"a"', { target: "php" }).requirements.some((s) =>
      /PHP 8\.5\.11 \/ PCRE2 10\.44/u.test(s),
    ),
  );
});

test("untranslated flags and properties fail explicitly without changing the JavaScript compiler", () => {
  for (const target of FOREIGN_TARGETS) {
    assert.throws(() => exportRegex('not word boundary\noptional "a"', { target }), {
      code: "EXPORT_ZERO_WIDTH_POSITION",
      line: 1,
    });
    for (const flags of ["d", "g", "i", "y", "di"])
      assert.throws(() => exportRegex('"a"', { target, flags }), {
        code: "UNSUPPORTED_EXPORT_FLAGS",
        line: 1,
        column: 1,
      });
    assert.throws(() => exportRegex('  unicode property "Letter"', { target }), {
      code: "EXPORT_UNICODE_PROPERTY",
      line: 1,
    });
    assert.throws(() => exportRegex('unicode property "RGI_Emoji"', { target, flags: "v" }), {
      code: "EXPORT_UNICODE_PROPERTY",
      line: 1,
    });
    assert.throws(() => exportRegex('"\\ud800"', { target }), {
      code: "EXPORT_LONE_SURROGATE",
      line: 1,
    });
  }
  assert.equal(compile('"\\ud800"').source, "\\u{d800}");
  assert.throws(() => exportRegex('"a"', { target: "__proto__" }), {
    code: "UNSUPPORTED_EXPORT_TARGET",
  });
  for (const options of [null, [], false])
    assert.throws(() => exportRegex('"a"', options), TypeError);
});

test("target-specific diagnostics retain the unsupported construct's original location", () => {
  for (const target of ["go", "rust"]) {
    assert.throws(() => exportRegex('"a"\n  followed by {\n"b"\n}', { target }), {
      code: "EXPORT_LOOKAROUND",
      line: 2,
      column: 3,
    });
    assert.throws(() => exportRegex('capture "x" {\n"a"\n}\n  same as capture "x"', { target }), {
      code: "EXPORT_BACKREFERENCE",
      line: 4,
      column: 19,
    });
    assert.throws(() => exportRegex('  line start\n"a"', { target }), {
      code: "EXPORT_LINE_ANCHOR",
      line: 1,
      column: 3,
    });
  }
  for (const target of ["java", "ruby"])
    assert.throws(
      () => exportRegex('optional capture "x" {\n"a"\n}\nsame as capture "x"', { target }),
      { code: "EXPORT_UNSET_REFERENCE", line: 4 },
    );
  for (const target of ["python", "ruby", "php"])
    assert.throws(() => exportRegex('  preceded by {\none or more "a"\n}\n"b"', { target }), {
      code: "EXPORT_LOOKBEHIND_WIDTH",
      line: 1,
      column: 3,
    });
  assert.throws(() => exportRegex('10 group {\n101 "a"\n}', { target: "go" }), {
    code: "EXPORT_REPETITION_LIMIT",
    line: 2,
  });
});

test("capture clearing and backward references are rejected where their value semantics differ", () => {
  const reset = 'one or more group {\ncapture "a" {\n"a"\n}\noptional capture "b" {\n"b"\n}\n}';
  const branch = '2 either {\ncapture "x" {\n"a"\n}\n"b"\n}';
  for (const target of FOREIGN_TARGETS) {
    for (const rules of [reset, branch])
      assert.throws(() => exportRegex(rules, { target }), {
        code: "EXPORT_CAPTURE_RESET",
        line: 1,
      });
    assert.throws(
      () =>
        exportRegex('preceded by {\ncapture "x" {\n"a"\n}\nsame as capture "x"\n}\n"b"', {
          target: target === "go" || target === "rust" ? "python" : target,
        }),
      { code: "EXPORT_LOOKBEHIND_REFERENCE" },
    );
  }
  assert.throws(
    () => exportRegex('not preceded by {\ncapture "x" {\n"a"\n}\n}\n"b"', { target: "ruby" }),
    { code: "EXPORT_LOOKBEHIND_CAPTURE" },
  );
});

test("exports preserve shared malformed-rule, flag and source-budget diagnostics", () => {
  for (const [rules, options] of [
    ["unknown rule", {}],
    ['capture {\n"a"', {}],
    ['"a"', { flags: "uv" }],
    [" ".repeat(LIMITS.sourceLength + 1), {}],
  ]) {
    let expected;
    try {
      compile(rules, options);
    } catch (error) {
      expected = error.toJSON();
    }
    for (const target of ["javascript", ...FOREIGN_TARGETS])
      assert.throws(
        () => exportRegex(rules, { ...options, target }),
        (error) => {
          assert.deepEqual(error.toJSON(), expected);
          return true;
        },
      );
  }
});
