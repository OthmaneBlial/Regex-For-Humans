# Screenshot evidence

These are full-page captures of the local static workshop from the `0.1.0-dev.4` release candidate on 10 October 2026, using installed Chrome. The visible build label is `DEV · 0.1.0-dev.4`. The build was served from `site/` on a temporary loopback port; only the owned server was stopped afterward. No UI elements or results were composited or edited. The Bricolage Grotesque font is hosted locally with its SIL Open Font License in `web/assets/OFL.txt` and `site/assets/fonts/OFL.txt`.

The README desktop and mobile captures show the `date-shape` recipe with named `year`, `month` and `day` captures. All six examples pass. The first input is `2026-10-10`; its open explorer shows the full match plus `2026`, `10`, `10`, with UTF-16 spans `0–10`, `0–4`, `5–7`, `8–10`. This validates the date shape; impossible calendar dates can also match. All eighteen recipes remain available.

The homepage preview shows `prefixed-identifier`, `/^ABC\d{3}$/u` and all four passing example checks. The capture script waits for the current result, loads the local font, returns to the top and checks the visible version, native capture values/spans, no page errors and no document overflow. All three resulting images were visually inspected.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `media/screenshots/workshop-desktop-dev.png` | 1280 × 800 | 1280 × 2091 | 334.4 KiB | `e1a2f3784e8c7715e404f6970e302d6ced991004d9fc6321f08b9bdae170f257` |
| `media/screenshots/workshop-mobile-dev.png` | 390 × 844 | 390 × 3604 | 233.3 KiB | `6fd7a31f35a90b73ab1a7272f85d7526389a0d166797077ed9eb54c3d82d955c` |
| `site/assets/workshop-preview.png` | 1280 × 800 | 1280 × 1593 | 272.0 KiB | `8cbb42a915992a4e6dd36e59136072a97dfeba20dd75bcf304fb095bbdb6bb1d` |

These are real development-preview captures, separate from release publication and human usability evidence. Full verification records are in [TESTING.md](../../docs/TESTING.md); human review gates remain open.
