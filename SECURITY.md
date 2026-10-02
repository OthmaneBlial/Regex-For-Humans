# Security policy

[regex-for-humans@0.1.0-dev.2](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.2) is an experimental npm preview. No stable release is supported yet. Security fixes target `main`; its current behavior can differ from the published preview.

Please report a suspected vulnerability through GitHub's [private vulnerability reporting form](https://github.com/OthmaneBlial/Regex-For-Humans/security/advisories/new). Private reporting is enabled for this repository. Include the affected commit or version, reproduction steps, expected and observed behavior, and impact. Do not include real secrets or personal data in a reproducer. Please avoid posting exploitable details in a public issue before maintainers have had a chance to investigate.

The [security model](docs/SECURITY_MODEL.md) explains parser limits, escaping, browser data flow and worker timeout. A regex copied into another application can still have different performance characteristics; report a concrete reproducible issue rather than assuming the workshop timeout protects other runtimes. No response-time or bounty commitment is offered at this stage.
