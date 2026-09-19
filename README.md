# Regex For Humans

![Regex For Humans logo](regexify.png)

Regex For Humans aims to turn a small, explicit set of English instructions into a JavaScript regular expression that a developer can inspect and test. It is a controlled language, not a free-form English or AI generator.

**Current status:** development build. The library and CLI now run from a clone or a local npm tarball. The compiler still has known semantic and error-reporting defects; do not rely on its output without checking it. Nothing has been published to npm or released on GitHub yet.

With Node.js 22 or newer:

```bash
printf 'I am looking for a digit character 3 times\n' | node bin/regex-for-humans.js --json
# {"source":"\\d{3}","flags":""}
```

The CLI also accepts a file path, `-` for standard input, `--help` and `--version`. `--json` returns the source and flags separately. A library import from a local package works as `import { compile, toRegExp } from "regex-for-humans"`.

```text
at the beginning of the input
a "ABC"
digit character 3 times
end of the input
```

Intended output: `^ABC\d{3}$` with the JavaScript `u` flag. It should match `ABC123` and reject `ABC12` and `ABC1234`.

- [Language contract](docs/LANGUAGE.md): target phrases, semantics, flags and limits for version 1; not all are implemented yet.
- [Product scenarios](docs/PRODUCT.md): three exact tasks used to evaluate the library, CLI and future browser workshop.
- [Roadmap](ROADMAP.md): implementation and verification gates through a real final demo video.

The project is available under the [MIT License](LICENSE).
