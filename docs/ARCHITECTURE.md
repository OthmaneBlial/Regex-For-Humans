# Architecture and compatibility policy

Regex For Humans is a dependency-free JavaScript ESM compiler with a CLI and a static browser workshop. The language is deliberately finite: each nonblank rule must match a documented instruction. There is no natural-language model, arbitrary regex passthrough or server-side compilation.

## Compilation path

```text
rules (string)
  → src/parser.js: parse and validate each line
  → src/ast.js: ordered anchor and atom nodes with source locations
  → src/compiler.js: escaped JavaScript regex fragments, flags and source spans
  → src/explain.js: text attached to each emitted fragment
  → index.js: compile result and optional native RegExp
```

`src/parser.js` owns the vocabulary, grammar, input limits and syntax diagnostics. A rule cannot be silently skipped. Its output has ordered nodes and an anchor mode. `src/ast.js` defines the node shapes in JSDoc so TypeScript checks the public compiler path without a build step. `src/compiler.js` escapes literals and character-list items in their different regex contexts, applies repetition to one atom, determines flags and checks the result with `new RegExp`. `src/explain.js` receives the same AST node used for emission, so each segment can be traced to an input rule. `src/diagnostics.js` defines `CompileError` and the common failure path.

`src/display.js` provides the shared display policy for direction controls, C0/C1 control characters, DEL and Unicode line separators across compiler source, quoted data, diagnostics, trace text, CLI serialization and browser feedback. The CLI applies it to data separately from its own formatting line breaks. Matching values and original source-text metadata stay unchanged.

The public `compile(source, options)` returns `{ source, flags, segments }`. `index.d.ts` types that result and the public errors for TypeScript consumers; the package test compiles a strict consumer against the installed tarball. `segments` contain source start/end offsets (JavaScript UTF-16 indices), the emitted fragment, original instruction, explanation, one-based line/column, and node details. `toRegExp(result)` builds a native JavaScript regex. `regexMatchingThroughLines(source)` is the original compatibility alias and returns only the source. The CLI calls this same public compiler; it does not maintain a second parser. It reads a file or stdin and offers a copyable regex literal or JSON result. See [LANGUAGE.md](LANGUAGE.md) for exact syntax and [TESTING.md](TESTING.md) for supported-runtime evidence.

The browser imports the same `index.js` from the static build. `web/app.js` handles editor state, examples and trace rendering. `web/match-worker.js` executes example matching away from the UI thread; `web/test-runner.js` owns cancellation and the 1,200 ms timeout. The controller reuses one completed worker, while pending checks, errors, timeouts and explicit cancellation retire it. Request IDs exclude stale replies; regexes and results are recreated for each request. `scripts/build-web.js` copies the static assets, compiler, public fixtures, docs, README, changelog, security policy and license to `dist/`. `npm run build` checks links in the exact copied documentation; `scripts/serve-dist.js` is only a local development server. The browser has no account, application backend or telemetry. Its security boundary and input limits are in [SECURITY_MODEL.md](SECURITY_MODEL.md).

The internal `TestRunner.run(payload)` reports worker construction and message-send failures through rejected `WORKER_ERROR` promises. Starting a run cancels the previous one, including when the new worker cannot start; later attempts remain available. The controller assigns the request ID after copying payload fields so an extra caller-supplied `id` cannot interfere with reply routing. Example IDs inside `cases` are preserved separately.

Compiler option validation compares the requested flags with the five exact allowed values (`""`, `"i"`, `"s"`, `"is"`, `"si"`). It avoids scanning or deduplicating arbitrarily long option strings while preserving the existing error and canonical flag order.

## Reverse translation

The public `regexToRules(regex)` delegates to `src/regex-to-rules.js`. It reads a bounded subset of Unicode JavaScript `RegExp` syntax and returns `{ rules, flags }`; `flags` contains the `i`/`s` compiler options, while multiline behavior is represented by line-anchor rules. The emitted rules are checked by the existing parser. Unsupported operators and flags fail with positioned `CompileError` diagnostics instead of returning approximate or partial rules.

Native getters read the stored metadata, including for regexes from another JavaScript context. The native flags accessor receives a projection that reads those same getters rather than instance overrides. Unsupported flags, missing Unicode mode and oversized source are rejected in that order, without serializing or reconstructing the input regex. Translation leaves `lastIndex` unchanged.

The parser also owns the output size and line limits. Reverse translation preserves its limit codes but reports that the translated rules are too large, at the start of the whole regex. Other parser errors propagate unchanged. The workshop applies rules and options only after translation succeeds, so a rejected translation preserves the current editor and matching output.

The reader preserves Unicode atom boundaries, including fixed-width surrogate pairs in repetition and character classes. Separate lone-surrogate atoms remain separate rules; a literal group whose boundaries cannot be represented fails explicitly. Translation does not execute the input regex. The workshop and CLI's `--reverse` mode use the same internal `src/regex-literal.js` reader for slash delimiters, escapes, character classes, flags and native syntax validation. Both call the public reverse API; the workshop then uses its existing compiler and isolated example worker.

CLI reverse mode reads a UTF-8 file or stdin. JSON returns the API's `{ rules, flags }`; plain output contains reusable rules and writes any required i/s compiler options to stderr. Forward-only options are rejected before reading reverse input. This additive CLI option is currently unreleased on `main`; the published npm preview is recorded separately in [DISTRIBUTION.md](DISTRIBUTION.md).

## Diagnostics and changes to the language

`CompileError` carries a stable machine-readable `code`, a human message and one-based `line`/`column`; columns count UTF-16 code units, matching JavaScript string indices. An optional `hint` gives recovery advice. Invalid input must fail before returning a compile result. CLI JSON rule errors use `error.toJSON()`; invalid arguments use `CLI_USAGE`, and file/runtime errors use `CLI_ERROR`. New rule errors need a distinct code, a location test and readable wording. When a line contains a prefix or comma-separated anchor, verify that the reported column points to the relevant remaining instruction.

The documentation calls the implemented grammar **language version 1**. That is a grammar label, not a claim that npm package version 1.0 exists. The first npm candidate is the development preview `0.1.0-dev`; [DISTRIBUTION.md](DISTRIBUTION.md) records its actual publication status. Stable-release human reviews remain open.

Review a proposed new phrase for overlap with existing phrases, article and repetition handling, anchor semantics, JavaScript `u` behavior and regex performance. Add positive, negative and malformed examples before implementation. Keep the parser deterministic and reject ambiguous spelling. Update the AST only if the new instruction needs a new semantic node, then update compiler output, explanation, language docs, CLI and browser fixtures as appropriate. Do not add raw regex injection or a third-party parser without a separate security and maintenance review.

Once published, preserve documented API names, CLI flags, diagnostics and existing phrase meanings within a compatible release. An additive phrase still needs tests and release notes. A change that alters a previously valid rule's meaning, removes syntax or changes the public result shape requires an explicit migration note, a version bump appropriate to the published package version and tests for both old and new behavior. Do not silently reinterpret existing rules. The release checklist in [ROADMAP.md](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/ROADMAP.md) remains the gate for publication.

## Dependency and review policy

The runtime package has no dependencies. New dependencies should solve a documented need that the platform cannot meet simply, and reviewers should inspect package scope, license, maintenance, install size and security advisories. Keep browser scripts same-origin and avoid uploading user rules or examples. Any grammar, escaping, flag or execution change needs parser/compiler tests and browser checks; changes to the UI also need keyboard and automated accessibility checks. Human usability and screen-reader validation are separate gates.
