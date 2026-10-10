<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans：清晰规则，真实正则](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**写出来，看明白，测一测。**

把清晰的英文规则编译成 JavaScript 正则表达式，并逐段理解结果。

[🚀 在线工作台](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 项目网站](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 语法](../LANGUAGE.md) · [📦 npm 预览版](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.4)

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

> 🌱 预览版 `0.1.0-dev.4` 的库和 CLI 需要 **Node.js 22+**。在线工作台无需安装。真人可用性评估和屏幕阅读器测试仍未完成。

## 🧰 现在可以做什么

| 能力 | npm `0.1.0-dev.4` | 当前源码 |
| --- | --- | --- |
| 规则 → JavaScript 正则 | ✅ | ✅ |
| 支持的正则 → 可编辑规则 | ✅ | ✅ 包含支持的分组和引用 |
| 片段解释与源码定位 | ✅ | ✅ 包含分组两端和引用 |
| CLI、ESM API、TypeScript 类型 | ✅ | ✅ |
| 命名/编号捕获与嵌套块 | ✅ | ✅ |
| 整块重复与向后引用 | ✅ | ✅ |
| 使用 `either { … }` 的有序分支 | ✅ | ✅ 嵌套选择与逆向转换 |
| 非贪婪重复（`lazy`） | — | ✅ 源码已支持，尚未发布 |
| 环视 | — | 计划中；目前拒绝 |
| 其他正则引擎、自由英文 | — | 不在当前语言范围内 |

当前源码中，`lazy digits` 生成 `\d+?`：先尝试一个数字，再根据后续规则增加重复次数。此功能尚未包含在 npm `0.1.0-dev.4` 中。参见[重复规则](../LANGUAGE.md#repetition)。

npm `0.1.0-dev.4` 包含分组、捕获、后向引用和有序分支，库和 CLI 均可使用。工作台还提供捕获检查和多次搜索匹配。详见[兼容性](../COMPATIBILITY.md)和[发布记录](../DISTRIBUTION.md)。

## 📦 安装预览版

```sh
npm install regex-for-humans@preview
```

不必全局安装即可运行 CLI：

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

输出 `/^ABC\d{3}$/u`。固定版本可用 `regex-for-humans@0.1.0-dev.4`。没有运行时依赖，也不提供独立的各操作系统可执行文件。

## 🎮 试一个模式

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

使用 `/` 分隔符和必需的 `u`；换行写成 `\n` 等转义。支持的 `i`、`s`、`m`、`u` 行为会保留。当前源码还可导入捕获、嵌套分组和向后引用，保留名称、编号及捕获值。

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

此示例可使用 npm `0.1.0-dev.4` 或在线工作台运行。

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

`word character` / `word characters` 和 `word` / `not word` 遵循 `\w` / `\W`：包括 `_`，不包括 `é`。`letter` 排除数字和下划线。启用 `i` 后，JavaScript 的大小写折叠会纳入 `K`、`ſ` 等等价字符。`u` 始终开启，但不会把 ASCII 类变成通用 Unicode 类别。

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
| `--help` | 帮助 |
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

`--reverse --json` 返回 `{ rules, flags }`。将 `flags` 传给 `compile()`；`m` 由行锚点表达，`u` 自动启用。普通文本模式在 stderr 提示所需选项，但仍成功退出。不能同时使用 `--explain`、`--ignore-case` 或 `--dot-all`。

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
| `u` | 始终开启 | 按 Unicode 码点匹配 |
| `i` | `{ flags: 'i' }` 或 `--ignore-case` | JavaScript 原生大小写折叠 |
| `s` | `{ flags: 's' }` 或 `--dot-all` | 点号可匹配换行 |
| `m` | `line start` / `line end` | 行锚点 |

`flags: 'is'` 可组合两个选项。`g`、`y`、`d`、`v` 不是编译器选项。使用输出源码构造原生正则的应用可自行选择执行 flags。

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

目标是 **JavaScript `RegExp`**。不接受把原始正则当规则，也不理解自由英文。逆向转换仅限文档中的子集。环视、前向及未闭合引用目前拒绝。工作台的 worker 有执行期限；复制出去的正则需由使用它的应用自行防护。参阅[安全模型](../SECURITY_MODEL.md)。

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

**2026年10月10日本地验证：** 251项 Node 测试、296项 Chromium 桌面/移动检查、66项 Firefox/WebKit、64项网站检查及干净消费者安装均通过；审计发现0个漏洞。16项分组/引用/逆转换测试也在 Node 22.23.3 通过。这是该快照的证据，不保证未来所有浏览器。真人评估仍待完成。

[MIT 许可证](../../LICENSE) · [更新日志](../../CHANGELOG.md) · [返回英文版](../../README.md)。
