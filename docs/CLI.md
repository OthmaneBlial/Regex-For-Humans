# Command line

With Node.js 22+, install the preview globally if you want the command on your PATH:

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

Or run directly from a clone:

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

```text
/^ABC\d{3}$/u
```

✅ `ABC123` &nbsp; ❌ `ABC12`, `ABC1234`, `abc123`

| Option | What it does |
| --- | --- |
| `--explain` | Show each rule's fragment and meaning |
| `--json` | Structured results on stdout; errors on stderr |
| `--ignore-case` | Add flag `i` |
| `--dot-all` | Add flag `s` |
| `--flags` | Select native JavaScript flags; u/v are exclusive |
| `--flags FLAGS` | Select unique `d`, `g`, `i`, `m`, `s`, `u`, `v`, `y` flags |
| `--help` | Show usage |
| `--target` | export supported semantics to the named language; see [profiles](LANGUAGE.md#engine-exports) |
| `--reverse` | Translate a JavaScript regex literal into rules |
| `--version` | Show the package version |

Read UTF-8 rules from a file or stdin. Use `--` before a filename starting with `-`.

`--help` includes a runnable POSIX-shell example. Exit codes are `0` for success/help/version, `1` for invalid rules or input/output failures, and `2` for invalid command arguments.

<details>
<summary>🔧 CLI error contract</summary>

Malformed UTF-8 is rejected with a message to save the input as UTF-8 and try again; invalid bytes are never replaced silently. This applies to both rules and reverse-mode regex literals. In JSON mode, rule diagnostics retain their codes, invalid arguments use `CLI_USAGE`, and file/runtime failures use `CLI_ERROR`, including invalid UTF-8 and stdout write failures. If stderr also fails, the CLI exits nonzero without a diagnostic.

JSON diagnostics can include `endColumn`, an exclusive one-based UTF-16 column on the same line. The workshop highlights and selects the complete known token; errors without a range retain point navigation.

Control characters and Unicode line separators from rules, arguments and filenames appear as visible escapes in CLI output. JSON decoding restores the original data; displayed regexes still match the original characters.

</details>

## Translate a regex back into rules

The `0.1.0-dev.13` preview includes `--reverse`. Translate a slash-delimited JavaScript regex with `u` or `v`:

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

Use `--reverse --json` for `{ rules, flags }`, matching `regexToRules()`. Pass the returned `flags` to `compile(rules, { flags })` to preserve native matching and cursor behavior. All eight flags are supported; g/y regexes remain stateful. Text output reports required options on stderr while retaining a successful exit code.
