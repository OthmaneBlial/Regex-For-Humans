# Changelog

## Unreleased

- Version the homepage stylesheet from its content during Pages builds so visual changes bypass cached CSS automatically; reject a build whose stylesheet reference is missing.

- Report malformed numeric exact counts and counts without an item as positioned `INVALID_REPETITION` errors with repair hints; recognize malformed second count tokens as `DUPLICATE_REPETITION`. Valid count syntax and matching stay unchanged.

- Show honest homepage loading and failure states, enable matching only after the compiler is ready, and keep static pattern copying available while the compiler loads or fails.

- Keep workshop copy feedback tied to the latest request even when the rules are unchanged, clear old confirmation on retry, and cancel clipboard timeout timers after completion.

- Report worker construction failures as rejected `WORKER_ERROR` promises, retain cancellation and recovery, and prevent extra payload fields from replacing the controller's request ID.

- Bound homepage clipboard requests to one second, clear previous confirmation when copying again, and ignore older copy results for the same recipe so they cannot replace newer feedback.

- Fix Entire string mode rejecting valid examples when a greedy count first returns a partial match; preserve first-match search results, partial-match explanations and worker timeouts.

- Version the homepage app, compiler entry and recipe request from the current app source and workshop build, so returning visitors receive compiler updates without a manual cache-version bump.

- Add an invoice ID shape recipe using `between 2 and 6 digits`, with accepted bounds, leading zeros and rejected case, Unicode digits and trailing text; link all seven recipes from the README and homepage.

- Add inclusive bounded counts with `between n and m <item>`, positioned diagnostics and explanations. New bounded instructions expose `repetition: { kind: "range", min, max }`; existing instructions retain their metadata and behavior.

- Show shared recipe notes in the workshop and homepage, including date, version and color validation limits; clarify that the line recipe accepts four or more trailing digits.

- Clear homepage copy confirmations when switching demo recipes and ignore clipboard results for a previous recipe.

- Treat an empty workshop editor as a neutral input prompt for examples, while keeping malformed and over-limit rules in the error state.

- Include the changelog, security policy and license beside the static workshop README, and verify documentation links in every web build.

- Keep homepage copy controls responsive while optional demo recipes are still downloading.

- Redesign the README, homepage and workshop with a colorful, playful visual style, a locally hosted display font, six recipe links, and a live homepage demo using the shared compiler.

- Disable repository GitHub Actions, remove automatic CI, and provide `npm run verify` for the full local quality gate.

- Added `hex digit` and `hex digits` for ASCII hexadecimal characters, with exact counts, explanations and a shorter hex-color recipe.
- Repeated copies now restart the Copied feedback timer so an older copy cannot clear a newer confirmation.
- The isolated example worker now rejects non-string flags instead of coercing an array such as `["u"]` into a valid flag string.
- The JavaScript API now rejects `flags: null` as `UNSUPPORTED_FLAGS`, consistently with other non-string flag values; omitted and undefined flags keep their defaults.
- Editing rules, changing flags or choosing a recipe now immediately clears the previous pattern's Copied feedback.
- Switching workshop recipes now starts one example-testing worker instead of briefly starting and cancelling a worker for the previous pattern.
- Package verification now runs the npm-installed CLI command shim in its clean consumer using offline `npm exec`.
- Added a hex-color recipe that teaches exact character-list repetition and accepts only six-digit `#RRGGBB` notation.
- CLI stdout write failures now use the regular diagnostic format, including JSON errors; failed stderr writes preserve a nonzero exit status.
- Long rule diagnostics now wrap within the workshop viewport.
- Workshop compilation errors now offer a Go to error button that focuses the reported source position and works from the keyboard.
- Links to screenshots, contributing instructions and the roadmap now resolve from the installed npm package. Package verification checks installed documentation links.
- Added a version-shape recipe using one-or-more digits and literal dots, with explicit examples and Semantic Versioning limits. Recipe numbering now follows the loaded fixtures.
- Recipe loading failures now appear beside the recipes without clearing compiler diagnostics or preventing manual editing and testing.
- Recipes that finish loading after editing no longer overwrite rules, flags or examples already entered.
- Clipboard fallback restores keyboard focus and still selects the generated pattern for manual copying when access is blocked.
- CLI input now requires valid UTF-8, rejecting malformed files and stdin without silently changing literal values.
- Removing an example keeps keyboard focus on the next example, the last remaining example, or the Add example button.
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
