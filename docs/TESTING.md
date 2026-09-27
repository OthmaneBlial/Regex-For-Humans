# Testing and compatibility

The package declares Node.js `>=22`. The following versions passed all 59 Node tests on 27 September 2026:

| Node version | Verification |
| --- | --- |
| 22.x | GitHub Actions run `36345586699` |
| 24.x | GitHub Actions run `36345586699` |
| 25.9.0 | `npm test` |

These results verify the three versions shown, not every possible Node release accepted by the package's engine range. The 40 browser tests passed in local Chrome at desktop and mobile viewports on 27 September 2026. GitHub Actions [run `36345586699`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/36345586699) passed on commit `8e696a0` across Linux Node 22/24, macOS and Windows Node 24, and Linux Chromium. Earlier [run `35444963260`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/35444963260) also passed; its tested `npm-package-tested` tarball was downloaded and SHA-256 checked (`e3202a0db96e06f21a70d2d714e703ed055c41bb11eff64415328bd4b431211c`). Disposable draft [PR #1](https://github.com/OthmaneBlial/Regex-For-Humans/pull/1) confirmed that invalid syntax fails `npm run check` on a real pull-request run, then was closed without merging. The automated accessibility tests do not replace a real screen reader session.

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

`npm run check` runs Biome format/lint/import checks and `tsc --noEmit`. Strict JavaScript type checking currently covers `index.js`, `src/` and the CLI in `bin/`. The browser UI and build scripts are linted and exercised by browser/build tests but are not yet in the TypeScript checking scope. The package tarball must contain only the runtime library, CLI, license, README and published docs; `npm pack --dry-run --json` lists its exact contents.

`npm run test:package` packs the current checkout, installs that exact tarball into a new temporary consumer, then checks package import, matching, trace, diagnostics, the installed CLI link, version and JSON output. It removes the temporary consumer afterward. CI can set `PACK_OUTPUT_DIR=artifacts` to retain the exact tested tarball as a downloadable workflow artifact. This workflow artifact is not an npm publication or GitHub Release.

Node tests cover the public API, parser diagnostics, every instruction and repetition form listed in [LANGUAGE.md](LANGUAGE.md), literal/character-set escaping with deterministic Unicode samples, 516 seeded arbitrary-rule cases, CLI use from files/stdin, and the isolated worker runner. The arbitrary-rule check verifies deterministic compilation, valid regex output, contiguous source spans, and positioned `CompileError` failures. Browser tests cover all four recipe fixtures, build-versioned asset URLs, editing and recovery, examples, clipboard, keyboard flow, the local syntax guide and visible build version, automated WCAG A/AA checks, oversized and HTML-like input, worker timeout/recovery, and expanded Unicode-escaped regex source.
