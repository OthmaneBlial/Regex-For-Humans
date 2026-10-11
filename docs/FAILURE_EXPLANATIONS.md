# Explaining failed examples

The workshop explains disagreements between the expected match result and the validated native worker result. It preserves the original match status, capture explorer and exact expectation checks.

| Evidence | Explanation |
| --- | --- |
| Native match covers only part of a full-input example | Actual half-open range and required `[0, input.length)` range |
| Native match exists but the example expects no match | Actual native match range |
| Input is shorter than a provable consuming lower bound | Minimum required UTF-16 length and actual input length |
| A mandatory case-sensitive literal is absent | The quoted missing literal |
| An input-start anchor requires a literal prefix that occurs elsewhere | The quoted literal required at input start |
| An input-end anchor requires a literal suffix that occurs elsewhere | The quoted literal required at input end |
| None of those conditions explains a native failure | Explicitly says the precise failing step is unavailable |

**Source after dev.8:** input-edge proofs are an unreleased extension. The [distribution snapshot](DISTRIBUTION.md) identifies the actual published runtime.

Ranges and lengths count UTF-16 units, not graphemes. For example, `😀A!` has four units, and searching for `A` returns `[2, 3)`. Full-input mode rejects that partial match; search mode accepts it.

The static proof follows mandatory groups, repetition minima and common requirements across alternatives. Optional branches impose no requirements. Positive assertions can require literal text somewhere in the input but consume zero units; negative assertions impose no literal requirements. Backreferences have a conservative zero consuming lower bound. String-valued character sets and properties also use zero when their length is uncertain. Large lower bounds saturate at 2,049, above the workshop's 2,048-unit input limit.

Literal conditions and literal length contributions are omitted when `i` is enabled. Native case folding remains the engine's responsibility. Literal inclusion uses string operations; regex matching remains in the isolated worker with the existing deadline and limits.

Input-edge proofs follow fixed literals through groups and exact repetition, common Unicode-code-point prefixes/suffixes across alternatives, and the minimum fixed text of variable repetition. Optional consuming sections, variable atoms and backreferences stop the proof; zero-width assertions and boundaries do not contribute consumed text. A fixed empty section or exactly zero repetitions can be crossed. Proof construction stops before expanding more than 2,048 UTF-16 units. It applies only to explicit absolute `start`/`end` anchors, so line anchors and their newline behavior do not become whole-input constraints. It is also omitted with `i`.

For `start`, `"ABC"`, `1 digit`, `"XYZ"`, `end`, the text `!ABC1XYZ` contains both required literals but violates the required prefix. The reason is **The input must begin with "ABC".** The text `ABC1XYZ!` instead violates the required suffix. These checks use `startsWith`/`endsWith` after a validated native failure; they never execute another regex in the main thread. Existing native-range, short-input and missing-literal explanations retain priority.

These are necessary conditions, not an execution trace or an exact account of the first failed rule. They do not show backtracking, identify which alternative the engine attempted or certify performance. Matching expectations for spans, captures and replacements continue to report their own agreement or disagreement. Compiler diagnostics and worker errors keep their existing behavior.

Reasons are text nodes, localized in all four interface languages and associated with the example input and expectation selector. Editing examples, changing rules or invalidating the pattern clears previous reasons before checking again.
