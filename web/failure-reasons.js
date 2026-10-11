import { classMayContainStrings } from "../src/ast.js";
import { parse } from "../src/parser.js";

/** @typedef {import('../src/ast.js').RuleNode} RuleNode */
/** @typedef {{minimum: number, literals: string[]}} Requirements */
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
 * @param {RuleNode[]} nodes @param {boolean} ignoreCase @returns {Requirements}
 */
function requirements(nodes, ignoreCase) {
  let minimum = 0;
  const literals = new Set();
  for (const node of nodes) {
    const count = minimumCount(node);
    if (!count) continue;
    let unit = { minimum: 0, literals: /** @type {string[]} */ ([]) };
    if (node.kind === "group" || (node.kind === "assertion" && !node.negative)) {
      unit = requirements(node.nodes, ignoreCase);
      if (node.kind === "assertion") unit.minimum = 0;
    } else if (node.kind === "alternation") {
      const branches = node.branches.map((branch) => requirements(branch, ignoreCase));
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

/** Call only after successful compilation. No regex matching runs here.
 * @param {string} rules @param {string} flags @returns {Requirements}
 */
export function failureRequirements(rules, flags) {
  return requirements(parse(rules).nodes, flags.includes("i"));
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
  return { key: "The native engine found no match. A precise failing step is unavailable." };
}
