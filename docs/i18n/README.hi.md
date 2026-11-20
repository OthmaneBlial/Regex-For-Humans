<div align="center">

[![Regex For Humans: रेगुलर एक्सप्रेशन ^#[0-9A-Fa-f]{6}$, हर टुकड़े के नीचे उसका सरल अंग्रेज़ी अर्थ](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**सरल अंग्रेज़ी में regex लिखें। किसी भी regex को उसी तरह पढ़ें।**

छोटे अंग्रेज़ी नियम नेटिव JavaScript `RegExp` में कंपाइल होते हैं, हर नियम का एक दिखने वाला टुकड़ा। कोई regex पेस्ट करें और नियम वापस पाएँ।

**[वर्कशॉप आज़माएँ](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [वेबसाइट](https://othmaneblial.github.io/Regex-For-Humans/) · [npm प्रीव्यू](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.13) · [सिंटैक्स](../LANGUAGE.md)**

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · **हिन्दी** · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## नियम लिखें, regex पाएँ

<table>
<tr><th>नियम</th><th>JavaScript regex</th></tr>
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

हर पंक्ति का एक दस्तावेज़ी अर्थ है और वह क्रम से regex में एक टुकड़ा जोड़ती है। नतीजा वही regex है जो आप हाथ से लिखते: `{0,1}` नहीं, `?`, और कोई फ़ालतू समूह नहीं। अनजाना वाक्यांश अपनी पंक्ति, कॉलम और सुझाए सुधार के साथ रुक जाता है।

[![छह रेसिपी बारी-बारी से: नियम, कंपाइल हुआ regex, हर टुकड़े का अर्थ और उदाहरण में उसका मिलान](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-reel.svg)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

## regex को वापस पढ़ें

कोई ऐसा पैटर्न मिला जिसे कोई पढ़ नहीं पाता? `regexToRules` समर्थित regex को संपादन-योग्य नियमों में बदलता है, और वे नियम फिर उसी regex में कंपाइल होते हैं।

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

[वेबसाइट](https://othmaneblial.github.io/Regex-For-Humans/) पेस्ट किए गए किसी भी regex को वहीं समझाती है। असमर्थित सिंटैक्स उसकी स्थिति के साथ अस्वीकार होता है, चुपचाप हटाया नहीं जाता।

## जो पकड़ें, उसे नाम दें

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

कैप्चर नेटिव JavaScript समूह हैं। वही टेक्स्ट दोबारा माँगने के लिए `same as capture "year"` लिखें।

## इंस्टॉल

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

Node.js 22+, कोई रनटाइम निर्भरता नहीं, TypeScript घोषणाओं के साथ ESM। लाइब्रेरी, [कमांड लाइन](../CLI.md) और वर्कशॉप एक ही कंपाइलर साझा करते हैं। यह प्रीव्यू है (`0.1.0-dev.13`); [वर्कशॉप](https://othmaneblial.github.io/Regex-For-Humans/workshop/) को इंस्टॉल की ज़रूरत नहीं।

## शब्दावली एक नज़र में

| यह लिखें | यह पाएँ |
| --- | --- |
| `start` · `end` | `^` · `$` |
| `3 digits` · `digits` | `\d{3}` · `\d+` |
| `between 2 and 4 letters` | `[A-Za-z]{2,4}` |
| `optional "-"` | `-?` |
| `one of: a, b` | `[ab]` |
| `either { "INFO" "WARN" }` | `(?:INFO\|WARN)` |
| `capture "id" { … }` | `(?<id>…)` |
| `not followed by { "x" }` | `(?!x)` |

`either { … }` जैसे ब्लॉक में कोष्ठकों के भीतर हर पंक्ति पर एक नियम होता है। [भाषा गाइड](../LANGUAGE.md) हर नियम, फ़्लैग, Unicode क्लास, lookaround और सीमा बताती है।

## खोलने को तैयार 34 रेसिपी

| रेसिपी | क्या जाँचती है |
| --- | --- |
| [कैलेंडर तारीख़ की पुष्टि](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=calendar-date) | महीना 01–12, दिन 01–31, वर्ष, महीना और दिन के रूप में कैप्चर |
| [IPv4 पते की पुष्टि](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-address) | 0 से 255 तक की चार संख्याएँ, आगे शून्य नहीं |
| [24-घंटे के समय की पुष्टि](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=clock-time) | `00:00` से `23:59` तक |
| [SemVer 2.0 सिंटैक्स की पुष्टि](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | कोर, प्री-रिलीज़ और बिल्ड हिस्से |
| [लॉग अंश से नामित फ़ील्ड निकालें](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | स्तर और कोड, नाम से |
| [दोहराया गया शब्द पकड़ें](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | एक शब्द, फिर वही शब्द |

हर रेसिपी में ऐसे उदाहरण हैं जिन्हें मिलना चाहिए और जिन्हें नहीं मिलना चाहिए, और एक नोट कि वह क्या नहीं जाँचती। [सभी 34 रेसिपी](../RECIPES.md) और **35 स्वीकृत या अस्वीकृत मामलों** वाले चार [जटिल उदाहरण](../COMPLEX-EXAMPLES.md) देखें।

## आउटपुट पर भरोसा क्यों करें

- **निर्धारक।** पार्सर, मॉडल नहीं: एक ही नियम हमेशा एक ही regex देते हैं। न AI, न नेटवर्क, न टेलीमेट्री।
- **नेटिव।** आउटपुट एक सामान्य `RegExp` है; मिलान के समय सिर्फ़ इंजन चलता है। Python, Rust, Go, Java, C#, PHP और Ruby के [एक्सपोर्ट](../LANGUAGE.md#engine-exports) उन्हीं इंजनों से मिलाए जाते हैं।
- **सीमाओं के बारे में ईमानदार।** रेसिपी बताती हैं कि वे क्या नहीं जाँचतीं। वर्कशॉप आपके उदाहरण समय-सीमित worker में चलाता है; कॉपी किए गए regex को अपनी सुरक्षा चाहिए ([सुरक्षा मॉडल](../SECURITY_MODEL.md))।
- **परीक्षित।** हर रेसिपी और इस README का हर उदाहरण टेस्ट सूट में फिर से कंपाइल होता है ([टेस्टिंग](../TESTING.md))।

[आर्किटेक्चर](../ARCHITECTURE.md) · [संगतता](../COMPATIBILITY.md) · [योगदान](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [बदलाव](../../CHANGELOG.md) · [सुरक्षा](../../SECURITY.md) · [MIT](../../LICENSE)

<div align="center">

अगर यहाँ के किसी नियम ने आपको आँखें सिकोड़ने से बचाया, तो एक ⭐ दूसरे डेवलपरों को इसे खोजने में मदद करता है।

</div>
