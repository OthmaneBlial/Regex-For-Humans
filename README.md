# Regex For Humans

[![CI](https://github.com/OthmaneBlial/Regex-For-Humans/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/OthmaneBlial/Regex-For-Humans/actions/workflows/ci.yml)

**Write clear rules. Get a JavaScript regex you can inspect and test.**

Regex For Humans turns a small, explicit English vocabulary into JavaScript `RegExp`. The same compiler powers a CLI, a library, and a browser workshop. Each rule has a defined meaning and predictable output.

> **Development preview:** [Project site](https://othmaneblial.github.io/Regex-For-Humans/) · [Open the workshop](https://othmaneblial.github.io/Regex-For-Humans/workshop/). Local use requires Node.js 22+; the package is not yet on npm.

## See it work

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

```text
/^ABC\d{3}$/u
```

This matches `ABC123`; it rejects `ABC12`, `ABC1234`, and `abc123`.

## Run the workshop locally

The [hosted workshop](https://othmaneblial.github.io/Regex-For-Humans/workshop/) is ready to use. To run it from a checkout:

```sh
npm ci
npm run build
npm run serve
```

Open **http://127.0.0.1:4174/**. Pick a recipe, edit the rules, and test examples. Compilation runs in your browser; rules and examples are not sent to an application backend.

![Regex For Humans workshop showing the rules start "ABC", 3 digits, end and their passing examples](media/screenshots/workshop-desktop-dev.png)

<details>
<summary>Mobile screenshot</summary>

![Mobile view of the Regex For Humans workshop](media/screenshots/workshop-mobile-dev.png)

</details>

[Screenshot source and checksums](media/screenshots/README.md).

## Write a rule

Put one rule on each line. `start` can prefix the first rule. Quote exact text; use `start` and `end` to anchor the match.

| Meaning | Rule | Regex source |
| --- | --- | --- |
| Input bounds | `start` · `end` | `^` · `$` |
| Line bounds | `line start` · `line end` | `^` · `$` with `m` |
| Character | `digit` · `not digit` | `\d` · `\D` |
| Repeated digits | `3 digits` · `digits` | `\d{3}` · `\d+` |
| Exact text | `"ABC"` | `ABC` |
| Character set | `one of: a, b` | `[ab]` |

Long forms remain valid. Unknown rules and duplicate repetition modifiers show where to fix the input. The [language guide](docs/LANGUAGE.md) covers syntax, escaping, flags, and limits.

## Use it from JavaScript

```js
import { compile, toRegExp } from './index.js';

const result = compile('start 3 digits\nend');
console.log(result.source); // ^\d{3}$
console.log(toRegExp(result).test('123')); // true
```

Import `./index.js` from the repository checkout.

## CLI options

Read rules from a file or standard input. Use `--` before a filename beginning with `-`. `--explain` prints each rule's output, `--json` emits structured results and diagnostics, `--ignore-case` adds `i`, and `--dot-all` adds `s`. Run `node bin/regex-for-humans.js --help` for usage.

## Scope

Output targets JavaScript `RegExp`. The fixed grammar includes anchors, character classes, literals, sets, and repetition. Free-form English, groups, alternation, lookaround, backreferences, and raw regex are not supported. See the [security model](docs/SECURITY_MODEL.md) for workshop execution limits.

## Develop

```sh
npm ci
npm run check
npm test
npm run build:pages
npm run test:package
```

To run browser tests: `npx playwright install chromium` then `npm run test:browser`. See [testing and compatibility](docs/TESTING.md), [contributing](CONTRIBUTING.md), [changelog](CHANGELOG.md), and [MIT license](LICENSE). Report security issues through the private process in [SECURITY.md](SECURITY.md).
