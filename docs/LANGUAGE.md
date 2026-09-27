# The Regex For Humans language

This document defines the implemented **version 1 core language**. The browser workshop runs locally from this clone. npm publication and a GitHub release have not yet been verified; use the repository status and release notes to check each distribution surface.

Regex For Humans translates a small, fixed vocabulary into a JavaScript `RegExp`. It does not interpret arbitrary English or infer an expression from examples. Use the short forms below for new rules; older wording remains accepted. Put one atom or ending anchor on each nonblank line; `start` or `line start` may share a line with the first atom. Keywords are case-insensitive; quoted literal content keeps its case. Leading and trailing spaces are ignored.

Separate rules with LF, CRLF, CR, U+2028 or U+2029 line breaks.

## Instructions

| Instruction | Generated source | Matches | Does not match |
| --- | --- | --- | --- |
| `start` | `^` | `^A` matches `A` | `^A` does not match `BA` |
| `end` | `$` | `A$` matches `A` | `A$` does not match `AB` |
| `line start` | `^` with `m` | `^A` matches `B\nA` | `^A` does not match `BA` |
| `line end` | `$` with `m` | `A$` matches `A\nB` | `A$` does not match `AB` |
| `any character` | `.` | `A` | a newline unless `s` is enabled |
| `any text` | `.*` | any sequence without line breaks unless `s` is enabled | a line break |
| `word` | `\w` | `A`, `_`, `3` | `-`, `é` |
| `not word` | `\W` | `-`, `é` | `A`, `_` |
| `digit` | `\d` | `3` | `A`, `٣` |
| `not digit` | `\D` | `A`, `٣` | `3` |
| `space` | `\s` | a space, tab or newline | `A` |
| `not space` | `\S` | `A` | a space |
| `digits` | `\d+` | `3`, `123` | `A` |
| `"ABC"` (also `a "ABC"` or `an "ABC"`) | `ABC` | `ABC` | `ABX` |
| `one of: a, b, c` | `[abc]` | `b` | `d` |
| `none of: a, b, c` | `[^abc]` | `d` | `b` |
| `text without: a, b, c` | `[^abc]*` | zero or more characters outside the list | `cab` with `start` and `end` |

`word` and `digit` follow JavaScript's `\w` and `\d`, which are ASCII-oriented even with the Unicode flag (the combination of `i` and `u` has a few Unicode case-folding exceptions for `\w`). A literal is a JSON-style double-quoted string: `"` and `\\` can be written inside it. Literal regex metacharacters are escaped by the compiler. A character-list item is exactly one Unicode code point; write ordinary items as `a, b`, and quote punctuation, commas, spaces or backslashes as `"]", "-", ",", "\\"`. The generated class escapes each item in class context. Empty lists and empty literals are errors.

`start` and `line start` may prefix the first atom on the same line, with or without a comma: `start 3 digits`. Use short forms shown above for new rules. Older forms remain accepted for existing rules.

## Repetition

A repetition modifies exactly one atom. Write an exact count before it (`3 digits`). For a multi-character literal, the compiler groups the whole literal before applying the repetition. Older repetition forms remain accepted. Two repetitions on one atom, a repetition without an atom, negative counts and invalid ranges are errors.

| Form | Generated source | Matches | Does not match |
| --- | --- | --- | --- |
| `3 <atom>` (for example, `3 digits`) | `A{3}` | `AAA` | `AA` |
| `<atom> 3 times` | `A{3}` | `AAA` | `AA` |
| `<atom> any number of times` | `A*` | empty, `AAA` | `B` as a whole-string match |
| `<atom> at least one time` | `A+` | `A`, `AAA` | empty |
| `<atom> at most one time` | `A?` | empty, `A` | `AA` as a whole-string match |
| `<atom> between 2 and 4 times` | `A{2,4}` | `AA`, `AAAA` | `A`, `AAAAA` |
| `<atom> at least 3 times` | `A{3,}` | `AAA`, `AAAA` | `AA` |

Use `text without: a, b` to match any sequence that excludes those characters. Numeric counts are nonnegative integers no greater than 1,000. The compiler rejects a quantifier attached to an anchor.

## Anchors and flags

The compiler emits `u` by default for Unicode code-point behavior. It adds `m` when a line anchor is used. It allows `i` (ignore case) and `s` (dot matches newline) as explicit options. It rejects a mix of input anchors and line anchors in one document because JavaScript's `m` flag would change the meaning of `^` and `$` for both. Global and sticky flags (`g`, `y`) are outside version 1 because repeated `.test()` calls with them are stateful.

JavaScript `$` may also match before a final newline. Do not use it as a promise of byte-for-byte end-of-input validation. Test intended positive and negative cases in the target runtime. The output is a JavaScript regex source and flags; other regex engines may interpret it differently.

## Errors and future syntax

Unknown phrases, ambiguous phrases, invalid quoted strings, duplicate or misplaced anchors, unsupported flags, excessive input and invalid repetition bounds return a diagnostic with a line and column. Quoted-string errors point to invalid escapes or control characters; missing quotes point to line end. Duplicate repetition errors point to the second modifier. Overlength input points just after the 16,384-code-unit limit. Lines and columns are one-based; columns count UTF-16 code units, like JavaScript string indices. Inputs are limited to 16,384 UTF-16 code units and 200 input lines, including blank lines; a final newline does not count as another line. The compiler does not silently emit a partial success. Groups, lookaround, alternation, backreferences, arbitrary raw regex and reverse regex-to-English translation are outside version 1. Any future syntax needs examples, counterexamples and compatibility tests before it enters this contract.
