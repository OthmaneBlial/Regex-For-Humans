# Distribution decision record

**Verification snapshot (30 September 2026, source `07d56bb`):** the CLI and ESM library work from a clone and from a locally packed npm tarball with TypeScript declarations and no runtime dependencies. Local `npm run verify` passed on Node 25.9.0: 85 Node tests, 96 workshop tests, 36 homepage tests, a clean consumer installation and no reported audit vulnerabilities. These results do not establish current compatibility on other Node versions or operating systems; see [TESTING.md](TESTING.md) for historical compatibility evidence.

The development site and workshop are live at [othmaneblial.github.io/Regex-For-Humans](https://othmaneblial.github.io/Regex-For-Humans/). Pages deployment `f9e13a9` completed, and all seven shared workshop recipes and their samples were replayed in Chrome at desktop and mobile sizes. Homepage checks verified the current stylesheet, demo matching and real clipboard copying. This is a checked development deployment, not a stable release.

The public npm registry returned 404 for `regex-for-humans`, and the GitHub tags and releases APIs returned empty lists. This records the checked state only; it does not reserve the npm name. The package remains `0.1.0-dev` and requires Node.js rather than providing a standalone executable. Recheck external publication state before a release.

The target release route is a versioned npm package containing the library and `regex-for-humans` CLI, plus the static browser workshop. The current hosted site is a development preview, not a stable release. The package requires Node.js 22 or newer. GitHub Actions is disabled for this repository. Local verification can preserve the exact tested tarball with `PACK_OUTPUT_DIR=artifacts npm run test:package`; that tarball is not a substitute for a published registry version.

## Standalone binary decision

No standalone OS executable is planned for the first release. The present product is a small JavaScript CLI and library, and there is no measured evidence yet that its target users need a bundled Node runtime. Maintaining separate Windows, macOS and Linux executables would add build, signature, platform smoke-test and update obligations. This is a provisional decision pending the three new-user sessions in [USABILITY-STUDY.md](USABILITY-STUDY.md). Ask whether Node installation is a practical barrier, which OS/architecture is involved, and whether a browser-only or npm route meets the need. Record the observations before closing roadmap task 5.3.

If those sessions show a concrete standalone need, select a maintained packaging tool, build and verify each claimed OS/architecture, smoke the exact downloadable files on each target, and publish SHA-256 checksums with the release. Do not link a binary that has not been built and verified. If the no-binary decision holds, state it explicitly in the release notes and keep the Node/npm and browser routes prominent.
