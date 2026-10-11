<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans：清晰规则，真实正则](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**写出来，看明白，测一测。**

把清晰的英文规则编译成 JavaScript 正则表达式，并逐段理解结果。

[🚀 在线工作台](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 项目网站](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 语法](../LANGUAGE.md) · [📦 npm 预览版](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.6)

🔒 本地运行 · 🧩 无运行时依赖 · ⚡ 一个编译器，三种使用方式

[English](../../README.md) · **简体中文** · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## 🪄 少猜符号，多懂匹配

看到生成正则的规则，表达式就更容易读懂。

```text
start "#"
6 hex digits
end
```

```js
/^#[0-9A-Fa-f]{6}$/u
```

✅ `#12aBcF`、`#000000` · ❌ `#123`、`#G00000`

这是**固定词汇**的规则语言，每条指令都有精确定义。库、CLI 和工作台使用同一个确定性编译器。不认识的指令会返回行、列和修复提示。所有译本中的规则语法仍然使用英文，不会翻译关键字。

> 🌱 预览版 `0.1.0-dev.6` 的库和 CLI 需要 **Node.js 22+**。在线工作台无需安装。真人可用性评估和屏幕阅读器测试仍未完成。

## 🧰 现在可以做什么

| 能力 | npm `0.1.0-dev.6` / 托管工作台 |
| --- | --- |
| 规则 → JavaScript 正则 | ✅ |
| 支持的正则 → 可编辑规则 | ✅ |
| 片段解释与源码定位 | ✅ |
| CLI、ESM API、TypeScript 类型 | ✅ |
| 命名/编号捕获与嵌套块 | ✅ |
| 整块重复与向后引用 | ✅ |
| 使用 `either { … }` 的有序分支 | ✅ |
| 非贪婪重复（`lazy`） | ✅ |
| 环视 | ✅ |
| 单词边界 | ✅ |
| [Unicode 属性](../LANGUAGE.md#unicode-properties) | ✅ |
| [组合字符类](../LANGUAGE.md#composable-character-classes) | ✅ |
| [Unicode 字符串和嵌套集合](../LANGUAGE.md#nested-unicode-set-operations) | ✅ |
| 全部八个 JavaScript 标志 | ✅ |
| [编辑分组与高亮捕获范围](../LANGUAGE.md#editing-groups) | ✅ |
| [交互式结构图与SVG导出](../LANGUAGE.md#structural-diagrams) | ✅ |
| [结构风险检查](../LANGUAGE.md#structural-risk-review) | ✅ |
| [面向目标引擎的代码导出](../LANGUAGE.md#engine-exports) | ✅ |
| 自由英文 | — |

本地工作坊新增 **Edit groups and references**，可重命名捕获组、切换分组类型并定位引用。编号变化后，数字引用仍指向原来的捕获组；仍被引用的捕获组不能改为非捕获组，拒绝操作时保留原规则。**Highlight** 根据原生索引高亮捕获范围，支持空捕获和消耗的匹配范围之外的捕获。`editGroup` API 返回经过验证的规则。参见[编辑分组](../LANGUAGE.md#editing-groups)。

当前源码中，`lazy digits` 生成 `\d+?`：先尝试一个数字，再根据后续规则增加重复次数。npm `0.1.0-dev.6` 已包含这些功能。参见[重复规则](../LANGUAGE.md#repetition)。

源码还支持 `followed by { … }`、`not followed by { … }`、`preceded by { … }`、`not preceded by { … }`。这些断言检查当前位置周围的文本，但不消耗字符。捕获保留原生值和位置，其范围可能在完整匹配之外；后行断言需要运行时支持。npm `0.1.0-dev.6` 已包含这些功能。参见[环视断言](../LANGUAGE.md#lookaround-assertions)。

源码支持 `word boundary`（`\b`）和 `not word boundary`（`\B`），不消耗字符。JavaScript 的单词字符是 ASCII 字母、数字和下划线；启用 `i` 时也包括大小写折叠等价字符。这不属于自然语言分词。npm `0.1.0-dev.6` 已包含这些功能，参见[单词边界](../LANGUAGE.md#word-boundaries)。

源码还支持 `unicode property "L"` 和 `not unicode property "L"`，分别生成原生 `\p{L}` 和 `\P{L}`。`L` 表示 Letter；别名区分大小写，字符分类取决于运行时的 Unicode 数据。次数限制和 `lazy` 同样适用。在 `u` 模式下启用 `i` 时，原生补集可能包含大小写折叠等价的字母。npm `0.1.0-dev.6` 已包含这些功能，参见 [Unicode 属性](../LANGUAGE.md#unicode-properties)。

源码支持 `range "α" to "ω"` 和 `character class: digit, "_"`。一个字符类可组合单个 Unicode 码点的字面量、范围、单数简写和 Unicode 属性；`not character class:` 对整个并集取反。次数和 `lazy` 应用于整个类，属性补集保留原生 `u`/`i` 行为。npm `0.1.0-dev.6` 已包含这些功能；参见[字符类](../LANGUAGE.md#composable-character-classes)。

npm `0.1.0-dev.6` 包含分组、捕获、后向引用和有序分支，库和 CLI 均可使用。工作台还提供捕获检查和多次搜索匹配。详见[兼容性](../COMPATIBILITY.md)和[发布记录](../DISTRIBUTION.md)。

## 🌍 导出到你的编程语言

在本地工作台打开 **Export to a programming language**，调用 `exportRegex(rules, { target: "python" })`，或运行 `node bin/regex-for-humans.js --target python --json rules.txt`。九种格式包括 JavaScript、TypeScript、Python、Rust、Go、Java、C#、PHP 和 Ruby。JavaScript/TypeScript 保留现有原生模式；其他目标先从 AST 转换支持的正则语义，再生成正确转义的源代码。

生成代码已通过六个原生引擎的对比检查；**PHP 尚未经过原生运行验证**。请保留要求和捕获映射：其他引擎使用 `gN` 名称，未参与的捕获可能不存在。输入必须是格式正确的 Unicode。不支持的标志（`d/g/i/y`）、Unicode 属性，以及不兼容的断言、捕获或重复行为会返回带位置的诊断。可下载代码或完整 JSON；浏览器示例仍由 JavaScript 执行。详见[引擎配置与限制](../LANGUAGE.md#engine-exports)。

## 📦 安装预览版

```sh
npm install regex-for-humans@preview
```

不必全局安装即可运行 CLI：

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

输出 `/^ABC\d{3}$/u`。固定版本可用 `regex-for-humans@0.1.0-dev.6`。没有运行时依赖，也不提供独立的各操作系统可执行文件。

## 🎮 试一个模式

通过 **Interface language** 选择英语、简体中文、西班牙语或法语。界面标签、示例说明、匹配反馈和导航控件会更新，但不会改变规则、测试字符串、选择范围、已展开的面板或生成的代码。存储可用时，语言选择会保留在本机。规则仍使用受控英语；编译器解释、图表标签和导出的技术要求仍使用英语。参见[工作台本地化](../ARCHITECTURE.md#workshop-localization)。

通过 **Theme** 跟随系统外观，或选择浅色、深色工作台。存储可用时，选择会保留在本机；切换外观不会改变规则、测试字符串、选择范围或已展开的面板。参见[主题偏好](../ARCHITECTURE.md#theme-preference)。

**仅限源码版本：** 原生规则编辑器为关键字、字符串、捕获、量词、断言、分支和注释着色，并为编译器指出的词元加下划线。输入、选择、复制和滚动保留原生行为；强制颜色或超出限制的输入使用普通原生文本。以 `#` 开头的整行注释保留源位置，并计入现有长度和行数限制。这些新增功能尚未包含在 npm `0.1.0-dev.6` 或托管工作台中。参见[注释](../LANGUAGE.md#comments)和[编辑器高亮](../ARCHITECTURE.md#editor-highlighting)。

**仅限源码版本：** 构建面板可在当前行或选区之前、外层锚点之内，插入可编辑的捕获、可选部分、分支、重复、字符类和断言模板。添加捕获不会改变已有数字引用的目标。无效或超出限制的插入保留原规则和选区，标志与测试示例也保持不变。此面板尚未包含在托管的 dev.6 工作台中。参见[规则构建](../ARCHITECTURE.md#rule-construction)。

**仅限源码版本：** 精确预期检查完整的 UTF-16 范围、按组号排列的捕获值（`null` 表示未参与，`""` 表示参与了空匹配），以及使用原始标志的 JavaScript 替换结果。测试文件支持带版本的 JSON 导入/导出和手动本地保存/恢复。无效草稿或文件不会覆盖当前工作；导入的 CR/CRLF 保持原样，直到编辑示例输入框。这些控件尚未包含在托管的 dev.6 中。参见[测试文件格式、示例和限制](../TEST_FIXTURES.md)。

1. 选择配方，或每行写一条指令。
2. 查看生成的片段及其解释。
3. 添加输入示例，标明哪些应该匹配。
4. 确认行为后复制正则。

部分匹配会显示转义后的上下文并高亮匹配内容；空匹配有位置标记。规则和示例留在浏览器中，无需账号、AI 推断或应用后端。

在当前工作台中展开匹配，可查看捕获值及引擎提供的位置。未参与匹配的组与捕获到空字符串的组分别显示；重复组显示最后一次捕获。**Search anywhere** 最多列出 100 个不重叠匹配，遇到空匹配后前进一个 Unicode 码点。位置按 UTF-16 代码单元计数，结束位置不包含在范围内。如果引擎不支持捕获索引，只显示值，不推测位置。

[![桌面工作台的真实截图](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=e1a2f3784e8c)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

[移动端截图及校验和](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md)。

## 🔄 已经有正则了？

在 **Already have a regex?** 中粘贴支持的 JavaScript 字面量，按 Ctrl/Cmd + Enter，或选择 **Translate to rules**。`/^[A-Z]{2}-\d{4}$/u` 会变成：

```text
start
2 uppercase letter
"-"
4 digit
end
```

使用 `/` 分隔符以及 `u` 或 `v`；换行写成 `\n` 等转义。支持的 `i`、`s`、`m`、`u` 行为会保留。当前源码还可导入捕获、嵌套分组和向后引用，保留名称、编号及捕获值。

`[^]` 会转换为带 `s` 的任意字符；旁边的普通点号会明确排除行终止符，以保持原意。完整字母、单词和十六进制字符类的等价排列也会识别；路径排除、控制字符转义及列表两端的字面连字符会保留。

不支持的语法不会被删除或近似转换。**Go to regex error** 可定位源字符；失败不会覆盖当前规则和选项。前向引用及对尚未闭合捕获的引用会被拒绝。空的非捕获分组变为 `0 any character`：搜索模式可找到空匹配，整串模式只接受空输入。

## 🍱 入门配方

| 配方 | 示例 | 检查内容 |
| --- | --- | --- |
| [带前缀 ID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | `ABC123` | 前缀与三位数字 |
| [发票编号](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | `INV-1234` | `INV-` 与2–6位数字 |
| [用户名](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | `Alice_7` | 3–16个字符，以 ASCII 字母开头 |
| [十六进制颜色](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | `#12aBcF` | `#` 后六位十六进制数 |
| [MAC 地址](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=mac-address-shape) | `00:1A:2B:3C:4D:5E` | 六组十六进制数对 |
| [UUID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=uuid-shape) | `8–4–4–4–12` | 五组十六进制数 |
| [产品代码](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=product-code-shape) | `AB-rgb-0420` | 固定数量与 ASCII 大小写 |
| [日期](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | `2026-09-30` | `YYYY-MM-DD` 形状 |
| [时间](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | `09:30` | `HH:MM` 形状 |
| [电话号码](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | `+33123456789` | 可选 `+` 与7–15位数字 |
| [IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | `192.0.2.42` | 四组1–3位数字 |
| [文件名](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | `report.txt` | 长度受限、排除分隔符的 Unicode 文件名 |
| [产物清单](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | 路径、哈希、大小 | 19条规则、9个示例 |
| [访问日志](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | 请求、状态、大小 | 43条规则、8个示例 |
| [遥测事件](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | ID 与可选值 | 38条规则、9个示例 |
| [版本](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | `1.2.3` | 三个数字部分 |
| [排除字符](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | `xyz` | 不含选定字符的文本 |
| [行规则](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | `item 123` | 至少以三位数字结尾的行 |

这些是**形状检查**。不存在的日期和 `25:99` 仍可匹配。IPv4 不限制每段为0–255；UUID 不验证版本、变体或唯一性。用户名可用性、发票记录、电话号码有效性、日历和文件系统约束需另行验证。版本配方不是完整 SemVer；颜色只接受 `#RRGGBB`。

## 🏗️ 更大模式，同样清晰

[完整示例指南](../COMPLEX-EXAMPLES.md)包含访问日志、遥测、产物清单和多行订单，共35个正反示例，并解释每个生成片段。

### 📦 产物清单

可选 `nightly/` 目录、长度受限的 Unicode 路径、版本、归档名、哈希和大小，以制表符分隔：

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

仅检查格式，不检查文件是否存在或内容是否完整。

### 🧾 多行订单

ID、Unicode 买家、电话、数量、金额、引用、可选审批值及完整的可选优先级行：

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

换行是字面字符。金额、号码和订单有效性由应用验证。指南的四个平坦示例不提取字段。

## 🧲 用命名捕获提取字段

此示例可使用 npm `0.1.0-dev.6` 或在线工作台运行。

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

`capture {` 创建编号捕获，`group {` 只分组不捕获。名称是唯一的 JavaScript 标识符，编号按开始顺序排列，包含嵌套组。未参与的可选捕获是 `undefined`，参与但为空的捕获是 `""`，重复捕获保留最后一次的值。

组闭合后，`same as capture "word"` 或 `same as capture 1` 要求相同文本。[示例](../LANGUAGE.md#capture-references)接受 `cat cat`，拒绝 `cat dog`。前向引用或目标内部引用会返回诊断。逆向转换也保留支持的捕获；提取日期后仍需日历校验。

## 🧩 语法速查

每行一条指令，字面文本加引号。

| 规则 | 结果 | 含义 |
| --- | --- | --- |
| `start` / `end` | `^` / `$` | 输入边界 |
| `line start` / `line end` | `^` / `$` 加 `m` | 行边界 |
| `digit` / `not digit` | `\d` / `\D` | ASCII 数字及其补集 |
| `3 digits` / `digits` | `\d{3}` / `\d+` | 三位或至少一位 |
| `between 2 and 4 digits` | `\d{2,4}` | 包含两端 |
| `optional "-"` | `-{0,1}` | 可选连字符 |
| `letter` / `letters` | `[A-Za-z]` / `[A-Za-z]+` | ASCII 字母 |
| `lowercase letters` / `uppercase letters` | `[a-z]+` / `[A-Z]+` | `i` 忽略区别 |
| `6 hex digits` | `[0-9A-Fa-f]{6}` | 六位十六进制数 |
| `space` / `spaces` | `\s` / `\s+` | 包含换行的空白 |
| `between 1 and 32 path segment characters` | 1–32个码点 | 排除分隔符、NUL、换行 |
| `"hello"` | `hello` | 转义后的精确文本 |
| `one of: a, b` | `[ab]` | 列表中的一个字符 |
| `text without: a, b` | `[^ab]*` | 零个或多个非列表字符 |
| `any text` | `.*` | `s` 可包含换行 |

`word character` / `word characters` 和 `word` / `not word` 遵循 `\w` / `\W`：包括 `_`，不包括 `é`。`letter` 排除数字和下划线。启用 `i` 后，JavaScript 的大小写折叠会纳入 `K`、`ſ` 等等价字符。默认使用 `u`，源码版也接受 `v`；两者都不会把 ASCII 类变成通用 Unicode 类别。

## 💻 在终端使用

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

也可直接从克隆的源码运行：

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

```text
/^ABC\d{3}$/u
```

✅ `ABC123` · ❌ `ABC12`、`ABC1234`、`abc123`

| 选项 | 功能 |
| --- | --- |
| `--explain` | 显示片段和解释 |
| `--json` | stdout 输出结果，stderr 输出错误 |
| `--ignore-case` | 开启 `i` |
| `--dot-all` | 开启 `s` |
| `--flags` | 选择原生 JavaScript flags；u/v 不能同时使用 |
| `--help` | 帮助 |
| `--target` | 导出到指定语言，详见[引擎配置](../LANGUAGE.md#engine-exports) |
| `--version` | 包版本 |

读取 UTF-8 文件或 stdin。以 `-` 开头的文件名之前加 `--`。退出码：成功/帮助/版本为 `0`，无效规则或输入输出错误为 `1`，参数错误为 `2`。

无效 UTF-8 会被拒绝，不会静默替换。JSON 保留诊断代码；参数错误用 `CLI_USAGE`，文件或执行错误用 `CLI_ERROR`。控制字符以可见转义显示；解码 JSON 可恢复原始数据。即使 stderr 写入失败，也会以非零状态退出。

### 🔄 CLI 逆向转换

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

`--reverse --json` 与 `regexToRules()` 一样返回 `{ rules, flags }`。将返回的 `flags` 传给 `compile(rules, { flags })`，保留原生选项和游标行为。支持全部八个 flags；带 g/y 的正则仍具有状态。

## 📦 JavaScript 库

使用 ESM（`.mjs` 或 `"type": "module"`）。包中包含 TypeScript 声明。源码中使用 `./index.js`。

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

`toRegExp({ source, flags })` 接受缓存的元数据，两个字段必须是字符串，不读取 segments。`compile("digit", { flags: undefined })` 使用 `u`，也兼容 `exactOptionalPropertyTypes`。

`regexToRules()` 接受其他 JavaScript 上下文中的真实正则，保持 `lastIndex`，读取原生元数据，不调用匹配方法或实例覆盖属性。`\u{00000041}` 等转义仍受源长度限制。

## 🎛️ 明确的 flags

| Flag | 启用方式 | 作用 |
| --- | --- | --- |
| `u` | 默认开启 | 按 Unicode 码点匹配 |
| `i` | `{ flags: 'i' }` 或 `--ignore-case` | JavaScript 原生大小写折叠 |
| `s` | `{ flags: 's' }` 或 `--dot-all` | 点号可匹配换行 |
| `m` | `line start` / `line end` | 行锚点 |
| `d` | `{ flags: 'd' }` | 原生匹配和捕获位置索引 |
| `g` | `{ flags: 'g' }` | 重复调用推进 `lastIndex` |
| `y` | `{ flags: 'y' }` | 从 `lastIndex` 匹配，遇到间隙即停止 |
| `v` | `{ flags: 'v' }` | 原生 v 模式 Unicode 字符类与补集 |

**预览版本：**支持全部八个 flags：`d`、`g`、`i`、`m`、`s`、`u`、`v`、`y`，可使用 `{ flags: 'dgiv' }` 或 `--flags dgiv`。输出顺序固定为 `dgimsuvy`；重复标志及 u/v 同时使用会报错，默认仍为 u。m 可显式指定或由行锚点启用；混用时输入锚点仍保持绝对边界。逆向转换保留选项且不修改 `lastIndex`。Workshop 每个示例都从 0 开始，最多列出 100 次匹配；复制的 g/y 正则仍有状态。不支持的原生能力会明确报错。npm `0.1.0-dev.6` 已包含这些功能。

选择 `v` 后，可使用 `one of strings: "a", "ab", ""` 或 `unicode property "RGI_Emoji"`。原生集合优先尝试较长成员，与列表顺序无关；后续规则可能要求回溯到较短成员。允许空字符串。类中可使用 `string "ab"`。字符串属性以及空字符串或多码点成员不能取补集。npm `0.1.0-dev.6` 已包含这些功能。

嵌套集合使用 `character set union {`、`character set intersection {` 或 `character set subtraction {`，以 `}` 结束。每行表示一个字符、范围、字符类、属性、字符串集合或嵌套集合。交集保留共同成员；差集从第一个操作数中移除右侧成员。次数和 `lazy` 作用于整个块。`not` 遵循原生字符串结构限制；空并集不匹配任何内容。请选择 `v`；npm `0.1.0-dev.6` 已包含这些功能。[语法和示例](../LANGUAGE.md#nested-unicode-set-operations)。

## 🛠️ 本地开发

```sh
npm ci
npm run build
npm run serve
```

打开 **http://127.0.0.1:4174/**。`npm run serve -- 0` 选择可用端口。目录重定向保留查询参数并添加末尾斜杠。

已安装 Chrome 时执行完整检查：

```sh
npm ci
npm exec -- playwright install firefox webkit
npm run verify
```

没有 Chrome 时使用 Playwright 的 Chromium：

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

包括格式、lint、类型、链接、Node、Pages 构建、干净消费者安装、浏览器与依赖审计。`CI=1` 仅选择本地浏览器，不会开启已禁用的 GitHub Actions。

## 🧭 了解边界

分支会转换为可编辑的 `either { … }` 块：每个直接条目是一个选择，按顺序尝试。使用 `group { … }` 可以将多条规则组成一个选择，也可以表示空选择。

目标是 **JavaScript `RegExp`**。不接受把原始正则当规则，也不理解自由英文。逆向转换仅限文档中的子集。自由英语、u 模式下的空字符类、前向引用及对尚未闭合组的引用仍不支持。工作台的 worker 有执行期限；复制出去的正则需由使用它的应用自行防护。参阅[安全模型](../SECURITY_MODEL.md)。

## 💬 常见问题

**这是 AI 生成器吗？** 不是。使用确定性解析器、AST、编译器和结构化解释。

**能转换所有正则吗？** 不能。未知构造直接报错，不通过删除捕获或断言强行转换。

**例子通过就证明安全吗？** 不能。只验证选定行为，不证明所有路径或执行成本。

**字符类覆盖全部 Unicode 吗？** 不覆盖。`digit` 是 ASCII，`letter` 是 `[A-Za-z]`，`word` 遵循 `\w`。

**有哪些上限？** 16,384个 UTF-16 单位、200行、有界重复最多1,000次、嵌套64层；最多100个示例，每个2,048单位，worker 期限1,200 ms。一个 emoji 通常占两个 UTF-16 单位。

**离线可用吗？** 库和 CLI 本地运行。安装依赖后可本地构建和运行工作台。不宣称提供 PWA 或离线缓存。

**如何报告问题？** 到 [GitHub issues](https://github.com/OthmaneBlial/Regex-For-Humans/issues)提供规则、flags、输入、预期行为和引擎版本。安全问题请按 [SECURITY.md](../../SECURITY.md) 私密报告。

## 🗺️ 项目导航

| 文档 | 内容 |
| --- | --- |
| [语言](../LANGUAGE.md) | 文法、分组、引用、诊断 |
| [复杂示例](../COMPLEX-EXAMPLES.md) | 四种格式的完整解释 |
| [架构](../ARCHITECTURE.md) | 解析器 → AST → 编译器 → 各界面 |
| [兼容性](../COMPATIBILITY.md) | 已验证构造及引擎 |
| [测试](../TESTING.md) | 可复现命令和结果 |
| [安全](../SECURITY_MODEL.md) | 信任边界和限制 |
| [分发](../DISTRIBUTION.md) | 发布证据 |
| [路线图](../AUTONOMOUS_ROADMAP.md) | 当前进度和优先级 |
| [对比](../COMPETITOR_GAPS.md) | 来源和待补能力 |
| [贡献](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) | 环境和约定 |

**2026年10月11日本地验证：** 1,138项测试通过：334项 Node 测试、478项 Chromium 桌面/移动检查、262项 Firefox/WebKit 检查和64项网站检查。构建及独立 JavaScript/TypeScript 项目中的包安装均通过，审计报告0个漏洞。另一个独立消费者检查也在 Node 22.23.3 通过。这些结果仅描述当前快照；真人易用性和屏幕阅读器评估仍待完成。

## 结构风险检查

在本地工作台打开 **Review the pattern**，查看嵌套或相邻的可变重复、重叠分支、范围宽泛的通配符、行锚点和过大的正则表达式。悬停会关联规则、正则片段、说明和结构图，而不移动光标；选择提示会返回对应源码行。修改规则、标志、示例配方或分组后，检查结果会更新。

共享 API `analyze(rules, { flags })` 返回规范顺序的标志、带源码位置及范围的类型化提示，以及分析限制。正向字符类和范围中的已知字符可揭示部分重叠；未知集合不会被视为已证明互不相交。这是启发式分析，可能遗漏开销较大的模式，也可能误报；**没有发现问题并不证明性能安全**。分析不执行匹配，也不测量回溯。示例匹配仍在隔离 worker 中运行，并受时间限制。

参见[结构风险检查说明](../LANGUAGE.md#structural-risk-review)。

## 结构图

在本地工作台打开 **Explore the pattern**，查看根据 AST 绘制的铁路图：嵌套分组、有序分支、重复循环以及不消耗文本的断言。悬停或选择节点会关联规则、正则片段和说明；悬停不会移动源码光标。按 **Enter/Space** 返回对应源码行。移动源码光标或选择生成的正则文本也会定位结构。**Actual size** 保持标签可读并支持滚动；**Fit overview** 显示全图。**Export SVG** 导出独立文件，也可调用 `toSVG(rules, { flags })`。长标签的完整说明保留在提示中。此图表示结构，不是执行或回溯轨迹。参见[结构图](../LANGUAGE.md#structural-diagrams)。

[MIT 许可证](../../LICENSE) · [更新日志](../../CHANGELOG.md) · [返回英文版](../../README.md)。
