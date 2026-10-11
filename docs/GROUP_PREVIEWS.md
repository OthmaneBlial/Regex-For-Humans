# Preview group transformations

This workshop workflow is prepared for the dev.11 preview, following its verified source milestone on `main`. It adds no library API or dependency. [Distribution receipts](DISTRIBUTION.md) distinguish candidate preparation from actual npm/site publication.

Open **Edit groups and references**, choose a group, set its type or name, then select **Preview group edit**. The preview shows the current and proposed readable rules and JavaScript regex, including their flags. Renamed references and renumbered captures use the same validated `editGroup` transformation as **Apply group edit**.

The preview keeps the current editor, generated regex, examples, fixture exports and saved draft. **Apply group edit** validates the current inputs again and applies them through the normal compiler and isolated test worker. **Close preview** returns keyboard focus to the preview button. Direct application remains available, including Enter from the name field.

## Reading the comparison

The before/after labels identify each side. Removed text has a strike-through; proposed text is underlined. The comparison aligns identical complete lines, keeping unchanged group bodies neutral between renamed headers and references. Each changed run marks its first-to-last differing region; shared text inside that run can remain included. This is a bounded text comparison, not a minimal character edit sequence or a semantic-equivalence proof.

Line breaks remain visible. Other control characters, including bidirectional controls, appear as Unicode escapes. The comparison uses complete Unicode code points so an astral character is never split between the context and changed region. Line alignment is bounded by the existing compiler line budget; oversized direct helper inputs use one changed region without allocating an oversized alignment matrix. User text is inserted as text nodes, including comments containing HTML. Code areas use left-to-right isolation, wrap long lines and support keyboard scrolling in both themes.

## Validation and stale previews

The shared parser/compiler validates the entire original and proposed documents. A referenced capture cannot become noncapturing; invalid or duplicate names and proposals exceeding the source budget receive the same positioned rejection as direct edits. A rejected proposal leaves current work unchanged and clears any previous comparison. An unchanged proposal reports that there are no changes to preview.

Changing the rules, regex flags, selected group, group type or name clears the comparison. Recipe selection, fixture loading, regex import and rule-builder insertion also recompile and clear it. Interface language and theme changes keep a valid comparison and update its labels. Preview state is temporary and is neither shared nor restored as a saved draft.

Preview compiles structure; it does not execute candidate matches or measure performance. Apply the proposal to run the existing regression examples. Named-capture renaming can change consumers' named-value keys, and capture-type changes can change capture numbering and values even when match text stays the same. Existing reference targets are preserved; external consumer expectations still need review.

See [the architecture](ARCHITECTURE.md#group-editing), [test fixtures](TEST_FIXTURES.md), [developer experience decisions](DEVELOPER_EXPERIENCE.md) and [distribution record](DISTRIBUTION.md).
