# Competitor gaps and priorities

Last primary-source review: 2026-10-10. This is a living implementation checklist, not a claim of competitor runtime parity. Publisher documentation verifies the capabilities below; complete runtime behavior, safety and accessibility were not audited. Detailed sources and parser decisions are in [research findings](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/research_regex/findings.md).

## What users can already find elsewhere

| Tool | Documented workflow that informs our priorities | What remains unverified |
| --- | --- | --- |
| [regex101](https://regex101.com/) / [official API docs](https://github.com/firasdib/Regex101/wiki/API) | Explanations, capture information, substitution, saved tests and capture assertions. | Current debugger coverage across flavors and exact host parity; its [FAQ](https://github.com/firasdib/Regex101/wiki/FAQ#how-close-does-regex101-emulate-the-engines) documents discrepancies. |
| [RegExr](https://github.com/gskinner/regexr) | Live feedback, hover details, reference, tools, share/save and community patterns. | Full syntax/engine coverage and every test mode. |
| [Regexper](https://regexper.com/) | Railroad diagrams, SVG/PNG export and permalinks. | Current syntax coverage and extraction/testing capabilities. |
| [Regex Vis](https://github.com/Bowen7/regex-vis) | Visualization, visual edits and testing. | Complete semantic round trips and browser compatibility. |
| [RegexStudio](https://github.com/chenz24/regex-studio) | Capture inspection, diagrams, node editing, capture-aware assertions and debugger snapshots. | Complete target-engine and simulated-debugger conformance. |
| [Regex Railroad](https://github.com/ndcorder/regex-railroad) | AST diagrams, explanations, step debugging, backtracking warnings and code-copy targets. | Engine equivalence, warning accuracy and complete flavor support. |

## Implementation checklist

Baseline evidence for this review is the documented version 1 contract in [LANGUAGE.md](LANGUAGE.md) and [SECURITY_MODEL.md](SECURITY_MODEL.md). Update each status and its evidence when the corresponding milestone ships; proposals below are not advertised as implemented.

| Priority | Gap / next result | Baseline status | Completion evidence |
| --- | --- | --- | --- |
| P0 | Structured noncapturing groups, named/numbered captures, alternatives and composite repetition. | Implemented nested capture/group blocks, ordered `either` choices and whole-block repetition. | [Group tests](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/test/groups.test.js) and [alternative tests](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/test/alternation.test.js): exact AST/source spans, positioned diagnostics, capture ordering and bounded nesting. |
| P0 | Preserve group/capture semantics when importing regexes. | Imports captures, composite/nested groups, ordered alternatives and backward references. | [Round-trip corpus](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/test/group-roundtrip.test.js) and alternative corpus compare native capture arrays, named values and match/capture indices across flags; unsupported assertions and references keep positioned diagnostics. |
| P0 | Show extracted captures with names, numbers, values and spans. | Worker-backed capture explorer shows native values/spans and up to 100 search matches; absent and empty captures stay distinct. | [Capture browser checks](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/test/browser/captures.spec.js) verify empty, unmatched, repeated, nested and astral captures, lazy table rendering and values-only fallback when native indices are unavailable. |
| P0 | Keep execution bounded as the grammar grows. | Validated worker requests and termination deadlines exist. | New constructs retain cancellation/recovery checks; depth/node/output limits fail before expensive work. Static warnings remain advisory. |
| P1 | Explain the syntax tree and link nodes to source. | Group/alternative openings, branch separators, closings and resolved references have explanations and exact source spans. | Group/reference/alternative browser checks include keyboard source selection across engines; structural diagrams remain open. |
| P1 | Add an AST-driven structure diagram, with accessible selection and SVG export. | No structural diagram in the v1 language contract. | Browser checks for groups, choices and repetitions; keyboard access, text equivalent and verified exported SVG. |
| P1 | Make test cases inspect extraction, not only acceptance. | Entire-string/Search modes and positive/negative examples exist. | Capture expectations preserve missing versus empty and clearly report mismatches. |
| P2 | Add replacement/code-copy workflows and portable saved sessions. | Broader workflow expansion requires an explicit contract. | Examples reproduce captures and escaping in the named target; imported session data passes bounded validation. |
| P2 | Broader regex import or additional engines. | JavaScript Unicode output and a deliberate reverse subset. | Edition/flavor compatibility matrix; unsupported constructs fail explicitly; parser acceptance is separate from runtime support. |
| P2 | Execution debugging and ReDoS analysis. | Worker deadlines protect workshop interaction; no general safety claim. | Trace is labelled native or simulated; analysis exhaustion/downgrade is visible; tested limitations accompany warnings. |

## Decisions to retain

- Preserve deterministic rules, exact diagnostics and reversible supported syntax. A diagram should share the compiler's AST rather than parse generated source a second time.
- [regexpp](https://github.com/eslint-community/regexpp) is an AST parser if broader imports warrant it. [regex-parser](https://github.com/IonicaBizau/regex-parser.js) produces `RegExp`, so it does not solve structural parsing. Both are MIT; no dependency is adopted by this research.
- [safe-regex](https://github.com/davisjam/safe-regex) acknowledges false positives/negatives. [redos-detector](https://github.com/tjenkinson/redos-detector) exposes limits and pattern downgrade. Neither replaces the workshop's worker deadline or the application's own execution policy after copying a regex.
- [RE2](https://github.com/google/re2) rejects backreferences and lookaround, so switching engines would require a different public contract.
- Native JavaScript allows some duplicate names in disjoint alternatives and empty success for unmatched backreferences. A narrower initial rule-language policy must be stated as that policy and must not misdescribe JavaScript semantics. See the [ECMAScript specification](https://tc39.es/ecma262/2026/multipage/text-processing.html#sec-backreferencematcher).

Research did not copy source or assets, run competitor test suites, or establish a security guarantee. Revisit this checklist when support changes; verify shipped behavior against local tests and browser evidence before marking a gap closed.
