<div align="center">

[![Regex For Humans: the regex ^#[0-9A-Fa-f]{6}$ with the plain-English meaning of each fragment written under it](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Write regex in plain English. Read any regex the same way.**

Short English rules compile to a native JavaScript `RegExp`, one visible fragment per rule. Paste a regex and get the rules back.

**[Try the workshop](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [Website](https://othmaneblial.github.io/Regex-For-Humans/) · [npm preview](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.13) · [Syntax](docs/LANGUAGE.md)**

[English](README.md) · [简体中文](docs/i18n/README.zh-CN.md) · [Español](docs/i18n/README.es.md) · [Français](docs/i18n/README.fr.md) · [Português do Brasil](docs/i18n/README.pt-BR.md) · [日本語](docs/i18n/README.ja.md) · [Deutsch](docs/i18n/README.de.md) · [हिन्दी](docs/i18n/README.hi.md) · [العربية](docs/i18n/README.ar.md) · [اردو](docs/i18n/README.ur.md)

</div>

## Write rules, get a regex

<table>
<tr><th>Rules</th><th>JavaScript regex</th></tr>
<tr><td>

```text
start "#"
6 hex digits
end
```

</td><td>

```js
/^#[0-9A-Fa-f]{6}$/u
```

✅ `#12aBcF` · `#000000`<br>
❌ `#123` · `#G00000`

</td></tr>
</table>

Each line has one documented meaning and adds one fragment to the regex, in order. The output is the regex you would write by hand: `?` rather than `{0,1}`, no extra groups. An unknown phrase stops with its line, column and a suggested fix.

[![Six recipes in turn: each shows its rules, the compiled regex, the meaning under every fragment and what it matched in a sample](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-reel.svg)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

## Read a regex back

Inherited a pattern nobody can read? `regexToRules` turns a supported regex into rules you can edit, and those rules compile back to the same regex.

```js
import { regexToRules } from 'regex-for-humans';

regexToRules(/^[A-Z]{2}-\d{4}$/u).rules;
```

```text
start
2 uppercase letter
"-"
4 digit
end
```

The [website](https://othmaneblial.github.io/Regex-For-Humans/) glosses any pasted regex in place. Unsupported syntax is refused with its position, never dropped quietly.

## Name the parts you capture

<!-- captures:date -->
```text
start
capture "year" {
  4 digits
}
"-"
capture "month" {
  2 digits
}
"-"
capture "day" {
  2 digits
}
end
```

```js
toRegExp(compile(rules)).exec('2026-10-10').groups;
// { year: '2026', month: '10', day: '10' }
```

Captures are native JavaScript groups. Write `same as capture "year"` to require the same text again.

## Install

```sh
npm install regex-for-humans@preview
```

```js
import { compile, toRegExp } from 'regex-for-humans';

const result = compile('start\n3 digits\nend');
console.log(result.source);                 // ^\d{3}$
console.log(toRegExp(result).test('123'));  // true
```

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans --explain
```

Node.js 22+, no runtime dependencies, ESM with TypeScript declarations. The library, the [command line](docs/CLI.md) and the workshop share one compiler. This is a preview (`0.1.0-dev.13`); the [workshop](https://othmaneblial.github.io/Regex-For-Humans/workshop/) needs no install.

## The vocabulary at a glance

| Say this | Get this |
| --- | --- |
| `start` · `end` | `^` · `$` |
| `3 digits` · `digits` | `\d{3}` · `\d+` |
| `between 2 and 4 letters` | `[A-Za-z]{2,4}` |
| `optional "-"` | `-?` |
| `one of: a, b` | `[ab]` |
| `either { "INFO" "WARN" }` | `(?:INFO\|WARN)` |
| `capture "id" { … }` | `(?<id>…)` |
| `not followed by { "x" }` | `(?!x)` |

Blocks such as `either { … }` put one rule per line inside the braces. The [language guide](docs/LANGUAGE.md) covers every rule, flag, Unicode class, lookaround and limit.

## 34 recipes, ready to open

| Recipe | What it checks |
| --- | --- |
| [Validate a calendar date](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=calendar-date) | Month 01–12, day 01–31, captured as year, month and day |
| [Validate an IPv4 address](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-address) | Four numbers from 0 to 255, no leading zeros |
| [Validate a 24-hour time](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=clock-time) | `00:00` to `23:59` |
| [Validate SemVer 2.0 syntax](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | Core, prerelease and build parts |
| [Extract named fields from a log fragment](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | Level and code, by name |
| [Match two repeated words](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | A word, then the same word again |

Every recipe comes with examples that must and must not match, and a note on what it does not check. See [all 34 recipes](docs/RECIPES.md) and four [complex examples](docs/COMPLEX-EXAMPLES.md) with **35 accepted/rejected cases**.

## Why you can trust the output

- **Deterministic.** A parser, not a model: the same rules always give the same regex. No AI, no network, no telemetry.
- **Native.** The output is an ordinary `RegExp`; nothing runs at match time but the engine. [Exports](docs/LANGUAGE.md#engine-exports) to Python, Rust, Go, Java, C#, PHP and Ruby are compared against those engines.
- **Honest about limits.** Recipes say what they do not check. The workshop runs your examples in a time-limited worker; a copied regex needs its own safeguards ([security model](docs/SECURITY_MODEL.md)).
- **Tested.** Every recipe and every example in this README is recompiled by the test suite ([testing](docs/TESTING.md)).

[Architecture](docs/ARCHITECTURE.md) · [Compatibility](docs/COMPATIBILITY.md) · [Contributing](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [Security](SECURITY.md) · [MIT](LICENSE)

<div align="center">

If a rule here saved you some squinting, a ⭐ helps other developers find it.

</div>
