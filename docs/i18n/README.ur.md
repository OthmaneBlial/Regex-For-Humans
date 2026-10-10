<div dir="rtl" lang="ur">

<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: واضح قواعد سے سمجھ آنے والے ریگولر ایکسپریشن](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**قواعد لکھیں۔ نتیجہ سمجھیں۔ اسے آزمائیں۔**

چند واضح انگریزی ہدایات کو JavaScript کے ایسے ریگولر ایکسپریشن میں بدلیں جس کے ہر حصے کو آپ سمجھ سکیں۔

[🚀 ورکشاپ کھولیں](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 ویب سائٹ](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 قواعد کا طریقہ](../LANGUAGE.md) · [📦 npm کا آزمائشی نسخہ](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.5)

🔒 مقامی طور پر چلتا ہے · 🧩 رن ٹائم کی کوئی اضافی dependency نہیں · ⚡ ایک کمپائلر، تین انٹرفیس

<div dir="ltr" align="center">

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · **اردو**

</div>

</div>

## 🪄 علامتیں سلجھانے کے بجائے قواعد پڑھیں

ریگولر ایکسپریشن کو پڑھنا اس وقت آسان ہو جاتا ہے جب آپ اس کے پیچھے موجود قواعد دیکھ سکیں۔

| آپ کے قواعد | JavaScript کا نتیجہ |
| ---: | ---: |
| <code dir="ltr">start "#"</code><br><code dir="ltr">6 hex digits</code><br><code dir="ltr">end</code> | <code dir="ltr">/^#[0-9A-Fa-f]{6}$/u</code> |

<div dir="ltr" align="left">

```text
start "#"
6 hex digits
end
```

</div>

<div dir="ltr" align="left">

```js
/^#[0-9A-Fa-f]{6}$/u
```

</div>

✅ <code dir="ltr">#12aBcF</code>, <code dir="ltr">#000000</code> · ❌ <code dir="ltr">#123</code>, <code dir="ltr">#G00000</code>

الفاظ کا مجموعہ **مقرر ہے**: ہر ہدایت کا ایک واضح مطلب ہے۔ لائبریری، کمانڈ لائن اور ورکشاپ ایک ہی deterministic کمپائلر استعمال کرتے ہیں۔ نامعلوم ہدایت پر سطر، کالم اور اصلاح کی تجویز ملتی ہے۔ تمام ترجموں میں قواعد لکھنے کی زبان انگریزی ہی رہتی ہے۔

> 🌱 لائبریری اور کمانڈ لائن کے آزمائشی نسخے <code dir="ltr">0.1.0-dev.5</code> کے لیے **Node.js 22 یا جدید تر** درکار ہے۔ آن لائن ورکشاپ بغیر انسٹال کیے چلتی ہے۔ استعمال میں آسانی اور اسکرین ریڈر کے انسانی جائزے ابھی باقی ہیں۔

## 🧰 آج کیا بنایا جا سکتا ہے؟

| صلاحیت | شائع شدہ npm <code dir="ltr">0.1.0-dev.5</code> |
| ---: | ---: |
| قابلِ مطالعہ قواعد → JavaScript regex | ✅ |
| معاونت یافتہ regex → قابلِ ترمیم قواعد | ✅ |
| حصوں کی وضاحت اور متعلقہ قاعدے تک رسائی | ✅ |
| CLI، ESM API اور TypeScript کی تعریفیں | ✅ |
| نام والے، نمبر والے اور اندرونی capture گروپ | ✅ |
| پورے بلاک کی تکرار اور پچھلے capture کا حوالہ | ✅ |
| ترتیب وار متبادل بذریعہ <code dir="ltr">either { … }</code> | ✅ |
| کم سے کم تکرار کو پہلے آزمانا، بذریعہ <code dir="ltr">lazy</code> | ✅ |
| آگے یا پیچھے دیکھنے کی assertions | ✅ |
| لفظ کی حدود | ✅ |
| [Unicode properties](../LANGUAGE.md#unicode-properties) | ✅ |
| [مرکب character classes](../LANGUAGE.md#composable-character-classes) | ✅ |
| [Unicode strings اور nested sets](../LANGUAGE.md#nested-unicode-set-operations) | ✅ |
| تمام آٹھ JavaScript flags | ✅ |
| [گروپ کی تدوین اور capture کی جگہ نمایاں کرنا](../LANGUAGE.md#editing-groups) | — |
| دوسرے regex انجن اور آزاد انگریزی | — |

**صرف سورس ورژن میں:** مقامی ورکشاپ میں capture کا نام یا گروپ کی قسم بدلیں اور اس کے references تک جائیں۔ یہ پینل کھولیں:

<p dir="ltr" align="left"><code dir="ltr">Edit groups and references</code></p>

نمبر بدلنے کے بعد بھی عددی references اپنے اصل capture کی طرف اشارہ کرتے ہیں۔ جس capture کا reference موجود ہو، اسے noncapturing بنانے کی کوشش مسترد ہوتی ہے اور اصل قواعد برقرار رہتے ہیں۔ <code dir="ltr">Highlight</code> بٹن اصل native indices سے capture کی جگہ دکھاتا ہے، خواہ capture خالی ہو یا consumed match سے باہر ہو۔ <code dir="ltr">editGroup</code> API تصدیق شدہ قواعد واپس کرتی ہے۔ یہ اضافے ابھی npm یا شائع شدہ ورکشاپ میں نہیں ہیں۔ موجودہ شائع شدہ ورژن:

<p dir="ltr" align="left"><code dir="ltr">0.1.0-dev.5</code></p>

[گروپ کی تدوین](../LANGUAGE.md#editing-groups) دیکھیں۔

موجودہ سورس میں <code dir="ltr">lazy digits</code> سے <code dir="ltr">\d+?</code> بنتا ہے: پہلے ایک ہندسہ آزمائیں، پھر اگلے قواعد کی ضرورت کے مطابق تکرار بڑھائیں۔npm <code dir="ltr">0.1.0-dev.5</code> میں دستیاب ہے۔ [تکرار کے قواعد](../LANGUAGE.md#repetition) دیکھیں۔

سورس میں یہ چار صورتیں بھی دستیاب ہیں:

<div dir="ltr" align="left">

- <code dir="ltr">followed by { … }</code>
- <code dir="ltr">not followed by { … }</code>
- <code dir="ltr">preceded by { … }</code>
- <code dir="ltr">not preceded by { … }</code>

</div>

یہ اردگرد کے متن کو جانچتے ہیں، اسے match میں شامل نہیں کرتے۔ Captures کی اصل values اور positions برقرار رہتی ہیں، چاہے وہ match کے باہر ہوں؛ lookbehind کے لیے انجن کی معاونت ضروری ہے۔npm <code dir="ltr">0.1.0-dev.5</code> میں دستیاب ہے۔ [Lookaround assertions](../LANGUAGE.md#lookaround-assertions) دیکھیں۔

سورس میں لفظ کی حدود کے لیے یہ صورتیں بھی دستیاب ہیں:

<div dir="ltr" align="left">

- <code dir="ltr">word boundary</code> → <code dir="ltr">\b</code>
- <code dir="ltr">not word boundary</code> → <code dir="ltr">\B</code>

</div>

یہ assertions کوئی حرف consume نہیں کرتیں۔ JavaScript میں word characters سے مراد ASCII حروف، ہندسے اور underscore ہیں؛ <code dir="ltr">i</code> کے ساتھ case folding کے مساوی حروف بھی شامل ہوتے ہیں۔ یہ قدرتی زبان کے الفاظ کی تقسیم نہیں ہے۔npm <code dir="ltr">0.1.0-dev.5</code> میں دستیاب ہے۔ [لفظ کی حدود](../LANGUAGE.md#word-boundaries) دیکھیں۔

سورس میں یہ دو قواعد بھی دستیاب ہیں:

- <code dir="ltr">unicode property "L"</code>
- <code dir="ltr">not unicode property "L"</code>

پہلے سے <code dir="ltr">\p{L}</code> اور دوسرے سے <code dir="ltr">\P{L}</code> بنتا ہے۔ نام <code dir="ltr">L</code> حروف کی category ہے۔ Aliases میں بڑے اور چھوٹے حروف کا فرق اہم ہے؛ classification انجن کے Unicode data پر منحصر ہے۔ Counts اور <code dir="ltr">lazy</code> معمول کے مطابق کام کرتے ہیں۔ فلیگ <code dir="ltr">i</code> کے ساتھ native <code dir="ltr">u</code> complement میں case folding کے مساوی حروف بھی آ سکتے ہیں۔npm <code dir="ltr">0.1.0-dev.5</code> میں دستیاب ہے۔ [Unicode properties](../LANGUAGE.md#unicode-properties) دیکھیں۔

سورس میں یہ صورتیں بھی دستیاب ہیں:

<p dir="ltr" align="left"><code dir="ltr">range "α" to "ω"</code></p>
<p dir="ltr" align="left"><code dir="ltr">character class: digit, "_"</code></p>
<p dir="ltr" align="left"><code dir="ltr">not character class: digit</code></p>

ایک class میں ایک Unicode code point کے literals، ranges، singular shorthands اور Unicode properties جمع کیے جا سکتے ہیں۔ تیسری صورت پوری union کو negate کرتی ہے۔ Counts اور <code dir="ltr">lazy</code> پوری class پر لاگو ہوتے ہیں؛ property complements کا native <code dir="ltr">u</code>/<code dir="ltr">i</code> رویہ برقرار رہتا ہے۔npm <code dir="ltr">0.1.0-dev.5</code> میں دستیاب ہے؛ [character classes](../LANGUAGE.md#composable-character-classes) دیکھیں۔

لائبریری اور CLI کے npm نسخے <code dir="ltr">0.1.0-dev.5</code> میں گروپس، captures، پہلے کے references اور ترتیب وار alternatives شامل ہیں۔ ورکشاپ میں captures کی جانچ اور متعدد search matches بھی دستیاب ہیں۔ تفصیل [مطابقت](../COMPATIBILITY.md) اور [اشاعت کے ریکارڈ](../DISTRIBUTION.md) میں ہے۔

## 📦 آزمائشی نسخہ انسٹال کریں

<div dir="ltr" align="left">

```sh
npm install regex-for-humans@preview
```

</div>

کمانڈ لائن کو global installation کے بغیر چلائیں:

<div dir="ltr" align="left">

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

</div>

نتیجہ: <code dir="ltr">/^ABC\d{3}$/u</code>۔ کسی خاص ورژن کے لیے <code dir="ltr">regex-for-humans@0.1.0-dev.5</code> استعمال کریں۔ رن ٹائم کی اضافی dependencies یا ہر نظام کے لیے الگ executable فراہم نہیں کیا گیا۔

## 🎮 کوئی pattern آزمائیں

1. ایک تیار مثال منتخب کریں یا ہر سطر پر ایک ہدایت لکھیں۔
2. بننے والے حصوں اور ان کی وضاحت کو دیکھیں۔
3. اپنی مثالیں شامل کریں اور بتائیں کہ کن کا match ہونا چاہیے۔
4. جب نتیجہ مناسب ہو تو regex کاپی کر لیں۔

جزوی match کے ساتھ مختصر escaped سیاق اور نمایاں کیا ہوا متن دکھتا ہے؛ خالی match کے لیے مقام کا نشان آتا ہے۔ قواعد اور مثالیں براؤزر میں رہتی ہیں۔ اکاؤنٹ، AI سے تشریح یا application backend کی ضرورت نہیں۔

موجودہ ورکشاپ میں match کھول کر capture کی قدریں اور مقامات دیکھیں۔ **Capture نہیں ہوا** اور **خالی متن capture ہوا** الگ دکھائے جاتے ہیں؛ بار بار آنے والا گروپ اپنی آخری capture دکھاتا ہے۔ **Search anywhere** زیادہ سے زیادہ 100 غیر متداخل matches دکھاتا ہے اور خالی match کے بعد مکمل Unicode code point آگے بڑھتا ہے۔ مقامات UTF-16 units میں ہیں؛ آخری حد شامل نہیں۔ اگر انجن capture indices نہ دے تو قدریں دکھائی جاتی ہیں، مقامات اندازے سے نہیں بنائے جاتے۔

[![ڈیسک ٹاپ ورکشاپ کی حقیقی تصویر](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=e1a2f3784e8c)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

[موبائل منظر اور checksums](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md)۔

## 🔄 پہلے سے regex موجود ہے؟

ورکشاپ کے **Already have a regex?** حصے میں معاونت یافتہ JavaScript regex literal پیسٹ کریں۔ **Translate to rules** دبائیں یا Ctrl/Cmd + Enter استعمال کریں۔ <code dir="ltr">/^[A-Z]{2}-\d{4}$/u</code> اس طرح بدلتا ہے:

<div dir="ltr" align="left">

```text
start
2 uppercase letter
"-"
4 digit
end
```

</div>

Literal کے دونوں طرف <code dir="ltr">/</code> اور اس میں <code dir="ltr">u</code> یا <code dir="ltr">v</code> ہونا ضروری ہے۔ نئی سطر کو <code dir="ltr">\n</code> جیسے escape سے لکھیں۔ ترجمہ معاونت یافتہ <code dir="ltr">i</code>، <code dir="ltr">s</code>، <code dir="ltr">m</code> اور <code dir="ltr">u</code> کا رویہ برقرار رکھتا ہے۔ موجودہ سورس نام والے، نمبر والے، nested capture گروپ اور پچھلے references بھی درآمد کرتا ہے، ان کے نمبر اور قدریں بدلے بغیر۔

فہرست <code dir="ltr">[^]</code> کسی بھی محرف کے قاعدے اور <code dir="ltr">s</code> میں بدلتی ہے۔ ساتھ موجود عام dots سے line terminators واضح طور پر خارج کیے جاتے ہیں تاکہ معنی نہ بدلیں۔ حروف، word characters اور hex digits کی مکمل classes کے مساوی ترتیب والے انداز بھی قبول ہوتے ہیں۔ Path exclusions اور control escapes محفوظ رہتے ہیں؛ فہرست کے کنارے والا hyphen عام محرف رہتا ہے۔

غیر معاونت یافتہ ساخت مسترد ہوتی ہے؛ اسے حذف یا تقریباً تبدیل نہیں کیا جاتا۔ **Go to regex error** مسئلے کا مقام منتخب کرتا ہے، اور ناکامی پر موجودہ قواعد اور options محفوظ رہتے ہیں۔ آگے آنے والے یا ابھی کھلے capture کے references مسترد ہوتے ہیں۔ خالی noncapturing گروپ <code dir="ltr">0 any character</code> بنتا ہے: search میں خالی match ملتا ہے، مگر پوری string کے mode میں خالی input درکار ہے۔

## 🍱 شروع کرنے کے لیے تیار مثالیں

| مثال | نمونہ | کیا جانچتی ہے |
| ---: | ---: | ---: |
| [Prefix والا identifier](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | <code dir="ltr">ABC123</code> | Prefix اور تین ہندسے |
| [انوائس نمبر](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | <code dir="ltr">INV-1234</code> | <code dir="ltr">INV-</code> اور 2–6 ہندسے |
| [صارف نام](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | <code dir="ltr">Alice_7</code> | 3–16 محارف؛ پہلا ASCII حرف |
| [Hex رنگ](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | <code dir="ltr">#12aBcF</code> | <code dir="ltr">#</code> کے بعد چھ hex digits |
| [MAC address](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=mac-address-shape) | <code dir="ltr">00:1A:2B:3C:4D:5E</code> | <code dir="ltr">:</code> سے الگ چھ جوڑے |
| [UUID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=uuid-shape) | <code dir="ltr">8–4–4–4–12</code> | پانچ hex گروپ |
| [پروڈکٹ کوڈ](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=product-code-shape) | <code dir="ltr">AB-rgb-0420</code> | حروف اور ہندسوں کی مقررہ تعداد |
| [تاریخ کی شکل](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | <code dir="ltr">2026-09-30</code> | <code dir="ltr">YYYY-MM-DD</code> کی صورت |
| [وقت کی شکل](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | <code dir="ltr">09:30</code> | <code dir="ltr">HH:MM</code> کی صورت |
| [فون نمبر کی شکل](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | <code dir="ltr">+33123456789</code> | اختیاری <code dir="ltr">+</code> اور 7–15 ہندسے |
| [IPv4 کی شکل](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | <code dir="ltr">192.0.2.42</code> | 1–3 ہندسوں کے چار گروپ |
| [فائل کا نام](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | <code dir="ltr">report.txt</code> | محدود Unicode نام، path separators کے بغیر |
| [Artifact manifest](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | Path، hash، حجم | 19 قواعد اور نو مثالیں |
| [رسائی کا لاگ](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | Request، status، حجم | 43 قواعد اور آٹھ مثالیں |
| [منظم telemetry event](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | IDs اور اختیاری قدریں | 38 قواعد اور نو مثالیں |
| [ورژن کی شکل](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | <code dir="ltr">1.2.3</code> | تین عددی حصے |
| [خارج کیے گئے محارف](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | <code dir="ltr">xyz</code> | منتخب محارف کے بغیر متن |
| [سطر کا قاعدہ](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | <code dir="ltr">item 123</code> | کم از کم تین ہندسوں پر ختم ہونے والی سطر |

یہ مثالیں **شکل** جانچتی ہیں۔ ناممکن تاریخ یا <code dir="ltr">25:99</code> بھی match ہو سکتا ہے؛ کیلنڈر اور عددی حدود الگ جانچیں۔ IPv4 ہر حصے کو 255 تک محدود نہیں کرتا۔ UUID ورژن، variant یا یکتا ہونے کی ضمانت نہیں۔ فون اور انوائس کا کوئی رجسٹر نہیں دیکھا جاتا، اور صارف نام کی دستیابی بھی نہیں جانچی جاتی۔ ورژن کی مثال مکمل SemVer validator نہیں۔ رنگ کے لیے <code dir="ltr">#RRGGBB</code> درکار ہے؛ فائل سسٹم کے قواعد الگ ہیں۔

## 🏗️ بڑے patterns بھی واضح رہیں

[پیچیدہ مثالوں کی رہنمائی](../COMPLEX-EXAMPLES.md) میں چار formats، 35 قبول یا رد ہونے والے cases، اور ہر قاعدے کی وضاحت ہے: access log، telemetry event، artifact manifest اور کئی سطروں کا order۔

### 📦 Artifact manifest

اختیاری <code dir="ltr">nightly/</code> directory، محدود Unicode path، ورژن، archive کا نام، checksum اور حجم؛ سب tabs سے الگ:

<div dir="ltr" align="left">

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

</div>

<div dir="ltr" align="left">

```js
/^incoming\/(?:nightly\/){0,1}[^\/\\\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,32}\/v\d{1,3}\.\d{1,3}\.\d{1,3}\/linux-arm64\/widget_\d{8}_[0-9A-Fa-f]{8}\.tar\.gz\u{9}[0-9A-Fa-f]{64}\u{9}\d{1,12}$/u
```

</div>

یہ path اور hash کی شکل جانچتا ہے؛ فائل کے موجود ہونے یا مواد کی صحت کی ضمانت نہیں۔ Unicode کی حدود اور tabs واضح ہیں۔

### 🧾 کئی سطروں کا order

اس میں identifier، Unicode خریدار، فون، تعداد، رقم، reference، اختیاری approval اور اختیاری مکمل priority سطر:

<div dir="ltr" align="left">

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

</div>

<div dir="ltr" align="left">

```js
/^ORDER\u{a}id=ORD-[0-9A-Fa-f]{8}\u{a}buyer=[^\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,60}\u{a}phone=\+{0,1}\d{7,15}\u{a}items=\d{1,4}\u{a}total=\d{1,6}\.\d{2} EUR\u{a}reference=[0-9A-Fa-f]{16}\u{a}approval=[AD]{0,1}\u{a}(?:priority=HIGH\u{a}){0,1}END\u{a}{0,1}$/u
```

</div>

نئی سطر کے محارف literal ہیں۔ رقم، نمبر اور order کی کاروباری جانچ application کی ذمہ داری ہے۔ رہنمائی کی چار سادہ مثالیں fields extract نہیں کرتیں۔

## 🧲 نام والے captures سے fields نکالیں

یہ مثال npm نسخے <code dir="ltr">0.1.0-dev.5</code> اور شائع شدہ ورکشاپ میں کام کرتی ہے۔

<div dir="ltr" align="left">

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

</div>

<div dir="ltr" align="left">

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

</div>

قاعدہ <code dir="ltr">capture {</code> نمبر والا گروپ بناتا ہے؛ <code dir="ltr">group {</code> بغیر capture کیے قواعد اکٹھے کرتا ہے۔ نام منفرد JavaScript identifiers ہوتے ہیں۔ نمبر گروپ کھلنے کی ترتیب سے ملتے ہیں، nested گروپوں میں بھی۔ غیر موجود اختیاری capture کی قدر <code dir="ltr">undefined</code>، حصہ لینے والے خالی capture کی قدر <code dir="ltr">""</code> ہوتی ہے، اور repeated capture آخری قدر رکھتا ہے۔

گروپ بند ہونے کے بعد <code dir="ltr">same as capture "word"</code> یا <code dir="ltr">same as capture 1</code> اسی متن کو دوبارہ لازم کرتا ہے۔ [مثال](../LANGUAGE.md#capture-references) <code dir="ltr">cat cat</code> قبول اور <code dir="ltr">cat dog</code> مسترد کرتی ہے۔ مستقبل کے capture یا اپنے کھلے گروپ کا reference واضح error دیتا ہے۔ Reverse translation معاونت یافتہ نام، نمبر اور قدریں محفوظ رکھتی ہے۔ نکالی گئی تاریخ کی calendar validation پھر بھی ضروری ہے۔

## 🧩 مختصر حوالہ

ہر سطر پر ایک ہدایت؛ literal متن quotation marks کے اندر۔

| قاعدہ | نتیجہ | مطلب |
| ---: | ---: | ---: |
| <code dir="ltr">start</code> / <code dir="ltr">end</code> | <code dir="ltr">^</code> / <code dir="ltr">$</code> | Input کی حدود |
| <code dir="ltr">line start</code> / <code dir="ltr">line end</code> | <code dir="ltr">^</code> / <code dir="ltr">$</code> اور <code dir="ltr">m</code> | سطروں کی حدود |
| <code dir="ltr">digit</code> / <code dir="ltr">not digit</code> | <code dir="ltr">\d</code> / <code dir="ltr">\D</code> | ASCII ہندسہ یا اس کے علاوہ |
| <code dir="ltr">3 digits</code> / <code dir="ltr">digits</code> | <code dir="ltr">\d{3}</code> / <code dir="ltr">\d+</code> | تین یا کم از کم ایک ہندسہ |
| <code dir="ltr">between 2 and 4 digits</code> | <code dir="ltr">\d{2,4}</code> | دونوں حدود شامل |
| <code dir="ltr">optional "-"</code> | <code dir="ltr">-{0,1}</code> | اختیاری hyphen |
| <code dir="ltr">letter</code> / <code dir="ltr">letters</code> | <code dir="ltr">[A-Za-z]</code> / <code dir="ltr">[A-Za-z]+</code> | ASCII حروف |
| <code dir="ltr">lowercase letters</code> / <code dir="ltr">uppercase letters</code> | <code dir="ltr">[a-z]+</code> / <code dir="ltr">[A-Z]+</code> | ASCII case؛ <code dir="ltr">i</code> فرق نظرانداز کرتا ہے |
| <code dir="ltr">6 hex digits</code> | <code dir="ltr">[0-9A-Fa-f]{6}</code> | چھ hex digits |
| <code dir="ltr">space</code> / <code dir="ltr">spaces</code> | <code dir="ltr">\s</code> / <code dir="ltr">\s+</code> | Whitespace، نئی سطر سمیت |
| <code dir="ltr">between 1 and 32 path segment characters</code> | 1–32 code points | Separators، NUL اور نئی سطروں کے بغیر |
| <code dir="ltr">"hello"</code> | <code dir="ltr">hello</code> | بعینہٖ متن، ضروری escapes کے ساتھ |
| <code dir="ltr">one of: a, b</code> | <code dir="ltr">[ab]</code> | فہرست کا ایک محرف |
| <code dir="ltr">text without: a, b</code> | <code dir="ltr">[^ab]*</code> | فہرست سے باہر صفر یا زیادہ محارف |
| <code dir="ltr">any text</code> | <code dir="ltr">.*</code> | <code dir="ltr">s</code> کے ساتھ نئی سطریں بھی |

قواعد <code dir="ltr">word character</code>، <code dir="ltr">word characters</code>، <code dir="ltr">word</code> اور <code dir="ltr">not word</code> میں <code dir="ltr">\w</code> اور <code dir="ltr">\W</code> کا مطلب استعمال ہوتا ہے۔ فہرست <code dir="ltr">\w</code> میں <code dir="ltr">_</code> ہے، مگر <code dir="ltr">é</code> نہیں۔ <code dir="ltr">letter</code> ہندسے اور underscore شامل نہیں کرتا۔ JavaScript کی native case matching میں <code dir="ltr">i</code> کے ساتھ <code dir="ltr">K</code> اور <code dir="ltr">ſ</code> بھی آ سکتے ہیں۔ فلیگ <code dir="ltr">u</code> ڈیفالٹ ہے اور سورس میں <code dir="ltr">v</code> بھی دستیاب ہے؛ دونوں ASCII classes کو تمام Unicode categories نہیں بناتے۔

## 💻 ٹرمینل میں استعمال

<div dir="ltr" align="left">

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

</div>

یا cloned repository سے:

<div dir="ltr" align="left">

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

</div>

<div dir="ltr" align="left">

```text
/^ABC\d{3}$/u
```

</div>

✅ <code dir="ltr">ABC123</code> · ❌ <code dir="ltr">ABC12</code>, <code dir="ltr">ABC1234</code>, <code dir="ltr">abc123</code>

| Option | کام |
| ---: | ---: |
| <code dir="ltr">--explain</code> | حصے اور ان کی وضاحت |
| <code dir="ltr">--json</code> | stdout پر منظم نتیجہ، stderr پر errors |
| <code dir="ltr">--ignore-case</code> | <code dir="ltr">i</code> فعال کرتا ہے |
| <code dir="ltr">--dot-all</code> | <code dir="ltr">s</code> فعال کرتا ہے |
| <code dir="ltr">--flags</code> | Native JavaScript flags منتخب کریں؛ u/v ساتھ نہیں دیے جا سکتے |
| <code dir="ltr">--help</code> | مدد |
| <code dir="ltr">--version</code> | پیکیج کا ورژن |

ان پٹ کے لیے UTF-8 فائل یا stdin پڑھیں۔ <code dir="ltr">-</code> سے شروع ہونے والے فائل نام سے پہلے <code dir="ltr">--</code> لگائیں۔ Exit codes: کامیابی، مدد اور ورژن کے لیے <code dir="ltr">0</code>؛ غلط قواعد یا input/output error کے لیے <code dir="ltr">1</code>؛ غلط arguments کے لیے <code dir="ltr">2</code>۔

خراب UTF-8 مسترد ہوتا ہے، خاموشی سے تبدیل نہیں کیا جاتا۔ JSON diagnostics اپنے codes برقرار رکھتے ہیں: استعمال کی غلطی کے لیے <code dir="ltr">CLI_USAGE</code>، فائل یا runtime error کے لیے <code dir="ltr">CLI_ERROR</code>۔ Control characters کو escape کر کے دکھایا جاتا ہے؛ decoded JSON اصل data واپس دیتا ہے۔ stderr لکھنے میں ناکامی پر nonzero exit ہوتا ہے۔

ریورس ترجمے میں regex کے اندر <code dir="ltr">u</code> درکار ہے؛ forward translation کے CLI flags خاموشی سے نظرانداز ہونے کے بجائے مسترد ہوتے ہیں:

<div dir="ltr" align="left">

```sh
printf '%s\n' '/^[A-Z]{2}-[0-9]{4}$/u' | npx --yes --package=regex-for-humans@preview regex-for-humans --reverse
```

</div>

<div dir="ltr" align="left">

```text
start
2 uppercase letter
"-"
4 digit
end
```

</div>

منظم نتیجے کے لیے <code dir="ltr">--reverse --json</code> بھی ہے۔ خالی یا غیر معاونت یافتہ input پر مقام کے ساتھ diagnostic آتا ہے، جزوی ترجمہ نہیں۔

## 🧪 جاوا اسکرپٹ اور ٹائپ اسکرپٹ میں استعمال

<div dir="ltr" align="left">

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

</div>

فنکشن <code dir="ltr">toRegExp({ source, flags })</code> cached metadata قبول کرتا ہے۔ دونوں fields strings ہونے چاہییں؛ segments نہیں پڑھے جاتے۔ <code dir="ltr">compile("digit", { flags: undefined })</code> فلیگ <code dir="ltr">u</code> استعمال کرتا ہے، <code dir="ltr">exactOptionalPropertyTypes</code> کے ساتھ بھی۔

فنکشن <code dir="ltr">regexToRules()</code> دوسرے JavaScript contexts کے حقیقی regex قبول کرتا ہے، <code dir="ltr">lastIndex</code> محفوظ رکھتا ہے، اور matching methods یا instance کے overridden methods چلائے بغیر native metadata پڑھتا ہے۔ <code dir="ltr">\u{00000041}</code> جیسے escapes source limit کے اندر معاونت یافتہ ہیں۔

## 🎛️ واضح اثر والے flags

| Flag | کیسے فعال ہوتا ہے | اثر |
| ---: | ---: | ---: |
| <code dir="ltr">u</code> | بطور ڈیفالٹ | Unicode code points کے مطابق match |
| <code dir="ltr">i</code> | <code dir="ltr">{ flags: 'i' }</code> یا <code dir="ltr">--ignore-case</code> | JavaScript کے مطابق case کے فرق کے بغیر موازنہ |
| <code dir="ltr">s</code> | <code dir="ltr">{ flags: 's' }</code> یا <code dir="ltr">--dot-all</code> | Dot نئی سطر بھی match کر سکتا ہے |
| <code dir="ltr">m</code> | <code dir="ltr">line start</code> / <code dir="ltr">line end</code> | ہر سطر کے anchors |
| <code dir="ltr">d</code> | <code dir="ltr">{ flags: 'd' }</code> | Native match اور capture indices |
| <code dir="ltr">g</code> | <code dir="ltr">{ flags: 'g' }</code> | بار بار کال سے <code dir="ltr">lastIndex</code> آگے بڑھتا ہے |
| <code dir="ltr">y</code> | <code dir="ltr">{ flags: 'y' }</code> | <code dir="ltr">lastIndex</code> پر match، پہلی رکاوٹ پر رکنا |
| <code dir="ltr">v</code> | <code dir="ltr">{ flags: 'v' }</code> | Native v-mode Unicode classes اور complements |

**npm preview میں:** آٹھوں flags <code dir="ltr">d</code>، <code dir="ltr">g</code>، <code dir="ltr">i</code>، <code dir="ltr">m</code>، <code dir="ltr">s</code>، <code dir="ltr">u</code>، <code dir="ltr">v</code>، <code dir="ltr">y</code> دستیاب ہیں۔ نتیجے کی ترتیب <code dir="ltr">dgimsuvy</code> ہے؛ duplicates اور u/v ساتھ دینے پر خرابی آتی ہے، u ڈیفالٹ ہے۔ m الگ option یا line anchors سے فعال ہوتا ہے؛ دونوں انداز ملانے پر input anchors مکمل حدود برقرار رکھتے ہیں۔ Reverse translation options محفوظ رکھتی ہے اور <code dir="ltr">lastIndex</code> نہیں بدلتی۔ Workshop ہر مثال 0 سے شروع کرتا ہے اور زیادہ سے زیادہ 100 matches دکھاتا ہے؛ copied g/y regex کی state برقرار رہتی ہے۔ غیر موجود native صلاحیتوں کے واضح diagnostics ملتے ہیں۔npm <code dir="ltr">0.1.0-dev.5</code> میں دستیاب ہے۔

<p dir="rtl"><strong>npm preview میں:</strong> strings کے sets اور Unicode string properties کے لیے <code dir="ltr">v</code> منتخب کریں۔ Native انجن فہرست کی ترتیب سے قطع نظر لمبے ارکان پہلے آزماتا ہے؛ بعد کے قواعد چھوٹے رکن پر واپس جانے کا تقاضا کر سکتے ہیں۔ خالی strings بھی درست ہیں۔ تیسری صورت class کے اندر استعمال کریں۔ String property یا ایسی class کا complement نہیں بنایا جا سکتا جس میں خالی string یا کئی Unicode code points والا رکن ہو۔ یہ سہولتیں npm کے اس ورژن میں دستیاب ہیں:</p>
<p dir="ltr" align="left"><code dir="ltr">0.1.0-dev.5</code></p>

<p dir="ltr" align="left"><code dir="ltr">one of strings: "a", "ab", ""</code></p>
<p dir="ltr" align="left"><code dir="ltr">unicode property "RGI_Emoji"</code></p>
<p dir="ltr" align="left"><code dir="ltr">string "ab"</code></p>

<p dir="rtl"><strong>npm preview میں:</strong> نیچے دی گئی صورتیں nested sets بناتی ہیں؛ block کو <code dir="ltr">}</code> سے بند کریں۔ ہر سطر ایک حرف، range، class، property، strings کا set یا nested set ہے۔ Intersection مشترک ارکان رکھتا ہے؛ subtraction پہلے operand سے دائیں طرف کے ارکان ہٹاتا ہے۔ تکرار کی تعداد اور <code dir="ltr">lazy</code> پورے block پر لاگو ہوتے ہیں۔ <code dir="ltr">not</code> strings کے native ساختی اصولوں کی پابندی کرتا ہے؛ خالی union کسی متن سے match نہیں کرتا۔ <code dir="ltr">v</code> منتخب کریں؛ یہ سہولتیں اوپر درج npm ورژن میں دستیاب ہیں۔ <a href="../LANGUAGE.md#nested-unicode-set-operations">Syntax اور مثالیں</a> دیکھیں۔</p>

<p dir="ltr" align="left"><code dir="ltr">character set union {</code></p>
<p dir="ltr" align="left"><code dir="ltr">character set intersection {</code></p>
<p dir="ltr" align="left"><code dir="ltr">character set subtraction {</code></p>

<p dir="ltr" align="left"><code dir="ltr">{ flags: 'dgiv' }</code></p>

<p dir="ltr" align="left"><code dir="ltr">--flags dgiv</code></p>

## 🛠️ مقامی development

<div dir="ltr" align="left">

```sh
npm ci
npm run build
npm run serve
```

</div>

پتہ <a dir="ltr" href="http://127.0.0.1:4174/"><strong>http://127.0.0.1:4174/</strong></a> کھولیں۔ <code dir="ltr">npm run serve -- 0</code> دستیاب port منتخب کر کے URL دکھاتا ہے۔ Directory URLs کے آخر میں slash شامل ہوتا ہے؛ query parameters برقرار رہتے ہیں۔

اگر Chrome انسٹال ہو تو تمام checks چلائیں:

<div dir="ltr" align="left">

```sh
npm ci
npm exec -- playwright install firefox webkit
npm run verify
```

</div>

اگر Chrome موجود نہیں تو Playwright کا bundled Chromium استعمال کریں:

<div dir="ltr" align="left">

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

</div>

تصدیق میں formatting، lint، types، links، Node tests، Pages build، صاف consumer project میں package installation، browsers اور audit شامل ہیں۔ <code dir="ltr">CI=1</code> مقامی browser منتخب کرتا ہے؛ یہ GitHub Actions فعال نہیں کرتا، جو بند رہتا ہے۔

## 🧭 حدود کو سمجھیں

متبادل قابلِ تدوین <code dir="ltr">either { … }</code> بلاک بنتے ہیں؛ ہر براہِ راست entry ایک انتخاب ہے جو ترتیب سے آزمایا جاتا ہے۔ کئی قواعد والے یا خالی انتخاب کے لیے <code dir="ltr">group { … }</code> استعمال کریں۔

ہدف **JavaScript <code dir="ltr">RegExp</code>** ہے۔ قواعد کی زبان raw regex یا آزاد انگریزی قبول نہیں کرتی۔ Reverse translation صرف دستاویز میں درج subset پر کام کرتی ہے۔ آزاد انگریزی، <code dir="ltr">u</code> موڈ کی خالی character classes اور future/open references ابھی مسترد ہوتے ہیں۔ ورکشاپ میں worker کے لیے deadline ہے؛ کاپی کیا ہوا regex اپنی application میں execution safeguards مانگتا ہے۔ [حفاظتی ماڈل](../SECURITY_MODEL.md) دیکھیں۔

## 💬 عام سوالات

**کیا یہ AI استعمال کرتا ہے؟** نہیں۔ ایک deterministic parser، AST، compiler اور structured explanations ہیں۔

**کیا ہر regex تبدیل ہو سکتا ہے؟** نہیں۔ نامعلوم ساخت error دیتی ہے؛ conversion کروانے کے لیے capture یا assertion حذف نہیں ہوتا۔

**کیا ایک مثال کا کامیاب ہونا حفاظت ثابت کرتا ہے؟** نہیں۔ یہ منتخب رویہ جانچتا ہے، ہر execution path یا اس کی لاگت نہیں۔

**کیا classes پورا Unicode شامل کرتی ہیں؟** نہیں۔ <code dir="ltr">digit</code> ASCII ہے، <code dir="ltr">letter</code> کا مطلب <code dir="ltr">[A-Za-z]</code> ہے، اور <code dir="ltr">word</code> میں <code dir="ltr">\w</code> کا رویہ ہے۔

**کیا limits ہیں؟** 16,384 UTF-16 units، 200 سطریں، bounded repetition زیادہ سے زیادہ 1,000، اور nesting depth 64۔ زیادہ سے زیادہ 100 مثالیں، ہر ایک 2,048 units تک، اور worker deadline 1,200 milliseconds۔ Emoji عموماً دو UTF-16 units لیتا ہے۔

**کیا offline چلتا ہے؟** لائبریری اور CLI مقامی طور پر چلتے ہیں۔ Dependencies نصب کرنے کے بعد ورکشاپ locally build اور serve کی جا سکتی ہے۔ PWA یا offline cache فراہم ہونے کا دعویٰ نہیں کیا گیا۔

**مسئلہ کیسے رپورٹ کریں؟** [GitHub Issues](https://github.com/OthmaneBlial/Regex-For-Humans/issues) میں قواعد، flags، input، مطلوبہ نتیجہ اور engine version دیں۔ Security مسئلے کے لیے [SECURITY.md](../../SECURITY.md) کی نجی رپورٹنگ ہدایات استعمال کریں۔

## 🗺️ منصوبہ مزید سمجھیں

| رہنمائی | موضوع |
| ---: | ---: |
| [زبان](../LANGUAGE.md) | Grammar، captures، references اور diagnostics |
| [پیچیدہ مثالیں](../COMPLEX-EXAMPLES.md) | چار formats اور ہر قاعدے کی وضاحت |
| [Architecture](../ARCHITECTURE.md) | Parser → AST → compiler → interfaces |
| [مطابقت](../COMPATIBILITY.md) | جانچی گئی ساختیں اور engines |
| [Testing](../TESTING.md) | دوبارہ چلانے کے قابل commands اور شواہد |
| [حفاظت](../SECURITY_MODEL.md) | Trust boundaries اور limits |
| [Distribution](../DISTRIBUTION.md) | npm، versions اور شائع شدہ site |
| [روڈ میپ](../AUTONOMOUS_ROADMAP.md) | مکمل مراحل اور اگلے کام |
| [موازنہ](../COMPETITOR_GAPS.md) | Sources اور باقی صلاحیتیں |
| [حصہ ڈالیں](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) | Setup اور conventions |

**10 اکتوبر 2026 کو مقامی جانچ:** 301 Node tests، 378 desktop/mobile Chromium workshop checks، 148 Firefox/WebKit checks، 64 site checks اور صاف package installation کامیاب ہوئے؛ audit میں کوئی vulnerability رپورٹ نہیں ہوئی۔ گروپ، reference اور reverse translation کے 16 مخصوص tests Node 22.23.3 پر بھی کامیاب ہوئے۔ یہ اعداد اسی snapshot کے ہیں؛ ہر browser یا آئندہ version کی ضمانت نہیں۔ انسانی جائزے ابھی باقی ہیں۔

لائسنس [MIT](../../LICENSE) · [تبدیلیوں کا ریکارڈ](../../CHANGELOG.md) · [انگریزی میں واپس جائیں](../../README.md)۔

</div>
