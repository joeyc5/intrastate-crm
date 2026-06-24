# SVM Intrastate Move Quoting App — project handoff

This folder is the build package for a CRM-style quoting app for **Silicon Valley Moving & Storage**, covering **California intrastate household goods moves of 100+ constructive miles** priced under BHGS **Maximum Rate Tariff 4 (MAX4)**.

## Read in this order
1. **`CLAUDE.md`** — project rules, golden constraints, conventions, where things live. (Auto-loaded by Claude Code.)
2. **`SVM-Intrastate-Quote-App-SPEC.md`** — the full functional/build spec: scope, regulatory frame, data model, the quote engine/formula, accessorials, valuation, outputs, UI, edge cases, worked example, acceptance tests, build sequence.
3. **`rate-schemas.md`** — schemas + import rules for the two ingested datasets (Item 310 rate matrix, Distance Table 8) and Item 340 packing rates.
4. **`OPEN-ITEMS.md`** — what's still to supply or confirm (SVM inputs + tariff values).

## Data files
- **`svm-config.json`** — SVM identity + all configurable defaults (single source of truth for config).
- **`cube-catalog.csv`** — Table of Measurements (item → cubic feet) for the inventory sizing path. Tier B; reconcile to Item 410.
- **`materials-catalog.csv`** — cartons/supplies (cube + price + taxable). Tier B; prices SOURCE Item 340.
- To be ingested at build (not yet present): `rate_item310.csv`, `distance_table8.csv`, `packing_rates.csv` — see `rate-schemas.md`.

## The one thing not to get wrong
California caps these rates by law. **Never price above the MAX4 maximum, and never invent the Item 310 or Distance Table 8 numbers** — ingest them. Everything else follows from the spec.

## Status
Spec v0.1. Regulatory frame + SVM config locked. Pending: ingest the two rate datasets, SVM brand assets + accessorial amounts.
