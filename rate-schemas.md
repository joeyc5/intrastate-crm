# Rate data schemas & ingest rules (Tier C)

These two datasets are the pricing engine's backbone. They are **ingested as versioned data files, never hardcoded** (MAX4 revises; current edition effective 2025-01-01). Build an importer that validates each file against the schema below, stamps the tariff effective date, and marks one version active. The engine reads the active version. **If a required value is missing, fail loudly — never estimate a rate cell or a mileage.**

Authoritative source: BHGS — `https://bhgs.dca.ca.gov/` (full MAX4 tariff: `https://bhgs.dca.ca.gov/industry/maxratetariff4.pdf`). Item 310, Item 340, and Distance Table 8 live in the full tariff / rate publication; extract to the CSVs below.

---

## 1. Item 310 — Distance Rate matrix → `rate_item310.csv`

The line-haul rate: dollars per 100 lb, indexed by **weight group** and **constructive-mile bracket**. Rate per 100 lb falls as weight and distance rise, which is what makes the weight-break rule matter (see engine §6, Step 3).

```
weight_group_min_lb,weight_group_max_lb,mile_bracket_min,mile_bracket_max,rate_cents_per_100lb,tariff_edition
2000,2999,100,150,<cents>,2025-01-01
2000,2999,151,200,<cents>,2025-01-01
...
8000,9999,301,350,<cents>,2025-01-01
...
```

Rules:
- Brackets are inclusive ranges; the importer must verify there are **no gaps or overlaps** across the full weight × mileage space the tariff covers.
- The lowest weight group's floor is the practical pricing minimum (combine with `min_weight_lb`).
- Store `rate_cents_per_100lb` as integer cents.
- **Weight-break / as-rated weight:** the engine computes `min` over the actual group and each higher group of `chargeable_weight_g × rate(g)`, where `chargeable_weight_g` = actual weight for the actual group and the group's `weight_group_min_lb` for higher groups. The data file just supplies cells; the optimization lives in code.

## 2. Distance Table 8 — constructive miles → `distance_table8.csv`

```
origin_key,dest_key,constructive_miles,tariff_edition
SAN JOSE,LOS ANGELES,<miles>,2025-01-01
95125,90001,<miles>,2025-01-01
...
```

Rules:
- `*_key` may be a city name (normalized upper-case) or a ZIP; pick one canonical scheme and document it. ZIP-based is most robust for an app.
- Treat as **symmetric** (A→B = B→A) unless the tariff says otherwise; importer can expand one direction.
- **Resolver / fallback (engine §16):** exact pair → else nearest known key (city centroid or ZIP prefix) → flag the quote "distance estimated, confirm." Never silently fabricate a mileage. Sub-100-mile results block the quote.

## 3. Item 340 — Packing/unpacking labor → `packing_rates.csv`

```
container_type,pack_rate_cents,unpack_rate_cents,source
book_1.5,<cents>,<cents>,Item 340
medium_3.0,<cents>,<cents>,Item 340
large_4.5,<cents>,<cents>,Item 340
dishpack_5.2,<cents>,<cents>,Item 340
wardrobe,<cents>,<cents>,Item 340
mirror_carton,<cents>,<cents>,Item 340
...
```

Rules:
- Per-container labor; maps to `materials-catalog.csv` container types and to `quote_material`/inventory packed flags.
- Item 340 also fixes **carton/material max sale prices** → populate `materials-catalog.csv:max_price_cents`. SVM's own price (`svm_price_cents`) must be ≤ max.

---

### Importer acceptance
- Schema validated, integer cents enforced, effective date stamped, exactly one active version.
- Coverage check on Item 310 (no gaps/overlaps).
- Round-trip test: a known route + weight reproduces a hand-checked line-haul (see SPEC §17/§18).
