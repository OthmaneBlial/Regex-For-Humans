<div dir="rtl" lang="ar">

<div align="center">

[![Regex For Humans: التعبير ^#[0-9A-Fa-f]{6}$ وتحت كل جزء منه معناه بإنجليزية بسيطة](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**اكتب التعبيرات المنتظمة بإنجليزية بسيطة. واقرأ أي تعبير بالطريقة نفسها.**

تتحول قواعد إنجليزية قصيرة إلى <code dir="ltr">RegExp</code> أصلي في JavaScript، لكل قاعدة جزء ظاهر. الصق تعبيرًا منتظمًا واستعد قواعده.

**[جرّب الورشة](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [الموقع](https://othmaneblial.github.io/Regex-For-Humans/) · [النسخة التجريبية على npm](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.13) · [الصياغة](../LANGUAGE.md)**

<div dir="ltr" align="center">

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · **العربية** · [اردو](README.ur.md)

</div>

</div>

## اكتب القواعد، واحصل على التعبير

<table>
<tr><th>القواعد</th><th>تعبير JavaScript</th></tr>
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

لكل سطر معنى موثّق، ويضيف جزءًا واحدًا إلى التعبير بالترتيب. الناتج هو التعبير الذي كنت ستكتبه بيدك: <code dir="ltr">?</code> بدل <code dir="ltr">{0,1}</code>، ودون مجموعات زائدة. وأي عبارة غير معروفة تتوقف مع رقم سطرها وعمودها واقتراح لإصلاحها.

[![ست وصفات بالتتابع: القواعد، والتعبير الناتج، ومعنى كل جزء، وما طابقه في مثال](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-reel.svg)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

## اقرأ التعبير عكسيًا

ورثت نمطًا لا يقرؤه أحد؟ تحوّل <code dir="ltr">regexToRules</code> التعبير المدعوم إلى قواعد قابلة للتعديل، وتُترجم هذه القواعد مرة أخرى إلى التعبير نفسه.

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

يشرح [الموقع](https://othmaneblial.github.io/Regex-For-Humans/) أي تعبير تلصقه في مكانه. وتُرفض الصياغة غير المدعومة مع موضعها، ولا تُحذف بصمت أبدًا.

## سمِّ ما تلتقطه

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

الالتقاطات مجموعات JavaScript أصلية. اكتب <code dir="ltr">same as capture "year"</code> لتطلب النص نفسه مرة أخرى.

## التثبيت

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

يتطلب Node.js 22+، دون اعتماديات وقت التشغيل، بصيغة ESM مع تعريفات TypeScript. تشترك المكتبة و[سطر الأوامر](../CLI.md) والورشة في مترجم واحد. هذه نسخة تجريبية (<code dir="ltr">0.1.0-dev.13</code>)، و[الورشة](https://othmaneblial.github.io/Regex-For-Humans/workshop/) لا تحتاج إلى تثبيت.

## المفردات في لمحة

| اكتب | تحصل على |
| --- | --- |
| <code dir="ltr">start</code> · <code dir="ltr">end</code> | <code dir="ltr">^</code> · <code dir="ltr">$</code> |
| <code dir="ltr">3 digits</code> · <code dir="ltr">digits</code> | <code dir="ltr">\d{3}</code> · <code dir="ltr">\d+</code> |
| <code dir="ltr">between 2 and 4 letters</code> | <code dir="ltr">[A-Za-z]{2,4}</code> |
| <code dir="ltr">optional "-"</code> | <code dir="ltr">-?</code> |
| <code dir="ltr">one of: a, b</code> | <code dir="ltr">[ab]</code> |
| <code dir="ltr">either { "INFO" "WARN" }</code> | <code dir="ltr">(?:INFO&#124;WARN)</code> |
| <code dir="ltr">capture "id" { … }</code> | <code dir="ltr">(?&lt;id&gt;…)</code> |
| <code dir="ltr">not followed by { "x" }</code> | <code dir="ltr">(?!x)</code> |

تضم الكتل مثل <code dir="ltr">either { … }</code> قاعدة واحدة في كل سطر بين القوسين. يشرح [دليل اللغة](../LANGUAGE.md) كل قاعدة وعلامة وفئة Unicode وتأكيد وحدّ.

## 34 وصفة جاهزة للفتح

| الوصفة | ما تتحقق منه |
| --- | --- |
| [التحقق من تاريخ تقويمي](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=calendar-date) | الشهر 01–12 واليوم 01–31، ملتقطة باسم السنة والشهر واليوم |
| [التحقق من عنوان IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-address) | أربعة أعداد من 0 إلى 255 دون أصفار بادئة |
| [التحقق من وقت بنظام 24 ساعة](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=clock-time) | من <code dir="ltr">00:00</code> إلى <code dir="ltr">23:59</code> |
| [التحقق من صياغة SemVer 2.0](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | الجزء الأساسي والإصدار التمهيدي وبيانات البناء |
| [استخراج حقول مسماة من سجل](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | المستوى والرمز باسميهما |
| [مطابقة كلمة مكررة](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | كلمة ثم الكلمة نفسها |

تأتي كل وصفة بأمثلة يجب أن تطابق وأخرى يجب ألا تطابق، وبملاحظة عمّا لا تتحقق منه. راجع [الوصفات الـ34 كلها](../RECIPES.md) وأربعة [أمثلة معقدة](../COMPLEX-EXAMPLES.md) فيها **35 حالة مقبولة أو مرفوضة**.

## لماذا يمكنك الوثوق بالناتج

- **حتمي.** محلل لا نموذج: القواعد نفسها تعطي التعبير نفسه دائمًا. لا ذكاء اصطناعي ولا شبكة ولا قياس عن بُعد.
- **أصلي.** الناتج <code dir="ltr">RegExp</code> عادي، ولا يعمل وقت المطابقة إلا المحرك. وتُقارن [عمليات التصدير](../LANGUAGE.md#engine-exports) إلى Python وRust وGo وJava وC# وPHP وRuby بتلك المحركات نفسها.
- **صريح بشأن الحدود.** تذكر الوصفات ما لا تتحقق منه. تشغّل الورشة أمثلتك في worker محدود الوقت، والتعبير المنسوخ يحتاج إلى ضماناته الخاصة ([نموذج الأمان](../SECURITY_MODEL.md)).
- **مُختبَر.** تعيد مجموعة الاختبارات ترجمة كل وصفة وكل مثال في هذا الملف ([الاختبارات](../TESTING.md)).

[البنية](../ARCHITECTURE.md) · [التوافق](../COMPATIBILITY.md) · [المساهمة](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [سجل التغييرات](../../CHANGELOG.md) · [الأمان](../../SECURITY.md) · [MIT](../../LICENSE)

<div align="center">

إن وفّرت عليك قاعدة هنا بعض التحديق، فنجمة ⭐ تساعد مطورين آخرين على إيجاد المشروع.

</div>

</div>
