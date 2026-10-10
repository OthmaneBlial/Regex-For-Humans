# Local runtime feasibility

This inventory is the preimplementation feasibility snapshot. Subsequent generated-code comparisons are recorded in [the engine evidence](../docs/COMPATIBILITY.md#engine-export-evidence); runtime availability alone is not compatibility evidence.

Read-only version probes on 10 October 2026, run while the structural-review verification gate continued. These versions identify feasible future tests, not proven cross-engine equivalence.

| Target | Local evidence | Consequence |
| --- | --- | --- |
| JavaScript / TypeScript | Existing Node 25.9.0 host and cached Node 22.23.3; TypeScript 7.0.2 consumer checks | Verify native RegExp output on both Node majors; TypeScript syntax does not introduce another regex engine. |
| Python | Python 3.14.7 | Standard-library re tests are feasible without installation. |
| Ruby | macOS Ruby 2.6.10 | Local tests cover this older edition; newer official documentation does not prove parity. |
| PHP | Executable not found | Native PHP/PCRE evidence remains unavailable; do not label generated snippets runtime-verified. Inspect PCRE_VERSION independently if a runtime becomes available. |
| Go | go1.22.0 darwin/arm64 | Pin initial native checks to Go 1.22.0, not current online documentation. |
| Rust | rustc/cargo 1.95.0; regex 1.13.1, regex-automata 0.4.18 and regex-syntax 0.8.11 cached | An isolated offline consumer can evaluate the cached edition. Presence in cache is not an execution or equivalence test. |
| Java | OpenJDK 17.0.19 | Initial native evidence concerns Java 17; Java 25 boundary documentation must be treated separately. |
| C# | dotnet --version returned 10.0.400 | A native .NET 10 consumer is feasible; do not assume newer .NET 11 options are present. |

No runtimes were installed, no arbitrary regexes were executed by this inventory and no other project's services were modified. Additional exactness checks must cover native captures/participation, Unicode/lone-surrogate inputs, anchors/line terminators, ignore-case tables and the intended Boolean/match/cursor contract before a target is advertised as supported.
