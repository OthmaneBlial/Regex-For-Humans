# Regex compatibility

Current checkout evidence, 2026-10-10. Output targets JavaScript `RegExp` in Unicode mode. New group/reference syntax is unreleased; the published npm preview remains `0.1.0-dev.3`.

| Construct | Rules → regex | Regex → rules |
| --- | --- | --- |
| Documented literals, shorthands, simple sets and greedy atom repetitions | Supported | Supported subset; unknown ranges fail explicitly |
| Numbered, named, nested and empty captures | Supported | Supported; capture values and indices preserved |
| Composite/nested noncapturing groups and whole-block repetitions | Supported | Supported; literal-only noncapturing groups retain compact normalization |
| Named/numbered backward references | Supported after the target closes | Supported under the same policy |
| Forward/open references | Positioned rule-language diagnostic | Unsupported |
| Alternation, lookaround, boundaries, lazy quantifiers, Unicode properties and v-set operations | Not yet supported | Unsupported |
| Flags | `u` always; `m` through line anchors; `i`/`s` options | Only `i`/`m`/`s`/`u`; `u` required |
| Other regex engines | No target | No translation claim |

Groups are numbered in opening order, including named groups. Names are Unicode JavaScript identifiers and are unique across the document. Some newer JavaScript patterns allow duplicate names in disjoint alternatives; this DSL currently uses a stricter unique-name policy. A reference to an absent optional capture matches empty text, while a participating empty capture has value `""`. Repeated captures retain the final captured value. References inside or before their target are rejected by language policy, even when JavaScript permits them.

## Verified runtimes

- Host Node 25.9.0: all 238 Node tests plus a clean installed-package JavaScript/TypeScript consumer.
- Minimum supported major, Node 22.23.3: all 16 dedicated group/reference/reverse and CLI tests.
- Installed Chrome: all 282 desktop/mobile workshop checks, including group/reference imports, trace navigation and isolated matching. Mobile viewport checks are not physical-device evidence.
- Playwright Firefox and WebKit: all 52 compatibility checks, including the same group/reference/import flows.
- Complete local verification also passes the builds, all 62 homepage checks and an audit with zero vulnerabilities.
- Group milestone: 54 desktop/mobile group, worker security and automated accessibility checks. Human screen-reader and usability reviews remain unverified.

These results cover the checked constructs and versions. They do not establish every historical browser/version or all-platform CLI behavior. The broader workflow and reproducible commands are in [TESTING.md](TESTING.md); exact syntax and limitations are in [LANGUAGE.md](LANGUAGE.md). Matching copied regexes requires the receiving application's own execution safeguards.
