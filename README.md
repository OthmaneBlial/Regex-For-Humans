<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: little rules, big aha moments](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Write it. Understand it. Test it.**

A few clear English rules become a JavaScript regex you can actually follow.

### [🚀 Open the playground](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 Visit the site](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 Learn the syntax](docs/LANGUAGE.md)

🔒 **Runs locally** &nbsp; 🧩 **No runtime dependencies** &nbsp; ⚡ **One compiler, three ways to use it**

</div>

---

## 🪄 Less squinting. More matching.

Regex punctuation gets easier to read when you can see where it came from.

<table>
<tr><th>✍️ Your rules</th><th>✨ Your JavaScript regex</th></tr>
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

A small, **fixed vocabulary**, with an exact meaning for every instruction. The library, CLI, and workshop use the same deterministic compiler. Unknown phrases get a line, column, and helpful diagnostic.

> 🌱 **Development preview:** local use needs **Node.js 22+**. The package is **not published on npm yet**. The [hosted workshop](https://othmaneblial.github.io/Regex-For-Humans/workshop/) works without installation.

## 🎮 Play with a pattern

1. **Pick a recipe** or write one instruction per line.
2. **Follow the fragments** to see what every rule means.
3. **Try your examples** and mark what should match.
4. **Copy the regex** when the results make sense.

Your rules and examples stay in the browser. No account, AI interpretation, or application backend.

[![Real desktop workshop showing editable rules, generated regex, explanations, and passing example checks](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=0aa7a9f27078)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

<details>
<summary>📱 See the mobile workshop</summary>

![Mobile view of the Regex For Humans workshop](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-mobile-dev.png?v=68866e560029)

</details>

[Real screenshot details and checksums](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md).

## 🍱 Eleven recipes to start with

| Try this | Example | What it checks |
| --- | --- | --- |
| [🏷️ Prefixed ID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | `ABC123` | `ABC` + exactly three digits |
| [🧾 Invoice ID shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | `INV-1234` | `INV-` + two to six ASCII digits |
| [👤 Username shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | `Alice_7` | ASCII letter first, then word characters; 3–16 total |
| [🎨 Hex color](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | `#12aBcF` | Six hexadecimal digits after `#`, either letter case |
| [📅 Date shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | `2026-09-30` | The `YYYY-MM-DD` shape |
| [⏰ Time shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | `09:30` | The `HH:MM` shape with ASCII digits |
| [📞 Phone-number shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | `+33123456789` | Optional `+`, then 7–15 ASCII digits |
| [📄 Text filename shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | `report.txt` | 1–64 Unicode code points before `.txt`, excluding separators, NUL and line breaks |
| [📦 Version shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | `1.2.3` | Three numeric components |
| [🚧 Excluded characters](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | `xyz` | Text without a chosen set of characters |
| [📝 Line rule](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | `item 123` | A line ending in at least three digits |

**Shapes have limits:** text filename shape allows spaces, dots and punctuation; check filesystem rules and file existence separately. phone-number shape allows leading zeros and excludes spaces and punctuation; check country rules and number validity separately. invoice IDs allow leading zeros; verify invoice records separately. Username shape does not check availability or a service's account rules. Date shape accepts impossible dates such as `2026-02-31`; validate calendar values separately. Time shape accepts `25:99`; validate hour and minute ranges separately. Version shape allows leading zeros and rejects prerelease suffixes; it isn't full SemVer. Hex color accepts `#RRGGBB`, not shorthand, alpha, or every CSS color form.

## 🧩 Your pocket cheat sheet

Put one instruction on each line. Quote literal text. Add anchors to check the whole string.

| Say this | Get this | Meaning |
| --- | --- | --- |
| `start` · `end` | `^` · `$` | Input bounds |
| `line start` · `line end` | `^` · `$` + `m` | Line bounds |
| `digit` · `not digit` | `\d` · `\D` | One digit / one non-digit |
| `3 digits` · `digits` | `\d{3}` · `\d+` | Exactly three / one or more |
| `between 2 and 4 digits` | `\d{2,4}` | Two to four digits, inclusive |
| `hex digit` · `6 hex digits` | `[0-9A-Fa-f]` · `[0-9A-Fa-f]{6}` | ASCII hexadecimal digits |
| `letter` · `letters` | `[A-Za-z]` · `[A-Za-z]+` | One ASCII letter / one or more |
| `space` · `spaces` | `\s` · `\s+` | One whitespace character / one or more, including line breaks |
| `"hello"` | `hello` | Exact text, safely escaped |
| `one of: a, b` | `[ab]` | One character from the list |
| `text without: a, b` | `[^ab]*` | Zero or more characters outside the list |
| `any text` | `.*` | Any text; `s` includes line breaks |

`word` / `not word` use JavaScript's `\w` / `\W`. They aren't every Unicode letter: `\w` includes `_` and excludes `é`. Use `letter` / `letters` to exclude digits and underscores; counts work too, such as `3 letters`. Unicode mode `u` is always on. With `i`, the ASCII letter class also matches Unicode case-folding equivalents such as `K` and `ſ`. See the [full language guide](docs/LANGUAGE.md) for flags, escaping, limits, and diagnostics.

## 💻 Bring it to your terminal

From a clone, with Node.js 22+:

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

```text
/^ABC\d{3}$/u
```

✅ `ABC123` &nbsp; ❌ `ABC12`, `ABC1234`, `abc123`

| Option | What it does |
| --- | --- |
| `--explain` | Show each rule's fragment and meaning |
| `--json` | Structured results on stdout; errors on stderr |
| `--ignore-case` | Add flag `i` |
| `--dot-all` | Add flag `s` |
| `--help` | Show usage |

Read UTF-8 rules from a file or stdin. Use `--` before a filename starting with `-`.

`--help` includes a runnable POSIX-shell example. Exit codes are `0` for success/help/version, `1` for invalid rules or input/output failures, and `2` for invalid command arguments.

<details>
<summary>🔧 CLI error contract</summary>

Malformed UTF-8 is rejected. In JSON mode, rule diagnostics retain their codes, invalid arguments use `CLI_USAGE`, and file/runtime failures use `CLI_ERROR`, including invalid UTF-8 and stdout write failures. If stderr also fails, the CLI exits nonzero without a diagnostic.

Control characters and Unicode line separators from rules, arguments and filenames appear as visible escapes in CLI output. JSON decoding restores the original data; displayed regexes still match the original characters.

</details>

## 📦 Use the JavaScript library

Import from the checkout. TypeScript declarations are included.

```js
import { compile, toRegExp } from './index.js';

const result = compile('start 3 digits\nend');
console.log(result.source);                // ^\d{3}$
console.log(toRegExp(result).test('123'));  // true
console.log(result.segments);              // Each fragment + explanation
```

## 🛠️ Make yourself at home

Run the workshop locally:

```sh
npm ci
npm run build
npm run serve
```

Open **http://127.0.0.1:4174/**. **Go to error** jumps to a reported source position.

To choose an available port automatically, use `npm run serve -- 0` and open the URL printed by the server.

Run all quality checks locally:

```sh
npm run verify
```

This runs lint, formatting, types, docs, Node tests, the Pages build, clean-consumer package checks, browser tests, and a dependency audit. GitHub CI is disabled. Browser checks use installed Chrome; for Playwright Chromium, install it with `npx playwright install chromium` and run `CI=1 npm run verify` locally.

## 🧭 Know the boundaries

Output targets **JavaScript `RegExp`**. Free-form English, raw regex, groups, alternation, lookaround, and backreferences are outside the supported language. The workshop tests examples in a time-limited worker; a copied regex needs its own execution safeguards. Read the [security model](docs/SECURITY_MODEL.md).

---

<div align="center">

**Small language. Clear meaning. Happy matching.** 🥳

[📖 Language](docs/LANGUAGE.md) · [🧪 Testing](docs/TESTING.md) · [🤝 Contributing](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [📝 Changelog](CHANGELOG.md) · [⚖️ MIT](LICENSE)

Security issue? Use the private process in [SECURITY.md](SECURITY.md).

</div>
