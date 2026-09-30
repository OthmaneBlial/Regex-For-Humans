# Testing and compatibility

GitHub Actions is disabled for this repository. All current quality checks run locally with `npm run verify`; pushes and pull requests do not trigger CI. The compatibility evidence below is historical, not a check of the latest commit.

The package declares Node.js `>=22`. These results passed on 28 September 2026:

| Node version | Verification |
| --- | --- |
| 22.x | [GitHub Actions run `36364750202`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/36364750202) |
| 24.x | [GitHub Actions run `36364750202`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/36364750202), Linux, macOS and Windows |
| 25.9.0 | Local checks, 61 Node tests, package and strict TypeScript consumer verification; desktop/mobile recipe regression |

These results verify the three versions shown, not every possible Node release accepted by the package's engine range. GitHub Actions [run `36364750202`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/36364750202) passed on commit `bcc732c`: 61 Node tests across Linux Node 22/24, macOS and Windows Node 24, 46 browser tests on Linux Chromium, and `npm audit --audit-level=moderate` on Linux Node 24. Its tested `npm-package-tested` artifact was downloaded; the tarball SHA-256 is `b3319a3f61ec03af27317b5b2ceb7e89a26dfbc6574690966b37f5c2fc82366f`. Disposable draft [PR #1](https://github.com/OthmaneBlial/Regex-For-Humans/pull/1) confirmed that invalid syntax fails `npm run check` on a real pull-request run, then was closed without merging. The automated accessibility tests do not replace a real screen reader session.

## Reproduce locally

From a fresh checkout with a supported Node, npm and installed Google Chrome:

```sh
npm ci
npm run verify
```

For bundled Playwright Chromium, install and select it explicitly:

```sh
npx playwright install chromium
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

`npm run test:package` packs the current checkout, installs that exact tarball into a new temporary consumer, then checks installed documentation links, package import, matching, trace, diagnostics, TypeScript declarations, the installed CLI link, version and JSON output. CLI checks use offline `npm exec` to run the command shim created by npm, including the Windows `.cmd` shim, without permitting another package installation. It removes the temporary consumer afterward. Set `PACK_OUTPUT_DIR=artifacts npm run test:package` locally to retain the exact tested tarball. A retained tarball is not an npm publication or GitHub Release.

Node tests cover the public API, parser diagnostics, every instruction and repetition form listed in [LANGUAGE.md](LANGUAGE.md), literal/character-set escaping with deterministic Unicode samples, 518 seeded arbitrary-rule cases, CLI use from files/stdin, and the isolated worker runner. Bounded-count checks include zero and equal bounds, both limits, Unicode literal units, inclusive matching and positioned malformed-range errors. The arbitrary-rule check verifies deterministic compilation, valid regex output, contiguous source spans, and positioned `CompileError` failures. Browser tests cover all recipe fixtures, build-versioned asset URLs, editing and recovery, examples, clipboard, keyboard flow, the local syntax guide and visible build version, automated WCAG A/AA checks, oversized and HTML-like input, worker timeout/recovery for pathological and compiler-generated bounded expressions, and expanded Unicode-escaped regex source.

Entire-string regressions verify that a partial greedy match can backtrack to cover the full example, while search mode retains the first match. They include overlapping repeated literals, zero counts, upper bounds, final newlines and line-mode suffix matches. The worker timeout check also covers expensive backtracking introduced by retrying a partial match against the whole input.

Worker-controller regressions cover startup failures as rejected `WORKER_ERROR` promises, cancellation of a previous run, recovery and request-ID ownership. Real-worker browser checks verify that extra top-level payload IDs do not cause false timeouts and that example IDs remain intact.

Count-diagnostic regressions cover signed, fractional, scientific, hexadecimal, separated and localized numeric tokens in exact and bounded forms, missing items and duplicate tokens. They preserve zero, leading zeros, the upper limit and numeric characters used as quoted or character-list data. CLI checks verify structured errors, exit status and repair hints; workshop checks verify disabled copy, error-token focus and recovery.

Letter-rule checks cover singular and plural defaults, exact and bounded counts, every ASCII code point under all supported option-flag combinations, and representative non-ASCII letters. Unicode case-folding checks preserve JavaScript's `iu` matches for `K` and `ſ` and the accompanying explanation. CLI, clean-consumer and workshop checks verify the same source, count metadata, positioned errors and recovery; the rendered syntax guide includes the ASCII limits.

Workshop clipboard regressions cover overlapping requests for unchanged rules in both success/failure orders, ignore outdated replies before attempting the legacy fallback, and retain the latest confirmation timer. A stalled request clears previous confirmation, reaches the manual-copy fallback after one second, preserves keyboard focus and allows a later successful retry. Rule edits still protect newer diagnostics from old copy results.

`npm run build:pages` versions the homepage app from its source and the workshop build fingerprint. Its compiler entry and recipe request follow that version, so changes to the homepage or compiler do not reuse an obsolete cached module. The homepage stylesheet has its own content version, so CSS edits invalidate its URL automatically. A temporary build regression verifies stable unchanged URLs, changes to each input, independent app/style versions, and explicit failures for an unversioned workshop or missing stylesheet reference. A browser regression serves an obsolete stylesheet for outdated URLs and verifies that the homepage requests the current stylesheet and renders its intended background.

Homepage startup regressions hold the app or compiler response and verify neutral output until matching is ready. Copy controls become available when their handlers are installed, independently of compiler loading. A failed compiler leaves static rules, clipboard controls and workshop links available, reports an unavailable demo without an uncaught error, and recovers on reload. A JavaScript-disabled check verifies the static patterns and manual-copy explanation.

Workshop startup regressions hold the app module while rules and options are entered. The app preserves those values, compiles them before loading recipes, and enables adding examples only after its handler is installed. Empty and whitespace-only edits stay neutral; invalid pretyped rules get diagnostics even if recipes fail. Explicit recipe selection still restores its defaults, and edits made while the recipe request is pending remain protected. With JavaScript disabled, both workshop entry pages show an explanation and open the static syntax guide from the keyboard without missing assets or overflow at desktop, mobile and 320px widths.

`npm run test:site` builds and serves the complete `site/` directory. It verifies the homepage demo against the shared compiler, an obsolete cached compiler response, shared recipe notes, clipboard text and feedback after recipe changes, one-second clipboard timeout and recovery, overlapping copy requests for the same recipe, recipe navigation, recipe-load recovery, copied documentation, local assets, 320px layout, and automated WCAG A/AA checks at desktop and mobile sizes. Fake-clock regressions exercise delayed resolve/reject responses and confirm that older clipboard operations cannot replace the latest copy confirmation.
