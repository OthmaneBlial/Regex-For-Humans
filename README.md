# Regex For Humans

![Regex For Humans logo](regexify.png)

Regex For Humans aims to turn a small, explicit set of English instructions into a JavaScript regular expression that a developer can inspect and test. It is a controlled language, not a free-form English or AI generator.

**Current status:** early prototype. The checked-in `index.js` does not run directly under Node because its `./rules` import cannot be resolved, and there is no installable package or CLI yet. The example below describes the intended version 1 behavior; it is not a claim about the current implementation.

```text
at the beginning of the input
a "ABC"
digit character 3 times
end of the input
```

Intended output: `^ABC\d{3}$` with the JavaScript `u` flag. It should match `ABC123` and reject `ABC12` and `ABC1234`.

- [Language contract](docs/LANGUAGE.md): supported phrases, semantics, flags and limits for version 1.
- [Product scenarios](docs/PRODUCT.md): three exact tasks used to evaluate the library, CLI and future browser workshop.
- [Roadmap](ROADMAP.md): implementation and verification gates through a real final demo video.

The project is available under the [MIT License](LICENSE).
