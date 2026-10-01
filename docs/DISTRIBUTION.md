# Distribution decision record

## Local verification

**Latest full local verification (1 October 2026):** `npm run verify` passed at source commit `19c3b25` on Node 25.9.0/npm 11.12.1, with Biome 2.5.15: 181 Node tests, 222 desktop/mobile Chromium workshop tests, 2 Firefox/WebKit compatibility smoke tests, 58 homepage tests, a clean consumer package installation (74,761-byte tarball), and `npm audit` with zero vulnerabilities. This includes reverse translation of equivalent path exclusion classes. The 13 focused path and complex-example tests also passed on Node 22.23.3. Earlier full runs passed at `55be6da` and `a2dfe34` on Node 25.9.0/npm 11.12.1, at `4d35165` on Node 22.23.3/npm 11.12.1 and at `f4febbe` and `d91edbd` on Node 25.9.0/npm 11.12.1. These runs verify macOS only; see [TESTING.md](TESTING.md) for historical compatibility evidence.

### Preview server

The missing-path preview server fix at `e111b9c` passed the full gate above, and all five HTTP server tests passed separately on Node 22.23.3. URLs that try to enter a file as a directory return `404` for GET and HEAD, including encoded separators and query strings. Bodies stay empty with no redirect; malformed URL escapes retain `400`, and valid assets still load after errors. This is local server evidence rather than a change to the GitHub Pages server.

The earlier full run also covers case-insensitive content-type lookup in the local preview server. Its four HTTP regressions passed separately on Node 22.23.3; desktop/mobile Chrome fixtures verified that uppercase JavaScript modules and mixed-case stylesheets now load and affect the page. Unknown extensions retain their binary fallback, with exact GET content, empty HEAD bodies and `nosniff` preserved. This is local preview evidence rather than a change to the GitHub Pages server.

The earlier local preview server fix at `5a9772c` passed `npm run check`, all 164 Node tests, `npm run build:pages` and a clean-consumer package installation (61,441-byte tarball) on Node 25.9.0/npm 11.12.1. Its three HTTP server regressions also passed on Node 22.23.3. This focused tooling run verifies root-directory links and outside-target rejection; the complete browser snapshot remains the full run above.

## Hosted development preview

The development site and workshop are live at [othmaneblial.github.io/Regex-For-Humans](https://othmaneblial.github.io/Regex-For-Humans/).

### Equivalent path exclusions

Equivalent path-class translation was synchronized into the existing project folder at Pages commit `019c2f9`, whose build completed on 1 October 2026. Live desktop/mobile checks imported the served API and translated three ordinary, reordered/duplicated and padded-escape spellings across all eight supported flag combinations. All 432 native match-array/index comparisons per viewport agreed with rebuilt regexes; flags and input `lastIndex` stayed unchanged. Each spelling also produced the readable rule through the actual workshop, with correct focus, friendly explanation, Unicode matching and separator rejection. An unsupported capture still preserved the current rules. There was no overflow at 320px or page error. Eleven served website, workshop, translator and documentation files returned HTTP 200 and matched local SHA-256 values. All four complex examples also compiled, explained and translated correctly on the live site, with 34 browser-compatible input cases per viewport and captured-group rejection preserved.

### Complex examples and readable paths

Four complete format examples and the readable path rule were synchronized into the existing project folder at Pages commit `35cd517`, whose build completed on 1 October 2026. Live desktop/mobile checks compiled every example, verified its explanation fragments and translated it back through Ctrl + Enter with correct focus. All 34 browser-compatible accepted/rejected cases per viewport passed; the exact CRLF rejection remains covered by Node because textareas normalize line endings. Named captures still reported their unsupported-feature diagnostic through Meta + Enter. The simplified filename recipe showed the readable rule and friendly explanation, accepted a Unicode filename and rejected a slash separator. Nine served website, workshop and documentation files returned HTTP 200 and matched local SHA-256 values.

### Leading-zero Unicode escapes

Leading-zero code-point escapes were synchronized into the existing project folder at Pages commit `fef01d1`, whose build completed on 1 October 2026. Live desktop/mobile checks translated 48 frozen local/iframe regexes per viewport across eight supported flag combinations, using padded escapes in literals, character lists and repeated emoji groups. Their throwing metadata/protocol getters and matching methods were never called, and `lastIndex` stayed unchanged. All 480 native match text/index comparisons per viewport agreed with rebuilt regexes; eight unsupported-input diagnostics and four non-RegExp/lookalike rejections remained correct. An unsupported capture after a padded emoji escape selected the opening parenthesis through keyboard navigation; a repaired padded literal group focused the editor and matched correctly. The parent workshop output stayed unchanged, with no overflow at 320px or page errors. The served translator, README, language contract, testing guide, changelog and syntax guide returned HTTP 200 and matched local SHA-256 values.

### Matching protocol getters

Earlier matching-protocol bypass was synchronized into the existing project folder at Pages commit `54eb337`, whose build completed on 1 October 2026. Live desktop/mobile checks translated 48 frozen local/iframe regexes per viewport with throwing metadata getters, matching methods and `Symbol.match` getters across all eight supported flag combinations. Each translation retained the native pattern and flags without calling those overrides or changing `lastIndex`; 384 native match text/index comparisons per viewport agreed with rebuilt regexes. Subclass overrides preserved eight unsupported-input diagnostics, and four non-RegExp/lookalike inputs were rejected. The parent workshop output stayed unchanged; reverse-error keyboard navigation and a supported repair retained correct focus and matching. There was no overflow at 320px or page error. The served translator, README, language contract, testing guide and changelog returned HTTP 200 and matched local SHA-256 values.

### Native regex metadata

Earlier stored native regex metadata was synchronized into the existing project folder at Pages commit `166444f`, whose build completed on 1 October 2026. Live desktop/mobile checks translated 48 local/iframe regexes with throwing metadata getters and matching methods across eight supported flag combinations. Frozen inputs kept their `lastIndex`; 384 native match text/index comparisons per viewport agreed with rebuilt regexes. Subclass source overrides did not replace the stored pattern, eight overridden-input diagnostics retained their codes and four non-RegExp/lookalike inputs were rejected. The parent workshop output stayed unchanged; reverse-error keyboard navigation, repair, focus and case-insensitive matching still worked. There was no overflow at 320px or page error. The served translator, README, language contract, testing guide and changelog returned HTTP 200 and matched local SHA-256 values.

### Cross-context regexes

Earlier cross-context RegExp acceptance was synchronized into the existing project folder at Pages commit `44398fb`, whose build completed on 1 October 2026. Live desktop/mobile checks imported the served API and translated 24 genuine iframe regexes per viewport across eight supported flag combinations. Their rules and flags matched same-context translations; 192 native match text/index comparisons per viewport agreed with rebuilt regexes. Translation preserved `lastIndex`, rejected four non-RegExp/lookalike inputs and left the parent workshop output unchanged. Reverse-error keyboard navigation and supported repair still worked; the page had no overflow at 320px or page errors. The served translator, README, language contract, testing guide and changelog returned HTTP 200 and matched local SHA-256 values.

### Reverse error navigation

Earlier reverse-error navigation was synchronized into the existing Regex-For-Humans folder at Pages commit `32a72d5`, whose build completed on 1 October 2026. Live desktop/mobile keyboard checks verified selection at six unsupported syntax errors: alternation, named captures, nested lookahead, ranges and lazy quantifiers, including emoji, leading whitespace and native CRLF normalization. A long wrapped pattern scrolled within its field, and a field enlarged to 1,400px revealed the selected row in the page viewport. Each syntax error preserved edited rules, i/s options and the copied regex. Edits removed the stale action; malformed literals, flag errors and whole-translation limits kept explanatory feedback. A supported repair cleared the invalid state, focused the editor and matched correctly. The served workshop HTML, app module and stylesheet matched their local SHA-256 values. Desktop/mobile screenshots of the error control were inspected. The page had no horizontal overflow at 320px and no page errors. The syntax guide, README and language contract returned HTTP 200 and matched their local content hashes.

### Earlier workshop checks

Earlier live checks verified precise group diagnostics at `24d379b`, empty groups at `9a715a4`, repeated-list explanations at `a2024cc`, alternation diagnostics at `ace0da8`, literal hyphens at `845bcff`, control-letter support at `7de2793`, equivalent ASCII range orders at `6219331`, reverse-input validation states at `5c6c751`, startup readiness at `54c91fb`, regex-literal line-break validation at `55c45cd`, both reverse-output limits at `8e60b91`, Unicode reverse translation and incomplete repetition repairs; local browser tests covered all 14 recipes.

This is a checked development deployment, not a stable release.

## Registry and release status

On 1 October 2026, the public npm registry returned 404 for `regex-for-humans`, and the GitHub tags and releases APIs returned empty lists. GitHub Actions was disabled. This records the checked state only; it does not reserve the npm name. The package remains `0.1.0-dev` and requires Node.js rather than providing a standalone executable. Recheck external publication state before a release.

The target release route is a versioned npm package containing the library and `regex-for-humans` CLI, plus the static browser workshop. The current hosted site is a development preview, not a stable release. The package requires Node.js 22 or newer. GitHub Actions is disabled for this repository. Local verification can preserve the exact tested tarball with `PACK_OUTPUT_DIR=artifacts npm run test:package`; that tarball is not a substitute for a published registry version.

## Standalone binary decision

No standalone OS executable is planned for the first release. The present product is a small JavaScript CLI and library, and there is no measured evidence yet that its target users need a bundled Node runtime. Maintaining separate Windows, macOS and Linux executables would add build, signature, platform smoke-test and update obligations. This is a provisional decision pending the three new-user sessions in [USABILITY-STUDY.md](USABILITY-STUDY.md). Ask whether Node installation is a practical barrier, which OS/architecture is involved, and whether a browser-only or npm route meets the need. Record the observations before closing roadmap task 5.3.

If those sessions show a concrete standalone need, select a maintained packaging tool, build and verify each claimed OS/architecture, smoke the exact downloadable files on each target, and publish SHA-256 checksums with the release. Do not link a binary that has not been built and verified. If the no-binary decision holds, state it explicitly in the release notes and keep the Node/npm and browser routes prominent.
