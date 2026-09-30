# Screenshot evidence

These are full-page Chrome captures of the local static workshop from this source tree on 30 September 2026, after `npm run verify` passed. Build fingerprint: `e4bc180e0aec`; visible version: `DEV · 0.1.0-dev`. The build was served from `site/` at `http://127.0.0.1:4187/workshop/`. No UI elements or results were composited or edited. The Bricolage Grotesque font is hosted locally and distributed with its SIL Open Font License in `web/assets/OFL.txt` and `site/assets/fonts/OFL.txt`.

The README desktop and mobile captures show the `hex-color` recipe: `start "#"`, `6 hex digits`, `end`. The generated regex is `/^#[0-9A-Fa-f]{6}$/u`; all eight example checks pass. The desktop sidebar lists six recipes; the mobile recipe bar scrolls.

The homepage preview is a separate capture of `prefixed-identifier`, with `/^ABC\d{3}$/u` and all four example checks passing.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `media/screenshots/workshop-desktop-dev.png` | 1280 × 800 | 1280 × 1771 | 216.5 KiB | `ea8ad4302ecefa895db3ee430a34863da25626109576bac93f7a756a31faf0e9` |
| `media/screenshots/workshop-mobile-dev.png` | 390 × 844 | 390 × 3051 | 161.5 KiB | `88d027526010c5ca2f8b274f681f8240b2772c6370689f1a4d56b6dc780b65e7` |
| `site/assets/workshop-preview.png` | 1280 × 800 | 1280 × 1519 | 190.4 KiB | `2ac4704f784178b02a7f7e34d77c7b58a364f7a2e68bb0736e1ba06283ae55c4` |

These are local development captures, not stable-release or human usability evidence. Re-capture after the remaining UX reviews before closing roadmap task 4.2.
