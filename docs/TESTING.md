# Testing and compatibility

GitHub Actions is disabled for this repository. All current quality checks run locally with `npm run verify`; pushes and pull requests do not trigger CI. The compatibility evidence below is historical, not a check of the latest commit.

The latest full local verification passed at source commit `8051e0d` on 1 October 2026 under Node 22.0.0/npm 10.9.9 and Node 25.9.0/npm 11.12.1. Both runs passed 127 Node tests, 166 desktop/mobile Chromium workshop tests, 2 Firefox/WebKit compatibility smoke tests, 50 homepage tests, a clean consumer package install, and `npm audit` with zero vulnerabilities. These runs cover Node 22 on macOS; the older hosted multi-platform results below remain historical. See [DISTRIBUTION.md](DISTRIBUTION.md) for the deployment record.

The package declares Node.js `>=22`. These results passed on 28 September 2026:

| Node version | Verification |
| --- | --- |
| 22.x | [GitHub Actions run `36364750202`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/36364750202) |
| 24.x | [GitHub Actions run `36364750202`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/36364750202), Linux, macOS and Windows |
| 25.9.0 | Local checks, 61 Node tests, package and strict TypeScript consumer verification; desktop/mobile recipe regression |

These results verify the three versions shown, not every possible Node release accepted by the package's engine range. GitHub Actions [run `36364750202`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/36364750202) passed on commit `bcc732c`: 61 Node tests across Linux Node 22/24, macOS and Windows Node 24, 46 browser tests on Linux Chromium, and `npm audit --audit-level=moderate` on Linux Node 24. Its tested `npm-package-tested` artifact was downloaded; the tarball SHA-256 is `b3319a3f61ec03af27317b5b2ceb7e89a26dfbc6574690966b37f5c2fc82366f`. Disposable draft [PR #1](https://github.com/OthmaneBlial/Regex-For-Humans/pull/1) confirmed that invalid syntax fails `npm run check` on a real pull-request run, then was closed without merging. The automated accessibility tests do not replace a real screen reader session.

Documentation-link regressions use a temporary documentation tree to verify that malformed URL escapes and missing targets are reported together with their source file and link. Repairing the links restores success. Optional link titles in double quotes, single quotes or parentheses are separated from the destination, including title punctuation and encoded-space filenames. Missing targets and malformed escapes still report the destination rather than the title. Queries and fragments are removed before decoding the file path, preserving encoded filename characters such as `%23`; query-only references stay on the current page. Relative paths, encoded spaces, external links and the optional pull-request template retain their existing behavior.

## Reproduce locally

From a fresh checkout with a supported Node, npm and installed Google Chrome:

```sh
npm ci
npm run verify
```

The full gate also runs one editor-and-matching smoke test in Firefox and WebKit. Install those engines first:

```sh
npm exec -- playwright install firefox webkit
```

To repeat the full verification at the declared Node 22.0 minimum on macOS:

```sh
npm exec --yes --package=node@22.0.0 --package=npm@10 -- sh -c 'node --version && npm --version && npm run verify'
```

For bundled Playwright Chromium, install and select it explicitly:

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

Run `npm ci` first on a fresh checkout. `CI=1` selects Chromium and one test worker locally; it does not enable GitHub Actions. Use the same prefix for individual browser commands: `CI=1 npm run test:browser` and `CI=1 npm run test:site`.

Or run the individual checks:

```sh
npm run check
npm test
npm run build
npm run test:package
npm run test:browser
npm run test:site
npm audit --audit-level=moderate
npm pack --dry-run --json
```

`npm run check` runs Biome format/lint/import checks and `tsc --noEmit`. Strict JavaScript type checking covers `index.js`, `src/`, the CLI in `bin/`, the browser UI in `web/app.js`, and the isolated worker files `web/test-runner.js` and `web/match-worker.js`, which share the contract in `web/worker-protocol.d.ts`. The declaration ships with the static workshop. Build scripts remain outside the TypeScript check; build and browser tests cover the workshop. The package tarball must contain only the runtime library, CLI, license, README and published docs; `npm pack --dry-run --json` lists its exact contents.

`npm run test:package` packs the current checkout, installs that exact tarball into a new temporary consumer, then checks installed documentation links, package import, matching, trace, diagnostics, TypeScript declarations, the optional modifier's zero-to-one matches and range metadata, the installed CLI link, version and JSON output. CLI checks use offline `npm exec` to run the command shim created by npm, including the Windows `.cmd` shim, without permitting another package installation. It removes the temporary consumer afterward. Set `PACK_OUTPUT_DIR=artifacts npm run test:package` locally to retain the exact tested tarball. A retained tarball is not an npm publication or GitHub Release.

Node tests cover the public API, parser diagnostics, every instruction and repetition form listed in [LANGUAGE.md](LANGUAGE.md), the README's lead demo and optional shortcut against compiler output, literal/character-set escaping with deterministic Unicode samples, 519 seeded arbitrary-rule cases, CLI use from files/stdin, and the isolated worker runner. Bounded-count checks include zero and equal bounds, both limits, Unicode literal units, inclusive matching and positioned malformed-range errors. The arbitrary-rule check verifies deterministic compilation, valid regex output, contiguous source spans, and positioned `CompileError` failures. Browser tests cover all recipe fixtures, build-versioned asset URLs, editing and recovery, examples, clipboard, keyboard flow, the local syntax guide and visible build version, reduced-motion preferences, automated WCAG A/AA checks, oversized and HTML-like input, worker timeout/recovery for pathological and compiler-generated bounded expressions, and expanded Unicode-escaped regex source.

Local-server regressions start temporary static roots on operating-system-assigned ports. They verify the reported loopback URL, index and nested asset responses, MIME types, `nosniff` and missing-file status. Directory URLs receive a `308` redirect before serving their index, preserving encoded Unicode/space paths and query strings for GET and HEAD. Following the redirect keeps relative assets under the directory; missing paths and indexes still return `404`. Temporary directory links verify that a symlinked root and in-root targets remain usable, while outside targets and encoded traversal return `403` without file content. Each test stops its server and removes its temporary files.

Whitespace-sequence checks cover the `spaces` default, exact and bounded overrides including zero, representative JavaScript Unicode whitespace and rejected lookalikes under all option flags. A quoted ordinary space remains distinct from whitespace. Parser and CLI checks reject misplaced counts with a repair hint; workshop checks cover tabs and newlines, empty-input bounds, diagnostics, recovery and copied output. The clean consumer verifies the installed sequence, explanation and count behavior.

Mixed-anchor regressions retain the error code, message and end-anchor location through indentation, compact prefixes, keyword case and alternate line separators. CLI text and JSON checks verify the compatible-pair hint and both repairs. Browser checks navigate to the error, repair each anchor mode, verify the generated flags and distinguish whole-input matching from line Search mode. The clean consumer checks the installed diagnostic and line-mode repair.

Empty-literal regressions preserve the diagnostic code and opening-quote location through indentation, anchors, counts and ranges, while checking the whole-input-anchor repair hint. CLI checks cover exact plain and JSON diagnostics and the repaired empty-only pattern. Browser checks navigate to the quote, repair the rules, match empty input and reject a newline. Quoted spaces and empty character-list items retain their existing behavior.

Malformed UTF-8 checks cover invalid continuation bytes, overlong encodings, encoded surrogates, out-of-range code points and an incomplete final sequence in files and stdin. Plain and JSON failures include the same message explaining how to save the rules as UTF-8 with empty stdout and exit status 1; JSON retains `CLI_ERROR`. Resaving valid UTF-8 succeeds from both input paths, including a real replacement character and a leading BOM. The clean consumer also checks the installed CLI diagnostic.

The CLI help check extracts the rules from its displayed POSIX-shell example and passes them to the real CLI's stdin, verifying the documented regex output. It also checks help's successful status, empty stderr and the documented exit-code meanings. Existing argument, rule, UTF-8 and stream-error checks exercise the corresponding failure statuses.

A second seeded check compiles 516 valid Unicode data sets as anchored literals, bounded repeated literals and positive/negative character lists. It compares matching against string equality, repetition counts with unchanged code-point boundaries and single-code-point membership after transporting regex source through UTF-8. Fixed boundary sets include regex punctuation, control characters, direction controls, line separators, astral characters and separate surrogate items. A focused surrogate regression also checks that joining copies can form a new astral character and change the sequence matched by Unicode repetition. This verifies successful escaping independently of the arbitrary-rule rejection checks; it does not establish matching performance on arbitrary inputs.

A temporary static-build regression links modules, HTML, CSS, documentation and recipe data to original files outside its fixture project. It then replaces nested web, source and documentation folders with directory links and builds again. Both builds must produce regular copied files and directories, preserve identical asset versions for identical content, and leave the original targets unchanged. Versioned module and HTML references are checked. This case skips on Windows only if the OS denies file-symlink creation.

Entire-string regressions verify that a partial greedy match can backtrack to cover the full example, while search mode retains the first match. They include overlapping repeated literals, zero counts, upper bounds, final newlines and line-mode suffix matches. The worker timeout check also covers expensive backtracking introduced by retrying a partial match against the whole input.

Worker-controller regressions cover startup failures as rejected `WORKER_ERROR` promises, cancellation of a previous run, recovery and request-ID ownership. Real-worker browser checks verify that extra top-level payload IDs do not cause false timeouts and that example IDs remain intact.

Time-shape recipe checks cover all 10,000 two-digit hour/minute combinations, including out-of-range clock values, plus rejected widths, separators, suffixes, whitespace and non-ASCII digits. Shared fixture checks exercise the public API, CLI and browser. The workshop regression verifies the visible range-validation reminder, copied pattern and an editable one-or-two-digit hour count with a corrected example expectation.

Count-diagnostic regressions cover signed, fractional, scientific, hexadecimal, separated and localized numeric tokens in exact and bounded forms, missing items and duplicate tokens. They preserve zero, leading zeros, the upper limit and numeric characters used as quoted or character-list data. CLI checks verify structured errors, exit status and repair hints; workshop checks verify disabled copy, error-token focus and recovery.

Quote-style regressions cover single quotes, backticks and opening/closing smart quotes after anchors and counts, and in positive/negative lists and text exclusions. They verify unchanged error codes and UTF-16 locations, the JSON quote repair hint, valid quote data, and correctly quoted multi-character list errors without that hint. CLI text/JSON, installed-package checks and keyboard error-jump/recovery checks exercise the shared behavior.

Quoted-value regressions retain trailing spaces, nonbreaking spaces and em spaces when locating a missing closing quote, and detect trailing raw control characters at their original positions. They cover literals, character lists, exclusions, anchors, exact and bounded counts, and UTF-16 columns after emoji. Valid closed values still ignore outside whitespace and preserve their matching data and trace metadata. CLI text/JSON, installed-package diagnostics and the workshop's keyboard error jump use the same locations.

Letter-rule checks cover singular and plural defaults, exact and bounded counts, every ASCII code point under all supported option-flag combinations, and representative non-ASCII letters. Unicode case-folding checks preserve JavaScript's `iu` matches for `K` and `ſ` and the accompanying explanation. CLI, clean-consumer and workshop checks verify the same source, count metadata, positioned errors and recovery; the rendered syntax guide includes the ASCII limits.

Control-display regressions cover all twelve `Bidi_Control` code points and all thirty-two C1 values in literals, exact counts and positive/negative character lists under every supported option-flag combination. Source and explanation escapes remain visible while matching, source positions and original metadata are preserved. CLI checks cover plain/explained output, JSON round trips, usage arguments and file errors. Workshop checks cover trace selection, copied regexes, full/search feedback and diagnostics without changing editor or example values. Separate line-separator checks preserve braced regex source and show visible escapes in explanations and match feedback. The clean-consumer check verifies the installed library and CLI display policy.

CLI terminal-output checks cover all C0/C1 controls, DEL and Unicode line separators in regexes and explanations, plus the non-NUL values in unknown options and missing filenames. They verify visible escapes, original matching and decoded JSON data, unchanged exit codes, and ordinary quotes, backslashes and emoji.

Workshop clipboard regressions cover overlapping requests for unchanged rules in both success/failure orders, ignore outdated replies before attempting the legacy fallback, and retain the latest confirmation timer. A stalled request clears previous confirmation, reaches the manual-copy fallback after one second, preserves keyboard focus and allows a later successful retry. Rule edits still protect newer diagnostics from old copy results.

`npm run build:pages` versions the homepage app from its source and the workshop build fingerprint. Its compiler entry and recipe request follow that version, so changes to the homepage or compiler do not reuse an obsolete cached module. The homepage stylesheet has its own content version, so CSS edits invalidate its URL automatically. A temporary build regression verifies stable unchanged URLs, changes to each input, independent app/style versions, and explicit failures for an unversioned workshop or missing stylesheet reference. A browser regression serves an obsolete stylesheet for outdated URLs and verifies that the homepage requests the current stylesheet and renders its intended background.

Homepage startup regressions hold the app or compiler response and verify neutral output until matching is ready. Copy controls become available when their handlers are installed, independently of compiler loading. A failed compiler leaves static rules, clipboard controls and workshop links available, reports an unavailable demo without an uncaught error, and recovers on reload. A JavaScript-disabled check verifies the static patterns and manual-copy explanation.

Homepage clipboard failures select the requested rules or regex for manual copying when focus has not moved. Keyboard regressions cover unavailable and rejected clipboard access, preserve button focus, verify the complete selection through the native copy event and avoid changing the system clipboard. The timeout check also verifies selection and focus before a successful retry.

Delayed clipboard rejection and timeout checks on both pages move focus to an example input before the request fails. Its value and selected range stay intact, focus stays on the field and the workshop skips its legacy copy helper. Returning to Copy allows a successful retry.

Homepage length checks use a version-shaped value whose 80-unit prefix matches while its complete 83-unit value does not. Native insertion keeps the whole value and reports the demo limit instead of testing that prefix. Exact boundaries, astral emoji, repair and recipe changes preserve valid matching; error descriptions, 320px layout and automated WCAG A/AA checks cover the invalid state.

Workshop startup regressions hold the app module while rules and options are entered. The app preserves those values, compiles them before loading recipes, and enables adding examples only after its handler is installed. Empty and whitespace-only edits stay neutral; invalid pretyped rules get diagnostics even if recipes fail. Explicit recipe selection still restores its defaults, and edits made while the recipe request is pending remain protected. With JavaScript disabled, both workshop entry pages show an explanation and open the static syntax guide from the keyboard without missing assets or overflow at desktop, mobile and 320px widths.

The numbered example-label check holds the recipe response, confirms the initial empty state, then releases the response and waits for the complete accessible-label snapshot. It verifies every label without racing asynchronous recipe rendering.

Each recipe's trace buttons use the shared compiler's complete explanations in their accessible names, followed by the source-selection instruction. Exact-name checks cover anchors, literals, shorthands and repetition without duplicate punctuation.

Match-mode guidance is visible and describes the focused selector. Browser checks verify whole-string rejection and first-match search positions after an astral emoji and combining mark, position zero, empty search matches, and empty-input full matches. They retain the same accessible description after mode and input changes.

Example fields describe their current result and input limits, including how a blank field tests an empty string; expected-result selectors describe the same feedback. Browser accessibility checks verify this guidance while rules are invalid or empty, and retain it through matching, no match, changes to expected outcomes, partial matches, Search mode, recipe replacement and row changes. Oversized-input checks verify both controls' descriptions during the error and after repair. These checks cover browser-computed accessible descriptions; a real screen-reader session remains unverified.

Filename-shape checks exercise stem lengths from zero through sixty-five with ASCII, accented and astral characters under every supported option-flag combination. Excluded separators, NUL and line breaks stay rejected with dot-all enabled; Ignore case permits the uppercase extension. Browser checks cover the emoji length boundary, changing the extension, copied output and restoring the shared examples. Shared browser fixtures account for native textarea normalization of CR and CRLF to LF; the original CR example is also checked by the library and CLI. A browser regression compares the strings sent to the worker with every displayed field, checks literal-newline matching after CR normalization, and repeats the check after adding/removing rows and selecting the recipe again. A fixture response adds a CRLF example to cover both native conversions. The recipe explicitly permits dots, spaces and punctuation and leaves filesystem validity to separate checks.

Phone-shape checks cover the optional plus and every digit count from zero through sixteen, including prefixed and unprefixed inputs. Browser checks require the plus by editing its lower bound, correct example expectations, copy the changed regex and restore the recipe. Shared fixtures also run through the CLI, library and both workshop viewport sizes.

Example-limit checks verify visible count and length instructions and each field's accessible description after loading, adding and removing examples. Native text insertion preserves oversized ASCII and emoji values instead of truncating them; invalid fields describe their errors, no oversized request reaches a worker, and a pending valid request is cancelled without a later timeout replacing the field error. Adding or removing another example preserves the original value. Shortening or removing an oversized example resumes testing. The boundary uses UTF-16 units, so 1,024 astral emoji are accepted and 1,025 are too long. Automated WCAG A/AA checks also cover the oversized-input state.

Text entry regressions verify the spelling, completion, capitalization and correction attributes on the rule editor, recipe examples, added examples and homepage demo. Keyboard input preserves literal punctuation and case; changing case changes the matching result. Desktop and mobile browser automation checks these attributes and input handling. Physical keyboard behavior is unverified; browsers and input methods can override [autocapitalization hints](https://html.spec.whatwg.org/multipage/interaction.html#autocapitalization).

Long literal trace checks cover 4,096-character values and rules at the input-length limit. Explanations wrap without horizontal trace or page overflow at desktop, mobile and 320px widths. Focused trace buttons retain visible side outlines inside the scroller. The regex output remains intact, and keyboard activation of its trace button selects the entire original source line.

Source-navigation regressions first move the caret away from the target. Error jumps reveal the final instruction in a 200-line editor and invalid escapes near the end of a wrapped literal. Trace buttons reveal middle and final lines after a wrapped literal, then return to the first line. Desktop, mobile and 320px checks verify the selected offsets, visible target row, unchanged rules and removal of the temporary hidden measurement textarea.

Page-viewport regressions check both error and trace destinations in normal and 1,200px-tall editors at desktop, mobile and 320px widths. They verify the selected offsets, retained focus and unchanged source, then check that the target row's top and bottom are inside the browser viewport. This catches a selected row that is visible inside the textarea but offscreen on the page.

Native-resize checks drag Chrome's textarea grip with a pointer at desktop, mobile-sized and 320px layouts. They verify visible enlargement, retained source and regex output, an enlarged editor after edits and recipe changes, and shrinking back while respecting the CSS minimum. The editor width and page width remain unchanged.

Example-resize checks give identical multiline examples different heights, then add and remove rows. Heights follow each surviving example while labels and focus update; newly added examples and recipes retain their default heights.

Generated-output keyboard checks cover short and horizontally clipped patterns at desktop, mobile and 320px widths. Tab focuses the named regex region with a visible outline, Right Arrow scrolls clipped source, and the next Tab reaches Copy. Enter copies the entire pattern and keeps focus on the button. Separate focus checks use computed colors and axe's color helpers to verify at least 3:1 outline contrast around output, copy, trace and diagnostic controls, following the [non-text contrast requirement](https://www.w3.org/WAI/WCAG22/understanding/non-text-contrast.html).

`npm run test:site` builds and serves the complete `site/` directory. It verifies the homepage demo against the shared compiler, an obsolete cached compiler response, shared recipe notes, clipboard text and feedback after recipe changes, one-second clipboard timeout and recovery, overlapping copy requests for the same recipe, recipe navigation, recipe-load recovery, copied documentation, local assets, reduced-motion preferences, 320px layout, and automated WCAG A/AA checks at desktop and mobile sizes. Fake-clock regressions exercise delayed resolve/reject responses and confirm that older clipboard operations cannot replace the latest copy confirmation.

Counted-sequence repair regressions cover exact and bounded counts, positioned parser and CLI diagnostics, Unicode length bounds, exclusions and dot-all behavior, and workshop recovery with copy availability restored.

Trailing-comma regressions verify the separator’s UTF-16 position through list kinds, indentation, counts, compact anchors, alternate line separators and trailing whitespace. CLI text and JSON retain the diagnostic code and message; the clean consumer checks the installed separator position. Browser checks select and delete only the comma, preserve quoted emoji and comma data, and restore valid output and copy availability.
