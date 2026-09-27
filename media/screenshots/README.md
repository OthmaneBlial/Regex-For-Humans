# Screenshot evidence

Both files are full-page Chrome captures of the local static workshop, built from commit `b19b694` with `npm run build` and served at `http://127.0.0.1:4175/` on 27 September 2026. They show the `line-rule` recipe with short rules: `line start`, `any text`, `3 digits`, and `line end`. All three example checks pass. The desktop view lists all four recipes; the mobile list scrolls. Both show `Rules stay local` and the visible `DEV · 0.1.0-dev` label. No interface elements, examples or results were composited or edited. The screenshots contain only project-owned UI and system fonts.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `workshop-desktop-dev.png` | 1280 × 800 | 1280 × 1524 | 212.3 KiB | `d3e0ee068c92f18b43eda63fadd2e5b6eccd80b217d3e57566730a96bdc1d096` |
| `workshop-mobile-dev.png` | 390 × 844 | 390 × 2479 | 153.1 KiB | `4c2ac087e9f2cb39b26801dc43c67261edd234b77e48ecb561d1b9846545ff4b` |

The output `/^.*\d{3}$/mu` and three expected sample results match `test/fixtures/product-scenarios.json`. These are local development captures, not published-release evidence. Re-capture from the final tested build after UX reviews before closing roadmap task 4.2.
