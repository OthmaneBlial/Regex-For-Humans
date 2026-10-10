# Rust regex and Go regexp export constraints

Research checked 2026-10-10 using five search queries and official specifications, package documentation and engine source. No patterns were executed, runtimes installed, or project source changed.

## Target editions and equivalence boundary

- Rust: `regex` **1.13.1**, its standard `Regex` over `&str`, with default Unicode features. Rust/cargo 1.95.0 being installed does not establish that this crate is cached or tested. [Versioned crate documentation](https://docs.rs/regex/1.13.1/regex/).
- Go: **1.22.0**, standard `regexp.Compile`. Its default selection is leftmost-first; `CompilePOSIX` and `Longest` change selection and must not be substituted. The current Go documentation inspected separately shows newer property support; these findings use the 1.22.0 sources. [Versioned regexp documentation](https://pkg.go.dev/regexp@go1.22.0#Compile).
- Source baseline: native ECMAScript Unicode regular expressions, using the ES2025 `u`/`v` semantics. Matching, captures, indexes, and iteration are separate compatibility claims.

Rust characters exclude surrogate code points, and Rust strings require valid UTF-8. Go regex subjects decode UTF-8; invalid bytes become U+FFFD. Therefore, neither normal target API faithfully represents JavaScript strings containing lone UTF-16 surrogates. **Reject surrogate literals/ranges that require them; require an explicit well-formed-input contract for scalar-only exports.** Replacing invalid input with U+FFFD is a semantic change. [Rust character validity](https://doc.rust-lang.org/std/primitive.char.html#validity-and-layout), [Go regexp input semantics](https://pkg.go.dev/regexp@go1.22.0).

## Shared JavaScript requirements

JavaScript `\d` is ASCII; `\w` is ASCII except Unicode ignore-case folding can add non-ASCII characters; boundaries use that same word set. `\s` uses ECMAScript whitespace plus line terminators. Non-`s` dot excludes LF, CR, U+2028 and U+2029. Without `m`, `$` is strict end-of-input, including when a final newline exists; with `m`, anchors recognize all four line terminators. Repetition clears descendant captures on each iteration. Unicode `v` classes can contain strings and perform set operations with case-folding rules. [ES2025 regular-expression algorithms](https://tc39.es/ecma262/2025/multipage/text-processing.html#sec-regexp-regular-expression-objects).

Inferred exporter rules:

- Lower non-`s` dot to `[^\n\r\x{2028}\x{2029}]`; `s` can use the target's dot-all mode under the scalar-input contract.
- Emit the explicit ECMAScript whitespace set for `\s`, and its scalar complement for `\S`: `\x{0009}-\x{000D}\x{0020}\x{00A0}\x{1680}\x{2000}-\x{200A}\x{2028}\x{2029}\x{202F}\x{205F}\x{3000}\x{FEFF}` inside brackets. Neither target's native `\s` is an equivalent replacement. [Whitespace and line-terminator definitions](https://tc39.es/ecma262/2025/multipage/ecmascript-language-lexical-grammar.html#sec-white-space).
- Non-`m` `^`/`$` can stay strict anchors. **Reject `m` when line anchors occur** until an exact boundary implementation exists; `m` without anchors is immaterial. Consuming surrounding newline characters changes match spans.
- **Do not claim capture equivalence for captures inside repeated groups** until checked against JavaScript's reset rules, including optional children and empty iterations. Neither target's public capture documentation establishes that rule.

## Rust-specific capabilities

`regex` supports ordered alternation, greedy/lazy repetition, numbered/named captures, noncapturing groups, and scoped `i/m/s/u` flags. It excludes lookaround and backreferences. Its nested character classes support union, intersection `&&`, subtraction `--`, and symmetric difference, with target-specific precedence. Single searches are bounded by O(m × n); whole-match iterators can be O(m × n²). Counted-repeat expansion contributes to m. [Rust syntax and complexity](https://docs.rs/regex/1.13.1/regex/).

Unicode defaults differ: `\d` is `Nd`, `\s` is `White_Space`, and `\w` includes alphabetic characters, marks, digits, connector punctuation and join controls. Properties include general categories, scripts, script extensions and selected binary properties; this is not every JavaScript binary property. Case-insensitive matching uses simple folding. Native multiline boundaries normally recognize LF only. [Rust Unicode conformance](https://github.com/rust-lang/regex/blob/master/UNICODE.md).

Required lowering/rejection:

- Emit `[0-9]`/`[^0-9]` for JavaScript `\d`/`\D`; emit `[A-Za-z0-9_]`/`[^A-Za-z0-9_]` for non-`i` `\w`/`\W`.
- Emit `(?-u:\b)`/`(?-u:\B)` for non-`i` JavaScript boundaries. Do **not** disable Unicode globally: this changes Unicode folding and can make complements match invalid UTF-8, which standard `Regex` rejects. [Builder Unicode behavior](https://docs.rs/regex/latest/regex/struct.RegexBuilder.html#method.unicode).
- **Reject all lookahead/lookbehind and all numbered/named backreferences**, even fixed-width lookbehind; never reinterpret a reference as an octal literal.
- Preserve capture numbering and validate names against the target grammar. The common conservative name subset is `[A-Za-z_][A-Za-z0-9_]*`. Do not silently rename names or collapse duplicate names without an API mapping and proof.
- Scalar-only non-`i` `v` sets can be rendered from the AST with explicit nesting; copying class text does not preserve precedence or escaping. Every property operand still needs an allowlist and Unicode-table compatibility.
- **Reject `\q{...}` and properties of strings** for an initial native-class exporter. Finite strings could later become noncapturing alternatives with longest strings first; empty strings, repetition and case behavior require verified lowering. The source string sets are not atomic. [TC39 v-flag rationale and match order](https://github.com/tc39/proposal-regexp-v-flag#whats-the-match-order-for-character-classes-containing-strings).
- Rust offers simple Unicode case folding, like Unicode JavaScript, but that does not establish identical tables or complemented-property behavior. **Reject `i` in the initial exact subset**, or allow only separately verified nodes. In particular, reject `i` with boundaries, complemented properties or set operations until folding order is proven.
- Compilation has size/nesting limits; preserve errors and expose a target compilation failure rather than weakening the expression. CRLF mode or a custom one-byte line terminator cannot implement JavaScript's full multiline rules. [Builder limits and line terminators](https://docs.rs/regex/latest/regex/struct.RegexBuilder.html).

## Go 1.22.0-specific capabilities

Go supports ordered alternatives, greedy/lazy quantifiers, captures, both `(?P<name>...)` and `(?<name>...)`, noncapturing groups and scoped `i/m/s/U`. It has strict end anchor `\z`, ASCII `\b`/`\B`, ASCII `\d`/`\w`, and `\s` equivalent to `[\t\n\f\r ]` (even vertical tab is absent). Counted-repeat bounds above 1000 are rejected. Native classes have union/ranges/negation, not nested set algebra. Use `\x{...}` for code points; JavaScript `\u{...}` is not Go regex syntax. [Pinned Go syntax](https://raw.githubusercontent.com/golang/go/go1.22.0/src/regexp/syntax/doc.go).

Required lowering/rejection:

- With no `i`, JavaScript `\d`/`\D`, `\w`/`\W` and `\b`/`\B` can retain their target-native spelling under the input contract. Lower whitespace and dot as above.
- **Reject every lookaround and backreference.** RE2's supported grammar explicitly excludes them; Go uses that grammar except `\C`. [Official RE2 grammar](https://github.com/google/re2/wiki/Syntax), [Go engine overview](https://pkg.go.dev/regexp@go1.22.0).
- Names must be `[A-Za-z0-9_]+`; JavaScript-valid Unicode or `$` names require rejection or an explicitly mapped API. Nested counted repeats also have a combined expansion limit: checking each bound alone misses failures.
- Unicode property names resolve only through `unicode.Categories`, `unicode.Scripts`, or special `Any`. Canonicalize an AST general-category name to a supported short category such as `L`; `Script=Greek` becomes `Greek`. **Reject script extensions and arbitrary binary properties**, plus category values absent from the map. Never use script as an approximation to script extensions.
- The parser uses `unicode.SimpleFold` for `i`; target boundaries remain ASCII regardless of it. **Reject Unicode `i` boundaries** and gate other `i` nodes on table/folding proof. [Pinned parser: names, repeats, folding, properties](https://raw.githubusercontent.com/golang/go/go1.22.0/src/regexp/syntax/parse.go).
- Go 1.22.0 tables are Unicode **15.0.0**; the category map lacks `Cn` and `LC`. Resolve category aliases explicitly and reject unavailable values, even when newer Go accepts them. JavaScript's Unicode table version is still unverified. [Pinned Unicode tables](https://raw.githubusercontent.com/golang/go/go1.22.0/src/unicode/tables.go).
- **Reject `v` string sets and native intersection/subtraction** initially. Code-point set operations could later be evaluated to explicit disjoint ranges with bounded output and pinned data; `&&` or `--` cannot be pasted into a Go class as operators.

Go documents linear-time matching in input size; this does not provide a timeout, a universal constant-cost bound, or a guarantee that arbitrarily large compiled patterns are cheap. Its find indexes are byte offsets. Rust capture/match offsets are also bytes. An exporter preserving JavaScript's `d` results needs explicit UTF-8-to-UTF-16 index conversion. [Go matching API](https://pkg.go.dev/regexp@go1.22.0), [Rust capture API](https://docs.rs/regex/latest/regex/struct.Regex.html#method.captures).

## Serialization is a separate step

First render target regex syntax from the AST. Then quote that rendered text as a Rust or Go source string. A raw source string changes how backslashes reach the engine; it does not convert regex semantics. Rust raw strings need a collision-free delimiter and cannot contain literal CR. Go backtick strings cannot contain backticks and discard literal CR; use regex escapes or correctly quoted interpreted strings to preserve these values. [Rust string tokens](https://doc.rust-lang.org/reference/tokens.html#raw-string-literals), [Go string literals](https://go.dev/ref/spec#String_literals).

The JavaScript `u`/`v` flags describe source semantics, not Go flags. `g`, `y`, and `d` describe state, iteration or result data and require an explicit execution wrapper; silently dropping them cannot promise full RegExp-object equivalence. Until native checks exist, label this a researched capability proposal, with repeated captures, Unicode table alignment, ignore-case complements and iteration behavior still unverified.
