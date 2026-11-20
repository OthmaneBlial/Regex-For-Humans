# Recipes

Every recipe opens in the [workshop](https://othmaneblial.github.io/Regex-For-Humans/workshop/) with its rules, the generated regex and examples that must and must not match. The rules and cases live in [`test/fixtures/product-scenarios.json`](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/test/fixtures/product-scenarios.json); the test suite recompiles each one.

Recipes named *shape* check a layout, not the meaning: IPv4 shape accepts `999.999.999.999`. Where a validating version exists (IPv4, 24-hour time, calendar date), it is listed next to the shape.

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
| [Validate a calendar date](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=calendar-date) | `2026-09-30` | Month 01–12, day 01–31, captured as year, month and day |
| [⏰ Time shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | `09:30` | The `HH:MM` shape with ASCII digits |
| [Validate a 24-hour time](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=clock-time) | `23:59` | `00:00` to `23:59`; rejects `24:00` |
| [📞 Phone-number shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | `+33123456789` | Optional `+`, then 7–15 ASCII digits |
| [🌐 IPv4 address shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | `192.0.2.42` | Four groups of 1–3 ASCII digits; range checks are separate |
| [Validate an IPv4 address](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-address) | `192.168.1.1` | Four numbers from 0 to 255, without leading zeros |
| [📄 Text filename shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | `report.txt` | 1–64 Unicode code points before `.txt`, excluding separators, NUL and line breaks |
| [🗃️ Complex artifact manifest](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | Tab-separated path, checksum and size | 19 rules, an optional directory, bounded Unicode path and nine preloaded test cases |
| [🌐 Complex access log](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | Address, timestamp, request and quoted fields | 43 rules and eight preloaded cases; shape checks, without field extraction |
| [🛰️ Complex telemetry event](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | Timestamp, IDs, duration and optional values | 38 rules and nine preloaded cases; independent optional lane value and retry suffix |
| [📦 Version shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | `1.2.3` | Three numeric components |
| [🚧 Excluded characters](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | `xyz` | Text without a chosen set of characters |
| [📝 Line rule](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | `item 123` | A line ending in at least three digits |
| [Match a lowercase slug](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=slug) | `hello-world` | ASCII letters/digits with single hyphen separators |
| [Find a file extension](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=file-extension) | `README.md` | Case-sensitive txt, md or json suffix |
| [Match a UTC timestamp shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=iso8601-shape) | `2026-10-11T09:30:00Z` | Optional fractional seconds; calendar checks stay separate |
| [Match a simple HTTPS URL shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=https-url-shape) | `https://example.com` | Small ASCII-host subset; not complete URL validation |
| [Extract a simple header field](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=http-header) | `Content-Type: application/json` | Named field and single-line value |
| [Match a Markdown heading fragment](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=markdown-heading) | `# Hello` | One to six # characters and a heading |
| [Validate SemVer 2.0 syntax](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | `1.2.3-alpha.1+001` | Core, prerelease and build syntax; no precedence comparison |
| [Match a Git object hash shape](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=git-object-hash) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` | 40 or 64 ASCII hex characters; existence checks stay separate |
| [Match two repeated words](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | `hello hello` | Named backward reference to an ASCII word |
| [Detect adjacent duplicate tokens](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=duplicate-token) | `item,item` | One comma-separated pair, 1–16 word characters each |
| [Match Unicode letters and marks](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=unicode-word) | `العربية / اردو` | Native L/M properties, including Arabic and Urdu |
| [Extract named fields from a log fragment](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | `INFO code=200` | Named level and code from a searched fragment |
| [Search and replace a typo](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=replace-word) | `teh then teh → the then teh` | Exact spans, captures and non-global replacement expectations |

The library contains **34 recipes across 24 categories and three difficulty levels**. Search titles, limitations and rules in the four interface languages, then combine category and difficulty filters. See the [library guide](EXAMPLE_LIBRARY.md) for scope and limits.

Failed examples also receive [evidence-based explanations](FAILURE_EXPLANATIONS.md): native match ranges, a provable minimum length or an absent required literal. When the precise failing step is unknown, the workshop says so.

Choose [beginner, intermediate or expert explanations](EXPLANATION_LEVELS.md). Beginner notes define regex terms; expert notes expose source ranges, capture identities, resolved references and flags. Changing the level preserves your work and runs no matching.

**Shapes have limits:** UUID shape follows the bare hex-and-dash layout in [RFC 9562 section 4](https://www.rfc-editor.org/rfc/rfc9562.html#section-4); version, variant and uniqueness require separate checks. Braces and a `urn:uuid:` prefix are excluded. text filename shape allows spaces, dots and punctuation; check filesystem rules and file existence separately. phone-number shape allows leading zeros and excludes spaces and punctuation; check country rules and number validity separately. invoice IDs allow leading zeros; verify invoice records separately. Username shape does not check availability or a service's account rules. Date shape accepts impossible dates such as `2026-02-31`; validate calendar values separately. Time shape accepts `25:99`; validate hour and minute ranges separately. Version shape allows leading zeros and rejects prerelease suffixes; it isn't full SemVer. Hex color accepts `#RRGGBB`, not shorthand, alpha, or every CSS color form. Product-code shape accepts only its stated ASCII letter case and counts; adding `i` ignores case, and the pattern does not verify catalog records.

For four larger formats with every rule explained, read [complex examples](COMPLEX-EXAMPLES.md).
