export const PATH_SEGMENT_SOURCE = String.raw`[^\/\\\u{0}\u{a}\u{d}\u{2028}\u{2029}]`;
export const PATH_SEGMENT_EXCLUDED = Object.freeze([
  "/",
  "\\",
  "\0",
  "\n",
  "\r",
  "\u2028",
  "\u2029",
]);

// ECMAScript binary properties of strings; membership still comes from the native runtime.
export const UNICODE_STRING_PROPERTIES = Object.freeze([
  "Basic_Emoji",
  "Emoji_Keycap_Sequence",
  "RGI_Emoji_Modifier_Sequence",
  "RGI_Emoji_Flag_Sequence",
  "RGI_Emoji_Tag_Sequence",
  "RGI_Emoji_ZWJ_Sequence",
  "RGI_Emoji",
]);

/**
 * @typedef {{line: number, column: number}} Location
 * @typedef {({kind: 'exact', min: number}|{kind: 'range', min: number, max: number}|{kind: 'atLeast', min: number}|{kind: 'zeroOrMore'}|{kind: 'oneOrMore'}) & {lazy?: boolean}} Repetition
 * @typedef {{kind: 'anchor', edge: 'start'|'end', mode: 'input'|'line', location: Location, text: string}} AnchorNode
 * @typedef {{kind: 'boundary', negative: boolean, repetition: null, location: Location, text: string}} BoundaryNode
 * @typedef {{kind: 'atom', atomType: 'wildcard'|'shorthand'|'literal', value: string, negative?: boolean, repetition: Repetition|null, location: Location, text: string}} TextAtomNode
 * @typedef {{kind: 'atom', atomType: 'charSet', value: string[], negative: boolean, repetition: Repetition|null, location: Location, text: string}} SetAtomNode
 * @typedef {{kind: 'atom', atomType: 'unicodeProperty', value: string, propertyType: 'character'|'string', negative: boolean, repetition: Repetition|null, location: Location, propertyLocation: Location, text: string}} PropertyAtomNode
 * @typedef {'union'|'intersection'|'subtraction'} ClassSetOperation
 * @typedef {({kind: 'literal', value: string}|{kind: 'range', from: string, to: string}|{kind: 'shorthand', value: string}|{kind: 'strings', values: string[]}|{kind: 'stringCodePoints', codePoints: string[]}|{kind: 'unicodeProperty', value: string, propertyType: 'character'|'string', negative: boolean, propertyLocation: Location}|{kind: 'set', operation: ClassSetOperation, negative: boolean, members: ClassMember[], endLocation: Location}) & {location: Location, text: string}} ClassMember
 * @typedef {{kind: 'atom', atomType: 'characterClass', members: ClassMember[], negative: boolean, operation?: ClassSetOperation, repetition: Repetition|null, location: Location, text: string, endLocation?: Location}} ClassAtomNode
 * @typedef {TextAtomNode|SetAtomNode|PropertyAtomNode|ClassAtomNode} AtomNode
 * @typedef {{kind: 'group', capturing: boolean, name: string|null, captureIndex: number|null, nodes: RuleNode[], repetition: Repetition|null, location: Location, text: string, endLocation: Location}} GroupNode
 * @typedef {{kind: 'alternation', branches: RuleNode[][], repetition: Repetition|null, location: Location, text: string, endLocation: Location}} AlternationNode
 * @typedef {{kind: 'assertion', direction: 'ahead'|'behind', negative: boolean, nodes: RuleNode[], repetition: null, location: Location, text: string, endLocation: Location}} AssertionNode
 * @typedef {{kind: 'backreference', reference: string|number, captureIndex: number, referenceLocation: Location, repetition: Repetition|null, location: Location, text: string}} BackreferenceNode
 * @typedef {AnchorNode|BoundaryNode|AtomNode|GroupNode|AlternationNode|AssertionNode|BackreferenceNode} RuleNode
 * @typedef {{nodes: RuleNode[], anchorMode: 'input'|'line'|'mixed'|null}} ParsedRules
 */

/** ECMAScript's structural MayContainStrings check, without enumerating runtime properties.
 * @param {ClassMember[]} members @param {ClassSetOperation} [operation] @returns {boolean}
 */
export function classMayContainStrings(members, operation = "union") {
  const contains = members.map((member) =>
    member.kind === "set"
      ? !member.negative && classMayContainStrings(member.members, member.operation)
      : member.kind === "strings"
        ? member.values.some((value) => [...value].length !== 1)
        : member.kind === "stringCodePoints"
          ? member.codePoints.length !== 1
          : member.kind === "unicodeProperty" && member.propertyType === "string",
  );
  return operation === "intersection"
    ? contains.every(Boolean)
    : operation === "subtraction"
      ? contains[0] === true
      : contains.some(Boolean);
}

/** @param {ClassMember[]} members @param {ClassSetOperation} [operation] @returns {boolean} */
export function classMayMatchEmpty(members, operation = "union") {
  const empty = members.map((member) =>
    member.kind === "set"
      ? !member.negative && classMayMatchEmpty(member.members, member.operation)
      : member.kind === "strings" && member.values.includes(""),
  );
  return operation === "intersection"
    ? empty.every(Boolean)
    : operation === "subtraction"
      ? empty[0] === true && !empty.slice(1).some(Boolean)
      : empty.some(Boolean);
}

/** @param {AnchorNode['edge']} edge @param {AnchorNode['mode']} mode @param {Location} location @param {string} text @returns {AnchorNode} */
export function anchor(edge, mode, location, text) {
  return { kind: "anchor", edge, mode, location, text };
}

/** @param {(TextAtomNode|SetAtomNode)['atomType']} atomType @param {string|string[]} value @param {Repetition|null} repetition @param {Location} location @param {string} text @param {boolean} negative @returns {AtomNode} */
export function atom(atomType, value, repetition, location, text, negative = false) {
  if (atomType === "charSet") {
    if (!Array.isArray(value)) throw new TypeError("A character set needs a list of characters.");
    return { kind: "atom", atomType, value, repetition, location, text, negative };
  }
  if (typeof value !== "string") throw new TypeError("A text atom needs a string value.");
  return { kind: "atom", atomType, value, repetition, location, text, negative };
}
