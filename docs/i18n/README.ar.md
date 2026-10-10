<div dir="rtl" lang="ar">

<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: قواعد واضحة وتعبيرات منتظمة مفهومة](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**اكتب القواعد. افهم النتيجة. اختبرها.**

حوّل تعليمات إنجليزية واضحة إلى تعبير منتظم في JavaScript يمكنك تتبّع كل جزء منه.

[🚀 ورشة التجربة](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 الموقع](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 دليل الصياغة](../LANGUAGE.md) · [📦 النسخة التجريبية على npm](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.4)

🔒 تنفيذ محلي · 🧩 دون اعتماديات وقت التشغيل · ⚡ مترجم واحد، ثلاث واجهات

<div dir="ltr" align="center">

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · **العربية** · [اردو](README.ur.md)

</div>

</div>

## 🪄 قواعد أسهل من فكّ رموز العلامات

يصبح التعبير المنتظم أوضح عندما ترى القواعد التي أنتجته.

| قواعدك | النتيجة في JavaScript |
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

المفردات **محددة مسبقًا**: لكل تعليمة معنى دقيق. تستخدم المكتبة وأداة سطر الأوامر والورشة المترجم الحتمي نفسه. تؤدي التعليمة غير المعروفة إلى رسالة توضّح السطر والعمود وتقترح طريقة للإصلاح. تبقى صياغة القواعد بالإنجليزية في جميع الترجمات.

> 🌱 تتطلب النسخة التجريبية <code dir="ltr">0.1.0-dev.4</code> إصدار **Node.js 22 أو أحدث** للمكتبة وسطر الأوامر. تعمل الورشة المنشورة دون تثبيت. لم تُنجز بعد المراجعات البشرية لقابلية الاستخدام وقارئ الشاشة.

## 🧰 ما الذي يمكنك إنشاؤه اليوم؟

| الإمكانية | النسخة المنشورة <code dir="ltr">0.1.0-dev.4</code> | المصدر الحالي |
| ---: | ---: | ---: |
| قواعد مقروءة → تعبير منتظم في JavaScript | ✅ | ✅ |
| تعبير مدعوم → قواعد قابلة للتعديل | ✅ | ✅ المجموعات والمراجع المدعومة |
| شرح الأجزاء والانتقال إلى القواعد | ✅ | ✅ يشمل حدود المجموعات والمراجع |
| سطر الأوامر وواجهة ESM وتعريفات TypeScript | ✅ | ✅ |
| مجموعات التقاط مسماة ومرقمة ومتداخلة | ✅ | ✅ |
| تكرار الكتل والرجوع إلى التقاط سابق | ✅ | ✅ |
| بدائل مرتبة باستخدام <code dir="ltr">either { … }</code> | ✅ | ✅ خيارات متداخلة وترجمة عكسية |
| التكرار الكسول باستخدام <code dir="ltr">lazy</code> | — | ✅ في المصدر فقط؛ لم يُنشر بعد |
| عمليات النظر أمامًا وخلفًا | — | ✅ في المصدر فقط؛ تداخل والتقاطات أصلية |
| حدود الكلمات | — | ✅ في المصدر فقط؛ شروط أصلية دون استهلاك النص |
| [خصائص Unicode](../LANGUAGE.md#unicode-properties) | — | ✅ أسماء وخصائص متمّمة أصلية بوضع u؛ في المصدر فقط |
| [فئات المحارف المركبة](../LANGUAGE.md#composable-character-classes) | — | ✅ نطاقات واختصارات واتحادات Unicode أصلية؛ في المصدر فقط |
| محركات أخرى والإنجليزية الحرة | — | خارج اللغة الحالية |

في المصدر الحالي، تنتج <code dir="ltr">lazy digits</code> التعبير <code dir="ltr">\d+?</code>: تُجرّب رقمًا واحدًا أولًا، ثم تزيد التكرار إذا احتاجت القواعد التالية إلى المزيد. لم يُضف هذا بعد إلى حزمة npm <code dir="ltr">0.1.0-dev.4</code>. راجع [قواعد التكرار](../LANGUAGE.md#repetition).

يدعم المصدر أيضًا الصيغ التالية:

<div dir="ltr" align="left">

- <code dir="ltr">followed by { … }</code>
- <code dir="ltr">not followed by { … }</code>
- <code dir="ltr">preceded by { … }</code>
- <code dir="ltr">not preceded by { … }</code>

</div>

تختبر هذه الشروط النص المحيط دون استهلاكه. تحتفظ الالتقاطات بالقيم والمواضع الأصلية للمحرك، حتى إن كانت خارج النص المطابق؛ ويتطلب النظر خلفًا دعم المحرك. لم تُضف هذه الميزة إلى npm <code dir="ltr">0.1.0-dev.4</code> بعد. راجع [شروط النظر أمامًا وخلفًا](../LANGUAGE.md#lookaround-assertions).

يدعم المصدر أيضًا شروط حدود الكلمات:

<div dir="ltr" align="left">

- <code dir="ltr">word boundary</code> → <code dir="ltr">\b</code>
- <code dir="ltr">not word boundary</code> → <code dir="ltr">\B</code>

</div>

لا تستهلك هذه الشروط أي حرف. يعدّ JavaScript حروف ASCII والأرقام والشرطة السفلية أحرف كلمات، ويضيف مكافئات طيّ حالة الأحرف مع <code dir="ltr">i</code>. ليست هذه تجزئة لغوية للكلمات. لم تُضف الميزة إلى npm <code dir="ltr">0.1.0-dev.4</code> بعد. راجع [حدود الكلمات](../LANGUAGE.md#word-boundaries).

يدعم المصدر أيضًا هذين الأمرين:

- <code dir="ltr">unicode property "L"</code>
- <code dir="ltr">not unicode property "L"</code>

ينتج الأول <code dir="ltr">\p{L}</code> والثاني <code dir="ltr">\P{L}</code>. يعني الاسم <code dir="ltr">L</code> فئة الحروف. الأسماء حساسة لحالة الأحرف، ويعتمد التصنيف على بيانات Unicode للمحرك. تعمل أعداد التكرار والمعدّل <code dir="ltr">lazy</code> كالمعتاد. مع <code dir="ltr">i</code>، قد يشمل المتمّم الأصلي بوضع <code dir="ltr">u</code> حروفًا متكافئة في حالة الأحرف. لم تُضف هذه الميزة إلى npm <code dir="ltr">0.1.0-dev.4</code> بعد. راجع [خصائص Unicode](../LANGUAGE.md#unicode-properties).

يدعم المصدر هذه الصيغ أيضًا:

<p dir="ltr" align="left"><code dir="ltr">range "α" to "ω"</code></p>
<p dir="ltr" align="left"><code dir="ltr">character class: digit, "_"</code></p>
<p dir="ltr" align="left"><code dir="ltr">not character class: digit</code></p>

تجمع الفئة محارف مفردة من نقطة Unicode واحدة ونطاقات واختصارات مفردة وخصائص Unicode. تنفي الصيغة الثالثة الاتحاد كله. تنطبق أعداد التكرار والمعدّل <code dir="ltr">lazy</code> على الفئة، مع الحفاظ على سلوك متمّمات الخصائص الأصلي مع <code dir="ltr">u</code>/<code dir="ltr">i</code>. هذه الإضافة غير منشورة في npm <code dir="ltr">0.1.0-dev.4</code>؛ راجع [فئات المحارف](../LANGUAGE.md#composable-character-classes).

تتضمن حزمة npm <code dir="ltr">0.1.0-dev.4</code> المجموعات والالتقاطات والمراجع السابقة والبدائل المرتبة في المكتبة وسطر الأوامر. تضيف الورشة فحص الالتقاطات ومطابقات البحث المتعددة. راجع [التوافق](../COMPATIBILITY.md) و[سجل النشر](../DISTRIBUTION.md).

## 📦 تثبيت النسخة التجريبية

<div dir="ltr" align="left">

```sh
npm install regex-for-humans@preview
```

</div>

استخدم أداة سطر الأوامر دون تثبيت عام:

<div dir="ltr" align="left">

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

</div>

النتيجة: <code dir="ltr">/^ABC\d{3}$/u</code>. لتثبيت إصدار بعينه، استخدم <code dir="ltr">regex-for-humans@0.1.0-dev.4</code>. لا توجد اعتماديات وقت التشغيل أو ملفات تنفيذية مستقلة لكل نظام.

## 🎮 تجربة نمط

1. اختر وصفة أو اكتب تعليمة واحدة في كل سطر.
2. تتبّع الأجزاء الناتجة واقرأ شرحها.
3. أضف أمثلة وحدّد ما ينبغي أن يطابق النمط.
4. انسخ التعبير عندما يصبح سلوكه مناسبًا.

تعرض المطابقة الجزئية سياقًا قصيرًا مع إبراز النص المطابق؛ وتحصل المطابقة الفارغة على علامة موضع. تبقى القواعد والأمثلة في المتصفح، دون حساب أو تفسير بالذكاء الاصطناعي أو خادم تطبيقي.

في الورشة الحالية، افتح المطابقة لرؤية قيم مجموعات الالتقاط ومواضعها. يميّز العرض بين **لم تُلتقط** و**سلسلة فارغة**؛ وتظهر القيمة الأخيرة للمجموعة المتكررة. يسرد وضع **Search anywhere** حتى 100 مطابقة غير متداخلة، ويتقدم عبر المطابقات الفارغة بنقطة Unicode كاملة. المواضع محسوبة بوحدات UTF-16، والنهاية غير مشمولة. إن لم يدعم المحرك مواضع الالتقاط، تظهر القيم دون تخمين مواضعها.

[![لقطة حقيقية لورشة العمل على الحاسوب](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=e1a2f3784e8c)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

[عرض الهاتف والبصمات الرقمية](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md).

## 🔄 هل لديك تعبير منتظم بالفعل؟

الصق تعبير JavaScript مدعومًا في **Already have a regex?**، ثم اختر **Translate to rules** أو اضغط Ctrl/Cmd + Enter. يصبح <code dir="ltr">/^[A-Z]{2}-\d{4}$/u</code>:

<div dir="ltr" align="left">

```text
start
2 uppercase letter
"-"
4 digit
end
```

</div>

يجب أن يُحاط التعبير بعلامتي <code dir="ltr">/</code> وأن يتضمن <code dir="ltr">u</code>. اكتب فواصل الأسطر بصيغة مهروبة مثل <code dir="ltr">\n</code>. تحافظ الترجمة على سلوك الرايات المدعومة <code dir="ltr">i</code> و<code dir="ltr">s</code> و<code dir="ltr">m</code> و<code dir="ltr">u</code>. يستورد المصدر الحالي أيضًا مجموعات الالتقاط المسماة والمرقمة والمتداخلة والمراجع السابقة، مع الحفاظ على أرقامها وقيمها.

تتحول <code dir="ltr">[^]</code> إلى أي محرف مع <code dir="ltr">s</code>. وتستثني النقاط العادية المجاورة فواصل الأسطر صراحةً للحفاظ على معناها. تقبل فئات الحروف ومحارف الكلمات والأرقام الست عشرية المكتملة ترتيبات متكافئة؛ وتُحفظ استثناءات المسارات ومحارف التحكم المهروبة. تبقى الشرطة في طرف القائمة حرفًا عاديًا.

تُرفض الصيغ غير المدعومة دون حذفها أو تقريب معناها. ينتقل **Go to regex error** إلى موضع المشكلة؛ ولا يغيّر فشل الترجمة القواعد أو الخيارات. تُرفض المراجع إلى التقاط لاحق أو ما زال مفتوحًا. تصبح المجموعة الفارغة غير الملتقطة <code dir="ltr">0 any character</code>: تجد مطابقة فارغة في البحث، لكنها تتطلب إدخالًا فارغًا في وضع السلسلة الكاملة.

## 🍱 وصفات للبدء

| الوصفة | مثال | ما تتحقق منه |
| ---: | ---: | ---: |
| [معرّف ذو بادئة](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | <code dir="ltr">ABC123</code> | بادئة وثلاثة أرقام |
| [رقم فاتورة](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | <code dir="ltr">INV-1234</code> | البادئة <code dir="ltr">INV-</code> و2–6 أرقام |
| [اسم مستخدم](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | <code dir="ltr">Alice_7</code> | 3–16 محرفًا؛ يبدأ بحرف ASCII |
| [لون ست عشري](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | <code dir="ltr">#12aBcF</code> | ستة أرقام ست عشرية بعد <code dir="ltr">#</code> |
| [عنوان MAC](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=mac-address-shape) | <code dir="ltr">00:1A:2B:3C:4D:5E</code> | ستة أزواج مفصولة بـ <code dir="ltr">:</code> |
| [معرّف UUID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=uuid-shape) | <code dir="ltr">8–4–4–4–12</code> | خمس مجموعات ست عشرية |
| [رمز منتج](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=product-code-shape) | <code dir="ltr">AB-rgb-0420</code> | أعداد ثابتة من الحروف والأرقام |
| [شكل تاريخ](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | <code dir="ltr">2026-09-30</code> | الصيغة <code dir="ltr">YYYY-MM-DD</code> |
| [شكل وقت](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | <code dir="ltr">09:30</code> | الصيغة <code dir="ltr">HH:MM</code> |
| [شكل هاتف](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | <code dir="ltr">+33123456789</code> | علامة <code dir="ltr">+</code> اختيارية و7–15 رقمًا |
| [شكل IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | <code dir="ltr">192.0.2.42</code> | أربع مجموعات من 1–3 أرقام |
| [اسم ملف](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | <code dir="ltr">report.txt</code> | اسم Unicode محدود الطول دون فواصل مسار |
| [بيان ملفات البناء](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | مسار وبصمة وحجم | 19 قاعدة وتسعة أمثلة |
| [سجل الوصول](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | طلب وحالة وحجم | 43 قاعدة وثمانية أمثلة |
| [حدث قياس منظم](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | معرّفات وقيم اختيارية | 38 قاعدة وتسعة أمثلة |
| [شكل إصدار](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | <code dir="ltr">1.2.3</code> | ثلاثة أجزاء رقمية |
| [محارف مستثناة](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | <code dir="ltr">xyz</code> | نص دون المحارف المختارة |
| [قاعدة سطر](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | <code dir="ltr">item 123</code> | سطر ينتهي بثلاثة أرقام على الأقل |

تتحقق الوصفات من **الشكل**. قد يطابق تاريخ مستحيل أو وقت مثل <code dir="ltr">25:99</code>؛ تحقّق من التقويم والمدى العددي في التطبيق. لا تحد IPv4 كل جزء إلى 255. لا يضمن UUID الإصدار أو المتغير أو التفرد. لا تتحقق وصفات الهاتف والفاتورة من أي سجل، ولا يتحقق اسم المستخدم من التوافر. وصفة الإصدار ليست مدقق SemVer كاملًا. يتطلب اللون <code dir="ltr">#RRGGBB</code>؛ وتظل قواعد نظام الملفات منفصلة.

## 🏗️ أنماط أكبر تظل مقروءة

يشرح [دليل الأمثلة المعقدة](../COMPLEX-EXAMPLES.md) أربعة تنسيقات و35 حالة قبول ورفض، مع تفسير كل قاعدة: سجل وصول، وحدث قياس، وبيان ملفات، وطلب متعدد الأسطر.

### 📦 بيان ملفات البناء

مجلد <code dir="ltr">nightly/</code> اختياري، ومسار Unicode محدود، وإصدار واسم أرشيف وبصمة وحجم، مفصولة بمحارف الجدولة:

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

يتحقق المثال من شكل المسار والبصمة، وليس من وجود الملف أو سلامة محتواه. تظهر حدود Unicode ومحارف الجدولة بوضوح.

### 🧾 طلب متعدد الأسطر

معرّف، ومشترٍ باسم Unicode، وهاتف، وكمية، ومبلغ، ومرجع، وموافقة اختيارية، وسطر أولوية اختياري كامل:

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

فواصل الأسطر محارف حرفية. يظل التحقق من المبالغ والأرقام والطلبات مسؤولية التطبيق. لا تستخرج الأمثلة الأربعة البسيطة في الدليل حقولًا.

## 🧲 استخراج حقول بالتقاطات مسماة

يعمل هذا المثال مع حزمة npm <code dir="ltr">0.1.0-dev.4</code> وفي الورشة المنشورة.

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

تنشئ <code dir="ltr">capture {</code> مجموعة مرقمة؛ وتجمع <code dir="ltr">group {</code> القواعد دون استخراج. الأسماء معرّفات JavaScript فريدة، ويُحدد الترقيم بحسب ترتيب فتح المجموعات، بما فيها المتداخلة. قيمة التقاط اختياري غائب هي <code dir="ltr">undefined</code>، وقيمة التقاط فارغ شارك في المطابقة هي <code dir="ltr">""</code>، ويحتفظ الالتقاط المتكرر بآخر قيمة.

بعد إغلاق المجموعة، تفرض <code dir="ltr">same as capture "word"</code> أو <code dir="ltr">same as capture 1</code> تكرار النص نفسه. يقبل [المثال](../LANGUAGE.md#capture-references) <code dir="ltr">cat cat</code> ويرفض <code dir="ltr">cat dog</code>. تؤدي المراجع المستقبلية أو الداخلية للمجموعة المستهدفة إلى خطأ واضح. تحافظ الترجمة العكسية على الأسماء والأرقام والقيم المدعومة. ويظل التحقق من التاريخ المستخرج بالتقويم مطلوبًا.

## 🧩 مرجع سريع

تعليمة واحدة لكل سطر؛ ويُكتب النص الحرفي بين علامتي اقتباس.

| القاعدة | النتيجة | المعنى |
| ---: | ---: | ---: |
| <code dir="ltr">start</code> / <code dir="ltr">end</code> | <code dir="ltr">^</code> / <code dir="ltr">$</code> | حدود الإدخال |
| <code dir="ltr">line start</code> / <code dir="ltr">line end</code> | <code dir="ltr">^</code> / <code dir="ltr">$</code> مع <code dir="ltr">m</code> | حدود الأسطر |
| <code dir="ltr">digit</code> / <code dir="ltr">not digit</code> | <code dir="ltr">\d</code> / <code dir="ltr">\D</code> | رقم ASCII أو ما ليس كذلك |
| <code dir="ltr">3 digits</code> / <code dir="ltr">digits</code> | <code dir="ltr">\d{3}</code> / <code dir="ltr">\d+</code> | ثلاثة أرقام أو رقم واحد على الأقل |
| <code dir="ltr">between 2 and 4 digits</code> | <code dir="ltr">\d{2,4}</code> | حدود شاملة |
| <code dir="ltr">optional "-"</code> | <code dir="ltr">-{0,1}</code> | شرطة اختيارية |
| <code dir="ltr">letter</code> / <code dir="ltr">letters</code> | <code dir="ltr">[A-Za-z]</code> / <code dir="ltr">[A-Za-z]+</code> | حروف ASCII |
| <code dir="ltr">lowercase letters</code> / <code dir="ltr">uppercase letters</code> | <code dir="ltr">[a-z]+</code> / <code dir="ltr">[A-Z]+</code> | حالة ASCII؛ تتجاهل <code dir="ltr">i</code> الفرق |
| <code dir="ltr">6 hex digits</code> | <code dir="ltr">[0-9A-Fa-f]{6}</code> | ستة أرقام ست عشرية |
| <code dir="ltr">space</code> / <code dir="ltr">spaces</code> | <code dir="ltr">\s</code> / <code dir="ltr">\s+</code> | فراغات، تشمل فواصل الأسطر |
| <code dir="ltr">between 1 and 32 path segment characters</code> | 1–32 نقطة Unicode | يستثني الفواصل وNUL وفواصل الأسطر |
| <code dir="ltr">"hello"</code> | <code dir="ltr">hello</code> | نص حرفي مهروب |
| <code dir="ltr">one of: a, b</code> | <code dir="ltr">[ab]</code> | محرف واحد من القائمة |
| <code dir="ltr">text without: a, b</code> | <code dir="ltr">[^ab]*</code> | صفر أو أكثر من المحارف غير المدرجة |
| <code dir="ltr">any text</code> | <code dir="ltr">.*</code> | تشمل <code dir="ltr">s</code> فواصل الأسطر |

تتبع <code dir="ltr">word character</code> و<code dir="ltr">word characters</code> و<code dir="ltr">word</code> و<code dir="ltr">not word</code> دلالات <code dir="ltr">\w</code> و<code dir="ltr">\W</code>. تشمل <code dir="ltr">\w</code> الشرطة السفلية <code dir="ltr">_</code>، لكنها لا تشمل <code dir="ltr">é</code>. تستثني <code dir="ltr">letter</code> الأرقام والشرطة السفلية. قد تشمل مقارنات JavaScript الأصلية مع <code dir="ltr">i</code> المحرفين <code dir="ltr">K</code> و<code dir="ltr">ſ</code>. يكون <code dir="ltr">u</code> الافتراضي وتقبل الشفرة المصدرية أيضًا <code dir="ltr">v</code>؛ ولا يحوّل أيّ منهما فئات ASCII إلى فئات Unicode شاملة.

## 💻 الاستخدام في الطرفية

<div dir="ltr" align="left">

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

</div>

أو من نسخة مستنسخة من المستودع:

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

| الخيار | الوظيفة |
| ---: | ---: |
| <code dir="ltr">--explain</code> | الأجزاء وشروحها |
| <code dir="ltr">--json</code> | نتائج منظمة على stdout وأخطاء على stderr |
| <code dir="ltr">--ignore-case</code> | يفعّل <code dir="ltr">i</code> |
| <code dir="ltr">--dot-all</code> | يفعّل <code dir="ltr">s</code> |
| <code dir="ltr">--help</code> | المساعدة |
| <code dir="ltr">--version</code> | إصدار الحزمة |

اقرأ ملف UTF-8 أو الإدخال القياسي. استخدم <code dir="ltr">--</code> قبل اسم ملف يبدأ بـ <code dir="ltr">-</code>. رموز الخروج: <code dir="ltr">0</code> للنجاح والمساعدة والإصدار؛ <code dir="ltr">1</code> لقواعد غير صالحة أو خطأ إدخال/إخراج؛ <code dir="ltr">2</code> لوسائط غير صالحة.

يُرفض UTF-8 غير السليم دون استبدال صامت. تحتفظ أخطاء JSON برموزها؛ ويظهر <code dir="ltr">CLI_USAGE</code> لأخطاء الاستخدام و<code dir="ltr">CLI_ERROR</code> لأخطاء الملف أو التنفيذ. تظهر محارف التحكم بصيغة مهروبة، ويعيد JSON بعد فكّه البيانات الأصلية. يؤدي فشل stderr إلى خروج برمز غير صفري.

تتطلب الترجمة العكسية راية <code dir="ltr">u</code> في التعبير، وتُرفض رايات سطر الأوامر الخاصة بالترجمة الأمامية بدل تجاهلها:

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

تدعم <code dir="ltr">--reverse --json</code> البيانات المنظمة أيضًا. يحصل الإدخال الفارغ أو غير المدعوم على تشخيص يوضح الموضع، ولا ينتج ترجمة جزئية.

## 🧪 الاستخدام في JavaScript وTypeScript

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

تقبل <code dir="ltr">toRegExp({ source, flags })</code> البيانات المخزنة؛ ويجب أن يكون الحقلان سلسلتين نصيتين، ولا تُقرأ الأجزاء. تستخدم <code dir="ltr">compile("digit", { flags: undefined })</code> الراية <code dir="ltr">u</code>، بما في ذلك مع <code dir="ltr">exactOptionalPropertyTypes</code>.

تقبل <code dir="ltr">regexToRules()</code> تعبيرات أصلية من سياقات JavaScript أخرى، وتحافظ على <code dir="ltr">lastIndex</code>، وتقرأ البيانات الأصلية دون استدعاء طرق المطابقة أو الطرق المعاد تعريفها في النسخة. تُدعم صيغ مثل <code dir="ltr">\u{00000041}</code> ضمن حد طول المصدر.

## 🎛️ رايات ذات سلوك واضح

| الراية | طريقة التفعيل | التأثير |
| ---: | ---: | ---: |
| <code dir="ltr">u</code> | افتراضيًا | المطابقة بنقاط Unicode |
| <code dir="ltr">i</code> | <code dir="ltr">{ flags: 'i' }</code> أو <code dir="ltr">--ignore-case</code> | مقارنة دون تمييز حالة الأحرف وفق JavaScript |
| <code dir="ltr">s</code> | <code dir="ltr">{ flags: 's' }</code> أو <code dir="ltr">--dot-all</code> | يسمح للنقطة بمطابقة فواصل الأسطر |
| <code dir="ltr">m</code> | <code dir="ltr">line start</code> / <code dir="ltr">line end</code> | مراسي لكل سطر |
| <code dir="ltr">d</code> | <code dir="ltr">{ flags: 'd' }</code> | مواقع المطابقات والالتقاطات الأصلية |
| <code dir="ltr">g</code> | <code dir="ltr">{ flags: 'g' }</code> | تحرّك الاستدعاءات المتكررة <code dir="ltr">lastIndex</code> |
| <code dir="ltr">y</code> | <code dir="ltr">{ flags: 'y' }</code> | مطابقة عند <code dir="ltr">lastIndex</code> والتوقف عند أول فجوة |
| <code dir="ltr">v</code> | <code dir="ltr">{ flags: 'v' }</code> | فئات Unicode ومتمماتها الأصلية في نمط v |

**في الشفرة المصدرية فقط:** تُقبل الرايات الثماني <code dir="ltr">d</code> و<code dir="ltr">g</code> و<code dir="ltr">i</code> و<code dir="ltr">m</code> و<code dir="ltr">s</code> و<code dir="ltr">u</code> و<code dir="ltr">v</code> و<code dir="ltr">y</code>. ترتيب الناتج <code dir="ltr">dgimsuvy</code>؛ تُرفض التكرارات والجمع بين u/v، ويبقى u الافتراضي. يمكن تفعيل m مباشرة أو بمراسي الأسطر؛ وتبقى مراسي الإدخال مطلقة حتى عند خلط النمطين. يحافظ التحويل العكسي على الخيارات دون تعديل <code dir="ltr">lastIndex</code>. يبدأ كل مثال في الورشة عند 0 وتُعرض حتى 100 مطابقة؛ وتحتفظ تعبيرات g/y المنسوخة بحالتها. تُبلَّغ القدرات الأصلية المفقودة ومجموعات v المتداخلة بوضوح. يحتفظ npm <code dir="ltr">0.1.0-dev.4</code> بخيارات i/s السابقة وu التلقائي وm عبر مراسي الأسطر.

<p dir="rtl"><strong>في الشفرة المصدرية فقط:</strong> اختر <code dir="ltr">v</code> لاستخدام مجموعات السلاسل وخصائص Unicode للسلاسل. يجرّب المحرك الأعضاء الأطول أولًا، بغض النظر عن ترتيب القائمة؛ وقد تتطلب القواعد التالية الرجوع إلى عضو أقصر. السلاسل الفارغة مسموحة. استخدم الصيغة الثالثة داخل فئة محارف. لا يمكن أخذ متمّم لخاصية سلاسل أو لفئة تحتوي سلسلة فارغة أو عضوًا متعدد نقاط Unicode. هذه الإضافات غير موجودة في npm <code dir="ltr">0.1.0-dev.4</code>.</p>

<p dir="ltr" align="left"><code dir="ltr">one of strings: "a", "ab", ""</code></p>
<p dir="ltr" align="left"><code dir="ltr">unicode property "RGI_Emoji"</code></p>
<p dir="ltr" align="left"><code dir="ltr">string "ab"</code></p>

<p dir="ltr" align="left"><code dir="ltr">{ flags: 'dgiv' }</code></p>

<p dir="ltr" align="left"><code dir="ltr">--flags dgiv</code></p>

## 🛠️ التطوير محليًا

<div dir="ltr" align="left">

```sh
npm ci
npm run build
npm run serve
```

</div>

افتح <a dir="ltr" href="http://127.0.0.1:4174/"><strong>http://127.0.0.1:4174/</strong></a>. يختار <code dir="ltr">npm run serve -- 0</code> منفذًا متاحًا ويطبع العنوان. تُضاف الشرطة المائلة النهائية لعناوين المجلدات مع الحفاظ على معاملات الاستعلام.

لتشغيل جميع الفحوص مع Chrome مثبتًا:

<div dir="ltr" align="left">

```sh
npm ci
npm exec -- playwright install firefox webkit
npm run verify
```

</div>

دون Chrome، استخدم Chromium الذي توفره Playwright:

<div dir="ltr" align="left">

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

</div>

تشمل الفحوص التنسيق والتحليل الساكن والأنواع والروابط واختبارات Node وبناء Pages وتثبيت الحزمة في مشروع نظيف وفحوص المتصفحات والتدقيق. تختار <code dir="ltr">CI=1</code> المتصفح المحلي، ولا تفعّل GitHub Actions الذي يظل معطّلًا.

## 🧭 فهم الحدود

تتحول البدائل إلى كتل قابلة للتعديل من نوع <code dir="ltr">either { … }</code>؛ كل عنصر مباشر يمثل خيارًا يُجرَّب بالترتيب. استخدم <code dir="ltr">group { … }</code> لخيار يتألف من عدة قواعد أو لخيار فارغ.

المحرك المستهدف هو **JavaScript <code dir="ltr">RegExp</code>**. لا تقبل لغة القواعد تعبيرًا خامًا أو إنجليزية حرة. تتعامل الترجمة العكسية مع المجموعة الفرعية الموثقة فقط. لا تدعم اللغة الإنجليزية الحرة أو فئات المحارف الفارغة أو عمليات مجموعات v أو المراجع إلى مجموعات لم تُعرّف بعد أو ما زالت مفتوحة. تستخدم الورشة عامل تنفيذ بمهلة؛ أما التعبير المنسوخ فيحتاج إلى حماية تنفيذ في تطبيقه. راجع [نموذج الأمان](../SECURITY_MODEL.md).

## 💬 أسئلة شائعة

**هل يستخدم الذكاء الاصطناعي؟** لا؛ يوجد محلل حتمي وشجرة AST ومترجم وشروح منظمة.

**هل يمكن تحويل كل تعبير منتظم؟** لا. تؤدي الصيغة غير المدعومة إلى خطأ، دون حذف التقاط أو شرط لإجبار التحويل.

**هل يثبت نجاح مثال أن التعبير آمن؟** لا. يتحقق من سلوك محدد، وليس من كل المسارات أو تكلفة التنفيذ.

**هل تشمل الفئات كل Unicode؟** لا. تمثل <code dir="ltr">digit</code> أرقام ASCII، وتمثل <code dir="ltr">letter</code> الفئة <code dir="ltr">[A-Za-z]</code>، وتتبع <code dir="ltr">word</code> دلالة <code dir="ltr">\w</code>.

**ما الحدود؟** 16,384 وحدة UTF-16، و200 سطر، وتكرارات محدودة إلى 1,000، وعمق 64. حتى 100 مثال بطول 2,048 وحدة لكل مثال، ومهلة عامل 1,200 مللي ثانية. يستخدم الرمز التعبيري غالبًا وحدتين من UTF-16.

**هل يعمل دون اتصال؟** تعمل المكتبة وأداة سطر الأوامر محليًا. يمكن بناء الورشة وتقديمها محليًا بعد تثبيت الاعتماديات؛ ولا يُعلن عن PWA أو تخزين مؤقت للعمل دون اتصال.

**كيف أبلّغ عن مشكلة؟** عبر [مشكلات GitHub](https://github.com/OthmaneBlial/Regex-For-Humans/issues)، مع القواعد والرايات والإدخال والنتيجة المتوقعة وإصدار المحرك. للمشكلات الأمنية، اتبع [SECURITY.md](../../SECURITY.md) بشكل خاص.

## 🗺️ استكشاف المشروع

| الدليل | المحتوى |
| ---: | ---: |
| [اللغة](../LANGUAGE.md) | القواعد والمجموعات والمراجع والتشخيصات |
| [الأمثلة المعقدة](../COMPLEX-EXAMPLES.md) | أربعة تنسيقات مع شرح القواعد |
| [البنية](../ARCHITECTURE.md) | محلل → AST → مترجم → واجهات |
| [التوافق](../COMPATIBILITY.md) | الصيغ والمحركات التي تم التحقق منها |
| [الاختبارات](../TESTING.md) | أوامر قابلة للتكرار وأدلة التحقق |
| [الأمان](../SECURITY_MODEL.md) | حدود الثقة وقيود التنفيذ |
| [التوزيع](../DISTRIBUTION.md) | npm والإصدارات والموقع المنشور |
| [خارطة الطريق](../AUTONOMOUS_ROADMAP.md) | مراحل منجزة والخطوات التالية |
| [المقارنة](../COMPETITOR_GAPS.md) | المصادر والإمكانات الناقصة |
| [المساهمة](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) | الإعداد واتفاقيات المشروع |

**تم التحقق محليًا في 10 أكتوبر 2026:** نجحت 251 تجربة Node، و296 فحصًا لورشة Chromium على الحاسوب والهاتف، و66 فحص Firefox/WebKit، و64 فحصًا للموقع، وتثبيت الحزمة؛ دون ثغرات معلنة في التدقيق. نجح أيضًا 16 اختبارًا للمجموعات والمراجع والترجمة العكسية على Node 22.23.3. تصف الأعداد هذه اللقطة فقط، وليست ضمانًا لكل المتصفحات أو الإصدارات المقبلة. تبقى المراجعات البشرية مفتوحة.

رخصة [MIT](../../LICENSE) · [سجل التغييرات](../../CHANGELOG.md) · [العودة إلى الإنجليزية](../../README.md).

</div>
