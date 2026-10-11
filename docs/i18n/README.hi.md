<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: साफ़ नियमों से असली regex तक](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**लिखें। समझें। जाँचें।**

अंग्रेज़ी में लिखे स्पष्ट नियमों को ऐसे JavaScript regex में बदलें, जिसके हर हिस्से का अर्थ समझ सकें।

[🚀 वर्कशॉप](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 वेबसाइट](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 सिंटैक्स](../LANGUAGE.md) · [📦 npm प्रीव्यू](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.12)

🔒 स्थानीय निष्पादन · 🧩 कोई runtime dependency नहीं · ⚡ एक compiler, तीन इंटरफ़ेस

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · **हिन्दी** · [العربية](README.ar.md) · [اردو](README.ur.md)

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

> 🌱 प्रीव्यू `0.1.0-dev.12` की लाइब्रेरी और CLI के लिए **Node.js 22+** चाहिए। ऑनलाइन वर्कशॉप को इंस्टॉल नहीं करना पड़ता। उपयोग में आसानी और screen reader की मानवीय समीक्षा अभी बाकी है।

## 🧰 अभी क्या बनाया जा सकता है

**Markdown रिपोर्ट:** [Markdown रिपोर्ट](../MARKDOWN_REPORTS.md) में build की जानकारी, नियम, सटीक JavaScript regex, विकल्प, अपेक्षित टेस्ट और दोबारा import किया जा सकने वाला JSON निर्यात करें। निर्यात टेस्ट नहीं चलाता और उनकी सफलता प्रमाणित नहीं करता।

**नियम पूरा करें:** **Complete a rule** या **Ctrl + Space** से अंतर्निहित character classes पूरी करें, संख्या के बाद भी (उदाहरण: `between 2 and 5 di`), या पहले से बंद capture groups के संदर्भ पूरे करें (`same as ca`)। संदर्भ संख्या और नाम दोनों से मिलते हैं; पूर्वावलोकन चुना हुआ पूरा नियम दिखाता है। हर सुझाव को पूरे दस्तावेज़ के साथ compile होना चाहिए। उद्धरणों के भीतर का पाठ, टिप्पणियाँ और चुना हुआ पाठ सुरक्षित रहते हैं। [नियंत्रण और सीमाएँ](../EDITOR_COMPLETIONS.md) देखें।

| क्षमता | npm `0.1.0-dev.12` / होस्टेड वर्कशॉप |
| --- | --- |
| नियम → JavaScript regex | ✅ |
| समर्थित regex → संपादन योग्य नियम | ✅ |
| हर हिस्से की व्याख्या और मूल नियम तक पहुँचना | ✅ |
| CLI, ESM API और TypeScript types | ✅ |
| नाम वाले/क्रमांकित captures और nested blocks | ✅ |
| पूरे block की पुनरावृत्ति और पिछले capture के संदर्भ | ✅ |
| `either { … }` के साथ क्रमबद्ध विकल्प | ✅ |
| `lazy` के साथ non-greedy दोहराव | ✅ |
| Lookaround assertions | ✅ |
| शब्द सीमाएँ | ✅ |
| [Unicode properties](../LANGUAGE.md#unicode-properties) | ✅ |
| [संयुक्त character classes](../LANGUAGE.md#composable-character-classes) | ✅ |
| [Unicode strings और nested sets](../LANGUAGE.md#nested-unicode-set-operations) | ✅ |
| सभी आठ JavaScript flags | ✅ |
| [समूह संपादन और capture की जगह हाइलाइट करना](../LANGUAGE.md#editing-groups) | ✅ |
| [इंटरैक्टिव संरचना और SVG निर्यात](../LANGUAGE.md#structural-diagrams) | ✅ |
| [संरचना के जोखिमों की समीक्षा](../LANGUAGE.md#structural-risk-review) | ✅ |
| [लक्षित इंजन के अनुसार कोड निर्यात](../LANGUAGE.md#engine-exports) | ✅ |
| मुक्त अंग्रेज़ी वाक्य | — |

स्थानीय वर्कशॉप में **Edit groups and references** से capture का नाम या समूह का प्रकार बदलें और उसके references तक जाएँ। नंबर बदलने पर भी संख्यात्मक references अपने मूल capture को इंगित करते हैं। जिस capture का reference मौजूद है, उसे noncapturing बनाने पर बदलाव अस्वीकार होता है और मूल नियम सुरक्षित रहते हैं। **Highlight** native indices से capture की जगह दिखाता है, चाहे capture खाली हो या consumed match से बाहर हो। `editGroup` API जाँचे गए नियम लौटाता है। [समूह संपादन](../LANGUAGE.md#editing-groups) देखें।

वर्तमान source में `lazy digits` से `\d+?` बनता है: पहले एक अंक आज़माएँ, फिर अगले नियमों की जरूरत हो तो दोहराव बढ़ाएँ।npm `0.1.0-dev.12` में उपलब्ध है। [दोहराव के नियम](../LANGUAGE.md#repetition) देखें।

सोर्स में `followed by { … }`, `not followed by { … }`, `preceded by { … }`, `not preceded by { … }` भी उपलब्ध हैं। ये वर्तमान स्थान के आसपास के टेक्स्ट को जाँचते हैं, बिना अक्षर consume किए। Captures की native values और positions बनी रहती हैं, भले वे match के बाहर हों; lookbehind के लिए runtime support चाहिए।npm `0.1.0-dev.12` में उपलब्ध है। [Lookaround assertions](../LANGUAGE.md#lookaround-assertions) देखें।

सोर्स में `word boundary` (`\b`) और `not word boundary` (`\B`) उपलब्ध हैं। ये कोई अक्षर consume नहीं करते। JavaScript में word characters ASCII अक्षर, अंक और underscore हैं; `i` के साथ case folding के समकक्ष अक्षर भी शामिल होते हैं। यह प्राकृतिक भाषा के शब्दों का विभाजन नहीं है।npm `0.1.0-dev.12` में उपलब्ध है। [शब्द सीमाएँ](../LANGUAGE.md#word-boundaries) देखें।

सोर्स में `unicode property "L"` और `not unicode property "L"` से native `\p{L}` और `\P{L}` बनते हैं। `L` का अर्थ Letter है; aliases case-sensitive हैं और वर्गीकरण runtime के Unicode data पर निर्भर करता है। Counts और `lazy` सामान्य रूप से काम करते हैं। `i` के साथ native `u` complement में case-folding के समकक्ष अक्षर भी शामिल हो सकते हैं।npm `0.1.0-dev.12` में उपलब्ध है। [Unicode properties](../LANGUAGE.md#unicode-properties) देखें।

सोर्स में `range "α" to "ω"` और `character class: digit, "_"` उपलब्ध हैं। एक class में एक Unicode code point के literals, ranges, singular shorthands और Unicode properties जोड़ सकते हैं। `not character class:` पूरी union को नकारता है; counts और `lazy` पूरी class पर लागू होते हैं। Property complements का native `u`/`i` व्यवहार सुरक्षित रहता है।npm `0.1.0-dev.12` में उपलब्ध है; [character classes](../LANGUAGE.md#composable-character-classes) देखें।

npm `0.1.0-dev.12` की लाइब्रेरी और CLI में groups, captures, पीछे के references और क्रमबद्ध alternatives उपलब्ध हैं। वर्कशॉप में captures की जाँच और कई search matches भी मिलते हैं। [अनुकूलता](../COMPATIBILITY.md) और [प्रकाशन रिकॉर्ड](../DISTRIBUTION.md) देखें।

## 🌍 अपनी प्रोग्रामिंग भाषा में निर्यात करें

स्थानीय वर्कशॉप में **Export to a programming language** खोलें, `exportRegex(rules, { target: "python" })` कॉल करें या `node bin/regex-for-humans.js --target python --json rules.txt` चलाएँ। नौ प्रारूप हैं: JavaScript, TypeScript, Python, Rust, Go, Java, C#, PHP और Ruby। JavaScript/TypeScript मौजूदा native pattern रखते हैं; अन्य लक्ष्य AST से समर्थित regex व्यवहार बदलने के बाद सही escaping वाला source code बनाते हैं।

सात native engines पर generated-code comparisons सफल हैं; **PHP को PHP 8.5.11 / PCRE2 10.44 पर सत्यापित किया गया है**। परीक्षण किए गए संस्करण और corpus की सीमाएँ [compatibility guide](../COMPATIBILITY.md#engine-exports) में हैं। आवश्यकताएँ और capture mapping सुरक्षित रखें: अन्य engines में नाम `gN` होते हैं और निष्क्रिय capture का नाम अनुपस्थित हो सकता है। इनपुट वैध Unicode होना चाहिए। असमर्थित flags (`d/g/i/y`), Unicode properties और असंगत assertion, capture या repetition व्यवहार स्थान सहित diagnostic देते हैं। कोड या पूरा JSON डाउनलोड करें; ब्राउज़र के उदाहरण अभी भी JavaScript में चलते हैं। [इंजन प्रोफ़ाइल और सीमाएँ](../LANGUAGE.md#engine-exports) देखें।

## 📦 प्रीव्यू इंस्टॉल करें

```sh
npm install regex-for-humans@preview
```

बिना global installation के CLI चलाएँ:

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

परिणाम `/^ABC\d{3}$/u` है। निश्चित संस्करण के लिए `regex-for-humans@0.1.0-dev.12` इस्तेमाल करें। runtime dependencies या हर OS के लिए अलग standalone executable उपलब्ध नहीं हैं।

## 🎮 पैटर्न आज़माएँ

**Interface language** से अंग्रेज़ी, सरल चीनी, स्पेनिश या फ़्रेंच चुनें। लेबल, उदाहरणों के विवरण, परीक्षण परिणाम और नेविगेशन बदलते हैं, लेकिन नियम, इनपुट, चयन, खुले पैनल और बना हुआ कोड नहीं बदलते। स्टोरेज उपलब्ध होने पर भाषा का चुनाव स्थानीय रूप से याद रखा जाता है। नियम नियंत्रित अंग्रेज़ी में रहते हैं; कंपाइलर की व्याख्याएँ, चित्र के लेबल और निर्यात की तकनीकी आवश्यकताएँ भी अंग्रेज़ी में रहती हैं। [वर्कशॉप स्थानीयकरण](../ARCHITECTURE.md#workshop-localization) देखें।

**Theme** से सिस्टम के रूप का अनुसरण करें या हल्का अथवा गहरा वर्कशॉप चुनें। स्टोरेज उपलब्ध होने पर पसंद स्थानीय रूप से याद रखी जाती है; रूप बदलने से नियम, उदाहरण, चयन या खुले पैनल नहीं बदलते। [थीम की पसंद](../ARCHITECTURE.md#theme-preference) देखें।

नियम संपादक मुख्य शब्दों, पाठ, कैप्चर समूहों, दोहराव की संख्याओं, शर्तों, विकल्पों और टिप्पणियों को अलग रंग देता है। कंपाइलर जिस शब्द में त्रुटि बताता है, उसके नीचे रेखा दिखती है; टाइप करना, चयन, कॉपी और स्क्रॉल पहले की तरह काम करते हैं। सिस्टम द्वारा निर्धारित रंगों या सीमा से बड़े इनपुट में सामान्य पाठ दिखता है। `#` से शुरू होने वाली टिप्पणी की पंक्तियाँ अपनी मूल स्थिति रखती हैं और मौजूदा लंबाई तथा पंक्ति की सीमाओं में गिनी जाती हैं। [टिप्पणियों](../LANGUAGE.md#comments) और [संपादक में रंगों](../ARCHITECTURE.md#editor-highlighting) की जानकारी देखें।

निर्माण पैनल वर्तमान पंक्ति या चयन से पहले, बाहरी सीमाओं के भीतर कैप्चर, वैकल्पिक खंड, विकल्प, दोहराव, वर्ण वर्ग और शर्त के संपादन योग्य नमूने जोड़ता है। नया कैप्चर जोड़ने पर पहले से मौजूद क्रमांक वाले संदर्भ उन्हीं समूहों को लक्षित करते हैं। गलत या सीमा से बड़े नमूने जोड़ने पर मूल नियम और चयन सुरक्षित रहते हैं; फ़्लैग और उदाहरण भी बने रहते हैं। [नियम निर्माण](../ARCHITECTURE.md#rule-construction) की जानकारी देखें।

सटीक अपेक्षाएँ पूरी UTF-16 सीमा-सूची, क्रमांक के अनुसार कैप्चर मान (`null` अनुपस्थित कैप्चर के लिए, `""` खाली कैप्चर के लिए) और मूल फ़्लैग के साथ JavaScript प्रतिस्थापन परिणाम जाँचती हैं। टेस्ट फ़िक्स्चर संस्करणयुक्त JSON आयात/निर्यात और मैनुअल स्थानीय सहेजने/बहाल करने की सुविधा देते हैं। अमान्य मसौदे या फ़ाइलें वर्तमान काम सुरक्षित रखते हैं; आयातित CR/CRLF उदाहरण का फ़ील्ड संपादित करने तक बिल्कुल बने रहते हैं। [फ़िक्स्चर प्रारूप, उदाहरण और सीमाएँ](../TEST_FIXTURES.md) देखें।

**Copy share link** से **पूरी वर्कशॉप का स्नैपशॉट साझा करें**: नियम, फ़्लैग, मैच मोड, उदाहरण और सटीक अपेक्षाएँ एक URL में सुरक्षित रहती हैं। नया पेज रेसिपी लोड होने से पहले इन्हें बहाल करता है; **Load shared link** मौजूदा काम को स्पष्ट कार्रवाई के बाद बदलता है। क्लिपबोर्ड की अनुमति न मिले तो फ़ील्ड से मैनुअल कॉपी कर सकते हैं। लिंक की सीमा 32 KiB है; बड़े टेस्ट समूह JSON निर्यात का उपयोग करते हैं। लिंक पाने वाला कोई भी व्यक्ति सामग्री पढ़ सकता है: यह एन्क्रिप्टेड नहीं है। [साझाकरण और सीमाएँ](../TEST_FIXTURES.md#share-a-workshop-snapshot) देखें।

**ड्राफ़्ट बहाली।** **Keep a draft in this browser** चालू करके दोबारा लोड होने पर नियम, फ़्लैग, उदाहरण, चिपकाया गया regex और अधूरी अपेक्षा JSON भी बहाल करें। यह डिफ़ॉल्ट रूप से बंद है, मैनुअल रूप से सहेजे गए टेस्ट से अलग रहता है और बंद करने पर ड्राफ़्ट हटा देता है। [बहाली और स्टोरेज सीमाएँ](../TEST_FIXTURES.md#draft-recovery-on-unreleased-main) देखें।

**समूह संपादन का पूर्वावलोकन।** **Preview group edit** चुनकर मौजूदा और प्रस्तावित नियमों व regex की तुलना करें, जिसमें बदले हुए नाम या नंबर वाले संदर्भ भी दिखते हैं। पूर्वावलोकन टेस्ट और सहेजा गया ड्राफ़्ट सुरक्षित रखता है; नियम, फ़्लैग या समूह के फ़ील्ड बदलने पर वह हट जाता है। परिणाम जाँचने के लिए बदलाव लागू करें। [पहले/बाद की तुलना और सीमाएँ](../GROUP_PREVIEWS.md) देखें।

नेटिव मैच की सीमाओं या न्यूनतम लंबाई, अनुपस्थित अनिवार्य literal और इनपुट के गलत निरपेक्ष किनारे पर मौजूद literal की प्रमाणित शर्तों से **असफल उदाहरण समझें**। prefix/suffix की जाँच case-sensitive input anchors पर लागू होती है; line anchors और अनिश्चित मामलों में सावधान विवरण बना रहता है। सटीक असफल चरण उपलब्ध न हो तो वर्कशॉप यह स्पष्ट बताती है। यह backtracking का execution trace नहीं है। [असफलता के विवरण](../FAILURE_EXPLANATIONS.md) देखें।

गलत quoted escape, class/list item, range endpoint या Unicode property alias के **सटीक diagnostic पर जाएँ**। highlighting मूल escape वर्तनी और पूरे Unicode surrogate pairs को बनाए रखती है; ज्ञात range न होने पर शुरुआती स्थान तक navigation बना रहता है। लाइब्रेरी और CLI वैकल्पिक `endColumn` देते हैं, जो UTF-16 units में अंतिम सीमा को शामिल किए बिना end column बताता है। [diagnostic ranges](../LANGUAGE.md#errors-and-future-syntax) देखें।

1. कोई recipe चुनें या हर पंक्ति पर एक निर्देश लिखें।
2. बने हुए हिस्से और उनकी व्याख्या देखें।
3. उदाहरण जोड़ें और बताएँ कि किन्हें match करना चाहिए।
4. व्यवहार सही होने पर regex कॉपी करें।

आंशिक match में escape किया हुआ छोटा संदर्भ और highlight दिखाई देता है; खाली match के लिए स्थान का निशान मिलता है। नियम और उदाहरण ब्राउज़र में रहते हैं। अकाउंट, AI व्याख्या या application backend की ज़रूरत नहीं है।

मौजूदा workshop में match खोलकर capture के मान और इंजन से मिले स्थान देखें। अनुपस्थित समूह और खाली string अलग दिखते हैं; दोहराया गया समूह अपना अंतिम capture दिखाता है। **Search anywhere** अधिकतम 100 बिना overlap वाले matches दिखाता है और खाली match के बाद एक Unicode code point आगे बढ़ता है। स्थान UTF-16 units में गिने जाते हैं; अंतिम सीमा शामिल नहीं होती। Capture indices न मिलने पर मान दिखाए जाते हैं, स्थानों का अनुमान नहीं लगाया जाता।

[![डेस्कटॉप वर्कशॉप का वास्तविक स्क्रीनशॉट](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=c3ae9d3d6e2d)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

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

`/` delimiters और `u` या `v` flag रखें। नई पंक्ति को `\n` जैसे escape में लिखें। समर्थित `i`, `s`, `m` और `u` व्यवहार सुरक्षित रहता है। वर्तमान कोड captures, nested groups और पिछले captures के संदर्भ भी आयात करता है, उनके नाम, क्रमांक और values बनाए रखता है।

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
| [लोअरकेस स्लग](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=slug) | `hello-world` | एक हाइफ़न से जुड़े ASCII अक्षर और अंक |
| [फ़ाइल एक्सटेंशन](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=file-extension) | `README.md` | केस-संवेदी txt, md या json प्रत्यय |
| [UTC टाइमस्टैम्प का आकार](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=iso8601-shape) | `2026-10-11T09:30:00Z` | वैकल्पिक आंशिक सेकंड; कैलेंडर अलग जाँचें |
| [HTTPS URL का आकार](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=https-url-shape) | `https://example.com` | ASCII होस्ट का सीमित रूप; पूरा URL सत्यापन नहीं |
| [हेडर फ़ील्ड](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=http-header) | `Content-Type: application/json` | नाम वाला फ़ील्ड और एक पंक्ति का मान |
| [Markdown शीर्षक](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=markdown-heading) | `# Hello` | एक से छह # और शीर्षक |
| [SemVer 2.0 सिंटैक्स](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | `1.2.3-alpha.1+001` | मुख्य, प्रीरिलीज़ और बिल्ड सिंटैक्स; संस्करण तुलना नहीं |
| [Git हैश का आकार](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=git-object-hash) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` | 40 या 64 ASCII हेक्स अक्षर; अस्तित्व अलग जाँचें |
| [दोहराए शब्द](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | `hello hello` | ASCII शब्द का नाम वाला पिछला संदर्भ |
| [पास के डुप्लिकेट](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=duplicate-token) | `item,item` | कॉमा से जुड़ा एक जोड़ा; हर टोकन में 1–16 वर्ड अक्षर |
| [Unicode अक्षर](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=unicode-word) | `العربية / اردو` | मूल L/M गुण; अरबी और उर्दू भी |
| [लॉग फ़ील्ड](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | `INFO code=200` | खोजे गए अंश से level और code फ़ील्ड |
| [खोज और प्रतिस्थापन](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=replace-word) | `teh then teh → the then teh` | स्थान, कैप्चर और बिना g प्रतिस्थापन की सटीक अपेक्षाएँ |

लाइब्रेरी में **31 रेसिपी, 24 श्रेणियाँ और तीन कठिनाई स्तर** हैं। इंटरफ़ेस की चार भाषाओं में शीर्षक, सीमाएँ और नियम खोजें और फ़िल्टर मिलाएँ। [गाइड](../EXAMPLE_LIBRARY.md) देखें।

विफल उदाहरणों में [सत्यापन योग्य स्पष्टीकरण](../FAILURE_EXPLANATIONS.md) मिलते हैं: वास्तविक मैच की सीमाएँ, सिद्ध न्यूनतम लंबाई या अनुपस्थित अनिवार्य पाठ। सटीक विफल चरण अज्ञात होने पर कार्यशाला यह स्पष्ट बताती है।

[शुरुआती, मध्यवर्ती या विशेषज्ञ स्पष्टीकरण](../EXPLANATION_LEVELS.md) चुनें। नोट्स regex के शब्द समझाते हैं या सोर्स सीमाएँ, कैप्चर, हल किए गए संदर्भ और फ़्लैग दिखाते हैं। स्तर बदलने पर काम सुरक्षित रहता है और मिलान दोबारा नहीं चलता।

ये **आकार की जाँचें** हैं। असंभव तारीख या `25:99` भी match हो सकते हैं। IPv4 octets को 255 तक सीमित नहीं करता; UUID का version, variant और uniqueness नहीं जाँचता। Username availability, invoice records, फ़ोन की वैधता, कैलेंडर और filesystem की शर्तें अलग जाँचें। संस्करण के सरल आकार की रेसिपी पूरा SemVer सत्यापन नहीं करती; रंग केवल `#RRGGBB` है।

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

यह उदाहरण npm `0.1.0-dev.12` और प्रकाशित वर्कशॉप में काम करता है।

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

Group बंद होने के बाद `same as capture "word"` या `same as capture 1` वही text माँगता है। [उदाहरण](../LANGUAGE.md#capture-references) `cat cat` स्वीकार करता है, `cat dog` नहीं। आगे या अपने target के अंदर का reference diagnostic देता है। Reverse translation समर्थित captures रखती है। निकाली गई तारीख को कैलेंडर से अलग validate करें।

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

`word character` / `word characters` और `word` / `not word`, `\w` / `\W` का व्यवहार लेते हैं। `_` शामिल है, `é` नहीं। `letter` अंक और underscore हटाता है। `i` पर JavaScript के equivalents `K` और `ſ` भी जुड़ सकते हैं। `u` डिफ़ॉल्ट है; source में `v` भी उपलब्ध है। दोनों ASCII classes को सार्वभौमिक Unicode categories नहीं बनाते।

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
| `--flags` | Native JavaScript flags चुनें; u/v साथ नहीं दिए जा सकते |
| `--help` | सहायता |
| `--target` | चुनी हुई भाषा में निर्यात; [प्रोफ़ाइल](../LANGUAGE.md#engine-exports) देखें |
| `--version` | पैकेज संस्करण |

UTF-8 फ़ाइल या stdin पढ़ें। `-` से शुरू फ़ाइल नाम से पहले `--` लगाएँ। Exit codes: सफलता/सहायता/संस्करण के लिए `0`, invalid rules या I/O errors के लिए `1`, invalid arguments के लिए `2`।

Malformed UTF-8 चुपचाप बदला नहीं जाता, अस्वीकृत होता है। JSON में diagnostics के codes रहते हैं; arguments के लिए `CLI_USAGE`, file/runtime failures के लिए `CLI_ERROR`। Control characters visible escapes में दिखते हैं; JSON decode करने पर मूल data लौटता है। stderr भी विफल हो तो exit code फिर भी nonzero रहता है।

JSON diagnostics में `endColumn` हो सकता है: उसी पंक्ति का अंतिम कॉलम, जिसे UTF-16 units में 1 से गिना जाता है और जिसमें अंतिम सीमा शामिल नहीं होती। Workshop पहचाने गए पूरे हिस्से को highlight और select करती है; range न होने पर error के शुरुआती स्थान तक जाने की सुविधा बनी रहती है।

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

`--reverse --json` से `regexToRules()` की तरह `{ rules, flags }` मिलता है। Native options और cursor व्यवहार बनाए रखने के लिए लौटाए गए `flags` को `compile(rules, { flags })` में दें। सभी आठ flags समर्थित हैं; g/y regex की state बनी रहती है।

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
| `u` | डिफ़ॉल्ट | Unicode code points |
| `i` | `{ flags: 'i' }` या `--ignore-case` | JavaScript की native case folding |
| `s` | `{ flags: 's' }` या `--dot-all` | Dot नई पंक्तियों से भी match करता है |
| `m` | `line start` / `line end` | हर पंक्ति के anchors |
| `d` | `{ flags: 'd' }` | Match और capture के native indices |
| `g` | `{ flags: 'g' }` | बार-बार कॉल करने पर `lastIndex` आगे बढ़ता है |
| `y` | `{ flags: 'y' }` | `lastIndex` पर match; पहली खाली जगह पर रुकता है |
| `v` | `{ flags: 'v' }` | Native v-mode Unicode classes और complements |

**npm preview:** आठों flags `d`, `g`, `i`, `m`, `s`, `u`, `v`, `y` स्वीकार हैं, जैसे `{ flags: 'dgiv' }` या `--flags dgiv`। आउटपुट क्रम `dgimsuvy` है; duplicates और u/v को साथ देना त्रुटि है, तथा u डिफ़ॉल्ट रहता है। m स्पष्ट option या line anchors से सक्रिय होता है; दोनों प्रकार मिलाने पर input anchors पूर्ण सीमाएँ बनाए रखते हैं। Reverse translation options बचाता है और `lastIndex` नहीं बदलता। Workshop हर उदाहरण 0 से शुरू करता है और अधिकतम 100 matches दिखाता है; copied g/y regex में state बनी रहती है। अनुपलब्ध native क्षमताएँ स्पष्ट diagnostics देती हैं।npm `0.1.0-dev.12` में उपलब्ध है।

**npm preview में:** `v` चुनकर `one of strings: "a", "ab", ""` या `unicode property "RGI_Emoji"` इस्तेमाल करें। Native sets सूची के क्रम से स्वतंत्र होकर लंबे सदस्यों को पहले आज़माते हैं; आगे के नियम छोटे सदस्य पर वापस जाने की माँग कर सकते हैं। खाली strings भी मान्य हैं। Class में `string "ab"` इस्तेमाल करें। String properties और खाली या कई code points वाले सदस्यों का complement नहीं बनाया जा सकता।npm `0.1.0-dev.12` में उपलब्ध है।

**npm preview में:** nested sets के लिए `character set union {`, `character set intersection {` और `character set subtraction {` लिखें और `}` से बंद करें। हर पंक्ति एक अक्षर, range, class, property, strings का set या nested set है। Intersection साझा सदस्यों को रखता है; subtraction पहले operand से दाएँ सदस्यों को हटाता है। Counts और `lazy` पूरे block पर लागू होते हैं। `not` strings के native संरचनात्मक नियमों का पालन करता है; खाली union कुछ भी match नहीं करता। `v` चुनें; npm `0.1.0-dev.12` में उपलब्ध है। [Syntax और उदाहरण](../LANGUAGE.md#nested-unicode-set-operations)।

**समूह के स्थानीय flags।** `group with flags "i" {` खोलें, उसके भीतर `"hello"` रखें और `}` से बंद करें। इससे `(?i:hello)` बनता है। समूह `HELLO` को स्वीकार करता है, जबकि आगे के नियमों में अक्षरों के बड़े या छोटे रूप का व्यवहार पहले जैसा रहता है। `"im-s"` समूह के भीतर case-insensitive तुलना और line anchors चालू करता है और dot-all बंद करता है। Nested समूह से बाहर आने पर बाहरी विकल्प बहाल होते हैं; ब्लॉक के भीतर captures भी रख सकते हैं। [Syntax और उदाहरण](../LANGUAGE.md#scoped-flags-unreleased)।

**जिस runtime पर pattern चलेगा, उसे जाँचें।** केवल syntax स्वीकार करना पर्याप्त नहीं है। जाँचे गए Chrome, Firefox और WebKit के Unicode modes परीक्षण पास करते हैं। Node 22 इस syntax को नहीं समझता और जाँचे गए Node 25/26 में native matching की त्रुटियाँ हैं, इसलिए compilation `UNSUPPORTED_TARGET_FEATURE` देता है। Cached metadata के साथ `toRegExp({ source, flags })` भी native construction के बाद दिए गए mode में स्थानीय व्यवहार जाँचता है; अमान्य native syntax पर `SyntaxError` बना रहता है। असमर्थित समूहों का अनुमानित रूपांतरण नहीं किया जाता। प्रकाशित version के लिए [distribution record](../DISTRIBUTION.md) देखें।

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

विकल्प संपादन योग्य `either { … }` ब्लॉक बनते हैं: हर सीधे entry को एक विकल्प मानकर क्रम से आज़माया जाता है। कई नियमों वाले या खाली विकल्प के लिए `group { … }` इस्तेमाल करें।

लक्ष्य **JavaScript `RegExp`** है। Raw regex को rules की तरह और मुक्त अंग्रेज़ी को instructions की तरह स्वीकार नहीं करता। Reverse translation सिर्फ़ दस्तावेज़ित subset के लिए है। मुक्त अंग्रेज़ी, u मोड की खाली character classes और forward/open references अभी समर्थित नहीं हैं। वर्कशॉप का worker समय-सीमित है; कॉपी किए regex को अपने application की सुरक्षा चाहिए। [सुरक्षा मॉडल](../SECURITY_MODEL.md) देखें।

## 💬 सामान्य प्रश्न

**क्या यह AI generator है?** नहीं। Deterministic parser, AST, compiler और संरचित explanations इस्तेमाल होते हैं।

**क्या हर regex बदल सकता है?** नहीं। अनजान syntax पर error आता है; captures या assertions हटाकर conversion नहीं किया जाता।

**एक सफल उदाहरण सुरक्षा साबित करता है?** नहीं। चुने cases जाँचता है, सभी paths या execution cost नहीं।

**Classes पूरे Unicode को शामिल करती हैं?** नहीं। `digit` ASCII है, `letter` `[A-Za-z]` है, `word` का व्यवहार `\w` जैसा है।

**सीमाएँ क्या हैं?** 16,384 UTF-16 units, 200 पंक्तियाँ, bounded repetition में अधिकतम 1,000, nesting depth 64; 100 उदाहरण, हर एक अधिकतम 2,048 units, worker deadline 1,200 ms। Emoji आम तौर पर दो UTF-16 units लेता है।

पूरे result batch की भी सीमाएँ हैं: 1,000 matches, 20,000 captures और result text की 1,048,576 UTF-16 units। Output बहुत बड़ा होने पर पूरा run रुक जाता है; rules और examples फिर भी edit किए जा सकते हैं।

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

**रिलीज़ की जाँच:** [सत्यापन रिकॉर्ड](../TESTING.md) में compiler/CLI tests, Chromium desktop/mobile workflows, Firefox/WebKit checks, website tests, अलग JavaScript/TypeScript परियोजनाओं में package उपयोग और dependency audit अलग-अलग दर्ज हैं। Node 22 पर package consumer की जाँच अलग से होती है। उपयोगिता, अनुवाद और screen reader की मानवीय जाँच अभी बाकी है।

## संरचना के जोखिमों की समीक्षा

स्थानीय workshop में **Review the pattern** खोलकर nested या पास-पास की variable repetitions, overlapping alternatives, व्यापक wildcards, line anchors और बड़े patterns की समीक्षा करें। Hover से rule, regex fragment, explanation और diagram जुड़ते हैं, लेकिन cursor नहीं चलता। किसी note को चुनने पर उसकी source line खुलती है। Rules, flags, recipes और groups के संपादन से समीक्षा अपडेट होती है।

साझा API `analyze(rules, { flags })` canonical flags, source positions और ranges वाले typed notes तथा विश्लेषण की सीमाएँ लौटाता है। Positive classes और ranges के ज्ञात characters कुछ overlaps पहचानते हैं; किसी unknown set को प्रमाणित रूप से disjoint नहीं माना जाता। यह heuristic analysis महँगे patterns छोड़ सकता है या false positives दे सकता है: **कोई finding न होना performance safety का प्रमाण नहीं है**। विश्लेषण matches नहीं चलाता और backtracking नहीं मापता। Examples का matching अलग worker में समय-सीमा के साथ चलता रहता है।

 [संरचनात्मक जोखिम समीक्षा का अनुबंध](../LANGUAGE.md#structural-risk-review) देखें।

## संरचना का आरेख

स्थानीय workshop में **Explore the pattern** खोलकर AST से बना railroad diagram देखें: nested groups, क्रमबद्ध alternatives, repetition loops और बिना text consume करने वाले assertions। किसी node पर pointer रखें या उसे चुनें तो rules, regex fragments और explanations साथ दिखते हैं; hover से source cursor नहीं बदलता। **Enter/Space** संबंधित source line पर लौटाता है। Source cursor और generated regex का selection भी संरचना से जुड़ता है। **Actual size** पढ़ने योग्य labels के साथ scrolling देता है; **Fit overview** पूरा नक्शा दिखाता है। **Export SVG** स्वतंत्र file सहेजता है; `toSVG(rules, { flags })` से भी यही SVG मिलता है। लंबे labels की पूरी explanation tooltip में रहती है। यह संरचना का आरेख है, execution या backtracking trace नहीं। [संरचना के आरेख](../LANGUAGE.md#structural-diagrams) देखें।

[MIT लाइसेंस](../../LICENSE) · [Changelog](../../CHANGELOG.md) · [अंग्रेज़ी पर लौटें](../../README.md)।
