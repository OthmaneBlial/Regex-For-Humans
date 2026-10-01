# Changelog

## Unreleased

- Identify unsupported capturing groups, lookahead and lookbehind with distinct reverse-translation messages at their opening parenthesis, preserving error codes, source columns and existing workshop data.

- Translate empty non-capturing groups and their supported greedy repetitions into zero-count rules, preserving empty matches, flags and surrounding atom boundaries.

- Preserve balanced and nested parentheses and Markdown punctuation escapes in documentation link destinations, keeping complete filenames and error reports.

- Recognize uppercase and mixed-case HTTP, HTTPS and mailto schemes in local Markdown checks, while retaining errors for Unicode lookalikes.

- Resolve angle-bracket Markdown link destinations in local documentation checks, including spaces, parentheses, optional titles and external URLs.

- Explain positive character lists repeated with `*` as membership instead of exclusion across the library, CLI and workshop, including reverse-translated rules.

- Report unsupported alternation at its pipe operator with a separate-alternative hint, including inside literal groups, while preserving literal pipes and anchor diagnostics.

- Translate literal hyphens at either end of simple character lists, preserving negation, repetition and matching while continuing to reject unsupported ranges.

- Translate ASCII control-letter escapes in literals, character lists and literal groups, preserving matching while displaying the controls as visible escapes.

- Extend the seeded Unicode corpus to verify deterministic reverse translation, matching, positions, flags and UTF-8 preservation across all supported flag combinations.

- Translate both ASCII letter range orders and all six hex range orders into the existing rules, preserving repetition, flags and matching while generating canonical class order.

- Expose reverse-translation errors through the regex field's invalid state, clearing stale validation feedback on edits and successful retries.

- Enable workshop reverse translation only after its handler loads, preserving pasted regexes and translated rules while startup and recipe requests finish.

- Reject physical line breaks inside workshop regex literals with an escape hint, preserving escaped newline matching and current editor data on failure.

- Distinguish oversized translated rules from oversized regex input, preserve limit codes and report the global translation error at the start of the regex with a repair hint.

- Diagnose incomplete unbounded repetition modifiers at their source position, with repair examples shared by the library, CLI and workshop.

- Bring the rendered syntax guide and architecture reference in line with reverse translation and all supported repetition forms.

- Preserve Unicode surrogate-pair atoms when reverse-translating repetition and character classes; keep separate surrogate atoms separate and reject literal groups whose boundaries cannot be expressed.

- Translate supported Unicode JavaScript regexes into editable rules in the library and workshop; add `zero or more`, `one or more` and `at least N` rule forms, and reject syntax that cannot be preserved.

- Add an IPv4 address-shape recipe with bounded ASCII octets and a visible 0–255 validation caveat.

- Add a branded 1200 × 630 share image and page-specific sharing metadata to the homepage, workshop and syntax guide.

- Add a shape-only MAC-address recipe that teaches exact hex pairs and literal separators.

- Add explicit ASCII lowercase and uppercase letter rules, with case-folding behavior explained when `i` is enabled.

- Reject noncanonical worker flags and malformed example IDs with stable errors before matching.

- Add `optional <item>` as a zero-to-one repetition modifier, with positioned diagnostics and phone-shape coverage.

- Tell users a blank example field tests an empty string, as visible guidance and in each field's accessible description.

- Traverse linked directories when scanning static-build assets, producing independent output copies without rewriting original files or changing versions for identical content.

- Locate trailing character-list comma errors at the separator itself so workshop error navigation selects the character to remove.

- Check documentation link destinations independently of optional titles, keeping query handling, encoded filenames and actionable missing-link diagnostics.

- Redirect local preview directory URLs to their trailing-slash form, preserving encoded paths and query strings while retaining symlink confinement and missing-file behavior.

- Explain match modes, empty search matches and zero-based UTF-16 result positions beside the workshop examples and in the mode selector’s accessible description.

- Suggest countable character rules when a count or range is applied to an existing text sequence, preserving its diagnostic code and location.

- Suggest compatible input or line anchor pairs when mixed anchors are rejected, preserving the diagnostic code and end-anchor location.

- Explain how to repair malformed UTF-8 in CLI file and stdin input, preserving `CLI_ERROR`, exit status and rejection of invalid bytes.

- Keep example data synchronized with native textarea newline normalization so the worker tests the text actually displayed, including after recipe and row changes.

- Check local documentation links against their file path without query strings or fragments, while preserving encoded filename characters and complete failure messages.

- Add `spaces` for one or more JavaScript whitespace characters, with count overrides, explicit line-break explanations and positioned unsupported-syntax diagnostics.

- Add a text-filename shape recipe teaching bounded Unicode character exclusions and an editable extension, with explicit filesystem-validation limits.

- Report malformed URL escapes alongside missing documentation links instead of stopping the local documentation check with an uncaught error.

- Suggest whole-input anchors when an empty literal is rejected, preserving its error code and quote location; verify repair through the parser, CLI and workshop.

- Describe each example's match feedback on its expected-result selector, including focused expectation changes, rule repairs and input-length errors.

- Align the release preflight with local artifact verification and the existing owner Pages deployment, keeping source-repository GitHub Actions disabled.

- Add a runnable first-use example and exit-code meanings to CLI help, with a regression that compiles the displayed rules.

- Add seeded valid-data checks for literal and character-list escaping, bounded literal repetition and exact matching after UTF-8 transport; document how joining lone surrogates changes Unicode repetition boundaries.

- Include each example's current match feedback in its accessible description, alongside input limits, including after edits, rule repairs and row changes.

- Add a phone-number shape recipe teaching an optional plus and 7–15 ASCII digits, with explicit limits on what matching proves.

- Preserve each example field's native resized height when adding or removing other examples; fresh examples and recipes use their default heights.

- Allow native rule-editor enlargement by retaining its requested height in the flex layout, including after edits and recipe changes.

- Reveal error and trace destinations in the page viewport as well as inside the workshop editor, including stacked mobile layouts and editors taller than the window.

- Add an HH:MM time-shape recipe with ASCII digits, whole-input anchors and explicit examples of out-of-range clock values that still match.

- Scroll the workshop editor to the selected start when navigating to an error or trace rule, including wrapped literals and a caret moved elsewhere.

- Suggest JSON double quotes for unsupported single, backtick and smart quote delimiters in literals and character lists, preserving error codes, locations and valid quote characters used as matching data.

- Validate quoted values against their original source line so trailing whitespace does not hide control characters or move missing-quote diagnostics away from the actual line end.

- Preserve newly focused inputs and selected text when a delayed homepage or workshop clipboard request fails or times out.

- Select the requested homepage snippet for keyboard copying when clipboard access is missing, blocked or stalled, while retaining button focus and ignoring outdated requests.

- Preserve oversized homepage demo input and report its visible 80-unit limit before matching, instead of testing a silently truncated prefix.

- Preserve oversized workshop examples instead of truncating pasted text; show accessible field errors and stop matching until they are shortened or removed, while retaining the worker's input limit.

- Expose C1 controls in compiled regex source and show controls and line separators in explanations, diagnostics, trace text and match feedback, using the same display policy as the CLI.

- Keep each trace button's accessible name consistent with the compiler's explanation, without adding duplicate punctuation.

- Escape terminal control characters and Unicode line separators in CLI results, explanations and errors while preserving matching, JSON data and diagnostic formatting.

- Show Unicode direction controls as visible escapes in generated regexes, explanations, diagnostics, trace text, CLI output and match feedback while preserving matching and original rule data.

- Show example count and length limits, including input truncation, and describe them for every example field.

- Keep result panel keyboard focus visible with brighter outlines and prevent clipping around trace buttons.

- Give the generated regex a named keyboard stop with visible focus and native horizontal scrolling.

- Wrap long literal explanations inside the trace viewport while keeping source selection available.

- Request literal text entry without spelling checks, completion, automatic capitalization or autocorrection in rules, examples and the homepage demo.

- Make the accessible-label regression wait for recipe rendering instead of racing its asynchronous response.

- Copy linked files into independent static-build outputs before versioning them, so building the workshop leaves their original targets unchanged.

- Reject local-server symlinks whose resolved targets escape the selected static root, while keeping in-root links and a symlinked root usable.

- Report the actual local development server port when port `0` lets the operating system choose one.

- Explain why the workshop cannot compile or test with JavaScript disabled, and link to its static syntax guide.

- Preserve workshop rules and options entered before its app loads, compile that initial content even if recipes fail, and enable adding examples only after the handler is ready.

- Add a shared username-shape recipe with an ASCII letter first and 3–16 total word characters; link it from the README and homepage, with explicit availability, service-policy and ignore-case limits.

- Add `letter` and `letters` for ASCII alphabetic characters, with exact/bounded counts, shared explanations and repair hints. Document and test JavaScript's Unicode case-folding equivalents when `i` is enabled.

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
