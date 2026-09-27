# Changelog

## Unreleased

- Added a deterministic, documented controlled-English compiler for JavaScript regular expressions with explicit diagnostics, source spans and explanations.
- Added compact rules such as `start`, `3 digits`, `any text`, and `text without:`.
- Shortened explanations for wildcard text and repeated character sets.
- Versioned workshop assets per build so browsers load updated recipes and explanations.
- Duplicate beginning anchors now report the second anchor directly.
- Rule lines and line limits now recognize all JavaScript line terminators.
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

These are features in the repository's development build. No npm version or GitHub Release has been published. Release notes and compatibility changes will be recorded here when a release is verified.
