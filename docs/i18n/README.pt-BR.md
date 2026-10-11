<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: regras claras, regex de verdade](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Escreva. Entenda. Teste.**

Regras claras em inglês viram uma expressão regular JavaScript que você consegue acompanhar, trecho por trecho.

[🚀 Oficina](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 Site](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 Sintaxe](../LANGUAGE.md) · [📦 Prévia npm](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.6)

🔒 Execução local · 🧩 Sem dependências em tempo de execução · ⚡ Um compilador, três interfaces

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · **Português do Brasil** · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## 🪄 Menos símbolos para decifrar

Um regex fica mais fácil de ler quando você vê as regras que o produziram.

```text
start "#"
6 hex digits
end
```

```js
/^#[0-9A-Fa-f]{6}$/u
```

✅ `#12aBcF`, `#000000` · ❌ `#123`, `#G00000`

O vocabulário é **fixo**, com significado exato para cada instrução. Biblioteca, CLI e oficina compartilham o compilador determinístico. Uma frase desconhecida gera diagnóstico com linha, coluna e orientação. A sintaxe das regras continua em inglês em todas as traduções.

> 🌱 A prévia `0.1.0-dev.6` exige **Node.js 22+** na biblioteca e no CLI. A oficina funciona sem instalação. As avaliações humanas de usabilidade e leitor de tela continuam pendentes.

## 🧰 O que você pode construir hoje

| Recurso | npm `0.1.0-dev.6` / workshop hospedado |
| --- | --- |
| Regras → regex JavaScript | ✅ |
| Regex compatível → regras editáveis | ✅ |
| Explicações e navegação até a regra | ✅ |
| CLI, API ESM e tipos TypeScript | ✅ |
| Capturas nomeadas/numeradas e blocos aninhados | ✅ |
| Repetição de blocos e referências a capturas anteriores | ✅ |
| Alternativas ordenadas com `either { … }` | ✅ |
| Repetição não gulosa com `lazy` | ✅ |
| Asserções de antecipação e retrospecção | ✅ |
| Limites de palavra | ✅ |
| [Propriedades Unicode](../LANGUAGE.md#unicode-properties) | ✅ |
| [Classes de caracteres combinadas](../LANGUAGE.md#composable-character-classes) | ✅ |
| [Strings Unicode e conjuntos aninhados](../LANGUAGE.md#nested-unicode-set-operations) | ✅ |
| Os oito flags JavaScript | ✅ |
| [Edição de grupos e destaque de capturas](../LANGUAGE.md#editing-groups) | ✅ |
| [Estrutura interativa e exportação SVG](../LANGUAGE.md#structural-diagrams) | ✅ |
| [Revisão de riscos estruturais](../LANGUAGE.md#structural-risk-review) | ✅ |
| [Exportação de código adaptada ao motor](../LANGUAGE.md#engine-exports) | ✅ |
| Inglês livre | — |

o workshop local oferece **Edit groups and references** para renomear capturas, mudar seu tipo e localizar suas referências. As referências numéricas mantêm seus destinos quando a numeração muda; remover uma captura referenciada é recusado sem alterar as regras. **Highlight** destaca o intervalo nativo de uma captura, mesmo vazia ou fora do texto consumido. A API `editGroup` retorna regras validadas. Veja a [edição de grupos](../LANGUAGE.md#editing-groups).

No código-fonte, `lazy digits` gera `\d+?`: tenta um dígito primeiro e aumenta a repetição se as regras seguintes precisarem. Disponível no npm `0.1.0-dev.6`. Consulte as [regras de repetição](../LANGUAGE.md#repetition).

O código-fonte também aceita `followed by { … }`, `not followed by { … }`, `preceded by { … }`, `not preceded by { … }`. Elas verificam o texto ao redor da posição atual sem consumi-lo. Capturas mantêm valores e posições nativos, inclusive fora do texto consumido; a retrospecção exige um motor compatível. Disponível no npm `0.1.0-dev.6`. Veja as [asserções](../LANGUAGE.md#lookaround-assertions).

O código-fonte aceita `word boundary` (`\b`) e `not word boundary` (`\B`). Essas asserções não consomem caracteres. No JavaScript, caracteres de palavra são letras ASCII, dígitos e sublinhado, além dos equivalentes de maiúsculas e minúsculas com `i`. Isso não faz segmentação de palavras em linguagem natural. Disponível no npm `0.1.0-dev.6`; veja os [limites de palavra](../LANGUAGE.md#word-boundaries).

O código-fonte também aceita `unicode property "L"` e `not unicode property "L"` como `\p{L}` e `\P{L}` nativos. `L` significa Letter; os aliases diferenciam maiúsculas e a classificação usa os dados Unicode do motor. Contagens e `lazy` funcionam normalmente. Com `i`, o complemento nativo no modo `u` pode incluir letras equivalentes em maiúsculas/minúsculas. Disponível no npm `0.1.0-dev.6`; veja [propriedades Unicode](../LANGUAGE.md#unicode-properties).

O código-fonte aceita `range "α" to "ω"` e `character class: digit, "_"`. Uma classe combina literais de um ponto Unicode, intervalos, atalhos no singular e propriedades Unicode; `not character class:` nega a união inteira. Contagens e `lazy` se aplicam à classe. Complementos preservam o comportamento nativo `u`/`i`. Disponível no npm `0.1.0-dev.6`; veja [classes de caracteres](../LANGUAGE.md#composable-character-classes).

O npm `0.1.0-dev.6` inclui grupos, capturas, referências anteriores e alternativas ordenadas na biblioteca e no CLI. A oficina acrescenta inspeção de capturas e múltiplas correspondências de busca. Veja [compatibilidade](../COMPATIBILITY.md) e [publicação](../DISTRIBUTION.md).

## 🌍 Exportar para sua linguagem

abra **Export to a programming language** na oficina local, chame `exportRegex(rules, { target: "python" })` ou execute `node bin/regex-for-humans.js --target python --json rules.txt`. Os nove formatos são JavaScript, TypeScript, Python, Rust, Go, Java, C#, PHP e Ruby. JavaScript/TypeScript mantêm o padrão nativo; os outros destinos traduzem os comportamentos compatíveis a partir da AST antes de gerar o código-fonte com o escape correto.

As comparações do código gerado passam em seis motores nativos; **PHP não tem validação nativa**. Preserve os requisitos e o mapa das capturas: os destinos externos usam nomes `gN`, e uma captura inativa pode estar ausente. A entrada deve ser Unicode bem formado. As opções `d/g/i/y`, propriedades Unicode e comportamentos incompatíveis de asserção, captura ou repetição geram diagnósticos com localização. Baixe o código ou o resultado JSON completo; os exemplos no navegador continuam em JavaScript. Veja os [perfis e limites](../LANGUAGE.md#engine-exports).

## 📦 Instalar a prévia

```sh
npm install regex-for-humans@preview
```

Execute o CLI sem instalação global:

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

A saída é `/^ABC\d{3}$/u`. Para fixar a versão, use `regex-for-humans@0.1.0-dev.6`. Não há dependências de execução nem executáveis independentes por sistema operacional.

## 🎮 Experimentar um padrão

escolha **Interface language** para inglês, chinês simplificado, espanhol ou francês. Rótulos, exemplos, resultados e controles de navegação mudam sem alterar regras, entradas, seleções, painéis abertos ou código gerado. A escolha é salva localmente quando o armazenamento está disponível. As regras continuam em inglês controlado; explicações do compilador, rótulos do diagrama e requisitos técnicos exportados permanecem em inglês. Veja [a localização do workshop](../ARCHITECTURE.md#workshop-localization).

use **Theme** para seguir a aparência do sistema ou escolher um workshop claro ou escuro. A preferência é salva localmente quando o armazenamento está disponível; mudar a aparência preserva regras, exemplos, seleções e painéis abertos. Veja [a preferência de tema](../ARCHITECTURE.md#theme-preference).

**Somente no código-fonte:** o editor nativo colore palavras-chave, strings, capturas, quantificadores, asserções, alternativas e comentários. O token indicado pelo compilador é sublinhado; digitação, seleção, cópia e rolagem continuam nativas. Cores forçadas e entradas acima dos limites usam texto nativo simples. Linhas de comentário com `#` mantêm suas posições e contam nos limites habituais. Essas mudanças ainda não estão no npm `0.1.0-dev.6` nem no workshop hospedado. Veja os [comentários](../LANGUAGE.md#comments) e o [realce do editor](../ARCHITECTURE.md#editor-highlighting).

**Somente no código-fonte:** o painel de construção insere modelos editáveis de captura, seção opcional, alternativa, repetição, classe de caracteres e asserção antes da linha ou seleção atual, entre as âncoras externas. Adicionar uma captura mantém os destinos das referências numéricas existentes. Inserções inválidas ou grandes demais preservam as regras e a seleção; flags e exemplos permanecem. Esse painel ainda não está no workshop hospedado dev.6. Veja a [construção de regras](../ARCHITECTURE.md#rule-construction).

**Somente no código-fonte:** as expectativas exatas verificam todos os intervalos UTF-16, os valores de captura em ordem (`null` para ausência, `""` para captura vazia) e os resultados de substituição JavaScript com os flags originais. As fixtures permitem importar/exportar JSON versionado e salvar/restaurar exemplos localmente de forma manual. Rascunhos ou arquivos inválidos preservam o trabalho atual; CR/CRLF importados permanecem exatos até editar o campo do exemplo. Esses controles ainda não estão no dev.6 hospedado. Veja o [formato, os exemplos e os limites das fixtures](../TEST_FIXTURES.md).

1. Escolha uma receita ou escreva uma instrução por linha.
2. Confira cada trecho gerado e sua explicação.
3. Adicione exemplos e indique quais deveriam corresponder.
4. Copie o regex quando o comportamento estiver correto.

Correspondências parciais mostram contexto escapado com destaque; uma correspondência vazia recebe um marcador. Regras e exemplos ficam no navegador. Sem conta, interpretação por IA ou servidor de aplicação.

Na oficina atual, abra uma correspondência para ver as capturas e suas posições nativas. Um grupo ausente e uma captura vazia são distintos; grupos repetidos mostram seu último valor. **Search anywhere** lista até 100 correspondências sem sobreposição e avança um ponto de código Unicode depois de uma correspondência vazia. As posições contam unidades UTF-16, com o fim excluído. Sem índices nativos, os valores aparecem sem posições inferidas.

[![Captura real da oficina no computador](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=e1a2f3784e8c)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

[Visualização móvel e checksums](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md).

## 🔄 Já tem um regex?

Cole um literal JavaScript compatível em **Already have a regex?** e use Ctrl/Cmd + Enter ou **Translate to rules**. `/^[A-Z]{2}-\d{4}$/u` vira:

```text
start
2 uppercase letter
"-"
4 digit
end
```

Use delimitadores `/`, o flag `u` ou `v` e quebras escapadas como `\n`. A conversão preserva os comportamentos compatíveis de `i`, `s`, `m` e `u`. O código atual também importa capturas, grupos aninhados e referências anteriores, mantendo nomes, números e valores.

`[^]` vira um caractere qualquer com `s`; pontos comuns próximos passam a excluir explicitamente os terminadores de linha. Classes completas equivalentes de letras, palavras e hexadecimais são reconhecidas, assim como exclusões de caminho, escapes de controle e hífens literais nas extremidades das listas.

Sintaxe incompatível falha sem ser removida ou aproximada. **Go to regex error** seleciona o ponto na origem; a falha mantém regras e opções. Referências futuras ou a grupos abertos são rejeitadas. Grupo não capturante vazio vira `0 any character`: encontra vazio na busca, mas só aceita entrada vazia no modo de string inteira.

## 🍱 Receitas para começar

| Receita | Exemplo | O que verifica |
| --- | --- | --- |
| [ID com prefixo](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | `ABC123` | Prefixo e três dígitos |
| [Fatura](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | `INV-1234` | `INV-` e 2–6 dígitos |
| [Usuário](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | `Alice_7` | 3–16 caracteres, letra ASCII inicial |
| [Cor hexadecimal](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | `#12aBcF` | Seis dígitos após `#` |
| [Endereço MAC](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=mac-address-shape) | `00:1A:2B:3C:4D:5E` | Seis pares hexadecimais |
| [UUID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=uuid-shape) | `8–4–4–4–12` | Cinco grupos hexadecimais |
| [Produto](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=product-code-shape) | `AB-rgb-0420` | Quantidades e caixa ASCII fixas |
| [Data](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | `2026-09-30` | Forma `YYYY-MM-DD` |
| [Hora](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | `09:30` | Forma `HH:MM` |
| [Telefone](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | `+33123456789` | `+` opcional e 7–15 dígitos |
| [IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | `192.0.2.42` | Quatro grupos de 1–3 dígitos |
| [Arquivo](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | `report.txt` | Nome Unicode limitado, sem separadores |
| [Manifesto](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | Caminho, hash, tamanho | 19 regras e nove exemplos |
| [Log de acesso](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | Requisição, status, tamanho | 43 regras e oito exemplos |
| [Telemetria](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | IDs e campos opcionais | 38 regras e nove exemplos |
| [Versão](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | `1.2.3` | Três partes numéricas |
| [Exclusões](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | `xyz` | Texto sem os caracteres escolhidos |
| [Linha](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | `item 123` | Termina com pelo menos três dígitos |

São verificações de **forma**. Datas impossíveis e `25:99` podem corresponder; valide calendário e intervalos separadamente. IPv4 não limita octetos a 255; UUID não verifica versão, variante ou unicidade. Não consulta disponibilidade de usuários, registros de faturas nem validade de telefones. A versão não é SemVer completo e a cor exige `#RRGGBB`. Regras de sistema de arquivos são independentes.

## 🏗️ Padrões maiores, regras ainda legíveis

O [guia completo](../COMPLEX-EXAMPLES.md) explica quatro formatos: log de acesso, telemetria, manifesto e pedido multilinha, com 35 casos aceitos/rejeitados e todos os trechos explicados.

### 📦 Manifesto de artefatos

Diretório `nightly/` opcional, caminho Unicode limitado, versão, arquivo, hash e tamanho separados por tabulações:

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

Confere a forma, não a existência do arquivo nem a integridade de seu conteúdo.

### 🧾 Pedido multilinha

ID, comprador Unicode, telefone, quantidade, valor, referência, aprovação opcional e linha inteira de prioridade opcional:

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

As quebras de linha são literais. A aplicação valida valores, números e pedidos. Os quatro exemplos sem capturas não extraem campos.

## 🧲 Extrair campos com capturas nomeadas

Este exemplo funciona com npm `0.1.0-dev.6` e na oficina publicada.

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

`capture {` cria uma captura numerada; `group {` agrupa sem capturar. Nomes são identificadores JavaScript únicos. A numeração segue a ordem de abertura, inclusive nos grupos aninhados. Captura opcional ausente vale `undefined`, captura vazia participante vale `""`, e captura repetida guarda o último valor.

Após fechar o grupo, `same as capture "word"` ou `same as capture 1` exige o mesmo texto. O [exemplo](../LANGUAGE.md#capture-references) aceita `cat cat` e rejeita `cat dog`. Referências futuras ou dentro de seu próprio alvo geram diagnóstico. A conversão inversa preserva as capturas compatíveis. Valide a data extraída com um calendário.

## 🧩 Guia de bolso

Uma instrução por linha; texto literal entre aspas.

| Regra | Resultado | Significado |
| --- | --- | --- |
| `start` / `end` | `^` / `$` | Limites da entrada |
| `line start` / `line end` | `^` / `$` e `m` | Limites das linhas |
| `digit` / `not digit` | `\d` / `\D` | Dígito ASCII ou complemento |
| `3 digits` / `digits` | `\d{3}` / `\d+` | Três ou um ou mais |
| `between 2 and 4 digits` | `\d{2,4}` | Limites inclusivos |
| `optional "-"` | `-{0,1}` | Hífen opcional |
| `letter` / `letters` | `[A-Za-z]` / `[A-Za-z]+` | Letras ASCII |
| `lowercase letters` / `uppercase letters` | `[a-z]+` / `[A-Z]+` | `i` ignora a diferença |
| `6 hex digits` | `[0-9A-Fa-f]{6}` | Seis dígitos hexadecimais |
| `space` / `spaces` | `\s` / `\s+` | Espaço em branco, incluindo quebras |
| `between 1 and 32 path segment characters` | 1–32 pontos de código | Sem separadores, NUL ou quebras |
| `"hello"` | `hello` | Texto literal escapado |
| `one of: a, b` | `[ab]` | Um caractere da lista |
| `text without: a, b` | `[^ab]*` | Zero ou mais caracteres fora da lista |
| `any text` | `.*` | Com `s`, inclui quebras |

`word character` / `word characters` e `word` / `not word` seguem `\w` / `\W`: `_` está incluído, `é` não. `letter` exclui dígitos e sublinhado. Com `i`, JavaScript inclui equivalências como `K` e `ſ`. `u` é o padrão; o código-fonte também aceita `v`. Nenhum transforma classes ASCII em categorias Unicode universais.

## 💻 No terminal

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

Ou diretamente de um clone:

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

```text
/^ABC\d{3}$/u
```

✅ `ABC123` · ❌ `ABC12`, `ABC1234`, `abc123`

| Opção | Função |
| --- | --- |
| `--explain` | Trechos e explicações |
| `--json` | Resultados em stdout, erros em stderr |
| `--ignore-case` | Flag `i` |
| `--dot-all` | Flag `s` |
| `--flags` | Selecionar flags nativos de JavaScript; u/v são exclusivos |
| `--help` | Ajuda |
| `--target` | exportar para a linguagem indicada; veja os [perfis](../LANGUAGE.md#engine-exports) |
| `--version` | Versão |

Leia um arquivo UTF-8 ou stdin. Use `--` antes de nomes iniciados por `-`. Saídas: `0` para sucesso/ajuda/versão, `1` para regras inválidas ou falha de E/S, `2` para argumentos inválidos.

UTF-8 malformado é rejeitado, sem substituição silenciosa. JSON conserva os códigos dos diagnósticos, `CLI_USAGE` para argumentos e `CLI_ERROR` para arquivo/execução. Controles são exibidos como escapes; decodificar o JSON recupera os dados. Falha em stderr ainda produz saída diferente de zero.

### 🔄 Conversão inversa pelo CLI

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

`--reverse --json` retorna `{ rules, flags }`, como `regexToRules()`. Passe `flags` para `compile(rules, { flags })` para preservar as opções nativas e o comportamento do cursor. Os oito flags são aceitos; regex com g/y mantêm seu estado.

## 📦 Biblioteca JavaScript

Use ESM (`.mjs` ou `"type": "module"`). Os tipos TypeScript estão incluídos. No clone, importe `./index.js`.

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

`toRegExp({ source, flags })` aceita metadados em cache, ambos como strings, sem ler segmentos. `compile("digit", { flags: undefined })` usa `u`, inclusive com `exactOptionalPropertyTypes`.

`regexToRules()` aceita regex reais de outros contextos, mantém `lastIndex` e lê metadados nativos sem chamar métodos de correspondência ou sobrescritas da instância. Escapes como `\u{00000041}` continuam sujeitos ao limite de fonte.

## 🎛️ Flags com efeitos claros

| Flag | Ativação | Efeito |
| --- | --- | --- |
| `u` | Padrão | Pontos de código Unicode |
| `i` | `{ flags: 'i' }` ou `--ignore-case` | Comparação nativa sem distinguir caixa |
| `s` | `{ flags: 's' }` ou `--dot-all` | Ponto inclui quebras |
| `m` | `line start` / `line end` | Âncoras por linha |
| `d` | `{ flags: 'd' }` | Índices nativos de correspondências e capturas |
| `g` | `{ flags: 'g' }` | Chamadas repetidas avançam `lastIndex` |
| `y` | `{ flags: 'y' }` | Match em `lastIndex`; para na primeira lacuna |
| `v` | `{ flags: 'v' }` | Classes Unicode e complementos nativos no modo v |

**Na prévia:** os oito flags `d`, `g`, `i`, `m`, `s`, `u`, `v`, `y` são aceitos, com `{ flags: 'dgiv' }` ou `--flags dgiv`. A saída usa `dgimsuvy`; duplicatas e u/v juntos são rejeitados, e u é o padrão. m pode ser explícito ou ativado por âncoras de linha; âncoras de entrada continuam absolutas ao misturar os modos. A tradução inversa preserva opções sem alterar `lastIndex`. O workshop começa cada exemplo em 0 e lista até 100 matches; regexes g/y copiados continuam com estado. Recursos nativos ausentes recebem diagnósticos explícitos. Disponível no npm `0.1.0-dev.6`.

**Na prévia:** selecione `v` para `one of strings: "a", "ab", ""` ou `unicode property "RGI_Emoji"`. Os conjuntos nativos tentam primeiro os membros mais longos, independentemente da ordem da lista; regras posteriores podem exigir um membro mais curto. Strings vazias são permitidas. Use `string "ab"` dentro de uma classe. Propriedades de strings e membros vazios ou com vários pontos de código não podem ser complementados. Disponível no npm `0.1.0-dev.6`.

**Na prévia:** conjuntos aninhados usam `character set union {`, `character set intersection {` e `character set subtraction {`, fechados com `}`. Cada linha contém um caractere, intervalo, classe, propriedade, conjunto de strings ou conjunto aninhado. A interseção mantém membros comuns; a subtração remove os membros da direita do primeiro operando. Repetições e `lazy` valem para o bloco inteiro. `not` segue as restrições estruturais nativas para strings; uma união vazia não encontra nada. Selecione `v`; Disponível no npm `0.1.0-dev.6`. [Sintaxe e exemplos](../LANGUAGE.md#nested-unicode-set-operations).

## 🛠️ Desenvolvimento local

```sh
npm ci
npm run build
npm run serve
```

Abra **http://127.0.0.1:4174/**. `npm run serve -- 0` escolhe uma porta livre. Redirecionamentos de diretório preservam parâmetros e acrescentam a barra final.

Com Chrome instalado, execute todos os controles:

```sh
npm ci
npm exec -- playwright install firefox webkit
npm run verify
```

Sem Chrome, use o Chromium do Playwright:

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

Inclui formatação, lint, tipos, links, Node, construção Pages, consumidor limpo, navegadores e auditoria. `CI=1` seleciona o navegador local; não ativa GitHub Actions, que continua desabilitado.

## 🧭 Entender os limites

As alternativas viram blocos editáveis `either { … }`: cada entrada é uma opção, testada na ordem. Use `group { … }` para uma opção com várias regras ou uma opção vazia.

A saída é **JavaScript `RegExp`**. Regex bruto como regra e inglês livre não são aceitos. A conversão inversa usa só o subconjunto documentado. Inglês livre, classes de caracteres vazias no modo u e referências futuras ou a grupos ainda abertos continuam sem suporte. O worker tem prazo; um regex copiado precisa das proteções da própria aplicação. Veja o [modelo de segurança](../SECURITY_MODEL.md).

## 💬 Perguntas frequentes

**Usa IA?** Não: parser determinístico, AST, compilador e explicações estruturadas.

**Converte qualquer regex?** Não. Sintaxe desconhecida falha sem remover capturas ou asserções.

**Um teste aprovado comprova segurança?** Não. Verifica casos escolhidos, não todos os caminhos ou o custo.

**As classes cobrem todo Unicode?** Não. `digit` é ASCII, `letter` é `[A-Za-z]`, `word` segue `\w`.

**Quais limites?** 16.384 unidades UTF-16, 200 linhas, repetições limitadas até 1.000, profundidade 64; 100 exemplos com até 2.048 unidades e prazo de 1.200 ms. Um emoji costuma ocupar duas unidades UTF-16.

**Funciona offline?** Biblioteca e CLI são locais. A oficina pode ser construída e servida após instalar dependências. Não se promete PWA nem cache offline.

**Onde relatar problemas?** Em [GitHub issues](https://github.com/OthmaneBlial/Regex-For-Humans/issues), com regras, flags, entrada, expectativa e versão do motor. Segurança segue [SECURITY.md](../../SECURITY.md) em privado.

## 🗺️ Explorar o projeto

| Guia | Conteúdo |
| --- | --- |
| [Linguagem](../LANGUAGE.md) | Gramática, grupos, referências e diagnósticos |
| [Exemplos complexos](../COMPLEX-EXAMPLES.md) | Quatro formatos explicados |
| [Arquitetura](../ARCHITECTURE.md) | Parser → AST → compilador → interfaces |
| [Compatibilidade](../COMPATIBILITY.md) | Recursos e motores verificados |
| [Testes](../TESTING.md) | Comandos e resultados reproduzíveis |
| [Segurança](../SECURITY_MODEL.md) | Fronteiras de confiança e limites |
| [Distribuição](../DISTRIBUTION.md) | Evidência de publicação |
| [Roadmap](../AUTONOMOUS_ROADMAP.md) | Avanços e prioridades |
| [Comparação](../COMPETITOR_GAPS.md) | Fontes e recursos pendentes |
| [Contribuir](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) | Preparação e convenções |

**Verificado localmente em 11 de outubro de 2026:** passam 1.138 testes: 334 de Node, 478 controles Chromium em desktop e dispositivos móveis, 262 de Firefox/WebKit e 64 do site. As compilações e a instalação em um projeto JavaScript/TypeScript independente também passam; a auditoria não aponta vulnerabilidades. Outra instalação independente passa no Node 22.23.3. Os resultados descrevem esta versão; avaliações humanas de usabilidade e leitores de tela continuam abertas.

## Revisão de riscos estruturais

Abra **Review the pattern** no workshop local para revisar repetições variáveis aninhadas ou adjacentes, alternativas sobrepostas, curingas amplos, âncoras de linha e padrões grandes. Passar o ponteiro conecta regra, fragmento regex, explicação e diagrama sem mover o cursor; selecionar uma nota volta à linha de origem. Alterações em regras, flags, receitas e grupos atualizam a revisão.

A API compartilhada `analyze(rules, { flags })` retorna flags canônicas, notas tipadas com posições e intervalos de origem e limitações explícitas. Caracteres conhecidos de classes e intervalos positivos revelam algumas sobreposições; um conjunto desconhecido não é considerado comprovadamente disjunto. A análise é heurística, pode deixar passar padrões caros ou gerar falsos positivos: **a ausência de notas não comprova segurança de desempenho**. Ela não executa correspondências nem mede backtracking. Os exemplos continuam no worker isolado com limite de tempo.

 Veja o [contrato de revisão estrutural](../LANGUAGE.md#structural-risk-review).

## Diagrama da estrutura

Abra **Explore the pattern** no workshop local para ver um diagrama de trilhos criado a partir da AST: grupos aninhados, alternativas ordenadas, ciclos de repetição e asserções que não consomem texto. Passe o ponteiro ou selecione um nó para conectar regras, fragmentos regex e explicações; passar o ponteiro não move o cursor. **Enter/Espaço** volta à linha de origem. O cursor do editor e a seleção na regex também acompanham a estrutura. **Actual size** mantém rótulos legíveis com rolagem; **Fit overview** mostra o mapa inteiro. **Export SVG** salva um arquivo independente, também disponível por `toSVG(rules, { flags })`. Rótulos longos preservam a explicação completa na dica. O diagrama mostra a estrutura, não a execução ou o backtracking. Veja os [diagramas da estrutura](../LANGUAGE.md#structural-diagrams).

Licença [MIT](../../LICENSE) · [Changelog](../../CHANGELOG.md) · [Voltar ao inglês](../../README.md).
