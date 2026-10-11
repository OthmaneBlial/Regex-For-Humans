<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans : des règles lisibles, un vrai regex](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Écrivez. Comprenez. Testez.**

Quelques règles claires en anglais deviennent une expression régulière JavaScript dont vous pouvez suivre chaque partie.

[🚀 Atelier](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 Site](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 Syntaxe](../LANGUAGE.md) · [📦 Aperçu npm](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.8)

🔒 Exécution locale · 🧩 Aucune dépendance à l’exécution · ⚡ Un compilateur, trois interfaces

[English](../../README.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · **Français** · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## 🪄 Moins de ponctuation à déchiffrer

Une expression régulière devient plus facile à lire quand vous voyez les règles qui l’ont produite.

| Vos règles | Le résultat JavaScript |
| --- | --- |
| `start "#"`, `6 hex digits`, `end` | `/^#[0-9A-Fa-f]{6}$/u` |

```text
start "#"
6 hex digits
end
```

```js
/^#[0-9A-Fa-f]{6}$/u
```

✅ `#12aBcF`, `#000000` · ❌ `#123`, `#G00000`

Le vocabulaire est **fixe** : chaque instruction possède un sens précis. La bibliothèque, le CLI et l’atelier utilisent le même compilateur déterministe. Une instruction inconnue produit un diagnostic avec ligne, colonne et conseil de correction. La syntaxe reste en anglais dans toutes les traductions.

> 🌱 L’aperçu `0.1.0-dev.8` nécessite **Node.js 22+** pour la bibliothèque et le CLI. L’atelier en ligne fonctionne sans installation. Les évaluations humaines de l’utilisabilité et du lecteur d’écran restent à faire.

## 🧰 Ce que vous pouvez construire aujourd’hui

| Capacité | npm `0.1.0-dev.8` / atelier hébergé |
| --- | --- |
| Règles lisibles → regex JavaScript | ✅ |
| Regex pris en charge → règles modifiables | ✅ |
| Explications et navigation vers les règles | ✅ |
| CLI, API ESM et déclarations TypeScript | ✅ |
| Captures nommées/numérotées et groupes imbriqués | ✅ |
| Répétition de blocs et références vers une capture précédente | ✅ |
| Alternatives ordonnées avec `either { … }` | ✅ |
| Répétition paresseuse avec `lazy` | ✅ |
| Assertions avant/arrière | ✅ |
| Limites de mot | ✅ |
| [Propriétés Unicode](../LANGUAGE.md#unicode-properties) | ✅ |
| [Classes de caractères combinées](../LANGUAGE.md#composable-character-classes) | ✅ |
| [Chaînes Unicode et ensembles imbriqués](../LANGUAGE.md#nested-unicode-set-operations) | ✅ |
| Les huit flags JavaScript | ✅ |
| [Édition des groupes et surlignage des captures](../LANGUAGE.md#editing-groups) | ✅ |
| [Structure interactive et export SVG](../LANGUAGE.md#structural-diagrams) | ✅ |
| [Revue des risques structurels](../LANGUAGE.md#structural-risk-review) | ✅ |
| [Export de code adapté au moteur](../LANGUAGE.md#engine-exports) | ✅ |
| Anglais libre | — |

L’atelier propose **Edit groups and references** pour renommer une capture, changer son type et accéder à ses références. Les références numériques conservent leur cible après une renumérotation ; supprimer une capture référencée est refusé sans modifier les règles. **Highlight** surligne la position native d’une capture, même vide ou hors du texte consommé. L’API `editGroup` renvoie des règles validées. Voir l’[édition des groupes](../LANGUAGE.md#editing-groups).

Dans le code source, `lazy digits` produit `\d+?` : essayer un chiffre d’abord, puis augmenter le nombre si les règles suivantes le demandent. Disponible dans npm `0.1.0-dev.8`. Voir les [règles de répétition](../LANGUAGE.md#repetition).

Le source accepte aussi `followed by { … }`, `not followed by { … }`, `preceded by { … }`, `not preceded by { … }`. Ces assertions vérifient le texte autour de la position courante sans le consommer. Les captures gardent leurs valeurs et positions natives, parfois hors du texte consommé ; les assertions arrière exigent un moteur compatible. Disponible dans npm `0.1.0-dev.8`. Voir les [assertions avant/arrière](../LANGUAGE.md#lookaround-assertions).

Le source accepte `word boundary` (`\b`) et `not word boundary` (`\B`). Ces assertions ne consomment aucun caractère. JavaScript considère comme caractères de mot les lettres ASCII, les chiffres et le tiret bas, ainsi que leurs équivalents de casse avec `i`. Il ne s’agit pas d’une segmentation linguistique. Disponible dans npm `0.1.0-dev.8`. Voir les [limites de mot](../LANGUAGE.md#word-boundaries).

Le source accepte aussi `unicode property "L"` et `not unicode property "L"`, soit `\p{L}` et `\P{L}` natifs. `L` signifie Letter ; les alias sont sensibles à la casse et le classement dépend des données Unicode du moteur. Les comptes et `lazy` s’appliquent normalement. Avec `i`, le complément natif en mode `u` peut inclure des lettres équivalentes en casse. Disponible dans npm `0.1.0-dev.8`. Voir les [propriétés Unicode](../LANGUAGE.md#unicode-properties).

Le source accepte `range "α" to "ω"` et `character class: digit, "_"`. Une classe combine des littéraux d’un point Unicode, des plages, des raccourcis singuliers et des propriétés Unicode ; `not character class:` nie l’union entière. Les comptes et `lazy` s’appliquent à la classe. Les compléments de propriétés conservent le comportement natif `u`/`i`. Disponible dans npm `0.1.0-dev.8`; voir les [classes de caractères](../LANGUAGE.md#composable-character-classes).

npm `0.1.0-dev.8` inclut les groupes, captures, références précédentes et alternatives ordonnées dans la bibliothèque et le CLI. L’atelier ajoute l’inspection des captures et les correspondances multiples en recherche. Consultez la [compatibilité](../COMPATIBILITY.md) et les [preuves de publication](../DISTRIBUTION.md).

## 🌍 Exporter dans votre langage

Ouvrez **Export to a programming language** dans l’atelier local, appelez `exportRegex(rules, { target: "python" })`, ou lancez `node bin/regex-for-humans.js --target python --json rules.txt`. Neuf formats couvrent JavaScript, TypeScript, Python, Rust, Go, Java, C#, PHP et Ruby. JavaScript/TypeScript conservent le motif natif ; les autres cibles traduisent les comportements pris en charge depuis l’AST, puis produisent le code source correctement échappé.

Les comparaisons du code généré passent sur sept moteurs natifs ; **PHP est vérifié avec PHP 8.5.11 / PCRE2 10.44**. Les versions testées et les limites du corpus figurent dans le [guide de compatibilité](../COMPATIBILITY.md#engine-exports). Conservez les contraintes et la correspondance des captures : les cibles étrangères utilisent des noms `gN`, et une capture inactive peut être absente. Le texte doit être Unicode bien formé. Les options `d/g/i/y`, propriétés Unicode et comportements incompatibles d’assertion, capture ou répétition donnent un diagnostic situé. Téléchargez le code ou le résultat JSON complet ; les exemples du navigateur restent exécutés en JavaScript. Consultez les [profils et limites](../LANGUAGE.md#engine-exports).

## 📦 Installer l’aperçu

```sh
npm install regex-for-humans@preview
```

Utilisez le CLI sans installation globale :

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

Résultat : `/^ABC\d{3}$/u`. Pour fixer la version, utilisez `regex-for-humans@0.1.0-dev.8`. Le projet n’a ni dépendance à l’exécution ni exécutable autonome par système.

## 🎮 Essayer un motif

Choisissez **Interface language** pour l’anglais, le chinois simplifié, l’espagnol ou le français. Les libellés, recettes, résultats des tests et commandes de navigation changent sans modifier vos règles, exemples, sélections, panneaux ouverts ou code généré. Le choix est mémorisé localement si le stockage est disponible. Les règles restent en anglais contrôlé ; les explications du compilateur, libellés du diagramme et exigences techniques exportées restent en anglais. Voir [la traduction de l’atelier](../ARCHITECTURE.md#workshop-localization).

Utilisez **Theme** pour suivre l’apparence du système ou choisir un atelier clair ou sombre. Le choix est mémorisé localement si le stockage est disponible ; changer l’apparence conserve vos règles, exemples, sélections et panneaux ouverts. Voir [la préférence de thème](../ARCHITECTURE.md#theme-preference).

l’éditeur natif colore les mots-clés, chaînes, captures, quantificateurs, assertions, alternatives et commentaires. Le jeton indiqué par le compilateur est souligné ; la saisie, la sélection, la copie et le défilement restent natifs. Les couleurs forcées et les entrées dépassant les limites utilisent du texte natif simple. Les commentaires de ligne commençant par `#` conservent leurs positions et comptent dans les limites habituelles. Voir les [commentaires](../LANGUAGE.md#comments) et la [coloration de l’éditeur](../ARCHITECTURE.md#editor-highlighting).

le panneau de construction insère des modèles modifiables de capture, section facultative, alternative, répétition, classe de caractères et assertion avant la ligne ou la sélection actuelle, entre les ancres extérieures. L’ajout d’une capture préserve les cibles des références numérotées existantes. Une insertion invalide ou trop grande conserve les règles et la sélection ; les flags et exemples restent en place. Voir la [construction de règles](../ARCHITECTURE.md#rule-construction).

les attentes exactes vérifient toutes les positions UTF-16, les valeurs des captures dans l’ordre (`null` pour une capture absente, `""` pour une capture vide) et les résultats de remplacement JavaScript avec les options d’origine. Les fixtures de tests permettent l’import/export JSON versionné et la sauvegarde/restauration locale manuelle. Les brouillons ou fichiers invalides préservent le travail actuel ; les CR/CRLF importés restent exacts jusqu’à la modification du champ de l’exemple. Voir le [format, les exemples et les limites des fixtures](../TEST_FIXTURES.md).

1. Choisissez une recette ou écrivez une instruction par ligne.
2. Suivez les fragments générés et leur explication.
3. Ajoutez des exemples et indiquez ceux qui devraient correspondre.
4. Copiez le regex quand le comportement vous convient.

Un résultat partiel affiche un court extrait échappé avec la correspondance surlignée ; une correspondance vide reçoit un repère. Les règles et exemples restent dans le navigateur. Aucun compte, service d’IA ou serveur applicatif n’est nécessaire.

Dans l’atelier actuel, ouvrez une correspondance pour voir les captures et leurs positions natives. Une capture absente et une chaîne vide restent distinctes ; un groupe répété montre sa dernière valeur. **Search anywhere** liste jusqu’à 100 correspondances non superposées et avance d’un point de code Unicode après une correspondance vide. Les positions comptent les unités UTF-16, avec une fin exclue. Sans indices natifs, les valeurs restent visibles sans positions déduites.

[![Capture réelle de l’atelier sur ordinateur](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=e1a2f3784e8c)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

[Vue mobile et sommes de contrôle](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md).

## 🔄 Vous avez déjà un regex ?

Dans **Already have a regex?**, collez un littéral JavaScript pris en charge, puis utilisez **Translate to rules** ou Ctrl/Cmd + Entrée. `/^[A-Z]{2}-\d{4}$/u` devient :

```text
start
2 uppercase letter
"-"
4 digit
end
```

Le littéral doit être entouré de `/` et porter `u` ou `v`. Écrivez les retours à la ligne sous forme d’échappements, par exemple `\n`. La traduction préserve les comportements `i`, `s`, `m` et `u` pris en charge. Le code source importe aussi les captures nommées/numérotées, les groupes imbriqués et les références précédentes, sans modifier leur numérotation ni leurs valeurs.

`[^]` devient un caractère quelconque avec `s`. Les points ordinaires voisins excluent explicitement les séparateurs de ligne pour conserver leur sens. Les classes complètes de lettres, de mots et de chiffres hexadécimaux acceptent des ordres équivalents ; les exclusions de chemin et les échappements de contrôle sont conservés. Un tiret à l’extrémité d’une liste reste littéral.

Les constructions inconnues sont refusées, jamais supprimées ni approximées. **Go to regex error** sélectionne leur position dans la source ; un échec conserve les règles et options. Les références vers une capture future ou encore ouverte sont refusées. Un groupe non capturant vide devient `0 any character` : il trouve une correspondance vide en recherche, mais exige une entrée vide en mode chaîne entière.

## 🍱 Des recettes pour commencer

| Recette | Exemple | Vérification |
| --- | --- | --- |
| [Identifiant préfixé](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | `ABC123` | Préfixe et trois chiffres |
| [Numéro de facture](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | `INV-1234` | `INV-` et 2–6 chiffres |
| [Nom d’utilisateur](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | `Alice_7` | 3–16 caractères ; lettre ASCII au début |
| [Couleur hexadécimale](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | `#12aBcF` | Six chiffres hexadécimaux après `#` |
| [Adresse MAC](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=mac-address-shape) | `00:1A:2B:3C:4D:5E` | Six paires séparées par `:` |
| [UUID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=uuid-shape) | `8–4–4–4–12` | Cinq groupes hexadécimaux |
| [Code produit](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=product-code-shape) | `AB-rgb-0420` | Majuscules, minuscules et chiffres aux comptes fixés |
| [Date](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | `2026-09-30` | Forme `YYYY-MM-DD` |
| [Heure](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | `09:30` | Forme `HH:MM` |
| [Téléphone](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | `+33123456789` | `+` facultatif et 7–15 chiffres |
| [IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | `192.0.2.42` | Quatre groupes de 1–3 chiffres |
| [Nom de fichier](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | `report.txt` | Radical Unicode borné, sans séparateurs |
| [Manifeste d’artefacts](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | Chemin, hash, taille | 19 règles et neuf exemples |
| [Journal d’accès](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | Requête, statut, taille | 43 règles et huit exemples |
| [Événement de télémétrie](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | IDs et valeurs facultatives | 38 règles et neuf exemples |
| [Version](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | `1.2.3` | Trois parties numériques |
| [Caractères exclus](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | `xyz` | Texte sans les caractères choisis |
| [Règle de ligne](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | `item 123` | Ligne terminée par au moins trois chiffres |
| [Slug en minuscules](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=slug) | `hello-world` | Lettres/chiffres ASCII séparés par un seul tiret |
| [Extension de fichier](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=file-extension) | `README.md` | Suffixe txt, md ou json sensible à la casse |
| [Horodatage UTC : forme](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=iso8601-shape) | `2026-10-11T09:30:00Z` | Secondes fractionnaires facultatives ; calendrier à vérifier séparément |
| [URL HTTPS : forme](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=https-url-shape) | `https://example.com` | Sous-ensemble d’hôtes ASCII ; validation URL incomplète |
| [Champ d’en-tête](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=http-header) | `Content-Type: application/json` | Champ nommé et valeur sur une ligne |
| [Titre Markdown](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=markdown-heading) | `# Hello` | Un à six # puis un titre |
| [Syntaxe SemVer 2.0](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | `1.2.3-alpha.1+001` | Syntaxe principale, préversion et construction ; sans comparaison |
| [Empreinte Git : forme](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=git-object-hash) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` | 40 ou 64 caractères hexadécimaux ASCII ; existence à vérifier |
| [Mots répétés](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | `hello hello` | Référence arrière nommée à un mot ASCII |
| [Doublons adjacents](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=duplicate-token) | `item,item` | Une paire séparée par une virgule, 1 à 16 caractères de mot |
| [Lettres Unicode](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=unicode-word) | `العربية / اردو` | Propriétés natives L/M, dont arabe et ourdou |
| [Champs de journal](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | `INFO code=200` | Champs nommés level et code dans un fragment recherché |
| [Recherche et remplacement](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=replace-word) | `teh then teh → the then teh` | Positions, captures et remplacement sans g vérifiés précisément |

La bibliothèque compte **31 recettes, 24 catégories et trois niveaux**. Recherchez titres, limites et règles dans les quatre langues de l’interface, puis combinez les filtres. Consultez le [guide de la bibliothèque](../EXAMPLE_LIBRARY.md).

Les exemples en échec reçoivent des [explications vérifiables](../FAILURE_EXPLANATIONS.md) : positions natives, longueur minimale prouvable ou texte obligatoire absent. Si l’étape précise est inconnue, l’atelier l’indique.

Choisissez des [explications débutant, intermédiaire ou expert](../EXPLANATION_LEVELS.md). Les notes définissent les termes regex ou détaillent les plages source, captures, références et options. Changer de niveau préserve le travail sans relancer la recherche.

Ces recettes vérifient des **formes**. Une date impossible ou `25:99` peut correspondre ; validez le calendrier et les plages séparément. IPv4 ne borne pas les octets à 255. UUID ne garantit ni version, ni variante, ni unicité. Les téléphones et factures ne vérifient aucun registre ; les noms d’utilisateur ne vérifient pas la disponibilité. La recette de forme de version n’est pas un validateur SemVer complet. La couleur exige `#RRGGBB`. Les règles du système de fichiers restent distinctes.

## 🏗️ Des motifs plus grands, toujours lisibles

Le [guide complet](../COMPLEX-EXAMPLES.md) présente quatre formats, 35 cas acceptés/refusés et l’explication de chaque règle : journal d’accès, télémétrie, manifeste d’artefacts et commande multiligne.

### 📦 Un manifeste d’artefacts

Répertoire `nightly/` facultatif, chemin Unicode borné, version, nom d’archive, somme de contrôle et taille, séparés par des tabulations :

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

Il vérifie la forme du chemin et du hash, pas l’existence du fichier ni l’intégrité de son contenu. Les limites Unicode et les tabulations restent explicites.

### 🧾 Une commande multiligne

Identifiant, acheteur Unicode, téléphone, quantité, montant, référence, approbation facultative et ligne de priorité entière facultative :

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

Les retours à la ligne sont des caractères littéraux. La validation des montants, numéros et commandes relève de l’application. Les quatre exemples simples du guide ne font pas d’extraction de champs.

## 🧲 Extraire des champs avec des captures nommées

Cet exemple fonctionne avec npm `0.1.0-dev.8` et dans l’atelier publié.

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

`capture {` crée un groupe numéroté ; `group {` regroupe sans extraire. Les noms sont des identifiants JavaScript uniques ; les numéros suivent l’ordre d’ouverture, même pour les groupes imbriqués. Une capture facultative absente vaut `undefined`, une capture vide participante vaut `""`, et une capture répétée conserve sa dernière valeur.

Après la fermeture du groupe, `same as capture "word"` ou `same as capture 1` exige le même texte. [L’exemple](../LANGUAGE.md#capture-references) accepte `cat cat` et refuse `cat dog`. Les références futures ou internes au groupe ciblé produisent un diagnostic. La traduction inverse conserve les noms, numéros et valeurs pris en charge. Une date extraite doit toujours être validée avec un calendrier.

## 🧩 L’aide-mémoire

Une instruction par ligne ; les textes littéraux sont entre guillemets.

| Règle | Résultat | Sens |
| --- | --- | --- |
| `start` / `end` | `^` / `$` | Bornes de l’entrée |
| `line start` / `line end` | `^` / `$` et `m` | Bornes des lignes |
| `digit` / `not digit` | `\d` / `\D` | Chiffre ASCII ou son complément |
| `3 digits` / `digits` | `\d{3}` / `\d+` | Trois ou au moins un |
| `between 2 and 4 digits` | `\d{2,4}` | Bornes incluses |
| `optional "-"` | `-{0,1}` | Tiret facultatif |
| `letter` / `letters` | `[A-Za-z]` / `[A-Za-z]+` | Lettres ASCII |
| `lowercase letters` / `uppercase letters` | `[a-z]+` / `[A-Z]+` | Casse ASCII ; `i` ignore la distinction |
| `6 hex digits` | `[0-9A-Fa-f]{6}` | Six chiffres hexadécimaux |
| `space` / `spaces` | `\s` / `\s+` | Espaces blancs, retours à la ligne inclus |
| `between 1 and 32 path segment characters` | 1–32 points de code | Exclut séparateurs, NUL et retours à la ligne |
| `"hello"` | `hello` | Texte exact, échappé |
| `one of: a, b` | `[ab]` | Un caractère de la liste |
| `text without: a, b` | `[^ab]*` | Zéro ou plusieurs caractères non listés |
| `any text` | `.*` | `s` inclut les retours à la ligne |

`word character` / `word characters` et `word` / `not word` suivent `\w` / `\W`. `\w` inclut `_`, mais pas `é`. `letter` exclut chiffres et soulignement. Avec `i`, les équivalences natives JavaScript peuvent inclure `K` et `ſ`. `u` est le défaut ; le source accepte aussi `v`. Aucun des deux ne transforme les classes ASCII en catégories Unicode universelles.

## 💻 Dans votre terminal

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

Ou depuis un clone :

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

```text
/^ABC\d{3}$/u
```

✅ `ABC123` · ❌ `ABC12`, `ABC1234`, `abc123`

| Option | Action |
| --- | --- |
| `--explain` | Fragments et explications |
| `--json` | Résultats structurés sur stdout ; erreurs sur stderr |
| `--ignore-case` | Active `i` |
| `--dot-all` | Active `s` |
| `--flags` | Choisir les flags JavaScript natifs ; u/v sont exclusifs |
| `--help` | Aide |
| `--target` | exporter vers le langage demandé ; voir les [profils](../LANGUAGE.md#engine-exports) |
| `--version` | Version du paquet |

Lisez un fichier UTF-8 ou stdin. Utilisez `--` avant un nom de fichier commençant par `-`. Codes de sortie : `0` pour succès/aide/version, `1` pour règles invalides ou erreur d’entrée/sortie, `2` pour arguments invalides.

Un UTF-8 mal formé est refusé, jamais remplacé silencieusement. Les diagnostics JSON conservent leurs codes ; les erreurs d’usage portent `CLI_USAGE`, les erreurs de fichier/exécution `CLI_ERROR`. Les caractères de contrôle sont affichés sous forme d’échappements ; le JSON décodé restitue les données. Un échec de stderr produit toujours une sortie non nulle.

Les diagnostics JSON peuvent inclure `endColumn`, une colonne de fin exclusive sur la même ligne, comptée à partir de 1 en unités UTF-16. L’atelier surligne et sélectionne tout le fragment identifié ; les erreurs sans plage conservent la navigation vers leur position de départ.

### 🔄 Traduction inverse en ligne de commande

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

`--reverse --json` renvoie `{ rules, flags }`, comme `regexToRules()`. Passez `flags` à `compile(rules, { flags })` pour conserver les options natives et le comportement du curseur. Les huit flags sont pris en charge ; les regex g/y conservent leur état.

## 📦 Bibliothèque JavaScript

Après l’installation npm, utilisez un module ESM (`.mjs` ou `"type": "module"`). Les déclarations TypeScript sont incluses. Dans le clone, importez `./index.js`.

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

`toRegExp({ source, flags })` accepte les métadonnées mises en cache ; les deux champs doivent être des chaînes et les segments ne sont pas lus. `compile("digit", { flags: undefined })` utilise `u`, y compris avec `exactOptionalPropertyTypes`.

`regexToRules()` accepte les vrais regex d’autres contextes JavaScript, conserve `lastIndex` et lit les métadonnées natives sans appeler les méthodes de correspondance ni les surcharges de l’instance. Les échappements tels que `\u{00000041}` restent pris en charge dans la limite de source.

## 🎛️ Des flags aux effets précis

| Flag | Activation | Effet |
| --- | --- | --- |
| `u` | Par défaut | Correspondance par points de code Unicode |
| `i` | `{ flags: 'i' }` ou `--ignore-case` | Comparaison sans distinction de casse selon JavaScript |
| `s` | `{ flags: 's' }` ou `--dot-all` | Le point peut inclure les retours à la ligne |
| `m` | `line start` / `line end` | Ancres par ligne |
| `d` | `{ flags: 'd' }` | Indices natifs des correspondances et captures |
| `g` | `{ flags: 'g' }` | Les appels successifs avancent `lastIndex` |
| `y` | `{ flags: 'y' }` | Correspondance à `lastIndex`, arrêt au premier trou |
| `v` | `{ flags: 'v' }` | Classes Unicode et compléments natifs en mode v |

**Dans l’aperçu :** les huit flags `d`, `g`, `i`, `m`, `s`, `u`, `v`, `y` sont acceptés, avec `{ flags: 'dgiv' }` ou `--flags dgiv`. L’ordre de sortie est `dgimsuvy` ; doublons et combinaison u/v sont rejetés, et u reste le défaut. m peut être explicite ou ajouté par les ancres de ligne ; les ancres d’entrée restent absolues, même dans un mélange des deux modes. La traduction inverse conserve les options sans modifier `lastIndex`. Le workshop recommence chaque exemple à 0 et énumère au plus 100 correspondances ; les regex g/y copiés restent avec état. Les capacités natives manquantes sont signalées explicitement. Disponible dans npm `0.1.0-dev.8`.

**Dans le code source seulement :** choisissez `v` pour `one of strings: "a", "ab", ""` ou `unicode property "RGI_Emoji"`. Les ensembles natifs essaient les membres les plus longs en premier, quel que soit l’ordre de la liste ; les règles suivantes peuvent imposer un membre plus court. Les chaînes vides sont autorisées. Utilisez `string "ab"` dans une classe. Les propriétés de chaînes et les membres vides ou de plusieurs points de code ne peuvent pas être complémentés. Disponible dans npm `0.1.0-dev.8`.

**Dans le code source seulement :** les ensembles imbriqués utilisent `character set union {`, `character set intersection {` et `character set subtraction {`, puis `}`. Chaque ligne désigne un caractère, une plage, une classe, une propriété, un ensemble de chaînes ou un ensemble imbriqué. L’intersection garde les membres communs ; la soustraction retire les membres de droite du premier opérande. Les comptes et `lazy` portent sur tout le bloc. `not` respecte les restrictions natives sur les chaînes ; une union vide ne correspond à rien. Choisissez `v` ; Disponible dans npm `0.1.0-dev.8`. [Syntaxe et exemples](../LANGUAGE.md#nested-unicode-set-operations).

## 🛠️ Développer localement

```sh
npm ci
npm run build
npm run serve
```

Ouvrez **http://127.0.0.1:4174/**. `npm run serve -- 0` choisit un port disponible et affiche l’URL. Les URL de répertoire reçoivent leur barre oblique finale en conservant les paramètres.

Pour tous les contrôles, avec Chrome installé :

```sh
npm ci
npm exec -- playwright install firefox webkit
npm run verify
```

Sans Chrome, utilisez Chromium fourni par Playwright :

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

La vérification comprend formatage, lint, types, liens, tests Node, construction Pages, installation du paquet dans un consommateur vierge, navigateurs et audit. `CI=1` sélectionne le navigateur local ; il n’active pas GitHub Actions, qui reste désactivé.

## 🧭 Connaître les limites

Les alternatives deviennent des blocs modifiables `either { … }` : chaque entrée est un choix, essayé dans l’ordre. Utilisez `group { … }` pour un choix composé de plusieurs règles ou un choix vide.

La cible est **JavaScript `RegExp`**. Le langage refuse le regex brut et l’anglais libre. La traduction inverse traite seulement le sous-ensemble documenté. L’anglais libre, les classes de caractères vides en mode u et les références avant leur définition ou encore ouvertes restent non pris en charge. L’atelier utilise un worker avec délai ; un regex copié nécessite les protections de sa propre application. Consultez le [modèle de sécurité](../SECURITY_MODEL.md).

## 💬 Questions fréquentes

**Est-ce une IA ?** Non : parseur déterministe, AST, compilateur et explications structurées.

**Tous les regex sont-ils traduisibles ?** Non. Une construction inconnue produit une erreur ; aucune capture ou assertion n’est supprimée pour forcer la conversion.

**Un exemple réussi prouve-t-il la sécurité ?** Non. Il vérifie un comportement choisi, pas tous les chemins ni le coût d’exécution.

**Les classes couvrent-elles tout Unicode ?** Non. `digit` est ASCII, `letter` est `[A-Za-z]` et `word` suit `\w`.

**Quelles limites ?** 16 384 unités UTF-16, 200 lignes, répétitions bornées jusqu’à 1 000, profondeur 64 ; 100 exemples de 2 048 unités maximum et délai de worker de 1 200 ms. Un emoji utilise généralement deux unités UTF-16.

Chaque lot de résultats est aussi limité : 1 000 correspondances, 20 000 captures et 1 048 576 unités UTF-16 de texte de résultat. Une sortie trop volumineuse arrête toute l’exécution ; les règles et les exemples restent modifiables.

**Hors ligne ?** Bibliothèque et CLI fonctionnent localement. L’atelier peut être construit et servi après installation des dépendances ; aucune PWA ni mise en cache hors ligne n’est annoncée.

**Signaler un problème ?** [Issues GitHub](https://github.com/OthmaneBlial/Regex-For-Humans/issues), avec règles, flags, entrée, résultat attendu et version du moteur. Pour la sécurité, suivez [SECURITY.md](../../SECURITY.md) en privé.

## 🗺️ Explorer le projet

| Guide | Contenu |
| --- | --- |
| [Langage](../LANGUAGE.md) | Grammaire, captures, références et diagnostics |
| [Exemples complexes](../COMPLEX-EXAMPLES.md) | Quatre formats et leurs explications |
| [Architecture](../ARCHITECTURE.md) | Parseur → AST → compilateur → interfaces |
| [Compatibilité](../COMPATIBILITY.md) | Constructions et moteurs vérifiés |
| [Tests](../TESTING.md) | Commandes reproductibles et preuves |
| [Sécurité](../SECURITY_MODEL.md) | Frontières de confiance et limites |
| [Distribution](../DISTRIBUTION.md) | npm, versions et site publié |
| [Feuille de route](../AUTONOMOUS_ROADMAP.md) | Jalons réalisés et prochaines étapes |
| [Comparaison](../COMPETITOR_GAPS.md) | Sources et capacités manquantes |
| [Contribuer](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) | Installation et conventions |

**Vérifié localement le 11 octobre 2026 :** 1 138 tests passent : 334 tests Node, 478 contrôles Chromium ordinateur/mobile, 262 contrôles Firefox/WebKit et 64 contrôles du site. Les builds et l’installation dans un projet JavaScript/TypeScript indépendant passent ; l’audit ne signale aucune vulnérabilité. Une installation indépendante passe également sur Node 22.23.3. Ces résultats décrivent cet instantané ; les revues humaines d’utilisation et de lecteur d’écran restent ouvertes.

## Revue des risques structurels

Ouvrez **Review the pattern** dans l’atelier local pour examiner les répétitions variables imbriquées ou voisines, les alternatives qui se chevauchent, les jokers larges, les ancres de ligne et les expressions volumineuses. Le survol relie règle, fragment regex, explication et diagramme sans déplacer le curseur ; sélectionner une remarque revient à sa ligne source. Les modifications des règles, des flags, de la recette et des groupes actualisent la revue.

L’API partagée `analyze(rules, { flags })` renvoie les flags canoniques, des remarques typées avec positions et plages source, ainsi que ses limites. Des caractères témoins dans les classes et intervalles positifs détectent certains chevauchements ; un ensemble inconnu n’est pas considéré comme disjoint. Cette analyse heuristique peut manquer des motifs coûteux ou produire de faux positifs : **l’absence de remarques ne prouve pas la sûreté des performances**. Elle ne lance aucun test de correspondance et ne mesure pas le backtracking. Les exemples conservent leur worker isolé et leur délai maximal.

 Voir le [contrat de revue structurelle](../LANGUAGE.md#structural-risk-review).

## Diagramme de structure

Dans l’atelier local, ouvrez **Explore the pattern** pour voir le diagramme construit à partir de l’AST : groupes imbriqués, alternatives ordonnées, boucles de répétition et assertions qui ne consomment pas de texte. Survolez ou sélectionnez un élément pour relier les règles, les fragments de regex et les explications ; le survol ne déplace pas le curseur. **Entrée/Espace** revient à la ligne source. Le curseur source et la sélection dans la regex suivent aussi la structure. **Actual size** garde les libellés lisibles avec défilement ; **Fit overview** affiche l’ensemble. **Export SVG** enregistre un fichier autonome, aussi disponible avec `toSVG(rules, { flags })`. Les libellés longs gardent leur explication complète dans une infobulle. Ce diagramme montre la structure, pas une trace d’exécution ou de backtracking. Voir les [diagrammes de structure](../LANGUAGE.md#structural-diagrams).

Licence [MIT](../../LICENSE) · [Changelog](../../CHANGELOG.md) · [Retour à l’anglais](../../README.md).
