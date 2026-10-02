<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: little rules, big aha moments](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Write it. Understand it. Test it.**

A few clear English rules become a JavaScript regex you can actually follow.

### [🚀 Open the playground](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 Visit the site](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 Learn the syntax](docs/LANGUAGE.md) · [📦 npm preview](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.1)

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

> 🌱 **Development preview (`0.1.0-dev.1`):** the library and CLI need **Node.js 22+**. The [hosted workshop](https://othmaneblial.github.io/Regex-For-Humans/workshop/) works without installation. Human usability and screen reader reviews are still pending.

## 📦 Install the preview

```sh
npm install regex-for-humans@preview
```

Use the CLI without a global install:

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

This prints `/^ABC\d{3}$/u`. To pin the exact preview, use `regex-for-humans@0.1.0-dev.1`. There are no runtime dependencies or standalone OS executables.

## 🎮 Play with a pattern

1. **Pick a recipe** or write one instruction per line.
2. **Follow the fragments** to see what every rule means.
3. **Try your examples** and mark what should match.
4. **Copy the regex** when the results make sense.

Your rules and examples stay in the browser. No account, AI interpretation, or application backend.

## 🔄 Already have a regex?

Paste a supported JavaScript regex literal into **Already have a regex?** in the workshop and turn it into editable rules. Press **Ctrl/Cmd + Enter** in the regex field or choose **Translate to rules**. For example, `/^[A-Z]{2}-\d{4}$/u` becomes:

```text
start
2 uppercase letter
"-"
4 digit
end
```

The workshop expects a slash-delimited literal with `u`; write line breaks as escapes such as `\n`. The reverse translator preserves supported `i`, `s`, `m` and `u` behavior. It rejects syntax it cannot express, including alternation, lookaround, backreferences and lazy quantifiers; see the [language guide](docs/LANGUAGE.md) for its exact limits.

Reverse translation also handles JavaScript's empty negative class `[^]`, which includes line breaks. When ordinary `.` atoms appear beside it, their output rules explicitly exclude line terminators so matching stays the same.

Letter and hex ranges can appear in equivalent orders: `[a-zA-Z]` becomes `letter`, and all six orders of `0-9`, `A-F` and `a-f` become `hex digit`. Generated regexes use a canonical range order with the same matching behavior.

Path-component exclusions become readable rules too: `/^[^/\\\0\n\r\u2028\u2029]{1,32}$/u` becomes `start`, `between 1 and 32 path segment character`, `end` on separate lines. Reordering, duplicate exclusions and equivalent escape spellings keep the same translation.

Control-letter escapes also translate: `/^\cJ{2}$/u` becomes `start`, `2 "\n"`, `end` on separate lines. Control characters stay visible as escapes in the rules and generated regex.

Separator lists such as `[._-]` and `[-._]` translate too: a hyphen at either end stays literal. The generated class escapes it as `\-`.

Alternation errors point to `|` and suggest translating each alternative separately. Literal pipes such as `\|` or `[|]` remain supported.

Capturing groups, including named captures, lookahead and lookbehind each get a specific error at their opening `(`. Use **Go to regex error** to select that character in your pasted pattern and bring it into view. Failed translation preserves your current rules and options.

Empty non-capturing groups translate too: `/(?:)/u` becomes `0 any character`. Search mode finds an empty match at position 0, including in nonempty input; Entire string mode accepts only blank input for this pattern.

[![Real desktop workshop showing editable rules, generated regex, explanations, and passing example checks](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=89bc7db9875a)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

<details>
<summary>📱 See the mobile workshop</summary>

![Mobile view of the Regex For Humans workshop](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-mobile-dev.png?v=8f26739ed284)

</details>

[Real screenshot details and checksums](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md).

## 🍱 Recipes to start with

| Try this | Example | What it checks |
| --- | --- | --- |
| [🏷️ Prefixed ID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | `ABC123` | `ABC` + exactly three digits |
| [🧾 Invoice ID shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | `INV-1234` | `INV-` + two to six ASCII digits |
| [👤 Username shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | `Alice_7` | ASCII letter first, then word characters; 3–16 total |
| [🎨 Hex color](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | `#12aBcF` | Six hexadecimal digits after `#`, either letter case |
| [🔌 MAC address shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=mac-address-shape) | `00:1A:2B:3C:4D:5E` | Six colon-separated pairs of ASCII hexadecimal digits |
| [🪪 UUID shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=uuid-shape) | `f81d4fae-7dec-11d0-a765-00a0c91e6bf6` | Five ASCII hex groups of 8–4–4–4–12 characters, either letter case |
| [🔡 Product-code shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=product-code-shape) | `AB-rgb-0420` | Two uppercase, three lowercase ASCII letters, and four digits |
| [📅 Date shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | `2026-09-30` | The `YYYY-MM-DD` shape |
| [⏰ Time shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | `09:30` | The `HH:MM` shape with ASCII digits |
| [📞 Phone-number shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | `+33123456789` | Optional `+`, then 7–15 ASCII digits |
| [🌐 IPv4 address shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | `192.0.2.42` | Four groups of 1–3 ASCII digits; range checks are separate |
| [📄 Text filename shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | `report.txt` | 1–64 Unicode code points before `.txt`, excluding separators, NUL and line breaks |
| [🗃️ Complex artifact manifest](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | Tab-separated path, checksum and size | 19 rules, an optional directory, bounded Unicode path and nine preloaded test cases |
| [🌐 Complex access log](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | Address, timestamp, request and quoted fields | 43 rules and eight preloaded cases; shape checks, without field extraction |
| [🛰️ Complex telemetry event](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | Timestamp, IDs, duration and optional values | 38 rules and nine preloaded cases; independent optional lane value and retry suffix |
| [📦 Version shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | `1.2.3` | Three numeric components |
| [🚧 Excluded characters](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | `xyz` | Text without a chosen set of characters |
| [📝 Line rule](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | `item 123` | A line ending in at least three digits |

**Shapes have limits:** UUID shape follows the bare hex-and-dash layout in [RFC 9562 section 4](https://www.rfc-editor.org/rfc/rfc9562.html#section-4); version, variant and uniqueness require separate checks. Braces and a `urn:uuid:` prefix are excluded. text filename shape allows spaces, dots and punctuation; check filesystem rules and file existence separately. phone-number shape allows leading zeros and excludes spaces and punctuation; check country rules and number validity separately. invoice IDs allow leading zeros; verify invoice records separately. Username shape does not check availability or a service's account rules. Date shape accepts impossible dates such as `2026-02-31`; validate calendar values separately. Time shape accepts `25:99`; validate hour and minute ranges separately. Version shape allows leading zeros and rejects prerelease suffixes; it isn't full SemVer. Hex color accepts `#RRGGBB`, not shorthand, alpha, or every CSS color form. Product-code shape accepts only its stated ASCII letter case and counts; adding `i` ignores case, and the pattern does not verify catalog records.

## 🏗️ Bigger patterns, same readable rules

A three-digit ID is only the starting point. The [full complex-examples guide](docs/COMPLEX-EXAMPLES.md) walks through four substantial formats, with **35 accepted/rejected cases** and the compiler's **complete explanation for every rule**:

| Example | What it combines |
| --- | --- |
| 🌐 Access log | 43 rules for address, timestamp, request, status and quoted fields |
| 🛰️ Structured event | 38 rules, trace/span IDs, bounded fields and independent optional values |
| 📦 Artifact manifest | Optional directory, variable version/path parts, checksum shape and TSV separators |
| 🧾 Multiline order | Unicode buyer, phone/amount shapes, optional approval value and complete optional priority line |

<!-- complex:artifact-manifest -->

### 📦 Example: an artifact manifest

**Readable rules**

```text
start
"incoming/"
optional "nightly/"
between 1 and 32 path segment characters
"/v"
between 1 and 3 digits
"."
between 1 and 3 digits
"."
between 1 and 3 digits
"/linux-arm64/widget_"
8 digits
"_"
8 hex digits
".tar.gz\t"
64 hex digits
"\t"
between 1 and 12 digits
end
```

**Exact generated JavaScript regex**

```js
/^incoming\/(?:nightly\/){0,1}[^\/\\\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,32}\/v\d{1,3}\.\d{1,3}\.\d{1,3}\/linux-arm64\/widget_\d{8}_[0-9A-Fa-f]{8}\.tar\.gz\u{9}[0-9A-Fa-f]{64}\u{9}\d{1,12}$/u
```

<!-- /complex:artifact-manifest -->

This synthetic schema accepts a path such as `incoming/nightly/WidgetKit/v2.15.3/linux-arm64/widget_20261001_ab12cd34.tar.gz`, followed by a tab, 64 hex digits, another tab and a 1–12 digit byte count. The whole `nightly/` directory is optional. `path segment characters` replaces the long escaped exclusion list while keeping its exact matching behavior. Missing version parts, a non-hex token or spaces replacing the tabs are rejected. Check file existence, checksum contents and calendar/version semantics separately.

<details>
<summary>🧾 Second complete example: a multiline order</summary>

<!-- complex:multiline-order -->

### 🧾 Example: a multiline order

**Readable rules**

```text
start
"ORDER\nid=ORD-"
8 hex digits
"\nbuyer="
between 1 and 60 none of: "\u0000", "\n", "\r", "\u2028", "\u2029"
"\nphone="
optional "+"
between 7 and 15 digits
"\nitems="
between 1 and 4 digits
"\ntotal="
between 1 and 6 digits
"."
2 digits
" EUR\nreference="
16 hex digits
"\napproval="
optional one of: "A", "D"
"\n"
optional "priority=HIGH\n"
"END"
optional "\n"
end
```

**Exact generated JavaScript regex**

```js
/^ORDER\u{a}id=ORD-[0-9A-Fa-f]{8}\u{a}buyer=[^\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,60}\u{a}phone=\+{0,1}\d{7,15}\u{a}items=\d{1,4}\u{a}total=\d{1,6}\.\d{2} EUR\u{a}reference=[0-9A-Fa-f]{16}\u{a}approval=[AD]{0,1}\u{a}(?:priority=HIGH\u{a}){0,1}END\u{a}{0,1}$/u
```

<!-- /complex:multiline-order -->

`Zoë 😀` works as the buyer. The phone's `+`, approval's A/D value and whole `priority=HIGH\n` line are optional independently. A missing buyer, one decimal digit in the amount or an unsupported priority value fails. This schema uses explicit LF line endings; the library and CLI preserve that distinction, while browser textareas normalize pasted CRLF.

</details>

**Capture and nesting limits:** these examples validate complete shapes; they do not extract fields. Named/numbered captures and composite or nested groups remain unsupported and get positioned errors. Optional single atoms and whole fixed literals work today. See the [working examples and exact unsupported-pattern diagnostics](docs/COMPLEX-EXAMPLES.md#captures-and-nested-groups).

## 🧩 Your pocket cheat sheet

Put one instruction on each line. Quote literal text. Add anchors to check the whole string.

| Say this | Get this | Meaning |
| --- | --- | --- |
| `start` · `end` | `^` · `$` | Input bounds |
| `line start` · `line end` | `^` · `$` + `m` | Line bounds |
| `digit` · `not digit` | `\d` · `\D` | One digit / one non-digit |
| `3 digits` · `digits` | `\d{3}` · `\d+` | Exactly three / one or more |
| `lowercase letters` · `uppercase letters` | `[a-z]+` · `[A-Z]+` | ASCII case-specific letters; `i` ignores the distinction |
| `between 2 and 4 digits` | `\d{2,4}` | Two to four digits, inclusive |
| `optional "-"` | `-{0,1}` | Zero or one hyphen |
| `hex digit` · `6 hex digits` | `[0-9A-Fa-f]` · `[0-9A-Fa-f]{6}` | ASCII hexadecimal digits |
| `letter` · `letters` | `[A-Za-z]` · `[A-Za-z]+` | One ASCII letter / one or more |
| `space` · `spaces` | `\s` · `\s+` | One whitespace character / one or more, including line breaks |
| `between 1 and 32 path segment characters` | 1–32 Unicode code points | Excludes slash, backslash, NUL and line breaks |
| `"hello"` | `hello` | Exact text, safely escaped |
| `one of: a, b` | `[ab]` | One character from the list |
| `text without: a, b` | `[^ab]*` | Zero or more characters outside the list |
| `any text` | `.*` | Any text; `s` includes line breaks |

`word character` matches an ASCII letter, digit or underscore; `word characters` matches one or more. Set a length with `between 3 and 30 word characters`. The shorter `word` and `not word` rules still use JavaScript's `\w` / `\W`. They aren't every Unicode letter: `\w` includes `_` and excludes `é`. Use `letter` / `letters` to exclude digits and underscores; counts work too, such as `3 letters`. Without `i`, `lowercase letters` and `uppercase letters` match only their ASCII ranges. The `i` flag ignores that distinction and adds JavaScript case-folding equivalents such as `K` and `ſ`. Unicode mode `u` is always on. See the [full language guide](docs/LANGUAGE.md) for flags, escaping, limits, and diagnostics.

## 💻 Bring it to your terminal

With Node.js 22+, install the preview globally if you want the command on your PATH:

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

Or run directly from a clone:

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
| `--version` | Show the package version |

Read UTF-8 rules from a file or stdin. Use `--` before a filename starting with `-`.

`--help` includes a runnable POSIX-shell example. Exit codes are `0` for success/help/version, `1` for invalid rules or input/output failures, and `2` for invalid command arguments.

<details>
<summary>🔧 CLI error contract</summary>

Malformed UTF-8 is rejected with a message to save the input as UTF-8 and try again; invalid bytes are never replaced silently. This applies to both rules and reverse-mode regex literals. In JSON mode, rule diagnostics retain their codes, invalid arguments use `CLI_USAGE`, and file/runtime failures use `CLI_ERROR`, including invalid UTF-8 and stdout write failures. If stderr also fails, the CLI exits nonzero without a diagnostic.

Control characters and Unicode line separators from rules, arguments and filenames appear as visible escapes in CLI output. JSON decoding restores the original data; displayed regexes still match the original characters.

</details>

### 🔄 Translate a regex back into rules

The `0.1.0-dev.1` preview includes `--reverse`. Translate a slash-delimited JavaScript regex with the required `u` flag:

```sh
printf '%s\n' '/^[A-Z]{2}-[0-9]{4}$/u' | npx --yes --package=regex-for-humans@preview regex-for-humans --reverse
```

```text
start
2 uppercase letter
"-"
4 digit
end
```

Use `--reverse --json` for `{ rules, flags }`, matching `regexToRules()`. Pass the returned `flags` to `compile()` to preserve `i` and `s`; `m` is represented by line anchors and `u` is automatic. Plain output contains reusable rules, with the required forward compiler options on stderr when `i` or `s` is present. These notes accompany a successful exit code. Reverse mode accepts a file or stdin and cannot be combined with `--explain`, `--ignore-case` or `--dot-all`.

## 📦 Use the JavaScript library

After `npm install regex-for-humans@preview`, import the package in an ES module (`.mjs`, or a project with `"type": "module"`). TypeScript declarations are included. From a source checkout, use `./index.js` instead.

```js
import { compile, regexToRules, toRegExp } from 'regex-for-humans';

const result = compile('start 3 digits\nend');
console.log(result.source);                // ^\d{3}$
console.log(toRegExp(result).test('123'));  // true
console.log(result.segments);              // Each fragment + explanation

const reverse = regexToRules(/^[A-Z]{2}-\d{4}$/u);
console.log(reverse.rules);                 // start\n2 uppercase letter\n"-"\n4 digit\nend
console.log(reverse.flags);                 // Flags to pass back to compile()
```

TypeScript accepts cached compile metadata: `toRegExp({ source, flags })`. Both fields must be strings; explanation segments are not needed or read. Complete compile results remain accepted.

`compile("digit", { flags: undefined })` uses the default `u` flag, just like omitting `flags`. Its TypeScript option type accepts this with `exactOptionalPropertyTypes` enabled. `toRegExp()` metadata still requires string flags.

`regexToRules()` also accepts genuine regexes from other JavaScript contexts, such as iframes or Node's `vm`, and leaves their `lastIndex` unchanged. It translates the stored native pattern and flags; subclass or own-property metadata overrides do not change the translation. Matching methods and custom `Symbol.match` getters are not called.

Unicode escapes can include leading zeros: `/^\u{00000041}$/u` translates to `start`, `"A"`, `end` on separate lines. The same escapes work in character lists and literal groups; the regex source still has a 16,384-code-unit limit.

## 🛠️ Make yourself at home

Run the workshop locally:

```sh
npm ci
npm run build
npm run serve
```

Open **http://127.0.0.1:4174/**. **Go to error** jumps to a reported source position.

To choose an available port automatically, use `npm run serve -- 0` and open the URL printed by the server. Directory URLs automatically redirect to their trailing-slash form, preserving query strings so nested pages and their relative assets load correctly.

Run all quality checks locally:

```sh
npm ci
npm exec -- playwright install firefox webkit
npm run verify
```

This runs lint, formatting, types, docs, Node tests, the Pages build, clean-consumer package checks, desktop/mobile Chromium tests, Firefox/WebKit compatibility smoke tests, and a dependency audit. GitHub CI is disabled. The full gate uses installed Chrome plus Playwright Firefox and WebKit.

If Chrome is unavailable, install all three Playwright engines after `npm ci` and use bundled Chromium for the desktop/mobile suites:

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

`CI=1` selects the bundled browser locally; it does not enable GitHub Actions.

## 🧭 Know the boundaries

Output targets **JavaScript `RegExp`**. Raw regex is not accepted as rule text; `regexToRules()` translates only the documented safe subset back into rules. Free-form English, alternation, lookaround and backreferences remain unsupported. The workshop tests examples in a time-limited worker; a copied regex needs its own execution safeguards. Read the [security model](docs/SECURITY_MODEL.md).

---

<div align="center">

**Small language. Clear meaning. Happy matching.** 🥳

[📖 Language](docs/LANGUAGE.md) · [🧪 Testing](docs/TESTING.md) · [🤝 Contributing](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [📝 Changelog](CHANGELOG.md) · [⚖️ MIT](LICENSE)

Security issue? Use the private process in [SECURITY.md](SECURITY.md).

</div>
