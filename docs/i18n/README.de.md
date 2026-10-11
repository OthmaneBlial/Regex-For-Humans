<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: lesbare Regeln, echter Regex](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Schreiben. Verstehen. Testen.**

Klare englische Regeln werden zu einem JavaScript-Regex, dessen einzelne Teile nachvollziehbar bleiben.

[🚀 Workshop](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 Website](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 Syntax](../LANGUAGE.md) · [📦 npm-Vorschau](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.9)

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

> 🌱 Die Vorschau `0.1.0-dev.9` benötigt für Bibliothek und CLI **Node.js 22+**. Der Workshop läuft ohne Installation. Menschliche Tests zur Bedienbarkeit und mit Screenreadern stehen noch aus.

## 🧰 Was heute möglich ist

| Fähigkeit | npm `0.1.0-dev.9` / gehosteter Workshop |
| --- | --- |
| Regeln → JavaScript-Regex | ✅ |
| Unterstützter Regex → bearbeitbare Regeln | ✅ |
| Erklärungen und Navigation zur Quellregel | ✅ |
| CLI, ESM-API und TypeScript-Typen | ✅ |
| Benannte/nummerierte Captures und verschachtelte Blöcke | ✅ |
| Blockwiederholungen und Rückverweise | ✅ |
| Geordnete Alternativen mit `either { … }` | ✅ |
| Nicht gierige Wiederholung mit `lazy` | ✅ |
| Lookarounds | ✅ |
| Wortgrenzen | ✅ |
| [Unicode-Eigenschaften](../LANGUAGE.md#unicode-properties) | ✅ |
| [Zusammengesetzte Zeichenklassen](../LANGUAGE.md#composable-character-classes) | ✅ |
| [Unicode-Zeichenfolgen und verschachtelte Mengen](../LANGUAGE.md#nested-unicode-set-operations) | ✅ |
| Alle acht JavaScript-Flags | ✅ |
| [Gruppen bearbeiten und Capture-Bereiche markieren](../LANGUAGE.md#editing-groups) | ✅ |
| [Interaktive Struktur und Export als SVG](../LANGUAGE.md#structural-diagrams) | ✅ |
| [Prüfung struktureller Risiken](../LANGUAGE.md#structural-risk-review) | ✅ |
| [Codeexport mit Anpassung an die Engine](../LANGUAGE.md#engine-exports) | ✅ |
| Freie englische Sätze | — |

Der lokale Workshop bietet **Edit groups and references**, um Captures umzubenennen, ihren Typ zu ändern und ihre Referenzen zu finden. Numerische Referenzen behalten bei einer neuen Nummerierung ihr ursprüngliches Ziel; ein referenziertes Capture lässt sich nicht entfernen, und die Regeln bleiben dabei unverändert. **Highlight** markiert den nativen Eingabebereich, auch bei leeren Captures oder außerhalb des konsumierten Treffers. Die API `editGroup` gibt validierte Regeln zurück. Siehe [Gruppen bearbeiten](../LANGUAGE.md#editing-groups).

Im Quellcode erzeugt `lazy digits` den Ausdruck `\d+?`: zuerst eine Ziffer versuchen, dann bei Bedarf für die folgenden Regeln mehr Wiederholungen. Verfügbar in npm `0.1.0-dev.9`. Siehe [Wiederholungsregeln](../LANGUAGE.md#repetition).

Der Quellcode unterstützt auch `followed by { … }`, `not followed by { … }`, `preceded by { … }`, `not preceded by { … }`. Sie prüfen den Text um die aktuelle Position, ohne Zeichen zu verbrauchen. Captures behalten native Werte und Positionen, auch außerhalb des verbrauchten Treffers; Lookbehind benötigt Laufzeitunterstützung. Verfügbar in npm `0.1.0-dev.9`. Siehe [Lookaround-Assertions](../LANGUAGE.md#lookaround-assertions).

Der Quellcode unterstützt `word boundary` (`\b`) und `not word boundary` (`\B`). Sie verbrauchen keine Zeichen. JavaScript zählt ASCII-Buchstaben, Ziffern und Unterstriche als Wortzeichen; mit `i` kommen entsprechende Unicode-Zeichen durch Groß-/Kleinschreibungsfaltung hinzu. Das ist keine sprachliche Wortsegmentierung. Verfügbar in npm `0.1.0-dev.9`; siehe [Wortgrenzen](../LANGUAGE.md#word-boundaries).

Der Quellcode akzeptiert außerdem `unicode property "L"` und `not unicode property "L"` für natives `\p{L}` und `\P{L}`. `L` bedeutet Letter; Aliase unterscheiden Groß- und Kleinschreibung, die Zuordnung nutzt die Unicode-Daten der Laufzeit. Zählwerte und `lazy` funktionieren wie gewohnt. Mit `i` kann das native Komplement im `u`-Modus auch durch Groß-/Kleinschreibungsfaltung äquivalente Buchstaben umfassen. Verfügbar in npm `0.1.0-dev.9`; siehe [Unicode-Eigenschaften](../LANGUAGE.md#unicode-properties).

Der Quellcode unterstützt `range "α" to "ω"` und `character class: digit, "_"`. Eine Klasse vereint Literale mit genau einem Unicode-Codepunkt, Bereiche, einzelne Kurzformen und Unicode-Eigenschaften; `not character class:` negiert die gesamte Vereinigung. Wiederholungszahlen und `lazy` gelten für die Klasse. Eigenschaftskomplemente behalten die native `u`/`i`-Semantik. Verfügbar in npm `0.1.0-dev.9`; siehe [Zeichenklassen](../LANGUAGE.md#composable-character-classes).

npm `0.1.0-dev.9` enthält Gruppen, Captures, Rückreferenzen und geordnete Alternativen in Bibliothek und CLI. Der Workshop ergänzt Capture-Ansichten und mehrere Suchtreffer. Siehe [Kompatibilität](../COMPATIBILITY.md) und [Veröffentlichungsnachweise](../DISTRIBUTION.md).

## 🌍 In deine Sprache exportieren

Öffne **Export to a programming language** im lokalen Workshop, rufe `exportRegex(rules, { target: "python" })` auf oder führe `node bin/regex-for-humans.js --target python --json rules.txt` aus. Die neun Formate sind JavaScript, TypeScript, Python, Rust, Go, Java, C#, PHP und Ruby. JavaScript/TypeScript behalten das native Muster; andere Ziele übersetzen unterstützte Verhaltensweisen aus dem AST und erzeugen danach korrekt maskierten Quellcode.

Die Vergleiche mit generiertem Code bestehen für sieben native Engines; **PHP ist mit PHP 8.5.11 / PCRE2 10.44 geprüft**. Getestete Versionen und Grenzen des Korpus stehen im [Kompatibilitätsleitfaden](../COMPATIBILITY.md#engine-exports). Bewahre Anforderungen und Capture-Zuordnung auf: andere Engines verwenden Namen wie `gN`, und inaktive Captures können fehlen. Die Eingabe muss wohlgeformtes Unicode sein. Nicht unterstützte Flags (`d/g/i/y`), Unicode-Eigenschaften sowie inkompatible Assertions, Capture- oder Wiederholungsregeln liefern Diagnosen mit Position. Lade Code oder das vollständige JSON herunter; Browserbeispiele laufen weiterhin in JavaScript. Siehe [Profile und Grenzen](../LANGUAGE.md#engine-exports).

## 📦 Vorschau installieren

```sh
npm install regex-for-humans@preview
```

CLI ohne globale Installation:

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

Ausgabe: `/^ABC\d{3}$/u`. Für eine feste Version verwende `regex-for-humans@0.1.0-dev.9`. Es gibt keine Laufzeitabhängigkeiten oder eigenständigen Betriebssystem-Binärdateien.

## 🎮 Mit einem Muster arbeiten

Mit **Interface language** wählst du Englisch, vereinfachtes Chinesisch, Spanisch oder Französisch. Beschriftungen, Beispiele, Testergebnisse und Navigation wechseln, ohne Regeln, Eingaben, Auswahlbereiche, offene Bereiche oder erzeugten Code zu ändern. Die Auswahl wird lokal gespeichert, wenn Speicher verfügbar ist. Regeln bleiben in kontrolliertem Englisch; Compilererklärungen, Diagrammbeschriftungen und exportierte technische Anforderungen bleiben Englisch. Siehe [Workshop-Lokalisierung](../ARCHITECTURE.md#workshop-localization).

Mit **Theme** folgt der Workshop dem Systemdesign oder verwendet ein helles oder dunkles Design. Die Auswahl wird lokal gespeichert, wenn Speicher verfügbar ist; Regeln, Beispiele, Auswahlbereiche und offene Bereiche bleiben beim Wechsel erhalten. Siehe [Designauswahl](../ARCHITECTURE.md#theme-preference).

Der native Regeleditor färbt Schlüsselwörter, Zeichenfolgen, Captures, Quantifizierer, Assertions, Alternativen und Kommentare. Das vom Compiler beanstandete Token wird unterstrichen; Eingabe, Auswahl, Kopieren und Scrollen bleiben nativ. Erzwungene Farben und Eingaben über den Budgets verwenden einfachen nativen Text. Kommentarzeilen mit `#` behalten ihre Quellpositionen und zählen zu den üblichen Budgets. Siehe [Kommentare](../LANGUAGE.md#comments) und [Editor-Hervorhebung](../ARCHITECTURE.md#editor-highlighting).

Das Konstruktionspanel fügt bearbeitbare Vorlagen für Captures, optionale Abschnitte, Alternativen, Wiederholungen, Zeichenklassen und Assertions vor der aktuellen Zeile oder Auswahl innerhalb der äußeren Anker ein. Ein neuer Capture erhält die Ziele bestehender nummerierter Referenzen. Ungültige oder zu große Einfügungen lassen Regeln und Auswahl unverändert; Flags und Beispiele bleiben erhalten. Siehe [Regelkonstruktion](../ARCHITECTURE.md#rule-construction).

Exakte Erwartungen prüfen vollständige UTF-16-Bereiche, Capture-Werte in Nummernreihenfolge (`null` für fehlende Teilnahme, `""` für einen leeren Capture) und JavaScript-Ersetzungsergebnisse mit den ursprünglichen Flags. Test-Fixtures unterstützen versionierten JSON-Import/-Export und manuelles lokales Speichern/Wiederherstellen. Ungültige Entwürfe oder Dateien erhalten die aktuelle Arbeit; importierte CR/CRLF bleiben bis zur Bearbeitung des Beispiels exakt erhalten. Siehe [Fixture-Format, Beispiele und Grenzen](../TEST_FIXTURES.md).

**Teile eine vollständige Werkstatt** mit **Copy share link**: Regeln, Flags, Suchmodus, Beispiele und exakte Erwartungen bleiben in einer URL erhalten. Eine neue Seite stellt sie vor dem Laden der Rezepte wieder her; **Load shared link** ersetzt laufende Arbeit nur ausdrücklich. Bei verweigertem Clipboard-Zugriff bleibt ein Feld zum manuellen Kopieren. Links sind auf 32 KiB begrenzt; größere Testsammlungen verwenden den JSON-Export. Jeder mit dem Link kann den Inhalt lesen: er ist nicht verschlüsselt. Siehe [Teilen und Grenzen](../TEST_FIXTURES.md#share-a-workshop-snapshot).

**Verstehe ein fehlgeschlagenes Beispiel** anhand nativer Bereiche oder notwendiger Mindestlängen, fehlender Pflichtliterale und Literaltext am falschen absoluten Eingaberand. Präfix-/Suffixbeweise gelten für Eingabeanker mit Beachtung der Großschreibung; Zeilenanker und ungewisse Fälle behalten vorsichtige Erklärungen. Die Werkstatt sagt ausdrücklich, wenn der genaue Fehlerschritt unbekannt ist. Das ist keine Backtracking-Aufzeichnung. Siehe [Fehlererklärungen](../FAILURE_EXPLANATIONS.md).

**Springe zum genauen Fehlerbereich** bei ungültigen Escape-Sequenzen in Anführungszeichen, Klassen-/Listeneinträgen, Bereichsenden oder Unicode-Eigenschaftsaliasen. Die Markierung erhält die ursprüngliche Escape-Schreibweise und vollständige Unicode-Paare; ohne bekannten Bereich bleibt die Navigation zur Anfangsposition. Bibliothek und CLI liefern optional `endColumn`, eine exklusive Endspalte in UTF-16-Einheiten. Siehe [Diagnosebereiche](../LANGUAGE.md#errors-and-future-syntax).

1. Rezept auswählen oder eine Anweisung pro Zeile schreiben.
2. Generierte Fragmente und Erklärungen nachvollziehen.
3. Beispiele hinzufügen und erwartete Treffer kennzeichnen.
4. Regex kopieren, sobald das Verhalten stimmt.

Teiltreffer zeigen einen maskierten Kontext mit Hervorhebung; leere Treffer erhalten eine Markierung. Regeln und Beispiele bleiben im Browser. Kein Konto, keine KI-Auslegung, kein Anwendungsbackend.

Öffne im aktuellen Workshop einen Treffer, um Capture-Werte und native Positionen zu sehen. Nicht beteiligte Gruppen und leere Captures bleiben verschieden; wiederholte Gruppen zeigen ihren letzten Wert. **Search anywhere** listet bis zu 100 nicht überlappende Treffer und rückt nach einem leeren Treffer um einen Unicode-Codepunkt weiter. Positionen zählen UTF-16-Einheiten; das Ende ist ausgeschlossen. Ohne native Capture-Indizes werden Werte ohne abgeleitete Positionen angezeigt.

[![Echter Screenshot des Desktop-Workshops](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=e6ff4e7f61e2)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

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

Das Literal benötigt `/` und `u` oder `v`; Zeilenumbrüche als `\n` schreiben. Unterstütztes Verhalten von `i`, `s`, `m` und `u` bleibt erhalten. Der Quellcode importiert auch Captures, verschachtelte Gruppen und Rückverweise mit unveränderten Namen, Nummern und Werten.

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
| [Slug in Kleinbuchstaben](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=slug) | `hello-world` | ASCII-Buchstaben und Ziffern, getrennt durch einzelne Bindestriche |
| [Dateierweiterung](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=file-extension) | `README.md` | Groß-/kleinschreibungsabhängiges Suffix txt, md oder json |
| [UTC-Zeitstempelform](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=iso8601-shape) | `2026-10-11T09:30:00Z` | Optionale Sekundenbruchteile; Kalender separat prüfen |
| [HTTPS-URL-Form](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=https-url-shape) | `https://example.com` | Teilmenge von ASCII-Hosts; keine vollständige URL-Prüfung |
| [Header-Feld](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=http-header) | `Content-Type: application/json` | Benanntes Feld und einzeiliger Wert |
| [Markdown-Überschrift](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=markdown-heading) | `# Hello` | Ein bis sechs # und eine Überschrift |
| [SemVer-2.0-Syntax](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | `1.2.3-alpha.1+001` | Kern-, Vorab- und Build-Syntax; kein Versionsvergleich |
| [Git-Hash-Form](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=git-object-hash) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` | 40 oder 64 ASCII-Hexzeichen; Existenz separat prüfen |
| [Wortwiederholung](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | `hello hello` | Benannte Rückreferenz auf ein ASCII-Wort |
| [Benachbarte Duplikate](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=duplicate-token) | `item,item` | Ein kommagetrenntes Paar mit je 1–16 Wortzeichen |
| [Unicode-Buchstaben](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=unicode-word) | `العربية / اردو` | Native Eigenschaften L/M, auch Arabisch und Urdu |
| [Log-Felder](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | `INFO code=200` | Benannte Felder level und code aus einem Suchfragment |
| [Suchen und Ersetzen](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=replace-word) | `teh then teh → the then teh` | Exakte Positionen, Gruppen und Ersetzung ohne g |

Die Bibliothek enthält **31 Rezepte, 24 Kategorien und drei Schwierigkeitsstufen**. Titel, Grenzen und Regeln sind in den vier Oberflächensprachen durchsuchbar; Filter sind kombinierbar. Siehe den [Bibliotheksleitfaden](../EXAMPLE_LIBRARY.md).

Fehlgeschlagene Beispiele erhalten [überprüfbare Erklärungen](../FAILURE_EXPLANATIONS.md): native Trefferbereiche, eine nachweisbare Mindestlänge oder fehlenden Pflichttext. Ist der genaue Fehlerschritt unbekannt, sagt der Workshop das ausdrücklich.

Wähle [Erklärungen für Anfänger, Fortgeschrittene oder Experten](../EXPLANATION_LEVELS.md). Hinweise erklären Regex-Begriffe oder zeigen Quellbereiche, Captures, aufgelöste Referenzen und Flags. Ein Wechsel erhält die Arbeit und führt keine Suche aus.

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

Dieses Beispiel funktioniert mit npm `0.1.0-dev.9` und im veröffentlichten Workshop.

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

`word character` / `word characters` und `word` / `not word` folgen `\w` / `\W`: `_` gehört dazu, `é` nicht. `letter` schließt Ziffern und Unterstrich aus. Mit `i` kommen native JavaScript-Äquivalente wie `K` und `ſ` hinzu. `u` ist Standard; der Quellcode akzeptiert auch `v`. Beide machen ASCII-Klassen nicht zu universellen Unicode-Kategorien.

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
| `--flags` | Native JavaScript-Flags wählen; u/v schließen sich aus |
| `--help` | Hilfe |
| `--target` | Export in die angegebene Sprache; siehe [Profile](../LANGUAGE.md#engine-exports) |
| `--version` | Paketversion |

UTF-8-Datei oder stdin lesen. Vor Dateinamen mit `-` ein `--` setzen. Exitcodes: `0` Erfolg/Hilfe/Version, `1` ungültige Regeln oder E/A-Fehler, `2` ungültige Argumente.

Fehlerhaftes UTF-8 wird ohne stillen Ersatz abgelehnt. JSON erhält Diagnosecodes, `CLI_USAGE` bei Argumentfehlern und `CLI_ERROR` bei Datei-/Laufzeitfehlern. Steuerzeichen werden sichtbar maskiert; JSON-Dekodierung stellt die Daten wieder her. Auch bei defektem stderr ist der Exitcode ungleich null.

JSON-Diagnosen können `endColumn` enthalten: die exklusive Endspalte derselben Zeile, ab 1 in UTF-16-Einheiten gezählt. Die Werkstatt hebt den gesamten bekannten Fehlerbereich hervor und wählt ihn aus. Ohne Bereich bleibt die Navigation zur Anfangsposition erhalten.

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

Mit `--reverse --json` erhältst du `{ rules, flags }` wie bei `regexToRules()`. Übergib `flags` an `compile(rules, { flags })`, damit native Optionen und Cursorverhalten erhalten bleiben. Alle acht Flags werden unterstützt; Regexe mit g/y behalten ihren Zustand.

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
| `u` | Standard | Unicode-Codepoints |
| `i` | `{ flags: 'i' }` oder `--ignore-case` | Native Groß-/Kleinschreibung ignorieren |
| `s` | `{ flags: 's' }` oder `--dot-all` | Punkt erfasst auch Zeilenumbrüche |
| `m` | `line start` / `line end` | Zeilenanker |
| `d` | `{ flags: 'd' }` | Native Match- und Capture-Indizes |
| `g` | `{ flags: 'g' }` | Wiederholte Aufrufe erhöhen `lastIndex` |
| `y` | `{ flags: 'y' }` | Match bei `lastIndex`; Abbruch an der ersten Lücke |
| `v` | `{ flags: 'v' }` | Native Unicode-Klassen und Komplemente im v-Modus |

**Im Vorschaupaket:** Alle acht Flags `d`, `g`, `i`, `m`, `s`, `u`, `v`, `y` werden unterstützt, etwa mit `{ flags: 'dgiv' }` oder `--flags dgiv`. Die Ausgabe verwendet `dgimsuvy`; doppelte Flags und u/v zusammen sind ungültig, u bleibt Standard. m lässt sich ausdrücklich wählen oder durch Zeilenanker aktivieren; Eingabeanker bleiben auch bei gemischten Modi absolut. Die Rückübersetzung bewahrt Optionen und verändert `lastIndex` nicht. Der Workshop beginnt jedes Beispiel bei 0 und zeigt bis zu 100 Matches; kopierte g/y-Regexe bleiben zustandsbehaftet. Fehlende native Fähigkeiten erhalten ausdrückliche Diagnosen. Verfügbar in npm `0.1.0-dev.9`.

**Im Vorschaupaket:** Wähle `v` für `one of strings: "a", "ab", ""` oder `unicode property "RGI_Emoji"`. Native Mengen versuchen längere Elemente zuerst, unabhängig von der Listenreihenfolge; folgende Regeln können ein kürzeres Element erfordern. Leere Zeichenketten sind erlaubt. Verwende `string "ab"` innerhalb einer Klasse. Zeichenketteneigenschaften sowie leere Elemente oder Elemente mit mehreren Codepunkten können nicht komplementiert werden. Verfügbar in npm `0.1.0-dev.9`.

**Im Vorschaupaket:** Verschachtelte Mengen verwenden `character set union {`, `character set intersection {` und `character set subtraction {`, abgeschlossen mit `}`. Jede Zeile enthält ein Zeichen, einen Bereich, eine Klasse, eine Eigenschaft, eine Zeichenfolgenmenge oder eine weitere Menge. Die Schnittmenge behält gemeinsame Elemente; die Differenz entfernt rechte Elemente aus dem ersten Operanden. Wiederholungen und `lazy` gelten für den gesamten Block. `not` folgt den nativen strukturellen Beschränkungen für Zeichenfolgen; eine leere Vereinigung findet nichts. Wähle `v`; Verfügbar in npm `0.1.0-dev.9`. [Syntax und Beispiele](../LANGUAGE.md#nested-unicode-set-operations).

**Neu auf main, noch nicht in npm dev.9: lokale Gruppenoptionen.** Öffne `group with flags "i" {`, setze `"hello"` hinein und schließe mit `}`, um `(?i:hello)` zu erzeugen. Die Gruppe findet `HELLO`, während folgende Regeln ihre bisherige Groß-/Kleinschreibung behalten. `"im-s"` aktiviert lokal die Faltung der Groß-/Kleinschreibung und Zeilenanker und deaktiviert dot-all. Verschachtelte Gruppen stellen die umgebenden Optionen wieder her; Captures können innerhalb des Blocks stehen. [Syntax und Beispiele](../LANGUAGE.md#scoped-flags-unreleased).

**Prüfe die ausführende Laufzeit.** Syntaxunterstützung allein reicht nicht: die geprüften Unicode-Modi von Chrome, Firefox und WebKit bestehen die Tests. Node 22 kennt die Syntax nicht; die geprüften Node-Versionen 25/26 zeigen native Fehler beim Matching. Die Kompilierung meldet deshalb `UNSUPPORTED_TARGET_FEATURE`. Auch `toRegExp({ source, flags })` prüft bei zwischengespeicherten Daten das lokale Verhalten im angegebenen Modus nach der nativen Konstruktion; ungültige native Syntax behält `SyntaxError`. Nicht unterstützte Gruppen werden nicht angenähert. Diese Funktion ist noch nicht im veröffentlichten dev.9-Paket oder im gehosteten Workshop enthalten.

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

Ziel ist **JavaScript `RegExp`**. Roher Regex als Regel und freie englische Sätze werden nicht akzeptiert. Rückübersetzung ist auf den dokumentierten Teilumfang begrenzt. Freies Englisch, leere Zeichenklassen im u-Modus sowie Vorwärtsreferenzen und Referenzen auf noch offene Gruppen bleiben nicht unterstützt. Der Workshop hat einen Worker-Zeitrahmen; kopierte Regex brauchen die Schutzmaßnahmen ihrer Anwendung. Siehe [Sicherheitsmodell](../SECURITY_MODEL.md).

## 💬 Häufige Fragen

**Ist das KI?** Nein: deterministischer Parser, AST, Compiler und strukturierte Erklärungen.

**Wird jeder Regex übersetzt?** Nein. Unbekannte Konstrukte werden nicht durch Entfernen von Captures oder Assertions passend gemacht.

**Beweist ein erfolgreicher Test Sicherheit?** Nein. Er prüft ausgewählte Fälle, nicht sämtliche Pfade oder Laufzeitkosten.

**Decken Klassen ganz Unicode ab?** Nein. `digit` ist ASCII, `letter` ist `[A-Za-z]`, `word` folgt `\w`.

**Welche Limits gelten?** 16.384 UTF-16-Einheiten, 200 Zeilen, begrenzte Wiederholungen bis 1.000 und Tiefe 64; 100 Beispiele mit jeweils höchstens 2.048 Einheiten und 1.200 ms Worker-Zeit. Ein Emoji benötigt meist zwei UTF-16-Einheiten.

Auch ganze Ergebnisbatches sind begrenzt: 1.000 Treffer, 20.000 Erfassungen und 1.048.576 UTF-16-Einheiten Ergebnistext. Bei zu großer Ausgabe stoppt der gesamte Lauf; Regeln und Beispiele bleiben bearbeitbar.

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

**Release-Prüfung:** der [Prüfbericht](../TESTING.md) unterscheidet Compiler-/CLI-Tests, Chromium-Abläufe auf Desktop und Mobilgeräten, Firefox/WebKit- und Websiteprüfungen, unabhängige JavaScript/TypeScript-Paketnutzer und das Abhängigkeitsaudit. Paketnutzer unter Node 22 werden separat geprüft. Menschliche Prüfungen der Bedienbarkeit, Übersetzungen und Screenreader-Nutzung bleiben offen.

## Prüfung struktureller Risiken

Öffne **Review the pattern** im lokalen Workshop, um verschachtelte oder benachbarte variable Wiederholungen, überlappende Alternativen, breite Wildcards, Zeilenanker und große Muster zu prüfen. Beim Hover werden Regel, Regex-Fragment, Erklärung und Diagramm verbunden, ohne den Cursor zu bewegen. Eine ausgewählte Notiz führt zur Quelltextzeile zurück. Änderungen an Regeln, Flags, Rezepten und Gruppen aktualisieren die Prüfung.

Die gemeinsame API `analyze(rules, { flags })` liefert kanonische Flags, typisierte Hinweise mit Quelltextpositionen und Bereichen sowie ausdrückliche Grenzen der Analyse. Bekannte Zeichen aus positiven Klassen und Bereichen zeigen manche Überschneidungen; unbekannte Mengen gelten nicht als nachweislich disjunkt. Die heuristische Analyse kann aufwendige Muster übersehen oder Fehlalarme erzeugen: **Keine Hinweise sind kein Nachweis für sichere Laufzeit**. Sie führt keine Matches aus und misst kein Backtracking. Beispiele laufen weiterhin in einem isolierten Worker mit Zeitlimit.

 Siehe den [Vertrag zur Strukturprüfung](../LANGUAGE.md#structural-risk-review).

## Strukturdiagramm

Öffne im lokalen Workshop **Explore the pattern** für ein Railroad-Diagramm aus dem AST: verschachtelte Gruppen, geordnete Alternativen, Wiederholungsschleifen und Assertions ohne Textverbrauch. Zeige auf einen Knoten oder wähle ihn aus, um Regeln, Regex-Fragmente und Erklärungen zu verbinden; Hover bewegt den Quelltextcursor nicht. **Enter/Leertaste** führt zur Quelltextzeile zurück. Auch Cursorbewegungen und die Auswahl im erzeugten Regex folgen der Struktur. **Actual size** hält Beschriftungen beim Scrollen lesbar; **Fit overview** zeigt die Gesamtansicht. **Export SVG** speichert eine eigenständige Datei, auch über `toSVG(rules, { flags })` verfügbar. Lange Beschriftungen behalten ihre vollständige Erklärung im Tooltip. Das Diagramm zeigt die Struktur, keinen Ausführungs- oder Backtracking-Verlauf. Siehe [Strukturdiagramme](../LANGUAGE.md#structural-diagrams).

Lizenz [MIT](../../LICENSE) · [Changelog](../../CHANGELOG.md) · [Zur englischen Fassung](../../README.md).
