# Distribution decision record

**Current state (19 September 2026):** the CLI and ESM library work from a clone and from a locally packed npm tarball. The tarball has no runtime dependencies and installs into a clean consumer. It is a Node.js package, not a standalone executable. No npm version, hosted workshop or GitHub Release has been published yet.

The planned primary distribution is a versioned npm package containing the library and `regex-for-humans` CLI, plus a static browser workshop for quick evaluation. The package requires Node.js 22 or newer. The repository currently offers local clone instructions in [README.md](../README.md). CI preserves the exact tarball it tests as a workflow artifact; that artifact is for verification, not a substitute for a published registry version.

## Standalone binary decision

No standalone OS executable is planned for the first release. The present product is a small JavaScript CLI and library, and there is no measured evidence yet that its target users need a bundled Node runtime. Maintaining separate Windows, macOS and Linux executables would add build, signature, platform smoke-test and update obligations. This is a provisional decision pending the three new-user sessions in [USABILITY-STUDY.md](USABILITY-STUDY.md). Ask whether Node installation is a practical barrier, which OS/architecture is involved, and whether a browser-only or npm route meets the need. Record the observations before closing roadmap task 5.3.

If those sessions show a concrete standalone need, select a maintained packaging tool, build each claimed OS/architecture in CI, smoke the exact downloadable files on each target, and publish SHA-256 checksums with the release. Do not link a binary that has not been built and verified. If the no-binary decision holds, state it explicitly in the release notes and keep the Node/npm and browser routes prominent.
