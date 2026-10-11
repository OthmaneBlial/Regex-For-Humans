import { PATH_SEGMENT_EXCLUDED, PATH_SEGMENT_SOURCE } from "./ast.js";
import { compileAst } from "./compiler.js";
import { fail } from "./diagnostics.js";
import { LIMITS, parse } from "./parser.js";

/** @typedef {import('../index.d.ts').ExportTarget} Target */
/** @typedef {import('./ast.js').RuleNode} Node */
/** @typedef {import('./ast.js').ClassMember} Member */
/** @typedef {[number, number]} Interval */
/** @typedef {{intervals: Interval[], strings: string[]}} Members */

/** @type {Record<Target, string>} */
const ENGINES = {
  javascript: "ECMAScript RegExp",
  typescript: "ECMAScript RegExp (TypeScript source)",
  python: "Python 3.14 re",
  rust: "Rust regex 1.13",
  go: "Go 1.22 regexp",
  java: "Java 17 Pattern",
  csharp: ".NET 10 Regex",
  php: "PHP 8 / PCRE2 fixed-lookbehind profile",
  ruby: "Ruby 2.6 Regexp",
};

/** @type {Interval[]} */
const SCALARS = [
  [0, 0xd7ff],
  [0xe000, 0x10ffff],
];
/** @type {Interval[]} */
const DIGITS = [[0x30, 0x39]];
/** @type {Interval[]} */
const WORD = [
  [0x30, 0x39],
  [0x41, 0x5a],
  [0x5f, 0x5f],
  [0x61, 0x7a],
];
/** @type {Interval[]} */
const SPACE = [
  [9, 13],
  [0x20, 0x20],
  [0xa0, 0xa0],
  [0x1680, 0x1680],
  [0x2000, 0x200a],
  [0x2028, 0x2029],
  [0x202f, 0x202f],
  [0x205f, 0x205f],
  [0x3000, 0x3000],
  [0xfeff, 0xfeff],
];
/** @type {Interval[]} */
const LINES = [
  [10, 10],
  [13, 13],
  [0x2028, 0x2029],
];

/** @param {Interval[]} ranges @returns {Interval[]} */
function union(ranges) {
  /** @type {Interval[]} */
  const result = [];
  for (const [lo, hi] of [...ranges].sort((a, b) => a[0] - b[0])) {
    const last = result.at(-1);
    if (last && lo <= last[1] + 1) last[1] = Math.max(last[1], hi);
    else result.push([lo, hi]);
  }
  return result;
}

/** @param {Interval[]} left @param {Interval[]} right @returns {Interval[]} */
function intersection(left, right) {
  /** @type {Interval[]} */
  const result = [];
  let a = 0,
    b = 0;
  while (a < left.length && b < right.length) {
    const lo = Math.max(left[a][0], right[b][0]);
    const hi = Math.min(left[a][1], right[b][1]);
    if (lo <= hi) result.push([lo, hi]);
    if (left[a][1] < right[b][1]) a += 1;
    else b += 1;
  }
  return result;
}

/** @param {Interval[]} left @param {Interval[]} right @returns {Interval[]} */
function subtraction(left, right) {
  /** @type {Interval[]} */
  const result = [];
  let start = 0;
  for (const [lo, hi] of left) {
    let cursor = lo;
    while (start < right.length && right[start][1] < lo) start += 1;
    for (let j = start; j < right.length && right[j][0] <= hi; j += 1) {
      if (cursor < right[j][0]) result.push([cursor, right[j][0] - 1]);
      cursor = Math.max(cursor, right[j][1] + 1);
      if (cursor > hi) break;
    }
    if (cursor <= hi) result.push([cursor, hi]);
  }
  return result;
}

/** @param {string} value @returns {Interval[]} */
function shorthand(value) {
  const base =
    value === "\\d" || value === "\\D"
      ? DIGITS
      : value === "\\w" || value === "\\W"
        ? WORD
        : value === "\\s" || value === "\\S"
          ? SPACE
          : value === "[A-Za-z]"
            ? [
                [0x41, 0x5a],
                [0x61, 0x7a],
              ]
            : value === "[a-z]"
              ? [[0x61, 0x7a]]
              : value === "[A-Z]"
                ? [[0x41, 0x5a]]
                : value === "[0-9A-Fa-f]"
                  ? [
                      [0x30, 0x39],
                      [0x41, 0x46],
                      [0x61, 0x66],
                    ]
                  : value === "[A-Za-z0-9]"
                    ? [
                        [0x30, 0x39],
                        [0x41, 0x5a],
                        [0x61, 0x7a],
                      ]
                    : value === PATH_SEGMENT_SOURCE
                      ? subtraction(
                          SCALARS,
                          union(
                            PATH_SEGMENT_EXCLUDED.map((c) => [
                              c.codePointAt(0) ?? 0,
                              c.codePointAt(0) ?? 0,
                            ]),
                          ),
                        )
                      : null;
  if (!base) throw new TypeError("Unknown validated shorthand.");
  const ranges = /** @type {Interval[]} */ (base);
  return /^\\[DWS]$/u.test(value) ? subtraction(SCALARS, ranges) : ranges;
}

/** @param {import('./ast.js').Repetition|null} repetition @returns {[number, number]} */
function bounds(repetition) {
  if (!repetition) return [1, 1];
  if (repetition.kind === "exact") return [repetition.min, repetition.min];
  if (repetition.kind === "range") return [repetition.min, repetition.max];
  if (repetition.kind === "atLeast") return [repetition.min, Infinity];
  return [repetition.kind === "oneOrMore" ? 1 : 0, Infinity];
}

/** @param {import('./ast.js').Repetition|null} repetition */
function quantify(repetition) {
  if (!repetition) return "";
  const [lo, hi] = bounds(repetition);
  const value =
    repetition.kind === "zeroOrMore"
      ? "*"
      : repetition.kind === "oneOrMore"
        ? "+"
        : lo === hi
          ? `{${lo}}`
          : `{${lo},${Number.isFinite(hi) ? hi : ""}}`;
  return value + (repetition.lazy ? "?" : "");
}

/** @param {Node[]} nodes @param {boolean} mandatory @param {boolean} [possibleOnly] @returns {Set<number>} */
function captureSet(nodes, mandatory, possibleOnly = false) {
  const result = new Set();
  for (const node of nodes) {
    if ("repetition" in node && mandatory && bounds(node.repetition)[0] === 0) continue;
    if (possibleOnly && "repetition" in node && bounds(node.repetition)[1] === 0) continue;
    if (node.kind === "assertion" && node.negative && possibleOnly) continue;
    if (node.kind === "assertion" && node.negative && mandatory) continue;
    const sets =
      node.kind === "alternation"
        ? node.branches.map((branch) => captureSet(branch, mandatory, possibleOnly))
        : node.kind === "group" || node.kind === "assertion"
          ? [captureSet(node.nodes, mandatory, possibleOnly)]
          : [];
    if (node.kind === "group" && node.capturing && node.captureIndex !== null)
      result.add(node.captureIndex);
    for (const set of sets) {
      for (const index of set) if (!mandatory || sets.every((s) => s.has(index))) result.add(index);
    }
  }
  return result;
}

/** Generate quoted source code separately from the AST's target-engine translation.
 * @param {Target} target @param {string} source @param {string} flags
 */
function snippet(target, source, flags) {
  let quoted = JSON.stringify(source).replace(
    /[\u2028-\u202e\u2066-\u2069]/gu,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
  if (target === "java")
    quoted = quoted.replace(
      /[\u{10000}-\u{10ffff}]/gu,
      (c) =>
        `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}\\u${c.charCodeAt(1).toString(16).padStart(4, "0")}`,
    );
  switch (target) {
    case "javascript":
      return `const regex = new RegExp(${quoted}, ${JSON.stringify(flags)});`;
    case "typescript":
      return `const regex: RegExp = new RegExp(${quoted}, ${JSON.stringify(flags)});`;
    case "python":
      return `import re\n\nregex = re.compile(${quoted})`;
    case "ruby":
      return `regex = Regexp.new(${quoted})`;
    case "php":
      return `<?php\n\n$regex = ${JSON.stringify(`~${source}~${flags}`)};`;
    case "csharp":
      return `var regex = new System.Text.RegularExpressions.Regex(${quoted}, System.Text.RegularExpressions.RegexOptions.CultureInvariant, System.TimeSpan.FromMilliseconds(1200));`;
    case "java":
      return `public final class RegexExample {\n    public static final java.util.regex.Pattern regex = java.util.regex.Pattern.compile(${quoted});\n}`;
    case "go":
      return `package main\n\nimport "regexp"\n\nfunc main() {\n    regex, err := regexp.Compile(${quoted})\n    if err != nil { panic(err) }\n    _ = regex\n}`;
    case "rust":
      return `use regex::Regex;\n\nfn main() -> Result<(), regex::Error> {\n    let _regex = Regex::new(${quoted})?;\n    Ok(())\n}`;
  }
}

/** Translate supported semantics; unsupported behavior gets a positioned diagnostic.
 * @param {string} rules @param {import('../index.d.ts').ExportOptions} [options]
 * @returns {import('../index.d.ts').RegexExport}
 */
export function exportRegex(rules, options = {}) {
  if (options === null || typeof options !== "object" || Array.isArray(options))
    throw new TypeError("Options must be an object.");
  const target = options.target === undefined ? "javascript" : options.target;
  if (typeof target !== "string" || !Object.hasOwn(ENGINES, target)) {
    fail(
      "UNSUPPORTED_EXPORT_TARGET",
      "Choose a supported source-code export target.",
      { line: 1, column: 1 },
      Object.keys(ENGINES).join(", "),
    );
  }
  const parsed = parse(rules);
  const compiled = compileAst(parsed, { flags: options.flags });
  /** @type {import('../index.d.ts').RegexExport['captures']} */
  const captures = [];
  /** @param {Node[]} nodes */
  function collect(nodes) {
    for (const node of nodes) {
      if (node.kind === "group") {
        if (node.capturing && node.captureIndex !== null)
          captures.push({
            index: node.captureIndex,
            name: node.name,
            targetName:
              target === "javascript" || target === "typescript"
                ? node.name
                : `g${node.captureIndex}`,
          });
        collect(node.nodes);
      } else if (node.kind === "assertion") collect(node.nodes);
      else if (node.kind === "alternation") for (const branch of node.branches) collect(branch);
    }
  }
  collect(parsed.nodes);
  captures.sort((a, b) => a.index - b.index);
  if (target === "javascript" || target === "typescript") {
    return {
      target,
      engine: ENGINES[target],
      source: compiled.source,
      flags: compiled.flags,
      originalFlags: compiled.flags,
      code: snippet(target, compiled.source, compiled.flags),
      captures,
      requirements: [
        "Requires native ECMAScript support for the emitted pattern and flags.",
        "This snippet constructs a RegExp; it does not isolate or time-limit matching.",
      ],
    };
  }
  if (/[dgiy]/u.test(compiled.flags)) {
    fail(
      "UNSUPPORTED_EXPORT_FLAGS",
      `${ENGINES[target]} export does not reproduce ECMAScript d, g, i or y behavior.`,
      { line: 1, column: 1 },
      "Remove these flags only if indices, stateful cursors and Unicode case-folding are not required; m/s/u/v are translated through the AST.",
    );
  }

  /** @param {string} code @param {string} message @param {import('./ast.js').Location} location @param {string} hint @returns {never} */
  function unsupported(code, message, location, hint) {
    return fail(code, `${ENGINES[target]}: ${message}`, location, hint);
  }

  /** @param {string} character @param {import('./ast.js').Location} location */
  function scalar(character, location) {
    const cp = character.codePointAt(0);
    if (cp === undefined) throw new TypeError("An empty string is not a scalar.");
    if (cp >= 0xd800 && cp <= 0xdfff)
      unsupported(
        "EXPORT_LONE_SURROGATE",
        "a lone surrogate is outside the Unicode-scalar input contract.",
        location,
        "Keep the JavaScript/TypeScript target when individual surrogate code units must be matched.",
      );
    return cp;
  }

  /** @param {number} cp */
  function escapeScalar(cp) {
    const hex = cp.toString(16);
    // Java 17 recognizes supplementary lookbehind from literal code points, not x escapes.
    if (target === "java" && cp > 0xffff) return String.fromCodePoint(cp);
    if (target === "python")
      return cp <= 0xffff ? `\\u${hex.padStart(4, "0")}` : `\\U${hex.padStart(8, "0")}`;
    if (target === "ruby") return `\\u{${hex}}`;
    if (target === "csharp") return `\\u${hex.padStart(4, "0")}`;
    return `\\x{${hex}}`;
  }

  /** @param {Interval[]} ranges */
  function classSource(ranges) {
    if (!ranges.length)
      return target === "csharp"
        ? "[^\\u0000-\\uffff]"
        : `[^${escapeScalar(0)}-${escapeScalar(0x10ffff)}]`;
    /** @param {Interval[]} entries */
    const bracket = (entries) =>
      `[${entries.map(([a, b]) => (a === b ? escapeScalar(a) : `${escapeScalar(a)}-${escapeScalar(b)}`)).join("")}]`;
    if (target !== "csharp") return bracket(ranges);
    const bmp = intersection(ranges, [
      [0, 0xd7ff],
      [0xe000, 0xffff],
    ]);
    const branches = bmp.length ? [bracket(bmp)] : [];
    for (const [lo, hi] of intersection(ranges, [[0x10000, 0x10ffff]])) {
      const first = 0xd800 + ((lo - 0x10000) >> 10),
        last = 0xd800 + ((hi - 0x10000) >> 10);
      const lower = 0xdc00 + ((lo - 0x10000) & 1023),
        upper = 0xdc00 + ((hi - 0x10000) & 1023);
      if (first === last) branches.push(escapeScalar(first) + bracket([[lower, upper]]));
      else {
        branches.push(escapeScalar(first) + bracket([[lower, 0xdfff]]));
        if (first + 1 < last)
          branches.push(bracket([[first + 1, last - 1]]) + bracket([[0xdc00, 0xdfff]]));
        branches.push(escapeScalar(last) + bracket([[0xdc00, upper]]));
      }
    }
    return `(?:${branches.join("|")})`;
  }

  /** @param {string} value @param {import('./ast.js').Location} location */
  function literal(value, location) {
    return [...value]
      .map((c) => {
        const cp = scalar(c, location);
        return target === "csharp" && cp > 0xffff
          ? escapeScalar(0xd800 + ((cp - 0x10000) >> 10)) +
              escapeScalar(0xdc00 + ((cp - 0x10000) & 1023))
          : escapeScalar(cp);
      })
      .join("");
  }

  /** @param {Member[]} members @param {import('./ast.js').ClassSetOperation} operation @param {boolean} negative @returns {Members} */
  function setMembers(members, operation, negative) {
    const sets = members.map((member) => {
      if (member.kind === "set")
        return setMembers(member.members, member.operation, member.negative);
      if (member.kind === "unicodeProperty")
        return unsupported(
          "EXPORT_UNICODE_PROPERTY",
          "native property data has not been proved equivalent to this ECMAScript runtime.",
          member.propertyLocation,
          "Use explicit ranges/finite strings, or keep the ECMAScript target for Unicode character and string properties.",
        );
      if (member.kind === "shorthand") return { intervals: shorthand(member.value), strings: [] };
      if (member.kind === "range")
        return {
          intervals: intersection(
            [[scalar(member.from, member.location), scalar(member.to, member.location)]],
            SCALARS,
          ),
          strings: [],
        };
      const values =
        member.kind === "literal"
          ? [member.value]
          : member.kind === "strings"
            ? member.values
            : [member.codePoints.join("")];
      if (member.kind === "stringCodePoints")
        for (const c of member.codePoints) scalar(c, member.location);
      /** @type {Interval[]} */
      const intervals = [];
      /** @type {string[]} */
      const strings = [];
      for (const value of values) {
        const cps = [...value].map((c) => scalar(c, member.location));
        if (cps.length === 1) intervals.push([cps[0], cps[0]]);
        else strings.push(value);
      }
      return { intervals: union(intervals), strings: [...new Set(strings)] };
    });
    let result = sets[0] ?? { intervals: [], strings: [] };
    for (const current of sets.slice(1)) {
      result =
        operation === "intersection"
          ? {
              intervals: intersection(result.intervals, current.intervals),
              strings: result.strings.filter((s) => current.strings.includes(s)),
            }
          : operation === "subtraction"
            ? {
                intervals: subtraction(result.intervals, current.intervals),
                strings: result.strings.filter((s) => !current.strings.includes(s)),
              }
            : {
                intervals: union([...result.intervals, ...current.intervals]),
                strings: [...new Set([...result.strings, ...current.strings])],
              };
    }
    return negative ? { intervals: subtraction(SCALARS, result.intervals), strings: [] } : result;
  }

  /** @param {Node[]} nodes @returns {[number, number]} */
  function width(nodes) {
    let minimum = 0,
      maximum = 0;
    for (const node of nodes) {
      let lo = 0,
        hi = 0;
      if (node.kind === "group") [lo, hi] = width(node.nodes);
      else if (node.kind === "alternation") {
        const sizes = node.branches.map(width);
        lo = Math.min(...sizes.map((s) => s[0]));
        hi = Math.max(...sizes.map((s) => s[1]));
      } else if (node.kind === "backreference") hi = Infinity;
      else if (node.kind === "atom") {
        if (node.atomType === "literal") lo = hi = [...node.value].length;
        else if (node.atomType === "characterClass") {
          const set = setMembers(node.members, node.operation ?? "union", node.negative);
          const sizes = set.strings.map((s) => [...s].length);
          if (set.intervals.length) sizes.push(1);
          lo = sizes.length ? Math.min(...sizes) : 1;
          hi = sizes.length ? Math.max(...sizes) : 1;
        } else lo = hi = 1;
      }
      const [countLo, countHi] = "repetition" in node ? bounds(node.repetition) : [1, 1];
      minimum += lo * countLo;
      maximum += hi === 0 || countHi === 0 ? 0 : hi * countHi;
    }
    return [minimum, maximum];
  }

  /** @param {Node[]} nodes @param {boolean} repeated @returns {boolean} */
  function repeatedCapture(nodes, repeated = false) {
    return nodes.some((node) => {
      const active = repeated || ("repetition" in node && bounds(node.repetition)[1] > 1);
      return node.kind === "group"
        ? (node.capturing && active) || repeatedCapture(node.nodes, active)
        : node.kind === "alternation"
          ? node.branches.some((branch) => repeatedCapture(branch, active))
          : node.kind === "assertion" && repeatedCapture(node.nodes, active);
    });
  }

  /** @param {Node[]} nodes @returns {boolean} */
  function hasReference(nodes) {
    return nodes.some(
      (node) =>
        node.kind === "backreference" ||
        ((node.kind === "group" || node.kind === "assertion") && hasReference(node.nodes)) ||
        (node.kind === "alternation" && node.branches.some(hasReference)),
    );
  }

  /** @param {Node[]} nodes @param {Set<number>} guaranteed @param {number} repeatProduct @returns {string} */
  function emit(nodes, guaranteed = new Set(), repeatProduct = 1) {
    let result = "";
    for (const node of nodes) {
      let repetition = "repetition" in node ? node.repetition : null;
      if (repetition && (node.kind === "group" || node.kind === "alternation")) {
        const [minimum, maximum] = width([{ ...node, repetition: null }]);
        const [minCount, maxCount] = bounds(repetition);
        // ECMAScript forbids additional zero-progress iterations after the minimum is met.
        if (maximum === 0) repetition = { kind: "exact", min: minCount };
        else if (minimum === 0 && maxCount > minCount)
          unsupported(
            "EXPORT_NULLABLE_REPETITION",
            "a nullable repeated block can choose a different match or empty capture here.",
            node.location,
            "Use fixed-count repetition or a block that always consumes a character; otherwise keep the ECMAScript target.",
          );
      }
      const [lo, hi] = bounds(repetition);
      const factor = repetition ? (Number.isFinite(hi) ? hi : lo || 1) : 1;
      const product = repeatProduct * factor;
      if (target === "go" && product > 1000)
        unsupported(
          "EXPORT_REPETITION_LIMIT",
          "nested counted repetitions exceed Go's 1,000-count limit.",
          node.location,
          "Reduce nested counted repetition or select another target.",
        );
      let value;
      if (node.kind === "group" || node.kind === "alternation") {
        const contents = node.kind === "group" ? [node.nodes] : node.branches;
        if (hi > 1) {
          const all = captureSet(contents.flat(), false, true),
            required = captureSet([{ ...node, repetition: null }], true);
          if ([...all].some((index) => !required.has(index)))
            unsupported(
              "EXPORT_CAPTURE_RESET",
              "a repeated block can leave a prior capture value where ECMAScript clears it.",
              node.location,
              "Make enclosed captures participate in every iteration or keep the ECMAScript target.",
            );
        }
        const bodies = contents.map((part) => emit(part, new Set(guaranteed), product));
        const opening =
          node.kind === "group" && node.capturing
            ? target === "python" || target === "rust" || target === "go"
              ? `(?P<g${node.captureIndex}>`
              : `(?<g${node.captureIndex}>`
            : "(?:";
        value = `${opening}${bodies.join("|")})`;
      } else if (node.kind === "assertion") {
        if (target === "rust" || target === "go")
          unsupported(
            "EXPORT_LOOKAROUND",
            "this engine does not support lookaround assertions.",
            node.location,
            "Keep the ECMAScript target or rewrite the rule without lookaround; assertions cannot be dropped.",
          );
        let bodies = [node.nodes];
        if (node.direction === "behind") {
          if (hasReference(node.nodes))
            unsupported(
              "EXPORT_LOOKBEHIND_REFERENCE",
              "lookbehind reference evaluation has not been proved equivalent.",
              node.location,
              "Move the reference outside lookbehind or keep the ECMAScript target.",
            );
          const first = node.nodes[0];
          if (
            (target === "ruby" || target === "php") &&
            node.nodes.length === 1 &&
            first.kind === "alternation" &&
            !first.repetition
          )
            bodies = first.branches;
          const sizes = bodies.map(width);
          const fixed = sizes.every(([min, max]) => min === max && Number.isFinite(max));
          const bounded = sizes.every(([, max]) => Number.isFinite(max));
          const captured = captureSet(node.nodes, false).size > 0;
          if (
            target !== "csharp" &&
            ((!fixed && (target !== "java" || captured || !bounded)) ||
              (captured && repeatedCapture(node.nodes)))
          )
            unsupported(
              "EXPORT_LOOKBEHIND_WIDTH",
              "the lookbehind's length or capture direction cannot be translated by this profile.",
              node.location,
              "Use fixed-width bodies without repeated captures, or keep the ECMAScript target.",
            );
          if (target === "ruby" && node.negative && captured)
            unsupported(
              "EXPORT_LOOKBEHIND_CAPTURE",
              "Ruby does not permit captures in negative lookbehind.",
              node.location,
              "Use a capture-free assertion or keep the ECMAScript target.",
            );
          if (target === "php" && sizes.some(([, max]) => max > 65535))
            unsupported(
              "EXPORT_LOOKBEHIND_WIDTH",
              "fixed lookbehind exceeds the PCRE2 profile's 65,535-character limit.",
              node.location,
              "Reduce the lookbehind or use the ECMAScript target.",
            );
        }
        const direction = node.direction === "behind" ? "<" : "";
        value = `(?${direction}${node.negative ? "!" : "="}${bodies.map((part) => emit(part, new Set(guaranteed), product)).join("|")})`;
      } else if (node.kind === "anchor") {
        const edge = node.edge === "start" ? "\\A" : target === "python" ? "\\Z" : "\\z";
        if (node.mode === "input") value = edge;
        else {
          if (target === "go" || target === "rust")
            unsupported(
              "EXPORT_LINE_ANCHOR",
              "native multiline anchors recognize a different set of line terminators.",
              node.location,
              "Use absolute start/end, or keep the ECMAScript target for LF, CR, U+2028 and U+2029 line anchors.",
            );
          const line = classSource(LINES);
          value = node.edge === "start" ? `(?:${edge}|(?<=${line}))` : `(?:${edge}|(?=${line}))`;
        }
      } else if (node.kind === "boundary") {
        if (target === "go") value = node.negative ? "\\B" : "\\b";
        else if (target === "rust") value = `(?-u:${node.negative ? "\\B" : "\\b"})`;
        else {
          const word = classSource(WORD);
          value = node.negative
            ? `(?:(?<=${word})(?=${word})|(?<!${word})(?!${word}))`
            : `(?:(?<=${word})(?!${word})|(?<!${word})(?=${word}))`;
        }
      } else if (node.kind === "backreference") {
        if (target === "rust" || target === "go")
          unsupported(
            "EXPORT_BACKREFERENCE",
            "this engine does not support backreferences.",
            node.referenceLocation,
            "Keep the ECMAScript target; copying captured text cannot be replaced by another independent capture.",
          );
        const name = `g${node.captureIndex}`;
        const reference = target === "python" ? `(?P=${name})` : `\\k<${name}>`;
        if (!guaranteed.has(node.captureIndex)) {
          if (target === "python" || target === "csharp" || target === "php")
            value = `(?(${name})${reference}|)`;
          else
            unsupported(
              "EXPORT_UNSET_REFERENCE",
              "an unset backreference fails here but succeeds empty in ECMAScript.",
              node.referenceLocation,
              "Ensure the referenced capture participates on every path, or keep the ECMAScript target.",
            );
        } else value = `(?:${reference})`;
      } else if (node.atomType === "unicodeProperty") {
        unsupported(
          "EXPORT_UNICODE_PROPERTY",
          "native Unicode character/string properties have not been proved equivalent.",
          node.propertyLocation,
          "Use explicit ranges/finite strings, or keep the ECMAScript target for native Unicode properties.",
        );
      } else if (node.atomType === "literal") value = `(?:${literal(node.value, node.location)})`;
      else if (node.atomType === "characterClass") {
        const set = setMembers(node.members, node.operation ?? "union", node.negative);
        const strings = [...set.strings].sort((a, b) => [...b].length - [...a].length);
        const choices = strings.filter(Boolean).map((s) => literal(s, node.location));
        if (set.intervals.length) choices.push(classSource(set.intervals));
        if (strings.includes("")) choices.push("");
        value = choices.length ? `(?:${choices.join("|")})` : classSource([]);
      } else if (node.atomType === "charSet") {
        const ranges = union(
          node.value.map((c) => {
            const cp = scalar(c, node.location);
            return [cp, cp];
          }),
        );
        value = classSource(node.negative ? subtraction(SCALARS, ranges) : ranges);
      } else if (node.atomType === "wildcard")
        value = classSource(compiled.flags.includes("s") ? SCALARS : subtraction(SCALARS, LINES));
      else value = classSource(shorthand(node.value));
      result += value + quantify(repetition);
      for (const capture of captureSet([node], true)) guaranteed.add(capture);
      if (result.length > LIMITS.regexSourceLength)
        unsupported(
          "EXPORT_OUTPUT_TOO_LARGE",
          "translated regex exceeds the shared generated-source budget.",
          node.location,
          "Shorten the rules or split the pattern before export.",
        );
    }
    return result;
  }
  const prefix = target === "java" || target === "csharp" ? "(?<![\\uD800-\\uDBFF])" : "";
  /** @param {Node[]} nodes @returns {import('./ast.js').BoundaryNode|undefined} */
  function nullableBoundary(nodes) {
    for (const node of nodes) {
      if (node.kind === "boundary" && node.negative) return node;
      if (node.kind === "group" || node.kind === "assertion") {
        const found = nullableBoundary(node.nodes);
        if (found) return found;
      } else if (node.kind === "alternation") {
        for (const branch of node.branches) {
          const found = nullableBoundary(branch);
          if (found) return found;
        }
      }
    }
  }
  const boundary = nullableBoundary(parsed.nodes);
  if (boundary && width(parsed.nodes)[0] === 0)
    unsupported(
      "EXPORT_ZERO_WIDTH_POSITION",
      "a nullable non-word-boundary can produce a surrogate-interior search position in the source engine.",
      boundary.location,
      "Keep the ECMAScript target, or require the pattern to consume a whole character; this portable profile cannot guarantee equivalent zero-width positions.",
    );
  const source = prefix + emit(parsed.nodes);
  if (source.length > LIMITS.regexSourceLength)
    unsupported(
      "EXPORT_OUTPUT_TOO_LARGE",
      "translated regex exceeds the shared generated-source budget.",
      parsed.nodes.at(-1)?.location ?? { line: 1, column: 1 },
      "Shorten the rules before export.",
    );
  const flags = target === "php" ? "u" : "";
  const requirements = [
    "Input must be well-formed Unicode: lone surrogates and malformed UTF-8 are outside this export's contract.",
    "Capture indices identify the original ECMAScript groups. Read target values by mapped gN names; treat missing/inactive names as absent, since engines can omit or renumber inactive captures.",
    "This export preserves supported search/capture semantics, not JavaScript match arrays, UTF-16 indices or lastIndex cursors.",
    "Native compilation has its own resource limits. Bound untrusted matching in an isolated process; source-code construction is not a matching sandbox.",
  ];
  if (target === "rust")
    requirements.push("Add the Rust regex 1.13 crate; this npm package does not install it.");
  if (target === "csharp")
    requirements.push(
      "The .NET constructor uses a 1,200ms native match timeout; handle RegexMatchTimeoutException.",
    );
  if (target === "php")
    requirements.push(
      "The generated-code corpus is verified on PHP 8.5.11 / PCRE2 10.44; validate other PHP/PCRE2 editions and application limits before use.",
    );
  return {
    target,
    engine: ENGINES[target],
    source,
    flags,
    originalFlags: compiled.flags,
    code: snippet(target, source, flags),
    captures,
    requirements,
  };
}
