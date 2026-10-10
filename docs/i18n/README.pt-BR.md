<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: regras claras, regex de verdade](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Escreva. Entenda. Teste.**

Regras claras em inglês viram uma expressão regular JavaScript que você consegue acompanhar, trecho por trecho.

[🚀 Oficina](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 Site](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 Sintaxe](../LANGUAGE.md) · [📦 Prévia npm](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.4)

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

> 🌱 A prévia `0.1.0-dev.4` exige **Node.js 22+** na biblioteca e no CLI. A oficina funciona sem instalação. As avaliações humanas de usabilidade e leitor de tela continuam pendentes.

## 🧰 O que você pode construir hoje

| Recurso | npm `0.1.0-dev.4` | Código-fonte atual |
| --- | --- | --- |
| Regras → regex JavaScript | ✅ | ✅ |
| Regex compatível → regras editáveis | ✅ | ✅ Inclui grupos e referências compatíveis |
| Explicações e navegação até a regra | ✅ | ✅ Inclui limites dos grupos e referências |
| CLI, API ESM e tipos TypeScript | ✅ | ✅ |
| Capturas nomeadas/numeradas e blocos aninhados | ✅ | ✅ |
| Repetição de blocos e referências a capturas anteriores | ✅ | ✅ |
| Alternativas ordenadas com `either { … }` | ✅ | ✅ Opções aninhadas e conversão inversa |
| Repetição não gulosa com `lazy` | — | ✅ No código-fonte; ainda não publicada |
| Asserções de antecipação e retrospecção | — | Planejadas; atualmente rejeitadas |
| Outros motores e inglês livre | — | Fora do idioma de regras atual |

No código-fonte, `lazy digits` gera `\d+?`: tenta um dígito primeiro e aumenta a repetição se as regras seguintes precisarem. Esse recurso ainda não está no npm `0.1.0-dev.4`. Consulte as [regras de repetição](../LANGUAGE.md#repetition).

O npm `0.1.0-dev.4` inclui grupos, capturas, referências anteriores e alternativas ordenadas na biblioteca e no CLI. A oficina acrescenta inspeção de capturas e múltiplas correspondências de busca. Veja [compatibilidade](../COMPATIBILITY.md) e [publicação](../DISTRIBUTION.md).

## 📦 Instalar a prévia

```sh
npm install regex-for-humans@preview
```

Execute o CLI sem instalação global:

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

A saída é `/^ABC\d{3}$/u`. Para fixar a versão, use `regex-for-humans@0.1.0-dev.4`. Não há dependências de execução nem executáveis independentes por sistema operacional.

## 🎮 Experimentar um padrão

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

Use delimitadores `/`, o flag obrigatório `u` e quebras escapadas como `\n`. A conversão preserva os comportamentos compatíveis de `i`, `s`, `m` e `u`. O código atual também importa capturas, grupos aninhados e referências anteriores, mantendo nomes, números e valores.

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

Este exemplo funciona com npm `0.1.0-dev.4` e na oficina publicada.

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

`word character` / `word characters` e `word` / `not word` seguem `\w` / `\W`: `_` está incluído, `é` não. `letter` exclui dígitos e sublinhado. Com `i`, JavaScript inclui equivalências como `K` e `ſ`. `u` sempre está ativo, mas não transforma classes ASCII em categorias Unicode universais.

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
| `--help` | Ajuda |
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

`--reverse --json` devolve `{ rules, flags }`. Reutilize `flags` em `compile()`; `m` vem das âncoras de linha e `u` é automático. O texto informa em stderr as opções necessárias sem deixar de ser uma execução bem-sucedida. Não combine o modo inverso com `--explain`, `--ignore-case` ou `--dot-all`.

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
| `u` | Sempre | Pontos de código Unicode |
| `i` | `{ flags: 'i' }` ou `--ignore-case` | Comparação nativa sem distinguir caixa |
| `s` | `{ flags: 's' }` ou `--dot-all` | Ponto inclui quebras |
| `m` | `line start` / `line end` | Âncoras por linha |

`flags: 'is'` combina as opções. `g`, `y`, `d` e `v` não são opções do compilador. A aplicação pode escolher flags ao construir seu regex nativo.

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

A saída é **JavaScript `RegExp`**. Regex bruto como regra e inglês livre não são aceitos. A conversão inversa usa só o subconjunto documentado. Asserções e referências futuras/abertas continuam rejeitadas. O worker tem prazo; um regex copiado precisa das proteções da própria aplicação. Veja o [modelo de segurança](../SECURITY_MODEL.md).

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

**Verificado localmente em 10 de outubro de 2026:** 251 testes Node, 296 controles Chromium desktop/móvel, 66 Firefox/WebKit, 64 do site e um consumidor limpo; zero vulnerabilidades. Os 16 testes de grupos/referências/conversão também passam no Node 22.23.3. São resultados desse snapshot, não garantia para qualquer navegador futuro. Avaliações humanas seguem abertas.

Licença [MIT](../../LICENSE) · [Changelog](../../CHANGELOG.md) · [Voltar ao inglês](../../README.md).
