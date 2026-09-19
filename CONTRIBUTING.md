# Contributing

Thanks for helping make the controlled language accurate and easy to use. The current version is a development build. Open an issue before implementing a broad new grammar feature so the supported phrases and JavaScript semantics can be agreed first. Small bug fixes and documentation corrections can start as a pull request.

## Local setup

Use Node.js 22 or newer and npm. From a fresh clone:

```sh
npm ci
npm run check
npm test
npm run build
npm run test:package
npx playwright install chromium
npm run test:browser
```

The local Playwright configuration uses installed Chrome; CI will use Playwright Chromium when its workflow is added. If Chrome is unavailable locally, set `CI=1` after installing Chromium to run that channel. See [testing and compatibility](docs/TESTING.md) for the exact scope of each check. Include the command and result when reporting a failure.

## Adding or changing a language rule

1. Describe the user problem and the exact English phrase in an issue or pull request. Give at least one string it should match, one it should reject and one malformed phrase the parser must reject. State the JavaScript regex source and flags you expect. Check [the language contract](docs/LANGUAGE.md) for collisions and engine-specific behavior.
2. Add a readable test to `test/language-contract.test.js` or `test/parser.test.js` before changing the parser. Add escaping/property cases in `test/compiler.test.js` or the language-contract test if the rule emits new syntax. A rule must have positive, negative and invalid coverage.
3. Implement parsing in `src/parser.js`. Use the AST helpers in `src/ast.js`; adjust their documented node types only when required. Preserve one-based diagnostic locations and reject unknown or ambiguous text.
4. Implement JavaScript output in `src/compiler.js` and the explanation in `src/explain.js` from the same node. Validate metacharacters, Unicode and flags. Do not pass user text through as raw regex.
5. Update `docs/LANGUAGE.md`, the applicable recipe fixture in `test/fixtures/product-scenarios.json` if it changes, and the CLI/browser tests for user-visible behavior. Run the commands above and inspect the browser interaction when the interface changes.

The module flow, public API and compatibility rules are explained in [ARCHITECTURE.md](docs/ARCHITECTURE.md). State any breaking behavior and its migration in the pull request and release notes. A passing snapshot alone is insufficient evidence for a new matching rule.

## Pull request checklist

- Explain the behavior, affected syntax/API and why it is useful.
- Include positive, negative and malformed cases with expected regex source/flags.
- Report `npm run check`, `npm test`, `npm run build` and relevant browser results.
- Update documentation and record any compatibility or security effect.
- For UI work, include a real screenshot and keyboard/accessibility findings.

Do not include personal data, access tokens or private example strings in tests, screenshots or issues. Security-sensitive reports should follow the repository's security reporting guidance once `SECURITY.md` is published; until then, avoid posting an exploit with sensitive data in a public issue.
