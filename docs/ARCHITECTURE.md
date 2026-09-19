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

The public `compile(source, options)` returns `{ source, flags, segments }`. `segments` contain source start/end offsets (JavaScript UTF-16 indices), the emitted fragment, original instruction, explanation, one-based line/column, and node details. `toRegExp(result)` builds a native JavaScript regex. `regexMatchingThroughLines(source)` is the original compatibility alias and returns only the source. The CLI calls this same public compiler; it does not maintain a second parser. It reads a file or stdin and offers a copyable regex literal or JSON result. See [LANGUAGE.md](LANGUAGE.md) for exact syntax and [TESTING.md](TESTING.md) for supported-runtime evidence.

The browser imports the same `index.js` from the static build. `web/app.js` handles editor state, examples and trace rendering. `web/match-worker.js` executes example matching away from the UI thread; `web/test-runner.js` owns cancellation and the 1,200 ms timeout. `scripts/build-web.js` copies the static assets, compiler, public fixtures and docs to `dist/`; `scripts/serve-dist.js` is only a local development server. The browser has no account, application backend or telemetry. Its security boundary and input limits are in [SECURITY_MODEL.md](SECURITY_MODEL.md).

## Diagnostics and changes to the language

`CompileError` carries a stable machine-readable `code`, a human message and one-based `line`/`column`; an optional `hint` gives recovery advice. Invalid input must fail before returning a compile result. CLI JSON errors use `error.toJSON()`. New errors need a distinct code, a location test and readable wording. When a line contains a prefix or comma-separated anchor, verify that the reported column points to the relevant remaining instruction.

The documentation calls the implemented grammar **language version 1**. That is a grammar label, not a claim that npm package version 1.0 exists. The package remains at `0.1.0-dev` until a verified release. No published npm version is implied by the repository.

Review a proposed new phrase for overlap with existing phrases, article and repetition handling, anchor semantics, JavaScript `u` behavior and regex performance. Add positive, negative and malformed examples before implementation. Keep the parser deterministic and reject ambiguous spelling. Update the AST only if the new instruction needs a new semantic node, then update compiler output, explanation, language docs, CLI and browser fixtures as appropriate. Do not add raw regex injection or a third-party parser without a separate security and maintenance review.

Once published, preserve documented API names, CLI flags, diagnostics and existing phrase meanings within a compatible release. An additive phrase still needs tests and release notes. A change that alters a previously valid rule's meaning, removes syntax or changes the public result shape requires an explicit migration note, a version bump appropriate to the published package version and tests for both old and new behavior. Do not silently reinterpret existing rules. The release checklist in [ROADMAP.md](../ROADMAP.md) remains the gate for publication.

## Dependency and review policy

The runtime package has no dependencies. New dependencies should solve a documented need that the platform cannot meet simply, and reviewers should inspect package scope, license, maintenance, install size and security advisories. Keep browser scripts same-origin and avoid uploading user rules or examples. Any grammar, escaping, flag or execution change needs parser/compiler tests and browser checks; changes to the UI also need keyboard and automated accessibility checks. Human usability and screen-reader validation are separate gates.
