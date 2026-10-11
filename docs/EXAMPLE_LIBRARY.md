# Example library

The workshop has 31 shared recipes, 24 categories and beginner/intermediate/expert levels.

Use **Search recipes** to find literal words in IDs, titles, limitation notes, rule text, categories or difficulty labels. English and the selected interface language are both searchable. Multiple space-separated words must all occur; the query is not executed as a regular expression. Category and difficulty filters combine with search. **Clear filters** restores the complete list and returns focus to search.

Filtering does not replace your rules, options, examples, detailed expectations or selected recipe. Selecting a recipe loads its examples and resets the workspace options. A recipe can belong to several categories; its number remains the same when filtered. The available interface languages are English, Simplified Chinese, Spanish and French. README translations also include Arabic and Urdu with explicit RTL prose and LTR code isolation.

## Categories and levels

The categories are Usernames; IDs and identifiers; Slugs; Filenames; File extensions; Hexadecimal colors; Dates; Times; ISO 8601-shaped strings; URLs; IPv4; Log extraction; HTTP headers; Markdown fragments; Version numbers; Semantic versions; Git commit hashes; UUIDs; Named fields; Repeated words; Duplicate detection; Structured text extraction; International Unicode text; Search and replacement.

- **Beginner:** short shapes and straightforward counts, literals or alternatives.
- **Intermediate:** captures, repeated groups, references, Unicode properties or small extraction workflows.
- **Expert:** longer composed formats or syntax with distinct identifier rules, including SemVer.

These levels describe the learning task. They do not certify runtime performance or portability. Repetitions, references and assertions can have engine-specific behavior; inspect the workshop's risk review and export diagnostics.

Every recipe loads its readable rules, generated JavaScript regex, rule-by-rule explanation, positive examples, negative examples and a scope note. The fixtures in [product-scenarios.json](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/test/fixtures/product-scenarios.json) are the single source shared by the CLI, compiler, reverse translation and workshop tests. The [README gallery](../README.md) links each recipe.

## Shape checks and syntax checks

The date, time, UTC timestamp and IPv4 recipes intentionally accept some impossible numeric values. Validate calendar values, time ranges and address octets separately. The HTTPS URL, HTTP header and Markdown recipes are deliberately small fragments; they are not standards-complete parsers. UUID and Git hash shapes do not verify object existence, validity or uniqueness.

The version-shape recipe permits leading zeros and has no prerelease/build suffixes. The separate semantic-version recipe checks the core, prerelease and build syntax specified by [SemVer 2.0](https://semver.org/spec/v2.0.0.html). Core numbers and numeric prerelease identifiers reject leading zeros, while build identifiers permit them. It does not compare versions, infer API compatibility or verify a release. Named captures expose major, minor, patch, prerelease and build; absent optional captures remain absent.

Git object-name shapes use 40 or 64 ASCII hexadecimal characters for SHA-1 and SHA-256, as described in Git's [hash transition documentation](https://git-scm.com/docs/hash-function-transition#_object_names). A matching string need not identify a commit, another object or any real repository entry. Abbreviated names are outside the recipe.

The Unicode recipe starts with a native Unicode letter, then accepts letters and combining marks. Its Arabic, Urdu, Hindi, Chinese and decomposed-accent examples check character membership, not normalization, grapheme boundaries or complete identifier rules. Repeated-word and duplicate-token recipes use exact backward references to one adjacent pair; they do not deduplicate arbitrary documents or lists.

## Extraction and replacement

The log-fields recipe searches a fragment and captures level and code. The header recipe captures field and value. Their examples do not imply complete HTTP or logging-format validation. The longer access-log recipe remains a shape check without field extraction.

The replace-word recipe finds `teh` at native ASCII word boundaries and preloads exact spans, capture values and replacement expectations. For `teh then teh`, search displays both matches, while the original non-global regex replaces only the first occurrence with `the`. Checking **g** changes replacement to `the then the`; the original expected result then fails until updated. No linguistic segmentation or case-insensitive correction is implied.

Export those expectations through the workshop's [test fixture controls](TEST_FIXTURES.md). Files and saved test sets remain bounded, editable and local to your browser. The DSL remains controlled English in every interface language.
