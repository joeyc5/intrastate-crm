# MAX4 2026 rate data — extracted from the official tariff

Extracted from `2026_max_rate_tariff.pdf` (*Maximum Rate Tariff 4, Effective January 1, 2026*, BHGS, 98 pp.) during the spec audit (see `docs/SPEC-AUDIT-2026.md`). All money is in the units noted per file. These replace the spec's stale 2025 "Tier A" values and its "Tier C, ingest later" placeholders — **almost everything is in the tariff itself; only the (now-optional) Distance Table 8 is external.**

## Files

| File | Source | Notes / confidence |
|---|---|---|
| File | Source | Confidence & notes |
|---|---|---|
| `item310_distance_rates.csv` | Item 310 (p.56–57) | **Line-haul $/100 lb matrix** — the tariff's single "Region 1" table (no Region 2 exists, so this is complete). **High confidence.** Three lines of evidence: (1) all 204 published Break Points satisfy `BP(g) ≈ min_wt(g+1)·rate(g+1)/rate(g)` and rates are monotone on both axes (a shared OCR error would break one of these); (2) two transcription passes agree; (3) **independently corroborated by a separately-created wide-format extraction (`rate_item310.csv` in the repo root) — all 238 cells match, zero mismatches.** This file adds the 7 "ADD per 50 mi over 850" cells that the wide file omits. A final cell-by-cell read against the PDF before go-live is still good practice. |
| `item320_hourly.csv` | Item 320 (p.58) | Hourly $/hr by Territory A/B, crew size, time class. Drives shuttle (Item 184), split-hourly, disassembly (Item 172). Cents. **Read & transcribed by hand (high confidence).** |
| `item340_containers.csv` | Item 340 ¶1 (p.60–62) | Container **sale price** + pack/unpack labor by Territory A/B. Dollars. Note 9: prices exclude sales tax. Note 6: loose supplies are included in the container charge. **Single extraction pass — spot-checked, not double-verified; re-check amounts before production.** |
| `item340_packing_hourly.csv` | Item 340 ¶2 (p.61) | Per-hour-per-person packing labor by Territory A/B (straight / 1.5× / 2×). Dollars. **Hand-verified against the page image (high confidence).** |
| `accessorials_148_164_184.csv` | Items 148/152/156, 164, 184 | Reclassified accessorials with their tariff maxima + basis. Bulky (164) has BOTH flat per-named-article AND lb/linear-ft weight-additive forms. **The $134.45 split-stop fee and the shuttle→Item 320 basis are hand-verified; the Item 164 per-article caps ($96.38–$334.55) are single-pass extraction — verify those amounts before production.** |
| `territories.csv` | Item 210 (p.52) | All 58 CA counties → Territory A/B. San Jose / Santa Clara = A. **Hand-verified against Item 210.** |
| `svm-config-2026.json` | — | SVM config corrected to 2026; supersedes root `svm-config.json`. |

> **Source-file naming note:** citations in the audit refer to `2026_max_rate_tariff.pdf` / `SVM-Intrastate-Quote-App-SPEC.md` etc., but the working-tree files currently carry a ` copy` suffix (`2026_max_rate_tariff copy.pdf`, `SVM-Intrastate-Quote-App-SPEC copy.md`). Rename to the canonical names when committing a baseline.

## Corrected Item 310 schema (the spec's `rate-schemas.md` was structurally wrong)

The spec assumed `weight_group_min_lb, weight_group_max_lb, mile_bracket_min, mile_bracket_max, rate` with uniform 50-mile bands and example rows like `2000,2999,100,150` and `8000,9999,301,350`. **None of that matches the tariff.** The actual Item 310 (Region 1) grid is:

- **Weight groups are single MINIMUM-weight columns, not [min,max] bands:** `ANY-QTY (<1000)`, `1000`, `2000`, `5000`, `8000`, `12000`, `16000`. (There is **no 3000 column**; weights ≥16000 use the 16000 column — no upper bound.)
- **Each weight column has a published "Break Point" (B.P.)** — the weight at which using the next minimum-weight column's lower rate is cheaper (the weight-break, Item 310 NOTE 1). The 16000 column has no B.P. (it's the top).
- **Mileage rows are OVER / NOT-OVER, variable width:** 10-mi steps to 100, then 20-mi to 200, 25-mi to 500, 50-mi to 850 (boundary belongs to the higher bracket, per Item 16).
- **Beyond 850 mi:** an `ADD ... FOR EACH 50 MILES OR FRACTION THEREOF OVER 850 MILES` row gives a per-50-mi increment per weight column. Compute as `base(800–850) + ceil((miles−850)/50) × add`.

This file is stored in **long format** (one row per cell):

```
miles_over,miles_not_over,weight_group_min_lb,rate_per_100lb,break_point_lb
0,10,0,114.49,607          # weight_group_min_lb=0 means the ANY-QTY (<1000) column
0,10,1000,69.44,1489
0,10,2000,51.69,4939
0,10,5000,51.05,7696
...
850,,0,1.95,               # ADD row: miles_not_over blank, rate = the per-50-mi increment
```

- `break_point_lb` empty on a 16000-group row = structurally absent (not unread); empty on an ADD row = N/A.
- 245 data rows = 34 mileage bands × 7 weight groups (238) + 7 ADD-row cells.

**Importer rules (revised):** validate the OVER/NOT-OVER ladder has no gaps/overlaps using the *real* edges; ingest the published Break Point per cell and assert the engine's computed weight-break crossover equals it; store the ADD-over-850 tail; stamp `tariff_edition = 2026-01-01`.

## Engine corrections this data implies (see audit §3–§4)
- Weight-break iterates the real minimum-weight columns {any, 1000, 2000, 5000, 8000, 12000, 16000}, not invented 1000-lb bands; grounded in **Item 20 + Item 310 NOTE 1**.
- Flight/long-carry = **$2.26/100 lb** on the **weight of articles actually carried** (Item 140 NOTE 3), non-discountable (Item 24 NOTE).
- Packing labor is **territory-keyed**: origin territory for packing, destination territory for unpacking (Item 340 NOTE 3).
- Shuttle / extra-stop / bulky are **tariff-capped** (Item 320 hourly / $134.45 per stop / Item 164 per-article max or weight additive) — a CONFIG fee must never exceed these.
