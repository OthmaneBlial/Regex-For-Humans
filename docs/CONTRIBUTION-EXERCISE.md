# Internal contribution guide exercise

On 19 September 2026, the guide in [CONTRIBUTING.md](../CONTRIBUTING.md) was followed in a disposable local branch, `audit/contribution-exercise`, based on commit `46dc019`. The exercise intentionally did not add a feature to `main`.

The trial phrase was `ASCII letter`, with expected source `[A-Za-z]`, a positive `A`, a negative `3` and a malformed plural. A language-contract test was added first and failed with `UNKNOWN_RULE`. The phrase was then added to the parser's shorthand table, the matching explanation and `docs/LANGUAGE.md`; a browser test checked the emitted regex and visible explanation.

After `npm ci`, `npm run check`, `npm test` (42 passing), `npm run build` and the targeted Playwright browser test (desktop and mobile passing) completed. The browser trial used port 4175 because the main checkout's test server held 4174. This shows that the documented module path and local commands were sufficient for an internal contribution exercise. It does **not** prove that a new external contributor can follow the guide without help; that review remains open in [ROADMAP.md](../ROADMAP.md).
