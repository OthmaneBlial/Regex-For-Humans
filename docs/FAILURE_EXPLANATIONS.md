# Explaining failed examples

The workshop explains disagreements between the expected match result and the validated native worker result. It preserves the original match status, capture explorer and exact expectation checks.

| Evidence | Explanation |
| --- | --- |
| Native match covers only part of a full-input example | Actual half-open range and required `[0, input.length)` range |
| Native match exists but the example expects no match | Actual native match range |
| Input is shorter than a provable consuming lower bound | Minimum required UTF-16 length and actual input length |
| A mandatory case-sensitive literal is absent | The quoted missing literal |
| None of those conditions explains a native failure | Explicitly says the precise failing step is unavailable |

Ranges and lengths count UTF-16 units, not graphemes. For example, `😀A!` has four units, and searching for `A` returns `[2, 3)`. Full-input mode rejects that partial match; search mode accepts it.

The static proof follows mandatory groups, repetition minima and common requirements across alternatives. Optional branches impose no requirements. Positive assertions can require literal text somewhere in the input but consume zero units; negative assertions impose no literal requirements. Backreferences have a conservative zero consuming lower bound. String-valued character sets and properties also use zero when their length is uncertain. Large lower bounds saturate at 2,049, above the workshop's 2,048-unit input limit.

Literal conditions and literal length contributions are omitted when `i` is enabled. Native case folding remains the engine's responsibility. Literal inclusion uses string operations; regex matching remains in the isolated worker with the existing deadline and limits.

These are necessary conditions, not an execution trace or an exact account of the first failed rule. They do not show backtracking, identify which alternative the engine attempted or certify performance. Matching expectations for spans, captures and replacements continue to report their own agreement or disagreement. Compiler diagnostics and worker errors keep their existing behavior.

Reasons are text nodes, localized in all four interface languages and associated with the example input and expectation selector. Editing examples, changing rules or invalidating the pattern clears previous reasons before checking again.
