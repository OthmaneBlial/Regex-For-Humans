import { classMayContainStrings } from "../src/ast.js";
import { applyModifiers } from "../src/flags.js";
import { parse } from "../src/parser.js";

/** @typedef {import('../src/ast.js').RuleNode} RuleNode */
/** @typedef {{minimum: number, literals: string[], startLiteral?: string, endLiteral?: string}} Requirements */
/** @typedef {{key: string, values?: Record<string, string | number>}} Reason */

/** @param {RuleNode} node */
function minimumCount(node) {
  const repetition = node.kind === "anchor" ? null : node.repetition;
  if (!repetition) return 1;
  return repetition.kind === "zeroOrMore"
    ? 0
    : repetition.kind === "oneOrMore"
      ? 1
      : repetition.min;
}

/** Necessary conditions only; this does not simulate the native engine.
 * @param {RuleNode[]} nodes @param {string} flags @returns {Requirements}
 */
function requirements(nodes, flags) {
  const ignoreCase = flags.includes("i");
  let minimum = 0;
  const literals = new Set();
  for (const node of nodes) {
    const count = minimumCount(node);
    if (!count) continue;
    let unit = { minimum: 0, literals: /** @type {string[]} */ ([]) };
    if (node.kind === "group" || (node.kind === "assertion" && !node.negative)) {
      unit = requirements(
        node.nodes,
        node.kind === "group" && node.modifiers ? applyModifiers(flags, node.modifiers) : flags,
      );
      if (node.kind === "assertion") unit.minimum = 0;
    } else if (node.kind === "alternation") {
      const branches = node.branches.map((branch) => requirements(branch, flags));
      unit.minimum = Math.min(...branches.map((branch) => branch.minimum));
      unit.literals = branches[0].literals.filter((literal) =>
        branches.every((branch) => branch.literals.includes(literal)),
      );
    } else if (node.kind === "atom") {
      if (node.atomType === "literal") {
        // Case folding is native semantics; omit literal proofs when i is enabled.
        if (!ignoreCase) unit = { minimum: node.value.length, literals: [node.value] };
      } else if (
        !(node.atomType === "unicodeProperty" && node.propertyType === "string") &&
        !(
          node.atomType === "characterClass" && classMayContainStrings(node.members, node.operation)
        )
      ) {
        unit.minimum = 1;
      }
    }
    // The workshop accepts at most 2,048 UTF-16 units; cap before products grow.
    minimum = Math.min(2049, minimum + Math.min(2049, unit.minimum * count));
    for (const literal of unit.literals) if (literal) literals.add(literal);
  }
  return { minimum, literals: [...literals] };
}

/** A necessary literal edge and whether it describes all consumption in the sequence.
 * @param {RuleNode[]} nodes @param {boolean} backwards @param {string} flags
 * @returns {{value: string, exact: boolean}}
 */
function literalEdge(nodes, backwards, flags) {
  let value = "";
  for (const node of backwards ? nodes.toReversed() : nodes) {
    if (node.kind === "anchor" || node.kind === "assertion" || node.kind === "boundary") continue;
    const repetition = node.repetition;
    const count = minimumCount(node);
    const fixedCount =
      !repetition ||
      repetition.kind === "exact" ||
      (repetition.kind === "range" && repetition.min === repetition.max);
    if (!count && fixedCount) continue;
    let unit;
    if (node.kind === "group")
      unit = literalEdge(
        node.nodes,
        backwards,
        node.modifiers ? applyModifiers(flags, node.modifiers) : flags,
      );
    else if (node.kind === "alternation") {
      const branches = node.branches.map((branch) => literalEdge(branch, backwards, flags));
      const common = [...branches[0].value];
      if (backwards) common.reverse();
      for (const branch of branches.slice(1)) {
        const points = [...branch.value];
        if (backwards) points.reverse();
        let shared = 0;
        while (shared < common.length && common[shared] === points[shared]) shared++;
        common.length = shared;
      }
      if (backwards) common.reverse();
      unit = {
        value: common.join(""),
        exact: branches.every((branch) => branch.exact && branch.value === branches[0].value),
      };
    } else if (node.kind === "atom" && node.atomType === "literal" && !flags.includes("i"))
      unit = { value: node.value, exact: true };
    else return { value, exact: false };
    if (unit.exact && !unit.value) continue;
    if (!count) return { value, exact: false };
    // Larger fixed runs already exceed the workshop input limit; do not expand them.
    const length = unit.value.length * (unit.exact ? count : 1);
    if (value.length + length > 2048) return { value, exact: false };
    const part = unit.exact ? unit.value.repeat(count) : unit.value;
    value = backwards ? part + value : value + part;
    if (!unit.exact || !fixedCount) return { value, exact: false };
  }
  return { value, exact: true };
}

/** Call only after successful compilation. No regex matching runs here.
 * @param {string} rules @param {string} flags @returns {Requirements}
 */
export function failureRequirements(rules, flags) {
  const { nodes } = parse(rules);
  const required = requirements(nodes, flags);
  for (const edge of ["start", "end"]) {
    if (
      !nodes.some((node) => node.kind === "anchor" && node.mode === "input" && node.edge === edge)
    )
      continue;
    const { value } = literalEdge(nodes, edge === "end", flags);
    if (value) required[edge === "start" ? "startLiteral" : "endLiteral"] = value;
  }
  return required;
}

/** Explain a disagreement using validated native results and necessary conditions.
 * @param {Requirements} required @param {string} input @param {boolean} expected
 * @param {import('./worker-protocol.d.ts').TestResult} result @returns {Reason|null}
 */
export function explainMismatch(required, input, expected, result) {
  if (result.actual === expected) return null;
  if (result.matchRange) {
    return {
      key: result.actual
        ? "The native engine matched [{start}, {end}); this example expects no match."
        : "The native match covers [{start}, {end}); full-input mode requires [0, {length}).",
      values: { ...result.matchRange, length: input.length },
    };
  }
  if (input.length < required.minimum)
    return {
      key: "Any match needs at least {minimum} UTF-16 units; this input has {length}.",
      values: { minimum: required.minimum, length: input.length },
    };
  const missing = required.literals.find((literal) => !input.includes(literal));
  if (missing)
    return {
      key: "Required literal {literal} is absent from the input.",
      values: { literal: missing },
    };
  if (required.startLiteral && !input.startsWith(required.startLiteral))
    return {
      key: "The input must begin with {literal}.",
      values: { literal: required.startLiteral },
    };
  if (required.endLiteral && !input.endsWith(required.endLiteral))
    return {
      key: "The input must end with {literal}.",
      values: { literal: required.endLiteral },
    };
  return { key: "The native engine found no match. A precise failing step is unavailable." };
}
