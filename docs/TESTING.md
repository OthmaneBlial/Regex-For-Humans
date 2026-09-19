# Testing and compatibility

The package declares Node.js `>=22`. The following versions passed all 41 Node tests on 19 September 2026:

| Node version | Verification |
| --- | --- |
| 22.23.2 | `npx -y node@22 --test test/*.test.js` |
| 24.21.0 | `npx -y node@24 --test test/*.test.js` |
| 25.9.0 | `npm test` after `npm ci` |

These results verify the three versions shown, not every possible Node release accepted by the package's engine range. The 32 browser tests were run in local Chrome at desktop and mobile viewports. GitHub Actions [run `35444713414`](https://github.com/OthmaneBlial/Regex-For-Humans/actions/runs/35444713414) passed on commit `db428f8` with Linux Node 22/24, macOS Node 24, Windows Node 24 and Chromium on Linux. Its `npm-package-tested` tarball was downloaded and SHA-256 checked (`ee371f42ff2a33c760ee018567e514e3ea0ec7ba3804e61ee8ddc469696adc85`). Disposable draft [PR #1](https://github.com/OthmaneBlial/Regex-For-Humans/pull/1) confirmed that invalid syntax fails `npm run check` on a real pull-request run, then was closed without merging. The automated accessibility tests do not replace a real screen reader session.

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

Node tests cover the public API, parser diagnostics, every instruction and repetition form listed in [LANGUAGE.md](LANGUAGE.md), literal/character-set escaping with deterministic Unicode samples, CLI use from files/stdin, and the isolated worker runner. Browser tests cover the three reference recipes, editing and recovery, examples, clipboard, keyboard flow, the local syntax guide and visible build version, automated WCAG A/AA checks, oversized and HTML-like input, and worker timeout/recovery.
