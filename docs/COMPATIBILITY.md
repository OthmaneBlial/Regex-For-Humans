# Regex compatibility

Current checkout evidence, 2026-10-10. Output targets JavaScript `RegExp` in Unicode mode. The `0.1.0-dev.4` development preview includes groups, references and ordered alternatives. Greedy/lazy repetition, lookaround and boundaries below describe the source checkout; lazy, assertion and boundary support are unreleased and absent from that npm version. Stable support and human reviews remain open.

| Construct | Rules → regex | Regex → rules |
| --- | --- | --- |
| Documented literals, shorthands, simple sets and greedy/lazy repetitions | Supported | Supported subset; unknown ranges fail explicitly |
| Numbered, named, nested and empty captures | Supported | Supported; capture values and indices preserved |
| Composite/nested noncapturing groups and whole-block repetitions | Supported | Supported; literal-only noncapturing groups retain compact normalization |
| Named/numbered backward references | Supported after the target closes | Supported under the same policy |
| Forward/open references | Positioned rule-language diagnostic | Unsupported |
| Ordered alternatives, nested/sequence/empty choices and whole-choice repetition | Supported with `either` blocks | Supported; precedence, capture participation and ordering preserved |
| Positive/negative lookahead and lookbehind, including nesting and captures | Supported; lookbehind requires native capability | Supported subset; native zero-width behavior and capture spans preserved |
| Word/non-word boundaries | Supported with native ASCII word status and i-folding | Supported; class backspace stays literal |
| Unicode properties and v-set operations | Not yet supported | Unsupported |
| Flags | `u` always; `m` through line anchors; `i`/`s` options | Only `i`/`m`/`s`/`u`; `u` required |
| Other regex engines | No target | No translation claim |

Groups are numbered in opening order, including named groups. Names are Unicode JavaScript identifiers and are unique across the document. Some newer JavaScript patterns allow duplicate names in disjoint alternatives; this DSL currently uses a stricter unique-name policy. A reference to an absent optional capture matches empty text, while a participating empty capture has value `""`. Repeated captures retain the final captured value. References inside or before their target are rejected by language policy, even when JavaScript permits them, including inside lookbehind.

Assertions consume no characters; their native captures can lie before or after the consumed match. JavaScript evaluates lookbehind contents backwards, including variable-length supported subpatterns. Compilation probes lookbehind and reports `UNSUPPORTED_TARGET_FEATURE` instead of approximating it when unavailable. Direct assertion repetition is rejected; repeat its contents or a containing group instead. Assertion blocks share the 64-level nesting and translated source/line budgets.

## Verified runtimes

Word-boundary support is an unreleased source addition beyond npm `0.1.0-dev.4`. It keeps native zero-width behavior, input-edge handling, Unicode case folding and captures. It does not provide natural-language word segmentation. Direct quantification fails explicitly; repeated containing groups remain supported. The new `BoundarySegment` variant is declared for TypeScript consumers.

- Host Node 25.9.0: all 268 Node tests plus a clean installed-package JavaScript/TypeScript consumer.
- Minimum supported major, Node 22.23.3: all 43 focused group/reference/alternative/lazy/assertion/boundary/localization checks, including CLI paths and a separate clean consumer.
- Bundled Chromium: all 308 desktop/mobile workshop checks, including group/reference/alternative/lazy/assertion/boundary imports, capture exploration, trace navigation and isolated matching. Installed Chrome also passes the release version/date/alternative flow at 1280/390px. Mobile viewport checks are not physical-device evidence.
- Playwright Firefox and WebKit: all 78 compatibility checks, including the same group/reference/alternative/lazy/assertion/boundary/capture flows.
- The complete `CI=1 npm run verify` command also passes the builds, 64 homepage checks and an audit with zero vulnerabilities. Final documentation records are rebuilt and checked afterward.
- Group milestone: 54 desktop/mobile group, worker security and automated accessibility checks. Human screen-reader and usability reviews remain unverified.

These results cover the checked constructs and versions. They do not establish every historical browser/version or all-platform CLI behavior. The broader workflow and reproducible commands are in [TESTING.md](TESTING.md); exact syntax and limitations are in [LANGUAGE.md](LANGUAGE.md). Matching copied regexes requires the receiving application's own execution safeguards.
