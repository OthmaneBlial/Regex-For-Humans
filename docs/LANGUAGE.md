# The Regex For Humans language

Version 1 compiles fixed English rules into JavaScript `RegExp`. It does not guess from free-form text or examples.

Write one rule per line. `start` or `line start` can prefix the first rule. Keywords are case-insensitive; quoted text keeps its case. Leading and trailing spaces are ignored.

Separate rules with LF, CRLF, CR, U+2028 or U+2029.

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
| `hex digit` | `[0-9A-Fa-f]` | `0`, `9`, `a`, `F` | `g`, `٣`, `Ｆ` |
| `hex digits` | `[0-9A-Fa-f]+` | `09aF` | empty string, `0xFF` with `start` and `end` |
| `space` | `\s` | a space, tab or newline | `A` |
| `not space` | `\S` | `A` | a space |
| `digits` | `\d+` | `3`, `123` | `A` |
| `"ABC"` | `ABC` | `ABC` | `ABX` |
| `one of: a, b, c` | `[abc]` | `b` | `d` |
| `none of: a, b, c` | `[^abc]` | `d` | `b` |
| `text without: a, b, c` | `[^abc]*` | zero or more characters outside the list | `cab` with `start` and `end` |

`word`/`not word` use JavaScript's `\w`/`\W`; `digit`/`not digit` use `\d`/`\D`. These classes are ASCII-oriented with `u`; `i` plus `u` adds a few Unicode case-folding matches to `\w`. `\w` includes `_` but excludes `é`. The misleading `alphanumeric character` aliases are rejected.

`hex digit` matches one ASCII hexadecimal digit in either letter case. `hex digits` matches one or more; an exact count or bounded range replaces that default, as in `6 hex digits` or `between 2 and 4 hex digits`. They do not include a `0x` prefix, separators or non-ASCII digits. Add quoted literals for a required prefix, and anchors to validate the whole string.

A literal is a JSON-style double-quoted string. Escape `"` and `\\`; the compiler escapes regex metacharacters. Character-list items must each be one Unicode code point. Quote punctuation, commas, spaces and backslashes, as in `"]", "-", ",", "\\"`. Empty literals and lists are errors.

JSON strings may contain lone UTF-16 surrogates, such as `"\ud800"`. The compiler emits them as `\u{d800}` so copying a pattern or writing it as UTF-8 preserves the value. Separate surrogate items in a character list remain separate; a paired surrogate inside one quoted item represents one astral character.

`start` and `line start` may prefix the first atom on the same line, with or without a comma: `start 3 digits`.

## Repetition

A count or range applies to the next item. Put it first (`3 digits` or `between 2 and 4 digits`). The compiler keeps a multi-character literal together. `digits` and `hex digits` mean one or more of their respective characters unless a count or range replaces that default. `any text` and `text without` already match sequences and cannot take another count or range. Other repetition wording, such as `at least 3 times`, is not supported.

| Form | Generated source | Matches | Does not match |
| --- | --- | --- | --- |
| `3 <item>` (for example, `3 digits`) | `A{3}` | `AAA` | `AA` |
| `between 2 and 4 <item>` (for example, `between 2 and 4 digits`) | `A{2,4}` | `AA`, `AAA`, `AAAA` | `A`, `AAAAA` with `start` and `end` |

Numeric counts are nonnegative integers no greater than 1,000, including both bounds of a range. Bounds are inclusive, and the upper count must be at least the lower count. Zero and equal bounds are valid: `between 0 and 1 "-"` allows an optional hyphen, and `between 3 and 3 digits` matches exactly three digits. Anchors cannot have a count or range: `3 start` reports an error at `start`.

Ranges are greedy: they try the largest count first and may use a smaller count to satisfy following rules. Without anchors, `between 2 and 4 digits` can match part of `12345`; use `start` and `end` to validate the whole string. `between 2 and 4 "AB"` generates `(?:AB){2,4}`, repeating the entire literal.

In the workshop, **Entire string** mode checks whether the pattern can cover the whole example, allowing greedy counts to backtrack to a complete match. **Search** mode shows JavaScript's first match, which may be shorter. For example, `between 0 and 2 "ab"` followed by `between 0 and 2 "abc"` can cover `ababc` completely, while the first search match is `abab`. This mode choice does not change the regex that you copy; add anchors to your rules when the copied regex must validate a whole input.

The public segment metadata for a bounded instruction has `repetition: { kind: "range", min: 2, max: 4 }`. Code that switches on `repetition.kind` should handle this new variant. Existing instructions keep their original metadata and matching behavior.

Malformed range syntax or non-integer bounds report `INVALID_REPETITION`. Reversed bounds report `INVALID_RANGE` at the upper count, and a bound above 1,000 reports `REPETITION_LIMIT` at that count.

## Anchors and flags

The compiler emits `u` by default for Unicode code-point behavior. It adds `m` when a line anchor is used. It allows `i` (ignore case) and `s` (dot matches newline) as explicit options. It rejects a mix of input anchors and line anchors in one document because JavaScript's `m` flag would change the meaning of `^` and `$` for both. Global and sticky flags (`g`, `y`) are outside version 1 because repeated `.test()` calls with them are stateful.

In the JavaScript API, `options.flags` must be a string containing unique `i` and/or `s` flags. Omitting it, passing `undefined` or using an empty string keeps the defaults. Other values, including `null`, report `UNSUPPORTED_FLAGS`.

Without `m`, JavaScript `^` and `$` match only the true start and end of input. For example, `start "A"` / `end` rejects `A` followed by a line break. With `m`, line anchors match line boundaries. Other regex engines may behave differently.

## Errors and future syntax

Unknown phrases, unsupported repetition forms, invalid quoted strings, duplicate or misplaced anchors, unsupported flags, excessive input and counts above 1,000 return a diagnostic with a line and column. Quoted-string errors point to invalid escapes or control characters; missing quotes point to line end. Duplicate count errors point to the second count. Overlength input points just after the 16,384-code-unit limit. Lines and columns are one-based; columns count UTF-16 code units, like JavaScript string indices. Inputs are limited to 16,384 UTF-16 code units and 200 input lines, including blank lines; a final newline does not count as another line. The compiler does not silently emit a partial success. Groups, lookaround, alternation, backreferences, arbitrary raw regex and reverse regex-to-English translation are outside version 1. Any future syntax needs examples, counterexamples and compatibility tests before it enters this contract.
