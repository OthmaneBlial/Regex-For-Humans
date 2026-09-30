# Security and performance boundaries

## Inputs and compilation

The version 1 parser accepts only the phrases in [LANGUAGE.md](LANGUAGE.md). It rejects unknown lines instead of returning a partial regex. Literal text and character-list items are escaped for their distinct regex contexts, and the compiler validates emitted source with JavaScript `RegExp` before returning it. Input rules are limited to 16,384 UTF-16 code units and 200 lines; numeric repetitions are limited to 1,000.

Unicode direction controls appear as visible escapes in generated source and human-readable results, reducing misleading [visual ordering](https://blog.unicode.org/2022/03/avoiding-source-code-spoofing.html). This presentation does not remove them from matching data: source-text metadata and editable examples retain their original contents, and CLI JSON preserves the data round trip.

The shared display policy also escapes C0/C1 control characters, DEL and Unicode line separators in generated source and human-readable values. Copied patterns, explanations, diagnostics, trace text and match feedback contain visible escapes while editable input and original source metadata retain the data. The CLI applies the same policy to arguments and native file errors separately from its own formatting line breaks; JSON decoding restores the original values.

Both bounds of `between n and m <item>` obey the numeric ceiling, with `0 ≤ n ≤ m`. Adjacent repeated atoms can still cause expensive backtracking, including when each repetition has a finite upper bound. Browser tests cover this with a compiler-generated bounded expression as well as an intentionally pathological raw expression; neither result guarantees that a copied regex is safe on arbitrary input.

The browser allows compiled regex sources up to 131,072 UTF-16 code units. This covers the largest escaping expansion from the 16,384-code-unit rule limit: a literal U+2028 or U+2029 becomes an eight-code-unit Unicode escape. Matching accepts examples up to 2,048 UTF-16 code units, with no more than 100 examples per run. The editor keeps oversized values intact for repair and marks them invalid; testing stops until they are shortened or removed, without sending those values to the worker or testing a truncated prefix. The worker independently rejects larger or malformed requests. These limits are product constraints, not a guarantee that every generated expression is fast in every other runtime or on every input size. Users should test the expression in the runtime where they intend to use it.

## Browser execution

The static workshop compiles rules locally. It loads its code and public recipe fixtures from the same origin; it does not submit typed rules or examples to an application backend, add telemetry or require an account. The hosting provider can still see ordinary requests for the static files and may keep access logs.

Matching examples runs in a dedicated Web Worker, not on the UI thread. Each edit cancels the previous worker. The controller terminates a worker and reports an error if it has not responded within 1,200 ms. This limit protects the workshop interaction; it does not change the behavior of a regex copied into another program. Browser tests exercise an intentionally pathological expression, confirm timeout and then confirm that a normal expression still runs.

The UI writes rules, examples, diagnostics and explanations through `textContent` or form values. It does not use user text as HTML or JavaScript. The document has a restrictive Content Security Policy. The browser tests include an HTML-looking literal, oversized input, same-origin resource checks and zero console errors in the reference scenarios.

## Verification and limits

Linked source files are copied as public static-build inputs. Asset versioning edits independent output copies and leaves the original targets unchanged.

The local development server binds to `127.0.0.1`. It resolves the selected static folder and requested files before reading them; URL paths or symlink targets outside that folder return `403`. A symlink selecting the root and links within it remain usable. This development helper assumes trusted local files that do not change during a request.

Run `npm test`, `npm run build` and `npm run test:browser`. Automated accessibility and security tests cover the documented cases, while broader browser/security review and real-user tests remain separate release gates in [ROADMAP.md](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/ROADMAP.md). Groups, alternation, lookaround, arbitrary regex injection and other engines are outside the version 1 language; adding any of them requires a new complexity and compatibility review.
