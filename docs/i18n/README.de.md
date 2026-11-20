<div align="center">

[![Regex For Humans: der Regex ^#[0-9A-Fa-f]{6}$ mit der Bedeutung jedes Fragments in einfachem Englisch darunter](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Regex in einfachem Englisch schreiben. Jeden Regex genauso lesen.**

Kurze englische Regeln werden zu einem nativen JavaScript-`RegExp`, ein sichtbares Fragment pro Regel. Einen Regex einfügen und die Regeln zurückbekommen.

**[Werkstatt ausprobieren](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [Website](https://othmaneblial.github.io/Regex-For-Humans/) · [npm-Vorschau](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.13) · [Syntax](../LANGUAGE.md)**

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · **Deutsch** · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## Regeln schreiben, Regex erhalten

<table>
<tr><th>Regeln</th><th>JavaScript-Regex</th></tr>
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

Jede Zeile hat eine dokumentierte Bedeutung und fügt dem Regex der Reihe nach ein Fragment hinzu. Heraus kommt der Regex, den man von Hand schreiben würde: `?` statt `{0,1}`, keine überflüssigen Gruppen. Eine unbekannte Formulierung bricht mit Zeile, Spalte und einem Korrekturvorschlag ab.

[![Sechs Rezepte nacheinander: Regeln, kompilierter Regex, die Bedeutung jedes Fragments und was es in einem Beispiel getroffen hat](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-reel.svg)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

## Einen Regex zurücklesen

Ein Muster geerbt, das niemand lesen kann? `regexToRules` macht aus einem unterstützten Regex bearbeitbare Regeln, die wieder genau diesen Regex ergeben.

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

Die [Website](https://othmaneblial.github.io/Regex-For-Humans/) erklärt jeden eingefügten Regex direkt vor Ort. Nicht unterstützte Syntax wird mit ihrer Position abgelehnt und nie stillschweigend weggelassen.

## Benennen, was erfasst wird

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

Erfassungen sind native JavaScript-Gruppen. Mit `same as capture "year"` wird derselbe Text noch einmal verlangt.

## Installation

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

Node.js 22+, keine Laufzeitabhängigkeiten, ESM mit TypeScript-Deklarationen. Bibliothek, [Kommandozeile](../CLI.md) und Werkstatt nutzen denselben Compiler. Dies ist eine Vorschau (`0.1.0-dev.13`); die [Werkstatt](https://othmaneblial.github.io/Regex-For-Humans/workshop/) braucht keine Installation.

## Das Vokabular auf einen Blick

| Schreiben | Erhalten |
| --- | --- |
| `start` · `end` | `^` · `$` |
| `3 digits` · `digits` | `\d{3}` · `\d+` |
| `between 2 and 4 letters` | `[A-Za-z]{2,4}` |
| `optional "-"` | `-?` |
| `one of: a, b` | `[ab]` |
| `either { "INFO" "WARN" }` | `(?:INFO\|WARN)` |
| `capture "id" { … }` | `(?<id>…)` |
| `not followed by { "x" }` | `(?!x)` |

Blöcke wie `either { … }` enthalten eine Regel pro Zeile zwischen den Klammern. Der [Sprachleitfaden](../LANGUAGE.md) beschreibt jede Regel, jedes Flag, Unicode-Klassen, Lookarounds und Grenzen.

## 34 Rezepte zum Öffnen

| Rezept | Was es prüft |
| --- | --- |
| [Ein Kalenderdatum prüfen](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=calendar-date) | Monat 01–12, Tag 01–31, erfasst als Jahr, Monat und Tag |
| [Eine IPv4-Adresse prüfen](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-address) | Vier Zahlen von 0 bis 255, ohne führende Nullen |
| [Eine 24-Stunden-Uhrzeit prüfen](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=clock-time) | `00:00` bis `23:59` |
| [SemVer-2.0-Syntax prüfen](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | Kern, Vorabversion und Build-Teil |
| [Benannte Felder aus einem Log lesen](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | Level und Code, mit Namen |
| [Ein wiederholtes Wort finden](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | Ein Wort, dann dasselbe Wort noch einmal |

Jedes Rezept bringt Beispiele mit, die passen und nicht passen müssen, und einen Hinweis, was es nicht prüft. Siehe [alle 34 Rezepte](../RECIPES.md) und vier [komplexe Beispiele](../COMPLEX-EXAMPLES.md) mit **35 akzeptierten oder abgelehnten Fällen**.

## Warum man dem Ergebnis trauen kann

- **Deterministisch.** Ein Parser, kein Modell: dieselben Regeln ergeben immer denselben Regex. Keine KI, kein Netzwerk, keine Telemetrie.
- **Nativ.** Das Ergebnis ist ein gewöhnlicher `RegExp`; beim Suchen läuft nur die Engine. [Exporte](../LANGUAGE.md#engine-exports) nach Python, Rust, Go, Java, C#, PHP und Ruby werden mit diesen Engines verglichen.
- **Ehrlich über Grenzen.** Rezepte sagen, was sie nicht prüfen. Die Werkstatt testet Beispiele in einem zeitbegrenzten Worker; ein kopierter Regex braucht eigene Schutzmaßnahmen ([Sicherheitsmodell](../SECURITY_MODEL.md)).
- **Getestet.** Jedes Rezept und jedes Beispiel dieses README wird von der Testsuite neu kompiliert ([Tests](../TESTING.md)).

[Architektur](../ARCHITECTURE.md) · [Kompatibilität](../COMPATIBILITY.md) · [Mitwirken](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [Änderungen](../../CHANGELOG.md) · [Sicherheit](../../SECURITY.md) · [MIT](../../LICENSE)

<div align="center">

Wenn dir eine Regel hier das Zusammenkneifen der Augen erspart hat, hilft ein ⭐ anderen, das Projekt zu finden.

</div>
