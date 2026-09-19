# Regex For Humans

Write a small JavaScript regex as explicit English rules. See how each rule becomes a regex fragment, then check examples locally before copying the result.

Regex For Humans has a deliberately limited vocabulary. It does not guess from arbitrary English or examples. The same compiler powers a JavaScript library, a CLI and a static browser workshop.

**Status:** development build. These surfaces run from this repository. The package is not published to npm, the workshop is not publicly deployed, and there is no GitHub Release or standalone binary yet.

## A first regex from a clone

With Node.js 22 or newer:

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'at the beginning of the input\na "ABC"\ndigit character 3 times\nend of the input\n' | node bin/regex-for-humans.js
# /^ABC\d{3}$/u
```

`ABC123` matches; `ABC12`, `ABC1234` and `abc123` do not. The `u` flag is always present, so matching follows JavaScript's Unicode regex mode. Add `--explain` to see the fragment and explanation for every instruction, or `--json` for structured source, flags and source locations.

The library uses the same compiler:

```sh
node --input-type=module <<'JS'
import { compile, toRegExp } from './index.js';
const rules = `at the beginning of the input
a "ABC"
digit character 3 times
end of the input`;
const result = compile(rules);
console.log(`/${result.source}/${result.flags}`);
console.log(toRegExp(result).test('ABC123'));
JS
# /^ABC\d{3}$/u
# true
```

Until an npm release exists, use the CLI from this clone or import `./index.js` from a local checkout. There is no downloadable executable to install without Node.

## Try the browser workshop

```sh
npm ci
npm run build
npm run serve
```

Open **http://127.0.0.1:4174/**. Pick one of three reference recipes, edit a rule, inspect the generated pattern and its explanation, then add positive and negative examples. “Read the syntax” opens a local HTML quick reference. The browser compiles locally and runs example matching in a worker with a timeout. Typed rules and examples are not sent to an application backend; the [security model](docs/SECURITY_MODEL.md) describes the limits and ordinary static-host access logs.

The workshop has been checked in local Chrome at desktop and mobile viewports. Automated tests cover keyboard navigation, common WCAG A/AA issues, editing, copying, Unicode, multiline cases and worker timeout. Real screen-reader and new-user checks remain open in the [roadmap](ROADMAP.md).

### Real workshop preview

This is the local `0.1.0-dev` build running the prefixed-identifier recipe. The visible rules compile to `/^ABC\d{3}$/u`; one string matches and three are rejected. These screenshots will be refreshed after the remaining user reviews and before a release.

![Desktop workshop showing the source rules, explained regex and four passing positive or negative checks](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png)

<details>
<summary>View the real mobile workshop capture</summary>

![Mobile workshop showing the same rule, generated regex, explanations and example results](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-mobile-dev.png)

</details>

[Capture provenance and source files](media/screenshots/README.md).

## What the language covers

| Rule type | Example | JavaScript source |
| --- | --- | --- |
| Input or line boundary | `at the beginning of the input` | `^` |
| Character class | `digit character` | `\d` |
| Negative class | `non-digit character` | `\D` |
| Literal text | `a "ABC"` | `ABC` |
| Character set | `anything except the following characters: a, b` | `[^ab]` |
| Repetition | `digit character 3 times` | `\d{3}` |

Read the [full language contract](docs/LANGUAGE.md) for exact phrases, flags, escaping, examples and limits. Version 1 targets JavaScript `RegExp` only. It does not offer groups, alternation, lookaround, arbitrary raw regex or reverse regex translation. Unknown or malformed instructions return a line/column diagnostic rather than a partial expression. Test a copied regex in its target runtime, especially if it will process long or untrusted text.

This project is for people who prefer an explicit rule specification and a visible rule-to-fragment explanation. [regex101](https://regex101.com/) and [RegExr](https://regexr.com/) are established interactive regex editors; [JSVerbalExpressions](https://verbalexpressions.github.io/JSVerbalExpressions/) offers a JavaScript builder API, while [grex](https://github.com/pemistahl/grex) starts from examples. These are different workflows. No comparative speed or usability advantage is claimed here.

## Develop and contribute

```sh
npm ci
npm run check
npm test
npm run build
npm run test:package
npx playwright install chromium
npm run test:browser
```

`npm run check` covers format, lint, strict type checking of the compiler/CLI and local documentation links. The current suite has 41 Node tests and 32 browser tests; [testing and compatibility](docs/TESTING.md) records the versions and evidence boundaries. To report a missing phrase or change the grammar, follow [CONTRIBUTING.md](CONTRIBUTING.md) and the [architecture policy](docs/ARCHITECTURE.md). The [product scenarios](docs/PRODUCT.md) define the three reference tasks.

Report suspected vulnerabilities through the private channel in [SECURITY.md](SECURITY.md). Licensed under [MIT](LICENSE). The [changelog](CHANGELOG.md) records repository changes; the [roadmap](ROADMAP.md) tracks publication gates and the final real-product demonstration video. The [release preflight](docs/RELEASE-PREFLIGHT.md) describes how the eventual npm package, Pages deployment and GitHub Release will be verified.
