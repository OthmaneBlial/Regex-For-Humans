# Changelog

## Unreleased

- Delayed clipboard results no longer clear newer compiler errors or describe an edited pattern as copied.
- Workshop rule counts and trace selection now recognize the compiler's Unicode line separators and quoted values.
- CLI diagnostics now finish writing before exit, preserving large JSON errors when piped.
- Escaped lone UTF-16 surrogates so CLI output and copied regex preserve them; separate surrogate items no longer merge inside character sets.
- Added TypeScript declarations and a strict consumer check.
- Counts before anchors now report a specific error at the anchor.
- Errors after a count now point past the count.
- Editing rules clears the selected recipe highlight.
- Simplified the pre-release grammar to short anchors, rule names, quoted literals and count-first repetition; verbose aliases and suffix counts are rejected.
- Condensed exact digit explanations to one sentence.
- Shortened unknown-rule hints and anchor errors.
- Added a deterministic, documented controlled-English compiler for JavaScript regular expressions with explicit diagnostics, source spans and explanations.
- Added compact rules such as `start`, `3 digits`, `any text`, and `text without:`.
- Rejected misleading `alphanumeric character` aliases; use `word` and `not word` for JavaScript's `\w` and `\W` classes.
- Limited `a` and `an` to quoted literals; other rules use their exact forms.
- Made CLI argument errors structured in `--json` mode with the `CLI_USAGE` code.
- Explained greedy text relative to the next rule in the workshop trace.
- Shortened trace copy while keeping flag and repetition details.
- Shortened the homepage and workshop introductions.
- Shortened wildcard, character and whitespace explanations.
- Character-set explanations now describe case-insensitive matching.
- Linked invalid rule feedback to the editor for screen readers.
- Added strict workshop UI types and a shared worker message contract; non-Error failures stay readable.
- Versioned workshop assets per build so browsers load updated recipes and explanations.
- Clarified local rule handling without implying the workshop saves edits.
- Fixed keyboard skip navigation so it focuses the workshop without resetting edited rules.
- Duplicate start anchors now report the second anchor directly.
- Rule lines and line limits now recognize all JavaScript line terminators.
- Added a compact date-shape recipe with explicit calendar-validation limits.
- Corrected the `end` explanation and docs: JavaScript `$` rejects a final line break without `m`.
- Replaced parser jargon in the syntax guide intro with plain rule wording.
- Duplicate repetition modifiers now point to the second modifier in diagnostics.
- Multi-character list items now point to the invalid item in diagnostics.
- Invalid repetition ranges now point to the upper bound that needs correction.
- Oversized repetition counts now point to the invalid number.
- Overlength rule input now points to where the limit is exceeded.
- A final newline no longer counts as an extra input line.
- Trailing text after a quoted literal points to its first unexpected character.
- In `--json` mode, CLI runtime errors now use structured output with the `CLI_ERROR` code.
- Workshop rule counter now counts instructions and ignores blank lines.
- Workshop enforces source limits on whitespace-only input.
- Malformed quoted values now point to invalid escapes, raw control characters or missing quotes.
- CLI filenames beginning with `-` can follow the standard `--` option terminator.
- Added a public project site with the hosted interactive workshop.
- Added an ESM library API, a file/stdin CLI and a local static browser workshop with positive and negative examples.
- Added worker-isolated browser matching with timeout, parser limits, security notes and automated Node/browser coverage.
- Fixed worker rejection of valid patterns whose Unicode escapes expand the compiled source.

These are features in the repository's development build. No npm version or GitHub Release has been published. Release notes and compatibility changes will be recorded here when a release is verified.
