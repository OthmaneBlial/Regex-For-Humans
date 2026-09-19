# Security and performance boundaries

## Inputs and compilation

The version 1 parser accepts only the phrases in [LANGUAGE.md](LANGUAGE.md). It rejects unknown lines instead of returning a partial regex. Literal text and character-list items are escaped for their distinct regex contexts, and the compiler validates emitted source with JavaScript `RegExp` before returning it. Input rules are limited to 16,384 UTF-16 code units and 200 lines; numeric repetitions are limited to 1,000.

The browser adds user-controlled example strings, each limited to 2,048 UTF-16 code units, with no more than 100 examples per run. Its test worker rejects oversized or malformed requests. These limits are product constraints, not a guarantee that every generated expression is fast in every other runtime or on every input size. Users should test the expression in the runtime where they intend to use it.

## Browser execution

The static workshop compiles rules locally. It loads its code and the three public recipe fixtures from the same origin; it does not submit typed rules or examples to an application backend, add telemetry or require an account. The hosting provider can still see ordinary requests for the static files and may keep access logs.

Matching examples runs in a dedicated Web Worker, not on the UI thread. Each edit cancels the previous worker. The controller terminates a worker and reports an error if it has not responded within 1,200 ms. This limit protects the workshop interaction; it does not change the behavior of a regex copied into another program. Browser tests exercise an intentionally pathological expression, confirm timeout and then confirm that a normal expression still runs.

The UI writes rules, examples, diagnostics and explanations through `textContent` or form values. It does not use user text as HTML or JavaScript. The document has a restrictive Content Security Policy. The browser tests include an HTML-looking literal, oversized input, same-origin resource checks and zero console errors in the reference scenarios.

## Verification and limits

Run `npm test`, `npm run build` and `npm run test:browser`. Automated accessibility and security tests cover the documented cases, while broader browser/security review and real-user tests remain separate release gates in [ROADMAP.md](../ROADMAP.md). Groups, alternation, lookaround, arbitrary regex injection and other engines are outside the version 1 language; adding any of them requires a new complexity and compatibility review.
