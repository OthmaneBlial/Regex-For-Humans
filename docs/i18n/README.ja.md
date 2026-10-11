<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans：読みやすいルールから実際の正規表現へ](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**書く。理解する。試す。**

明確な英語のルールを、各部分の意味を追える JavaScript 正規表現に変換します。

[🚀 ワークショップ](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 サイト](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 構文](../LANGUAGE.md) · [📦 npm プレビュー](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.12)

🔒 ローカル実行 · 🧩 実行時依存なし · ⚡ 1つのコンパイラ、3つの使い方

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · **日本語** · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## 🪄 記号を読み解く手間を減らす

正規表現を生成したルールが見えれば、結果も理解しやすくなります。

```text
start "#"
6 hex digits
end
```

```js
/^#[0-9A-Fa-f]{6}$/u
```

✅ `#12aBcF`、`#000000` · ❌ `#123`、`#G00000`

語彙は**固定**され、各命令には正確な意味があります。ライブラリ、CLI、ワークショップは同じ決定的なコンパイラを使います。不明な命令には行、列、修正のヒントを返します。どの翻訳でも、ルールの構文自体は英語のままです。

> 🌱 プレビュー `0.1.0-dev.12` のライブラリと CLI には **Node.js 22+** が必要です。オンラインのワークショップはインストール不要です。人による使いやすさとスクリーンリーダーの評価は未実施です。

## 🧰 現在できること

**Markdown レポート：**ビルド情報、ルール、正確な JavaScript 正規表現、オプション、テストの期待値、再インポート可能な JSON を含む [Markdown レポート](../MARKDOWN_REPORTS.md)を出力できます。出力はテストを実行せず、成功を保証するものでもありません。

**ルール補完：** **Complete a rule** または **Ctrl + スペース** で組み込み文字クラスを補完できます。回数の指定後も利用できます（例：`between 2 and 5 di`）。前に閉じられたキャプチャグループへの参照（`same as ca`）も、番号と名前で補完できます。プレビューには選択したルールの全文が表示されます。候補は文書全体とともにコンパイルできる場合にだけ表示されます。引用符内の文字列、コメント、選択中のテキストは保持されます。[操作方法と範囲](../EDITOR_COMPLETIONS.md)をご覧ください。

**dev.12 以降のソースコード更新：**補完機能には、閉じ括弧まで含む8種類のグループ・アサーション用テンプレートも追加されています。プレビューには提案された文書全体が表示され、新しいキャプチャによって番号が変わる場合の参照更新も確認できます。カーソルはブロック内の最初のルールへ移動します。この追加機能は、次の検証済みワークショップ版で公開予定です。

| 機能 | npm `0.1.0-dev.12` / ホスト版ワークショップ |
| --- | --- |
| ルール → JavaScript 正規表現 | ✅ |
| 対応する正規表現 → 編集可能なルール | ✅ |
| 各断片の説明と元のルールへの移動 | ✅ |
| CLI、ESM API、TypeScript 型 | ✅ |
| 名前付き・番号付きキャプチャと入れ子のブロック | ✅ |
| ブロック全体の繰り返しと後方参照 | ✅ |
| `either { … }` による順序付きの選択 | ✅ |
| `lazy` による非貪欲な繰り返し | ✅ |
| 先読み・後読み | ✅ |
| 単語境界 | ✅ |
| [Unicode プロパティ](../LANGUAGE.md#unicode-properties) | ✅ |
| [文字クラスの組み合わせ](../LANGUAGE.md#composable-character-classes) | ✅ |
| [Unicode 文字列と入れ子の集合](../LANGUAGE.md#nested-unicode-set-operations) | ✅ |
| JavaScript の全 8 フラグ | ✅ |
| [グループの編集とキャプチャ範囲の強調](../LANGUAGE.md#editing-groups) | ✅ |
| [対話型の構造図とSVG出力](../LANGUAGE.md#structural-diagrams) | ✅ |
| [構造上のリスクの確認](../LANGUAGE.md#structural-risk-review) | ✅ |
| [対象エンジンに合わせたコード出力](../LANGUAGE.md#engine-exports) | ✅ |
| 自由な英文 | — |

ローカルのワークショップに **Edit groups and references** が追加され、キャプチャ名の変更、グループ種別の変更、参照位置への移動ができます。番号が変わっても数値参照は元のキャプチャを指します。参照されているキャプチャを非キャプチャに変更すると操作を拒否し、元のルールを保持します。**Highlight** はネイティブの入力範囲を強調し、空のキャプチャや消費したマッチの外側にあるキャプチャにも対応します。`editGroup` API は検証済みのルールを返します。[グループ編集](../LANGUAGE.md#editing-groups)を参照してください。

現在のソースでは `lazy digits` が `\d+?` になります。まず数字1文字を試し、後続の規則に必要なら繰り返しを増やします。npm `0.1.0-dev.12` で利用できます。[繰り返しの規則](../LANGUAGE.md#repetition)を参照してください。

ソースでは `followed by { … }`、`not followed by { … }`、`preceded by { … }`、`not preceded by { … }` も使えます。現在の位置の前後を調べ、文字は消費しません。キャプチャはネイティブな値と位置を保ち、その範囲が一致部分の外にある場合もあります。後読みには実行環境の対応が必要です。npm `0.1.0-dev.12` で利用できます。[先読み・後読み](../LANGUAGE.md#lookaround-assertions)を参照してください。

ソースでは `word boundary`（`\b`）と `not word boundary`（`\B`）も使えます。文字を消費しません。JavaScript の単語文字は ASCII の英字、数字、アンダースコアです。`i` を使うと、大文字・小文字の折り畳みで同等になる文字も含みます。自然言語の単語分割ではありません。npm `0.1.0-dev.12` で利用できます。[単語境界](../LANGUAGE.md#word-boundaries)を参照してください。

ソースでは `unicode property "L"` と `not unicode property "L"` を使い、ネイティブの `\p{L}` と `\P{L}` を生成できます。`L` は Letter を意味します。別名は大文字・小文字を区別し、分類は実行環境の Unicode データに従います。回数指定と `lazy` も使えます。`i` を付けた `u` モードの補集合には、大小文字の折り畳みで同等になる文字が含まれることがあります。npm `0.1.0-dev.12` で利用できます。[Unicode プロパティ](../LANGUAGE.md#unicode-properties)を参照してください。

ソースは `range "α" to "ω"` と `character class: digit, "_"` をサポートします。1 Unicode コードポイントのリテラル、範囲、単数の略記、Unicode プロパティを一つのクラスにまとめられます。`not character class:` は和集合全体を否定し、回数指定と `lazy` はクラスに適用されます。プロパティの補集合はネイティブの `u`/`i` の挙動を保ちます。npm `0.1.0-dev.12` で利用できます。[文字クラス](../LANGUAGE.md#composable-character-classes)を参照してください。

npm `0.1.0-dev.12` のライブラリと CLI は、グループ、キャプチャ、後方参照、順序付き選択肢に対応しています。ワークショップではキャプチャの確認と複数の検索一致も利用できます。[互換性](../COMPATIBILITY.md)と[公開の記録](../DISTRIBUTION.md)を確認してください。

## 🌍 使用する言語に出力する

ローカルのワークショップで **Export to a programming language** を開くか、`exportRegex(rules, { target: "python" })` を呼び出すか、`node bin/regex-for-humans.js --target python --json rules.txt` を実行します。JavaScript、TypeScript、Python、Rust、Go、Java、C#、PHP、Ruby の9形式があります。JavaScript/TypeScript は既存のネイティブパターンを保持し、それ以外の対象は AST から対応する正規表現の意味を変換した後、正しくエスケープしたソースコードを生成します。

生成コードの比較は7つのネイティブエンジンで通過しています。**PHP は PHP 8.5.11 / PCRE2 10.44 で検証済みです。**テストしたバージョンとコーパスの範囲は[互換性ガイド](../COMPATIBILITY.md#engine-exports)に記載しています。要件とキャプチャ対応表を保存してください。他のエンジンでは `gN` という名前を使い、未参加のキャプチャ名が存在しない場合もあります。入力は正しい Unicode である必要があります。非対応のフラグ（`d/g/i/y`）、Unicode プロパティ、互換性のないアサーション・キャプチャ・繰り返しには位置付き診断を返します。コードまたは完全な JSON をダウンロードできますが、ブラウザの例は引き続き JavaScript で実行します。[エンジンと制限](../LANGUAGE.md#engine-exports)を確認してください。

## 📦 プレビューをインストールする

```sh
npm install regex-for-humans@preview
```

グローバルインストールなしで CLI を実行できます。

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

出力は `/^ABC\d{3}$/u` です。固定バージョンには `regex-for-humans@0.1.0-dev.12` を使います。実行時依存や OS ごとの単独実行ファイルはありません。

## 🎮 パターンを試す

 **Interface language** で英語、簡体字中国語、スペイン語、フランス語を選べます。ラベル、例の説明、テスト結果、ナビゲーションは、ルール、入力、選択範囲、開いたパネル、生成コードを変えずに切り替わります。ストレージが利用できる場合、選択は端末に保存されます。ルールは引き続き制御された英語を使用し、コンパイラの説明、図のラベル、エクスポートの技術要件も英語のままです。[ワークショップのローカライズ](../ARCHITECTURE.md#workshop-localization)を参照してください。

 **Theme** でシステムの外観に合わせるか、ライトまたはダークのワークショップを選べます。ストレージが利用できる場合、選択は端末に保存されます。外観を切り替えても、ルール、入力例、選択範囲、開いたパネルは保持されます。[テーマ設定](../ARCHITECTURE.md#theme-preference)を参照してください。

ネイティブのルールエディタがキーワード、文字列、キャプチャ、量指定子、アサーション、選択肢、コメントを色分けします。コンパイラが指摘したトークンに下線を付け、入力・選択・コピー・スクロールはネイティブの動作を維持します。強制カラーや制限を超える入力では通常のテキスト表示に戻ります。`#` で始まるコメント行は元の位置を保ち、既存の文字数・行数制限に含まれます。[コメント](../LANGUAGE.md#comments)と[エディタの色分け](../ARCHITECTURE.md#editor-highlighting)を参照してください。

構築パネルは、キャプチャ、任意部分、選択肢、繰り返し、文字クラス、アサーションの編集可能なテンプレートを、現在の行または選択範囲の前、外側のアンカーの内側に挿入します。キャプチャを追加しても既存の番号付き参照の対象は変わりません。不正または制限を超える挿入では、元のルールと選択範囲を保持します。フラグとテスト例も保持します。[ルール構築](../ARCHITECTURE.md#rule-construction)を参照してください。

正確な期待値は、UTF-16 の範囲一覧、番号順のキャプチャ値（不参加は `null`、空のキャプチャは `""`）、元のフラグによる JavaScript の置換結果を検証します。テスト用ファイルは、バージョン付き JSON のインポート／エクスポートと手動のローカル保存／復元に対応します。不正な下書きやファイルでも現在の作業は保持されます。インポートされた CR/CRLF は、例の入力欄を編集するまでそのまま維持されます。[ファイル形式、例、制限](../TEST_FIXTURES.md)を参照してください。

**Copy share link** で**ワークショップ全体のスナップショットを共有**できます。ルール、フラグ、照合モード、例、正確な期待値を一つの URL に保存します。新しいページはレシピを読み込む前に復元し、**Load shared link** は明示的な操作で現在の作業を置き換えます。クリップボードが拒否された場合は欄から手動でコピーできます。リンクの上限は 32 KiB で、大きなテスト集は JSON で書き出します。リンクを持つ人は内容を読めます。暗号化はされていません。[共有方法と制限](../TEST_FIXTURES.md#share-a-workshop-snapshot)を参照してください。

**下書き復元。** **Keep a draft in this browser** を有効にすると、再読み込み後にルール、フラグ、例、貼り付けた正規表現、未完成の期待値 JSON も復元できます。既定では無効で、手動保存したテストとは別に保存します。無効にすると下書きを削除します。[復元と保存容量の制限](../TEST_FIXTURES.md#draft-recovery-on-unreleased-main)を参照してください。

**グループ編集プレビュー。** **Preview group edit** を選ぶと、現在のルールと正規表現を変更案と比較できます。名前や番号が変わる参照も表示します。プレビューはテストと保存済みの下書きを保ち、ルール、フラグ、グループの設定を変更すると消えます。結果をテストするには編集を適用してください。[変更前後の比較と制限](../GROUP_PREVIEWS.md)を参照してください。

ネイティブの一致範囲、必要な最小長、欠けた必須リテラル、絶対入力端の位置が違うリテラルから、**失敗した例の理由を確認**できます。接頭辞・接尾辞の検証は大文字小文字を区別する入力アンカーに適用され、行アンカーや不確かな場合は保守的な説明を維持します。正確な失敗箇所が不明な場合はその旨を示します。バックトラッキングの実行履歴ではありません。[失敗の説明](../FAILURE_EXPLANATIONS.md)を参照してください。

不正な引用文字列のエスケープ、文字クラスやリストの項目、範囲の端点、Unicode プロパティ別名の**正確な診断範囲へ移動**できます。強調表示は元のエスケープ表記と完全な Unicode サロゲートペアを保ち、範囲が不明なら開始位置への移動を維持します。ライブラリと CLI は、終端を含まない UTF-16 列位置の `endColumn` を任意で返します。[診断範囲](../LANGUAGE.md#errors-and-future-syntax)を参照してください。

1. レシピを選ぶか、1行に1命令を書きます。
2. 生成された断片と説明を確認します。
3. 入力例を追加し、一致すべきものを指定します。
4. 結果を確認してから正規表現をコピーします。

部分一致にはエスケープ済みの短い文脈と強調表示、空の一致には位置マーカーが表示されます。ルールと入力例はブラウザ内にとどまります。アカウント、AI による解釈、アプリケーション用バックエンドは不要です。

現在のワークショップでは、一致を展開するとキャプチャ値とエンジンが返す位置を確認できます。不参加のグループと空文字列のキャプチャは区別され、繰り返しグループには最後の値が表示されます。**Search anywhere** は重ならない一致を最大 100 件表示し、空の一致の後は Unicode コードポイント 1 個分進みます。位置は UTF-16 コード単位で数え、終端は含みません。キャプチャ位置を取得できないエンジンでは、位置を推測せず値だけを表示します。

[![デスクトップ版ワークショップの実際の画面](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=c3ae9d3d6e2d)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

[モバイル画面とチェックサム](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md)。

## 🔄 既存の正規表現から始める

**Already have a regex?** に対応する JavaScript リテラルを貼り付け、Ctrl/Cmd + Enter または **Translate to rules** を使います。`/^[A-Z]{2}-\d{4}$/u` は次のルールになります。

```text
start
2 uppercase letter
"-"
4 digit
end
```

`/` と `u` または `v` を使い、改行は `\n` のようにエスケープしてください。対応する `i`、`s`、`m`、`u` の動作を保持します。現在のソースでは、キャプチャ、入れ子のグループ、後方参照も、名前・番号・値を保持して取り込めます。

`[^]` は `s` 付きの任意の文字になります。隣の通常のドットは改行を明示的に除外し、意味を保ちます。完全な文字・単語・16進数クラスの同等な並び、パスの除外、制御文字のエスケープ、リスト端のリテラルなハイフンも認識します。

非対応の構文を削除したり近似したりはしません。**Go to regex error** で元の位置を選択でき、失敗してもルールとオプションは保持されます。前方参照と未閉鎖キャプチャへの参照は拒否します。空の非キャプチャグループは `0 any character` になり、検索では空に一致しますが、文字列全体モードでは空入力だけが一致します。

## 🍱 最初のレシピ

| レシピ | 例 | 確認する形 |
| --- | --- | --- |
| [接頭辞付き ID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | `ABC123` | 接頭辞と3桁 |
| [請求番号](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | `INV-1234` | `INV-` と2–6桁 |
| [ユーザー名](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | `Alice_7` | 3–16文字、先頭は ASCII 英字 |
| [16進カラー](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | `#12aBcF` | `#` の後に6桁 |
| [MAC アドレス](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=mac-address-shape) | `00:1A:2B:3C:4D:5E` | 6組の16進数 |
| [UUID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=uuid-shape) | `8–4–4–4–12` | 5つの16進数グループ |
| [製品コード](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=product-code-shape) | `AB-rgb-0420` | 固定の文字数と ASCII の大文字・小文字 |
| [日付](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | `2026-09-30` | `YYYY-MM-DD` |
| [時刻](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | `09:30` | `HH:MM` |
| [電話番号](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | `+33123456789` | 任意の `+` と7–15桁 |
| [IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | `192.0.2.42` | 1–3桁の4組 |
| [ファイル名](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | `report.txt` | 区切り文字を除いた長さ制限付き Unicode 名 |
| [マニフェスト](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | パス、ハッシュ、サイズ | 19ルール、9例 |
| [アクセスログ](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | リクエスト、状態、サイズ | 43ルール、8例 |
| [テレメトリ](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | ID、任意の値 | 38ルール、9例 |
| [バージョン](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | `1.2.3` | 3つの数値部分 |
| [文字の除外](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | `xyz` | 選んだ文字を含まないテキスト |
| [行のルール](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | `item 123` | 末尾が3桁以上の行 |
| [小文字のスラッグ](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=slug) | `hello-world` | ASCII 英数字を単一のハイフンで区切る |
| [ファイル拡張子](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=file-extension) | `README.md` | 大文字小文字を区別する txt、md、json の接尾辞 |
| [UTC タイムスタンプの形](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=iso8601-shape) | `2026-10-11T09:30:00Z` | 小数秒は任意。カレンダーの検証は別途必要 |
| [HTTPS URL の形](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=https-url-shape) | `https://example.com` | ASCII ホストの部分集合。完全な URL 検証ではない |
| [ヘッダーフィールド](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=http-header) | `Content-Type: application/json` | 名前付きフィールドと1行の値 |
| [Markdown 見出し](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=markdown-heading) | `# Hello` | 1～6個の # と見出し |
| [SemVer 2.0 構文](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | `1.2.3-alpha.1+001` | コア、プレリリース、ビルドの構文。優先順位比較は行わない |
| [Git ハッシュの形](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=git-object-hash) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` | 40桁または64桁の ASCII 16進数。存在確認は別途必要 |
| [単語の繰り返し](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | `hello hello` | ASCII 単語への名前付き後方参照 |
| [隣接する重複](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=duplicate-token) | `item,item` | コンマで区切った1～16文字のトークンのペア |
| [Unicode 文字](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=unicode-word) | `العربية / اردو` | アラビア語とウルドゥー語を含むネイティブ L/M プロパティ |
| [ログのフィールド](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | `INFO code=200` | 検索した断片から level と code を抽出 |
| [検索と置換](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=replace-word) | `teh then teh → the then teh` | 位置、キャプチャ、g なしの置換を厳密に検証 |

ライブラリには **31 レシピ、24 カテゴリ、3 難易度**があります。4つの UI 言語でタイトル、制限、ルールを検索し、フィルターを組み合わせられます。[ガイド](../EXAMPLE_LIBRARY.md)を参照してください。

失敗した例には[検証可能な説明](../FAILURE_EXPLANATIONS.md)が表示されます。ネイティブの一致範囲、証明できる最小長、必須リテラルの欠落を示し、正確な失敗箇所が不明な場合はその旨を明記します。

[初級・中級・上級の説明](../EXPLANATION_LEVELS.md)を選べます。注釈で正規表現の用語を説明し、上級ではソース範囲、キャプチャ、解決済み参照とフラグを示します。レベルを変えても作業内容を保持し、一致検索は再実行しません。

これらは**形の検査**です。存在しない日付や `25:99` も一致します。IPv4 の各値は255以下に制限されず、UUID のバージョン・バリアント・一意性も検査しません。ユーザー名の空き、請求記録、電話番号の有効性、カレンダー、ファイルシステムの制約は別途確認してください。単純なバージョン形式は完全な SemVer ではなく、色は `#RRGGBB` のみです。

## 🏗️ 大きなパターンも読みやすく

[詳しいガイド](../COMPLEX-EXAMPLES.md)では、アクセスログ、テレメトリ、マニフェスト、複数行の注文を扱います。受理・拒否の35例と、すべての断片の説明があります。

### 📦 アーティファクトのマニフェスト

任意の `nightly/`、長さ制限付き Unicode パス、バージョン、アーカイブ名、ハッシュ、サイズをタブで区切ります。

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

ファイルの存在や実際の整合性は検証しません。

### 🧾 複数行の注文

ID、Unicode の購入者、電話、数量、金額、参照、任意の承認値、任意の優先度行を組み合わせます。

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

改行はリテラルです。金額や注文の妥当性はアプリケーションが検証します。ガイドの4つの平坦な例はフィールドを抽出しません。

## 🧲 名前付きキャプチャでフィールドを抽出する

この例は npm `0.1.0-dev.12` と公開ワークショップで動作します。

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

`capture {` は番号付きキャプチャ、`group {` は非キャプチャのグループです。名前は一意な JavaScript 識別子で、番号は入れ子も含めた開始順です。不参加の任意キャプチャは `undefined`、参加した空のキャプチャは `""`、繰り返したキャプチャは最後の値を返します。

グループを閉じた後の `same as capture "word"` または `same as capture 1` は同じテキストを要求します。[例](../LANGUAGE.md#capture-references)は `cat cat` に一致し、`cat dog` には一致しません。前方参照や対象内部の参照には診断を返します。逆変換でも対応するキャプチャを保持します。抽出した日付はカレンダーで検証してください。

## 🧩 早見表

1行に1命令。リテラル文字列は引用符で囲みます。

| ルール | 結果 | 意味 |
| --- | --- | --- |
| `start` / `end` | `^` / `$` | 入力の境界 |
| `line start` / `line end` | `^` / `$` と `m` | 行の境界 |
| `digit` / `not digit` | `\d` / `\D` | ASCII 数字とその補集合 |
| `3 digits` / `digits` | `\d{3}` / `\d+` | 3桁、または1桁以上 |
| `between 2 and 4 digits` | `\d{2,4}` | 両端を含む |
| `optional "-"` | `-{0,1}` | 任意のハイフン |
| `letter` / `letters` | `[A-Za-z]` / `[A-Za-z]+` | ASCII 英字 |
| `lowercase letters` / `uppercase letters` | `[a-z]+` / `[A-Z]+` | `i` で区別を無視 |
| `6 hex digits` | `[0-9A-Fa-f]{6}` | 16進数6桁 |
| `space` / `spaces` | `\s` / `\s+` | 改行を含む空白 |
| `between 1 and 32 path segment characters` | 1–32コードポイント | 区切り、NUL、改行を除外 |
| `"hello"` | `hello` | エスケープされたリテラル |
| `one of: a, b` | `[ab]` | リスト中の1文字 |
| `text without: a, b` | `[^ab]*` | リスト以外の0文字以上 |
| `any text` | `.*` | `s` で改行も含む |

`word character` / `word characters` と `word` / `not word` は `\w` / `\W` に従い、`_` を含み `é` を含みません。`letter` は数字とアンダースコアを除きます。`i` では JavaScript の同値文字 `K`、`ſ` なども加わります。既定は `u` で、ソース版は `v` も受け付けます。どちらも ASCII クラスを Unicode 全体の分類には変えません。

## 💻 ターミナルで使う

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

クローンしたソースからも使えます。

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

```text
/^ABC\d{3}$/u
```

✅ `ABC123` · ❌ `ABC12`、`ABC1234`、`abc123`

| オプション | 動作 |
| --- | --- |
| `--explain` | 断片と説明 |
| `--json` | stdout に結果、stderr にエラー |
| `--ignore-case` | `i` |
| `--dot-all` | `s` |
| `--flags` | JavaScript のフラグを指定。u/v は同時に使えません |
| `--help` | ヘルプ |
| `--target` | 指定言語に出力。[エンジン](../LANGUAGE.md#engine-exports)を参照 |
| `--version` | パッケージのバージョン |

UTF-8 ファイルか stdin を読みます。`-` で始まるファイル名の前には `--` を使います。終了コードは成功・ヘルプ・バージョンが `0`、ルールや入出力のエラーが `1`、引数エラーが `2` です。

不正な UTF-8 は黙って置換せず拒否します。JSON は診断コードを保持し、引数には `CLI_USAGE`、ファイル・実行時には `CLI_ERROR` を使います。制御文字は可視エスケープで表示され、JSON を復号すると元の値に戻ります。stderr への書き込みに失敗しても終了コードは非ゼロです。

JSON 診断には `endColumn` が含まれることがあります。同じ行の UTF-16 単位で 1 から数えた終端列で、その列自体は含みません。ワークショップは特定できた範囲全体を強調して選択します。範囲がないエラーでも、開始位置への移動は引き続き使えます。

### 🔄 CLI の逆変換

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

`--reverse --json` は `regexToRules()` と同じ `{ rules, flags }` を返します。ネイティブなオプションとカーソルの動作を保つため、返された `flags` を `compile(rules, { flags })` に渡してください。8 個すべてのフラグに対応し、g/y の正規表現は状態を持ちます。

## 📦 JavaScript ライブラリ

ESM（`.mjs` または `"type": "module"`）を使います。TypeScript 型は同梱されています。ソースでは `./index.js` を import します。

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

`toRegExp({ source, flags })` はキャッシュ済みメタデータを受け取り、両方を文字列として要求し、segments を読みません。`compile("digit", { flags: undefined })` は `u` を使い、`exactOptionalPropertyTypes` にも対応します。

`regexToRules()` は別コンテキストの本物の正規表現も受け取り、`lastIndex` を保持します。ネイティブなメタデータを読み、インスタンスの上書きやマッチングメソッドは呼びません。`\u{00000041}` のようなエスケープもソース長制限内で使えます。

## 🎛️ フラグの意味

| フラグ | 有効化 | 効果 |
| --- | --- | --- |
| `u` | 既定 | Unicode コードポイント |
| `i` | `{ flags: 'i' }` または `--ignore-case` | JavaScript の大文字・小文字同値比較 |
| `s` | `{ flags: 's' }` または `--dot-all` | ドットが改行にも一致 |
| `m` | `line start` / `line end` | 行ごとのアンカー |
| `d` | `{ flags: 'd' }` | ネイティブな一致とキャプチャの位置 |
| `g` | `{ flags: 'g' }` | 繰り返し呼び出すと `lastIndex` が進む |
| `y` | `{ flags: 'y' }` | `lastIndex` で一致し、最初の隙間で停止 |
| `v` | `{ flags: 'v' }` | ネイティブ v モードの Unicode クラスと補集合 |

**プレビュー版：** 8 個のフラグ `d`、`g`、`i`、`m`、`s`、`u`、`v`、`y` を `{ flags: 'dgiv' }` または `--flags dgiv` で指定できます。出力順は `dgimsuvy` です。重複と u/v の併用はエラーになり、既定は u です。m は明示指定または行アンカーで有効になります。混在しても入力アンカーは絶対境界を保ちます。逆変換はオプションを保持し、`lastIndex` を変更しません。Workshop は各例を 0 から開始し、最大 100 件を表示します。コピーした g/y 正規表現は状態を持ちます。ネイティブ機能の不足は明示的な診断になります。npm `0.1.0-dev.12` で利用できます。

**プレビュー版：**`v` を選ぶと `one of strings: "a", "ab", ""` や `unicode property "RGI_Emoji"` を使えます。ネイティブ集合はリスト順に関係なく長い要素から試します。後続のルールに応じて短い要素へ戻ることがあります。空文字列も使えます。クラス内では `string "ab"` を使います。文字列プロパティと、空または複数コードポイントの要素は補集合にできません。npm `0.1.0-dev.12` で利用できます。

**プレビュー版：**入れ子の集合には `character set union {`、`character set intersection {`、`character set subtraction {` を使い、`}` で閉じます。各行は文字、範囲、クラス、プロパティ、文字列集合、または入れ子の集合を表します。積集合は共通の要素を残し、差集合は最初のオペランドから右側の要素を除きます。回数指定と `lazy` はブロック全体に適用されます。`not` はネイティブの文字列に関する構造上の制約に従います。空の和集合は何にも一致しません。`v` を選択してください。npm `0.1.0-dev.12` で利用できます。[構文と例](../LANGUAGE.md#nested-unicode-set-operations)。

**グループ内のローカルフラグ。** `group with flags "i" {` を開き、中に `"hello"` を置いて `}` で閉じると、`(?i:hello)` を生成します。このグループは `HELLO` に一致しますが、後続のルールの大小文字の扱いは変わりません。`"im-s"` はグループ内で大小文字を無視する比較と行アンカーを有効にし、dot-all を無効にします。入れ子のグループを抜けると外側の設定に戻ります。ブロック内にキャプチャを置くこともできます。[構文と例](../LANGUAGE.md#scoped-flags-unreleased)。

**実行先のランタイムを確認してください。** 構文を受け付けるだけでは不十分です。検証した Chrome、Firefox、WebKit の Unicode モードはテストを通過しています。Node 22 は構文に対応せず、検証した Node 25/26 にはネイティブのマッチング不具合があるため、コンパイルは `UNSUPPORTED_TARGET_FEATURE` を返します。キャッシュしたメタデータを使う `toRegExp({ source, flags })` も、ネイティブ構築後に指定モードでのローカル動作を確認します。不正なネイティブ構文では `SyntaxError` を維持します。未対応のグループを近似変換することはありません。公開済みのバージョンは[配布記録](../DISTRIBUTION.md)を確認してください。

## 🛠️ ローカル開発

```sh
npm ci
npm run build
npm run serve
```

**http://127.0.0.1:4174/** を開きます。`npm run serve -- 0` は空きポートを選びます。ディレクトリへのリダイレクトはクエリを保持し、末尾の `/` を追加します。

Chrome がインストールされている場合：

```sh
npm ci
npm exec -- playwright install firefox webkit
npm run verify
```

Chrome がなければ Playwright の Chromium を使います。

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

書式、lint、型、リンク、Node、Pages ビルド、クリーンな利用側へのインストール、ブラウザ、監査を確認します。`CI=1` はローカルのブラウザ選択であり、無効の GitHub Actions を有効化しません。

## 🧭 制限を理解する

選択は編集可能な `either { … }` ブロックになります。各直接の項目を一つの候補として順番に試します。複数のルールを一つの候補にする場合や空の候補には `group { … }` を使います。

対象は **JavaScript `RegExp`** です。生の正規表現をルールとして渡したり、自由な英文を使ったりはできません。逆変換は文書化された範囲のみです。自由な英語、u モードの空の文字クラス、前方参照や未閉鎖グループへの参照は未対応です。ワークショップの worker には期限がありますが、コピーした正規表現には利用側の対策が必要です。[セキュリティモデル](../SECURITY_MODEL.md)を参照してください。

## 💬 よくある質問

**AI ですか？** いいえ。決定的なパーサー、AST、コンパイラ、構造に基づく説明を使います。

**すべての正規表現を変換できますか？** いいえ。非対応の構文は削除せずエラーにします。

**例が成功すれば安全ですか？** いいえ。選んだ動作を確認するだけで、すべての経路や実行コストを証明しません。

**文字クラスは Unicode 全体ですか？** いいえ。`digit` は ASCII、`letter` は `[A-Za-z]`、`word` は `\w` です。

**上限は？** UTF-16 の16,384単位、200行、有限の繰り返し回数1,000、深さ64。例は100件、各2,048単位、worker の期限は1,200 ms。絵文字は通常 UTF-16 の2単位です。

結果のバッチ全体にも上限があります。マッチは1,000件、キャプチャは20,000件、結果テキストは UTF-16 の1,048,576単位までです。出力が大きすぎると実行全体を停止しますが、ルールと例は引き続き編集できます。

**オフラインで使えますか？** ライブラリと CLI はローカルです。依存関係の導入後はワークショップもローカルでビルド・配信できます。PWA やオフラインキャッシュは提供すると主張していません。

**問題の報告先は？** [GitHub issues](https://github.com/OthmaneBlial/Regex-For-Humans/issues)にルール、フラグ、入力、期待結果、エンジン版を添えてください。セキュリティは [SECURITY.md](../../SECURITY.md) の非公開手順を使います。

## 🗺️ プロジェクトを詳しく見る

| ガイド | 内容 |
| --- | --- |
| [言語](../LANGUAGE.md) | 文法、グループ、参照、診断 |
| [複雑な例](../COMPLEX-EXAMPLES.md) | 4形式の説明 |
| [構成](../ARCHITECTURE.md) | パーサー → AST → コンパイラ → 各インターフェース |
| [互換性](../COMPATIBILITY.md) | 検証済みの構文とエンジン |
| [テスト](../TESTING.md) | 再現できるコマンドと結果 |
| [セキュリティ](../SECURITY_MODEL.md) | 信頼境界と制限 |
| [配布](../DISTRIBUTION.md) | 公開の証拠 |
| [ロードマップ](../AUTONOMOUS_ROADMAP.md) | 進捗と優先順位 |
| [比較](../COMPETITOR_GAPS.md) | 出典と未対応機能 |
| [貢献](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) | 導入と規約 |

**リリース検証：**[検証記録](../TESTING.md)では、コンパイラと CLI のテスト、Chromium のデスクトップ・モバイル操作、Firefox/WebKit とサイトの確認、独立した JavaScript/TypeScript プロジェクトでのパッケージ利用、依存関係の監査を区別しています。Node 22 での利用側の確認は別途行います。操作性、翻訳、スクリーンリーダーの人による評価は未完了です。

## 構造上のリスクの確認

ローカルのワークショップで **Review the pattern** を開き、入れ子や隣接した可変回数の繰り返し、重なる選択肢、範囲の広いワイルドカード、行のアンカー、大きなパターンを確認できます。ポインターを置くとルール、正規表現の断片、説明、構造図が連動し、カーソルは移動しません。注意事項を選ぶと対応するソース行へ戻ります。ルール、フラグ、レシピ、グループの編集で結果が更新されます。

共通 API `analyze(rules, { flags })` は、正規化されたフラグ、ソース位置と範囲を持つ型付きの注意事項、分析の限界を返します。肯定の文字クラスや範囲に含まれる既知の文字から、一部の重なりを検出します。不明な集合を、互いに重ならないと証明された集合として扱いません。ヒューリスティックな分析なので、処理が重いパターンの見落としや誤検出があり、**指摘がなくても性能上の安全性は証明されません**。マッチの実行やバックトラッキングの計測は行いません。例のマッチングは、引き続き時間制限付きの隔離 worker で実行します。

[構造上のリスクの確認](../LANGUAGE.md#structural-risk-review)を参照してください。

## 構造図

ローカルのワークショップで **Explore the pattern** を開くと、AST に基づくレールロード図で入れ子のグループ、順序付き選択肢、繰り返しのループ、文字を消費しないアサーションを確認できます。ノードにポインターを置くか選択すると、ルール、正規表現の断片、説明が連動します。ホバーではソースのカーソルを動かしません。**Enter/Space** で対応するソース行に戻れます。ソースのカーソル移動や生成された正規表現の選択も構造に連動します。**Actual size** は読みやすいサイズでスクロールでき、**Fit overview** は全体を表示します。**Export SVG** は独立したファイルを保存し、`toSVG(rules, { flags })` でも取得できます。長いラベルの完全な説明はツールチップに残ります。図は構造を示し、実行やバックトラッキングの記録ではありません。[構造図](../LANGUAGE.md#structural-diagrams)を参照してください。

[MIT](../../LICENSE) · [変更履歴](../../CHANGELOG.md) · [英語版に戻る](../../README.md)。
