<div align="center">

[![Regex For Humans：正規表現 ^#[0-9A-Fa-f]{6}$ の各断片の下に、平易な英語での意味を添えた図](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**正規表現を平易な英語で書く。どんな正規表現も同じように読む。**

短い英語のルールが、ルールごとに見える断片を持つネイティブな JavaScript の `RegExp` にコンパイルされます。正規表現を貼り付ければ、ルールに戻せます。

**[ワークショップを試す](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [Web サイト](https://othmaneblial.github.io/Regex-For-Humans/) · [npm プレビュー](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.13) · [構文](../LANGUAGE.md)**

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · **日本語** · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## ルールを書けば正規表現になる

<table>
<tr><th>ルール</th><th>JavaScript 正規表現</th></tr>
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

各行には文書化された意味が一つあり、順番どおりに正規表現へ断片を一つ加えます。出力は手書きと同じ正規表現です。`{0,1}` ではなく `?` を使い、余計なグループもありません。未知の表現は、行・列・修正案とともに止まります。

[![6 つのレシピを順に表示：ルール、コンパイルされた正規表現、各断片の意味、サンプルで一致した部分](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-reel.svg)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

## 正規表現をルールに読み戻す

誰も読めないパターンを引き継ぎましたか？ `regexToRules` は対応する正規表現を編集可能なルールに変換し、そのルールは同じ正規表現に再コンパイルされます。

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

[Web サイト](https://othmaneblial.github.io/Regex-For-Humans/)では、貼り付けた正規表現をその場で注釈します。未対応の構文は位置付きで拒否され、黙って捨てられることはありません。

## キャプチャに名前を付ける

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

キャプチャはネイティブな JavaScript のグループです。`same as capture "year"` と書けば、同じテキストをもう一度要求できます。

## インストール

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

Node.js 22+、実行時依存なし、TypeScript 宣言付きの ESM。ライブラリ、[コマンドライン](../CLI.md)、ワークショップは同じコンパイラを使います。これはプレビュー版（`0.1.0-dev.13`）です。[ワークショップ](https://othmaneblial.github.io/Regex-For-Humans/workshop/)はインストール不要です。

## 語彙早見表

| こう書く | こうなる |
| --- | --- |
| `start` · `end` | `^` · `$` |
| `3 digits` · `digits` | `\d{3}` · `\d+` |
| `between 2 and 4 letters` | `[A-Za-z]{2,4}` |
| `optional "-"` | `-?` |
| `one of: a, b` | `[ab]` |
| `either { "INFO" "WARN" }` | `(?:INFO\|WARN)` |
| `capture "id" { … }` | `(?<id>…)` |
| `not followed by { "x" }` | `(?!x)` |

`either { … }` のようなブロックでは、波括弧の中に 1 行 1 ルールで書きます。すべてのルール、フラグ、Unicode クラス、先読み・後読み、制限は[言語ガイド](../LANGUAGE.md)にあります。

## すぐ開ける 34 のレシピ

| レシピ | 確認すること |
| --- | --- |
| [暦日付を検証する](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=calendar-date) | 月 01–12、日 01–31 を年・月・日としてキャプチャ |
| [IPv4 アドレスを検証する](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-address) | 0 から 255 までの 4 つの数値、先頭ゼロなし |
| [24 時間制の時刻を検証する](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=clock-time) | `00:00` から `23:59` まで |
| [SemVer 2.0 の構文を検証する](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | コア、プレリリース、ビルドの各部分 |
| [ログ断片から名前付きフィールドを抽出する](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | レベルとコードを名前で |
| [繰り返された単語に一致させる](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | ある単語のあとに同じ単語 |

どのレシピにも、一致すべき例と一致してはいけない例、そして確認しない点についての注記があります。[34 のレシピすべて](../RECIPES.md)と、**35 件の受理・拒否ケース**を含む 4 つの[複雑な例](../COMPLEX-EXAMPLES.md)をご覧ください。

## 出力を信頼できる理由

- **決定的。** モデルではなくパーサーです。同じルールからは常に同じ正規表現が得られます。AI もネットワークもテレメトリもありません。
- **ネイティブ。** 出力は普通の `RegExp` で、照合時に動くのはエンジンだけです。Python、Rust、Go、Java、C#、PHP、Ruby への[エクスポート](../LANGUAGE.md#engine-exports)は、それぞれのエンジンと比較しています。
- **限界に正直。** レシピは確認しない点を明記します。ワークショップは例を時間制限付きの worker で実行します。コピーした正規表現には独自の安全策が必要です（[セキュリティモデル](../SECURITY_MODEL.md)）。
- **テスト済み。** すべてのレシピとこの README のすべての例は、テストスイートで再コンパイルされます（[テスト](../TESTING.md)）。

[アーキテクチャ](../ARCHITECTURE.md) · [互換性](../COMPATIBILITY.md) · [コントリビュート](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [変更履歴](../../CHANGELOG.md) · [セキュリティ](../../SECURITY.md) · [MIT](../../LICENSE)

<div align="center">

ここのルールで目を細める回数が減ったなら、⭐ がほかの開発者の発見を助けます。

</div>
