# Roadmap — Regex For Humans

> État de référence : dépôt local `f39788b` (`master`), inspecté le 19 septembre 2026. Ce document est un plan, pas une liste de fonctionnalités livrées. Une tâche ne peut être déclarée terminée qu'avec la preuve indiquée dans ses critères d'acceptation. Les informations du dépôt GitHub distant sont un instantané à revérifier au moment de la publication.

## Suivi d'exécution

Cocher une tâche uniquement après vérification de tous ses critères. Les dépendances externes restent ouvertes tant que leurs preuves manquent.

- [x] 0.1 Contrat du langage et vocabulaire — `docs/LANGUAGE.md`, 3 scénarios vérifiés avec `RegExp` sous Node 25.9.0
- [x] 0.2 Scénarios d'adoption et mesures — 3 fixtures rejouées en bibliothèque, CLI et navigateur ; cible de premier succès définie (mesure humaine suivie en 2.4)
- [x] 1.1 Installation, API et CLI — tarball installé dans un dossier vierge ; aide, fichier, stdin, erreur, import et CLI vérifiés sous Node 25.9.0
- [x] 1.2 Parseur déterministe et diagnostics — AST, erreurs ligne/colonne, phrases inconnues rejetées ; tests parseur et CLI verts
- [x] 1.3 Sémantique et échappement — 3 fixtures positives/négatives, régressions et caractères spéciaux vérifiés ; tarball installé proprement
- [ ] 2.1 Explications traçables — implémentées et testées localement ; revue des 3 scénarios par une personne extérieure encore requise
- [x] 2.2 Atelier web local — build statique, 3 recettes, copie réelle, diagnostics, console et requêtes locales vérifiés ; tests navigateur bureau/mobile verts
- [x] 2.3 Tests positifs et négatifs — 16 tests navigateur verts : ancres, Unicode, saut de ligne, modes, édition et écarts ; isolation contre exécution longue suivie en 3.2
- [ ] 2.4 Interface et accessibilité — rendu et clavier vérifiés, 6 tests axe/Playwright verts ; lecteur d'écran réel et 3 nouvelles personnes encore requis
- [x] 3.1 Tests et compatibilité — 41 tests Node sur 22.23.2, 24.21.0 et 25.9.0 ; 26 tests navigateur Chrome bureau/mobile ; format/lint/typage strict du noyau et de la CLI, build et `npm ci` vérifiés ; limites de portée dans `docs/TESTING.md`
- [x] 3.2 Bornes et sécurité de l'exécution — limites documentées, worker interrompable, timeout/récupération et entrée HTML testés ; 26 tests navigateur verts, `npm audit` sans vulnérabilité signalée
- [ ] 3.3 Architecture et politique de changements — guide, liens et exercice interne vérifiés (`docs/CONTRIBUTION-EXERCISE.md`) ; revue par un contributeur extérieur encore requise
- [ ] 4.1 README et premier succès — commandes CLI, bibliothèque, build et atelier vérifiées depuis un clone vierge ; rendu GitHub et liens vérifiés ; relecture par un novice encore requise
- [ ] 4.2 Captures réelles
- [ ] 4.3 Contribution et présentation GitHub — politiques sécurité/changelog, modèles d'issues/PR et métadonnées préparés ; formulaire GitHub et lien public de démo encore à vérifier
- [ ] 5.1 CI vérifiée — premier run `838479b` : Linux Node 22/24, macOS Node 24 et Chromium verts ; Windows échoue sur les fins de ligne converties en CRLF avant les tests ; correction `.gitattributes` à revalider, puis PR volontairement cassée
- [ ] 5.2 Package publié et atelier déployé
- [ ] 5.3 Décision et validation des binaires
- [ ] 5.4 Release publiée et vérifiée
- [ ] 6.1 Capture et montage réel
- [ ] 6.2 Exports vidéo vérifiés

## 1. Diagnostic vérifié

> Ce tableau décrit l'état initial du dépôt avant les travaux suivis ci-dessus. Les cases de suivi et les fichiers actuels indiquent les corrections déjà apportées ; ce diagnostic n'est pas un relevé de l'état présent.

| Axe | Constat et preuve dans l'état actuel | Conséquence |
| --- | --- | --- |
| Proposition de valeur | `README.md` promet de transformer des instructions en anglais en regex lisibles, mais `index.js` ne traite qu'un petit vocabulaire de phrases prédéfinies. | Présenter le produit comme un **langage contrôlé en anglais pour JavaScript RegExp**, jamais comme une compréhension libre du langage naturel. |
| Démarrage | `node index.js` sous Node 25.9.0 échoue avec `ERR_MODULE_NOT_FOUND` sur `import ... from "./rules"`. `index.js` n'exporte aucune fonction et n'exécute aucune commande. Aucun `package.json`, CLI ou application n'est suivi. | Aucun parcours d'installation et de premier résultat reproductible. |
| Exactitude | Dans un harnais de lecture en mémoire des deux fichiers, `non-digit character` donne `\d`, `non-alphanumeric character` donne `\w`, `between 2 and 4 times` donne `{4}`, `at least 3 times` donne `{3}` et une phrase inconnue donne une chaîne vide. Le harnais retirait seulement l'import non résolu ; il ne constitue pas un test du package exécutable. | Des regex fausses peuvent être générées sans avertissement. |
| Robustesse et sécurité | `regexMatchingThroughLines` écrit dans `regexResultList` sans déclaration (`ReferenceError` en mode strict). Les littéraux entre guillemets et les caractères de classes ne sont pas échappés ; les lignes inconnues sont ignorées. Aucun test, limite d'entrée ou politique d'exécution des regex n'est présent. | Risque d'expressions invalides ou d'une signification différente de celle demandée ; toute future interface de test doit aussi borner le travail de `RegExp`. |
| Exemples et documentation | L'exemple 2 de `README.md` répète l'entrée de l'exemple 1 mais annonce `^ABC\w+$`. Les sections Development et Contributing sont des TODO. La liste de syntaxe contient une entrée fusionnée et des formulations différentes de celles du code. | La démonstration et le contrat du langage ne sont pas fiables. |
| UX/UI et visuel | Aucun écran, site, CLI ou capture d'utilisation n'est suivi. `regexify.png` est un logo de 600 × 600 px, pas une capture du produit. | Impossible d'évaluer aujourd'hui une interface ou une expérience utilisateur réelle. |
| Architecture et maintenance | Toute la logique tient dans `index.js` (99 lignes) et trois tables dans `rules.js` ; détection par `includes`, concaténation directe et absence de diagnostics structurés. Aucun manifeste, verrou de dépendances, configuration de qualité ni tests. | Ajouter des règles augmente les ambiguïtés ; aucune régression n'est détectée automatiquement. |
| GitHub et livraison | Fichiers suivis : `LICENSE`, `README.md`, `index.js`, `rules.js`, `regexify.png`. Licence MIT présente. Aucun tag local ou distant, workflow Actions ni release GitHub (vérifiés via `git ls-remote --tags`, `gh api` et `gh release list`). Le dépôt public a une description, le seul topic `regex`, aucun lien de site et un dernier push daté du 18 mars 2019. | Il manque une distribution, une preuve de fonctionnement récente et une présentation orientée usage. |

### Positionnement à viser

Les références externes servent seulement à cadrer le marché ; elles ne prouvent aucune capacité de **ce** dépôt. [regex101](https://regex101.com/) et [RegExr](https://regexr.com/) proposent déjà l'édition/test interactif et des explications ; [JSVerbalExpressions](https://verbalexpressions.github.io/JSVerbalExpressions/) construit des regex via une API JavaScript ; [grex](https://github.com/pemistahl/grex) génère des regex à partir d'exemples. Le créneau à **valider** pour Regex For Humans est un chemin court « règles textuelles contrôlées → regex JavaScript expliquée → exemples positifs/négatifs testés », avec la même grammaire dans une bibliothèque, une CLI et un atelier web. Ne pas annoncer une supériorité, un public acquis ou un nombre futur de stars sans mesures comparatives et retours réels. Refaire ce relevé des concurrents avant toute communication publique.

### Cible de la première version publiable

- **P0, bloquant** : un compilateur déterministe et documenté pour un sous-ensemble explicite de `RegExp` JavaScript, erreurs avec ligne/colonne, bibliothèque et CLI utilisables, tests de sémantique et installation propre.
- **P1, différenciant** : atelier web local sans compte, scénarios positifs/négatifs, explication du résultat, accessibilité, exemples et documentation de qualité, CI multi-plateforme et release vérifiée.
- **P2, conditionné par l'usage** : groupes, alternance, lookaround, autres moteurs regex, édition inverse, inférence depuis exemples et exécutables autonomes. Les ajouter seulement après validation du noyau et du besoin. Une phrase arbitraire en langage naturel n'est pas l'objectif de la première release.

## Phase 0 — Contrat produit et preuve de départ (P0)

### 0.1 Définir le périmètre et le vocabulaire

- **Objectif :** rendre vérifiable ce que « for humans » accepte et produit.
- **Changements :** écrire une grammaire versionnée avec exemples valides/invalides ; choisir explicitement JavaScript RegExp, le sens de « début/fin de ligne » (`m` ou non), les drapeaux, la sensibilité à la casse et les limites des classes/littéraux ; distinguer phrases contrôlées et langage libre.
- **Zones :** nouveau `docs/LANGUAGE.md`, `README.md`, futurs jeux de fixtures `test/fixtures/`.
- **Acceptation :** chaque construction de v1 a une entrée, une sortie et au moins un contre-exemple ; les formulations non prises en charge sont nommées ; l'exemple 2 erroné est corrigé ou supprimé.
- **Validation :** revue manuelle des exemples contre `new RegExp(...)` dans la version Node choisie ; inventaire des phrases actuelles de `rules.js` sans perte accidentelle.
- **Dépendances/risques :** préalable à l'architecture ; une grammaire trop libre ferait des promesses impossibles à tester.

### 0.2 Définir le scénario d'adoption et les mesures

- **Objectif :** orienter les travaux vers un usage réel plutôt que vers un empilement de fonctions.
- **Changements :** choisir 3 tâches de référence (par exemple identifiant avec préfixe et trois chiffres, exclusion de caractères, lecture d'une règle existante), fixer la cible de premier succès, recueillir plus tard des retours de personnes non familières avec le projet.
- **Zones :** nouveau `docs/PRODUCT.md`, fixtures de démonstration, futur atelier web.
- **Acceptation :** les 3 tâches ont des entrées et résultats attendus précis ; les limites et alternatives du produit sont écrites ; aucun chiffre d'adoption n'est inventé.
- **Validation :** rejouer les tâches sur la bibliothèque, la CLI et l'atelier une fois disponibles ; consigner date, contexte, échecs et corrections des essais utilisateurs.
- **Dépendances/risques :** dépend de 0.1 ; les retours externes peuvent changer la priorité des P2.

## Phase 1 — Noyau correct et utilisable (P0)

### 1.1 Rendre le projet installable et exécutable

- **Objectif :** obtenir un premier résultat depuis un clone propre.
- **Changements :** créer `package.json`, choisir un seul format de modules, corriger les imports et déclarations, exposer une API publique stable (par exemple `compile(source)` et `toRegExp(result)`), ajouter `bin/regex-for-humans.js` avec entrée fichier/stdin, aide, sortie source/flags et codes de retour ; n'ajouter un verrou que si des dépendances sont nécessaires.
- **Zones :** `index.js`, `rules.js`, nouveau `package.json`, `bin/`, `README.md`.
- **Acceptation :** les commandes documentées fonctionnent dans un répertoire vierge avec une version Node prise en charge ; import depuis un autre projet et CLI rendent le même résultat ; aucun état global implicite.
- **Validation :** test de fumée Node, `npm pack --dry-run`, installation du tarball dans un répertoire temporaire, `--help`, stdin, fichier valide et erreur.
- **Dépendances/risques :** dépend de 0.1 ; trancher ESM/CJS et compatibilité Node avant de publier le contrat d'API.

### 1.2 Remplacer les correspondances partielles par un parseur déterministe

- **Objectif :** éliminer les collisions comme `digit`/`non-digit` et les phrases ignorées.
- **Changements :** séparer normalisation, analyse en tokens, représentation interne typée et génération ; faire correspondre des règles entières, avec priorité explicite et positions d'origine ; rejeter les lignes inconnues, ambiguës et les quantificateurs orphelins avec message, ligne, colonne et suggestion éventuelle.
- **Zones :** extraction de `index.js` et `rules.js` vers `src/parser.js`, `src/ast.js`, `src/compiler.js`, `src/diagnostics.js` (noms ajustables), `docs/LANGUAGE.md`.
- **Acceptation :** les phrases négatives donnent `\D`/`\W` ; une phrase inconnue ou un modificateur mal placé ne produit jamais une regex partielle en succès ; la compilation du même texte est déterministe.
- **Validation :** tests unitaires et corpus de fixtures valides/invalides, y compris variations d'espacement, casse si prise en charge, lignes vides et collisions de préfixes.
- **Dépendances/risques :** dépend de 1.1 ; préserver uniquement les comportements existants qui sont conformes au contrat de 0.1.

### 1.3 Corriger la sémantique et l'échappement

- **Objectif :** produire une regex valide qui correspond exactement à la règle documentée.
- **Changements :** gérer `n times`, `between n and m times`, `at least n times` dans le bon ordre ; vérifier les bornes et `n ≤ m` ; échapper les littéraux et les classes selon leur contexte ; définir des règles explicites pour `]`, `-`, `^`, `\`, points, guillemets et Unicode ; générer les ancres et drapeaux selon le contrat.
- **Zones :** `src/compiler.js`, `src/parser.js`, `docs/LANGUAGE.md`, `test/fixtures/`.
- **Acceptation :** les régressions observées (`{4}` au lieu de `{2,4}`, `{3}` au lieu de `{3,}`, `\d` au lieu de `\D`, `\w` au lieu de `\W`, `a.b` pris comme méta-expression) sont corrigées ; chaque sortie réussie compile sous `new RegExp(source, flags)`.
- **Validation :** tests de correspondance **et de non-correspondance**, tests des caractères spéciaux et bornes, comparaison bibliothèque/CLI ; fuzzing borné de l'analyseur si utile.
- **Dépendances/risques :** dépend de 1.2 ; le dialecte JavaScript a des différences Unicode et ancrage à expliquer avant toute extension.

## Phase 2 — Produit pédagogique et atelier réel (P1)

### 2.1 Ajouter des explications traçables

- **Objectif :** permettre de comprendre et corriger la regex générée.
- **Changements :** associer chaque fragment de regex à la règle source, exposer une explication structurée et des erreurs lisibles ; montrer les limites (`.` et saut de ligne, portée des ancres, classes `\w`/`\d`) plutôt qu'une description trompeuse.
- **Zones :** `src/ast.js`, `src/compiler.js`, nouvelle couche `src/explain.js`, CLI, futur atelier.
- **Acceptation :** pour chaque règle v1, le résultat affiche la portion générée et sa signification ; les diagnostics pointent la bonne ligne ; l'explication ne promet pas plus que le moteur JavaScript.
- **Validation :** tests du mapping source→sortie, revue des 3 tâches de 0.2 par un utilisateur qui n'a pas écrit le parseur.
- **Dépendances/risques :** dépend de la stabilité du format interne de phase 1 ; ne pas déduire l'explication d'une regex arbitraire non créée par l'outil.

### 2.2 Créer un atelier web utilisable sans compte

- **Objectif :** offrir une démonstration immédiate et un parcours de découverte partageable.
- **Changements :** bâtir une application statique qui importe le **même** noyau que la CLI : éditeur de règles, source/flags, explications, exemples préchargés, bouton copier, états vide/chargement/erreur, traitement local ; URLs partageables seulement si leur contenu est visible et maîtrisable par l'utilisateur.
- **Zones :** nouveau `web/` ou `app/`, styles et assets, scripts `package.json`, `README.md`.
- **Acceptation :** l'utilisateur peut ouvrir l'atelier, charger un exemple, modifier une règle, voir la regex et la copier sans réseau applicatif ni inscription ; résultats identiques à la CLI ; aucune donnée saisie n'est envoyée à un serveur par défaut.
- **Validation :** test navigateur automatisé des 3 tâches sur bureau et mobile, contrôle console, vérification réseau et fonctionnement du build statique servi localement.
- **Dépendances/risques :** dépend de 1.3 et 2.1 ; éviter de dupliquer le compilateur dans le frontend ou d'introduire une télémétrie implicite.

### 2.3 Ajouter des tests de chaînes positifs et négatifs

- **Objectif :** vérifier le sens de la regex avant sa copie dans un projet.
- **Changements :** permettre plusieurs chaînes attendues comme correspondantes/non correspondantes, afficher les écarts et les portions correspondantes, prévoir un mode de test entier vs recherche, garder des exemples reproductibles.
- **Zones :** `web/`, éventuel module `src/test-runner.js`, fixtures, CLI si utile.
- **Acceptation :** l'atelier signale clairement les faux positifs et négatifs ; les scénarios du README sont rejouables ; les choix de flags et de mode sont visibles.
- **Validation :** tests de navigateur et du module commun sur ancres, Unicode, sauts de ligne et plusieurs chaînes ; comparaison des résultats avec `RegExp` JavaScript.
- **Dépendances/risques :** dépend de 2.2 ; les entrées adversariales doivent respecter les bornes de 3.2.

### 2.4 Soigner l'interface et l'accessibilité

- **Objectif :** rendre les erreurs et les résultats compréhensibles sur écran, clavier et mobile.
- **Changements :** hiérarchie visuelle claire, lisibilité du code, états de focus, raccourcis documentés, contraste, libellés, annonce accessible des diagnostics, mise en page adaptative ; conserver le logo seulement s'il sert l'identité sans masquer le produit.
- **Zones :** composants et styles de `web/`, assets, textes d'interface.
- **Acceptation :** aucun débordement horizontal aux largeurs mobiles usuelles ; parcours complet au clavier ; aucune erreur bloquante de contraste ou libellé dans l'audit automatisé ; au moins trois personnes nouvelles peuvent réaliser les tâches de 0.2, avec leurs difficultés consignées.
- **Validation :** captures réelles bureau/mobile, navigation clavier, lecteur d'écran sur au moins un système, audit accessibilité et inspection de la console ; séparer mesures locales des retours humains externes.
- **Dépendances/risques :** dépend de 2.2–2.3 ; les retours peuvent demander une révision de la grammaire ou de l'onboarding.

## Phase 3 — Fiabilité, sécurité et maintenance (P0 avant publication)

### 3.1 Installer une suite de tests et des contrats de compatibilité

- **Objectif :** empêcher la réapparition des erreurs observées.
- **Changements :** tests unitaires parseur/compilateur/diagnostics, tests de propriétés sur l'échappement, snapshots limités aux sorties stables, tests d'intégration CLI/package/web, contrôle de style et typage statique ou TypeScript selon le coût ; versionner des fixtures lisibles par des contributeurs.
- **Zones :** `test/`, `package.json`, configuration de lint/typage, `docs/LANGUAGE.md`.
- **Acceptation :** toutes les constructions annoncées ont des cas positifs, négatifs et invalides ; une régression introduite dans une règle cruciale fait échouer la suite ; matrice des versions Node prises en charge documentée.
- **Validation :** exécuter localement format/lint/typecheck/tests/build et publier les commandes exactes ; vérifier aussi un environnement propre.
- **Dépendances/risques :** s'appuie sur phases 1–2 ; les snapshots seuls ne prouvent pas la justesse sémantique.

### 3.2 Borner les entrées et l'exécution des regex

- **Objectif :** éviter qu'une entrée ou un test bloque l'atelier ou rende une regex dangereusement surprenante.
- **Changements :** définir limites documentées de taille des règles, de profondeur/quantificateurs et de longueur des chaînes ; valider le résultat avant exécution ; isoler les tests de correspondance dans un worker interrompable ou une autre stratégie démontrée, avec timeout et message d'erreur ; ne pas rendre du HTML depuis les entrées.
- **Zones :** `src/parser.js`, `src/compiler.js`, `web/`, éventuel worker, documentation de sécurité.
- **Acceptation :** une entrée trop grande ou invalide échoue avec diagnostic ; un test pathologique n'immobilise pas durablement l'interface ; aucune donnée utilisateur n'est interprétée comme HTML ou code JavaScript.
- **Validation :** cas adversariaux documentés, tests de timeout et de reprise UI, revue des dépendances, vérification CSP et absence de requêtes de saisie hors site.
- **Dépendances/risques :** dépend de 2.3 ; les timeouts de regex JavaScript sur le thread principal ne sont pas fiables sans isolation effective.

### 3.3 Documenter l'architecture et la politique de changements

- **Objectif :** rendre les contributions sûres pour le langage et son API.
- **Changements :** expliquer parseur→AST→générateur→explication, conventions de diagnostics, politique de versionnement du langage et compatibilité CLI/API, règles de revue des nouveaux mots-clés et dépendances.
- **Zones :** nouveau `docs/ARCHITECTURE.md`, `CONTRIBUTING.md`, `docs/LANGUAGE.md`.
- **Acceptation :** une personne extérieure peut ajouter une règle et ses tests en suivant le guide ; tout changement cassant indique sa migration.
- **Validation :** exercice de contribution sur une branche jetable ou revue par un contributeur ; contrôle de cohérence des liens et commandes.
- **Dépendances/risques :** dépend de l'architecture réellement livrée ; ne pas écrire des schémas en avance puis les laisser dériver.

## Phase 4 — Installation, documentation et présentation GitHub (P1)

### 4.1 Remplacer le README provisoire par un premier succès vérifiable

- **Objectif :** faire comprendre en une minute pourquoi essayer le projet et comment réussir.
- **Changements :** titre et promesse bornée, exemple entrée→regex→tests, commandes d'installation CLI/bibliothèque, lien vers l'atelier, table du langage, limites, compatibilité, dépannage, contribution et licence ; corriger l'anglais et retirer les TODO ; donner l'alternative au téléchargement direct si aucun binaire autonome n'est livré.
- **Zones :** `README.md`, `docs/`, `package.json`.
- **Acceptation :** chaque bloc de commande copié du README réussit depuis un clone et une installation propres ; l'exemple produit exactement la sortie affichée ; aucune fonctionnalité non livrée n'est annoncée.
- **Validation :** exécuter les commandes dans un dossier temporaire et vérifier les liens/rendus Markdown sur GitHub ; faire relire le premier écran par un novice.
- **Dépendances/risques :** rédaction après phases 1–3 ; actualiser les liens publics en 5.4 pour qu'ils correspondent à la vraie publication.

### 4.2 Produire des preuves visuelles du produit réel

- **Objectif :** montrer immédiatement le flux de travail et la qualité de l'atelier.
- **Changements :** capturer l'application réelle sur bureau et mobile avec entrées et résultats vérifiés ; ajouter captures annotées sobrement, texte alternatif utile et légendes ; conserver le logo comme marque secondaire ; éviter les images de fonctionnalités futures.
- **Zones :** `docs/assets/` ou `media/`, `README.md`, éventuelle page de documentation.
- **Acceptation :** captures issues du build testé, lisibles en taille README, cohérentes avec la version publiée ; licences des éventuels assets externes conservées.
- **Validation :** comparer écran, commande et regex visibles avec la même version du code ; vérifier rendu, taille des fichiers et liens GitHub.
- **Dépendances/risques :** dépend de 2.4 ; recapturer après un changement visuel significatif.

### 4.3 Préparer l'accueil des contributions et la diffusion honnête

- **Objectif :** permettre aux utilisateurs de signaler un cas manquant et aux contributeurs de le résoudre.
- **Changements :** guide de contribution avec fixture minimale, modèles d'issue (bug de grammaire, demande de règle), modèle de PR, code de conduite si la communauté en a besoin, règles de sécurité et changelog ; définir une comparaison courte avec les autres outils et une liste de limites.
- **Zones :** `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`, description/topics/lien de démo GitHub.
- **Acceptation :** un bug peut être rapporté avec entrée, résultat attendu, moteur et version ; les métadonnées GitHub sont prêtes à pointer vers le produit accessible ; aucun badge ni chiffre non vérifié.
- **Validation :** soumettre un exemple de rapport sur brouillon local, vérifier liens/contacts, puis contrôler les métadonnées GitHub après leur application en 5.4.
- **Dépendances/risques :** préparer après stabilisation de l'atelier ; appliquer les changements distants avec la release et les vérifier après publication.

## Phase 5 — Automatisation, packaging et release (P0/P1)

### 5.1 Mettre en place une CI qui reproduit les portes locales

- **Objectif :** faire échouer les PR incorrectes avant merge.
- **Changements :** GitHub Actions pour format/lint/typage, tests, build web, `npm pack`, installation du tarball et smoke CLI ; matrice sur versions Node supportées et au moins Linux/Windows/macOS pour les chemins critiques ; permissions minimales et dépendances verrouillées si présentes.
- **Zones :** `.github/workflows/`, `package.json`, `test/`, guide de contribution.
- **Acceptation :** PR volontairement cassée échoue ; commit valide passe sur la matrice ; artefact package identique à celui testé ; badge seulement après CI réussie.
- **Validation :** consulter les jobs réels GitHub Actions et leurs logs, pas uniquement l'existence du YAML ; reproduire localement les commandes.
- **Dépendances/risques :** dépend de 3.1 et 4.1 ; CI peut révéler des différences de chemins ou versions Node.

### 5.2 Distribuer la bibliothèque, la CLI et l'atelier

- **Objectif :** permettre un essai fiable sans cloner le dépôt.
- **Changements :** limiter les fichiers inclus dans le package, définir `exports`/`bin`/`files`, publier un package npm sous un nom vérifié disponible ou choisir un nom différent ; déployer le build statique de l'atelier (GitHub Pages ou autre hébergement documenté), avec version visible et stratégie de cache.
- **Zones :** `package.json`, build `web/`, workflow de publication, `README.md`.
- **Acceptation :** `npm install` ou `npx` avec la version publiée fonctionne depuis un dossier vierge ; le site public charge, compile les mêmes fixtures et ne présente pas de 404 ; les URLs publiques et la version correspondent au tag.
- **Validation :** `npm pack`/inspection du tarball, installation de la version **publiée** dans un dossier vierge, test navigateur sur l'URL finale et comparaison avec la release.
- **Dépendances/risques :** dépend de 5.1 ; publication npm, nom de package et hébergement sont des portes externes, jamais inférées du succès local.

### 5.3 Décider des binaires autonomes à partir d'un besoin mesuré

- **Objectif :** couvrir le téléchargement sans entretenir des artefacts coûteux et trompeurs.
- **Changements :** documenter que le package npm est la voie principale pour cet outil JavaScript ; tester si les utilisateurs cibles ont réellement besoin d'une CLI sans Node. Si oui, construire des exécutables par OS/architecture avec un outil maintenu, les signer si faisable, fournir SHA-256 et une procédure de reproduction ; sinon indiquer explicitement « aucun binaire autonome » sur la release.
- **Zones :** `docs/DISTRIBUTION.md`, workflow de release, `README.md`, assets de release si décision positive.
- **Acceptation :** décision et justification consignées ; si binaires livrés, chacun démarre sur son OS cible, affiche la version et réussit une fixture depuis un poste propre ; les noms, architectures et sommes correspondent aux fichiers téléchargeables.
- **Validation :** smoke sur machines/CI cibles et vérification SHA-256 après téléchargement ; aucun lien vers un binaire absent.
- **Dépendances/risques :** après 5.2 ; génération multiplateforme, signature et taille du runtime peuvent dépasser la valeur pour un petit CLI.

### 5.4 Publier une première release attestée

- **Objectif :** donner une version stable, réinstallable et crédible.
- **Changements :** choisir version et changelog avec compatibilité/limites, tag, GitHub Release, artefact package et éventuellement binaires ; mettre à jour les métadonnées GitHub, la page de démo et les liens README ; documenter rollback et correctifs.
- **Zones :** `CHANGELOG.md`, `README.md`, workflows, métadonnées et release GitHub.
- **Acceptation :** tag, commit, package publié, release et démo pointent vers la même version ; CI du tag réussie ; notes de version décrivent seulement des capacités vérifiées ; issues de lancement critiques closes ou explicitement connues.
- **Validation :** installer depuis le registre et télécharger depuis la release, vérifier hashes si applicables, ouvrir le site public, refaire les 3 scénarios de 0.2 et contrôler les liens/badges rendus.
- **Dépendances/risques :** seulement après acceptation des phases 0–4 et 5.1–5.3 ; publication/approbations externes et cache CDN peuvent retarder la vérification finale.

## Phase 6 — Dernière phase : vraie vidéo du produit terminé (P1)

**Porte d'entrée stricte :** commencer cette phase uniquement après implémentation **et validation** de toutes les phases 0–5, y compris installation depuis la version publiée, site public et release. Une tâche bloquée garde la vidéo bloquée ; aucune maquette ou capture d'une fonction à venir ne la remplace.

### 6.1 Capturer une démonstration réelle et monter avec `ffmpeg-video-editor`

- **Objectif :** prouver le parcours complet en images fidèles au produit final.
- **Changements :** utiliser obligatoirement la skill `ffmpeg-video-editor` ; scénariser « problème concret → installation ou démarrage réel → écriture des règles → regex expliquée → tests positifs/négatifs → copie/usage CLI ou bibliothèque » ; enregistrer une session réelle de la release finale avec entrées et sorties vérifiées ; monter avec rythme, titres sobres, zooms/recadrages utiles, sous-titres et audio propre si narration nécessaire.
- **Zones :** nouveau `media/demo/` ou fichiers source de production hors Git selon leur taille, export final pour README/GitHub et éventuellement extrait court réseaux sociaux, `README.md`.
- **Acceptation :** chaque plan de produit correspond à une action réalisable sur la version publiée ; aucune maquette, écran fictif, statistique ou affirmation non démontrée ; la version visible et le script de tournage sont archivés.
- **Validation :** refaire les actions du film sur le tag final ; inspection image/son et lisibilité sur mobile ; faire vérifier par une personne qui n'a pas monté le film.
- **Dépendances/risques :** dépend de 5.4 et de tous les critères précédents ; toute correction produit qui change le parcours impose une nouvelle capture.

### 6.2 Exporter, vérifier et intégrer la vidéo

- **Objectif :** rendre la démonstration réellement lisible et partageable.
- **Changements :** exporter un MP4 compatible navigateur (H.264, `yuv420p`, `+faststart`, audio AAC seulement si nécessaire) et, si utile, une coupe courte adaptée aux réseaux ; créer une vignette extraite de la vidéo réelle ; héberger le fichier à un endroit durable et ajouter son lien au README sans gonfler inutilement Git.
- **Zones :** fichiers vidéo et vignette, `README.md`, éventuelle page de démo et notes de release.
- **Acceptation :** fichiers finaux présents à l'URL annoncée, durée/résolution/codecs/poids consignés ; vidéo regardée entièrement, son synchronisé, aucun écran coupé, texte lisible ; le lien README fonctionne.
- **Validation :** `ffprobe` pour flux, durée, résolution et codecs ; taille via système de fichiers ; décodage complet avec FFmpeg (`-f null -`) puis lecture humaine du début à la fin dans un navigateur et un lecteur local.
- **Dépendances/risques :** dépend de 6.1 ; limites de taille et d'intégration GitHub à tester sur l'URL finale. Cette phase reste la **dernière** du roadmap.

## Définition de « terminé »

La première version est publiable quand le parcours documenté fonctionne depuis une installation propre, que les exemples positifs **et** négatifs protègent la sémantique annoncée, que l'atelier est utilisable et accessible, que la CI et les artefacts publics sont vérifiés sur leurs vraies URLs, et que les limites du langage sont visibles. La vidéo n'est produite qu'ensuite. Les étoiles, la viralité, l'adoption et la qualité sur des moteurs regex non pris en charge restent des résultats à mesurer, jamais des critères que le dépôt peut garantir seul.
