# Regex compatibility

Preview `0.1.0-dev.5` targets native JavaScript `RegExp` in u or v mode. It includes groups, references, ordered alternatives, lazy repetition, lookaround, boundaries, Unicode properties/classes, finite string sets, nested v-set operations and all eight flags. The verified runtimes and limits below apply to this preview; stable support and human reviews remain open.

| Construct | Rules → regex | Regex → rules |
| --- | --- | --- |
| Documented literals, shorthands, simple sets and greedy/lazy repetitions | Supported | Supported subset; unsupported constructs fail explicitly |
| Numbered, named, nested and empty captures | Supported | Supported; capture values and indices preserved |
| Composite/nested noncapturing groups and whole-block repetitions | Supported | Supported; literal-only noncapturing groups retain compact normalization |
| Named/numbered backward references | Supported after the target closes | Supported under the same policy |
| Forward/open references | Positioned rule-language diagnostic | Unsupported |
| Ordered alternatives, nested/sequence/empty choices and whole-choice repetition | Supported with `either` blocks | Supported; precedence, capture participation and ordering preserved |
| Positive/negative lookahead and lookbehind, including nesting and captures | Supported; lookbehind requires native capability | Supported subset; native zero-width behavior and capture spans preserved |
| Word/non-word boundaries | Supported with native ASCII word status and i-folding | Supported; class backspace stays literal |
| Standalone Unicode character properties and complements | Supported with native aliases and runtime capability checks in u/v modes | Supported; aliases, polarity, flags and capture behavior preserved |
| Composable character classes with literals, inclusive code-point ranges, singular shorthands and Unicode properties | Supported in native u/v modes; outer and property negation stay distinct | Supported; escaping, unions, captures, flags and source metadata preserved |
| Finite native string sets and Unicode properties of strings | Supported with explicit v mode, native capability checks and structural complement validation | Supported; longest-first matching, empty members, captures and separate surrogate code-point sequences preserved |
| Nested native v sets, union, intersection and subtraction | Supported with typed blocks, exact member spans and structural complement validation | Supported; operators, native strings, captures and cursors preserved |\n| Empty character classes | Empty union block in v mode; u-mode empty classes remain unsupported | Supported in v mode; positioned unsupported diagnostic in u mode |
| Flags | All eight native options; default u, exclusive v; m explicit or from line anchors | u or v required; d/g/i/m/s/v/y preserved without touching input `lastIndex` |
| Other regex engines | No target | No translation claim |

Explicit flags, native u/v classes, v strings and nested sets are included in npm `0.1.0-dev.5`. Mixed anchors keep input boundaries absolute under m; native lookbehind is required for absolute input start in that mode. Nested set operations require v mode and retain native structural string-complement restrictions. Runtime flag support and Unicode editions are supplied by the target engine, with explicit capability diagnostics instead of fallback matching. The separate code-point sequence `\q{\u{d83d}\u{de00}}` matches a literal emoji in installed Node/Chromium/Firefox but does not in installed WebKit; its reverse translation retains both surrogate parts so it preserves the selected runtime's behavior. This does not promise identical native results across engines or Unicode editions.

Groups are numbered in opening order, including named groups. Names are Unicode JavaScript identifiers and are unique across the document. Some newer JavaScript patterns allow duplicate names in disjoint alternatives; this DSL currently uses a stricter unique-name policy. A reference to an absent optional capture matches empty text, while a participating empty capture has value `""`. Repeated captures retain the final captured value. References inside or before their target are rejected by language policy, even when JavaScript permits them, including inside lookbehind.

Assertions consume no characters; their native captures can lie before or after the consumed match. JavaScript evaluates lookbehind contents backwards, including variable-length supported subpatterns. Compilation probes lookbehind and reports `UNSUPPORTED_TARGET_FEATURE` instead of approximating it when unavailable. Direct assertion repetition is rejected; repeat its contents or a containing group instead. Assertion blocks share the 64-level nesting and translated source/line budgets.

## Verified runtimes

Standalone property rules are included in npm `0.1.0-dev.5`. Names and values remain case-sensitive; membership uses the runtime's Unicode data. Native `\P` complements retain `u`/`i` behavior and are not rewritten as negated `\p` classes. Compilation probes support; unavailable properties report `UNSUPPORTED_TARGET_FEATURE`, while an unrecognized alias reports `INVALID_UNICODE_PROPERTY` at its quoted value. `UnicodePropertySegment` exposes the alias, polarity and repetition to typed consumers. These checks do not imply legacy runtimes can load the whole compiler or that all engines use the same Unicode edition.

Composable classes are included in npm `0.1.0-dev.5`: `character class:` unions literals/ranges/native shorthands/properties and `not character class:` negates that union. Range endpoints are one Unicode code point, in ascending code-point order; a range is not locale collation. `CharacterClassSegment.members` retains typed values, individual source locations and exact generated spans. Native u/i property complements remain separate from outer-class negation. The shared CLI, reverse translator and isolated workshop use this AST; Other-engine support is not claimed; v-mode behavior is checked separately against each native runtime.

Word boundaries are included in npm `0.1.0-dev.5`. It keeps native zero-width behavior, input-edge handling, Unicode case folding and captures. It does not provide natural-language word segmentation. Direct quantification fails explicitly; repeated containing groups remain supported. The new `BoundarySegment` variant is declared for TypeScript consumers.

- Host Node 25.9.0: all 301 Node tests plus a clean installed-package JavaScript/TypeScript consumer.
- Minimum supported major, Node 22.23.3: all 55 selected set/string/flag/class/property/reverse checks, including CLI paths and a separate clean consumer.
- Bundled Chromium: all 378 desktop/mobile workshop checks, including native nested set/string imports, captures, cursors, trace navigation and isolated matching. Mobile viewport checks are not physical-device evidence.
- Playwright Firefox and WebKit: all 148 compatibility checks, including native set/string/flag/class/property/assertion/capture flows.
- The complete `CI=1 npm run verify` command also passes the builds, 64 homepage checks and an audit with zero vulnerabilities. Final documentation records are rebuilt and checked afterward.
- Group milestone: 54 desktop/mobile group, worker security and automated accessibility checks. Human screen-reader and usability reviews remain unverified.

These results cover the checked constructs and versions. They do not establish every historical browser/version or all-platform CLI behavior. The broader workflow and reproducible commands are in [TESTING.md](TESTING.md); exact syntax and limitations are in [LANGUAGE.md](LANGUAGE.md). Matching copied regexes requires the receiving application's own execution safeguards.
