# The Regex For Humans language

Version 1 compiles fixed English rules into JavaScript `RegExp`. It does not guess from free-form text or examples.

Write one rule per line. `start` or `line start` can prefix the first rule. Keywords are case-insensitive; quoted text keeps its case. Leading and trailing spaces are ignored.

Separate rules with LF, CRLF, CR, U+2028 or U+2029.

When using both anchor edges, pair `start` with `end`, or `line start` with `line end`. Mixing them reports `MIXED_ANCHORS` at the end anchor and suggests these compatible pairs. A single anchor can still be used alone.

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
| `not word` | `\W` | `-`, `é` | `A`, `_` |
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
| `not space` | `\S` | `A` | a space |
| `digits` | `\d+` | `3`, `123` | `A` |
| `"ABC"` | `ABC` | `ABC` | `ABX` |
| `one of: a, b, c` | `[abc]` | `b` | `d` |
| `none of: a, b, c` | `[^abc]` | `d` | `b` |
| `text without: a, b, c` | `[^abc]*` | zero or more characters outside the list | `cab` with `start` and `end` |

`word`/`not word` use JavaScript's `\w`/`\W`; `digit`/`not digit` use `\d`/`\D`. These classes are ASCII-oriented with `u`; `i` plus `u` adds a few Unicode case-folding matches to `\w`. `\w` includes `_` but excludes `é`. The misleading `alphanumeric character` aliases are rejected.

`letter` matches one ASCII letter, and `letters` matches one or more. They exclude digits, underscores and accented or other non-ASCII letters by default. They are not a Unicode alphabetic class. The optional `i` flag follows JavaScript case folding: equivalents such as the Kelvin sign `K` and long s `ſ` also match `[A-Za-z]` with `iu`. The explanation reports this when `i` is enabled. Counts and ranges replace the sequence default, as in `3 letters` or `between 2 and 4 letters`. Anchor the pattern to validate the whole string. Forms such as `letter characters`, `letter 3 times` and `not letter` are unsupported.

`lowercase letter(s)` and `uppercase letter(s)` match ASCII `[a-z]` and `[A-Z]` respectively. Without `i`, the opposite case does not match. With `i`, JavaScript ignores that distinction and also matches its Unicode case-folding equivalents; the workshop explanation makes the change explicit. These are still ASCII classes, not general Unicode lowercase or uppercase properties.

`space` matches one JavaScript whitespace character; `spaces` matches one or more. Both include tabs and line breaks, including Unicode line separators and nonbreaking spaces. Counts replace the plural default: `3 spaces` means exactly three whitespace characters, and `between 0 and 2 spaces` permits empty input. For ordinary U+0020 spaces only, use a quoted literal such as `3 " "`. Forms such as `spaces 3 times` and `not spaces` are unsupported; use `not space` for one non-whitespace character.

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

## Repetition

A repetition modifier applies to the next item. Put it first: `3 digits`, `between 2 and 4 digits`, `optional "-"`, `zero or more digit`, `one or more any character`, or `at least 3 letter`. `optional <item>` is the same as `between 0 and 1 <item>` and generates `{0,1}`. The compiler keeps a multi-character literal together. `digits`, `hex digits`, `letters`, `lowercase letters`, `uppercase letters` and `spaces` mean one or more of their respective characters unless a count or range replaces that default. `any text` and `text without` already match sequences and cannot take another repetition modifier. Their `DUPLICATE_REPETITION` diagnostic suggests countable items: use `3 any character` or `between 2 and 4 none of: a, b` to set a length while keeping the same character rules. `any character` still excludes line breaks unless `s` is enabled; `none of:` excludes only its listed characters.

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

Ranges are greedy: they try the largest count first and may use a smaller count to satisfy following rules. Without anchors, `between 2 and 4 digits` can match part of `12345`; use `start` and `end` to validate the whole string. `between 2 and 4 "AB"` generates `(?:AB){2,4}`, repeating the entire literal.

In the workshop, **Entire string** mode checks whether the pattern can cover the whole example, allowing greedy counts to backtrack to a complete match. **Search** mode shows JavaScript's first match, which may be shorter. For example, `between 0 and 2 "ab"` followed by `between 0 and 2 "abc"` can cover `ababc` completely, while the first search match is `abab`. Search feedback uses zero-based JavaScript string positions measured in UTF-16 code units: a match after `😀` starts at 2, as does a match after `e` plus a combining accent. A pattern permitting zero characters can report an empty search match at 0. This mode choice does not change the regex that you copy; add anchors to your rules when the copied regex must validate a whole input.

The public segment metadata for a bounded instruction has `repetition: { kind: "range", min: 2, max: 4 }`. Code that switches on `repetition.kind` should handle this new variant. Existing instructions keep their original metadata and matching behavior.

Malformed range syntax, a missing optional item or non-integer bounds report `INVALID_REPETITION`. Reversed bounds report `INVALID_RANGE` at the upper count, and a bound above 1,000 reports `REPETITION_LIMIT` at that count.

## Anchors and flags

The compiler emits `u` by default for Unicode code-point behavior. It adds `m` when a line anchor is used. It allows `i` (ignore case) and `s` (dot matches newline) as explicit options. It rejects a mix of input anchors and line anchors in one document because JavaScript's `m` flag would change the meaning of `^` and `$` for both. Global and sticky flags (`g`, `y`) are outside version 1 because repeated `.test()` calls with them are stateful.

In the JavaScript API, `options.flags` must be a string containing unique `i` and/or `s` flags. Omitting it, passing `undefined` or using an empty string keeps the defaults. Other values, including `null`, report `UNSUPPORTED_FLAGS`.

Without `m`, JavaScript `^` and `$` match only the true start and end of input. For example, `start "A"` / `end` rejects `A` followed by a line break. With `m`, line anchors match line boundaries. Other regex engines may behave differently.

## Reverse translation

The JavaScript API `regexToRules(regex)` and the workshop's **Already have a regex?** control translate a bounded subset back into editable rules. The input must be a JavaScript `RegExp` using `u`; `i` and `s` return as compile options, while `m` becomes `line start` / `line end` rules. Supported input includes literals, edge anchors, `\d`/`\w`/`\s` and their complements, common ASCII digit/letter/hex classes, simple character lists, greedy repetition, and non-capturing groups containing literal text. Open-ended repetition becomes `zero or more`, `one or more` or `at least N`.

The workshop expects a slash-delimited JavaScript literal, such as `/^a\nb$/u`. Physical LF, CR, U+2028 and U+2029 line breaks inside its pattern are rejected with an escape hint, including inside character classes or after a backslash. Escaped line breaks remain valid matching data. Whitespace outside the literal is ignored. The library accepts `RegExp` objects directly.

ASCII letter classes accept `[A-Za-z]` and `[a-zA-Z]`, producing `letter`. Hex classes accept all six orders of the `0-9`, `A-F` and `a-f` ranges, including `[0-9a-fA-F]` and `[A-Fa-f0-9]`, producing `hex digit`. Recompilation uses the canonical `[A-Za-z]` or `[0-9A-Fa-f]` order with equivalent matching. Other ranges and negated letter/hex classes remain unsupported.

Control-letter escapes `\cA`–`\cZ` and `\ca`–`\cz` translate inside literals, character lists and non-capturing literal groups. As specified by [ECMAScript](https://tc39.es/ecma262/2026/multipage/text-processing.html#sec-patterns-static-semantics-character-value), each letter's ASCII value modulo 32 gives its control character; uppercase and lowercase spellings match the same value. For example, `/^\cJ{2}$/u` becomes `start`, `2 "\n"`, `end` on separate lines. Controls remain visibly escaped in rules and generated source. Non-letter forms such as `\c0` and `[\c_]` are invalid with the required `u` flag; legacy non-Unicode regexes remain unsupported.

Unicode escapes preserve regex atom boundaries. A fixed-width surrogate pair such as `\uD83D\uDE00` is one emoji atom: `/\uD83D\uDE00+/u` repeats the whole emoji, and `[\uD83D\uDE00]` matches that emoji rather than either lone surrogate. Separate code-point escapes such as `\u{D83D}\u{DE00}` remain separate atoms and must not be merged into `"😀"`. A literal group containing separate adjacent high/low surrogate atoms is rejected because one literal rule cannot preserve those boundaries.

Unsupported syntax is rejected with a column diagnostic; it is never dropped or approximated. This includes alternation, captures, lookaround, backreferences, word boundaries, lazy quantifiers, unknown character ranges and flags other than `i`, `m`, `s`, `u`. The translator requires `u` because this language always matches Unicode code points. Non-capturing literal groups are accepted as input only; groups are not rule-language syntax.

The regex source and the translated rules are each limited to 16,384 UTF-16 code units; translated rules also have the 200-line limit. Escaping and separate atoms can expand a short regex beyond those output limits. These errors retain `SOURCE_LIMIT` or `LINE_LIMIT`, explicitly name the translated rules and point to line 1, column 1 for the whole regex, with a simplification hint. Syntax columns refer to `regex.source`, excluding slash delimiters and flags. An oversized regex source still reports `REGEX_SOURCE_LIMIT` at its first code unit beyond the input limit. Translation errors leave existing workshop rules and options intact.

## Errors and future syntax

Unknown phrases, unsupported repetition forms, invalid quoted strings, duplicate or misplaced anchors, unsupported flags, excessive input and counts above 1,000 return a diagnostic with a line and column. Quoted-string errors point to invalid escapes or control characters; missing quotes point to line end. Duplicate repetition errors point to the second modifier. Overlength input points just after the 16,384-code-unit limit. Lines and columns are one-based; columns count UTF-16 code units, like JavaScript string indices. Inputs are limited to 16,384 UTF-16 code units and 200 input lines, including blank lines; a final newline does not count as another line. The compiler and reverse translator do not silently emit a partial success. General regex syntax beyond the documented reverse subset remains outside version 1. Any future syntax needs examples, counterexamples and compatibility tests before it enters this contract.
