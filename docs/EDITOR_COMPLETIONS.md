# Workshop rule completion

This feature is **unreleased source work**. The published npm/hosted dev.11 release does not include it; its frozen archive and tag remain unchanged.

Place a single cursor after a partial built-in character class, then choose **Complete a rule** or press **Ctrl + Space** in the editor. The native suggestion list accepts arrow keys; **Enter** or **Apply suggestion** applies the selected choice. **Escape** or **Close suggestions** restores focus without editing. Normal Enter and Tab keep their native textarea behavior. On systems that reserve Ctrl + Space, use the button.

For example, `between 2 and 5 di` offers `digit` and `digits`; selecting `digits` produces `between 2 and 5 digits`. A cursor in the middle of an unfinished word replaces its remaining letters too. Only the proposed phrase is changed: indentation, UTF-16 positions, line separators, surrounding rules and existing capture/reference targets are retained. Options, examples and exact expectations remain in place; applying a suggestion participates in opted-in draft recovery.

Suggestions derive from the parser's frozen shorthand vocabulary, including word/digit/letter/hex/space and path-segment forms. Each proposed **entire document** is parsed and compiled with the current flags before it is offered. This structural validation does not run example matching or establish native runtime support. The normal isolated matcher and existing runtime diagnostics still apply. There is no separate acceptance grammar or arbitrary natural-language interpretation.

Quoted text, capture names, comments and selected text receive no suggestions. Input-method composition does not trigger completion. Other syntax errors, an unclosed surrounding block, or source/line budgets can leave the list empty: repair them first. Changing the source, options or recipe clears the list; stale source, flags or cursor positions are checked again before application. Suggestions and user text are rendered with text nodes. The list uses English DSL phrases; controls and status have all four interface translations.

Scope is built-in character classes. It does not complete capture names, references, literal values, Unicode property names, flags or block openers. Use the existing six validated builder actions for block templates. Native undo of programmatic edits and independent screen-reader/usability reviews have not been established. Broader grammar completion remains follow-up work.
