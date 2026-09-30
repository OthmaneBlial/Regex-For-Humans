# Screenshot evidence

These are full-page Chrome captures of the local static workshop from this source tree on 30 September 2026, after `npm run verify` passed. Build fingerprint: `ddf21013587c`; visible version: `DEV · 0.1.0-dev`. The build was served from `site/` at `http://127.0.0.1:4191/workshop/`. No UI elements or results were composited or edited. The Bricolage Grotesque font is hosted locally and distributed with its SIL Open Font License in `web/assets/OFL.txt` and `site/assets/fonts/OFL.txt`.

The README desktop and mobile captures show the `hex-color` recipe: `start "#"`, `6 hex digits`, `end`. The generated regex is `/^#[0-9A-Fa-f]{6}$/u`; all eight example checks pass. The desktop sidebar lists seven recipes; the mobile recipe bar scrolls. Both captures show the selected recipe's limits beside its rules.

The homepage preview is a separate capture of `prefixed-identifier`, with `/^ABC\d{3}$/u` and all four example checks passing.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `media/screenshots/workshop-desktop-dev.png` | 1280 × 800 | 1280 × 1771 | 228.6 KiB | `0aa7a9f27078a5722e5e3af47a80b6f81383e9e8357e48ad7883b6cb8f35f8b9` |
| `media/screenshots/workshop-mobile-dev.png` | 390 × 844 | 390 × 3125 | 169.4 KiB | `68866e560029457ebad6b725b6883d0f9ca6f6947f3f993126c9dc1174c38345` |
| `site/assets/workshop-preview.png` | 1280 × 800 | 1280 × 1519 | 200.1 KiB | `86a0caaaef46976dd13beaf92fc74df16a8414f460fc353fff1430c1fb9966bf` |

These are local development captures, not stable-release or human usability evidence. Re-capture after the remaining UX reviews before closing roadmap task 4.2.
