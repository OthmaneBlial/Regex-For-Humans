# Regex For Humans

![Regex For Humans logo](regexify.png)

Regex For Humans aims to turn a small, explicit set of English instructions into a JavaScript regular expression that a developer can inspect and test. It is a controlled language, not a free-form English or AI generator.

**Current status:** development build. The controlled-English compiler, library, CLI and local browser workshop run from this clone. Browser test isolation, wider automated QA, CI and release are still in progress. Nothing has been published to npm or released on GitHub yet.

With Node.js 22 or newer:

```bash
printf 'I am looking for a digit character 3 times\n' | node bin/regex-for-humans.js
# /\d{3}/u
```

The CLI also accepts a file path, `-` for standard input, `--ignore-case`, `--dot-all`, `--explain`, `--help` and `--version`. `--json` returns source, flags and a map from output fragments to input rules, including their explanations. A library import from a local package works as `import { compile, toRegExp } from "regex-for-humans"`. Run the current test suite with `npm test`.

To try the browser workshop locally, build and serve the static site:

```bash
npm run build
python3 -m http.server 4173 --directory dist
# Open http://localhost:4173/
```

The workshop loads the three reference recipes, compiles in the browser and checks positive and negative strings locally. The URL contains only a recipe ID, never the rules you type.

For automated browser checks, run `npm ci` followed by `npm run test:browser`. The local suite uses installed Google Chrome; the CI configuration will install its own browser when added. The suite covers desktop and mobile viewports, copy, diagnostics, Unicode and multiline examples.

```text
at the beginning of the input
a "ABC"
digit character 3 times
end of the input
```

Output: `^ABC\d{3}$` with the JavaScript `u` flag. It matches `ABC123` and rejects `ABC12` and `ABC1234` in the reference tests.

- [Language contract](docs/LANGUAGE.md): supported phrases, semantics, flags and limits for the current compiler.
- [Product scenarios](docs/PRODUCT.md): three exact tasks used to evaluate the library, CLI and future browser workshop.
- [Roadmap](ROADMAP.md): implementation and verification gates through a real final demo video.

The project is available under the [MIT License](LICENSE).
