# Screenshot evidence

These are full-page captures of the local static workshop from the `0.1.0-dev.9` release candidate, based on source `14b4e5c`, on 11 October 2026, using installed Chrome. The visible build label is `DEV · 0.1.0-dev.9`. The build was served from `site/` on a temporary loopback port; only the owned server was stopped afterward. No UI elements or results were composited or edited. The Bricolage Grotesque font is hosted locally with its SIL Open Font License in `web/assets/OFL.txt` and `site/assets/fonts/OFL.txt`.

The README desktop and mobile captures show the `date-shape` recipe with named `year`, `month` and `day` captures. All six examples pass. The first input is `2026-10-10`; its open explorer shows the full match plus `2026`, `10`, `10`, with UTF-16 spans `0–10`, `0–4`, `5–7`, `8–10`. The open Test fixtures panel shows the new Copy share link control and its disclosure that anyone with the link can read the included rules and examples. This validates the date shape; impossible calendar dates can also match. All 31 searchable recipes remain available.

The homepage preview shows `prefixed-identifier`, `/^ABC\d{3}$/u` and all four passing example checks. The capture script waits for the current result, loads the local font, returns to the top and checks the visible version, native capture values/spans, no page errors and no document overflow. All three resulting images were visually inspected.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `media/screenshots/workshop-desktop-dev.png` | 1280 × 800 | 1280 × 3079 | 433.0 KiB | `e6ff4e7f61e205648dc470a71275996608dece668f1d47efe726152eb762c8aa` |
| `media/screenshots/workshop-mobile-dev.png` | 390 × 844 | 390 × 5472 | 375.5 KiB | `a472cad94616b66a04b9a2857ca57cf4659445392564d1428b5cddf797965aa7` |
| `site/assets/workshop-preview.png` | 1280 × 800 | 1280 × 2277 | 331.7 KiB | `543430c4d5c083b738c429adbd8a2e0c403a6109db4d4c77222fe561e8bd501f` |

These are real development-preview captures, separate from release publication and human usability evidence. Full verification records are in [TESTING.md](../../docs/TESTING.md); human review gates remain open.
