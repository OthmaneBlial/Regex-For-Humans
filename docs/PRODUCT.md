# Product brief and evaluation scenarios

## Intended user and job

A JavaScript developer who can describe a matching rule but does not remember regex syntax should be able to produce, inspect and test a small expression without sending their data to a service. The promise is a **controlled English rule language**, not natural-language AI. The same compiler should power a library, a CLI and a static browser workshop.

Success target for usability testing: a first-time user should load an example, change a rule, verify one positive and one negative string, and copy a usable expression within two minutes, without verbal help. This is a target to measure, not an achieved metric.

## Three reference tasks

These fixtures define the product walkthrough. Their expected regex sources are checked against JavaScript `RegExp` now; they become library, CLI and browser regression tests as those surfaces are implemented.

1. **Validate a prefixed identifier.** Rules: `at the beginning of the input` / `a "ABC"` / `digit character 3 times` / `end of the input`. Expected source `^ABC\d{3}$`, flags `u`. Positive: `ABC123`. Negative: `ABC12`, `ABC1234`, `abc123`.
2. **Exclude characters.** Rules: `at the beginning of the input` / `anything except the following characters: a, b, c, d any number of times` / `end of the input`. Expected source `^[^abcd]*$`, flags `u`. Positive: `xyz`, empty string. Negative: `cab`.
3. **Understand an existing line rule.** Rules: `at the beginning of a line, I am looking for any character, any number of times` / `I am looking for a digit character 3 times` / `end of the line`. Expected source `^.*\d{3}$`, flags `mu`, search mode. Positive: `item 123`, `note\nitem 123`. Negative: `item 12`. The explanation must state that `.*` is greedy, `m` changes the anchors, and this pattern permits many prefixes.

The first task demonstrates precise extraction from English. The second demonstrates class exclusion and negative examples. The third preserves the README's original style and makes its permissiveness visible rather than hiding it.

## Evidence plan

- Run these exact fixtures through `new RegExp(source, flags)` before implementation and through the public API, CLI and browser after each surface exists.
- During usability review, record date, tester context, task completion, time, errors and feedback without personal data in the repository. Recruit at least three people new to the project before claiming the phase 2.4 human criterion is met.
- Record failures and corrections. Do not turn local automated tests into adoption or satisfaction claims.

## Scope and alternatives

Regex For Humans should focus on transparent text-to-regex compilation and visible test cases. Existing editors such as regex101 and RegExr are already strong at writing and inspecting regex directly; JSVerbalExpressions exposes a code API; grex starts from positive examples. These are positioning references, not claims of superiority. Version 1 supports JavaScript RegExp only. No account, cloud storage, model inference or telemetry is needed for the proposed local workshop.
