# Product brief and evaluation scenarios

## Intended user and job

A JavaScript developer who can describe a matching rule but does not remember regex syntax should be able to produce, inspect and test a small expression without sending their data to a service. The promise is a **controlled English rule language**, not natural-language AI. The same compiler should power a library, a CLI and a static browser workshop.

Success target for usability testing: a first-time user should load an example, change a rule, verify one positive and one negative string, and copy a usable expression within two minutes, without verbal help. This is a target to measure, not an achieved metric.

## Four reference tasks

These fixtures define the product walkthrough. Their expected regex sources and positive/negative strings are checked against JavaScript `RegExp` through the library, CLI and local browser regression suites.

1. **Validate a prefixed identifier.** Rules: `start "ABC"` / `3 digits` / `end`. Expected source `^ABC\d{3}$`, flags `u`. Positive: `ABC123`. Negative: `ABC12`, `ABC1234`, `abc123`.
2. **Exclude characters.** Rules: `start` / `text without: a, b, c, d` / `end`. Expected source `^[^abcd]*$`, flags `u`. Positive: `xyz`, empty string. Negative: `cab`.
3. **Read a line rule.** Rules: `line start` / `any text` / `3 digits` / `line end`. Expected source `^.*\d{3}$`, flags `mu`, search mode. Positive: `item 123`, `note\nitem 123`. Negative: `item 12`. The explanation must state that `.*` is greedy, `m` changes the anchors, and this pattern permits many prefixes.

4. **Match a date shape.** Rules: `start` / `4 digits` / `"-"` / `2 digits` / `"-"` / `2 digits` / `end`. Expected source `^\d{4}-\d{2}-\d{2}$`, flags `u`. Positive: `2026-09-27`, `2000-01-01`, `2026-02-31` (the impossible day still matches). Negative: `2026-9-27`, `27-09-2026`, `2026/09/27`. This checks the `YYYY-MM-DD` shape.

The recipes use compact syntax for prefixes, exclusions, line matching and a fixed date shape.

## Evidence plan

- Continue running these exact fixtures through the public API, CLI and browser after every change to the language or UI.
- During usability review, record date, tester context, task completion, time, errors and feedback without personal data in the repository. Recruit at least three people new to the project before claiming the phase 2.4 human criterion is met.
- Record failures and corrections. Do not turn local automated tests into adoption or satisfaction claims.

## Scope and alternatives

Regex For Humans should focus on transparent text-to-regex compilation and visible test cases. Existing editors such as regex101 and RegExr are already strong at writing and inspecting regex directly; JSVerbalExpressions exposes a code API; grex starts from positive examples. These are positioning references, not claims of superiority. Version 1 supports JavaScript RegExp only. No account, cloud storage, model inference or telemetry is needed for the proposed local workshop.
