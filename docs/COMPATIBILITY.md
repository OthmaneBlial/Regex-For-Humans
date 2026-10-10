# Regex compatibility

Current checkout evidence, 2026-10-10. Output targets JavaScript `RegExp` in Unicode mode. New group/reference syntax is unreleased; the published npm preview remains `0.1.0-dev.3`.

| Construct | Rules → regex | Regex → rules |
| --- | --- | --- |
| Documented literals, shorthands, simple sets and greedy atom repetitions | Supported | Supported subset; unknown ranges fail explicitly |
| Numbered, named, nested and empty captures | Supported | Not yet supported |
| Composite/nested noncapturing groups and whole-block repetitions | Supported | Literal-only and empty noncapturing groups only |
| Named/numbered backward references | Supported after the target closes | Not yet supported |
| Forward/open references | Positioned rule-language diagnostic | Unsupported |
| Alternation, lookaround, boundaries, lazy quantifiers, Unicode properties and v-set operations | Not yet supported | Unsupported |
| Flags | `u` always; `m` through line anchors; `i`/`s` options | Only `i`/`m`/`s`/`u`; `u` required |
| Other regex engines | No target | No translation claim |

Groups are numbered in opening order, including named groups. Names are Unicode JavaScript identifiers and are unique across the document. Some newer JavaScript patterns allow duplicate names in disjoint alternatives; this DSL currently uses a stricter unique-name policy. A reference to an absent optional capture matches empty text, while a participating empty capture has value `""`. Repeated captures retain the final captured value. References inside or before their target are rejected by language policy, even when JavaScript permits them.

## Verified runtimes

- Host Node 25.9.0: all 233 Node tests plus a clean installed-package JavaScript/TypeScript consumer.
- Minimum supported major, Node 22.23.3: all 11 dedicated group/reference and CLI tests.
- Installed Chrome: group/reference editing, trace navigation and isolated matching in desktop and mobile viewports (4 checks). Mobile viewport checks are not physical-device evidence.
- Playwright Firefox and WebKit: the same 4 group/reference checks.
- Group milestone: 54 desktop/mobile group, worker security and automated accessibility checks. Human screen-reader and usability reviews remain unverified.

These results cover the checked constructs and versions. They do not establish every historical browser/version or all-platform CLI behavior. The broader workflow and reproducible commands are in [TESTING.md](TESTING.md); exact syntax and limitations are in [LANGUAGE.md](LANGUAGE.md). Matching copied regexes requires the receiving application's own execution safeguards.
