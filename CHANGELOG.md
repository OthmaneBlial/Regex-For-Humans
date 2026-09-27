# Changelog

## Unreleased

- Added a deterministic, documented controlled-English compiler for JavaScript regular expressions with explicit diagnostics, source spans and explanations.
- Added short aliases such as `start`, `3 digits`, and `one of:` while retaining the longer phrases.
- Duplicate repetition modifiers now point to the second modifier in diagnostics.
- Multi-character list items now point to the invalid item in diagnostics.
- Invalid repetition ranges now point to the upper bound that needs correction.
- Oversized repetition counts now point to the invalid number.
- Overlength rule input now points to where the limit is exceeded.
- A final newline no longer counts as an extra rule line.
- Malformed quoted values now point to invalid escapes, raw control characters or missing quotes.
- CLI filenames beginning with `-` can follow the standard `--` option terminator.
- Added a public project site with the hosted interactive workshop.
- Added an ESM library API, a file/stdin CLI and a local static browser workshop with positive and negative examples.
- Added worker-isolated browser matching with timeout, parser limits, security notes and automated Node/browser coverage.

These are features in the repository's development build. No npm version or GitHub Release has been published. Release notes and compatibility changes will be recorded here when a release is verified.
