# Screenshot evidence

Both files are full-page Chrome captures of the local static workshop, built from commit `3d43554` with `npm run build:pages` and served at `http://127.0.0.1:4177/` on 28 September 2026. They show the `line-rule` recipe: `line start`, `any text`, `3 digits`, `line end`. All three example checks pass. The desktop view lists all four recipes; the mobile recipe bar scrolls. Both show `Rules stay local`, the visible `DEV · 0.1.0-dev` label and shorter rule explanations, including `Exactly 3 digits (0–9).` No interface elements, examples or results were composited or edited. The screenshots contain only project-owned UI and system fonts.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `workshop-desktop-dev.png` | 1280 × 800 | 1280 × 1489 | 199.2 KiB | `7159e6be7c490b1bd33645458ba4fcd86943557363aa04831b6362d84288f1c9` |
| `workshop-mobile-dev.png` | 390 × 844 | 390 × 2424 | 141.8 KiB | `0b19249ab8069ab4f7d577ac6c759595461c76714b76e4e8ea586f1bc7eef86e` |

The homepage preview at `site/assets/workshop-preview.png` is a separate capture of `prefixed-identifier`; its four sample checks pass.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `site/assets/workshop-preview.png` | 1280 × 800 | 1280 × 1521 | 195.1 KiB | `2d128ad4f7f855eb61d3ee67a1c7d0b5ed3c37d6d7aadf68d83459c117896db2` |

These are local development captures, not published-release evidence. Re-capture from the final tested build after UX reviews before closing roadmap task 4.2.
