import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile, regexToRules, toRegExp } from "../index.js";

const guide = readFileSync(new URL("../docs/COMPLEX-EXAMPLES.md", import.meta.url), "utf8");
const cli = fileURLToPath(new URL("../bin/regex-for-humans.js", import.meta.url));
const examples = [
  ...guide.matchAll(/<a id="([a-z-]+)"><\/a>\n([\s\S]*?)(?=\n<a id=|\n## Captures)/gu),
];

test("the complex guide contains four complete worked examples", () => {
  assert.deepEqual(
    examples.map(([, id]) => id),
    ["access-log", "structured-event", "artifact-manifest", "multiline-order"],
  );
});

for (const [, id, section] of examples) {
  test(`complex documentation: ${id}`, () => {
    const rules = /### Rules\n\n```text\n([\s\S]*?)\n```/u.exec(section)?.[1];
    const shown = /### Generated regex\n\n```js\n\/(.*)\/([a-z]+)\n```/u.exec(section);
    const input = /### Example input\n\n```text\n([\s\S]*?)\n```/u.exec(section)?.[1];
    assert.ok(rules && shown && input, "rules, generated regex and sample input are present");
    const result = compile(rules);
    assert.equal(result.source, shown[1]);
    assert.equal(result.flags, shown[2]);
    assert.equal(result.flags, "u");
    assert.ok(result.segments.length >= 19, "example composes many supported rules");
    assert.ok(result.source.length >= 180, "example produces a substantial pattern");
    assert.ok(toRegExp(result).test(input), "displayed sample matches");
    assert.ok(
      guide.includes(`| ${rules.split("\n").length} | ${result.source.length} UTF-16 code units |`),
    );

    const rows = [...section.matchAll(/^\| (\d+) \| `([^`]+)` \| `([^`]+)` \| (.+) \|$/gmu)];
    assert.deepEqual(
      rows.map(([, line, text, source, explanation]) => ({
        line: Number(line),
        text,
        source,
        explanation,
      })),
      result.segments.map(({ line, text, source, explanation }) => ({
        line,
        text,
        source,
        explanation,
      })),
      "every displayed rule, fragment and explanation is current compiler output",
    );

    const cases = [
      ...section.matchAll(/^\| (✅ Match|❌ No match) \| `([^`]+)` \| (.+) \|$/gmu),
    ].map(([, outcome, json]) => [outcome === "✅ Match", JSON.parse(json)]);
    assert.ok(cases.filter(([expected]) => expected).length >= 3);
    assert.ok(cases.filter(([expected]) => !expected).length >= 5);
    for (const [expected, value] of cases) {
      assert.equal(toRegExp(result).test(value), expected, JSON.stringify(value));
    }

    for (const flags of ["", "i", "s", "is"]) {
      const original = toRegExp(compile(rules, { flags }));
      const reverse = regexToRules(original);
      const rebuilt = toRegExp(compile(reverse.rules, { flags: reverse.flags }));
      assert.equal(rebuilt.flags, original.flags);
      for (const [, value] of cases) {
        for (const sample of [value, `😀${value}`, `${value}\n`, value.toLowerCase()]) {
          assert.deepEqual(
            rebuilt.exec(sample),
            original.exec(sample),
            "round-trip match and position",
          );
        }
      }
    }

    const json = spawnSync(process.execPath, [cli, "--json", "-"], {
      input: rules,
      encoding: "utf8",
    });
    assert.equal(json.status, 0, json.stderr);
    assert.equal(json.stderr, "");
    assert.deepEqual(JSON.parse(json.stdout), result);
    const explained = spawnSync(process.execPath, [cli, "--explain", "-"], {
      input: rules,
      encoding: "utf8",
    });
    assert.equal(explained.status, 0, explained.stderr);
    assert.equal(explained.stderr, "");
    assert.equal(
      explained.stdout,
      [
        `/${result.source}/${result.flags}`,
        ...result.segments.map(
          ({ line, column, source, explanation }) => `${line}:${column}  ${source}  ${explanation}`,
        ),
        "",
      ].join("\n"),
    );
  });
}

test("complex guide capture and nested-group diagnostics describe actual unsupported syntax", () => {
  const rows = [...guide.matchAll(/^\| `\/(.*)\/u` \| `([A-Z_]+)` \| (\d+) \| (.+) \|$/gmu)];
  assert.equal(rows.length, 3);
  for (const [, source, code, column, message] of rows) {
    assert.throws(() => regexToRules(new RegExp(source, "u")), {
      code,
      column: Number(column),
      message,
    });
  }
  assert.equal(regexToRules(/(?: retry=true)?/u).rules, 'optional " retry=true"');
  assert.throws(() => regexToRules(/(?: retry=\d+)?/u), { code: "UNSUPPORTED_REGEX" });
});
