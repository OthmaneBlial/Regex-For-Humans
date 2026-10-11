# Developer experience decisions

This evaluates every item in section 16 of the autonomous mission against the implemented workshop and package. It distinguishes preview workflows from follow-up work; an evaluated idea is not advertised as shipped. The [distribution receipt](DISTRIBUTION.md) records publication and verification separately. Arbitrary fixture links are included in dev.9.

| Item | Current evidence and decision |
| --- | --- |
| Copy to clipboard | The regex copy button includes permission failure and manual-selection recovery. Keep this working path. |
| Shareable URLs | Every one of the 31 recipes has a stable `?example=` link. The dev.9 workshop also copies a complete versioned fixture into a bounded URL fragment, restores it before recipes load and offers explicit replacement when another link arrives in an edited page. Clipboard failure leaves a manual-copy field; large suites retain JSON export. See [the snapshot contract](TEST_FIXTURES.md#share-a-workshop-snapshot). |
| Local autosave | Published dev.10 retains manual validated fixture save/restore. Unreleased main adds optional automatic draft recovery in a separate key/format, preserving incomplete source and raw expectation JSON. It is off by default, reports failed writes, clears the draft when disabled and pauses after external storage changes. Manual saved suites stay separate. See [the draft contract](TEST_FIXTURES.md#draft-recovery-on-unreleased-main). |
| Keyboard shortcuts | Ctrl/Cmd + Enter translates the pasted regex. Native controls, source links, editor selection and diagram navigation have keyboard checks. Rule edits compile immediately; they need no extra compile shortcut. |
| Searchable examples | Literal English/current-language search combines with 24 categories and three difficulty levels, preserving the workspace. |
| Syntax autocomplete | Follow-up after distribution. The six validated builder actions already insert editable supported syntax; future completions should reuse the grammar instead of maintaining a second list of accepted constructs. |
| Inline documentation | Flag help, source limits, diagnostics, beginner definitions, exact expectation schemas and per-recipe scope notes explain actual behavior. |
| Hover explanations | Typed trace and diagram nodes link to original rules and highlight the corresponding regex fragment. Click and keyboard selection preserve an accessible path. |
| Color-coded captures | Actual selected captures use native indices for highlighting. There is no per-capture palette. Evaluate a palette later with nested/overlapping captures, absent/empty values and contrast in both themes. |
| Error highlighting | The source mirror marks compiler-linked error positions; line/column diagnostics and source navigation remain available to keyboard users. |
| Markdown export | Follow-up. Current canonical guides and downloadable JSON/source already cover documentation and reproducible exchange. A future report should include version, flags and expected results rather than only a regex screenshot. |
| JSON export | Test fixtures export rules, flags, mode, positive/negative cases and exact expectations. Engine exports also download metadata and capture mappings. |
| Source export | Nine formats cover eight engine families with capability diagnostics. Browser examples still run in JavaScript; seven foreign-engine receipts, including PHP 8.5.11 / PCRE2 10.44 and their tested corpus boundaries, are recorded in [compatibility](COMPATIBILITY.md). |
| Transformation diff | Unreleased main adds an optional before/after comparison of validated group edits, including rules, regex, flags and updated references. Preview keeps current examples, exports and saved drafts; stale comparisons clear after source/options/group-field changes. Direct application remains available and revalidates current inputs. See [the preview contract](GROUP_PREVIEWS.md). |
| Readable regex formatting | Reverse translation yields editable structured rules and the SVG shows nested structure. Preserve the exact canonical regex string; inserting display whitespace into it can change matching semantics. |
| Accessible design | Native labeled controls, source navigation, focus/scroll preservation, both themes and 320px layouts have automated checks. Independent screen-reader and human usability reviews remain separate gates. |
| Theme preference | System/light/dark choices persist when storage is available; denied storage and live system changes have recovery checks. |
| Offline support | Compilation and matching use local browser modules/workers once loaded. The installed library/CLI need no runtime dependency. Full offline page reload is not promised; an offline cache needs an explicit update/invalidation contract before implementation. |

The VS Code extension remains a later integration, after the preview API and language contracts stabilize. Existing compilation, diagnostics, reverse conversion, capture metadata, SVG, analysis and source-export APIs are useful foundations for syntax highlighting, live feedback, hover help, code actions and a preview panel. No partial extension, service worker, completion grammar or hidden automatic storage is introduced for this release.

For explanation details and test preservation, see [explanation levels](EXPLANATION_LEVELS.md), [failure explanations](FAILURE_EXPLANATIONS.md) and [test fixtures](TEST_FIXTURES.md).
