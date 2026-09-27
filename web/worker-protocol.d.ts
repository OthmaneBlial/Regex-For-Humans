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
};

export type TestRequest = TestPayload & { id: number };

export type TestResult = {
  id: number;
  actual: boolean;
  pass: boolean;
  detail: string;
};

export type WorkerReply = { id: number; results: TestResult[] } | { id: number; error: string };
