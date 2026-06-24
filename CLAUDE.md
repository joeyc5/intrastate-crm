# CLAUDE.md — SVM California Intrastate Move Quoting App

Orientation for any Claude Code session on this project. Read this first, then `SVM-Intrastate-Quote-App-SPEC.md` for full detail.

## What this is
A CRM-style quoting app for **Silicon Valley Moving & Storage (SVM)** that produces **MAX4-compliant Not-to-Exceed quotes** for **California intrastate household goods moves of 100+ constructive miles**, with saved customers/quotes, a sales pipeline, a professionally formatted quote (print/PDF), and generated MAX4 paperwork.

## Golden rules (do not violate)
1. **Never price above the MAX4 maximum.** Tariff rates are legal ceilings (Item 24). The discount lever only subtracts.
2. **Never invent Item 310 or Distance Table 8 numbers.** They are ingested data files (Tier C). If missing, fail loudly — do not estimate rate cells or mileage.
3. **100-mile floor.** This app handles **≥100 constructive miles only**. Block anything less (that's the hourly regime, a different tool).
4. **Weight = cubic feet × 7** (constructive weight) unless an actual scale weight is entered.
5. **Distance Table 8 governs price; Google miles are context only.**
6. **The quote total IS the Not-to-Exceed price.** Final charges can't exceed it without a signed Change Order.
7. **Valuation is required and signed.** Default Released (60¢/lb, free); upgrades are FVRP-$250 and FVRP-$500.
8. **A proper Agreement must be issued** or charges drop to 65% of max (Item 28). The paperwork flow exists to prevent that.

## Scope
**In:** CA→CA, 100+ mi, weight×distance at MAX4 max, packing (materials + pack/unpack labor), accessorials (shuttle, piano, bulky, extra stop, flight/long carry/elevator), valuation, deposit, CRM, quote + paperwork.
**Out (v1, keep schema hooks):** <100 mi, interstate, storage-in-transit, hoisting, appliance servicing, margin view, QuickBooks sync.

## Where things live
- `SVM-Intrastate-Quote-App-SPEC.md` — full functional/build spec (data model §5, engine §6, outputs §13, tests §18, build order §19).
- `svm-config.json` — SVM identity + all configurable defaults. **Single source of truth for config.**
- `cube-catalog.csv` — Table of Measurements (item → cubic feet). Tier B; reconcile to Item 410.
- `materials-catalog.csv` — cartons/supplies (cube + price). Tier B; prices SOURCE Item 340.
- `rate-schemas.md` — schemas + import rules for Item 310 and Distance Table 8 (Tier C, ingest).
- `OPEN-ITEMS.md` — what's still to finalize (SVM inputs + tariff values).

## Data provenance
- **Tier A** (verified, embedded — use as-is): 7 lb/cf, 100-mi rule, valuation rates, flight/long-carry rates, NTE & 65% rules.
- **Tier B** (provided, reconcile on first run): cube + materials catalogs.
- **Tier C** (ingest at build, never hardcode): Item 310 matrix, Distance Table 8.

## Conventions
- Money in integer **cents**; weight in **pounds**; distance in **constructive miles**.
- Every regulated charge caps at MAX4 max **before** discount.
- Config changes go through `svm-config.json` / Settings, not code.
- Keep rate data as **versioned files** stamped with the tariff effective date; the engine reads the active version.

## Recommended stack (flexible)
React/Next + Node or Python API + Postgres (SQLite ok for single office) + server-side HTML→PDF (one template drives screen, print, and PDF). Google Distance Matrix for context miles only.

## Company identity (prints on every document)
Silicon Valley Moving & Storage Inc · 186 Barnard Ave, San Jose CA 95125 · 408-941-0600 · www.SiliconValleyMoving.com · **Cal T 188960**

## Status
Spec v0.1. Regulatory frame and SVM config locked. Pending: ingest Item 310 + Distance Table 8, SVM brand assets + fee amounts (see `OPEN-ITEMS.md`).
