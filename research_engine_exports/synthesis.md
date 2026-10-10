# Engine export decisions before implementation

Historical status at research time: no cross-engine implementation or native parity had been completed. The subsequent source wave implements the profiles in [the language contract](../docs/LANGUAGE.md#engine-exports) and records 7,388 comparisons across six installed engines in [compatibility evidence](../docs/COMPATIBILITY.md#engine-export-evidence). PHP remains unverified. The proposed decisions below explain the constraints evaluated before implementation; source-string quoting alone does not convert regex semantics.

## Proposed contract

- Export from the validated AST and resolved capture identities, preserving source locations for target-specific diagnostics.
- Return target/engine/edition metadata, generated regex source and source-code snippet, explicit input and result requirements, and unsupported-feature diagnostics. Do not silently drop flags, captures, assertions, references or Unicode semantics.
- Separate Boolean search from full match, captures, UTF-16 indices and stateful global/sticky cursors. JavaScript/TypeScript share native RegExp; other engines do not automatically share these result contracts.
- Reject unimplemented constructs precisely. A stricter verified subset is preferable to advertising equivalent behavior from a native parser merely accepting the pattern.
- Make well-formed Unicode requirements explicit for UTF-8/scalar engines. They cannot represent all JavaScript lone-surrogate subject strings.

## First-wave capability evaluation

| Target | Engine evidence | Initial requirements and rejection candidates |
| --- | --- | --- |
| JavaScript / TypeScript | Native RegExp, existing compiler and local Node 22/25 evidence | Correctly quote source/flags for an explicitly selected Boolean or match/cursor snippet; retain u/v capability probes and matching safeguards. TypeScript is a source-code wrapper, not a separate regex flavor. |
| Python | Standard-library re, docs pinned to 3.14; local 3.14.7 | Translate named groups/references and explicit ASCII shorthands/line terminators. Reject unverified folding/properties/v strings, unsupported variable lookbehind and possibly unset references until exact lowering is verified. Preserve astral points and subject surrogate serialization separately. |
| Rust | regex 1.13.1 documentation and local cached crate | Reject references and lookaround. Require scalar input and a defined result contract; lower dot/whitespace/boundaries. Scalar set algebra can help with character sets, but string sets and Unicode-version equivalence require separate work. |
| Go | Official go1.22.0 source/docs; same local runtime | Reject references/lookaround and unsupported string sets. Require scalar input, explicit shorthands/dot/line boundaries and verified capture lifetime. Flatten scalar set operations only when exact membership is known. |
| Java | Java 25 docs/source; local OpenJDK 17.0.19 | Pin each verified edition separately. Validate/migrate capture names, lower anchors/shorthands and reject unverified folding, unmatched references and repeated capture-reset differences. Java 17 and 25 boundaries differ. |
| C# | .NET 10 docs/source; local SDK 10.0.400 | Map named/unnamed capture numbering. Translate Unicode-scalar atoms over UTF-16 rather than copying dot/classes. Pin .NET 10 options, use an enforceable match timeout and reject unaudited folding/properties/capture/reference differences. |
| PHP | PHP/PCRE documentation; no local executable | Inspect the actual PCRE2 version independently. Require valid UTF subjects in Unicode mode, reject lone surrogates and unaudited unset/repeated-capture behavior. Variable lookbehind and newer set syntax are version-specific. No local runtime proof yet. |
| Ruby | Current official Regexp docs; local 2.6.10 | Named groups suppress unnamed capture participation, so mixed capture forms need explicit lowering or rejection. Translate line/absolute anchors, whitespace and boundary behavior; reject unverified folding/properties/v strings and capture-sensitive lookbehind/reference cases. Verify the older local edition separately. |

## Verification plan

1. Define the export result and input contract before choosing templates; use existing parser/compiler diagnostics and AST budgets.
2. Add target capability walks and unit tests for honest rejection before widening accepted syntax.
3. Compare native engines on boundary/line-terminator, astral/lone-surrogate, empty/absent/final-iteration capture, reference, case-folding and negative/adversarial examples. Compare actual results rather than only emitted strings or successful construction.
4. Execute native consumers only in isolated processes with enforceable deadlines. Keep package exports and browser matching safeguards independent of external-engine evidence.
5. Document verified editions, unsupported constructs and unavailable runtimes. Publish support only for the tested contract; leave human language/accessibility review unchecked.

Primary citations and edition caveats are attached to each finding in [Python/Ruby/PHP](findings_python_ruby_php.md), [Rust/Go](findings_rust_go.md) and [Java/C#](findings_java_csharp.md). [Runtime inventory](runtime_inventory.md) records feasibility without claiming parity.
