# The Regex For Humans language

Version 1 compiles fixed English rules into JavaScript `RegExp`. It does not guess from free-form text or examples. This guide describes the `0.1.0-dev.5` preview: groups, lazy repetition, lookaround, boundaries, Unicode properties/classes, native v sets and all eight JavaScript flags.

Write one rule per line. `start` or `line start` can prefix the first rule. Keywords are case-insensitive; quoted text keeps its case. Leading and trailing spaces are ignored.

Separate rules with LF, CRLF, CR, U+2028 or U+2029.

Input and line anchors can be combined. Each retains its own meaning, including across groups and alternatives: `start` / `end` remain absolute while `line start` / `line end` use native multiline boundaries. Duplicate or misplaced anchors remain positioned errors. Mixed anchor modes are included in npm `0.1.0-dev.5`.

## 🏗️ Larger worked examples

The [complex-examples guide](COMPLEX-EXAMPLES.md) combines these atoms into an access log, structured event, artifact manifest and multiline order. It includes complete regexes, every generated explanation, accepted/rejected inputs and capture/nested-group import examples.

## Instructions

| Instruction | Generated source | Matches | Does not match |
| --- | --- | --- | --- |
| `start` | `^` | `^A` matches `A` | `^A` does not match `BA` |
| `end` | `$` | `A$` matches `A` | `A$` does not match `AB` |
| `line start` | `^` with `m` | `^A` matches `B\nA` | `^A` does not match `BA` |
| `line end` | `$` with `m` | `A$` matches `A\nB` | `A$` does not match `AB` |
| `any character` | `.` | `A` | a newline unless `s` is enabled |
| `any text` | `.*` | longest text up to the next rule; `s` includes line breaks | a line break without `s` |
| `word` | `\w` | `A`, `_`, `3` | `-`, `é` |
| `word character` | `\w` | `A`, `_`, `3` | `-`, `é` |
| `word characters` | `\w+` | one or more letters, digits or underscores | empty string, `-`, `é` |
| `not word` | `\W` | `-`, `é` | `A`, `_` |
| `word boundary` | `\b` | a transition between word and non-word status | two adjacent word characters or two non-word characters |
| `not word boundary` | `\B` | equal word/non-word status on both sides | a word/non-word transition |
| `digit` | `\d` | `3` | `A`, `٣` |
| `not digit` | `\D` | `A`, `٣` | `3` |
| `letter` | `[A-Za-z]` | `A`, `z` | `3`, `_`, `é` |
| `letters` | `[A-Za-z]+` | `aBc` | empty string, `A3` with `start` and `end` |
| `lowercase letter` | `[a-z]` | `a`, `z` | `A` |
| `lowercase letters` | `[a-z]+` | `abc` | empty string, `ABC` |
| `uppercase letter` | `[A-Z]` | `A`, `Z` | `a` |
| `uppercase letters` | `[A-Z]+` | `ABC` | empty string, `abc` |
| `hex digit` | `[0-9A-Fa-f]` | `0`, `9`, `a`, `F` | `g`, `٣`, `Ｆ` |
| `hex digits` | `[0-9A-Fa-f]+` | `09aF` | empty string, `0xFF` with `start` and `end` |
| `space` | `\s` | a space, tab or newline | `A` |
| `spaces` | `\s+` | one or more spaces, tabs or line breaks | empty string, `A` |
| `path segment character` | `[^\/\\\u{0}\u{a}\u{d}\u{2028}\u{2029}]` | `é`, `😀`, space, dot | slash, backslash, NUL, line break |
| `path segment characters` | the same class with `+` | one or more characters within a path component | empty string or a separator |
| `not space` | `\S` | `A` | a space |
| `digits` | `\d+` | `3`, `123` | `A` |
| `"ABC"` | `ABC` | `ABC` | `ABX` |
| `one of: a, b, c` | `[abc]` | `b` | `d` |
| `none of: a, b, c` | `[^abc]` | `d` | `b` |
| `text without: a, b, c` | `[^abc]*` | zero or more characters outside the list | `cab` with `start` and `end` |

`word`/`not word` use JavaScript's `\w`/`\W`; `digit`/`not digit` use `\d`/`\D`. These classes are ASCII-oriented with `u`; `i` plus `u` adds a few Unicode case-folding matches to `\w`. `\w` includes `_` but excludes `é`. The misleading `alphanumeric character` aliases are rejected.

`word character` is an explicit name for `word`; `word characters` means one or more of the same characters. Counts replace the plural default: `between 3 and 30 word characters` matches a 3–30 character identifier shape. Spaces, hyphens and most Unicode letters remain excluded. Each matched character follows JavaScript's `\w` semantics. The existing `word`, `not word` and reverse-translated `word` rules keep their behavior.

`letter` matches one ASCII letter, and `letters` matches one or more. They exclude digits, underscores and accented or other non-ASCII letters by default. They are not a Unicode alphabetic class. The optional `i` flag follows JavaScript case folding: equivalents such as the Kelvin sign `K` and long s `ſ` also match `[A-Za-z]` with `iu`. The explanation reports this when `i` is enabled. Counts and ranges replace the sequence default, as in `3 letters` or `between 2 and 4 letters`. Anchor the pattern to validate the whole string. Forms such as `letter characters`, `letter 3 times` and `not letter` are unsupported.

`lowercase letter(s)` and `uppercase letter(s)` match ASCII `[a-z]` and `[A-Z]` respectively. Without `i`, the opposite case does not match. With `i`, JavaScript ignores that distinction and also matches its Unicode case-folding equivalents; the workshop explanation makes the change explicit. These are still ASCII classes, not general Unicode lowercase or uppercase properties.

`space` matches one JavaScript whitespace character; `spaces` matches one or more. Both include tabs and line breaks, including Unicode line separators and nonbreaking spaces. Counts replace the plural default: `3 spaces` means exactly three whitespace characters, and `between 0 and 2 spaces` permits empty input. For ordinary U+0020 spaces only, use a quoted literal such as `3 " "`. Forms such as `spaces 3 times` and `not spaces` are unsupported; use `not space` for one non-whitespace character.

`path segment character` is a readable shortcut for one Unicode code point excluding slash, backslash, NUL and the four JavaScript line terminators (LF, CR, U+2028, U+2029). `path segment characters` means one or more; counts and ranges replace that default. For example, `between 1 and 32 path segment characters` replaces the explicit seven-item exclusion list without changing its generated regex. Optional, zero-count and open-ended repetition work normally. It accepts spaces, dots, punctuation and names such as `.` or `..`; it does not enforce filesystem policy, prevent path traversal or check file existence. Apply the destination platform and application rules separately.

Reverse translation recognizes a negative class excluding exactly those seven characters as `path segment character`, regardless of order, duplicates or equivalent escape spelling. For example, `[^/\\\0\n\r\u2028\u2029]` and `[^\u2029\r\x00\/\u2028\n\\/]` produce the same readable rule and canonical generated class. Fixed-width, code-point, padded and control-letter escapes are decoded before comparison. Missing or extra exclusions and positive lists keep their explicit `none of:` / `one of:` rules; translation never substitutes a different set.

`hex digit` matches one ASCII hexadecimal digit in either letter case. `hex digits` matches one or more; an exact count or bounded range replaces that default, as in `6 hex digits` or `between 2 and 4 hex digits`. They do not include a `0x` prefix, separators or non-ASCII digits. Add quoted literals for a required prefix, and anchors to validate the whole string.

A literal is a JSON-style double-quoted string. Escape `"` and `\\`; the compiler escapes regex metacharacters. Character-list items must each be one Unicode code point. Quote punctuation, commas, spaces and backslashes, as in `"]", "-", ",", "\\"`. Empty literals and lists are errors. A trailing list comma reports `INVALID_CHARACTER_LIST` at the comma itself, so the workshop’s **Go to error** action selects the separator to remove.

An empty literal such as `""` reports `EMPTY_LITERAL` at its opening quote and suggests `start` and `end` on separate lines. Those anchors produce `^$`, matching only empty input. A quoted space is still a valid literal, and an empty character-list item still reports the one-code-point requirement.

Single quotes, backticks and smart quotes are not string delimiters. Unsupported quoted literals such as `'ABC'` and multi-character list entries such as `one of: 'A'` suggest JSON double quotes, for example `"A"`. Their error codes and source locations remain unchanged. These quote characters are still valid matching data inside a JSON string or as individual one-code-point list items. An already JSON-quoted list item with several code points still reports the one-code-point requirement without a quote-style hint.

Whitespace after a closed quoted value is ignored. An unfinished quoted value retains its trailing whitespace for validation: a missing quote points to the actual line end, while raw control characters such as a tab still report their own position. This applies to literals and quoted character-list items, including after an anchor or count.

JSON strings may contain lone UTF-16 surrogates, such as `"\ud800"`. The compiler emits them as `\u{d800}` so copying a pattern or writing it as UTF-8 preserves the value. Separate surrogate items in a character list remain separate; a paired surrogate inside one quoted item represents one astral character.

Matching always uses Unicode code points (`u`), including for repeated literals. If a string ends with a lone high surrogate and starts with a lone low surrogate, concatenating copies forms a new astral character at the join. For example, `"\udc00A\ud800"` matches that string once, but `2 "\udc00A\ud800"` does not match its JavaScript `.repeat(2)` value: the joined code-point sequence differs. The compiler follows native JavaScript Unicode matching rather than treating paired surrogates as separate characters.

Unicode direction controls (`Bidi_Control`) remain literal matching data. Generated source, quoted explanations, diagnostics, trace text and match feedback show them as visible `\uXXXX` escapes: `"A\u202eB"` emits `A\u202eB`. Ordinary Arabic and Hebrew letters and emoji stay unchanged. `segments[].text` and editable inputs retain the original source; CLI `--json` escapes these controls in transit, so decoding the JSON restores the original metadata.

C0/C1 control characters, DEL and Unicode line separators are also displayed as escapes instead of raw control characters. C1 values such as U+009B emit `\u009b` in literals and character lists. Existing source escapes for C0, DEL and line separators keep their braced form, such as `\u{a}` and `\u{2028}`; quoted explanations and match feedback use visible JSON-style escapes. Matching and original source metadata remain unchanged.

`start` and `line start` may prefix the first atom on the same line, with or without a comma: `start 3 digits`.

## Word boundaries

`word boundary` emits `\b`; `not word boundary` emits `\B`. They test the current position without consuming characters and can appear inside groups, captures, alternatives and lookarounds. Their `BoundarySegment` metadata includes `negative` and the exact original location/generated span. Both directions preserve native JavaScript behavior.

```text
word boundary
"cat"
word boundary
```

This generates `/\bcat\b/u`. It finds `cat` in `😀cat!` and `écaté`, but does not match `scat`, `cats`, `_cat_` or `1cat2`. Here a word character is an ASCII letter, digit or underscore. With `i`, characters that fold to these ASCII word characters, such as `K` and `ſ`, also count. Other Unicode letters and combining marks do not become word characters merely because `u` is enabled. These assertions do not segment natural-language words; see the [native word-boundary semantics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Word_boundary_assertion).

Input edges have non-word status. Therefore `/\B/u` matches the empty input at position 0, while `/\b/u` does not. Search mode advances empty matches by Unicode code point through the existing worker; for `😀`, `\B` yields empty matches at UTF-16 positions 0 and 2.

Direct repetition reports `BOUNDARY_REPETITION`: `optional word boundary`, `3 not word boundary` and their lazy forms are invalid. Repeat a group containing the boundary and consuming items instead. Bare `lazy word boundary` reports `INVALID_LAZY_REPETITION`. Existing first/last anchor rules remain unchanged.

The quoted rule `"\b"` and a native class escape `[\b]` still mean backspace, not a boundary. A literal backslash followed by `b` is written `"\\b"`. The reverse translator distinguishes these contexts without approximating them.

<a name="groups-and-captures-unreleased-on-main"></a>

## Groups and captures

Open a block with `group {` for noncapturing grouping, `capture {` for a numbered capture, or `capture "name" {` for a named capture. Close it with `}` on its own line. Blocks can contain other blocks and any existing rule. Indentation is optional; braces inside quoted literals remain data.

```text
start
capture "date" {
  capture "year" {
    4 digits
  }
  "-"
  capture "month" {
    2 digits
  }
  "-"
  capture "day" {
    2 digits
  }
}
end
```

This generates `^(?<date>(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2}))$` with `u`. Against `2026-10-10`, group 1 (`date`) is `2026-10-10`, group 2 (`year`) is `2026`, group 3 (`month`) is `10`, and group 4 (`day`) is `10`. It checks a date shape, not calendar validity.

Captures are numbered by opening order, including named and nested captures; noncapturing groups do not use an index. Names must be JavaScript identifiers (Unicode names such as `année` work) and must be unique throughout the document. Empty blocks match empty text. A participating empty capture returns `""`; an optional capture that does not participate returns `undefined`. Repeated captures follow native JavaScript final-iteration semantics; an inner capture absent from the last repetition can become `undefined`, even if it participated earlier.

Existing repetition modifiers apply to a whole block: `optional capture "suffix" {`, `2 group {`, `between 2 and 4 group {`, `zero or more group {`, `one or more group {`, and `at least 2 group {`. Anchors retain their first/last rule restrictions within each block; input and line anchors cannot be mixed across blocks. Nesting is limited to 64 levels in addition to the existing source and line budgets.

The API keeps `{ source, flags, segments }`. Opening and closing braces produce `kind: "group"` segments with `edge`, `capturing`, `captureIndex`, `name`, and `repetition`. Each segment retains its original line, column, explanation and exact generated-source offsets. Consumers switching on `segments[].kind` should handle the added group variant. The CLI and workshop use this same compiler and trace. Groups, captures and their reverse translations are included in npm `0.1.0-dev.5` and the hosted workshop.

<a name="capture-references-unreleased-on-main"></a>

## Capture references

Use `same as capture "name"` or `same as capture 1` after the capture's closing brace. Named and numbered references refer to the same opening-order capture table. Numbers are positive ASCII integers; leading zeros are accepted and normalized. Existing repetition modifiers also work on references.

```text
start
capture "word" {
  letters
}
space
same as capture "word"
end
```

This produces `^(?<word>[A-Za-z]+)\s\k<word>$` with `u`: `cat cat` matches and `cat dog` does not. The `i` option changes comparison according to native JavaScript case folding. Numbered references are emitted inside a noncapturing boundary such as `(?:\1)` so following literal digits cannot accidentally turn reference 1 into reference 12. A reference to an absent optional capture matches empty text, and references to repeated captures use the final captured value.

Missing targets report `MISSING_CAPTURE_REFERENCE`; references before their target report `FORWARD_CAPTURE_REFERENCE`; references inside that target (including an enclosing capture) report `SELF_CAPTURE_REFERENCE`. Diagnostics point to the name or number. Forward and open/self references are valid in some JavaScript patterns and may match empty text; this language intentionally rejects them to make the dependency explicit. Duplicate names remain rejected. These are rule-language policies, not claims that JavaScript forbids those constructs.

Reference trace segments have `kind: "backreference"`, `reference` (string or number), resolved `captureIndex`, `repetition` and the usual source offsets and explanation. Reverse translation imports backward references under this same policy; unsupported forward/open references point to their original regex escape.

## Lookaround assertions

Assertions test the text around the current input position without consuming characters. Open a block with one of these four fixed phrases and close it with `}` on its own line:

| Block | Native source | Condition at the current position |
| --- | --- | --- |
| `followed by { … }` | `(?=…)` | The contents match starting here |
| `not followed by { … }` | `(?!…)` | The contents do not match starting here |
| `preceded by { … }` | `(?<=…)` | The contents match ending here |
| `not preceded by { … }` | `(?<!…)` | The contents do not match ending here |

```text
preceded by {
  capture "currency" {
    "USD"
  }
}
capture "amount" {
  digits
}
```

This generates `(?<=(?<currency>USD))(?<amount>\d+)` with `u`. Searching `USD123` consumes only `123` at UTF-16 span `[3, 6)`, while `currency` captures `USD` at `[0, 3)`. A positive lookahead can likewise capture text after the consumed match. The workshop shows these native spans without forcing them inside the full-match range. Entire-string mode still requires the consumed match to cover the entire input.

Blocks can contain groups, captures, alternatives, repetitions, anchors and other assertions, sharing the 64-level nesting, source and line budgets. Capture numbering remains opening order. Positive assertions retain native captures; captures in a successful negative assertion are absent. Empty positive assertions always succeed, and empty negative assertions always fail. Repetition is allowed inside an assertion or on a containing group. Directly quantifying an assertion, such as `optional followed by {`, reports `ASSERTION_REPETITION`; a bare `lazy followed by {` reports `INVALID_LAZY_REPETITION`.

JavaScript matches lookbehind contents backwards: in `/(?<=([ab]+)([bc]+))$/u` against `abc`, captures 1 and 2 are `a` and `bc`. Variable-length lookbehind is accepted when its contents belong to this language. Assertion atomicity and capture updates come from native JavaScript, following [ECMAScript assertion semantics](https://tc39.es/ecma262/2025/multipage/text-processing.html#sec-runtime-semantics-compileassertion); the explanation is structural, not an execution trace. Forward/open references remain rejected by source-order policy, even inside lookbehind where JavaScript can give them a different meaning. Duplicate names remain rejected.

Compilation probes native lookbehind support before emitting the first behind assertion. An unsupported runtime reports `UNSUPPORTED_TARGET_FEATURE` at that opening rule, with a repair hint; it never approximates the assertion. Ahead assertions do not need that probe. The public trace adds `AssertionSegment` with `kind: "assertion"`, `edge: "start" | "end"`, `direction: "ahead" | "behind"`, `negative`, and the usual exact source offsets, original locations and explanations. Consumers switching on segment kinds should handle this variant. These four forms and their reverse translation are included in npm `0.1.0-dev.5`.

## Repetition

A repetition modifier applies to the next item. Put it first: `3 digits`, `between 2 and 4 digits`, `optional "-"`, `zero or more digit`, `one or more any character`, or `at least 3 letter`. `optional <item>` is the same as `between 0 and 1 <item>` and generates `{0,1}`. The compiler keeps a multi-character literal together. `digits`, `hex digits`, `letters`, `lowercase letters`, `uppercase letters`, `spaces`, `word characters` and `path segment characters` mean one or more of their respective characters unless a count or range replaces that default. `any text` and `text without` already match sequences and cannot take another repetition modifier. Their `DUPLICATE_REPETITION` diagnostic suggests countable items: use `3 any character` or `between 2 and 4 none of: a, b` to set a length while keeping the same character rules. `any character` still excludes line breaks unless `s` is enabled; `none of:` excludes only its listed characters.

| Form | Generated source | Matches | Does not match |
| --- | --- | --- | --- |
| `3 <item>` (for example, `3 digits`) | `A{3}` | `AAA` | `AA` |
| `between 2 and 4 <item>` (for example, `between 2 and 4 digits`) | `A{2,4}` | `AA`, `AAA`, `AAAA` | `A`, `AAAAA` with `start` and `end` |
| `optional <item>` (for example, `optional "-"`) | `A{0,1}` | no item or one item | two items |
| `zero or more <item>` | `A*` | no item or any number of items | — |
| `one or more <item>` | `A+` | one item or more | no item |
| `at least 3 <item>` | `A{3,}` | three items or more | zero, one or two items |

Numeric counts are nonnegative integers no greater than 1,000, including both bounds of a range and the minimum in `at least`. Bounds are inclusive, and the upper count must be at least the lower count. Zero and equal bounds are valid: `between 0 and 1 "-"` and `optional "-"` both allow an optional hyphen, and `between 3 and 3 digits` matches exactly three digits. Anchors cannot be repeated: `3 start` and `optional start` report an error at `start`.

Write counts with ASCII digits `0`–`9`; leading zeros are allowed. Signs, fractions, scientific notation, hexadecimal notation, numeric separators and localized digits are unsupported count formats. Numeric-looking tokens such as `-1`, `1.5`, `1e2` or `٣` report `INVALID_REPETITION` at that token in exact, bounded and minimum counts. Every repetition modifier needs an item; `at least` also needs a minimum count. Incomplete forms report `INVALID_REPETITION` at the modifier with a complete example as a repair hint, including `at least`, `at least 3`, `zero or more` and `one or more`. Combining modifiers reports `DUPLICATE_REPETITION` at the second modifier, including an incomplete second `at least`. Quoted literals and character-list items can still contain these characters as data.

Repetition is greedy by default: try the largest count first, then use a smaller count if following rules require it. Prefix a repeated item with `lazy` to try its smallest count first, then expand when following rules require more. `lazy between 2 and 4 digits` emits `\d{2,4}?`, `lazy optional "AB"` emits `(?:AB){0,1}?`, and `lazy at least 3 digit` emits `\d{3,}?`. Implicit sequence rules accept it too: `lazy digits`, `lazy any text` and `lazy text without: "x"` emit `\d+?`, `.*?` and `[^x]*?`. Keywords remain case-insensitive. Write `lazy` before the repetition, not after it.

The modifier also applies to repeated `group`, `capture`, `either` and `same as capture` rules. It changes the order in which counts are tried, preserving native capture participation, final repeated values, references, branch order and Unicode atom boundaries. An exact count or equal-bounded range still has the same fixed count even when marked lazy. `lazy digit` and an unquantified block report `INVALID_LAZY_REPETITION` with a repair hint; bare or duplicated `lazy` is rejected. Count, line, source and depth limits still apply.

Greediness does not change leftmost search positions or guarantee the shortest entire match across alternatives. Both forms can backtrack to satisfy subsequent rules, following [ECMAScript quantifier semantics](https://tc39.es/ecma262/2025/multipage/text-processing.html#sec-runtime-semantics-repeatmatcher). Without anchors, `between 2 and 4 digits` can match part of `12345`; use `start` and `end` to validate the whole string. A counted multi-character literal stays together: `lazy between 2 and 4 "AB"` generates `(?:AB){2,4}?`, repeating the entire literal. Laziness is not a guarantee against excessive backtracking; use isolated matching for untrusted patterns.

Repetition metadata retains its existing discriminated `kind` and bounds, adding optional `lazy: true` in the AST and typed trace segments. Existing greedy results omit this field. Explanations describe the preferred count and the possibility of expansion, without presenting a runtime execution trace.

`zero or more one of: a, b` generates `[ab]*` and its explanation says `One of "a", "b". Zero or more times.` It accepts listed characters, including no characters. `zero or more none of: a, b` generates `[^ab]*` and keeps the exclusion explanation `Longest text without "a", "b".` These meanings also apply after reverse translation; the `i` option is included in explanations when enabled.

In the workshop, **Entire string** mode checks whether the pattern can cover the whole example, allowing greedy counts to backtrack to a complete match. **Search** mode shows JavaScript's first match, which may be shorter. For example, `between 0 and 2 "ab"` followed by `between 0 and 2 "abc"` can cover `ababc` completely, while the first search match is `abab`. Match feedback in both modes uses zero-based JavaScript string positions measured in UTF-16 code units: a match after `😀` starts at 2, as does a match after `e` plus a combining accent. When Entire string rejects a partial or empty match, its feedback still reports the first match and its position, such as `Found "A" at 2, not the entire string` for `"A"` against `😀A`. A pattern permitting zero characters can report an empty search match at 0. This mode choice does not change the regex that you copy; add anchors to your rules when the copied regex must validate a whole input. Partial matches also show a compact, escaped context preview with the matched portion highlighted; empty partial matches use a caret marker.

The public segment metadata for a bounded instruction has `repetition: { kind: "range", min: 2, max: 4 }`. Code that switches on `repetition.kind` should handle this new variant. Existing instructions keep their original metadata and matching behavior.

Malformed range syntax, a missing optional item or non-integer bounds report `INVALID_REPETITION`. Reversed bounds report `INVALID_RANGE` at the upper count, and a bound above 1,000 reports `REPETITION_LIMIT` at that count.

## Ordered alternatives

An `either {` block contains at least two choices, tried in source order. Each immediate entry is one choice; a nested `group {` block makes a choice containing a sequence. Captures and other `either` blocks can be choices too. For example:

```text
start
capture "pet" {
  either {
    "cat"
    "dog"
    "bird"
  }
}
end
```

This generates `^(?<pet>(?:cat|dog|bird))$` with `u`. Wrapping the choice in a noncapturing group keeps its precedence and capture numbering. Apply an existing modifier to the entire choice, such as `optional either {` or `2 either {`. An empty `group {` / `}` choice matches empty text; empty quoted literals remain invalid.

Use a group choice for multiple rules, including a start/end pair. `start "cat"` on one line remains one choice containing the anchor and literal. Anchor ordering is local to each choice or sequence; input and line anchors still cannot be mixed anywhere in the document. Nesting, source and line budgets apply to alternatives as well as groups. An empty or single-choice block reports `ALTERNATIVE_COUNT` at its opening rule.

Choices follow [ECMAScript disjunction semantics](https://tc39.es/ecma262/2025/multipage/text-processing.html#sec-runtime-semantics-compilesubpattern): earlier alternatives are tried first, including the following regex rules. A skipped branch has absent captures; repeating a choice can clear captures from an earlier iteration. References to those absent captures match empty text, following JavaScript. Capture names remain globally unique, even across mutually exclusive choices. No matching or backtracking is simulated by the explanation trace.

Alternative trace segments use `kind: "alternation"`, `edge: "start" | "branch" | "end"`, `alternatives` and `repetition`, plus the existing source/location/explanation fields. Separator segments navigate to the next choice's rule. Consumers switching on `segments[].kind` should handle this variant. Ordered alternatives and their reverse translation are included in npm `0.1.0-dev.5` and the hosted workshop.

## Unicode properties

Included in npm `0.1.0-dev.5`. A property rule consumes one Unicode code point selected by the target runtime:

| Rule | JavaScript source |
| --- | --- |
| `unicode property "Letter"` | `\p{Letter}` |
| `unicode property "L"` | `\p{L}` |
| `unicode property "General_Category=Letter"` | `\p{General_Category=Letter}` |
| `unicode property "Script=Greek"` | `\p{Script=Greek}` |
| `unicode property "Script_Extensions=Greek"` | `\p{Script_Extensions=Greek}` |
| `not unicode property "Lowercase_Letter"` | `\P{Lowercase_Letter}` |

Use one JSON-quoted alias or `property=value` pair. Rule keywords are case-insensitive, but native property names and values are case-sensitive: `Script=Greek` works, while `script=Greek`, `Script=greek` and lone `Greek` fail. General-category aliases such as `L`, binary properties such as `ASCII`, and native aliases such as `sc=Grek` or `scx=Grek` are accepted when the runtime recognizes them. Script and script extensions differ: `٢` does not match `Script=Thaana`, but does match `Script_Extensions=Thaana`.

Counts and `lazy` use their existing semantics: `lazy between 1 and 3 unicode property "Decimal_Number"` emits `\p{Decimal_Number}{1,3}?`. Properties work inside groups, captures, alternatives and lookarounds. For letters followed by optional combining marks:

```text
start
capture "text" {
  one or more group {
    unicode property "L"
    zero or more unicode property "M"
  }
}
end
```

This accepts `é`, `e` followed by a combining accent, `中文`, `عربي` and `اردو`. It describes a code-point pattern, not complete rules for a language, grapheme segmentation or Unicode normalization. `Letter` alone excludes combining marks, decimal digits and emoji. Classification follows the runtime's Unicode data and can change between Unicode editions. Existing `letter`, `digit` and `word` rules keep their ASCII/native shorthand semantics.

The compiler keeps complements as native `\P` escapes. In `u` mode with `i`, case folding happens after complementing: `/\P{Lowercase_Letter}/iu` matches `a`, whereas `/[^\p{Lowercase_Letter}]/iu` does not. Replacing one with the other would change matching. See [MDN's native property semantics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape) and the [ECMAScript property alias rules](https://tc39.es/ecma262/multipage/text-processing.html#sec-runtime-semantics-unicodematchproperty).

Compilation probes native property support and reports `UNSUPPORTED_TARGET_FEATURE` at the rule when unavailable. Unknown aliases report `INVALID_UNICODE_PROPERTY` at the quoted value; malformed quotes and trailing text retain their existing positioned diagnostics. The typed `UnicodePropertySegment` carries the exact property alias, `propertyType` (`character` or `string`), complement polarity, repetition and source span. Reverse translation preserves standalone `\p{…}` / `\P{…}` aliases, counts, flags and capture behavior. Properties also work inside the composable classes below. String properties require explicit v mode and follow the native string semantics documented below.

## Composable character classes

Included in npm `0.1.0-dev.5`. A u-mode class unions its members and consumes one Unicode code point. Keep the existing `one of:` and `none of:` literal lists, or combine ranges, native shorthands and character properties:

```text
start
capture "word" {
  one or more character class: unicode property "L", unicode property "M", "_"
}
end
```

This emits `^(?<word>[\p{L}\p{M}_]+)$` with `u`, accepting `e` followed by a combining accent, `हिन्दी`, `中文` and `اردو`. Membership alone does not validate a language, grapheme boundaries or normalization. Members are separated by commas outside JSON-quoted strings:

| Member | Native class content | Meaning |
| --- | --- | --- |
| `"_"`, `","`, `"😀"` | literal code points | Exactly one Unicode code point per literal; quote punctuation and whitespace. |
| `range "α" to "ω"` | `α-ω` | Inclusive Unicode code-point interval; both endpoints are single code points in ascending order. |
| `digit`, `not digit` | `\d`, `\D` | ASCII digits 0–9 and their native complement. |
| `word`, `not word` | `\w`, `\W` | Native JavaScript word status, including u/i folding where applicable. |
| `space`, `not space` | `\s`, `\S` | Native whitespace, including line breaks, and its complement. |
| `unicode property "L"` | `\p{L}` | Native property membership with a case-sensitive alias. |
| `not unicode property "Ll"` | `\P{Ll}` | The native property complement, kept distinct from outer-class negation. |
| `string "ab"` | `\q{ab}` | A finite string member, requiring v mode; `string ""` permits an empty match. |

The standalone rule `range "😀" to "🙏"` emits `[😀-🙏]`. Ranges follow code-point order, not alphabetical or locale order; `range "E" to "f"` includes punctuation between the uppercase and lowercase ASCII blocks. JSON escapes may express controls or lone surrogates. Escaping depends on class context; quoted `-`, `]`, `\\`, `^`, `/` and comma remain literal members.

`not character class: unicode property "Lowercase_Letter"` emits `[^\p{Lowercase_Letter}]`. `character class: not unicode property "Lowercase_Letter"` emits `[\P{Lowercase_Letter}]`. With `i` in `u` mode, the former rejects `a` and the latter accepts it. The compiler does not distribute negation or normalize either form into the other. Counts and `lazy` apply to the whole class, such as `lazy between 1 and 3 character class: digit, "_"`; members cannot have their own repetition. Use singular shorthand names: `digit` is a member, while `digits` already means a repeated sequence and is rejected in a class.

The typed `CharacterClassSegment` exposes `negative`, `repetition` and `members`. Each `CharacterClassMember` retains its discriminator, literal/range/shorthand/property data, original `location` and `text`, and exact generated `sourceStart`, `sourceEnd` and `source`. Property members additionally retain their value location and complement polarity. The CLI and isolated workshop use the shared compiler and explanation trace.

Reverse translation preserves native u/v-mode unions, ranges, shorthand/property complements and outer negation, including captures, counts and flags. Existing recognized ASCII classes and simple literal lists keep their compact output. Empty classes `[]` can be imported in v mode through an empty union block; u-mode empty classes remain explicitly unsupported. Invalid rule members, bounds, missing commas, quotes and property aliases receive positioned diagnostics. [MDN's class reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class) describes the native range, union and context-sensitive escape rules.

## Native Unicode string sets

Included in npm `0.1.0-dev.5` and the workshop. Select `{ flags: "v" }`, CLI `--flags v` or the workshop's v mode. A finite list uses JSON-quoted strings; the original `one of:` list continues to require single code points:

```text
capture "value" {
  one of strings: "a", "ab", ""
}
```

This emits `(?<value>[\q{a|ab|}])` with v. The native set tries longer members first, regardless of list order: searching `ab` captures `ab`. Adding a following `"b"` rule can require the shorter `a` member. This differs from ordered `either` branches, where the first successful branch wins. Empty strings are permitted and may match without consuming input; worker enumeration still advances a whole Unicode code point and retains its deadline. Repetition, lazy count preference, captures, assertions and global/sticky cursor behavior remain native. A class can combine finite strings with characters or properties, such as `character class: string "ab", digit, unicode property "RGI_Emoji"`.

`unicode property "RGI_Emoji"` emits native `\p{RGI_Emoji}`. The seven ECMAScript string properties are `Basic_Emoji`, `Emoji_Keycap_Sequence`, `RGI_Emoji_Modifier_Sequence`, `RGI_Emoji_Flag_Sequence`, `RGI_Emoji_Tag_Sequence`, `RGI_Emoji_ZWJ_Sequence` and `RGI_Emoji`. One match may consume several code points, including a complete family emoji. Membership follows the runtime's Unicode edition; this is not a general grapheme segmenter or emoji-normalization API. Property aliases are case-sensitive. A missing v flag reports `UNICODE_SETS_REQUIRED`; a missing native feature reports positioned `UNSUPPORTED_TARGET_FEATURE`.

String properties cannot use `not unicode property`. A negated class may contain finite strings only when every member is exactly one code point: `not character class: string "a", string "😀"` is valid. An empty or multi-code-point member, or any string property, reports `INVALID_STRING_COMPLEMENT`. This is a structural restriction, independent of which strings happen to match.

Reverse translation preserves `\q{…}` strings and native property aliases. Separate surrogate code-point escapes inside one native string retain their boundaries using `string code points: "\ud83d" + "\ude00"`, also permitted as a class member. Each quoted sequence item must be one code point; `+` separates items and does not mean repetition. The emitted `\q{\u{d83d}\u{de00}}` remains distinct from a literal emoji. Installed WebKit treats these sources differently; retaining the native code-point sequence avoids changing an imported match. A sequence with two parts also remains structurally non-complementable, even when concatenating its UTF-16 values would form one emoji. Typed class members expose `kind: "strings"` with `values`, or `kind: "stringCodePoints"` with `codePoints`, plus their original location and exact output span.

See the [ECMAScript string-property table](https://tc39.es/ecma262/multipage/text-processing.html#table-binary-unicode-properties-of-strings), [native structural string checks](https://tc39.es/ecma262/multipage/text-processing.html#sec-static-semantics-maycontainstrings) and [MDN's native string-set examples](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class#v-mode_character_class).

## Nested Unicode set operations

Included in npm `0.1.0-dev.5`; native set operations require v mode. Open a block with `character set union {`, `character set intersection {` or `character set subtraction {`; close it with `}` on its own line. Each body line contributes one operand. Nest a block to combine different operations explicitly:

```text
capture "consonant" {
  character set subtraction {
    character set intersection {
      unicode property "Letter"
      unicode property "ASCII"
    }
    one of: "a", "e", "i", "o", "u"
  }
}
```

This emits `(?<consonant>[[\p{Letter}&&\p{ASCII}]--[aeiou]])` with v. Without i, searching `éab` captures `b`. Union accepts members from any operand; intersection requires membership in every operand; subtraction takes the first operand and removes members of each following operand. Native `&&` and `--` remain inside character classes, preserving string-set matching, backtracking, captures and cursor behavior. These operations do not become ordered alternatives.

An operand may be a one-code-point quoted literal, range, singular shorthand, character list, composable class, character/string property, finite string set, explicit string code-point sequence or nested set block. Use `string "ab"` for a multi-point member, not the literal rule `"ab"`. Existing `letter`, `hex digit` and `path segment character` classes also work. Repeated operands, groups, assertions, references, boundaries and the flag-sensitive `any character` wildcard are not operands. Repetition belongs on the outer block, for example `lazy between 1 and 3 character set intersection {`.

Intersection and subtraction need at least two operands; union permits zero. An empty union emits `[]` and matches nothing. `not character set union {` with an empty body emits `[^]` and matches any single Unicode code point, including a line break. An empty finite string remains distinct and can match without consuming input.

Prefix a block with `not` to complement the complete set. Native structural string restrictions apply even if the computed set happens to be empty: a complemented union must have no string-containing operands; a complemented intersection needs at least one character-only operand; a complemented subtraction needs a character-only first operand. Thus intersecting `string "ab"` with `digit` can be complemented, while subtracting `string "ab"` from itself cannot. Nested complements are validated independently. Runtime case folding and Unicode membership remain native to the selected engine.

`CharacterClassSegment.operation` identifies the root operation; nested `CharacterClassMember` values use `kind: "set"`, `operation`, `negative`, `members` and `endLocation`. Root and child spans preserve exact emitted source, including operator spacing and required range brackets. Explanations use the same typed tree. The reverse reader preserves operations through these blocks while retaining existing compact leaf normalization and original-regex diagnostic positions. Groups and set blocks share the 64-level depth budget and existing input/source limits. Invalid arity, operands, block forms, missing braces, modes, native capabilities and structural complements receive positioned errors.

## Anchors and flags

The source compiler accepts all eight native JavaScript flags: `d` (indices), `g` (global), `i` (ignore case), `m` (multiline), `s` (dot-all), `u` (Unicode), `v` (Unicode sets) and `y` (sticky). It emits `u` by default unless `v` is selected, adds `m` for any line anchor and returns canonical `dgimsuvy` ordering. `u` and `v` are mutually exclusive. The CLI accepts `--flags FLAGS` or `--flags=FLAGS`; `--ignore-case` / `--dot-all` remain aliases for i/s. Flags require native runtime support and are never dropped or approximated.

In the JavaScript API, `options.flags` must be a string of unique flag letters, in any order. Omitting it, passing `undefined` or using an empty string keeps the defaults. Duplicates, unknown letters, whitespace, u/v conflicts and non-string values such as `null` report `UNSUPPORTED_FLAGS` at 1:1. An unsupported runtime flag reports `UNSUPPORTED_TARGET_FEATURE` at 1:1. No dependencies or fallback engine are required.

With `m`, input `start` emits `^(?<![\s\S])` and input `end` emits `$(?![\s\S])`; line anchors still emit native `^` / `$`. The native edge guards also prevent an engine from testing these absolute assertions inside a surrogate pair. Absolute input start in this mode requires native lookbehind, with a positioned capability error at the anchor if unavailable. Without `m`, input anchors retain `^` / `$`. Group and alternative source spans include the exact chosen fragments.

Native g/y regexes are stateful: repeated `.exec()` / `.test()` calls use and update `lastIndex`, and failure resets it to zero. Sticky y requires a match exactly at that cursor. The workshop starts each example at 0, resets both its matcher and whole-string fallback between examples, and uses internal g/d flags once for capture enumeration/indices. Search lists up to 100 matches; y stops at the first gap, and empty matches advance by one Unicode code point. Copied regexes retain the selected flags and native cursor behavior.

Native v mode uses its own class escaping and case-folding/complement semantics. For example, `not unicode property "Lowercase_Letter"` with i/u can match `a`, while i/v cannot: native u folds after complementing and native v folds before. Outer class negation remains separate. Supported literals, ranges, shorthands and character properties work in either mode; finite strings and string properties require v. Nested v sets and intersection/subtraction remain explicit unsupported features.

Without `m`, JavaScript `^` and `$` match only the true start and end of input. For example, `start "A"` / `end` rejects `A` followed by a line break. With `m`, line anchors match line boundaries. Other regex engines may behave differently.

## Reverse translation

The JavaScript API `regexToRules(regex)` and the workshop's **Already have a regex?** control translate a bounded subset back into editable rules. The input must use `u` or `v`. Returned `flags` preserves d/g/i/m/s/v/y as compile options; default u is implicit for compatibility. Native multiline anchors become `line start` / `line end`. Supported input includes literals, edge anchors, word/non-word boundaries, standalone Unicode character properties, `\d`/`\w`/`\s` and their complements, common ASCII digit/letter/word/hex classes, composable character classes, greedy/lazy repetition, capturing/noncapturing groups, nested groups, positive/negative lookahead/lookbehind and backward named/numbered references. Open-ended repetition becomes `zero or more`, `one or more` or `at least N`. Captures retain names, numbering and values, including empty and absent groups; Unicode escapes in capture names are decoded to identifiers. Literal-only noncapturing groups keep their compact literal-rule normalization. Composite groups become editable blocks.

The workshop expects a slash-delimited JavaScript literal, such as `/^a\nb$/u`. Physical LF, CR, U+2028 and U+2029 line breaks inside its pattern are rejected with an escape hint, including inside character classes or after a backslash. Escaped line breaks remain valid matching data. Whitespace outside the literal is ignored for translation but counts toward the input budget of 16,392 UTF-16 code units, together with delimiters and flags. The workshop and CLI reject larger input before trimming or native syntax validation; the independent regex-source ceiling remains 16,384 code units. The library accepts genuine `RegExp` objects directly, including those created in another JavaScript context such as an iframe or Node's `vm`. Lookalike objects are rejected with `TypeError`; translation does not run the input pattern or change its `lastIndex`. Native getters supply the stored pattern and flags without serializing the regex or reading overridden metadata or custom `Symbol.match` getters, so subclass and own-property overrides are ignored; unsupported native flags and syntax still receive the same diagnostics.

ASCII letter classes accept `[A-Za-z]` and `[a-zA-Z]`, producing `letter`. Hex classes accept all six orders of the `0-9`, `A-F` and `a-f` ranges, including `[0-9a-fA-F]` and `[A-Fa-f0-9]`, producing `hex digit`. Recompilation uses the canonical `[A-Za-z]` or `[0-9A-Fa-f]` order with equivalent matching. Other ranges and negated letter/hex classes use composable character-class rules without replacing their membership with a shorthand.

Complete ASCII word classes such as `[A-Za-z0-9_]` become `word` (`\w`), while `[^A-Za-z0-9_]` becomes `not word` (`\W`). The complete `A-Z`, `a-z`, `0-9` ranges and `_` may appear in any order or repeat. Matching and i/s/m/u flags are preserved, including the Unicode case-folding equivalents `K` and `ſ` under `iu`. Missing ranges or underscores, extra characters and different ranges keep explicit class members; `[A-Za-z0-9]` is not replaced by `word` because it excludes `_`.

Unicode code-point escapes accept leading zeros: `\u{00000041}` becomes `"A"`, and `\u{0001f600}` becomes `"😀"`. These spellings work in literals, character lists and non-capturing literal groups. The code point must remain at most U+10FFFF, and the complete native regex source remains limited to 16,384 UTF-16 code units; padding does not bypass that limit.

A hyphen at the beginning or end of a simple character list is literal: `[._-]` and `[-._]` translate into `one of:` rules, while `[^._-]` and `[^-._]` translate into `none of:` rules. `[-]` becomes the literal `"-"`. Generated character classes escape the hyphen as `\-`. Escaped hyphens can appear anywhere in a list. Range forms such as `[a-c-]`, `[--a]` and `[---]` preserve their native endpoint/literal distinctions as composable class members.

Control-letter escapes `\cA`–`\cZ` and `\ca`–`\cz` translate inside literals, character lists and non-capturing literal groups. As specified by [ECMAScript](https://tc39.es/ecma262/2026/multipage/text-processing.html#sec-patterns-static-semantics-character-value), each letter's ASCII value modulo 32 gives its control character; uppercase and lowercase spellings match the same value. For example, `/^\cJ{2}$/u` becomes `start`, `2 "\n"`, `end` on separate lines. Controls remain visibly escaped in rules and generated source. Non-letter forms such as `\c0` and `[\c_]` are invalid with the required `u` flag; legacy non-Unicode regexes remain unsupported.

Unicode escapes preserve regex atom boundaries. A fixed-width surrogate pair such as `\uD83D\uDE00` is one emoji atom: `/\uD83D\uDE00+/u` repeats the whole emoji, and `[\uD83D\uDE00]` matches that emoji rather than either lone surrogate. Separate code-point escapes such as `\u{D83D}\u{DE00}` remain separate atoms and must not be merged into `"😀"`. Groups containing these adjacent separate atoms become blocks with separate quoted rules, preserving their boundaries even when the entire group repeats.

Empty non-capturing groups such as `(?:)` translate to `0 any character`, generating `.{0}`. Supported greedy repetitions of an empty group also become this zero-count rule, preserving its empty match and the surrounding atom boundaries. For example, `/a(?:)+b/u` becomes `"a"`, `0 any character`, `"b"` on separate lines. An empty pattern created with `new RegExp("", "u")` translates the same way. Search mode finds its empty match at position 0 even in nonempty input; Entire string mode accepts only blank input for that standalone pattern. Lazy empty-group repetitions retain `lazy` on the zero-count rule, such as `lazy 0 any character` for `(?:)*?`; no characters are consumed in either case. Repetition limits still apply.

The empty negative class `[^]` matches any Unicode code point, including line breaks, so it becomes `any character` with the returned `s` option enabled. When the same regex also contains ordinary `.` atoms, those rules become `none of: "\\n", "\\r", "\\u2028", "\\u2029"` so they still exclude JavaScript line terminators under `s`. The empty positive class `[]`, which matches nothing, remains unsupported.

Unsupported syntax is rejected with a column diagnostic; it is never dropped or approximated. This includes forward/open references, empty character classes, v-set operations and flags other than `i`, `m`, `s`, `u`. The translator requires `u` because this language always matches Unicode code points. Nested groups, alternatives and assertions share the 64-level translated-block budget and the translated source/line budgets. Forward/open reference failures report `UNSUPPORTED_REGEX` at the original reference escape; they are not silently replaced by empty text.

Top-level and grouped `|` alternatives translate to ordered `either` blocks, including alternatives inside captures. Sequence choices become noncapturing `group` blocks; empty choices become empty group blocks. For example, `/cat|dog|bird/u` becomes an `either` block with three quoted entries, while `/^a|b$/u` retains its separately anchored branches. Additional editable blocks can reach the translated-depth budget before the native group-depth budget; that error points into the original regex and names the translated limit. Escaped pipes such as `\|` and character-class pipes such as `[|]` stay literal matching data. Misplaced anchors retain their own anchor diagnostic.

Lookahead assertions `(?=AB)` / `(?!AB)` and lookbehind assertions `(?<=A)` / `(?<!A)` become the four assertion blocks above, preserving zero-width behavior, nested captures and native matching direction. Unsupported child constructs still fail at their original regex position: `/^😀(?=ab[])a/u` reports the empty class's `[` at column 9. Captures and supported composite groups translate without removing their semantics. Literal parentheses such as `\(` or `[()]` remain supported. Unsupported contents are not stripped to force conversion.

For positioned unsupported-syntax errors, the workshop's **Go to regex error** action focuses the regex field, selects the source character and brings it into view, including wrapped patterns and enlarged fields. Selection includes the opening slash and any leading whitespace when converting the pattern's UTF-16 column into the pasted field's position. Editing the field clears the stale action; a successful translation focuses the rules editor.

The regex source and the translated rules are each limited to 16,384 UTF-16 code units; translated rules also have the 200-line limit. Escaping and separate atoms can expand a short regex beyond those output limits. These errors retain `SOURCE_LIMIT` or `LINE_LIMIT`, explicitly name the translated rules and point to line 1, column 1 for the whole regex, with a simplification hint. Syntax columns refer to `regex.source`, excluding slash delimiters and flags. An oversized regex source still reports `REGEX_SOURCE_LIMIT` at its first code unit beyond the input limit. Translation errors leave existing workshop rules and options intact.

## Errors and future syntax

Unknown phrases, unsupported repetition forms, invalid quoted strings, duplicate or misplaced anchors, unsupported flags, excessive input and counts above 1,000 return a diagnostic with a line and column. Quoted-string errors point to invalid escapes or control characters; missing quotes point to line end. Duplicate repetition errors point to the second modifier. Overlength input points just after the 16,384-code-unit limit. Lines and columns are one-based; columns count UTF-16 code units, like JavaScript string indices. Inputs are limited to 16,384 UTF-16 code units and 200 input lines, including blank lines; a final newline does not count as another line. The compiler and reverse translator do not silently emit a partial success. General regex syntax beyond the documented reverse subset remains outside version 1. Any future syntax needs examples, counterexamples and compatibility tests before it enters this contract.
