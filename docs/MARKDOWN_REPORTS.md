# Workshop Markdown reports

This guide describes the local Markdown report download in the **dev.12 workshop**.

Open **Test fixtures** and choose **Export Markdown report** to download `regex-report.md`. The current rules must compile and the fixture's options, examples and exact expectation JSON must be valid. Fix a rejected field and export again; errors leave the source, unfinished expectation text and saved fixtures intact.

The report includes the workshop's displayed build label, canonical JavaScript regex and flags, full/search mode, readable rules, positive/negative example intentions, exact UTF-16 spans, ordered capture values and replacement expectations when provided. An embedded versioned JSON fixture preserves the complete snapshot, including imported CR/CRLF, Unicode and absent (`null`) versus empty (`""`) captures. Copy that JSON into a file and use **Import JSON** to reproduce the inputs and intended expectations.

The canonical regex is retained without adding mode-specific anchors. Full mode requires a match covering the whole input; search mode reports up to 100 nonoverlapping native matches. Each example starts at position zero, and sticky matching stops at the first gap. These workshop options remain part of the embedded fixture.

Exporting parses/compiles the snapshot; it **does not run matching**, wait for an active worker, certify that cases pass or include a historical test result. Run the examples in the workshop to inspect actual behavior. Downloading does not edit rules/options/examples, overwrite manual saved tests or save a new automatic draft. The existing isolated matcher and resource budgets remain unchanged.

Report headings use English, independently of the four translated interface controls/help/status. All user data stays inside code blocks; their delimiters grow beyond any backtick run in the payload, following [CommonMark fenced-code rules](https://spec.commonmark.org/0.31.2/#fenced-code-blocks). Input strings and JSON expose controls/bidirectional marks as escapes while decoding to the same values. The readable-rule block retains the original characters; the embedded JSON is the lossless reimport format.

This is a reproducible text report, not an HTML/PDF renderer or another regex target. No renderer dependency or public package API is added. Native-language, usability and screen-reader reviews remain separate. See [fixture validation and limits](TEST_FIXTURES.md) and [current distribution](DISTRIBUTION.md).
