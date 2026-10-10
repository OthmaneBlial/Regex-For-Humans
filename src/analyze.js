import { PATH_SEGMENT_SOURCE } from "./ast.js";
import { compileAst } from "./compiler.js";
import { parse } from "./parser.js";

/** @typedef {import("./ast.js").RuleNode} RuleNode */
/** @typedef {import("../index.d.ts").AnalysisFinding} Finding */
/** @typedef {Array<[number, number]>} Ranges */

// These ASCII witnesses are guaranteed members, not complete Unicode character sets.
/** @type {Record<string, Ranges>} */
const ASCII = {
  "\\d": [[48, 57]],
  "\\D": [
    [0, 47],
    [58, 127],
  ],
  "\\w": [
    [48, 57],
    [65, 90],
    [95, 95],
    [97, 122],
  ],
  "\\W": [
    [0, 47],
    [58, 64],
    [91, 94],
    [96, 96],
    [123, 127],
  ],
  "\\s": [
    [9, 13],
    [32, 32],
  ],
  "\\S": [
    [0, 8],
    [14, 31],
    [33, 127],
  ],
  "[a-z]": [[97, 122]],
  "[A-Z]": [[65, 90]],
  "[A-Za-z]": [
    [65, 90],
    [97, 122],
  ],
  "[0-9A-Fa-f]": [
    [48, 57],
    [65, 70],
    [97, 102],
  ],
  [PATH_SEGMENT_SOURCE]: [
    [1, 9],
    [11, 12],
    [14, 46],
    [48, 91],
    [93, 127],
  ],
};

/** @param {Ranges} ranges @returns {Ranges} */
function normalize(ranges) {
  /** @type {Ranges} */
  const merged = [];
  for (const [from, to] of [...ranges].sort((a, b) => a[0] - b[0])) {
    const previous = merged.at(-1);
    if (previous && from <= previous[1] + 1) previous[1] = Math.max(previous[1], to);
    else merged.push([from, to]);
  }
  return merged;
}

/** @param {Ranges} left @param {Ranges} right @returns {Ranges} */
function intersection(left, right) {
  /** @type {Ranges} */
  const result = [];
  let a = 0,
    b = 0;
  while (a < left.length && b < right.length) {
    const from = Math.max(left[a][0], right[b][0]),
      to = Math.min(left[a][1], right[b][1]);
    if (from <= to) result.push([from, to]);
    if (left[a][1] < right[b][1]) a++;
    else b++;
  }
  return result;
}

/** @param {Ranges} ranges @param {string} flags @returns {Ranges} */
function foldAscii(ranges, flags) {
  const folded = [...ranges];
  if (flags.includes("i"))
    for (const [from, to] of ranges) {
      const upperFrom = Math.max(from, 65),
        upperTo = Math.min(to, 90);
      const lowerFrom = Math.max(from, 97),
        lowerTo = Math.min(to, 122);
      if (upperFrom <= upperTo) folded.push([upperFrom + 32, upperTo + 32]);
      if (lowerFrom <= lowerTo) folded.push([lowerFrom - 32, lowerTo - 32]);
    }
  return normalize(folded);
}

/** @param {string} value @param {string} flags @returns {Ranges} */
function pointWitness(value, flags) {
  if ([...value].length !== 1) return [];
  const point = value.codePointAt(0);
  return point === undefined ? [] : foldAscii([[point, point]], flags);
}

/** @param {import("./ast.js").ClassMember} member @param {string} flags @returns {Ranges} */
function memberWitness(member, flags) {
  switch (member.kind) {
    case "literal":
      return pointWitness(member.value, flags);
    case "range": {
      const from = member.from.codePointAt(0),
        to = member.to.codePointAt(0);
      return from === undefined || to === undefined ? [] : foldAscii([[from, to]], flags);
    }
    case "shorthand":
      return foldAscii(ASCII[member.value] ?? [], flags);
    case "strings":
      return normalize(member.values.flatMap((value) => pointWitness(value, flags)));
    case "stringCodePoints":
      return member.codePoints.length === 1 ? pointWitness(member.codePoints[0], flags) : [];
    case "set":
      return setWitness(member, flags);
    case "unicodeProperty":
      return [];
  }
}

/** @param {{members: import("./ast.js").ClassMember[], negative: boolean, operation?: import("./ast.js").ClassSetOperation}} set @param {string} flags @returns {Ranges} */
function setWitness(set, flags) {
  if (set.negative || set.operation === "subtraction") return [];
  const operands = set.members.map((member) => memberWitness(member, flags));
  if (set.operation === "intersection")
    return operands.length ? operands.slice(1).reduce(intersection, operands[0]) : [];
  return normalize(operands.flat());
}

/** Known one-character matches of a node body; empty means unknown, not disjoint.
 * @param {RuleNode} node @param {string} flags @returns {Ranges}
 */
function characterWitness(node, flags) {
  if (node.kind === "group" && node.nodes.length === 1) {
    const [min, max] = bounds(node.nodes[0]);
    return min <= 1 && max >= 1 ? characterWitness(node.nodes[0], flags) : [];
  }
  if (node.kind !== "atom") return [];
  switch (node.atomType) {
    case "literal":
      return pointWitness(node.value, flags);
    case "shorthand":
      return foldAscii(ASCII[node.value] ?? [], flags);
    case "wildcard":
      return flags.includes("s")
        ? [[0, 127]]
        : [
            [0, 9],
            [11, 12],
            [14, 127],
          ];
    case "charSet":
      return node.negative
        ? []
        : normalize(node.value.flatMap((value) => pointWitness(value, flags)));
    case "characterClass":
      return setWitness(node, flags);
    case "unicodeProperty":
      return [];
  }
}

/** @param {RuleNode} node @returns {[number, number]} */
function bounds(node) {
  const repetition = node.kind === "anchor" ? null : node.repetition;
  if (!repetition) return [1, 1];
  switch (repetition.kind) {
    case "exact":
      return [repetition.min, repetition.min];
    case "range":
      return [repetition.min, repetition.max];
    case "atLeast":
      return [repetition.min, Infinity];
    case "zeroOrMore":
      return [0, Infinity];
    case "oneOrMore":
      return [1, Infinity];
  }
}

/** Matching-unit identity is narrower than language equivalence.
 * @param {RuleNode} node @returns {string|null}
 */
function unitKey(node) {
  if (node.kind === "group" && node.nodes.length === 1) return unitKey(node.nodes[0]);
  if (node.kind !== "atom") return null;
  return JSON.stringify(node, (key, value) =>
    ["location", "propertyLocation", "endLocation", "text", "repetition"].includes(key)
      ? undefined
      : value,
  );
}

/** Count the underlying unit through transparent single-child groups.
 * @param {RuleNode} node @returns {[number, number]}
 */
function unitBounds(node) {
  const [min, max] = bounds(node);
  if (node.kind !== "group" || node.nodes.length !== 1) return [min, max];
  const [childMin, childMax] = unitBounds(node.nodes[0]);
  return [min * childMin, max === 0 || childMax === 0 ? 0 : max * childMax];
}

/** @param {RuleNode[]} nodes @returns {string|null} */
function literalSequence(nodes) {
  let text = "";
  for (const node of nodes) {
    if (node.kind === "anchor" || node.repetition) return null;
    if (node.kind === "atom" && node.atomType === "literal") text += node.value;
    else if (node.kind === "group") {
      const nested = literalSequence(node.nodes);
      if (nested === null) return null;
      text += nested;
    } else return null;
  }
  return text;
}

/** Inspect validated rules without running regex matches. Findings are heuristic candidates.
 * @param {string} source
 * @param {import("../index.d.ts").CompileOptions} [options]
 * @returns {import("../index.d.ts").AnalysisResult}
 */
export function analyze(source, options = {}) {
  const parsed = parse(source);
  const compiled = compileAst(parsed, options);
  /** @type {Finding[]} */
  const warnings = [];

  /** @param {RuleNode} node @param {import("../index.d.ts").AnalysisCode} code @param {"warning"|"info"} severity @param {string} message @param {string} hint */
  function add(node, code, severity, message, hint) {
    const opening = compiled.segments.find(
      (segment) =>
        segment.kind === node.kind &&
        segment.line === node.location.line &&
        segment.column === node.location.column &&
        (!("edge" in segment) || segment.edge === "start" || segment.kind === "anchor"),
    );
    if (!opening) throw new Error("An analysis rule is missing its compiler segment.");
    const closing =
      node.kind === "group" || node.kind === "alternation" || node.kind === "assertion"
        ? compiled.segments.find(
            (segment) =>
              segment.kind === node.kind &&
              "edge" in segment &&
              segment.edge === "end" &&
              segment.line === node.endLocation.line &&
              segment.column === node.endLocation.column,
          )
        : opening;
    if (!closing) throw new Error("An analysis block is missing its closing compiler segment.");
    const finding = {
      code,
      severity,
      message,
      hint,
      ...node.location,
      sourceStart: opening.sourceStart,
      sourceEnd: closing.sourceEnd,
    };
    warnings.push(finding);
    return finding;
  }

  /** @param {RuleNode[]} nodes @param {boolean} [repeatedParent] */
  function visit(nodes, repeatedParent = false) {
    for (const [index, node] of nodes.entries()) {
      const [, max] = bounds(node);
      if (max === 0) continue;
      const repeated = repeatedParent || max > 1;
      if (node.kind === "group") {
        const child = node.nodes.length === 1 ? node.nodes[0] : null;
        if (max > 1 && child && unitKey(child) !== null) {
          const [childMin, childMax] = unitBounds(child);
          if (childMax > childMin)
            add(
              node,
              "NESTED_REPETITION",
              "warning",
              "A repeated group contains a variable repetition of the same matching unit.",
              "Review ways to divide input between iterations. Consider one repetition or a disjoint delimiter; preserve required capture and reference behavior.",
            );
        }
        visit(node.nodes, repeated);
      } else if (node.kind === "alternation") {
        const literals = node.branches.map(literalSequence);
        const witnesses = node.branches.map((branch) =>
          branch.length === 1 && bounds(branch[0])[0] <= 1 && bounds(branch[0])[1] >= 1
            ? characterWitness(branch[0], compiled.flags)
            : [],
        );
        const overlap = literals.some((first, left) =>
          literals.some(
            (second, right) =>
              right > left &&
              ((first !== null &&
                second !== null &&
                (first.startsWith(second) || second.startsWith(first))) ||
                intersection(witnesses[left], witnesses[right]).length > 0),
          ),
        );
        if (overlap)
          add(
            node,
            "OVERLAPPING_ALTERNATIVES",
            repeated ? "warning" : "info",
            repeated
              ? "Repeated choices have overlapping prefixes; repetition may amplify retries."
              : "Choices have an overlapping prefix; earlier choices can take that prefix.",
            "Review branch order and common prefixes. Factor shared text or use disjoint tokens when their matching and capture behavior fits your intent.",
          );
        for (const branch of node.branches) visit(branch, repeated);
      } else if (node.kind === "assertion") visit(node.nodes, repeatedParent);
      else if (node.kind === "anchor" && node.mode === "line")
        add(
          node,
          "LINE_ANCHORS",
          "info",
          "This line anchor can match beside a line break, not only at an input edge.",
          "Confirm line-by-line matching is intended. Use start/end input rules when absolute input boundaries are required.",
        );
      else if (node.kind === "atom" && node.atomType === "wildcard") {
        if (max === Infinity)
          add(
            node,
            "UNBOUNDED_WILDCARD",
            "info",
            "An unbounded wildcard can consume a broad portion of the input.",
            "Use the intended character class, delimiter or length bound when a narrower format is required.",
          );
        if (compiled.flags.includes("s"))
          add(
            node,
            "DOT_ALL_WILDCARD",
            "info",
            "This wildcard includes line breaks because the s flag is enabled.",
            "Confirm that multiline text is intended; use a narrower class or remove s when it is not.",
          );
      }
      const previous = nodes[index - 1];
      const [unitMin, unitMax] = unitBounds(node);
      if (previous && unitMax > unitMin) {
        const [previousMin, previousMax] = unitBounds(previous);
        const key = unitKey(node);
        if (
          previousMax > previousMin &&
          ((key !== null && key === unitKey(previous)) ||
            intersection(
              characterWitness(node, compiled.flags),
              characterWitness(previous, compiled.flags),
            ).length > 0)
        )
          add(
            node,
            "ADJACENT_REPETITIONS",
            "warning",
            "Adjacent variable repetitions share matching units and may create multiple ways to divide input.",
            "Combine bounds only when that preserves your intent and captures, or separate fields with a delimiter their repeated units cannot match.",
          );
      }
    }
  }

  visit(parsed.nodes);
  if (compiled.source.length > 32768) {
    const sizeFinding = add(
      parsed.nodes[0],
      "LARGE_GENERATED_SOURCE",
      "info",
      "The generated regex exceeds 32,768 UTF-16 code units.",
      "Review literal escaping and pattern size in the deployment engine. This threshold is a review prompt, not a runtime complexity measurement.",
    );
    sizeFinding.sourceStart = 0;
    sizeFinding.sourceEnd = compiled.source.length;
  }
  return {
    flags: compiled.flags,
    warnings,
    limitations: [
      "Structural heuristics can miss expensive patterns and report false positives. No findings is not a proof of safety.",
      "Witnesses cover literals, ranges, positive unions/intersections, selected ASCII shorthands and ASCII case pairs. Empty witness sets mean unknown, not proven disjointness.",
      "Negated/subtracted classes, Unicode case/property aliases, complex group bodies, backreferences, lookaround execution and search restart costs are not fully modeled.",
      "Analysis does not run matches, measure backtracking or replace isolated deployment-engine tests and enforceable execution budgets.",
    ],
  };
}
