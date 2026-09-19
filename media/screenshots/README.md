# Screenshot evidence

Both files are full-page captures from the real local static workshop, built from commit `208abc6` with `npm run build` and served at `http://127.0.0.1:4174/` on 19 September 2026. Chrome showed the `prefixed-identifier` recipe and the visible `DEV · 0.1.0-dev` label. No interface elements, examples or results were composited or edited. The screenshots contain only project-owned UI and system fonts; no third-party image assets were added.

| File | Viewport | Pixels | Size | SHA-256 |
| --- | --- | --- | --- | --- |
| `workshop-desktop-dev.png` | 1280 × 800 | 1280 × 1560 | 154 KiB | `4201607789967064497141f8a2c33f9230c684824eb16097d586dc0cb2000a55` |
| `workshop-mobile-dev.png` | 390 × 844 | 390 × 2591 | 121 KiB | `d2c6b72f2192a0438b19c6d55150f3b38425bfac038f8e45c3dd2dcb782f4acd` |

The output `/^ABC\d{3}$/u` and the four expected sample results match `test/fixtures/product-scenarios.json`. These are development evidence only. Re-capture from the final tested build after UX reviews and verify the published version before closing roadmap task 4.2.
