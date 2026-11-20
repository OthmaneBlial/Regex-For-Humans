<div align="center">

[![Regex For Humans : le regex ^#[0-9A-Fa-f]{6}$ avec, sous chaque fragment, son sens en anglais simple](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Écrivez un regex en anglais simple. Lisez n’importe quel regex de la même façon.**

De courtes règles en anglais deviennent un `RegExp` JavaScript natif, un fragment visible par règle. Collez un regex et récupérez les règles.

**[Essayer l’atelier](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [Site](https://othmaneblial.github.io/Regex-For-Humans/) · [Aperçu npm](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.13) · [Syntaxe](../LANGUAGE.md)**

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · **Français** · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## Des règles, un regex

<table>
<tr><th>Règles</th><th>Regex JavaScript</th></tr>
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

Chaque ligne a un sens documenté et ajoute un fragment au regex, dans l’ordre. Le résultat est le regex que vous écririez à la main : `?` plutôt que `{0,1}`, sans groupes inutiles. Une expression inconnue s’arrête avec sa ligne, sa colonne et une correction proposée.

[![Six recettes à tour de rôle : les règles, le regex compilé, le sens de chaque fragment et ce qu’il capture dans un exemple](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-reel.svg)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

## Relire un regex

Vous héritez d’un motif illisible ? `regexToRules` transforme un regex pris en charge en règles modifiables, qui se recompilent en ce même regex.

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

Le [site](https://othmaneblial.github.io/Regex-For-Humans/) annote en place tout regex collé. Une syntaxe non prise en charge est refusée avec sa position, jamais ignorée en silence.

## Nommez ce que vous capturez

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

Les captures sont des groupes JavaScript natifs. Écrivez `same as capture "year"` pour exiger à nouveau le même texte.

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

Node.js 22+, aucune dépendance à l’exécution, ESM avec déclarations TypeScript. La bibliothèque, la [ligne de commande](../CLI.md) et l’atelier partagent le même compilateur. Version préliminaire (`0.1.0-dev.13`) ; l’[atelier](https://othmaneblial.github.io/Regex-For-Humans/workshop/) ne demande aucune installation.

## Le vocabulaire en un coup d’œil

| Dites | Obtenez |
| --- | --- |
| `start` · `end` | `^` · `$` |
| `3 digits` · `digits` | `\d{3}` · `\d+` |
| `between 2 and 4 letters` | `[A-Za-z]{2,4}` |
| `optional "-"` | `-?` |
| `one of: a, b` | `[ab]` |
| `either { "INFO" "WARN" }` | `(?:INFO\|WARN)` |
| `capture "id" { … }` | `(?<id>…)` |
| `not followed by { "x" }` | `(?!x)` |

Les blocs comme `either { … }` contiennent une règle par ligne entre les accolades. Le [guide du langage](../LANGUAGE.md) décrit chaque règle, option, classe Unicode, assertion et limite.

## 34 recettes prêtes à ouvrir

| Recette | Ce qu’elle vérifie |
| --- | --- |
| [Valider une date du calendrier](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=calendar-date) | Mois 01–12, jour 01–31, capturés en année, mois et jour |
| [Valider une adresse IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-address) | Quatre nombres de 0 à 255, sans zéro initial |
| [Valider une heure sur 24 heures](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=clock-time) | De `00:00` à `23:59` |
| [Valider la syntaxe SemVer 2.0](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | Version, préversion et métadonnées de build |
| [Extraire des champs nommés d’un journal](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | Niveau et code, par leur nom |
| [Repérer un mot répété](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | Un mot, puis ce même mot |

Chaque recette fournit des exemples qui doivent et ne doivent pas correspondre, et une note sur ce qu’elle ne vérifie pas. Voir [les 34 recettes](../RECIPES.md) et quatre [exemples complexes](../COMPLEX-EXAMPLES.md) avec **35 cas acceptés ou refusés**.

## Pourquoi vous fier au résultat

- **Déterministe.** Un analyseur, pas un modèle : les mêmes règles donnent toujours le même regex. Pas d’IA, pas de réseau, pas de télémétrie.
- **Natif.** Le résultat est un `RegExp` ordinaire ; seul le moteur s’exécute au moment de la recherche. Les [exports](../LANGUAGE.md#engine-exports) vers Python, Rust, Go, Java, C#, PHP et Ruby sont comparés à ces moteurs.
- **Honnête sur ses limites.** Les recettes disent ce qu’elles ne vérifient pas. L’atelier teste vos exemples dans un worker limité dans le temps ; un regex copié a besoin de ses propres garde-fous ([modèle de sécurité](../SECURITY_MODEL.md)).
- **Testé.** Chaque recette et chaque exemple du README sont recompilés par la suite de tests ([tests](../TESTING.md)).

[Architecture](../ARCHITECTURE.md) · [Compatibilité](../COMPATIBILITY.md) · [Contribuer](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [Journal des modifications](../../CHANGELOG.md) · [Sécurité](../../SECURITY.md) · [MIT](../../LICENSE)

<div align="center">

Si une règle vous a évité de plisser les yeux, une ⭐ aide d’autres développeurs à trouver le projet.

</div>
