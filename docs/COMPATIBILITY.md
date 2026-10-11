# Regex compatibility

Preview `0.1.0-dev.9` targets native JavaScript `RegExp` in u or v mode. It includes groups, references, ordered alternatives, lazy repetition, lookaround, boundaries, Unicode properties/classes, finite string sets, nested v-set operations and all eight flags. The verified runtimes and limits below apply to this preview; stable support and human reviews remain open.

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
| Nested native v sets, union, intersection and subtraction | Supported with typed blocks, exact member spans and structural complement validation | Supported; operators, native strings, captures and cursors preserved |
| Empty character classes | Empty union block in v mode; u-mode empty classes remain unsupported | Supported in v mode; positioned unsupported diagnostic in u mode |
| Flags | All eight native options; default u, exclusive v; m explicit or from line anchors | u or v required; d/g/i/m/s/v/y preserved without touching input `lastIndex` |
| Other regex engines | Engine profiles through `exportRegex`; see below | Only JavaScript input is accepted; no foreign-regex reverse translation |

Explicit flags, native u/v classes, v strings and nested sets are included in npm `0.1.0-dev.9`. Mixed anchors keep input boundaries absolute under m; native lookbehind is required for absolute input start in that mode. Nested set operations require v mode and retain native structural string-complement restrictions. Runtime flag support and Unicode editions are supplied by the target engine, with explicit capability diagnostics instead of fallback matching. The separate code-point sequence `\q{\u{d83d}\u{de00}}` matches a literal emoji in installed Node/Chromium/Firefox but does not in installed WebKit; its reverse translation retains both surrogate parts so it preserves the selected runtime's behavior. This does not promise identical native results across engines or Unicode editions.

Groups are numbered in opening order, including named groups. Names are Unicode JavaScript identifiers and are unique across the document. Some newer JavaScript patterns allow duplicate names in disjoint alternatives; this DSL currently uses a stricter unique-name policy. A reference to an absent optional capture matches empty text, while a participating empty capture has value `""`. Repeated captures retain the final captured value. References inside or before their target are rejected by language policy, even when JavaScript permits them, including inside lookbehind.

Assertions consume no characters; their native captures can lie before or after the consumed match. JavaScript evaluates lookbehind contents backwards, including variable-length supported subpatterns. Compilation probes lookbehind and reports `UNSUPPORTED_TARGET_FEATURE` instead of approximating it when unavailable. Direct assertion repetition is rejected; repeat its contents or a containing group instead. Assertion blocks share the 64-level nesting and translated source/line budgets.

## Engine export evidence

The [engine export contract](LANGUAGE.md#engine-exports) is separate from the existing JavaScript compiler. Nine source formats cover eight engine families: JavaScript and TypeScript share ECMAScript. Foreign targets translate supported AST semantics and expose compatibility errors rather than substitute native defaults for Unicode classes, flags or capture behavior. These additions are included in npm `0.1.0-dev.9` and the hosted workshop.

The native verification script compiles and executes the generated snippets in installed SDKs, compares full-match spans after converting offsets to UTF-16, and reads captures by mapped name. The corpus covers Unicode/RTL/astral input, ECMAScript whitespace/word membership, scalar ranges, finite-set operations, anchors, lazy/count repetition, absent/empty captures, references and supported lookarounds. A successful corpus does not prove every possible pattern, Unicode edition or runtime version.

| Installed runtime | Patterns | Successful span/capture comparisons |
| --- | ---: | ---: |
| Python 3.14.7 | 28 | 1,364 |
| Rust `regex` 1.13.1, Cargo 1.95.0 | 21 | 1,010 |
| Go 1.22.0 | 21 | 1,010 |
| OpenJDK 17.0.19 | 27 | 1,306 |
| .NET SDK 10.0.400 | 30 | 1,480 |
| Ruby 2.6.10 | 26 | 1,248 |
| PHP 8.5.11 / PCRE2 10.44 (2024-06-07), JIT available | 28 | 1,364 |

The seven tested engines pass **8,782** comparisons with every runtime required by the command. The added literal-template case retains PHP/Ruby interpolation-like data, quotes, backslashes, Arabic, Urdu and an emoji as exact input. Native PHP spans begin as UTF-8 byte offsets and are converted to UTF-16 for comparison; `PREG_UNMATCHED_AS_NULL` preserves absent versus participating empty captures. Java 17 supplementary lookbehind uses literal code points in the regex and Unicode escapes in Java source; hex-escaped supplementary lookbehind failed the comparison gate before this lowering was corrected. Rust can omit inactive `{0}` capture names, so original group indices remain identity metadata and target values are read by `gN` names. Nullable non-word-boundary searches with a possible surrogate-interior zero-width position fail explicitly instead of claiming scalar-position equivalence.

PHP was built as a temporary CLI from the official PHP 8.5.11 source archive, with SHA-256 `d9be75c08e8c316f4c8f4194d8fbe1750a15f6a6d9d4e3fe72082abeeb800360`, using `--disable-all --enable-cli --disable-cgi --disable-phpdbg --without-pear`. The verifier uses `php -n` for both the edition probe and generated programs, recording the actual `PHP_VERSION` and `PCRE_VERSION`. It passes all 28 selected patterns. Before updating the requirement wording, their complete exported results were identical to the installed public dev.7 package, so the native corpus also verifies that published generated code. Preview dev.8 names the tested PHP/PCRE2 editions in the API requirement and workshop label; older dev.7 packages retain their historical unverified label. These receipts cover the listed corpus and editions, not other PHP builds or every possible pattern. See the official [PHP release metadata](https://www.php.net/releases/?json&version=8.5.11), [PCRE constants](https://www.php.net/manual/en/pcre.constants.php) and [match-offset contract](https://www.php.net/manual/en/function.preg-match.php).

Foreign profiles require well-formed Unicode, reject `d/g/i/y` and native Unicode properties, and diagnose unsupported assertion widths, capture resets and nullable repetition. The browser generates code and downloads metadata; its examples still run in the isolated JavaScript worker. Native snippets need the receiving application's own compilation limits and matching safeguards. The PHP fixed-lookbehind profile is tested on PHP 8.5.11 / PCRE2 10.44; other editions require application-specific validation.

## Structural review compatibility

`analyze` and **Review the pattern** use the same JavaScript grammar, flags, native capability probes and budgets as compilation. Findings cover heuristic structural candidates and selected known character witnesses; they do not assert Unicode language equivalence, other-engine support or safe runtime complexity. Native v-set subtraction/negation remains unknown to the witness model, while literal/range/positive union/intersection and selected ASCII case pairs can establish overlaps. No findings does not prove safety. See [structural risk review](LANGUAGE.md#structural-risk-review). These additions are included in npm `0.1.0-dev.9` and the hosted workshop.

## Verified runtimes

`toSVG` uses the same native feature probes and source/line/depth budgets as compilation. The workshop adds interactive structural diagrams and standalone SVG export, including Unicode/RTL-safe literal display. There is no approximation for unavailable v features or lookbehind. Diagrams describe AST paths and constraints; they do not record engine backtracking, predict which path matched or enumerate class members. Available in npm `0.1.0-dev.9` and the hosted workshop. See [structural diagrams](LANGUAGE.md#structural-diagrams).

Group editing uses the `editGroup` npm API and the hosted workshop form. Edits use the shared AST, retain resolved numeric/named reference targets, validate the resulting document and reject conversion of a referenced capture to noncapturing. Native capture highlighting uses supplied indices only. See [group editing](LANGUAGE.md#editing-groups) for the API and explicit failure behavior.

Standalone property rules are included in npm `0.1.0-dev.9`. Names and values remain case-sensitive; membership uses the runtime's Unicode data. Native `\P` complements retain `u`/`i` behavior and are not rewritten as negated `\p` classes. Compilation probes support; unavailable properties report `UNSUPPORTED_TARGET_FEATURE`, while an unrecognized alias reports `INVALID_UNICODE_PROPERTY` at its quoted value. `UnicodePropertySegment` exposes the alias, polarity and repetition to typed consumers. These checks do not imply legacy runtimes can load the whole compiler or that all engines use the same Unicode edition.

Composable classes are included in npm `0.1.0-dev.9`: `character class:` unions literals/ranges/native shorthands/properties and `not character class:` negates that union. Range endpoints are one Unicode code point, in ascending code-point order; a range is not locale collation. `CharacterClassSegment.members` retains typed values, individual source locations and exact generated spans. Native u/i property complements remain separate from outer-class negation. The shared CLI, reverse translator and isolated workshop use this AST; Other-engine support is not claimed; v-mode behavior is checked separately against each native runtime.

Word boundaries are included in npm `0.1.0-dev.9`. It keeps native zero-width behavior, input-edge handling, Unicode case folding and captures. It does not provide natural-language word segmentation. Direct quantification fails explicitly; repeated containing groups remain supported. The new `BoundarySegment` variant is declared for TypeScript consumers.

- Host Node 25.9.0: all 328 Node tests plus a clean installed-package JavaScript/TypeScript/API/CLI consumer.
- Minimum supported major, Node 22.23.3: all 51 selected export/CLI/localization checks plus a separate clean JavaScript/TypeScript/API/CLI consumer; earlier source milestones also verify the selected diagram/group-editing/analysis checks.
- Bundled Chromium: all 408 desktop/mobile workshop checks, including native nested set/string imports, captures, cursors, trace/diagram/review navigation, export code/metadata downloads and isolated matching. Mobile viewport checks are not physical-device evidence.
- Playwright Firefox and WebKit: all 178 compatibility checks, including native set/string/flag/class/property/assertion/capture flows, structural review and export UI generation/downloads.
- The complete `CI=1 npm run verify` command also passes the builds, 64 homepage checks and an audit with zero vulnerabilities. Final documentation records are rebuilt and checked afterward.
- Group milestone: 54 desktop/mobile group, worker security and automated accessibility checks. Human screen-reader and usability reviews remain unverified.

These results cover the checked constructs and versions. They do not establish every historical browser/version or all-platform CLI behavior. The broader workflow and reproducible commands are in [TESTING.md](TESTING.md); exact syntax and limitations are in [LANGUAGE.md](LANGUAGE.md). Matching copied regexes requires the receiving application's own execution safeguards.
