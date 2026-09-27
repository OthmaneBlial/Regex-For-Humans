# Screenshot evidence

Both files are full-page Chrome captures of the local static workshop, built from commit `405ed23` with `npm run build:pages` and served at `http://127.0.0.1:4177/` on 28 September 2026. They show the `line-rule` recipe: `line start`, `any text`, `3 digits`, `line end`. All three example checks pass. The desktop view lists all four recipes; the mobile recipe bar scrolls. Both show `Rules stay local`, the visible `DEV · 0.1.0-dev` label and the shorter explanation `Exactly 3 ASCII digits (0–9).` No interface elements, examples or results were composited or edited. The screenshots contain only project-owned UI and system fonts.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `workshop-desktop-dev.png` | 1280 × 800 | 1280 × 1489 | 202.3 KiB | `e93f9804f18b0bc3ffededf181ccf0c833c9a08271a850efc8e6188191b3bb18` |
| `workshop-mobile-dev.png` | 390 × 844 | 390 × 2456 | 144.9 KiB | `2f869e484a79cecb239b91251ed493bbe9ac3fe7296322a5a479dbd640e97c87` |

The homepage preview at `site/assets/workshop-preview.png` is a separate capture of `prefixed-identifier`; its four sample checks pass.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `site/assets/workshop-preview.png` | 1280 × 800 | 1280 × 1521 | 195.7 KiB | `674814dbda1cebb8b58f09ca9dc1ba9a27a196f69dee31b69267be56b8df4491` |

These are local development captures, not published-release evidence. Re-capture from the final tested build after UX reviews before closing roadmap task 4.2.
