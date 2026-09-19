/**
 * @typedef {{line: number, column: number}} Location
 * @typedef {{kind: 'exact'|'range'|'minimum'|'zeroOrMore'|'oneOrMore'|'optional', min?: number, max?: number}} Repetition
 * @typedef {{kind: 'anchor', edge: 'start'|'end', mode: 'input'|'line', location: Location, text: string}} AnchorNode
 * @typedef {{kind: 'atom', atomType: 'wildcard'|'shorthand'|'literal'|'charSet', value: string|string[], negative?: boolean, repetition: Repetition|null, location: Location, text: string}} AtomNode
 * @typedef {AnchorNode|AtomNode} RuleNode
 */

export function anchor(edge, mode, location, text) {
  return { kind: "anchor", edge, mode, location, text };
}

export function atom(atomType, value, repetition, location, text, negative = false) {
  return { kind: "atom", atomType, value, repetition, location, text, negative };
}
