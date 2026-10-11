# Screenshot evidence

These are full-page captures of the local static workshop from the `0.1.0-dev.11` release candidate, based on source `4be8b4f` plus synchronized release metadata/documentation, on 11 October 2026, using installed Chrome. The visible build label is `DEV · 0.1.0-dev.11`. The build was served from `site/` on a temporary loopback port; only the owned server was stopped afterward. No UI elements or results were composited or edited. The Bricolage Grotesque font is hosted locally with its SIL Open Font License in `web/assets/OFL.txt` and `site/assets/fonts/OFL.txt`.

The README desktop and mobile captures show the `date-shape` recipe with named `year`, `month` and `day` captures. All six examples pass. The first input is `2026-10-10`; its open explorer shows the full match plus `2026`, `10`, `10`, with UTF-16 spans `0–10`, `0–4`, `5–7`, `8–10`. The open Test fixtures panel shows Copy share link and its content disclosure, plus optional Keep a draft in this browser with saving off. Before capture, a separate group-editor view verifies a proposed `calendarYear` rename without applying it or changing the rules/results; the group editor is collapsed for these full-page views. This validates the date shape; impossible calendar dates can also match. All 31 searchable recipes remain available.

The homepage preview shows `prefixed-identifier`, `/^ABC\d{3}$/u` and all four passing example checks. The capture script waits for the current result, loads the local font, returns to the top and checks the visible version, native capture values/spans, no page errors and no document overflow. All three resulting images were visually inspected.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `media/screenshots/workshop-desktop-dev.png` | 1280 × 800 | 1280 × 3179 | 449.7 KiB | `c3ae9d3d6e2db4a8a156931c82c9a0d126c701f186155e8058867c6a9d5d2f86` |
| `media/screenshots/workshop-mobile-dev.png` | 390 × 844 | 390 × 5608 | 388.3 KiB | `a67920bf02666889e2880b775badea6241e43896c59ede5623e793c52b12701d` |
| `site/assets/workshop-preview.png` | 1280 × 800 | 1280 × 2277 | 332.1 KiB | `75c825f2553c876fa835ad0c577adfc0a3eb7914b63151366dd1daf072a4b9c5` |

These are real development-preview captures, separate from release publication and human usability evidence. Full verification records are in [TESTING.md](../../docs/TESTING.md); human review gates remain open.
