export interface SourceLocation {
  line: number;
  column: number;
}

export type Repetition =
  | { kind: "exact"; min: number }
  | { kind: "range"; min: number; max: number }
  | { kind: "atLeast"; min: number }
  | { kind: "zeroOrMore" }
  | { kind: "oneOrMore" };

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

export type RegexSegment = AnchorSegment | TextSegment | CharacterSetSegment;

export interface CompileResult {
  source: string;
  flags: string;
  segments: RegexSegment[];
}

export interface CompileOptions {
  flags?: string;
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
export interface ReverseTranslation {
  rules: string;
  flags: string;
}
export function regexToRules(regex: RegExp): ReverseTranslation;
export function regexMatchingThroughLines(lines: string): string;
export function toRegExp(result: CompileResult | Pick<CompileResult, "source" | "flags">): RegExp;
