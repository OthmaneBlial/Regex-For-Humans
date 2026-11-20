<div align="center">

[![Regex For Humans：正则 ^#[0-9A-Fa-f]{6}$，每个片段下方写着它的简明英语含义](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**用简明英语写正则。用同样的方式读懂任何正则。**

简短的英语规则会编译成原生 JavaScript `RegExp`，每条规则对应一个可见片段。粘贴一个正则，也能拿回规则。

**[试用工作台](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [网站](https://othmaneblial.github.io/Regex-For-Humans/) · [npm 预览版](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.13) · [语法](../LANGUAGE.md)**

[English](../../README.md) · **简体中文** · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## 写规则，得正则

<table>
<tr><th>规则</th><th>JavaScript 正则</th></tr>
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

每一行都有文档化的含义，并按顺序向正则添加一个片段。输出就是你会手写的正则：用 `?` 而不是 `{0,1}`，没有多余的分组。遇到未知短语会停下，并给出行号、列号和修改建议。

[![六个配方轮流展示：规则、编译出的正则、每个片段的含义，以及它在示例中匹配到的内容](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-reel.svg)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

## 把正则读回规则

接手了一个没人看得懂的模式？`regexToRules` 会把受支持的正则转换成可编辑的规则，这些规则会重新编译成同一个正则。

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

[网站](https://othmaneblial.github.io/Regex-For-Humans/) 会就地注解你粘贴的任何正则。不受支持的语法会连同位置一起被拒绝，绝不会被悄悄丢掉。

## 为捕获的部分命名

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

捕获就是原生 JavaScript 分组。写 `same as capture "year"` 可以要求再次出现相同的文本。

## 安装

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

需要 Node.js 22+，没有运行时依赖，ESM 并附带 TypeScript 声明。库、[命令行](../CLI.md)和工作台共用同一个编译器。这是预览版（`0.1.0-dev.13`）；[工作台](https://othmaneblial.github.io/Regex-For-Humans/workshop/)无需安装。

## 词汇一览

| 这样写 | 得到 |
| --- | --- |
| `start` · `end` | `^` · `$` |
| `3 digits` · `digits` | `\d{3}` · `\d+` |
| `between 2 and 4 letters` | `[A-Za-z]{2,4}` |
| `optional "-"` | `-?` |
| `one of: a, b` | `[ab]` |
| `either { "INFO" "WARN" }` | `(?:INFO\|WARN)` |
| `capture "id" { … }` | `(?<id>…)` |
| `not followed by { "x" }` | `(?!x)` |

像 `either { … }` 这样的块，花括号内每行一条规则。[语言指南](../LANGUAGE.md)涵盖每条规则、标志、Unicode 类、环视断言和限制。

## 34 个现成配方

| 配方 | 检查什么 |
| --- | --- |
| [校验日历日期](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=calendar-date) | 月份 01–12、日期 01–31，分别捕获为年、月、日 |
| [校验 IPv4 地址](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-address) | 四个 0 到 255 的数字，不含前导零 |
| [校验 24 小时制时间](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=clock-time) | `00:00` 到 `23:59` |
| [校验 SemVer 2.0 语法](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | 核心版本、预发布和构建部分 |
| [从日志片段提取命名字段](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | 按名称提取级别和代码 |
| [匹配重复的单词](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | 一个单词，后面跟着同一个单词 |

每个配方都带有必须匹配和必须不匹配的示例，以及一条说明它不检查什么的备注。查看[全部 34 个配方](../RECIPES.md)，以及包含 **35 个接受或拒绝用例**的四个[复杂示例](../COMPLEX-EXAMPLES.md)。

## 为什么可以信任输出

- **确定性。** 是解析器，不是模型：同样的规则总是得到同样的正则。没有 AI，没有网络，没有遥测。
- **原生。** 输出是普通的 `RegExp`；匹配时只运行引擎本身。导出到 Python、Rust、Go、Java、C#、PHP 和 Ruby 的[结果](../LANGUAGE.md#engine-exports)会与这些引擎实际比对。
- **坦诚说明限制。** 配方会写明它不检查什么。工作台在有时间限制的 worker 中运行你的示例；复制出去的正则需要自己的防护措施（[安全模型](../SECURITY_MODEL.md)）。
- **有测试。** 每个配方和本 README 中的每个示例都会被测试套件重新编译（[测试](../TESTING.md)）。

[架构](../ARCHITECTURE.md) · [兼容性](../COMPATIBILITY.md) · [参与贡献](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [更新日志](../../CHANGELOG.md) · [安全](../../SECURITY.md) · [MIT](../../LICENSE)

<div align="center">

如果这里的规则让你少眯了几次眼，点个 ⭐ 能帮助更多开发者发现它。

</div>
