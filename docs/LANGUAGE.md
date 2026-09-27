# The Regex For Humans language

This document defines the implemented **version 1 core language**. The browser workshop runs locally from this clone. npm publication and a GitHub release have not yet been verified; use the repository status and release notes to check each distribution surface.

Regex For Humans translates a small, fixed vocabulary into a JavaScript `RegExp`. It does not interpret arbitrary English or infer an expression from examples. Only the short forms below are supported. Write one instruction per nonblank line. `start` or `line start` may share a line with the first instruction. Keywords are case-insensitive; quoted literal content keeps its case. Leading and trailing spaces are ignored.

Separate rules with LF, CRLF, CR, U+2028 or U+2029 line breaks.

## Instructions

| Instruction | Generated source | Matches | Does not match |
| --- | --- | --- | --- |
| `start` | `^` | `^A` matches `A` | `^A` does not match `BA` |
| `end` | `$` | `A$` matches `A` | `A$` does not match `AB` |
| `line start` | `^` with `m` | `^A` matches `B\nA` | `^A` does not match `BA` |
| `line end` | `$` with `m` | `A$` matches `A\nB` | `A$` does not match `AB` |
| `any character` | `.` | `A` | a newline unless `s` is enabled |
| `any text` | `.*` | any text up to the next rule, greedily; line breaks stop it unless `s` is enabled | a line break |
| `word` | `\w` | `A`, `_`, `3` | `-`, `é` |
| `not word` | `\W` | `-`, `é` | `A`, `_` |
| `digit` | `\d` | `3` | `A`, `٣` |
| `not digit` | `\D` | `A`, `٣` | `3` |
| `space` | `\s` | a space, tab or newline | `A` |
| `not space` | `\S` | `A` | a space |
| `digits` | `\d+` | `3`, `123` | `A` |
| `"ABC"` | `ABC` | `ABC` | `ABX` |
| `one of: a, b, c` | `[abc]` | `b` | `d` |
| `none of: a, b, c` | `[^abc]` | `d` | `b` |
| `text without: a, b, c` | `[^abc]*` | zero or more characters outside the list | `cab` with `start` and `end` |

`word`/`not word` use JavaScript's `\w`/`\W`; `digit`/`not digit` use `\d`/`\D`. These classes are ASCII-oriented with `u`; `i` plus `u` adds a few Unicode case-folding matches to `\w`. `\w` includes `_` but excludes `é`. The misleading `alphanumeric character` aliases are rejected.

A literal is a JSON-style double-quoted string. Escape `"` and `\\`; the compiler escapes regex metacharacters. Character-list items must each be one Unicode code point. Quote punctuation, commas, spaces and backslashes, as in `"]", "-", ",", "\\"`. Empty literals and lists are errors.

`start` and `line start` may prefix the first atom on the same line, with or without a comma: `start 3 digits`.

## Repetition

A count applies to the next item. Put it first (`3 digits`). The compiler keeps a multi-character literal together. `digits` means one or more digits; `any text` and `text without` already match sequences. Other repetition wording is not supported.

| Form | Generated source | Matches | Does not match |
| --- | --- | --- | --- |
| `3 <item>` (for example, `3 digits`) | `A{3}` | `AAA` | `AA` |

Numeric counts are nonnegative integers no greater than 1,000. The compiler rejects a count attached to an anchor.

## Anchors and flags

The compiler emits `u` by default for Unicode code-point behavior. It adds `m` when a line anchor is used. It allows `i` (ignore case) and `s` (dot matches newline) as explicit options. It rejects a mix of input anchors and line anchors in one document because JavaScript's `m` flag would change the meaning of `^` and `$` for both. Global and sticky flags (`g`, `y`) are outside version 1 because repeated `.test()` calls with them are stateful.

Without `m`, JavaScript `^` and `$` match only the true start and end of input. For example, `start "A"` / `end` rejects `A` followed by a line break. With `m`, line anchors match line boundaries. Other regex engines may behave differently.

## Errors and future syntax

Unknown phrases, unsupported repetition forms, invalid quoted strings, duplicate or misplaced anchors, unsupported flags, excessive input and counts above 1,000 return a diagnostic with a line and column. Quoted-string errors point to invalid escapes or control characters; missing quotes point to line end. Duplicate count errors point to the second count. Overlength input points just after the 16,384-code-unit limit. Lines and columns are one-based; columns count UTF-16 code units, like JavaScript string indices. Inputs are limited to 16,384 UTF-16 code units and 200 input lines, including blank lines; a final newline does not count as another line. The compiler does not silently emit a partial success. Groups, lookaround, alternation, backreferences, arbitrary raw regex and reverse regex-to-English translation are outside version 1. Any future syntax needs examples, counterexamples and compatibility tests before it enters this contract.
