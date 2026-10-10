<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: साफ़ नियमों से असली regex तक](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**लिखें। समझें। जाँचें।**

अंग्रेज़ी में लिखे स्पष्ट नियमों को ऐसे JavaScript regex में बदलें, जिसके हर हिस्से का अर्थ समझ सकें।

[🚀 वर्कशॉप](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 वेबसाइट](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 सिंटैक्स](../LANGUAGE.md) · [📦 npm प्रीव्यू](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.3)

🔒 स्थानीय निष्पादन · 🧩 कोई runtime dependency नहीं · ⚡ एक compiler, तीन इंटरफ़ेस

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · **हिन्दी**

</div>

## 🪄 संकेतों को कम सुलझाएँ, पैटर्न को बेहतर समझें

जब regex बनाने वाले नियम दिखाई देते हैं, तो उसका परिणाम पढ़ना आसान होता है।

```text
start "#"
6 hex digits
end
```

```js
/^#[0-9A-Fa-f]{6}$/u
```

✅ `#12aBcF`, `#000000` · ❌ `#123`, `#G00000`

शब्दावली **निश्चित** है और हर निर्देश का सटीक अर्थ है। लाइब्रेरी, CLI और वर्कशॉप एक ही deterministic compiler इस्तेमाल करते हैं। अनजान निर्देश पर पंक्ति, कॉलम और सुधार का सुझाव मिलता है। सभी अनुवादों में नियमों का सिंटैक्स अंग्रेज़ी में ही रहता है।

> 🌱 प्रीव्यू `0.1.0-dev.3` की लाइब्रेरी और CLI के लिए **Node.js 22+** चाहिए। ऑनलाइन वर्कशॉप को इंस्टॉल नहीं करना पड़ता। उपयोग में आसानी और screen reader की मानवीय समीक्षा अभी बाकी है।

## 🧰 अभी क्या बनाया जा सकता है

| क्षमता | npm `0.1.0-dev.3` | वर्तमान स्रोत कोड |
| --- | --- | --- |
| नियम → JavaScript regex | ✅ | ✅ |
| समर्थित regex → संपादन योग्य नियम | ✅ सरल सिंटैक्स का हिस्सा | ✅ समर्थित समूह और संदर्भ भी |
| हर हिस्से की व्याख्या और मूल नियम तक पहुँचना | ✅ | ✅ समूहों के दोनों छोर और संदर्भ भी |
| CLI, ESM API और TypeScript types | ✅ | ✅ |
| नाम वाले/क्रमांकित captures और nested blocks | — | ✅ |
| पूरे block की पुनरावृत्ति और पिछले capture के संदर्भ | — | ✅ |
| विकल्प, lookaround और non-greedy quantifiers | — | योजना में; अभी अस्वीकृत |
| दूसरे regex engines या मुक्त अंग्रेज़ी वाक्य | — | वर्तमान भाषा के दायरे से बाहर |

स्रोत कोड की नई सुविधाएँ अभी npm पर प्रकाशित नहीं हैं। समूहों और संदर्भों के लिए `main` clone करें। वर्कशॉप और npm अलग वितरण हैं; [अनुकूलता](../COMPATIBILITY.md) और [प्रकाशन रिकॉर्ड](../DISTRIBUTION.md) देखें।

## 📦 प्रीव्यू इंस्टॉल करें

```sh
npm install regex-for-humans@preview
```

बिना global installation के CLI चलाएँ:

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

परिणाम `/^ABC\d{3}$/u` है। निश्चित संस्करण के लिए `regex-for-humans@0.1.0-dev.3` इस्तेमाल करें। runtime dependencies या हर OS के लिए अलग standalone executable उपलब्ध नहीं हैं।

## 🎮 पैटर्न आज़माएँ

1. कोई recipe चुनें या हर पंक्ति पर एक निर्देश लिखें।
2. बने हुए हिस्से और उनकी व्याख्या देखें।
3. उदाहरण जोड़ें और बताएँ कि किन्हें match करना चाहिए।
4. व्यवहार सही होने पर regex कॉपी करें।

आंशिक match में escape किया हुआ छोटा संदर्भ और highlight दिखाई देता है; खाली match के लिए स्थान का निशान मिलता है। नियम और उदाहरण ब्राउज़र में रहते हैं। अकाउंट, AI व्याख्या या application backend की ज़रूरत नहीं है।

[![डेस्कटॉप वर्कशॉप का वास्तविक स्क्रीनशॉट](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=89bc7db9875a)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

[मोबाइल दृश्य और checksums](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md)।

## 🔄 क्या regex पहले से मौजूद है?

**Already have a regex?** में समर्थित JavaScript literal पेस्ट करें। Ctrl/Cmd + Enter या **Translate to rules** दबाएँ। `/^[A-Z]{2}-\d{4}$/u` इन नियमों में बदलता है:

```text
start
2 uppercase letter
"-"
4 digit
end
```

`/` delimiters और ज़रूरी `u` flag रखें। नई पंक्ति को `\n` जैसे escape में लिखें। समर्थित `i`, `s`, `m` और `u` व्यवहार सुरक्षित रहता है। वर्तमान कोड captures, nested groups और पिछले captures के संदर्भ भी आयात करता है, उनके नाम, क्रमांक और values बनाए रखता है।

`[^]` को `s` के साथ किसी भी अक्षर में बदला जाता है। पास के सामान्य dots से line terminators स्पष्ट रूप से हटाए जाते हैं ताकि अर्थ न बदले। पूरे letter, word और hex character classes की समान व्यवस्थाएँ, path exclusions, control escapes और सूची के छोर पर literal hyphens पहचाने जाते हैं।

असमर्थित सिंटैक्स न हटाया जाता है, न अनुमान से बदला जाता है। **Go to regex error** मूल स्थान चुनता है; विफलता पर मौजूदा नियम और विकल्प सुरक्षित रहते हैं। आगे आने वाले या अभी खुले captures के संदर्भ अस्वीकृत हैं। खाली noncapturing group `0 any character` बनता है: search mode में खाली match मिल सकता है, entire-string mode में केवल खाली इनपुट स्वीकार होता है।

## 🍱 शुरुआत के लिए recipes

| Recipe | उदाहरण | क्या जाँचता है |
| --- | --- | --- |
| [Prefix वाला ID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | `ABC123` | Prefix और तीन अंक |
| [Invoice संख्या](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | `INV-1234` | `INV-` और 2–6 अंक |
| [Username](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | `Alice_7` | 3–16 अक्षर, शुरुआत ASCII letter से |
| [Hex रंग](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | `#12aBcF` | `#` के बाद छह hex अंक |
| [MAC पता](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=mac-address-shape) | `00:1A:2B:3C:4D:5E` | छह hex जोड़ियाँ |
| [UUID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=uuid-shape) | `8–4–4–4–12` | पाँच hex समूह |
| [Product code](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=product-code-shape) | `AB-rgb-0420` | निश्चित ASCII case और संख्या |
| [तारीख](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | `2026-09-30` | `YYYY-MM-DD` का आकार |
| [समय](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | `09:30` | `HH:MM` का आकार |
| [फ़ोन संख्या](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | `+33123456789` | वैकल्पिक `+`, फिर 7–15 अंक |
| [IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | `192.0.2.42` | 1–3 अंकों के चार समूह |
| [फ़ाइल नाम](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | `report.txt` | बिना separators का सीमित Unicode नाम |
| [Manifest](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | Path, hash, size | 19 नियम, नौ उदाहरण |
| [Access log](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | Request, status, size | 43 नियम, आठ उदाहरण |
| [Telemetry](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | IDs और वैकल्पिक values | 38 नियम, नौ उदाहरण |
| [संस्करण](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | `1.2.3` | तीन संख्यात्मक हिस्से |
| [अक्षरों को हटाना](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | `xyz` | चुने अक्षरों के बिना text |
| [पंक्ति का नियम](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | `item 123` | अंत में कम से कम तीन अंक |

ये **आकार की जाँचें** हैं। असंभव तारीख या `25:99` भी match हो सकते हैं। IPv4 octets को 255 तक सीमित नहीं करता; UUID का version, variant और uniqueness नहीं जाँचता। Username availability, invoice records, फ़ोन की वैधता, कैलेंडर और filesystem की शर्तें अलग जाँचें। Version recipe पूरा SemVer validator नहीं है; रंग केवल `#RRGGBB` है।

## 🏗️ बड़े पैटर्न, फिर भी स्पष्ट नियम

[पूरी उदाहरण गाइड](../COMPLEX-EXAMPLES.md) access logs, telemetry, manifests और multiline orders समझाती है। इसमें 35 स्वीकार/अस्वीकार cases और हर बने हुए हिस्से की व्याख्या है।

### 📦 Artifact manifest

वैकल्पिक `nightly/`, सीमित Unicode path, version, archive नाम, hash और size को tabs से अलग करता है:

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

```js
/^incoming\/(?:nightly\/){0,1}[^\/\\\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,32}\/v\d{1,3}\.\d{1,3}\.\d{1,3}\/linux-arm64\/widget_\d{8}_[0-9A-Fa-f]{8}\.tar\.gz\u{9}[0-9A-Fa-f]{64}\u{9}\d{1,12}$/u
```

फ़ाइल मौजूद है या उसका content सही है, यह नहीं जाँचता।

### 🧾 कई पंक्तियों वाला order

ID, Unicode buyer, फ़ोन, quantity, amount, reference, वैकल्पिक approval और पूरी वैकल्पिक priority line:

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

```js
/^ORDER\u{a}id=ORD-[0-9A-Fa-f]{8}\u{a}buyer=[^\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,60}\u{a}phone=\+{0,1}\d{7,15}\u{a}items=\d{1,4}\u{a}total=\d{1,6}\.\d{2} EUR\u{a}reference=[0-9A-Fa-f]{16}\u{a}approval=[AD]{0,1}\u{a}(?:priority=HIGH\u{a}){0,1}END\u{a}{0,1}$/u
```

नई पंक्तियाँ literal characters हैं। Amounts, फ़ोन और orders की वैधता application जाँचती है। गाइड के चार flat उदाहरण fields extract नहीं करते।

## 🧲 नाम वाले captures से fields निकालें

इस उदाहरण के लिए **वर्तमान स्रोत कोड** चाहिए; npm `0.1.0-dev.3` में captures नहीं हैं।

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
import { compile, toRegExp } from './index.js';

const rules = `start
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
end`;

const match = toRegExp(compile(rules)).exec('2026-10-10');
console.log(match?.groups); // { year: '2026', month: '10', day: '10' }
```

`capture {` क्रमांकित capture बनाता है; `group {` बिना capture किए grouping करता है। नाम unique JavaScript identifiers हैं। क्रमांक opening order के अनुसार होते हैं, nested groups में भी। अनुपस्थित optional capture `undefined` है; भाग लेने वाला खाली capture `""` है; repeated capture आख़िरी value रखता है।

Group बंद होने के बाद `same as capture "word"` या `same as capture 1` वही text माँगता है। [उदाहरण](../LANGUAGE.md#capture-references-unreleased-on-main) `cat cat` स्वीकार करता है, `cat dog` नहीं। आगे या अपने target के अंदर का reference diagnostic देता है। Reverse translation समर्थित captures रखती है। निकाली गई तारीख को कैलेंडर से अलग validate करें।

## 🧩 त्वरित संदर्भ

हर पंक्ति पर एक निर्देश; literal text को quotes में रखें।

| नियम | परिणाम | अर्थ |
| --- | --- | --- |
| `start` / `end` | `^` / `$` | इनपुट के छोर |
| `line start` / `line end` | `^` / `$` और `m` | पंक्तियों के छोर |
| `digit` / `not digit` | `\d` / `\D` | ASCII अंक या उसका पूरक |
| `3 digits` / `digits` | `\d{3}` / `\d+` | तीन या कम से कम एक |
| `between 2 and 4 digits` | `\d{2,4}` | दोनों सीमाएँ शामिल |
| `optional "-"` | `-{0,1}` | वैकल्पिक hyphen |
| `letter` / `letters` | `[A-Za-z]` / `[A-Za-z]+` | ASCII letters |
| `lowercase letters` / `uppercase letters` | `[a-z]+` / `[A-Z]+` | `i` अंतर को अनदेखा करता है |
| `6 hex digits` | `[0-9A-Fa-f]{6}` | छह hex अंक |
| `space` / `spaces` | `\s` / `\s+` | नई पंक्तियों सहित whitespace |
| `between 1 and 32 path segment characters` | 1–32 code points | Separators, NUL और नई पंक्तियाँ नहीं |
| `"hello"` | `hello` | Escape किया गया literal text |
| `one of: a, b` | `[ab]` | सूची का एक अक्षर |
| `text without: a, b` | `[^ab]*` | सूची के बाहर शून्य या अधिक अक्षर |
| `any text` | `.*` | `s` पर नई पंक्तियाँ भी |

`word character` / `word characters` और `word` / `not word`, `\w` / `\W` का व्यवहार लेते हैं। `_` शामिल है, `é` नहीं। `letter` अंक और underscore हटाता है। `i` पर JavaScript के equivalents `K` और `ſ` भी जुड़ सकते हैं। `u` हमेशा चालू है, लेकिन ASCII classes को सार्वभौमिक Unicode categories नहीं बनाता।

## 💻 टर्मिनल में इस्तेमाल करें

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

या clone से सीधे चलाएँ:

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

```text
/^ABC\d{3}$/u
```

✅ `ABC123` · ❌ `ABC12`, `ABC1234`, `abc123`

| विकल्प | काम |
| --- | --- |
| `--explain` | हर हिस्से और उसकी व्याख्या को दिखाता है |
| `--json` | stdout पर results, stderr पर errors |
| `--ignore-case` | `i` flag |
| `--dot-all` | `s` flag |
| `--help` | सहायता |
| `--version` | पैकेज संस्करण |

UTF-8 फ़ाइल या stdin पढ़ें। `-` से शुरू फ़ाइल नाम से पहले `--` लगाएँ। Exit codes: सफलता/सहायता/संस्करण के लिए `0`, invalid rules या I/O errors के लिए `1`, invalid arguments के लिए `2`।

Malformed UTF-8 चुपचाप बदला नहीं जाता, अस्वीकृत होता है। JSON में diagnostics के codes रहते हैं; arguments के लिए `CLI_USAGE`, file/runtime failures के लिए `CLI_ERROR`। Control characters visible escapes में दिखते हैं; JSON decode करने पर मूल data लौटता है। stderr भी विफल हो तो exit code फिर भी nonzero रहता है।

### 🔄 CLI से reverse translation

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

`--reverse --json` से `{ rules, flags }` मिलता है। `flags` को `compile()` में दें; `m` line anchors से और `u` अपने आप आता है। Text output ज़रूरी options stderr में बताता है और success exit code रखता है। Reverse mode को `--explain`, `--ignore-case` या `--dot-all` के साथ न मिलाएँ।

## 📦 JavaScript लाइब्रेरी

ESM इस्तेमाल करें (`.mjs` या `"type": "module"`)। TypeScript declarations शामिल हैं। Clone में `./index.js` import करें।

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

`toRegExp({ source, flags })` cached metadata स्वीकार करता है; दोनों strings चाहिए और segments नहीं पढ़े जाते। `compile("digit", { flags: undefined })`, `exactOptionalPropertyTypes` के साथ भी `u` लेता है।

`regexToRules()` दूसरे JavaScript contexts के असली regex स्वीकार करता है, `lastIndex` सुरक्षित रखता है और native metadata पढ़ता है। Matching methods या instance overrides नहीं बुलाता। `\u{00000041}` जैसे escapes स्रोत की सीमा के भीतर समर्थित हैं।

## 🎛️ Flags का स्पष्ट असर

| Flag | सक्रिय कैसे करें | प्रभाव |
| --- | --- | --- |
| `u` | हमेशा | Unicode code points |
| `i` | `{ flags: 'i' }` या `--ignore-case` | JavaScript की native case folding |
| `s` | `{ flags: 's' }` या `--dot-all` | Dot नई पंक्तियों से भी match करता है |
| `m` | `line start` / `line end` | हर पंक्ति के anchors |

`flags: 'is'` दोनों options जोड़ता है। `g`, `y`, `d` और `v` compiler options नहीं हैं। Output source से native regex बनाते समय application अपने execution flags चुन सकती है।

## 🛠️ स्थानीय development

```sh
npm ci
npm run build
npm run serve
```

**http://127.0.0.1:4174/** खोलें। `npm run serve -- 0` खाली port चुनता है। Directory redirects query parameters बचाकर आख़िरी slash जोड़ते हैं।

Chrome इंस्टॉल हो तो पूरे checks चलाएँ:

```sh
npm ci
npm exec -- playwright install firefox webkit
npm run verify
```

Chrome न हो तो Playwright का Chromium इस्तेमाल करें:

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

इसमें formatting, lint, types, links, Node tests, Pages build, clean consumer installation, browser checks और audit हैं। `CI=1` केवल स्थानीय browser चुनता है; बंद GitHub Actions को सक्रिय नहीं करता।

## 🧭 सीमाएँ समझें

लक्ष्य **JavaScript `RegExp`** है। Raw regex को rules की तरह और मुक्त अंग्रेज़ी को instructions की तरह स्वीकार नहीं करता। Reverse translation सिर्फ़ दस्तावेज़ित subset के लिए है। Alternatives, lookaround और future/open references अस्वीकृत हैं। वर्कशॉप का worker समय-सीमित है; कॉपी किए regex को अपने application की सुरक्षा चाहिए। [सुरक्षा मॉडल](../SECURITY_MODEL.md) देखें।

## 💬 सामान्य प्रश्न

**क्या यह AI generator है?** नहीं। Deterministic parser, AST, compiler और संरचित explanations इस्तेमाल होते हैं।

**क्या हर regex बदल सकता है?** नहीं। अनजान syntax पर error आता है; captures या assertions हटाकर conversion नहीं किया जाता।

**एक सफल उदाहरण सुरक्षा साबित करता है?** नहीं। चुने cases जाँचता है, सभी paths या execution cost नहीं।

**Classes पूरे Unicode को शामिल करती हैं?** नहीं। `digit` ASCII है, `letter` `[A-Za-z]` है, `word` का व्यवहार `\w` जैसा है।

**सीमाएँ क्या हैं?** 16,384 UTF-16 units, 200 पंक्तियाँ, bounded repetition में अधिकतम 1,000, nesting depth 64; 100 उदाहरण, हर एक अधिकतम 2,048 units, worker deadline 1,200 ms। Emoji आम तौर पर दो UTF-16 units लेता है।

**ऑफ़लाइन चल सकता है?** लाइब्रेरी और CLI स्थानीय हैं। Dependencies इंस्टॉल होने के बाद वर्कशॉप भी locally build और serve हो सकती है। PWA या offline cache का दावा नहीं है।

**समस्या कहाँ बताएँ?** [GitHub issues](https://github.com/OthmaneBlial/Regex-For-Humans/issues) में rules, flags, input, expected result और engine version दें। सुरक्षा के लिए [SECURITY.md](../../SECURITY.md) का निजी तरीका अपनाएँ।

## 🗺️ प्रोजेक्ट को और जानें

| गाइड | विषय |
| --- | --- |
| [भाषा](../LANGUAGE.md) | Grammar, groups, references, diagnostics |
| [जटिल उदाहरण](../COMPLEX-EXAMPLES.md) | चार formats की पूरी व्याख्या |
| [Architecture](../ARCHITECTURE.md) | Parser → AST → compiler → interfaces |
| [अनुकूलता](../COMPATIBILITY.md) | जाँचे गए constructs और engines |
| [Testing](../TESTING.md) | दोहराए जा सकने वाले commands और results |
| [सुरक्षा](../SECURITY_MODEL.md) | Trust boundaries और limits |
| [Distribution](../DISTRIBUTION.md) | Publication evidence |
| [Roadmap](../AUTONOMOUS_ROADMAP.md) | प्रगति और प्राथमिकताएँ |
| [तुलना](../COMPETITOR_GAPS.md) | Sources और बाकी capabilities |
| [योगदान](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) | Setup और conventions |

**10 अक्टूबर 2026 को स्थानीय सत्यापन:** 238 Node tests, 282 Chrome desktop/mobile checks, 52 Firefox/WebKit, 62 website checks और clean consumer installation सफल; audit में शून्य vulnerabilities। Groups/references/reverse translation के 16 tests Node 22.23.3 पर भी सफल हैं। यह उस snapshot का परिणाम है, हर भविष्य के browser की गारंटी नहीं। मानवीय reviews बाकी हैं।

[MIT लाइसेंस](../../LICENSE) · [Changelog](../../CHANGELOG.md) · [अंग्रेज़ी पर लौटें](../../README.md)।
