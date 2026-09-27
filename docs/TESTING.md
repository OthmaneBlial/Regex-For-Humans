# Testing and compatibility

The package declares Node.js `>=22`. These results passed on 28 September 2026:

| Node version | Verification |
| --- | --- |
| 22.x | GitHub Actions run `36356236698` |
| 24.x | GitHub Actions run `36356236698` |
| 25.9.0 | `npm run check`, `npm test` — 64 tests, and `npm run test:package` |

These results verify the three versions shown, not every possible Node release accepted by the package's engine range. GitHub Actions [run `36356236698`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/36356236698) passed on commit `57dec76`: 64 Node tests across Linux Node 22/24, macOS and Windows Node 24, 44 browser tests on Linux Chromium, and `npm audit --audit-level=moderate` on Linux Node 24. Its tested `npm-package-tested` artifact was downloaded; SHA-256 `3d19e2b84876a84a62cd7cefb02071ad4b8cf872782ed0dafe4fbdd43412541e`. Earlier [run `35444963260`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/35444963260) also passed; its artifact hash was `e3202a0db96e06f21a70d2d714e703ed055c41bb11eff64415328bd4b431211c`. Disposable draft [PR #1](https://github.com/OthmaneBlial/Regex-For-Humans/pull/1) confirmed that invalid syntax fails `npm run check` on a real pull-request run, then was closed without merging. The automated accessibility tests do not replace a real screen reader session.

## Reproduce locally

From a fresh checkout with a supported Node and npm:

```sh
npm ci
npm run check
npm test
npm run build
npm run test:package
npx playwright install chromium
npm run test:browser
npm audit --audit-level=moderate
npm pack --dry-run --json
```

`npm run check` runs Biome format/lint/import checks and `tsc --noEmit`. Strict JavaScript type checking covers `index.js`, `src/`, the CLI in `bin/`, the browser UI in `web/app.js`, and the isolated worker files `web/test-runner.js` and `web/match-worker.js`, which share the contract in `web/worker-protocol.d.ts`. The declaration ships with the static workshop. Build scripts remain outside the TypeScript check; build and browser tests cover the workshop. The package tarball must contain only the runtime library, CLI, license, README and published docs; `npm pack --dry-run --json` lists its exact contents.

`npm run test:package` packs the current checkout, installs that exact tarball into a new temporary consumer, then checks package import, matching, trace, diagnostics, the installed CLI link, version and JSON output. It removes the temporary consumer afterward. CI can set `PACK_OUTPUT_DIR=artifacts` to retain the exact tested tarball as a downloadable workflow artifact. This workflow artifact is not an npm publication or GitHub Release.

Node tests cover the public API, parser diagnostics, every instruction and repetition form listed in [LANGUAGE.md](LANGUAGE.md), literal/character-set escaping with deterministic Unicode samples, 516 seeded arbitrary-rule cases, CLI use from files/stdin, and the isolated worker runner. The arbitrary-rule check verifies deterministic compilation, valid regex output, contiguous source spans, and positioned `CompileError` failures. Browser tests cover all four recipe fixtures, build-versioned asset URLs, editing and recovery, examples, clipboard, keyboard flow, the local syntax guide and visible build version, automated WCAG A/AA checks, oversized and HTML-like input, worker timeout/recovery, and expanded Unicode-escaped regex source.
