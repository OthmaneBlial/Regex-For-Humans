# Screenshot evidence

These are full-page Chrome captures of the local static workshop from this source tree on 1 October 2026. The full local verification passed at source commit `3347541`; the updated homepage and workshop passed all 54 desktop/mobile site tests after documentation updates. Build fingerprint: `c3ba95364088`; visible version: `DEV · 0.1.0-dev`. The build was served from `site/` at `http://127.0.0.1:4192/workshop/`. No UI elements or results were composited or edited. The Bricolage Grotesque font is hosted locally and distributed with its SIL Open Font License in `web/assets/OFL.txt` and `site/assets/fonts/OFL.txt`.

The README desktop and mobile captures show the `hex-color` recipe: `start "#"`, `6 hex digits`, `end`. The generated regex is `/^#[0-9A-Fa-f]{6}$/u`; all eight example checks pass. The desktop sidebar lists all fourteen recipes; the mobile recipe bar scrolls. Both captures show the selected recipe's limits beside its rules.

The homepage preview is a separate capture of `prefixed-identifier`, with `/^ABC\d{3}$/u` and all four example checks passing.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `media/screenshots/workshop-desktop-dev.png` | 1280 × 800 | 1280 × 1843 | 277.5 KiB | `89bc7db9875a68074d1844b93b3485b198f2492478015d92239f3b170c556dcc` |
| `media/screenshots/workshop-mobile-dev.png` | 390 × 844 | 390 × 3307 | 191.2 KiB | `8f26739ed284bfd156279f5e8ad9f51069b615ce496b9ec2774e93aa3ccb7c4d` |
| `site/assets/workshop-preview.png` | 1280 × 800 | 1280 × 1591 | 249.4 KiB | `34dd6038942f35b2499c6f99640d926c752a061ee92d0fb29268f10178fbd5e2` |

These are local development captures, not stable-release or human usability evidence. Re-capture after the remaining UX reviews before closing roadmap task 4.2.
