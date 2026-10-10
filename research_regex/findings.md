# Regex tooling findings

Reviewed 2026-10-10. Five batched search calls, followed by direct primary-source reads. “Documented” means verified in the publisher's current page or repository; competitor execution and complete engine conformance were not independently tested. No competitor code or visual assets were imported.

## User workflows

| Product and primary source | Documented capabilities | Evidence limits and useful lesson |
| --- | --- | --- |
| [regex101](https://regex101.com/) and its [official API documentation](https://github.com/firasdib/Regex101/wiki/API) | Token explanations, match information, several flavors, substitution/extraction and saved unit tests. The API documents whole-input assertions and assertions on captures, including nonparticipation. | The [official FAQ](https://github.com/firasdib/Regex101/wiki/FAQ#how-close-does-regex101-emulate-the-engines) describes engine/host discrepancies. Distinguish search from whole-input validation and distinguish missing captures from empty captures. A debugger's presence does not prove coverage of every flavor. |
| [RegExr official repository](https://github.com/gskinner/regexr) | Live matching, JavaScript and PHP/PCRE, hover details, tools, reference, saved/shared expressions and community patterns. | These are documented workflows; full current syntax and all testing modes were not audited. Keep explanations and example results close to the edited expression. |
| [Regexper](https://regexper.com/) and [canonical repository](https://gitlab.com/javallone/regexper-static/-/tree/master) | Railroad visualization; the live page exposes SVG/PNG downloads and permalinks. | Current ECMAScript syntax coverage and a capture inspector were not established. A structural diagram and export are useful without pretending to be a matching-engine debugger. |
| [Regex Vis official repository](https://github.com/Bowen7/regex-vis) and [live legend](https://regex-vis.com/) | Visualization, visual editing and testing. The legend covers captures, named captures, backreferences, choices, quantifiers and assertions. | A legend is not proof that every edge case round-trips correctly. Keep editing, emitted source and node selection synchronized through one syntax tree. |
| [RegexStudio official repository](https://github.com/chenz24/regex-studio) | Live capture inspection, railroad and node views, explanations, step debugging with capture snapshots, detailed test expectations, replacement, code generation and sharing. | The repository says development is active. Its supported-flavor claims and debugger conformance were not independently validated. Extraction results and capture expectations are practical priorities. |
| [Regex Railroad official repository](https://github.com/ndcorder/regex-railroad) | AST-based SVG railroad diagrams, explanations, NFA step debugging, static backtracking warnings, flavor-specific parsing, code-copy targets, URL sharing and patterns. | README claims are not an independent engine/security audit. Copying source for a target language does not establish its runtime semantics. Distinguish structural traversal from a native-engine execution trace. |

The product names are resolved to the linked publishers above; similarly named tools were not assumed to be the same product. [regex-railroad on Polyatic](https://polyatic.com/regex-railroad/) is another published diagram and match/replace tool; it was not conflated with the ndcorder project.

## Parser and performance choices

| Primary source | Verified scope and license | Implication |
| --- | --- | --- |
| [@eslint-community/regexpp](https://github.com/eslint-community/regexpp), [validator options](https://github.com/eslint-community/regexpp/blob/main/src/validator.ts), [license](https://github.com/eslint-community/regexpp/blob/main/LICENSE) | An ECMAScript AST parser, validator and visitor. Current source defaults to ES2025 and documents named groups, lookbehind, `v`, duplicate names and modifiers. MIT. | Suitable if importing broader native regex syntax needs a complete AST. A parser accepting a construct does not mean our language can express it or the user's runtime implements it. Configure and test the intended edition. |
| [regex-parser](https://github.com/IonicaBizau/regex-parser.js), [implementation](https://github.com/IonicaBizau/regex-parser.js/blob/master/lib/index.js), [license](https://github.com/IonicaBizau/regex-parser.js/blob/master/LICENSE) | Converts a string to native `RegExp`; its documented result is not an AST. MIT. | It does not replace a structural parser. Keep the existing strict literal reader and its input/flag checks; introducing this package does not solve grouping or visualization. |
| [safe-regex](https://github.com/davisjam/safe-regex), [license](https://github.com/davisjam/safe-regex/blob/master/LICENSE) | A star-height heuristic for potentially exponential behavior, with an optional repetition limit. The publisher explicitly acknowledges false positives and false negatives. MIT. | Advisory findings only. Absence of a warning is not evidence of safe runtime. Adjacent repetitions can still be costly. |
| [redos-detector](https://github.com/tjenkinson/redos-detector), [license](https://github.com/tjenkinson/redos-detector/blob/master/LICENSE) | Analysis scores/trails, step and time limits, and an explicit pattern-downgrade result. MIT. | Treat time/step exhaustion and unsupported or downgraded patterns as inconclusive. Prevent analysis itself from blocking the UI; preserve the original expression. |
| [Google RE2](https://github.com/google/re2) | The engine documents linear input-time matching and resource budgets, while rejecting backreferences and lookaround. | Changing engines changes syntax and semantics. It cannot transparently execute a language that promises native JavaScript captures/backreferences/lookaround. |

Keep [our worker deadline and validation limits](../docs/SECURITY_MODEL.md). Static warnings complement execution isolation; neither gives a general safety guarantee for a copied regex.

## ECMAScript behavior to preserve

The authoritative reference is the [ECMAScript 2026 regular-expression specification](https://tc39.es/ecma262/2026/multipage/text-processing.html).

- Named and unnamed captures are numbered by opening-parenthesis order; noncapturing groups do not consume numbers. Match index 0 holds the whole match; `groups` holds named values. See [capture counting](https://tc39.es/ecma262/2026/multipage/text-processing.html#sec-countleftcapturingparensbefore) and [RegExpBuiltinExec](https://tc39.es/ecma262/2026/multipage/text-processing.html#sec-regexpbuiltinexec).
- Nonparticipation produces `undefined`, distinct from an empty capture. Repetition retains the final capture value, not history. The `d` flag adds UTF-16 match/capture spans. See [RegExpBuiltinExec](https://tc39.es/ecma262/2026/multipage/text-processing.html#sec-regexpbuiltinexec) and [RepeatMatcher](https://tc39.es/ecma262/2026/multipage/text-processing.html#sec-repeatmatcher).
- `\1` and `\k<name>` refer to captured text; `i` affects comparison. A nonparticipating capture's reference succeeds without consuming text, including forward references. See [BackreferenceMatcher](https://tc39.es/ecma262/2026/multipage/text-processing.html#sec-backreferencematcher).
- Invalid Unicode-mode references are syntax errors. Duplicate names require groups that cannot both participate. Universally unique names or earlier-defined references would be stricter product policies. See [early errors](https://tc39.es/ecma262/2026/multipage/text-processing.html#sec-patterns-static-semantics-early-errors).

Small native checks on local Node v25.9.0 confirmed mixed named/numbered captures, unmatched references, a forward reference and repeated-capture values. They do not establish cross-browser compatibility. When displaying or exporting captures, preserve the missing/empty distinction explicitly: plain JSON stringification turns array `undefined` into `null` and omits object properties with `undefined`.

## Decision

Prioritize structured groups/captures with faithful reverse translation, visible extraction values and spans, then an AST-driven diagram and node-to-source navigation. Add capture expectations before cosmetic debugger effects. Require explicit unsupported-syntax diagnostics and bounded execution throughout. Wider engines, a simulated execution debugger and static ReDoS scoring each need their own conformance evidence; they are not prerequisites for a useful JavaScript workshop.
