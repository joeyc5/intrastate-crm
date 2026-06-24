# CLAUDE.md — SVM California Intrastate Move Quoting App

Orientation for any Claude Code session on this project. Read this first, then `SVM-Intrastate-Quote-App-SPEC.md` for full detail.

> **⚠️ Audited against MAX4 2026 (2026-06-23).** The original spec was built on the **stale 2025 tariff**. The golden rules and numbers below have been corrected to **MAX4 effective January 1, 2026**. The full audit (77 findings + corrected rate data) is in **`docs/SPEC-AUDIT-2026.md`** and **`data/2026/`**. A v0.2 spec applying these corrections is pending review (see `docs/SVM-INTAKE-QUESTIONNAIRE.md` for the business inputs still needed).

## What this is
A CRM-style quoting app for **Silicon Valley Moving & Storage (SVM)** that produces **MAX4-compliant Not-to-Exceed quotes** for **California intrastate household goods moves of more than 100 constructive miles**, with saved customers/quotes, a sales pipeline, a professionally formatted quote (print/PDF), and generated MAX4 paperwork.

## Golden rules (do not violate)
1. **Never price above the MAX4 maximum.** Tariff rates are legal ceilings (Item 24). The discount lever only subtracts — and it **cannot** lower flight/long-carry charges (Item 140 Note 3) or Item 32 fraction results (Item 24 NOTE).
2. **Never invent rate numbers — but most rates are now in `data/2026/`, not external.** The Item 310 distance matrix and Item 340 packing rates are printed in the 2026 tariff and have been extracted to `data/2026/`. If a required rate is missing, fail loudly — don't estimate.
3. **>100-mile floor.** Distance rates are mandatory only for distances **in excess of 100 miles** (Item 16). Block routes of **100 miles or less** (that's the hourly/local regime — a different tool).
4. **Weight = cubic feet × 7** (constructive weight) unless an actual scale weight is entered. (Confirmed unchanged in 2026, Item 116. Item 410 cube values are mandatory **minimums** — catalog cube must be ≥ Item 410.)
5. **Mileage basis = GPS shortest-highway route** (Item 40, 2026 — GPS/Google is now a *permitted pricing basis*, not just context). Distance Table 8 is optional. **Never fabricate a mileage.**
6. **The quote total IS the Not-to-Exceed price.** Final charges can't exceed it without a signed Change Order.
7. **Valuation is required and signed.** The no-declaration legal default is **ACV up to $20,000** (Item 136) — *not* a silent "Released $0." Require an affirmative signed valuation election. Tiers (2026): Released ($0.60/lb, free), **FVRP-$250 ($0.67/$100)**, **FVRP-$500 ($0.38/$100)**. *Open: confirm whether the $20k ACV default is chargeable at $1.12/$100.*
8. **A proper Agreement must be issued** or charges drop to **65% of max** (Item 28 ¶3 — two-tiered: missing service-description/rates → 65% on those items; missing NTE/shipper-sig/mover-sig → all charges = lowest of {65% of max, Estimate rates, Agreement rates}). The paperwork flow exists to prevent this.
9. **Accessorials are tariff-CAPPED, not free SVM fees.** Shuttle = Item 320 hourly; extra-stop = ≤**$134.45/stop** (Items 148/152/156) + re-routed line-haul; bulky = Item 164 per-article max (or weight additive). A configurable fee must never exceed its tariff maximum (rule #1).

## Scope
**In:** CA→CA, **>100 mi**, weight×distance at MAX4 max, packing (materials + pack/unpack labor, **territory A/B**), accessorials (shuttle, piano, bulky, extra stop, flight/long carry/elevator), valuation, deposit, CRM, quote + paperwork.
**Out (v1, keep schema hooks):** ≤100 mi / hourly, interstate, storage-in-transit, hoisting, appliance servicing, disassembly/reassembly (Item 172), margin view, QuickBooks sync.

## Where things live
- `docs/SPEC-AUDIT-2026.md` — **the audit**: corrected numbers, structural/compliance fixes, change-list for v0.2. `docs/SPEC-AUDIT-2026-findings.md` — full 77-finding appendix.
- `docs/SVM-INTAKE-QUESTIONNAIRE.md` — business inputs still needed from SVM.
- `data/2026/` — **2026 rate data extracted from the tariff** + corrected config: `svm-config-2026.json`, `item310_distance_rates.csv`, `item320_hourly.csv`, `item340_*.csv`, `accessorials_148_164_184.csv`, `territories.csv` (county→A/B), `README.md` (corrected Item 310 schema).
- `SVM-Intrastate-Quote-App-SPEC.md` — full functional/build spec (v0.1 — see audit for corrections).
- `svm-config.json` — original config (stale 2025 numbers; superseded by `data/2026/svm-config-2026.json`).
- `cube-catalog.csv` — Table of Measurements (Tier B; each cube must be ≥ Item 410 minimum). `materials-catalog.csv` — cartons/supplies (Tier B; container prices from Item 340; loose supplies are SVM-priced, *not* tariff-capped).
- `rate-schemas.md` — import schemas (**note: its Item 310 schema is structurally wrong — see `data/2026/README.md` for the corrected one**).
- `2026_max_rate_tariff.pdf` — the source of truth. `OPEN-ITEMS.md` — original open-items tracker.

## Data provenance (reframed by the audit)
- **Tier A** (verified 2026, embed as-is): 7 lb/cf; flight/long-carry **$2.26/100 lb**; piano flights **$39.30 / $19.71 / $0.90**; valuation **$0.67 / $0.38 per $100**; extra-stop **$134.45/stop**; released $0.60/lb; NTE & 65% rules.
- **Tier B** (provided, reconcile): cube + materials catalogs.
- **In-tariff, extracted to `data/2026/`** (the spec wrongly called these "external Tier C"): Item 310 matrix, Item 320 hourly, Item 340 packing.
- **Genuinely external:** Distance Table 8 only — **and even that is optional** now that GPS is allowed (rule #5).

## Conventions
- Money in integer **cents**; weight in **pounds**; distance in **constructive miles** (GPS shortest-highway).
- Every regulated charge caps at MAX4 max **before** discount (and some charges aren't discountable — rule #1).
- **Territory A vs B** (Item 210): San Jose HQ = **Territory A**. Pack labor uses origin territory; unpack uses destination territory.
- Rounding: declared value → next $100 via **Item 136** ("or fraction thereof"); discount/percentage math → **Item 32** (half-cent up). Weight→100 lb is an SVM convention, *not* a tariff rule.
- Config changes go through config / Settings, not code. Keep rate data as **versioned files** stamped with the tariff effective date (2026-01-01); the engine reads the active version.

## Recommended stack
Per the developer's standing preferences: **Next.js (App Router) + TypeScript + Tailwind CSS**, **Supabase** (Postgres/auth/storage), deploy on **Vercel**. Server-side HTML→PDF so one template drives screen, print, and PDF. **Google Distance Matrix** for the (now price-eligible) shortest-highway mileage.

## Company identity (prints on every document)
Silicon Valley Moving & Storage Inc · 186 Barnard Ave, San Jose CA 95125 · 408-941-0600 · www.SiliconValleyMoving.com · **Cal T 188960**

## Status
Spec v0.1 **audited against MAX4 2026** → corrections in `docs/SPEC-AUDIT-2026.md`. Mileage basis decided: **GPS**. Pending: SVM business inputs (`docs/SVM-INTAKE-QUESTIONNAIRE.md`), then write **v0.2** spec + config. No application code yet.
