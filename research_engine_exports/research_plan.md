# Engine export research plan

Historical research snapshot used before implementing the source export wave. The resulting profiles, compatibility diagnostics and runtime evidence are maintained in [the language contract](../docs/LANGUAGE.md#engine-exports) and [compatibility evidence](../docs/COMPATIBILITY.md#engine-export-evidence).

Question: which source-checkout regex AST features can be translated exactly into each requested target engine, and which must fail with a precise diagnostic?

The current compiler targets native JavaScript Unicode RegExp, with all eight flags, captures/references, ordered alternatives, lazy repetition, lookaround, boundaries, Unicode properties and native v strings/set operations. This research prepares a later coherent feature wave. It does not modify the current structural-review change, frozen npm dev.5 release, Pages deployment or human review gates.

## Subtopics

1. Python re, Ruby Regexp and PHP PCRE: named capture/reference syntax, code-point and shorthand semantics, anchors, flags, Unicode properties, lookbehind and class/string-set operations. Record limits and official primary references in findings_python_ruby_php.md.
2. Rust regex and Go regexp: supported grammar and linear-time engine limitations; lookaround/references, flags, Unicode shorthand/category semantics, anchors and class/set operations. Record exact rejection requirements and primary references in findings_rust_go.md.
3. Java Pattern and C# System.Text.RegularExpressions: native group/reference syntax, flags, Unicode/UTF-16 semantics, lookaround and execution budgets; identify where equivalence cannot be claimed. Record primary references in findings_java_csharp.md.

Each research subtask uses at most 3-5 web searches and relies on official documentation or primary engine sources. Findings identify target editions and include direct supporting links; they distinguish source-string escaping from actual regex conversion. Do not execute arbitrary patterns, install runtimes or change source files. Root separately inventories installed runtimes and evaluates JavaScript/TypeScript packaging requirements.

## Synthesis

Combine findings into an AST capability matrix and explicit unsupported-feature diagnostics. Start with an honest verified subset for each target rather than silently weakening regex semantics. Validate generated snippets against locally available native runtimes; report unverified targets separately. Keep deployment-engine limits and runtime evidence independent of heuristic static review.
