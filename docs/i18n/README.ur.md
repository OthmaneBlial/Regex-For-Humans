<div dir="rtl" lang="ur">

<div align="center">

[![Regex For Humans: ریگولر ایکسپریشن ^#[0-9A-Fa-f]{6}$ اور ہر ٹکڑے کے نیچے اس کا سادہ انگریزی مطلب](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**ریگیکس سادہ انگریزی میں لکھیں۔ کسی بھی ریگیکس کو اسی طرح پڑھیں۔**

مختصر انگریزی اصول مقامی JavaScript <code dir="ltr">RegExp</code> میں کمپائل ہوتے ہیں، ہر اصول کا ایک نظر آنے والا ٹکڑا۔ کوئی ریگیکس چسپاں کریں اور اصول واپس پائیں۔

**[ورکشاپ آزمائیں](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [ویب سائٹ](https://othmaneblial.github.io/Regex-For-Humans/) · [npm پیش نظارہ](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.13) · [نحو](../LANGUAGE.md)**

<div dir="ltr" align="center">

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · **اردو**

</div>

</div>

## اصول لکھیں، ریگیکس پائیں

<table>
<tr><th>اصول</th><th>JavaScript ریگیکس</th></tr>
<tr><td>

<div dir="ltr" align="left">

```text
start "#"
6 hex digits
end
```

</div>

</td><td>

<div dir="ltr" align="left">

```js
/^#[0-9A-Fa-f]{6}$/u
```

</div>

✅ <code dir="ltr">#12aBcF</code> · <code dir="ltr">#000000</code><br>
❌ <code dir="ltr">#123</code> · <code dir="ltr">#G00000</code>

</td></tr>
</table>

ہر سطر کا ایک دستاویزی مطلب ہے اور وہ ترتیب سے ریگیکس میں ایک ٹکڑا جوڑتی ہے۔ نتیجہ وہی ریگیکس ہے جو آپ ہاتھ سے لکھتے: <code dir="ltr">{0,1}</code> کے بجائے <code dir="ltr">?</code>، اور کوئی فالتو گروپ نہیں۔ نامعلوم جملہ اپنی سطر، کالم اور تجویز کردہ درستی کے ساتھ رک جاتا ہے۔

[![چھ تراکیب باری باری: اصول، کمپائل شدہ ریگیکس، ہر ٹکڑے کا مطلب اور مثال میں اس کی مطابقت](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-reel.svg)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

## ریگیکس کو واپس پڑھیں

کوئی ایسا پیٹرن ملا جسے کوئی پڑھ نہیں سکتا؟ <code dir="ltr">regexToRules</code> معاون ریگیکس کو قابلِ ترمیم اصولوں میں بدلتا ہے، اور یہ اصول دوبارہ اسی ریگیکس میں کمپائل ہوتے ہیں۔

<div dir="ltr" align="left">

```js
import { regexToRules } from 'regex-for-humans';

regexToRules(/^[A-Z]{2}-\d{4}$/u).rules;
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

[ویب سائٹ](https://othmaneblial.github.io/Regex-For-Humans/) چسپاں کیے گئے ہر ریگیکس کی وہیں وضاحت کرتی ہے۔ غیر معاون نحو اپنی جگہ کے ساتھ رد ہوتی ہے، خاموشی سے حذف نہیں ہوتی۔

## جو پکڑیں اسے نام دیں

<!-- captures:date -->
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
toRegExp(compile(rules)).exec('2026-10-10').groups;
// { year: '2026', month: '10', day: '10' }
```

</div>

کیپچر مقامی JavaScript گروپ ہیں۔ وہی متن دوبارہ مانگنے کے لیے <code dir="ltr">same as capture "year"</code> لکھیں۔

## انسٹال

<div dir="ltr" align="left">

```sh
npm install regex-for-humans@preview
```

</div>

<div dir="ltr" align="left">

```js
import { compile, toRegExp } from 'regex-for-humans';

const result = compile('start\n3 digits\nend');
console.log(result.source);                 // ^\d{3}$
console.log(toRegExp(result).test('123'));  // true
```

</div>

<div dir="ltr" align="left">

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans --explain
```

</div>

Node.js 22+، رن ٹائم انحصار کوئی نہیں، TypeScript اعلانات کے ساتھ ESM۔ لائبریری، [کمانڈ لائن](../CLI.md) اور ورکشاپ ایک ہی کمپائلر استعمال کرتے ہیں۔ یہ پیش نظارہ ہے (<code dir="ltr">0.1.0-dev.13</code>)؛ [ورکشاپ](https://othmaneblial.github.io/Regex-For-Humans/workshop/) کو انسٹال کی ضرورت نہیں۔

## ذخیرۂ الفاظ ایک نظر میں

| یہ لکھیں | یہ پائیں |
| --- | --- |
| <code dir="ltr">start</code> · <code dir="ltr">end</code> | <code dir="ltr">^</code> · <code dir="ltr">$</code> |
| <code dir="ltr">3 digits</code> · <code dir="ltr">digits</code> | <code dir="ltr">\d{3}</code> · <code dir="ltr">\d+</code> |
| <code dir="ltr">between 2 and 4 letters</code> | <code dir="ltr">[A-Za-z]{2,4}</code> |
| <code dir="ltr">optional "-"</code> | <code dir="ltr">-?</code> |
| <code dir="ltr">one of: a, b</code> | <code dir="ltr">[ab]</code> |
| <code dir="ltr">either { "INFO" "WARN" }</code> | <code dir="ltr">(?:INFO&#124;WARN)</code> |
| <code dir="ltr">capture "id" { … }</code> | <code dir="ltr">(?&lt;id&gt;…)</code> |
| <code dir="ltr">not followed by { "x" }</code> | <code dir="ltr">(?!x)</code> |

<code dir="ltr">either { … }</code> جیسے بلاکس میں قوسین کے اندر ہر سطر پر ایک اصول ہوتا ہے۔ [زبان کی رہنمائی](../LANGUAGE.md) ہر اصول، فلیگ، Unicode کلاس، lookaround اور حد بیان کرتی ہے۔

## کھولنے کو تیار 34 تراکیب

| ترکیب | کیا جانچتی ہے |
| --- | --- |
| [کیلنڈر تاریخ کی تصدیق](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=calendar-date) | مہینہ 01–12، دن 01–31، سال، مہینہ اور دن کے طور پر کیپچر |
| [IPv4 پتے کی تصدیق](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-address) | 0 سے 255 تک چار اعداد، شروع میں صفر نہیں |
| [24 گھنٹے کے وقت کی تصدیق](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=clock-time) | <code dir="ltr">00:00</code> سے <code dir="ltr">23:59</code> تک |
| [SemVer 2.0 نحو کی تصدیق](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | بنیادی، پری ریلیز اور بلڈ حصے |
| [لاگ کے ٹکڑے سے نام والے فیلڈ نکالیں](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | سطح اور کوڈ، نام سے |
| [دہرایا گیا لفظ پکڑیں](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | ایک لفظ، پھر وہی لفظ |

ہر ترکیب کے ساتھ ایسی مثالیں ہیں جنہیں ملنا چاہیے اور جنہیں نہیں ملنا چاہیے، اور ایک نوٹ کہ وہ کیا نہیں جانچتی۔ [تمام 34 تراکیب](../RECIPES.md) اور **35 قبول یا رد شدہ کیسز** والی چار [پیچیدہ مثالیں](../COMPLEX-EXAMPLES.md) دیکھیں۔

## نتیجے پر بھروسا کیوں کریں

- **متعین۔** پارسر، ماڈل نہیں: ایک جیسے اصول ہمیشہ ایک جیسا ریگیکس دیتے ہیں۔ نہ AI، نہ نیٹ ورک، نہ ٹیلی میٹری۔
- **مقامی۔** نتیجہ ایک عام <code dir="ltr">RegExp</code> ہے؛ مطابقت کے وقت صرف انجن چلتا ہے۔ Python، Rust، Go، Java، C#، PHP اور Ruby کے [ایکسپورٹ](../LANGUAGE.md#engine-exports) انہی انجنوں سے ملائے جاتے ہیں۔
- **حدود کے بارے میں دیانت دار۔** تراکیب بتاتی ہیں کہ وہ کیا نہیں جانچتیں۔ ورکشاپ آپ کی مثالیں وقت کی حد والے worker میں چلاتی ہے؛ نقل کیے گئے ریگیکس کو اپنے حفاظتی انتظامات چاہییں ([سیکیورٹی ماڈل](../SECURITY_MODEL.md))۔
- **جانچا ہوا۔** ہر ترکیب اور اس README کی ہر مثال ٹیسٹ سوٹ میں دوبارہ کمپائل ہوتی ہے ([ٹیسٹنگ](../TESTING.md))۔

[آرکیٹیکچر](../ARCHITECTURE.md) · [مطابقت](../COMPATIBILITY.md) · [تعاون](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [تبدیلیاں](../../CHANGELOG.md) · [سیکیورٹی](../../SECURITY.md) · [MIT](../../LICENSE)

<div align="center">

اگر یہاں کے کسی اصول نے آپ کو آنکھیں سکیڑنے سے بچایا تو ایک ⭐ دوسرے ڈویلپرز کو اسے ڈھونڈنے میں مدد دیتا ہے۔

</div>

</div>
