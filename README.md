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

Use **Go to error** in the local workshop to focus the position reported by a compilation error.

![Regex For Humans workshop showing line start, any text, 3 digits, line end, and three passing example checks](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png)

<details>
<summary>Mobile screenshot</summary>

![Mobile view of the Regex For Humans workshop](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-mobile-dev.png)

</details>

[Screenshot source and checksums](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md).

## Write a rule

Put one rule on each line. `start` can prefix the first rule. Quote exact text; use `start` and `end` to anchor the match.

| Meaning | Rule | Regex source |
| --- | --- | --- |
| Input bounds | `start` · `end` | `^` · `$` |
| Line bounds | `line start` · `line end` | `^` · `$` with `m` |
| Character | `digit` · `not digit` | `\d` · `\D` |
| Repeated digits | `3 digits` · `digits` | `\d{3}` · `\d+` |
| Any text | `any text` | `.*` |
| Exact text | `"ABC"` | `ABC` |
| Character set | `one of: a, b` | `[ab]` |
| Text without characters | `text without: a, b` | `[^ab]*` |

Use `word`/`not word` for JavaScript's `\w`/`\W`; misleading `alphanumeric character` aliases are rejected. Rule errors include line and column. The [language guide](docs/LANGUAGE.md) covers syntax, flags, and limits.

## Example: date shape

`start` / `4 digits` / `"-"` / `2 digits` / `"-"` / `2 digits` / `end`

This compiles to `^\d{4}-\d{2}-\d{2}$`. It checks the YYYY-MM-DD shape; it does not validate month or day values.

The workshop also has a version-shape recipe: `start` / `digits` / `"."` / `digits` / `"."` / `digits` / `end`. Its `^\d+\.\d+\.\d+$` matches three numeric components such as `1.2.3`, allows leading zeros and rejects prerelease suffixes. Full Semantic Versioning rules require separate validation.

## Use it from JavaScript

The package includes TypeScript declarations.

```js
import { compile, toRegExp } from './index.js';

const result = compile('start 3 digits\nend');
console.log(result.source); // ^\d{3}$
console.log(toRegExp(result).test('123')); // true
```

Import `./index.js` from the repository checkout.

## CLI options

Read UTF-8 rules from a file or standard input. Malformed UTF-8 is rejected instead of replacing bytes. Use `--` before a filename beginning with `-`. `--explain` prints each rule's output. `--json` prints results to stdout and errors to stderr: rule diagnostics keep their codes, invalid arguments use `CLI_USAGE`, and file/runtime errors (including invalid UTF-8) use `CLI_ERROR`. `--ignore-case` adds `i`, and `--dot-all` adds `s`. Run `node bin/regex-for-humans.js --help` for usage.

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

To run browser tests: `npx playwright install chromium` then `npm run test:browser`. See [testing and compatibility](docs/TESTING.md), [contributing](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md), [changelog](CHANGELOG.md), and [MIT license](LICENSE). Report security issues through the private process in [SECURITY.md](SECURITY.md).
