# Distribution decision record

**Current state (verified 28 September 2026):** the CLI and ESM library work from a clone and from a locally packed npm tarball, which installs into a clean consumer without runtime dependencies. The development project site and workshop are live at [othmaneblial.github.io/Regex-For-Humans](https://othmaneblial.github.io/Regex-For-Humans/); the public workshop shows the short recipe `line start` / `any text` / `3 digits` / `line end` and all three example checks pass. The npm registry returns 404 for `regex-for-humans`; no stable tag or GitHub Release exists. The app remains a Node.js package, not a standalone executable.

The target release route is a versioned npm package containing the library and `regex-for-humans` CLI, plus the static browser workshop. The current hosted site is a development preview, not a stable release. The package requires Node.js 22 or newer. CI preserves the exact tarball it tests as a workflow artifact; that artifact is for verification, not a substitute for a published registry version.

## Standalone binary decision

No standalone OS executable is planned for the first release. The present product is a small JavaScript CLI and library, and there is no measured evidence yet that its target users need a bundled Node runtime. Maintaining separate Windows, macOS and Linux executables would add build, signature, platform smoke-test and update obligations. This is a provisional decision pending the three new-user sessions in [USABILITY-STUDY.md](USABILITY-STUDY.md). Ask whether Node installation is a practical barrier, which OS/architecture is involved, and whether a browser-only or npm route meets the need. Record the observations before closing roadmap task 5.3.

If those sessions show a concrete standalone need, select a maintained packaging tool, build each claimed OS/architecture in CI, smoke the exact downloadable files on each target, and publish SHA-256 checksums with the release. Do not link a binary that has not been built and verified. If the no-binary decision holds, state it explicitly in the release notes and keep the Node/npm and browser routes prominent.
