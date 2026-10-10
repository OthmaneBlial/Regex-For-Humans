export interface SourceLocation {
  line: number;
  column: number;
}

export type Repetition = (
  | { kind: "exact"; min: number }
  | { kind: "range"; min: number; max: number }
  | { kind: "atLeast"; min: number }
  | { kind: "zeroOrMore" }
  | { kind: "oneOrMore" }
) & { lazy?: boolean };

interface SegmentBase {
  sourceStart: number;
  sourceEnd: number;
  source: string;
  text: string;
  explanation: string;
  line: number;
  column: number;
}

export interface AnchorSegment extends SegmentBase {
  kind: "anchor";
  edge: "start" | "end";
  mode: "input" | "line";
}

export interface BoundarySegment extends SegmentBase {
  kind: "boundary";
  negative: boolean;
}

export interface TextSegment extends SegmentBase {
  kind: "atom";
  atomType: "wildcard" | "shorthand" | "literal";
  repetition: Repetition | null;
}

export interface CharacterSetSegment extends SegmentBase {
  kind: "atom";
  atomType: "charSet";
  repetition: Repetition | null;
  negative: boolean;
}

export interface UnicodePropertySegment extends SegmentBase {
  kind: "atom";
  atomType: "unicodeProperty";
  property: string;
  propertyType: "character" | "string";
  negative: boolean;
  repetition: Repetition | null;
}

export type ClassSetOperation = "union" | "intersection" | "subtraction";

export type CharacterClassMember = (
  | { kind: "literal"; value: string }
  | { kind: "range"; from: string; to: string }
  | { kind: "shorthand"; value: string }
  | { kind: "strings"; values: string[] }
  | { kind: "stringCodePoints"; codePoints: string[] }
  | {
      kind: "set";
      operation: ClassSetOperation;
      negative: boolean;
      members: CharacterClassMember[];
      endLocation: SourceLocation;
    }
  | {
      kind: "unicodeProperty";
      value: string;
      propertyType: "character" | "string";
      negative: boolean;
      propertyLocation: SourceLocation;
    }
) & {
  location: SourceLocation;
  text: string;
  source: string;
  sourceStart: number;
  sourceEnd: number;
};

export interface CharacterClassSegment extends SegmentBase {
  kind: "atom";
  atomType: "characterClass";
  negative: boolean;
  repetition: Repetition | null;
  members: CharacterClassMember[];
  operation?: ClassSetOperation;
  endLocation?: SourceLocation;
}

export interface GroupSegment extends SegmentBase {
  kind: "group";
  edge: "start" | "end";
  capturing: boolean;
  captureIndex: number | null;
  name: string | null;
  repetition: Repetition | null;
}

export interface BackreferenceSegment extends SegmentBase {
  kind: "backreference";
  reference: string | number;
  captureIndex: number;
  repetition: Repetition | null;
}

export interface AlternationSegment extends SegmentBase {
  kind: "alternation";
  edge: "start" | "branch" | "end";
  alternatives: number;
  repetition: Repetition | null;
}

export interface AssertionSegment extends SegmentBase {
  kind: "assertion";
  edge: "start" | "end";
  direction: "ahead" | "behind";
  negative: boolean;
}

export type RegexSegment =
  | AnchorSegment
  | BoundarySegment
  | TextSegment
  | CharacterSetSegment
  | UnicodePropertySegment
  | CharacterClassSegment
  | GroupSegment
  | AlternationSegment
  | AssertionSegment
  | BackreferenceSegment;

export interface CompileResult {
  source: string;
  flags: string;
  segments: RegexSegment[];
}

export interface CompileOptions {
  flags?: string | undefined;
}

export interface CompileErrorJSON {
  code: string;
  message: string;
  line: number;
  column: number;
  hint?: string;
}

export class CompileError extends Error {
  code: string;
  line: number;
  column: number;
  hint?: string;

  constructor(code: string, message: string, location: SourceLocation, hint?: string);
  toJSON(): CompileErrorJSON;
}

export function compile(source: string, options?: CompileOptions): CompileResult;
/** Edit a group at its opening location, updating references and validating the result. */
export function editGroup(
  source: string,
  location: SourceLocation,
  definition: Pick<GroupSegment, "capturing" | "name">,
  options?: CompileOptions,
): string;
export interface ReverseTranslation {
  rules: string;
  flags: string;
}
export function regexToRules(regex: RegExp): ReverseTranslation;
export function regexMatchingThroughLines(lines: string): string;
export function toRegExp(result: CompileResult | Pick<CompileResult, "source" | "flags">): RegExp;
