# Screenshot evidence

Both files are full-page Chrome captures of the local static workshop, built from commit `5924e6e` with `npm run build` and served at `http://127.0.0.1:4174/` on 27 September 2026. They show the `prefixed-identifier` recipe using `start "ABC"`, `3 digits`, and `end`, plus the visible `DEV · 0.1.0-dev` label. No interface elements, examples or results were composited or edited. The screenshots contain only project-owned UI and system fonts.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `workshop-desktop-dev.png` | 1280 × 800 | 1280 × 1561 | 209 KiB | `8337435ec9eec684d88eab0573289963d2e3653fd64006022e5bba248b945bcf` |
| `workshop-mobile-dev.png` | 390 × 844 | 390 × 2577 | 152 KiB | `d833a8766176da7340de2879f2633b550fed31cb2562d05af506976c094c9ada` |

The output `/^ABC\d{3}$/u` and four expected sample results match `test/fixtures/product-scenarios.json`. These are local development captures, not published-release evidence. Re-capture from the final tested build after UX reviews before closing roadmap task 4.2.
