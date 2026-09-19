# Usability and accessibility review

**Status: not run with external participants.** This file is a protocol and evidence template. Automated browser tests and an accessibility tree are not a substitute for a new user's experience or a screen reader session.

## Study protocol

Invite at least three people who have not seen the project. Use the tested release candidate or public workshop URL and record its version. Do not explain the syntax before the task. Ask each person to:

1. Load the prefixed-identifier recipe, change its prefix, add one string that should match and one that should not, then copy the regex.
2. Use the exclusion recipe to prevent a chosen character and explain why the negative example fails.
3. Open the line-rule recipe and explain what the `m` flag and `.*` change.

Record whether the person completed each task without help, time to first valid copy, incorrect assumptions, confusing labels, navigation difficulty, and suggested changes. Ask permission before recording a screen or voice. Keep only anonymized observations in the repository. Do not report a success rate until real sessions are complete.

After the tasks, ask whether installing Node/npm is a barrier to using the CLI, whether the browser workshop is enough, and which operating system/architecture they would need for an executable without Node. Record the concrete reason; this informs the [distribution decision](DISTRIBUTION.md) rather than assuming demand for binaries.

| Session | Version and environment | Tasks completed without help | Time to first copy | Main difficulty | Follow-up change |
| --- | --- | --- | --- | --- | --- |
| Participant A | Pending | Pending | Pending | Pending | Pending |
| Participant B | Pending | Pending | Pending | Pending | Pending |
| Participant C | Pending | Pending | Pending | Pending | Pending |

## Accessibility review protocol

- Automated: run `npm run test:browser`. The axe checks cover WCAG A/AA rules that can be detected automatically in the ready and error states on desktop and mobile. Record the run and version; a green result does not prove full WCAG conformance.
- Keyboard: from the top of the page, reach the skip link, recipes, editor, flag toggles, copy button, match-mode selector and all example controls. Verify visible focus and the ability to activate each control without a mouse.
- Screen reader: on at least one actual screen reader/browser pair, read the page headings and landmarks, interact with the editor and recipe controls, trigger an invalid rule and a failed example, then confirm the changed status and diagnostic are announced usefully. Record system, browser, reader, findings and fixes here.
- Mobile: check 320 px and 390 px widths for horizontal overflow and readable control labels; inspect the real rendered page, not only viewport metrics.

**Current local evidence (19 September 2026):** 10 accessibility browser tests pass after a contrast correction, including the local syntax guide and visible build version. The workshop was visually inspected at 1280, 390 and 320 px; the guide was inspected at 1280 and 390 px. Automated checks cover desktop/mobile overflow. Screen reader and participant sessions remain unverified.
