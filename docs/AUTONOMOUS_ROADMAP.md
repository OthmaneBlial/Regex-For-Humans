# Autonomous implementation progress

Mission source: the maintainer's 2026-10-10 autonomous mission. Implement, verify and push coherent changes directly to `main`, then continue. Preserve deterministic compilation and existing working behavior.

## Current wave: correctness and groups

- Implemented: AST-backed numbered/named/noncapturing blocks, nested blocks, whole-block repetition, Unicode capture names, opening-order numbering, empty/absent capture semantics, source spans, explanations and positioned diagnostics.
- Added: named/numbered references, resolved capture metadata, digit-boundary protection and missing/forward/open-reference diagnostics. All 233 Node tests, lint/types/docs and the clean package consumer pass. Group/reference workshop tests pass in desktop/mobile Chrome (4) and Firefox/WebKit (4); the 11 group/reference Node tests also pass on Node 22.23.3.
- Implemented: reverse translation of captures, composite/nested groups and backward references. The differential corpus checks native match/capture indices, empty/absent values, Unicode names, all supported flags, nested dot behavior and original-source reference diagnostics. Full local `npm run verify` passes: 238 Node tests, 282 desktop/mobile Chrome checks, 52 Firefox/WebKit checks, 62 homepage checks, clean installed-package verification, builds and zero audit vulnerabilities. All 16 dedicated group/reference/reverse tests also pass on Node 22.23.3.
- Validation: the 227-test Node suite plus the added group-anchor regression, lint/type checks, local documentation links and a clean installed-package JavaScript/TypeScript consumer pass. All 54 desktop/mobile group, security and accessibility browser checks pass.
- Limits: 64 nesting levels; 16,384 source units; 200 lines; repetition counts up to 1,000. Names are unique across the document.
- Distribution: groups, references and their reverse translation are included in the published `0.1.0-dev.4` preview. Exact archive and registry evidence is in [DISTRIBUTION.md](DISTRIBUTION.md).

## Next priorities

1. Lookarounds and lazy quantifiers across the same AST and both translation directions.
2. Structural visualization, safety heuristics with honest limits, flags/capability diagnostics and verified exports.
3. Workshop localization and the remaining mission waves.

## Site and README milestone

- Canonical README: capability matrix distinguishing npm/source, named field extraction, flags, CLI/API, FAQ, recipes and documentation map.
- Complete Chinese, Spanish, French, Brazilian Portuguese, Japanese, German and Hindi README guides: all 16 major sections, every recipe and all 20 code blocks. Code/command parity and return navigation are checked automatically. These translations are authored; independent native-speaker review remains unverified.
- Homepage: capture example with native field values, build/import/explain capabilities, copyable API/CLI snippets, eight language links and honest FAQ. Existing visual identity, recipes and browser-local behavior are preserved.
- Checks: all 241 Node tests, all 64 Chrome desktop/mobile site checks, lint/types, 252 local source-document links, builds and clean package installation pass. The 10 localization/link checks also pass on Node 22.23.3. Firefox/WebKit verify the new snippet copies, native fields and eight language links, with zero automated accessibility violations/page errors or overflow at 1280/390/320px. Seven desktop/mobile captures of the new sections were visually inspected.
- Publication: source `34b2b9b` is pushed to `main`; Pages commit `22245c6` built successfully on the existing `master` branch. All 56 served files match the local build by SHA-256, and the canonical homepage returns HTTP 200. Public Chrome desktop/mobile, Firefox and WebKit verify eight language links, four copy requests, 320px layout, capture/reference import and positive/negative worker matching with no page errors. npm remains unchanged at `0.1.0-dev.3`; publishing the site is a separate operation.

## Ordered alternatives and next npm preview

- Implemented: ordered `either { … }` branches in both directions, nested/sequence/empty choices, whole-choice repetition, capture/reference preservation and typed start/branch/end source trace segments. Each direct entry is one choice; a `group` block holds a sequence or an empty choice.
- Native parity: 30 patterns × eight supported flag combinations × 34 inputs compare full match arrays, named values and native capture indices. Shared browser checks add 936 comparisons per engine/viewport and verify capture participation, keyboard navigation and 320px layout.
- Verification: all components pass: 251 Node tests, 296 bundled Chromium desktop/mobile workshop checks, 66 Firefox/WebKit checks, 64 homepage checks, lint/types/docs, builds, a clean package consumer and zero audit vulnerabilities. All 26 focused Node 22 checks pass. The first full command found obsolete alternative-error fixtures; equivalent unsupported lookaheads retain the selection/scrolling/accessibility/recovery assertions. The subsequent command passed the compiler/workshop/compatibility stages and found stale homepage screenshot metadata. Correcting the image URL/dimensions and rerunning all 64 site checks plus audit completes the component gates; this is not one uninterrupted full-command pass.
- Publication: the maintainer's requested `0.1.0-dev.4` npm preview is published from annotated tag/source `af70291`, with both `preview` and `latest` updated. The exact 192,138-byte archive passes clean JavaScript/TypeScript consumers on Node 25 and Node 22 and matches npm/GitHub downloads. Public installations pass eighteen recipes, 704 comparisons and 36 CLI directions per runtime.
- Site/README: Pages commit `1dfaf1c` built successfully; all 58 public files match local hashes. Chrome desktop/mobile, Firefox and WebKit pass version, date capture, alternative/import and source-navigation checks without page errors or 320px overflow. The ten README guides and real screenshots reflect dev.4; actual Arabic/Urdu GitHub views retain RTL prose/tables and all 20 canonical LTR code blocks at 1280/390px. Independent language review remains open. This milestone does not close the larger mission, stable-release or human review gates.

## Evidence and constraints

- Capture explorer and RTL milestone: native capture values/spans, absent versus empty participation, final repeated captures, nested groups, rule navigation and up to 100 nonoverlapping search matches are implemented inside the same isolated worker/deadline. Empty matches advance by Unicode code point; unsupported indices are explicitly unavailable. Nested replies are validated against sent input/count/mode before rendering; tables are created on demand. The date recipe exposes year/month/day.
- Installed Chrome verifies the date and Unicode empty/absent capture flows at 1280/390px; all four capture-panel screenshots were visually inspected.
- Added complete Arabic and Urdu README guides, bringing documentation to ten languages. RTL prose/tables and LTR code are explicit; all 20 code blocks retain canonical bytes, and all 165 inline code fragments declare LTR. Published GitHub views were checked at 1280/390px: all 16 section headings and seven tables are RTL, and all 20 blocks are LTR in both languages. Eight published introduction/capture screenshots were visually inspected; native-speaker review remains open.
- All verification components pass: 244 Node tests, 292 bundled Chromium desktop/mobile checks, 62 Firefox/WebKit checks, 64 homepage checks, lint/types/docs, builds, clean package installation and zero audit vulnerabilities. All 30 focused group/reference/runner/localization tests pass on Node 22.23.3. The installed-Chrome attempt was stopped after the old UUID flow exceeded its observation budget; that test now allows 90 seconds without changing the 1,200 ms product deadline. The subsequent full command reached a bad language-link test selector; after correcting the selector, the complete 64-test site suite and audit passed separately. This records successful component gates rather than claiming one uninterrupted full-command pass.
- Publication: source `4f7495d` is pushed to `main`; Pages commit `95f66c3` built successfully. All 58 served files return HTTP 200 and match local SHA-256 values. All 33 changed files stay inside the existing project folder. Public Chrome desktop/mobile, Firefox and WebKit verify ten language links, four copy requests, native date capture values/spans, distinct absent/empty captures and empty Unicode matches at positions 0/2/3, with no page errors or 320px overflow. Four public capture-panel screenshots were inspected. npm remains `0.1.0-dev.3`; workshop UI translations and human reviews remain open.

- Remote `main` was clean and current at `2ba3ffa` when this wave started; no open issues were returned.
- GitHub Actions is disabled in the repository settings. Keep it disabled; local verification remains required.
- Runtime dependencies: none. Development dependencies installed with `npm ci`; audit reported zero vulnerabilities.
- The initial `npm run verify` attempt hit its 240-second observation limit during browser tests. It did not complete; no full-suite success is claimed. Future full runs need a longer process budget and a live handle.
- Preserve the earlier roadmap's unchecked human reviews, screen-reader testing and usability gates. Automated checks do not satisfy them.
- Compiler architecture and language details stay in [ARCHITECTURE.md](ARCHITECTURE.md) and [LANGUAGE.md](LANGUAGE.md); security policy stays in [SECURITY_MODEL.md](SECURITY_MODEL.md). Avoid duplicate policy documents.
- Competitive research is recorded separately; do not import competitor code or assets.

This file records progress, not completion of the entire mission. Remaining advanced syntax, visualization, workshop localization and later waves still need implementation and verification.
