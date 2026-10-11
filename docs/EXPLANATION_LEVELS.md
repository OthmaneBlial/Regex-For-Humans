# Three explanation levels

Use **Explanation level** above **How it was built** in the workshop. The intermediate level is the default.

| Level | What it shows |
| --- | --- |
| Beginner | The compiler's explanation plus short definitions of captures, groups, anchors, assertions, alternatives, backreferences, sets, Unicode properties and quantifiers |
| Intermediate | The existing rule, generated fragment and compiler explanation |
| Expert | The same explanation plus original source line/column, generated-regex UTF-16 ranges, capture numbers/names, resolved reference numbers and current flags |

All levels use the compiler's typed segments. No regex text is reparsed to invent an explanation. Names are quoted without translation. Source locations refer to the readable rules; ranges refer to the generated regex, not a matched input. Match ranges and actual capture participation remain in the test explorer. Engine compatibility remains in the separate export panel. Expert notes are structural metadata, not a runtime execution trace.

Controls, definitions and metadata labels are available in English, Simplified Chinese, Spanish and French. Canonical DSL rules and compiler explanations remain English. Changing the level preserves source, flags, examples, expectations, selected source line and visible pattern selection. It does not run matching, regenerate the diagram or apply group edits. The selected level survives recipe loading, translation, fixture application and invalid rules during the current page session; it is not a saved project preference.

The public `compile` result and API remain unchanged. These modes are workshop presentation features. They are source additions awaiting the next release after dev.6.
