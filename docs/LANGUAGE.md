# The Regex For Humans language

This document defines the intended **version 1** language. Until the compiler tests pass, it is a specification, not a claim that the current prototype implements every rule.

Regex For Humans translates a deliberately small English vocabulary into a JavaScript `RegExp`. It does not interpret arbitrary English or infer an expression from examples. Every nonblank line is one instruction. Keywords are case-insensitive; quoted literal content keeps its case. Leading and trailing spaces around instructions are ignored.

## Instructions

| Instruction | Generated source | Matches | Does not match |
| --- | --- | --- | --- |
| `at the beginning of the input` | `^` | `^A` matches `A` | `^A` does not match `BA` |
| `end of the input` | `$` | `A$` matches `A` | `A$` does not match `AB` |
| `at the beginning of a line` | `^` with `m` | `^A` matches `B\nA` | `^A` does not match `BA` |
| `end of the line` | `$` with `m` | `A$` matches `A\nB` | `A$` does not match `AB` |
| `any character` | `.` | `A` | a newline unless `s` is enabled |
| `alphanumeric character` | `\w` | `A`, `_`, `3` | `-`, `é` |
| `non-alphanumeric character` | `\W` | `-`, `é` | `A`, `_` |
| `digit character` | `\d` | `3` | `A`, `٣` |
| `non-digit character` | `\D` | `A`, `٣` | `3` |
| `any whitespace` | `\s` | a space, tab or newline | `A` |
| `non-whitespace character` | `\S` | `A` | a space |
| `a "ABC"` or `an "ABC"` | `ABC` | `ABC` | `ABX` |
| `any of the following characters: a, b, c` | `[abc]` | `b` | `d` |
| `anything except the following characters: a, b, c` | `[^abc]` | `d` | `b` |

The words `alphanumeric` and `digit` follow JavaScript's `\w` and `\d`, which are ASCII-oriented even with the Unicode flag (the combination of `i` and `u` has a few Unicode case-folding exceptions for `\w`). A literal is a JSON-style double-quoted string: `"` and `\\` can be written inside it. Literal regex metacharacters are escaped by the compiler. A character-list item is exactly one Unicode code point; write ordinary items as `a, b`, and quote punctuation, commas, spaces or backslashes as `"]", "-", ",", "\\"`. The generated class escapes each item in class context. Empty lists and empty literals are errors.

`I am looking for ` may prefix an atom without changing it. The article `a` or `an` is optional before a named character class, so the original `I am looking for a digit character` is accepted. For compatibility with the original example, an opening anchor may prefix an atom on the same line, separated by a comma: `at the beginning of a line, I am looking for any character, any number of times`. The unprefixed version is preferred for new documents.

## Repetition

A repetition modifies exactly one atom. For a multi-character literal, the compiler groups the whole literal before applying the repetition. A repetition can follow the atom, separated by a space or comma. The legacy spelling `<repetition> for <atom>` is also accepted. Two repetitions on one atom, a repetition without an atom, negative counts and ranges with a lower bound above the upper bound are errors.

| Suffix | Source after an atom `A` | Matches | Does not match |
| --- | --- | --- | --- |
| `any number of times` | `A*` | empty, `AAA` | `B` as a whole-string match |
| `at least one time` | `A+` | `A`, `AAA` | empty |
| `at most one time` | `A?` | empty, `A` | `AA` as a whole-string match |
| `3 times` | `A{3}` | `AAA` | `AA` |
| `between 2 and 4 times` | `A{2,4}` | `AA`, `AAAA` | `A`, `AAAAA` |
| `at least 3 times` | `A{3,}` | `AAA`, `AAAA` | `AA` |

The phrase `any number of times for anything except the following characters: a, b` therefore produces `[^ab]*`. Numeric counts are nonnegative integers within the documented compiler limit. The compiler rejects a quantifier attached to an anchor.

## Anchors and flags

The compiler emits `u` by default for Unicode code-point behavior. It adds `m` when a line anchor is used. It allows `i` (ignore case) and `s` (dot matches newline) as explicit options. It rejects a mix of input anchors and line anchors in one document because JavaScript's `m` flag would change the meaning of `^` and `$` for both. Global and sticky flags (`g`, `y`) are outside version 1 because repeated `.test()` calls with them are stateful.

JavaScript `$` may also match before a final newline. Do not use it as a promise of byte-for-byte end-of-input validation. Test intended positive and negative cases in the target runtime. The output is a JavaScript regex source and flags; other regex engines may interpret it differently.

## Errors and future syntax

Unknown phrases, ambiguous phrases, invalid quoted strings, duplicate or misplaced anchors, unsupported flags, excessive input and invalid repetition bounds must return a diagnostic with a line and column. The compiler must not silently emit a partial success. Groups, lookaround, alternation, backreferences, arbitrary raw regex and reverse regex-to-English translation are outside version 1. Any future syntax needs examples, counterexamples and compatibility tests before it enters this contract.
