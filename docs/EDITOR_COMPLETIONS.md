# Workshop rule completion

This feature is **unreleased source work**. The published npm/hosted dev.11 release does not include it; its frozen archive and tag remain unchanged.

Place a single cursor after a partial built-in character class or capture reference, then choose **Complete a rule** or press **Ctrl + Space** in the editor. The native suggestion list accepts arrow keys; **Enter** or **Apply suggestion** applies the selected choice. The preview below the list displays the complete selected rule, including long names on narrow screens, without editing or saving the source. **Escape** or **Close suggestions** restores focus without editing. Normal Enter and Tab keep their native textarea behavior. On systems that reserve Ctrl + Space, use the button.

For example, `between 2 and 5 di` offers `digit` and `digits`; selecting `digits` produces `between 2 and 5 digits`. A cursor in the middle of an unfinished word replaces its remaining letters too. Only the proposed phrase is changed: indentation, UTF-16 positions, line separators, surrounding rules and existing capture/reference targets are retained. Options, examples and exact expectations remain in place; applying a suggestion participates in opted-in draft recovery.

With a previously closed capture, `same as ca` offers complete references by number and, when available, by name. For example:

```text
start
capture "token" {
  "A"
}
same as ca
end
```

Selecting `same as capture "token"` produces a valid rule matching `AA`. Open or later groups are not offered. After ten closed captures, `same as capture 1` can offer `same as capture 10`; completing it does not renumber any capture or existing reference. A closed optional capture can still be absent during matching: a suggestion validates the reference, not participation on a particular input.

Class suggestions derive from the parser's frozen shorthand vocabulary, including word/digit/letter/hex/space and path-segment forms. Reference suggestions reuse the parser's reference phrase and the compiler's closed-capture metadata. Each proposed **entire document** is parsed and compiled with the current flags before it is offered. This structural validation does not run example matching or establish native runtime support. The normal isolated matcher and existing runtime diagnostics still apply. There is no separate acceptance grammar or arbitrary natural-language interpretation.

Quoted text, capture names, comments and selected text receive no suggestions. Input-method composition does not trigger completion. Other syntax errors, an unclosed surrounding block, or source/line budgets can leave the list empty: repair them first. Changing the source, options or recipe clears the list; stale source, flags or cursor positions are checked again before application. Suggestions and user text are rendered with text nodes. The list uses English DSL phrases; controls and status have all four interface translations.

Scope is built-in character classes and complete references to earlier closed captures. It does not complete inside quoted names, capture definitions, literal values, Unicode property names, flags or block openers. Use the existing six validated builder actions for block templates. Native undo of programmatic edits and independent screen-reader/usability reviews have not been established. Broader grammar completion remains follow-up work.
