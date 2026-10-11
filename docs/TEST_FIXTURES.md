# Exact expectations and regression fixtures

Exact expectations and fixture controls are browser workshop features. The npm package provides the shared compiler and CLI.

Open **Exact expectations** beneath an example to add optional JSON assertions. The existing **Should match / Should not match** choice is still checked; every requested detail must also agree. Blank JSON removes detailed assertions. Malformed or oversized drafts stay editable, survive adding/removing other rows and stop the batch until repaired or removed. They cannot overwrite a saved valid fixture.

## Spans and capture values

`spans` is the exact ordered list of `[start,end]` pairs, with the end exclusive. Positions count UTF-16 code units: an emoji such as 😀 uses two. `captures` is an array for each match, with values in capture-number order, including named and nested captures. Use `null` for an absent capture and `""` for a participating empty capture. Repeated captures retain native JavaScript final-iteration values. Supplying either list asserts its complete length; `[]` expects no matches.

The selected match mode determines these results. **Entire string** first looks for a native match covering the entire input; if there is none, the debugger can show the first partial match. **Search anywhere** lists nonoverlapping matches, adding an internal global flag and advancing empty matches by Unicode code point. It retains sticky behavior. Neither mode changes the copied regex. For exact span/capture assertions, a native probe after the 100th match detects an additional match: a truncated list cannot pass an exact expectation. Capture positions still come only from native indices; unavailable indices are not guessed.

For example, these editable rules capture a letter, an empty group and an optional suffix:

```text
capture "letter" {
  "A"
}
capture "empty" {
}
optional capture "bee" {
  "B"
}
```

With `dgu`, search mode and the input `😀AB\r\nA` (an actual CRLF between the two records), the expectation is:

```json
{
  "spans": [[2, 4], [6, 7]],
  "captures": [["A", "", "B"], ["A", "", null]],
  "replacement": {
    "template": "$<letter>$2$3!",
    "result": "😀AB!\r\nA!"
  }
}
```

## Replacement results

`replacement` requires both a string `template` and the complete expected `result`. Replacement runs in the same worker and deadline, using the **original regex flags**, independently of the search explorer's internal flags and the entire-string wrapper. Without `g`, it changes only the first match; with `g`, it changes every match within the bounds. It supports JavaScript `$$`, `$&`, prefix/suffix, numbered and named capture replacement tokens, including native numeric fallback and absent captures. Strings are interpreted once; output is not another template. There is no arbitrary callback evaluation. The observable token semantics follow ECMAScript [GetSubstitution](https://tc39.es/ecma262/2025/multipage/text-processing.html#sec-getsubstitution).

The UI reports which requested check differs and shows the actual replacement with visibly escaped control characters. It previews at most 2,048 UTF-16 units, while comparing the complete bounded result. Matching and replacement use native `RegExp.exec`; this is not an engine execution or backtracking trace.

## Import, export and manual preservation

Open **Test fixtures** to **Import JSON**, **Export tests**, **Save locally** or **Restore saved tests**. Exported files use the following format; internal row IDs are deliberately omitted and regenerated during import:

```json
{
  "format": "regex-for-humans-tests",
  "version": 1,
  "rules": "capture \"letter\" {\n  \"A\"\n}",
  "flags": "dgu",
  "mode": "search",
  "cases": [
    {
      "text": "😀A\r\nA",
      "expected": true,
      "expect": {
        "spans": [[2, 3], [5, 6]],
        "captures": [["A"], ["A"]],
        "replacement": { "template": "$1!", "result": "😀A!\r\nA!" }
      }
    },
    { "text": "Z", "expected": false }
  ]
}
```

The entire file is validated before application. Unknown keys, formats, versions, flags and malformed examples are rejected without changing the current rules, flags or examples. Validly shaped rules may still have a compiler diagnostic: import preserves the editable draft rather than silently dropping it. A file read cannot overwrite edits or a newer fixture applied while it was pending. Imports do not change interface language, theme or URL.

Imported example strings retain CR and CRLF exactly for testing, storage and export, including after adding or removing other rows. Native textareas display LF; a visible note explains the difference. Editing that example field uses its native LF text thereafter. Recipe and ordinary manually entered examples keep their existing native-textarea normalization. Rule-editor line separators use native textarea normalization, which retains their logical DSL meaning.

Local preservation is manual and uses `regex-for-humans:tests.v1` in this origin's `localStorage`. Reloading does not automatically restore or overwrite a saved fixture. Denied storage, quota errors and corrupt saved data leave the current workshop usable. Export JSON for a durable, shareable regression corpus; browser storage can be cleared. These controls send no rules or examples to a server.

## Draft recovery on unreleased main

This source addition follows published dev.10; it is not yet in the hosted workshop. In **Test fixtures**, enable **Keep a draft in this browser** to save the editable workspace automatically. It starts off. Rules, flags, match mode, examples, raw expectation JSON and the pasted reverse-regex field are preserved, including incomplete or oversized fields that currently have diagnostics. Restoration validates the separate version 1 draft format before changing any field, then runs the normal compiler and expectation checks. An invalid expectation remains visible and stops matching until repaired. Imported example CR/CRLF is retained until that example is edited.

Drafts use `regex-for-humans:draft.v1`, separate from manual `regex-for-humans:tests.v1` fixtures. Saving a draft never replaces a manual regression suite or makes invalid expectation JSON exportable. Turning the option off removes the stored draft and cancels pending saves; a storage-removal error is reported instead of claiming deletion. Nothing is sent to a server. Browser storage is readable by other same-origin scripts and can be cleared; use JSON export for durable validated tests.

Edits are saved after 300 ms of inactivity. Pending edits also flush when the document becomes hidden or receives `pagehide`. The status distinguishes pending, saved and failed writes. A crash or process kill before the next successful save can still lose the latest changes. The complete stored JSON is limited to 4,194,304 UTF-16 units; this does not raise compiler, example or expectation limits. Denied storage, quota failures, oversized snapshots and corrupt/version-incompatible records retain the editable workspace and existing saved data.

A restored draft prevents delayed recipe loading from replacing it. An explicit incoming shared snapshot takes priority; typing before initialization retains that work. Reloading the stored recipe URL restores the draft, while a different `?example=` deliberately loads the requested recipe. Opening the base workshop without a recipe also recovers the saved draft. Invalid incoming links leave recovery available and retain their link diagnostic.

There is one draft for this origin. External storage changes pause saving in other open tabs without replacing their current work; checking the option again deliberately starts saving that tab's workspace. A stored-value check also catches a change before writing. This is conflict detection, not an atomic transaction or a guarantee against simultaneous cross-process writes: the [HTML storage standard](https://html.spec.whatwg.org/multipage/webstorage.html#the-storage-interface) specifies shared storage without a locking mechanism. Keep independent long-lived suites in exported JSON.

## Share a workshop snapshot

**dev.9:** snapshot links are included in this preview. The [distribution receipt](DISTRIBUTION.md) records the actual publication and verification state.

Open **Test fixtures** and choose **Copy share link**. The link preserves the same validated version 1 fixture as JSON export: rules, flags, match mode, positive/negative examples, exact spans, capture values and replacement expectations. Empty suites and syntactically invalid rule drafts remain shareable and editable. Malformed expectation drafts must be repaired before sharing. Interface language, theme and browser storage are not included. The generated URL keeps the workshop origin/path and omits existing query parameters and credentials.

Opening the link in a fresh page restores the snapshot before recipes load. A delayed recipe response cannot replace it or newer edits. If rules were edited before the app loaded, or a new fragment arrives within an existing page, **Load shared link** offers explicit replacement; receiving the link alone preserves the current workspace. Invalid data is validated before any application and leaves current/saved data intact. Choosing a recipe removes an old shared fragment so reloading selects that recipe.

The complete URL is limited to 32,768 ASCII characters (32 KiB). Larger workspaces receive a clear error and remain exportable as JSON; links are never truncated. The field shows the generated link for manual copying when clipboard access is refused, unavailable or times out. Editing the workspace clears the displayed snapshot, and a late clipboard response cannot replace newer feedback or move focus away from another control.

The fixture is compact JSON encoded as UTF-8/base64url in `#tests=…`, with strict decoding and the existing fixture/schema budgets. The URI fragment is handled by the user agent rather than sent during resource retrieval, as defined by [RFC 3986 section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5). The workshop does not upload the fixture. This is encoding, not encryption: anyone with the full link can read its contents, and copying or sharing it exposes those rules and examples to the recipient. The controls state this before copying.

## Bounds

| Item | Limit |
| --- | --- |
| Imported file | 4 MiB of bytes, checked before reading |
| Parsed or locally stored fixture JSON | 4,194,304 UTF-16 units |
| Complete share URL / received share fragment | 32,768 ASCII characters (32 KiB); larger suites use JSON export |
| Rules | 16,384 UTF-16 units, with existing compiler line/depth budgets |
| Cases / text per case | 100 / 2,048 UTF-16 units |
| Expectation JSON per case | 8,192 UTF-16 units, including its compact serialized form |
| Exact spans / capture match rows / captures per row | 100 / 100 / 100 |
| Replacement template | 128 UTF-16 units |
| Actual replacement output | 65,536 UTF-16 units |
| Native global replacement matches | 100 |
| Worker request | Existing 1,200 ms deadline |

The expectation JSON budget also bounds the expected replacement string; the output ceiling does not enlarge that field budget. Exceeding a replacement match/output bound returns an error without accepting partial output. Copied regexes and exported snippets do not inherit the workshop worker deadline. See [security boundaries](SECURITY_MODEL.md), [native capture semantics](LANGUAGE.md#groups-and-captures) and [verification](TESTING.md).
