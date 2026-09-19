/**
 * @typedef {{line: number, column: number}} Location
 * @typedef {{kind: 'exact'|'range'|'minimum'|'zeroOrMore'|'oneOrMore'|'optional', min?: number, max?: number}} Repetition
 * @typedef {{kind: 'anchor', edge: 'start'|'end', mode: 'input'|'line', location: Location, text: string}} AnchorNode
 * @typedef {{kind: 'atom', atomType: 'wildcard'|'shorthand'|'literal', value: string, negative?: boolean, repetition: Repetition|null, location: Location, text: string}} TextAtomNode
 * @typedef {{kind: 'atom', atomType: 'charSet', value: string[], negative: boolean, repetition: Repetition|null, location: Location, text: string}} SetAtomNode
 * @typedef {TextAtomNode|SetAtomNode} AtomNode
 * @typedef {AnchorNode|AtomNode} RuleNode
 * @typedef {{nodes: RuleNode[], anchorMode: 'input'|'line'|null}} ParsedRules
 */

/** @param {AnchorNode['edge']} edge @param {AnchorNode['mode']} mode @param {Location} location @param {string} text @returns {AnchorNode} */
export function anchor(edge, mode, location, text) {
  return { kind: "anchor", edge, mode, location, text };
}

/** @param {AtomNode['atomType']} atomType @param {string|string[]} value @param {Repetition|null} repetition @param {Location} location @param {string} text @param {boolean} negative @returns {AtomNode} */
export function atom(atomType, value, repetition, location, text, negative = false) {
  if (atomType === "charSet") {
    if (!Array.isArray(value)) throw new TypeError("A character set needs a list of characters.");
    return { kind: "atom", atomType, value, repetition, location, text, negative };
  }
  if (typeof value !== "string") throw new TypeError("A text atom needs a string value.");
  return { kind: "atom", atomType, value, repetition, location, text, negative };
}
