# Product brief and evaluation scenarios

## Intended user and job

A JavaScript developer who can describe a matching rule but does not remember regex syntax should be able to produce, inspect and test a small expression without sending their data to a service. The promise is a **controlled English rule language**, not natural-language AI. The same compiler should power a library, a CLI and a static browser workshop.

Success target for usability testing: a first-time user should load an example, change a rule, verify one positive and one negative string, and copy a usable expression within two minutes, without verbal help. This is a target to measure, not an achieved metric.

## Reference tasks

These fixtures define the product walkthrough. Their expected regex sources and positive/negative strings are checked against JavaScript `RegExp` through the library, CLI and local browser regression suites.

1. **Validate a prefixed identifier.** Rules: `start "ABC"` / `3 digits` / `end`. Expected source `^ABC\d{3}$`, flags `u`. Positive: `ABC123`. Negative: `ABC12`, `ABC1234`, `abc123`.
2. **Exclude characters.** Rules: `start` / `text without: a, b, c, d` / `end`. Expected source `^[^abcd]*$`, flags `u`. Positive: `xyz`, empty string. Negative: `cab`.
3. **Read a line rule.** Rules: `line start` / `any text` / `3 digits` / `line end`. Expected source `^.*\d{3}$`, flags `mu`, search mode. Positive: `item 123`, `note\nitem 123`, `item 1234`. Negative: `item 12`. The trace must state that `.*` greedily matches text up to the next rule, `m` enables line anchors, and the prefix can have any length. Because the prefix can also contain digits, the line can end in more than three digits.

4. **Match a date shape.** Rules: `start` / `4 digits` / `"-"` / `2 digits` / `"-"` / `2 digits` / `end`. Expected source `^\d{4}-\d{2}-\d{2}$`, flags `u`. Positive: `2026-09-27`, `2000-01-01`, `2026-02-31` (the impossible day still matches). Negative: `2026-9-27`, `27-09-2026`, `2026/09/27`. This checks the `YYYY-MM-DD` shape.

5. **Match a version shape.** Rules: `start` / `digits` / `"."` / `digits` / `"."` / `digits` / `end`. Expected source `^\d+\.\d+\.\d+$`, flags `u`. Positive: `1.2.3`, `10.20.300`, `01.2.3`. Negative: `1.2`, `1.2.3.4`, `v1.2.3`, `1x2x3`, `1.2.3-beta`. This teaches one-or-more digits and escaped literal dots. It checks only three numeric components, accepts leading zeros and rejects prerelease suffixes; use separate validation for full Semantic Versioning rules.

6. **Match a hex color.** Rules: `start "#"` / `6 hex digits` / `end`. Expected source `^#[0-9A-Fa-f]{6}$`, flags `u`. Positive: `#12aBcF`, `#000000`, `#FFFFFF`. Negative: `#123`, `#12345678`, `#G00000`, `123456`, a color followed by a newline. This teaches an exact count of ASCII hexadecimal digits in either letter case. It accepts only the six-digit `#RRGGBB` notation; shorthand, alpha components, named colors and other CSS color forms are outside this recipe.

7. **Match an invoice ID shape.** Rules: `start "INV-"` / `between 2 and 6 digits` / `end`. Expected source `^INV-\d{2,6}$`, flags `u`. Positive: `INV-12`, `INV-1234`, `INV-123456`, `INV-0012`. Negative: `INV-1`, `INV-1234567`, `inv-1234`, `INV-١٢`, `INV-12A`, an ID followed by a newline. This teaches inclusive bounded repetition with both accepted limits. Digits are ASCII, the prefix is case-sensitive and leading zeros are allowed. It checks a text shape; verify invoice records separately.

8. **Match a username shape.** Rules: `start letter` / `between 2 and 15 word` / `end`. Expected source `^[A-Za-z]\w{2,15}$`, flags `u`. Positive: `Abc`, `Alice_7`, `A__`, a 16-letter name. Negative: empty string, `Al`, `_Alice`, `7Alice`, `a-b`, `élise`, a 17-letter name, a name followed by a newline, `Kid` and `ſam`. This teaches an alphabetic first character followed by an inclusive range of word characters, for a total of 3–16. Digits and underscores are allowed after the first letter. Ignore case adds JavaScript's Unicode case-folding equivalents. The recipe checks only this shape; validate availability and a service's account rules separately.

The recipes use compact syntax for prefixes, exclusions, line matching, a fixed date shape, variable-length version components, an exact hexadecimal character count, an inclusive digit range and an alphabetic username prefix.

Each fixture includes a short note about its meaning and limits. The workshop shows that note beside the selected rules, includes it in the editor's accessible description, and hides it when manual rules differ from the recipe. The homepage demo uses the same note.

## Evidence plan

- Continue running these exact fixtures through the public API, CLI and browser after every change to the language or UI.
- During usability review, record date, tester context, task completion, time, errors and feedback without personal data in the repository. Recruit at least three people new to the project before claiming the phase 2.4 human criterion is met.
- Record failures and corrections. Do not turn local automated tests into adoption or satisfaction claims.

## Scope and alternatives

Regex For Humans should focus on transparent text-to-regex compilation and visible test cases. Existing editors such as regex101 and RegExr are already strong at writing and inspecting regex directly; JSVerbalExpressions exposes a code API; grex starts from positive examples. These are positioning references, not claims of superiority. Version 1 supports JavaScript RegExp only. No account, cloud storage, model inference or telemetry is needed for the proposed local workshop.
