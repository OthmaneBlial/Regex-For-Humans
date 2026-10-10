<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: lesbare Regeln, echter Regex](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Schreiben. Verstehen. Testen.**

Klare englische Regeln werden zu einem JavaScript-Regex, dessen einzelne Teile nachvollziehbar bleiben.

[🚀 Workshop](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 Website](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 Syntax](../LANGUAGE.md) · [📦 npm-Vorschau](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.4)

🔒 Lokale Ausführung · 🧩 Keine Laufzeitabhängigkeiten · ⚡ Ein Compiler, drei Oberflächen

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · **Deutsch** · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## 🪄 Weniger Zeichen entschlüsseln

Ein Regex wird verständlicher, wenn seine zugrunde liegenden Regeln sichtbar sind.

```text
start "#"
6 hex digits
end
```

```js
/^#[0-9A-Fa-f]{6}$/u
```

✅ `#12aBcF`, `#000000` · ❌ `#123`, `#G00000`

Der Wortschatz ist **fest definiert**. Bibliothek, CLI und Workshop verwenden denselben deterministischen Compiler. Unbekannte Anweisungen erhalten eine Diagnose mit Zeile, Spalte und Korrekturhinweis. Die Regelsyntax bleibt in allen Übersetzungen Englisch.

> 🌱 Die Vorschau `0.1.0-dev.4` benötigt für Bibliothek und CLI **Node.js 22+**. Der Workshop läuft ohne Installation. Menschliche Tests zur Bedienbarkeit und mit Screenreadern stehen noch aus.

## 🧰 Was heute möglich ist

| Fähigkeit | npm `0.1.0-dev.4` | Aktueller Quellcode |
| --- | --- | --- |
| Regeln → JavaScript-Regex | ✅ | ✅ |
| Unterstützter Regex → bearbeitbare Regeln | ✅ | ✅ Einschließlich unterstützter Gruppen und Referenzen |
| Erklärungen und Navigation zur Quellregel | ✅ | ✅ Auch Gruppenanfang/-ende und Referenzen |
| CLI, ESM-API und TypeScript-Typen | ✅ | ✅ |
| Benannte/nummerierte Captures und verschachtelte Blöcke | ✅ | ✅ |
| Blockwiederholungen und Rückverweise | ✅ | ✅ |
| Geordnete Alternativen mit `either { … }` | ✅ | ✅ Verschachtelte Auswahl und Rückübersetzung |
| Nicht gierige Wiederholung mit `lazy` | — | ✅ Im Quellcode; noch nicht veröffentlicht |
| Lookarounds | — | Geplant; derzeit abgelehnt |
| Andere Engines und freie englische Sätze | — | Außerhalb der aktuellen Sprache |

Im Quellcode erzeugt `lazy digits` den Ausdruck `\d+?`: zuerst eine Ziffer versuchen, dann bei Bedarf für die folgenden Regeln mehr Wiederholungen. Diese Ergänzung ist noch nicht in npm `0.1.0-dev.4` enthalten. Siehe [Wiederholungsregeln](../LANGUAGE.md#repetition).

npm `0.1.0-dev.4` enthält Gruppen, Captures, Rückreferenzen und geordnete Alternativen in Bibliothek und CLI. Der Workshop ergänzt Capture-Ansichten und mehrere Suchtreffer. Siehe [Kompatibilität](../COMPATIBILITY.md) und [Veröffentlichungsnachweise](../DISTRIBUTION.md).

## 📦 Vorschau installieren

```sh
npm install regex-for-humans@preview
```

CLI ohne globale Installation:

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

Ausgabe: `/^ABC\d{3}$/u`. Für eine feste Version verwende `regex-for-humans@0.1.0-dev.4`. Es gibt keine Laufzeitabhängigkeiten oder eigenständigen Betriebssystem-Binärdateien.

## 🎮 Mit einem Muster arbeiten

1. Rezept auswählen oder eine Anweisung pro Zeile schreiben.
2. Generierte Fragmente und Erklärungen nachvollziehen.
3. Beispiele hinzufügen und erwartete Treffer kennzeichnen.
4. Regex kopieren, sobald das Verhalten stimmt.

Teiltreffer zeigen einen maskierten Kontext mit Hervorhebung; leere Treffer erhalten eine Markierung. Regeln und Beispiele bleiben im Browser. Kein Konto, keine KI-Auslegung, kein Anwendungsbackend.

Öffne im aktuellen Workshop einen Treffer, um Capture-Werte und native Positionen zu sehen. Nicht beteiligte Gruppen und leere Captures bleiben verschieden; wiederholte Gruppen zeigen ihren letzten Wert. **Search anywhere** listet bis zu 100 nicht überlappende Treffer und rückt nach einem leeren Treffer um einen Unicode-Codepunkt weiter. Positionen zählen UTF-16-Einheiten; das Ende ist ausgeschlossen. Ohne native Capture-Indizes werden Werte ohne abgeleitete Positionen angezeigt.

[![Echter Screenshot des Desktop-Workshops](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=e1a2f3784e8c)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

[Mobile Ansicht und Prüfsummen](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md).

## 🔄 Schon einen Regex vorhanden?

Ein unterstütztes JavaScript-Literal unter **Already have a regex?** einfügen. Ctrl/Cmd + Enter oder **Translate to rules** wandelt `/^[A-Z]{2}-\d{4}$/u` um:

```text
start
2 uppercase letter
"-"
4 digit
end
```

Das Literal benötigt `/` und `u`; Zeilenumbrüche als `\n` schreiben. Unterstütztes Verhalten von `i`, `s`, `m` und `u` bleibt erhalten. Der Quellcode importiert auch Captures, verschachtelte Gruppen und Rückverweise mit unveränderten Namen, Nummern und Werten.

`[^]` wird zu einem beliebigen Zeichen mit `s`. Benachbarte gewöhnliche Punkte schließen Zeilentrenner ausdrücklich aus. Gleichwertige vollständige Buchstaben-, Wort- und Hexklassen, Pfadausschlüsse, Steuerzeichen-Escapes und wörtliche Randbindestriche werden erkannt.

Unbekannte Syntax wird weder entfernt noch angenähert. **Go to regex error** markiert die Quellposition; vorhandene Regeln und Optionen bleiben erhalten. Vorwärtsverweise und Referenzen auf offene Gruppen werden abgelehnt. Eine leere nicht erfassende Gruppe wird zu `0 any character`: leerer Suchtreffer, im Ganztextmodus nur leere Eingabe.

## 🍱 Rezepte für den Einstieg

| Rezept | Beispiel | Prüfung |
| --- | --- | --- |
| [ID mit Präfix](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | `ABC123` | Präfix und drei Ziffern |
| [Rechnungsnummer](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | `INV-1234` | `INV-` und 2–6 Ziffern |
| [Benutzername](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | `Alice_7` | 3–16 Zeichen, ASCII-Buchstabe zuerst |
| [Hexfarbe](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | `#12aBcF` | Sechs Hexziffern nach `#` |
| [MAC-Adresse](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=mac-address-shape) | `00:1A:2B:3C:4D:5E` | Sechs Hexpaare |
| [UUID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=uuid-shape) | `8–4–4–4–12` | Fünf Hexgruppen |
| [Produktcode](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=product-code-shape) | `AB-rgb-0420` | Feste ASCII-Schreibweise und Anzahl |
| [Datum](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | `2026-09-30` | Form `YYYY-MM-DD` |
| [Uhrzeit](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | `09:30` | Form `HH:MM` |
| [Telefonnummer](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | `+33123456789` | Optionales `+`, 7–15 Ziffern |
| [IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | `192.0.2.42` | Vier Gruppen mit 1–3 Ziffern |
| [Dateiname](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | `report.txt` | Begrenzter Unicode-Stamm ohne Trennzeichen |
| [Manifest](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | Pfad, Hash, Größe | 19 Regeln und neun Beispiele |
| [Zugriffslog](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | Anfrage, Status, Größe | 43 Regeln und acht Beispiele |
| [Telemetrie](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | IDs, optionale Felder | 38 Regeln und neun Beispiele |
| [Version](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | `1.2.3` | Drei Zahlenteile |
| [Ausschlüsse](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | `xyz` | Text ohne ausgewählte Zeichen |
| [Zeilenregel](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | `item 123` | Endet mit mindestens drei Ziffern |

Es sind **Formprüfungen**. Ungültige Daten und `25:99` können passen; Kalender und Wertebereiche separat prüfen. IPv4 begrenzt Oktette nicht auf 255. UUID prüft weder Version, Variante noch Eindeutigkeit. Benutzerverfügbarkeit, Rechnungsregister und Telefonnummerngültigkeit bleiben extern. Die Versionsform ist kein vollständiges SemVer; Farben erfordern `#RRGGBB`. Dateisystemregeln sind separat.

## 🏗️ Größere Muster, weiterhin lesbare Regeln

Der [ausführliche Leitfaden](../COMPLEX-EXAMPLES.md) erklärt Zugriffslog, Telemetrie, Manifest und mehrzeilige Bestellung: 35 positive/negative Fälle und jedes generierte Fragment.

### 📦 Artefaktmanifest

Optionales `nightly/`, begrenzter Unicode-Pfad, Version, Archiv, Hash und Größe, mit Tabulatoren getrennt:

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

Dateiexistenz und tatsächliche Integrität werden nicht geprüft.

### 🧾 Mehrzeilige Bestellung

ID, Unicode-Käufer, Telefon, Menge, Betrag, Referenz, optionale Freigabe und vollständig optionale Prioritätszeile:

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

Zeilenumbrüche sind wörtliche Zeichen. Die Anwendung validiert Beträge, Telefonnummern und Bestellungen. Die vier flachen Beispiele extrahieren keine Felder.

## 🧲 Felder mit benannten Captures extrahieren

Dieses Beispiel funktioniert mit npm `0.1.0-dev.4` und im veröffentlichten Workshop.

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

`capture {` erzeugt eine nummerierte Capture, `group {` gruppiert ohne Erfassung. Namen sind eindeutige JavaScript-Bezeichner. Nummern folgen der Öffnungsreihenfolge, auch bei Verschachtelung. Eine nicht beteiligte optionale Capture ergibt `undefined`, eine beteiligte leere Capture `""`; Wiederholungen behalten den letzten Wert.

Nach der schließenden Klammer fordert `same as capture "word"` oder `same as capture 1` denselben Text. Das [Beispiel](../LANGUAGE.md#capture-references) akzeptiert `cat cat`, nicht `cat dog`. Vorwärtsverweise und Verweise innerhalb ihres Ziels erhalten eine Diagnose. Die Rückübersetzung erhält unterstützte Capture-Werte; ein extrahiertes Datum braucht weiterhin Kalenderprüfung.

## 🧩 Spickzettel

Eine Anweisung pro Zeile; wörtlicher Text in Anführungszeichen.

| Regel | Ergebnis | Bedeutung |
| --- | --- | --- |
| `start` / `end` | `^` / `$` | Eingabegrenzen |
| `line start` / `line end` | `^` / `$` und `m` | Zeilengrenzen |
| `digit` / `not digit` | `\d` / `\D` | ASCII-Ziffer oder Komplement |
| `3 digits` / `digits` | `\d{3}` / `\d+` | Drei oder mindestens eine |
| `between 2 and 4 digits` | `\d{2,4}` | Grenzen eingeschlossen |
| `optional "-"` | `-{0,1}` | Optionaler Bindestrich |
| `letter` / `letters` | `[A-Za-z]` / `[A-Za-z]+` | ASCII-Buchstaben |
| `lowercase letters` / `uppercase letters` | `[a-z]+` / `[A-Z]+` | `i` ignoriert den Unterschied |
| `6 hex digits` | `[0-9A-Fa-f]{6}` | Sechs Hexziffern |
| `space` / `spaces` | `\s` / `\s+` | Whitespace, auch Zeilenumbrüche |
| `between 1 and 32 path segment characters` | 1–32 Codepoints | Ohne Trennzeichen, NUL oder Zeilenumbrüche |
| `"hello"` | `hello` | Maskierter wörtlicher Text |
| `one of: a, b` | `[ab]` | Ein Listenzeichen |
| `text without: a, b` | `[^ab]*` | Null oder mehr andere Zeichen |
| `any text` | `.*` | Mit `s` auch Zeilenumbrüche |

`word character` / `word characters` und `word` / `not word` folgen `\w` / `\W`: `_` gehört dazu, `é` nicht. `letter` schließt Ziffern und Unterstrich aus. Mit `i` kommen native JavaScript-Äquivalente wie `K` und `ſ` hinzu. `u` ist immer aktiv, macht ASCII-Klassen aber nicht zu universellen Unicode-Kategorien.

## 💻 Im Terminal verwenden

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

Oder aus einem Clone:

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

```text
/^ABC\d{3}$/u
```

✅ `ABC123` · ❌ `ABC12`, `ABC1234`, `abc123`

| Option | Wirkung |
| --- | --- |
| `--explain` | Fragmente und Erklärungen |
| `--json` | Ergebnisse auf stdout, Fehler auf stderr |
| `--ignore-case` | Flag `i` |
| `--dot-all` | Flag `s` |
| `--help` | Hilfe |
| `--version` | Paketversion |

UTF-8-Datei oder stdin lesen. Vor Dateinamen mit `-` ein `--` setzen. Exitcodes: `0` Erfolg/Hilfe/Version, `1` ungültige Regeln oder E/A-Fehler, `2` ungültige Argumente.

Fehlerhaftes UTF-8 wird ohne stillen Ersatz abgelehnt. JSON erhält Diagnosecodes, `CLI_USAGE` bei Argumentfehlern und `CLI_ERROR` bei Datei-/Laufzeitfehlern. Steuerzeichen werden sichtbar maskiert; JSON-Dekodierung stellt die Daten wieder her. Auch bei defektem stderr ist der Exitcode ungleich null.

### 🔄 Rückübersetzung im CLI

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

`--reverse --json` liefert `{ rules, flags }`. `flags` an `compile()` weitergeben; `m` kommt aus Zeilenankern, `u` automatisch. Textausgabe meldet nötige Optionen auf stderr bei erfolgreichem Exitcode. Nicht mit `--explain`, `--ignore-case` oder `--dot-all` kombinieren.

## 📦 JavaScript-Bibliothek

ESM verwenden (`.mjs` oder `"type": "module"`). TypeScript-Deklarationen sind enthalten. Im Clone `./index.js` importieren.

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

`toRegExp({ source, flags })` akzeptiert zwischengespeicherte Metadaten als Strings und liest keine Segmente. `compile("digit", { flags: undefined })` nutzt `u`, auch mit `exactOptionalPropertyTypes`.

`regexToRules()` akzeptiert echte Regex aus anderen Kontexten, verändert `lastIndex` nicht und liest native Metadaten, ohne Matchingmethoden oder Instanzüberschreibungen aufzurufen. Escapes wie `\u{00000041}` bleiben innerhalb des Quelllimits unterstützt.

## 🎛️ Flags mit klarer Wirkung

| Flag | Aktivierung | Wirkung |
| --- | --- | --- |
| `u` | Immer | Unicode-Codepoints |
| `i` | `{ flags: 'i' }` oder `--ignore-case` | Native Groß-/Kleinschreibung ignorieren |
| `s` | `{ flags: 's' }` oder `--dot-all` | Punkt erfasst auch Zeilenumbrüche |
| `m` | `line start` / `line end` | Zeilenanker |

`flags: 'is'` kombiniert beide Optionen. `g`, `y`, `d` und `v` sind keine Compileroptionen. Die Anwendung kann für ihren nativen Regex eigene Ausführungsflags wählen.

## 🛠️ Lokal entwickeln

```sh
npm ci
npm run build
npm run serve
```

**http://127.0.0.1:4174/** öffnen. `npm run serve -- 0` wählt einen freien Port. Verzeichnisweiterleitungen erhalten Parameter und ergänzen den abschließenden Schrägstrich.

Mit installiertem Chrome alle Prüfungen ausführen:

```sh
npm ci
npm exec -- playwright install firefox webkit
npm run verify
```

Ohne Chrome den Playwright-Chromium verwenden:

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

Enthalten sind Formatierung, Lint, Typen, Links, Node, Pages-Build, saubere Paketinstallation, Browser und Audit. `CI=1` wählt nur den lokalen Browser. GitHub Actions bleibt deaktiviert.

## 🧭 Grenzen kennen

Alternativen werden zu bearbeitbaren `either { … }`-Blöcken: Jeder Eintrag ist eine Auswahl, die in Reihenfolge ausprobiert wird. Ein `group { … }`-Block bildet eine Auswahl aus mehreren Regeln oder eine leere Auswahl.

Ziel ist **JavaScript `RegExp`**. Roher Regex als Regel und freie englische Sätze werden nicht akzeptiert. Rückübersetzung ist auf den dokumentierten Teilumfang begrenzt. Lookarounds und Vorwärts-/Offenverweise bleiben abgelehnt. Der Workshop hat einen Worker-Zeitrahmen; kopierte Regex brauchen die Schutzmaßnahmen ihrer Anwendung. Siehe [Sicherheitsmodell](../SECURITY_MODEL.md).

## 💬 Häufige Fragen

**Ist das KI?** Nein: deterministischer Parser, AST, Compiler und strukturierte Erklärungen.

**Wird jeder Regex übersetzt?** Nein. Unbekannte Konstrukte werden nicht durch Entfernen von Captures oder Assertions passend gemacht.

**Beweist ein erfolgreicher Test Sicherheit?** Nein. Er prüft ausgewählte Fälle, nicht sämtliche Pfade oder Laufzeitkosten.

**Decken Klassen ganz Unicode ab?** Nein. `digit` ist ASCII, `letter` ist `[A-Za-z]`, `word` folgt `\w`.

**Welche Limits gelten?** 16.384 UTF-16-Einheiten, 200 Zeilen, begrenzte Wiederholungen bis 1.000 und Tiefe 64; 100 Beispiele mit jeweils höchstens 2.048 Einheiten und 1.200 ms Worker-Zeit. Ein Emoji benötigt meist zwei UTF-16-Einheiten.

**Offline nutzbar?** Bibliothek und CLI laufen lokal. Nach Installation der Abhängigkeiten kann der Workshop lokal gebaut und bereitgestellt werden. Keine PWA oder Offline-Cache-Zusage.

**Fehler melden?** Über [GitHub issues](https://github.com/OthmaneBlial/Regex-For-Humans/issues), mit Regeln, Flags, Eingabe, Erwartung und Engine-Version. Sicherheit privat über [SECURITY.md](../../SECURITY.md).

## 🗺️ Projekt erkunden

| Leitfaden | Inhalt |
| --- | --- |
| [Sprache](../LANGUAGE.md) | Grammatik, Gruppen, Referenzen und Diagnosen |
| [Komplexe Beispiele](../COMPLEX-EXAMPLES.md) | Vier erklärte Formate |
| [Architektur](../ARCHITECTURE.md) | Parser → AST → Compiler → Oberflächen |
| [Kompatibilität](../COMPATIBILITY.md) | Geprüfte Konstrukte und Engines |
| [Tests](../TESTING.md) | Reproduzierbare Befehle und Ergebnisse |
| [Sicherheit](../SECURITY_MODEL.md) | Vertrauensgrenzen und Limits |
| [Distribution](../DISTRIBUTION.md) | Veröffentlichungsnachweise |
| [Roadmap](../AUTONOMOUS_ROADMAP.md) | Fortschritt und Prioritäten |
| [Vergleich](../COMPETITOR_GAPS.md) | Quellen und offene Fähigkeiten |
| [Mitwirken](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) | Einrichtung und Konventionen |

**Lokal am 10. Oktober 2026 geprüft:** 251 Node-Tests, 296 Chromium-Desktop/Mobilprüfungen, 66 Firefox/WebKit-, 64 Websiteprüfungen und eine saubere Paketinstallation; keine Audit-Schwachstellen. Die 16 Gruppen-/Referenz-/Rückübersetzungstests bestehen auch unter Node 22.23.3. Das beschreibt diesen Stand, nicht jeden zukünftigen Browser. Menschliche Reviews bleiben offen.

Lizenz [MIT](../../LICENSE) · [Changelog](../../CHANGELOG.md) · [Zur englischen Fassung](../../README.md).
