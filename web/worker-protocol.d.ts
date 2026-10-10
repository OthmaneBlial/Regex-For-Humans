export type MatchMode = "full" | "search";

export type TestCase = {
  id: number;
  text: string;
  expected: boolean;
};

export type TestPayload = {
  source: string;
  flags: string;
  mode: MatchMode;
  cases: TestCase[];
  captureCount?: number;
};

export type TestRequest = TestPayload & { id: number };

export type MatchRange = { start: number; end: number };

export type CaptureValue = { value: string | null; range: MatchRange | null };
export type MatchDetail = {
  value: string;
  range: MatchRange;
  captures: CaptureValue[];
};

export type TestResult = {
  id: number;
  actual: boolean;
  pass: boolean;
  detail: string;
  matchRange?: MatchRange | null;
  matches?: MatchDetail[];
  indicesAvailable?: boolean;
  limitReached?: boolean;
};

export type WorkerReply = { id: number; results: TestResult[] } | { id: number; error: string };
