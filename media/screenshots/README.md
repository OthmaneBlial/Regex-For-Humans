# Screenshot evidence

Both files are full-page Chrome captures of the local static workshop, built from commit `b501422` with `npm run build` and served at `http://127.0.0.1:4174/` on 27 September 2026. They show the `line-rule` recipe using `line start`, `any text`, `3 digits`, and `line end`; all three example checks pass. The desktop view lists all four recipes; the mobile list scrolls. Both show the visible `DEV · 0.1.0-dev` label. No interface elements, examples or results were composited or edited. The screenshots contain only project-owned UI and system fonts.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `workshop-desktop-dev.png` | 1280 × 800 | 1280 × 1524 | 213 KiB | `243a5064b0642b8784f60159f8dd44c3207694b1b5dbfd5b507f6e09f4607530` |
| `workshop-mobile-dev.png` | 390 × 844 | 390 × 2479 | 153 KiB | `3efc5fa15821398827639a157b151a4ecea7a0746035ae5a0accd044d53802f2` |

The output `/^.*\d{3}$/mu` and three expected sample results match `test/fixtures/product-scenarios.json`. These are local development captures, not published-release evidence. Re-capture from the final tested build after UX reviews before closing roadmap task 4.2.
