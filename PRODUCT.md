# Product

<!-- impeccable:product-schema 1 -->

Facts marked *(inferred)* come from the owner's written brief in chat (20 November 2026) and the repository, not from a separate interview.

## Platform

web

## Users

JavaScript and TypeScript developers who need a regular expression now: to validate a field, pull fields out of a log line, or understand a regex someone else wrote. They know what they want to match but do not remember the syntax, or they distrust a pattern they cannot read. They meet the project on its GitHub README, on npm, or on the GitHub Pages site.

## Product Purpose

Regex For Humans compiles short controlled-English rules (`start`, `4 digits`, `"-"`, `capture "month" { … }`) into a native JavaScript `RegExp`, and translates a supported regex back into those rules. Two jobs: **write my regex** and **explain my regex**. Success is a visitor who installs the package or uses the workshop because they understood, in seconds, what it does to their own pattern *(inferred: "people should install it to write my regex or explain my regex")*.

## Positioning

A deterministic compiler, not AI: the same rules always give the same regex, and every rule maps to one visible fragment of the output. It runs locally (library, CLI, static workshop) with no service, no telemetry and no dependency. The reverse direction (regex → rules) is checked by recompiling.

## Operating Context

Used in an editor, a terminal (`npx regex-for-humans`), or the browser workshop at `/workshop/`. The homepage and README are where people decide whether to try it.

## Capabilities and Constraints

- Library `compile()`, `toRegExp()`, `regexToRules()`, `analyze()`, `exportRegex()`, `toSVG()`; CLI with `--explain`, `--from-regex`, `--test`; workshop with recipes, tests, captures, replacement and four interface languages.
- Reverse translation needs the `u` or `v` flag; the homepage explainer retries common regexes with `u` added.
- 34 recipes. Several are deliberately *shape* checks (IPv4 shape accepts `999.999.999.999`); validating versions exist for IPv4, 24-hour time and calendar dates.
- npm preview only (`0.1.0-dev.13`); no stable release yet. GitHub Pages site is published from the `OthmaneBlial.github.io` repository under `Regex-For-Humans/`.

## Brand Commitments

- Name: Regex For Humans.
- Rejected directions: a transit/metro map metaphor, a cream-paper look *(owner feedback, 20 November 2026)*.
- The owner wants visitors to be dazzled and to understand the product at once, with SVGs that explain how it works *(inferred)*.

## Evidence on Hand

Real compiler output for every recipe (`test/fixtures/product-scenarios.json`), workshop screenshots, the published npm preview. No users, testimonials, download counts or benchmarks exist; never invent them.

## Product Principles

1. Show the translation, do not describe it: every claim on a page is a real rule and its real compiled regex.
2. Both directions matter equally: writing a regex and reading one.
3. Honest limits: say what a pattern does not check.
4. Local and deterministic: no AI claims, no network.
