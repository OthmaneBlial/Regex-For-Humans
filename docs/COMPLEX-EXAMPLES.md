# 🧠 Complex examples you can actually run

Long records deserve more than a three-digit demo. These four examples combine bounded variable fields, separators, quoted text, Unicode and optional pieces using the existing deterministic language. Each includes the exact generated regex, the compiler's explanation for every rule, and accepted/rejected inputs.

**Scope:** this version validates a selected format's shape. It does not extract captures, parse arbitrary nested structures or translate every JavaScript regex. See [captures and nested groups](#captures-and-nested-groups) for concrete diagnostics.

## 🏃 Run an example

In the [workshop](https://othmaneblial.github.io/Regex-For-Humans/workshop/), paste a Rules block into the editor, choose **Entire string**, and try its inputs. Keep Ignore case and Dot matches newline off for the exact output below. You can also paste its generated regex into **Already have a regex?** and translate it back.

From a checkout with Node.js 22+, save a Rules block as `example.rules`, then run:

```sh
node bin/regex-for-humans.js --explain example.rules
node bin/regex-for-humans.js --json example.rules
```

Or compile that file through the library:

```js
import { readFileSync } from 'node:fs';
import { compile, regexToRules, toRegExp } from './index.js';

const result = compile(readFileSync('example.rules', 'utf8'));
const regex = toRegExp(result);
console.log(regex);
console.table(result.segments.map(({ line, source, explanation }) => ({
  line, source, explanation,
})));
console.log(regexToRules(regex).rules);
// regex.test(yourInput) validates these anchored document shapes.
```

### Examples at a glance

| Example | Rules | Generated source length | Main difficulty |
| --- | --- | --- | --- |
| [🌐 Access log: a long record with quoted fields](#access-log) | 43 | 294 UTF-16 code units | Quoted fields and many bounded slots |
| [🛰️ Structured event: fixed and dynamic optional values](#structured-event) | 38 | 274 UTF-16 code units | Independent optional fixed and variable values |
| [📦 Artifact manifest: path, optional channel, hash and size](#artifact-manifest) | 19 | 186 UTF-16 code units | Optional path component, TSV and checksum shape |
| [🧾 Multiline order: Unicode, lengths and optional lines](#multiline-order) | 23 | 255 UTF-16 code units | Whole document, Unicode and optional line |

<a id="access-log"></a>

## 🌐 Access log: a long record with quoted fields

A custom access-log shape with an IPv4-looking address, username, timestamp, request, response status, byte count, referer and user agent. Quoted fields may contain spaces where allowed. This checks the whole record; it does not extract its fields.

### Example input

```text
198.51.100.42 - alice [10/Oct/2026:13:55:36 +0200] "GET /v1/users/42?mode=full HTTP/1.1" 200 1234 "https://example.test/" "ExampleBrowser/1.0"
```

### Rules

```text
start
between 1 and 3 digits
"."
between 1 and 3 digits
"."
between 1 and 3 digits
"."
between 1 and 3 digits
" - "
between 1 and 32 none of: " ", "\n", "\r", "\u2028", "\u2029"
" ["
2 digits
"/"
3 letters
"/"
4 digits
":"
2 digits
":"
2 digits
":"
2 digits
" "
one of: "+", "-"
4 digits
"] \""
between 3 and 7 uppercase letters
" "
between 1 and 200 none of: " ", "\"", "\n", "\r", "\u2028", "\u2029"
" HTTP/"
digit
"."
digit
"\" "
3 digits
" "
between 1 and 10 digits
" \""
between 1 and 200 none of: "\"", "\n", "\r", "\u2028", "\u2029"
"\" \""
between 1 and 200 none of: "\"", "\n", "\r", "\u2028", "\u2029"
"\""
end
```

### Generated regex

```js
/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3} - [^ \u{a}\u{d}\u{2028}\u{2029}]{1,32} \[\d{2}\/[A-Za-z]{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+\-]\d{4}\] "[A-Z]{3,7} [^ "\u{a}\u{d}\u{2028}\u{2029}]{1,200} HTTP\/\d\.\d" \d{3} \d{1,10} "[^"\u{a}\u{d}\u{2028}\u{2029}]{1,200}" "[^"\u{a}\u{d}\u{2028}\u{2029}]{1,200}"$/u
```

Each variable field is bounded and separated by explicit punctuation. Changing the user-agent limit means editing one rule, rather than finding the right repeated class inside the dense expression.

### Accepted and rejected inputs

Inputs below are JSON strings: `\n` means an LF and `\t` a tab. Decode the string before testing; the quotes are not part of the input.

| Result | Input as a JSON string | Reason |
| --- | --- | --- |
| ✅ Match | `"198.51.100.42 - alice [10/Oct/2026:13:55:36 +0200] \"GET /v1/users/42?mode=full HTTP/1.1\" 200 1234 \"https://example.test/\" \"ExampleBrowser/1.0\""` | All fields have the required shape. |
| ✅ Match | `"198.51.100.42 - - [10/Oct/2026:13:55:36 +0200] \"GET /v1/users/42?mode=full HTTP/1.1\" 200 1234 \"https://example.test/\" \"Example Browser 1.0\""` | A dash username and spaces inside the quoted user agent are allowed. |
| ✅ Match | `"999.999.999.999 - alice [99/Xyz/2026:13:55:36 +0200] \"GET /v1/users/42?mode=full HTTP/1.1\" 200 1234 \"https://example.test/\" \"ExampleBrowser/1.0\""` | Deliberate shape-only case: octet and calendar values are not checked. |
| ❌ No match | `"198.51.100.1234 - alice [10/Oct/2026:13:55:36 +0200] \"GET /v1/users/42?mode=full HTTP/1.1\" 200 1234 \"https://example.test/\" \"ExampleBrowser/1.0\""` | An octet exceeds three digits. |
| ❌ No match | `"198.51.100.42 - alice [10/Oct/2026:13:55:36 +0200] \"get /v1/users/42?mode=full HTTP/1.1\" 200 1234 \"https://example.test/\" \"ExampleBrowser/1.0\""` | Method must use uppercase ASCII letters. |
| ❌ No match | `"198.51.100.42 - alice [10/Oct/2026:13:55:36 +0200] \"GET /v1/users 42 HTTP/1.1\" 200 1234 \"https://example.test/\" \"ExampleBrowser/1.0\""` | Request target cannot contain a space. |
| ❌ No match | `"198.51.100.42 - alice [10/Oct/2026:13:55:36 +0200] \"GET /v1/users/42?mode=full HTTP/1.1\" 200 1234 \"https://example.test/\" \"Example\nBrowser/1.0\""` | A quoted field cannot cross a line boundary. |
| ❌ No match | `"198.51.100.42 - alice [10/Oct/2026:13:55:36 +0200] \"GET /v1/users/42?mode=full HTTP/1.1\" 200 1234 \"https://example.test/\" \"ExampleBrowser/1.0\"\n"` | No trailing newline is part of this record. |

<details>
<summary>🔍 Full explanation: every rule and regex fragment</summary>

These rows are the compiler's actual `segments` output, in order.

| Line | Rule | Regex fragment | Explanation |
| --- | --- | --- | --- |
| 1 | `start` | `^` | Input start. |
| 2 | `between 1 and 3 digits` | `\d{1,3}` | Between 1 and 3 digits (0–9), inclusive. |
| 3 | `"."` | `\.` | Literal text ".". |
| 4 | `between 1 and 3 digits` | `\d{1,3}` | Between 1 and 3 digits (0–9), inclusive. |
| 5 | `"."` | `\.` | Literal text ".". |
| 6 | `between 1 and 3 digits` | `\d{1,3}` | Between 1 and 3 digits (0–9), inclusive. |
| 7 | `"."` | `\.` | Literal text ".". |
| 8 | `between 1 and 3 digits` | `\d{1,3}` | Between 1 and 3 digits (0–9), inclusive. |
| 9 | `" - "` | ` - ` | Literal text " - ". |
| 10 | `between 1 and 32 none of: " ", "\n", "\r", "\u2028", "\u2029"` | `[^ \u{a}\u{d}\u{2028}\u{2029}]{1,32}` | Any character except " ", "\n", "\r", "\u2028", "\u2029". Between 1 and 32 times (inclusive). |
| 11 | `" ["` | ` \[` | Literal text " [". |
| 12 | `2 digits` | `\d{2}` | Exactly 2 digits (0–9). |
| 13 | `"/"` | `\/` | Literal text "/". |
| 14 | `3 letters` | `[A-Za-z]{3}` | Exactly 3 ASCII letters (A–Z, a–z). |
| 15 | `"/"` | `\/` | Literal text "/". |
| 16 | `4 digits` | `\d{4}` | Exactly 4 digits (0–9). |
| 17 | `":"` | `:` | Literal text ":". |
| 18 | `2 digits` | `\d{2}` | Exactly 2 digits (0–9). |
| 19 | `":"` | `:` | Literal text ":". |
| 20 | `2 digits` | `\d{2}` | Exactly 2 digits (0–9). |
| 21 | `":"` | `:` | Literal text ":". |
| 22 | `2 digits` | `\d{2}` | Exactly 2 digits (0–9). |
| 23 | `" "` | ` ` | Literal text " ". |
| 24 | `one of: "+", "-"` | `[+\-]` | One of "+", "-". |
| 25 | `4 digits` | `\d{4}` | Exactly 4 digits (0–9). |
| 26 | `"] \""` | `\] "` | Literal text "] \"". |
| 27 | `between 3 and 7 uppercase letters` | `[A-Z]{3,7}` | Between 3 and 7 uppercase ASCII letters (A–Z), inclusive. |
| 28 | `" "` | ` ` | Literal text " ". |
| 29 | `between 1 and 200 none of: " ", "\"", "\n", "\r", "\u2028", "\u2029"` | `[^ "\u{a}\u{d}\u{2028}\u{2029}]{1,200}` | Any character except " ", "\"", "\n", "\r", "\u2028", "\u2029". Between 1 and 200 times (inclusive). |
| 30 | `" HTTP/"` | ` HTTP\/` | Literal text " HTTP/". |
| 31 | `digit` | `\d` | One digit (0–9). |
| 32 | `"."` | `\.` | Literal text ".". |
| 33 | `digit` | `\d` | One digit (0–9). |
| 34 | `"\" "` | `" ` | Literal text "\" ". |
| 35 | `3 digits` | `\d{3}` | Exactly 3 digits (0–9). |
| 36 | `" "` | ` ` | Literal text " ". |
| 37 | `between 1 and 10 digits` | `\d{1,10}` | Between 1 and 10 digits (0–9), inclusive. |
| 38 | `" \""` | ` "` | Literal text " \"". |
| 39 | `between 1 and 200 none of: "\"", "\n", "\r", "\u2028", "\u2029"` | `[^"\u{a}\u{d}\u{2028}\u{2029}]{1,200}` | Any character except "\"", "\n", "\r", "\u2028", "\u2029". Between 1 and 200 times (inclusive). |
| 40 | `"\" \""` | `" "` | Literal text "\" \"". |
| 41 | `between 1 and 200 none of: "\"", "\n", "\r", "\u2028", "\u2029"` | `[^"\u{a}\u{d}\u{2028}\u{2029}]{1,200}` | Any character except "\"", "\n", "\r", "\u2028", "\u2029". Between 1 and 200 times (inclusive). |
| 42 | `"\""` | `"` | Literal text "\"". |
| 43 | `end` | `$` | Input end. |

</details>

**What this does not validate:** IPv4 octets are not restricted to 0–255. Month names, calendar dates, time ranges, HTTP methods/statuses and protocol versions are not validated semantically. The referer is not URL-validated. Embedded escaped quotes are outside this selected quoted-field shape. Use a log parser when you need field extraction or the complete format grammar.

<a id="structured-event"></a>

## 🛰️ Structured event: fixed and dynamic optional values

A custom telemetry record with a millisecond timestamp, service name, trace/span IDs, request fields, response size and duration. The `lane=` field always exists, but its A/B/C value is optional. The entire fixed suffix ` retry=true` is optional independently.

### Example input

```text
2026-10-01T14:23:05.123Z level=INFO service=api_1 trace=0123456789abcdef0123456789abcdef span=0123456789abcdef method=POST route=/v1/users/42 status=201 bytes=1234 duration=26.500ms lane=A retry=true
```

### Rules

```text
start
4 digits
"-"
2 digits
"-"
2 digits
"T"
2 digits
":"
2 digits
":"
2 digits
"."
3 digits
"Z level="
between 4 and 5 uppercase letters
" service="
between 3 and 30 word
" trace="
32 hex digits
" span="
16 hex digits
" method="
between 3 and 7 uppercase letters
" route="
between 1 and 200 none of: " ", "\n", "\r", "\u2028", "\u2029"
" status="
3 digits
" bytes="
between 1 and 10 digits
" duration="
between 1 and 7 digits
"."
3 digits
"ms lane="
optional one of: "A", "B", "C"
optional " retry=true"
end
```

### Generated regex

```js
/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z level=[A-Z]{4,5} service=\w{3,30} trace=[0-9A-Fa-f]{32} span=[0-9A-Fa-f]{16} method=[A-Z]{3,7} route=[^ \u{a}\u{d}\u{2028}\u{2029}]{1,200} status=\d{3} bytes=\d{1,10} duration=\d{1,7}\.\d{3}ms lane=[ABC]{0,1}(?: retry=true){0,1}$/u
```

The two optional rules generate `[ABC]{0,1}` and `(?: retry=true){0,1}`. The non-capturing group keeps the entire fixed suffix together. These are independent options, not conditional fields.

### Accepted and rejected inputs

Inputs below are JSON strings: `\n` means an LF and `\t` a tab. Decode the string before testing; the quotes are not part of the input.

| Result | Input as a JSON string | Reason |
| --- | --- | --- |
| ✅ Match | `"2026-10-01T14:23:05.123Z level=INFO service=api_1 trace=0123456789abcdef0123456789abcdef span=0123456789abcdef method=POST route=/v1/users/42 status=201 bytes=1234 duration=26.500ms lane=A retry=true"` | Both optional pieces are present. |
| ✅ Match | `"2026-10-01T14:23:05.123Z level=INFO service=api_1 trace=0123456789abcdef0123456789abcdef span=0123456789abcdef method=POST route=/v1/users/42 status=201 bytes=1234 duration=26.500ms lane="` | Both optional pieces are absent; the fixed lane= label remains. |
| ✅ Match | `"2026-10-01T14:23:05.123Z level=INFO service=api_1 trace=0123456789abcdef0123456789abcdef span=0123456789abcdef method=POST route=/v1/users/42 status=201 bytes=1234 duration=26.500ms lane=C"` | Dynamic lane value is present; fixed suffix is absent. |
| ✅ Match | `"2026-10-01T14:23:05.123Z level=INFO service=api_1 trace=0123456789abcdef0123456789abcdef span=0123456789abcdef method=POST route=/v1/users/42 status=201 bytes=1234 duration=26.500ms lane= retry=true"` | Fixed suffix is present; dynamic lane value is absent. |
| ❌ No match | `"2026-10-01T14:23:05.123Z level=INFO service=api_1 trace=0123456789abcdef0123456789abcdef span=0123456789abcdef method=POST route=/v1/users/42 status=201 bytes=1234 duration=26.500ms lane=D retry=true"` | D is outside the listed lane values. |
| ❌ No match | `"2026-10-01T14:23:05.123Z level=INFO service=api_1 trace=0123456789abcdef0123456789abcdef span=0123456789abcdef method=POST route=/v1/users/42 status=201 bytes=1234 duration=26.500ms lane=A retry=false"` | Only the exact fixed suffix is allowed. |
| ❌ No match | `"2026-10-01T14:23:05.123Z level=INFO service=api_1 trace=0123456789abcdef span=0123456789abcdef method=POST route=/v1/users/42 status=201 bytes=1234 duration=26.500ms lane=A retry=true"` | Trace ID must contain exactly 32 hexadecimal digits. |
| ❌ No match | `"2026-10-01T14:23:05.123Z level=INFO service=api_1 trace=0123456789abcdef0123456789abcdef span=0123456789abcdef method=POST route=/v1/users/42 status=201 bytes=1234 duration=26.50ms lane=A retry=true"` | Duration requires exactly three fractional digits. |
| ❌ No match | `"2026-10-01T14:23:05.123Z level=INFO service=api-prod trace=0123456789abcdef0123456789abcdef span=0123456789abcdef method=POST route=/v1/users/42 status=201 bytes=1234 duration=26.500ms lane=A retry=true"` | Service name uses word characters; a hyphen is excluded. |

<details>
<summary>🔍 Full explanation: every rule and regex fragment</summary>

These rows are the compiler's actual `segments` output, in order.

| Line | Rule | Regex fragment | Explanation |
| --- | --- | --- | --- |
| 1 | `start` | `^` | Input start. |
| 2 | `4 digits` | `\d{4}` | Exactly 4 digits (0–9). |
| 3 | `"-"` | `-` | Literal text "-". |
| 4 | `2 digits` | `\d{2}` | Exactly 2 digits (0–9). |
| 5 | `"-"` | `-` | Literal text "-". |
| 6 | `2 digits` | `\d{2}` | Exactly 2 digits (0–9). |
| 7 | `"T"` | `T` | Literal text "T". |
| 8 | `2 digits` | `\d{2}` | Exactly 2 digits (0–9). |
| 9 | `":"` | `:` | Literal text ":". |
| 10 | `2 digits` | `\d{2}` | Exactly 2 digits (0–9). |
| 11 | `":"` | `:` | Literal text ":". |
| 12 | `2 digits` | `\d{2}` | Exactly 2 digits (0–9). |
| 13 | `"."` | `\.` | Literal text ".". |
| 14 | `3 digits` | `\d{3}` | Exactly 3 digits (0–9). |
| 15 | `"Z level="` | `Z level=` | Literal text "Z level=". |
| 16 | `between 4 and 5 uppercase letters` | `[A-Z]{4,5}` | Between 4 and 5 uppercase ASCII letters (A–Z), inclusive. |
| 17 | `" service="` | ` service=` | Literal text " service=". |
| 18 | `between 3 and 30 word` | `\w{3,30}` | Word character: ASCII letter, digit or underscore. With i, a few Unicode equivalents match. Between 3 and 30 times (inclusive). |
| 19 | `" trace="` | ` trace=` | Literal text " trace=". |
| 20 | `32 hex digits` | `[0-9A-Fa-f]{32}` | Exactly 32 hexadecimal digits (0–9, A–F, a–f). |
| 21 | `" span="` | ` span=` | Literal text " span=". |
| 22 | `16 hex digits` | `[0-9A-Fa-f]{16}` | Exactly 16 hexadecimal digits (0–9, A–F, a–f). |
| 23 | `" method="` | ` method=` | Literal text " method=". |
| 24 | `between 3 and 7 uppercase letters` | `[A-Z]{3,7}` | Between 3 and 7 uppercase ASCII letters (A–Z), inclusive. |
| 25 | `" route="` | ` route=` | Literal text " route=". |
| 26 | `between 1 and 200 none of: " ", "\n", "\r", "\u2028", "\u2029"` | `[^ \u{a}\u{d}\u{2028}\u{2029}]{1,200}` | Any character except " ", "\n", "\r", "\u2028", "\u2029". Between 1 and 200 times (inclusive). |
| 27 | `" status="` | ` status=` | Literal text " status=". |
| 28 | `3 digits` | `\d{3}` | Exactly 3 digits (0–9). |
| 29 | `" bytes="` | ` bytes=` | Literal text " bytes=". |
| 30 | `between 1 and 10 digits` | `\d{1,10}` | Between 1 and 10 digits (0–9), inclusive. |
| 31 | `" duration="` | ` duration=` | Literal text " duration=". |
| 32 | `between 1 and 7 digits` | `\d{1,7}` | Between 1 and 7 digits (0–9), inclusive. |
| 33 | `"."` | `\.` | Literal text ".". |
| 34 | `3 digits` | `\d{3}` | Exactly 3 digits (0–9). |
| 35 | `"ms lane="` | `ms lane=` | Literal text "ms lane=". |
| 36 | `optional one of: "A", "B", "C"` | `[ABC]{0,1}` | One of "A", "B", "C". Optional. |
| 37 | `optional " retry=true"` | `(?: retry=true){0,1}` | Literal text " retry=true". Optional. |
| 38 | `end` | `$` | Input end. |

</details>

**What this does not validate:** This is a selected telemetry schema, not a general log parser. Timestamp values, level names, HTTP status/method semantics, trace authenticity and service registration need separate checks. `optional` applies to one atom: a character list here, or one whole fixed literal. It cannot make a block containing labels and variable rules optional together.

<a id="artifact-manifest"></a>

## 📦 Artifact manifest: path, optional channel, hash and size

A synthetic TSV record: an artifact path, a 64-digit hexadecimal checksum and a decimal byte count. The path includes an optional fixed `nightly/` directory, variable project/version components and bounded filename parts. This describes an example schema; no artifact or release is implied.

### Example input

```text
incoming/nightly/WidgetKit/v2.15.3/linux-arm64/widget_20261001_ab12cd34.tar.gz	abababababababababababababababababababababababababababababababab	1048576
```

### Rules

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

### Generated regex

```js
/^incoming\/(?:nightly\/){0,1}[^\/\\\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,32}\/v\d{1,3}\.\d{1,3}\.\d{1,3}\/linux-arm64\/widget_\d{8}_[0-9A-Fa-f]{8}\.tar\.gz\u{9}[0-9A-Fa-f]{64}\u{9}\d{1,12}$/u
```

`between 1 and 32 path segment characters` keeps the component length readable. It replaces the seven escaped exclusions with one named atom; the exact generated regex stays the same. A repeated multi-character literal such as `optional "nightly/"` compiles to one optional non-capturing group. Literal tabs remain visible as `\u{9}` in the generated regex and as `\t` in the rules.

### Accepted and rejected inputs

Inputs below are JSON strings: `\n` means an LF and `\t` a tab. Decode the string before testing; the quotes are not part of the input.

| Result | Input as a JSON string | Reason |
| --- | --- | --- |
| ✅ Match | `"incoming/nightly/WidgetKit/v2.15.3/linux-arm64/widget_20261001_ab12cd34.tar.gz\tabababababababababababababababababababababababababababababababab\t1048576"` | Optional directory, path, checksum and size have the required shapes. |
| ✅ Match | `"incoming/WidgetKit/v2.15.3/linux-arm64/widget_20261001_ab12cd34.tar.gz\tabababababababababababababababababababababababababababababababab\t1048576"` | The entire nightly/ directory is optional. |
| ✅ Match | `"incoming/nightly/Équipe 😀/v2.15.3/linux-arm64/widget_20261001_ab12cd34.tar.gz\tabababababababababababababababababababababababababababababababab\t1048576"` | Project component accepts Unicode code points. |
| ❌ No match | `"incoming/nightly/nightly/WidgetKit/v2.15.3/linux-arm64/widget_20261001_ab12cd34.tar.gz\tabababababababababababababababababababababababababababababababab\t1048576"` | The fixed directory may occur at most once. |
| ❌ No match | `"incoming/nightly/WidgetKit/v2.15/linux-arm64/widget_20261001_ab12cd34.tar.gz\tabababababababababababababababababababababababababababababababab\t1048576"` | Three version components are required. |
| ❌ No match | `"incoming/nightly/WidgetKit/v2.15.3/linux-arm64/widget_20261001_ab12cd3g.tar.gz\tabababababababababababababababababababababababababababababababab\t1048576"` | Filename token must use hexadecimal digits. |
| ❌ No match | `"incoming/nightly/WidgetKit/v2.15.3/linux-arm64/widget_20261001_ab12cd34.tar.gz\tababababababababababababababababababababababababababababababab\t1048576"` | Checksum needs exactly 64 hexadecimal digits. |
| ❌ No match | `"incoming/nightly/WidgetKit/v2.15.3/linux-arm64/widget_20261001_ab12cd34.tar.gz abababababababababababababababababababababababababababababababab 1048576"` | TSV separators are literal tabs, not spaces. |
| ❌ No match | `"incoming/nightly/bad\nname/v2.15.3/linux-arm64/widget_20261001_ab12cd34.tar.gz\tabababababababababababababababababababababababababababababababab\t1048576"` | Project component cannot contain a line break. |

<details>
<summary>🔍 Full explanation: every rule and regex fragment</summary>

These rows are the compiler's actual `segments` output, in order.

| Line | Rule | Regex fragment | Explanation |
| --- | --- | --- | --- |
| 1 | `start` | `^` | Input start. |
| 2 | `"incoming/"` | `incoming\/` | Literal text "incoming/". |
| 3 | `optional "nightly/"` | `(?:nightly\/){0,1}` | Literal text "nightly/". Optional. |
| 4 | `between 1 and 32 path segment characters` | `[^\/\\\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,32}` | Path segment character: excludes slash, backslash, NUL and line breaks. Between 1 and 32 times (inclusive). |
| 5 | `"/v"` | `\/v` | Literal text "/v". |
| 6 | `between 1 and 3 digits` | `\d{1,3}` | Between 1 and 3 digits (0–9), inclusive. |
| 7 | `"."` | `\.` | Literal text ".". |
| 8 | `between 1 and 3 digits` | `\d{1,3}` | Between 1 and 3 digits (0–9), inclusive. |
| 9 | `"."` | `\.` | Literal text ".". |
| 10 | `between 1 and 3 digits` | `\d{1,3}` | Between 1 and 3 digits (0–9), inclusive. |
| 11 | `"/linux-arm64/widget_"` | `\/linux-arm64\/widget_` | Literal text "/linux-arm64/widget_". |
| 12 | `8 digits` | `\d{8}` | Exactly 8 digits (0–9). |
| 13 | `"_"` | `_` | Literal text "_". |
| 14 | `8 hex digits` | `[0-9A-Fa-f]{8}` | Exactly 8 hexadecimal digits (0–9, A–F, a–f). |
| 15 | `".tar.gz\t"` | `\.tar\.gz\u{9}` | Literal text ".tar.gz\t". |
| 16 | `64 hex digits` | `[0-9A-Fa-f]{64}` | Exactly 64 hexadecimal digits (0–9, A–F, a–f). |
| 17 | `"\t"` | `\u{9}` | Literal text "\t". |
| 18 | `between 1 and 12 digits` | `\d{1,12}` | Between 1 and 12 digits (0–9), inclusive. |
| 19 | `end` | `$` | Input end. |

</details>

**What this does not validate:** The example checks neither file existence nor platform support nor reserved filesystem names. The checksum has the right length/alphabet but is not recomputed. Version parts allow leading zeros and do not implement full SemVer. The eight-digit date is not calendar-validated. No relationship between project name and filename is enforced; the filename prefix is the fixed literal widget_.

<a id="multiline-order"></a>

## 🧾 Multiline order: Unicode, lengths and optional lines

A complete LF-separated document with explicit labels and line order. It combines an ID, Unicode buyer name, optional phone prefix, item count, amount, reference, optional approval value and optional fixed priority line. `start` / `end` anchor the entire document; no `m` or `s` flag is needed.

### Example input

```text
ORDER
id=ORD-ab12cd34
buyer=Zoë 😀
phone=+33123456789
items=12
total=249.90 EUR
reference=0123456789abcdef
approval=A
priority=HIGH
END
```

### Rules

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

### Generated regex

```js
/^ORDER\u{a}id=ORD-[0-9A-Fa-f]{8}\u{a}buyer=[^\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,60}\u{a}phone=\+{0,1}\d{7,15}\u{a}items=\d{1,4}\u{a}total=\d{1,6}\.\d{2} EUR\u{a}reference=[0-9A-Fa-f]{16}\u{a}approval=[AD]{0,1}\u{a}(?:priority=HIGH\u{a}){0,1}END\u{a}{0,1}$/u
```

Literal newlines join the document fields explicitly. The optional priority line is a fixed literal including its terminating LF, so its entire line disappears together. Making a priority line with an arbitrary variable value optional would require unsupported composite groups.

### Accepted and rejected inputs

Inputs below are JSON strings: `\n` means an LF and `\t` a tab. Decode the string before testing; the quotes are not part of the input.

| Result | Input as a JSON string | Reason |
| --- | --- | --- |
| ✅ Match | `"ORDER\nid=ORD-ab12cd34\nbuyer=Zoë 😀\nphone=+33123456789\nitems=12\ntotal=249.90 EUR\nreference=0123456789abcdef\napproval=A\npriority=HIGH\nEND"` | Unicode buyer and both optional pieces are accepted. |
| ✅ Match | `"ORDER\nid=ORD-ab12cd34\nbuyer=Zoë 😀\nphone=+33123456789\nitems=12\ntotal=249.90 EUR\nreference=0123456789abcdef\napproval=\nEND"` | Approval value and entire priority line may both be absent. |
| ✅ Match | `"ORDER\nid=ORD-ab12cd34\nbuyer=Zoë 😀\nphone=33123456789\nitems=12\ntotal=249.90 EUR\nreference=0123456789abcdef\napproval=D\npriority=HIGH\nEND\n"` | Phone prefix is optional; D and one final LF are allowed. |
| ❌ No match | `"ORDER\nid=ORD-ab12cd34\nbuyer=\nphone=+33123456789\nitems=12\ntotal=249.90 EUR\nreference=0123456789abcdef\napproval=A\npriority=HIGH\nEND"` | Buyer needs at least one Unicode code point. |
| ❌ No match | `"ORDER\nid=ORD-ab12cd34\nbuyer=Zoë 😀\nphone=+33123456789\nitems=12\ntotal=249.9 EUR\nreference=0123456789abcdef\napproval=A\npriority=HIGH\nEND"` | Amount requires two decimal digits. |
| ❌ No match | `"ORDER\nid=ORD-ab12cd34\nbuyer=Zoë 😀\nphone=+33123456789\nitems=12\ntotal=249.90 EUR\nreference=0123456789abcdef\napproval=A\npriority=LOW\nEND"` | Only the complete fixed HIGH line is allowed. |
| ❌ No match | `"ORDER\r\nid=ORD-ab12cd34\r\nbuyer=Zoë 😀\r\nphone=+33123456789\r\nitems=12\r\ntotal=249.90 EUR\r\nreference=0123456789abcdef\r\napproval=A\r\npriority=HIGH\r\nEND"` | The library/CLI schema requires LF, not CRLF. |
| ❌ No match | `"ORDER\nid=ORD-ab12cd34\nbuyer=Zoë\n😀\nphone=+33123456789\nitems=12\ntotal=249.90 EUR\nreference=0123456789abcdef\napproval=A\npriority=HIGH\nEND"` | Buyer cannot insert an extra document line. |
| ❌ No match | `"ORDER\nid=ORD-ab12cd34\nbuyer=Zoë 😀\nphone=+33123456789\nitems=12\ntotal=249.90 EUR\nreference=0123456789abcdef\napproval=A\npriority=HIGH\nEND\n\n"` | Only zero or one final LF is allowed. |

<details>
<summary>🔍 Full explanation: every rule and regex fragment</summary>

These rows are the compiler's actual `segments` output, in order.

| Line | Rule | Regex fragment | Explanation |
| --- | --- | --- | --- |
| 1 | `start` | `^` | Input start. |
| 2 | `"ORDER\nid=ORD-"` | `ORDER\u{a}id=ORD-` | Literal text "ORDER\nid=ORD-". |
| 3 | `8 hex digits` | `[0-9A-Fa-f]{8}` | Exactly 8 hexadecimal digits (0–9, A–F, a–f). |
| 4 | `"\nbuyer="` | `\u{a}buyer=` | Literal text "\nbuyer=". |
| 5 | `between 1 and 60 none of: "\u0000", "\n", "\r", "\u2028", "\u2029"` | `[^\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,60}` | Any character except "\u0000", "\n", "\r", "\u2028", "\u2029". Between 1 and 60 times (inclusive). |
| 6 | `"\nphone="` | `\u{a}phone=` | Literal text "\nphone=". |
| 7 | `optional "+"` | `\+{0,1}` | Literal text "+". Optional. |
| 8 | `between 7 and 15 digits` | `\d{7,15}` | Between 7 and 15 digits (0–9), inclusive. |
| 9 | `"\nitems="` | `\u{a}items=` | Literal text "\nitems=". |
| 10 | `between 1 and 4 digits` | `\d{1,4}` | Between 1 and 4 digits (0–9), inclusive. |
| 11 | `"\ntotal="` | `\u{a}total=` | Literal text "\ntotal=". |
| 12 | `between 1 and 6 digits` | `\d{1,6}` | Between 1 and 6 digits (0–9), inclusive. |
| 13 | `"."` | `\.` | Literal text ".". |
| 14 | `2 digits` | `\d{2}` | Exactly 2 digits (0–9). |
| 15 | `" EUR\nreference="` | ` EUR\u{a}reference=` | Literal text " EUR\nreference=". |
| 16 | `16 hex digits` | `[0-9A-Fa-f]{16}` | Exactly 16 hexadecimal digits (0–9, A–F, a–f). |
| 17 | `"\napproval="` | `\u{a}approval=` | Literal text "\napproval=". |
| 18 | `optional one of: "A", "D"` | `[AD]{0,1}` | One of "A", "D". Optional. |
| 19 | `"\n"` | `\u{a}` | Literal text "\n". |
| 20 | `optional "priority=HIGH\n"` | `(?:priority=HIGH\u{a}){0,1}` | Literal text "priority=HIGH\n". Optional. |
| 21 | `"END"` | `END` | Literal text "END". |
| 22 | `optional "\n"` | `\u{a}{0,1}` | Literal text "\n". Optional. |
| 23 | `end` | `$` | Input end. |

</details>

**What this does not validate:** This is a document-shape check, not an invoice/order parser or validator. Phone validity, positive item counts, monetary arithmetic, reference existence and approval authorization are separate concerns. Counts for the buyer are Unicode code points, not user-perceived grapheme clusters. The selected schema is LF-only; browser textareas normalize pasted CRLF, so use the library or CLI for exact byte/line-ending checks.

## Captures and nested groups

The concern about captures and nesting is valid: this version does **not** support them. Longer flat records compose from the documented atoms, but adding capture/extraction semantics or optional blocks of variable rules would need a language extension. Reverse translation rejects the entire unsupported pattern instead of returning approximate or partial rules.

| JavaScript pattern | Diagnostic | Column | Message |
| --- | --- | --- | --- |
| `/^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u` | `UNSUPPORTED_REGEX` | 2 | Capturing groups cannot be translated. |
| `/^(?:AB(?:CD)?)$/u` | `UNSUPPORTED_REGEX` | 7 | Groups can contain literal text only. |
| `/^(?:[A-Z]{2}(?:-\d{4})?)$/u` | `UNSUPPORTED_REGEX` | 5 | Groups can contain literal text only. |

Columns are one-based UTF-16 positions in `regex.source`, excluding the surrounding slashes and flags. In the third pattern the character class inside the outer group is rejected before the nested group is reached. The workshop's **Go to regex error** action selects the relevant source character; a failed translation preserves existing rules and options.

A literal-only group such as `(?: retry=true)?` is supported: it becomes `optional " retry=true"`. A composite group such as `(?: retry=\d+)?` is not. Removing a capture, assertion or grouping operation can change behavior, so these examples do not recommend stripping unsupported syntax to force conversion.

For structured extraction, full protocol grammars or nested data, use the corresponding parser or keep the original regex. The [language reference](LANGUAGE.md) describes the supported atoms and limits.

## 🧪 Evidence you can reproduce

The [executable documentation checks](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/test/complex-examples.test.js) read this Markdown directly. They compile each Rules block, compare the complete generated source and every explanation row, test all listed inputs, run the same rules through CLI JSON/explanation output, and check reverse-translation matching and positions. They also verify the exact capture/nested-group diagnostics above. No separate example copy can silently drift away from the guide.

From the checkout:

```sh
node --test test/complex-examples.test.js
```

These checks verify the examples against the library and CLI, including their reverse translations.
