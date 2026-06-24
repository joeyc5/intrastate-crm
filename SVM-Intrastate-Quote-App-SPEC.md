# Silicon Valley Moving & Storage — California Intrastate Move Quoting App
### Build specification for handoff to Claude Code

**Version:** 0.1 (draft for review)
**Prepared:** June 2026
**Scope:** California intrastate household goods moves of **100+ constructive miles**, priced under BHGS **Maximum Rate Tariff 4 (MAX4)**, January 1, 2025 edition.

> How to read this doc: Sections 1–2 are the non-negotiable regulatory frame. Sections 3–6 are the engine (architecture, data model, the quote formula). Sections 7–13 are the configured rates, charges, CRM, and outputs. Sections 14–20 are UI, compliance guardrails, edge cases, a full worked example, acceptance tests, build sequence, and open items. Anything an implementer must not invent is marked **SOURCE** (ingest the official value) or **CONFIG** (SVM-set, lives in settings).

---

## 1. Purpose & scope

Build a CRM-style quoting application for Silicon Valley Moving & Storage (SVM) that:
1. Produces accurate, MAX4-compliant **Not-to-Exceed (NTE)** price quotes for California intrastate household goods moves of **100 or more constructive miles**.
2. Stores customers and quotes through a **sales pipeline**.
3. Outputs a **professionally formatted quote** (print / save-to-PDF) similar to a high-level CRM.
4. Generates the required **MAX4 paperwork** prefilled from the quote.

**In scope:** CA origin to CA destination, 100+ constructive miles, weight-times-distance pricing at MAX4 maximum fixed rates, packing (materials + pack/unpack labor), defined accessorials (shuttle, piano, bulky, extra stop, flight/long carry/elevator), valuation, deposit, CRM, quote + paperwork output.

**Out of scope for v1 — leave clean extension hooks, do not delete the data fields:** local/hourly moves under 100 miles; interstate moves (federal FMCSA regime, different math); storage-in-transit; hoisting; appliance servicing; internal cost/margin view; QuickBooks estimate/invoice sync.

---

## 2. Regulatory framework — the binding rules

California intrastate household goods moves are governed by **Maximum Rate Tariff 4 (MAX4)**, administered by the **Bureau of Household Goods and Services (BHGS)**, California Department of Consumer Affairs. The following are legal constraints, not product preferences. The app must enforce them.

- **Distance-rate basis (Item 16(b)).** For shipments over 100 constructive miles, charges **must** be computed on the distance rates (Item 310): shipment weight × constructive distance. Hourly pricing is not permitted above 100 miles. The app blocks or redirects any origin/destination pair under 100 constructive miles.
- **Maximum fixed rates (Item 24).** Published tariff rates are **maximums**. SVM may quote at or below them, never above. Every regulated charge the app computes is capped at its MAX4 maximum; the discount lever may only reduce a price, never raise it.
- **Constructive weight (Items 108, 116).** When a charge is weight-based and actual scale weight is not used, weight = total cubic feet × **7 lb per cubic foot**.
- **Constructive distance (Item 16; Distance Table 8).** Mileage is the **constructive miles** from Distance Table 8, not straight-line and not arbitrary driving miles. Google driving miles may be shown for context only.
- **Not-to-Exceed price (Items 28, 128, 132).** The customer must receive a written NTE price before the move. Final charges may not exceed it except through a signed **Change Order** for added articles/services. The quote total **is** the NTE.
- **Valuation declaration (Item 136).** Every shipment carries a declared value; the released-value base is **$0.60/lb/article** and is built into the line-haul rate. The shipper's valuation selection must be captured and signed on the Agreement.
- **Documentation (Items 108, 120, 128, 132).** A proper Agreement for Moving Services, Estimated Cost of Services, Change Order, and Shipping Order/Freight Bill (BOL) are required with specified fields. **Failure to issue a proper Agreement forces charges down to 65% of maximum fixed rates (Item 28 ¶3)** — a penalty the paperwork flow exists to prevent.
- **Estimates (Item 108).** Estimates require a visual (in-home or virtual) inspection and must be in writing. The 3-day rule: an Estimate issued 3+ days before the move may exceed max fixed rates (binding above max); issued under 3 days it may not exceed max fixed rates. The app records the estimate date for this test.

---

## 3. System overview & recommended architecture

A single-company internal web app (desktop-first, tablet-friendly for in-home surveys). Stack is the implementer's call; a sensible default:

- **Frontend:** React (or Next.js) + a component library; clean print stylesheet for the quote/paperwork.
- **Backend/API:** Node or Python; REST or RPC.
- **Database:** Postgres (or SQLite for a single-office v1).
- **PDF generation:** server-side HTML-to-PDF (e.g., headless Chromium) so the on-screen quote and the PDF share one template.
- **External:** Google Maps Distance Matrix API for context-only driving miles and address validation. **Not** the price basis.
- **Rate data as files, not code (see §4).**

Core modules: (a) Quote engine, (b) Rate/config store, (c) CRM (customers, quotes, pipeline), (d) Document generator (quote + MAX4 forms), (e) Settings/admin.

---

## 4. Data provenance & the two ingested datasets

Three tiers of data. Treat them differently.

**Tier A — verified fixed rates (in this spec, use as-is):** constructive weight factor (7 lb/cf), the 100-mile threshold, valuation rates (§9), flight/long-carry rates (§10), the 65%-default and NTE rules. These are quoted from MAX4 and embedded here.

**Tier B — standard reference data (provided here, reconcile on first run):** the cube catalog / Table of Measurements (`cube-catalog.csv`) and the materials catalog (`materials-catalog.csv`). Values are standard industry cube and carton definitions; reconcile against MAX4 Item 410 (Table of Measurements) and Item 340 (container prices) when those pages are obtained.

**Tier C — bulk official datasets to ingest at build time (NOT in this spec):**
1. **Item 310 Distance Rate table** — the weight-group × constructive-mile-bracket matrix of $/100 lb. **SOURCE:** BHGS MAX4, 2025 edition.
2. **Distance Table 8** — constructive miles between California points (city/ZIP pairs). **SOURCE:** BHGS / Distance Table 8.

> Why files, not hardcoding: MAX4 revises (the current edition is effective Jan 1, 2025). Storing Item 310 and Table 8 as versioned data files means a tariff update is a file swap, not a code change. Build an importer that validates each file against the schema in `rate-schemas.md` and records the tariff effective date. The engine reads whatever version is active.

Authoritative source root: `https://bhgs.dca.ca.gov/` (MAX4 tariff PDF: `https://bhgs.dca.ca.gov/industry/maxratetariff4.pdf`). The rate schedules (Item 310, 340) and Distance Table 8 are in the full tariff/rate publication; extract to CSV per `rate-schemas.md`.

---

## 5. Data model

Entities (fields abbreviated; types obvious unless noted). All money in integer cents; all weights in pounds; all distances in constructive miles.

**company_settings** (singleton): legal_name, dba, address, phone, website, cal_t_number, logo_asset, brand_primary_hex, brand_secondary_hex, min_weight_lb (default 5000), discount_pct_default (0), materials_tax_rate_pct (CONFIG), rounding rules (see §11), tariff_edition_label.

**customer:** id, first_name, last_name, company (opt), email, phone, notes, created_at. (Origin/destination live on the quote, since a customer may move once.)

**quote:** id, customer_id, status (enum: lead, estimate_sent, booked, completed, lost), origin_address, origin_zip, dest_address, dest_zip, constructive_miles (from Table 8), google_driving_miles (context), move_date, estimate_date (for the 3-day test), sizing_method (room|cube), estimated_weight_lb, chargeable_weight_lb (after min + weight-break), line_haul_cents, accessorials_cents, packing_cents, materials_cents, valuation_tier (released|fvrp250|fvrp500), declared_value_cents, valuation_cents, discount_pct, discount_cents, taxable_materials_cents, tax_cents, subtotal_cents, total_nte_cents, deposit_cents, balance_due_cents, created_at, updated_at.

**quote_inventory_item:** id, quote_id, catalog_item_id, room, label, quantity, cubic_feet_each, packed (bool, drives packing labor), is_bulky (bool), bulky_fee_cents (if applicable).

**quote_accessorial:** id, quote_id, type (shuttle|piano|bulky|extra_stop|flight|long_carry|elevator), description, quantity, unit_basis (flat|per_cwt|per_flight|per_100lb), rate_cents, amount_cents, leg (origin|destination).

**quote_material:** id, quote_id, material_id, quantity, unit_price_cents, taxable (bool, default true), amount_cents.

**cube_catalog** (Tier B, from `cube-catalog.csv`): id, room, item_name, cubic_feet, default_packed (bool), notes.

**materials_catalog** (Tier B, from `materials-catalog.csv`): id, name, cubic_feet (for cartons), unit, max_price_cents (SOURCE Item 340), svm_price_cents (CONFIG), taxable.

**packing_rates** (SOURCE Item 340): id, container_type, pack_rate_cents, unpack_rate_cents, unit (per container).

**rate_item310** (Tier C, ingested): weight_group_min_lb, weight_group_max_lb, mile_bracket_min, mile_bracket_max, rate_cents_per_100lb, tariff_edition.

**distance_table8** (Tier C, ingested): origin_key (city or ZIP), dest_key, constructive_miles, tariff_edition. (Plus a fallback resolver; see §16.)

**accessorial_config** (CONFIG): type, default_rate_cents, unit_basis, enabled (bool). Seed: shuttle, piano, bulky, extra_stop enabled; flight/long_carry/elevator enabled at Item 140 max; hoisting, appliance disabled.

**valuation_tiers** (Tier A): tier, rate_cents_per_100_declared, deductible_cents, is_default. Seed in §9.

---

## 6. The quote engine

Compute order. Every step caps at the MAX4 maximum before the discount is applied.

**Step 1 — Validate the move.**
- Resolve `constructive_miles` from Distance Table 8 for (origin, destination).
- If `constructive_miles < 100` → not in scope (local/hourly move). Block with a clear message; do not produce a distance quote.
- Both endpoints must be in California.

**Step 2 — Determine weight.**
- If sizing_method = cube: `estimated_weight_lb = round_up_100( total_cubic_feet × 7 )`.
- If sizing_method = room: `total_cubic_feet = Σ(room_preset_cf)`, then same ×7.
- `chargeable_weight_lb = max(estimated_weight_lb, company_settings.min_weight_lb)`. (Default min 5,000.)

**Step 3 — Line-haul (Item 310) with weight-break optimization.**
- Look up the rate `R(weight_group, mile_bracket)` in `rate_item310` for the chargeable weight and the constructive-mile bracket.
- **Weight-break ("as-rated weight") rule (Item 20 / Item 24).** Because $/100 lb drops as weight groups rise, paying for the *minimum weight of the next higher group at its lower rate* is sometimes cheaper. Compute:
  `line_haul = min over the actual group and every higher group g of ( chargeable_weight_g × R(g, mile_bracket) )`
  where `chargeable_weight_g = chargeable_weight_lb` for the actual group and `= weight_group_min_lb(g)` for each higher group. Take the lowest result. Record which group was used.
- `line_haul_cents = round( line_haul / 100 × rate_cents_per_100lb_used )` using the selected group.

**Step 4 — Packing.**
- **Materials:** Σ over quote_material of `quantity × unit_price_cents` → `materials_cents`. (Cartons/supplies sold.)
- **Pack/unpack labor (Item 340):** for each packed container, add `pack_rate_cents` (+ `unpack_rate_cents` if unpack ordered) per `packing_rates`. Map cube-catalog cartons to container types. → `packing_cents`.

**Step 5 — Accessorials.** Sum `quote_accessorial.amount_cents` by basis:
- flight / long carry / elevator: `$1.75 per 100 lb` × chargeable_weight, per occurrence per leg (Item 140). Elevator counts as one flight. Pianos/organs use the special piano flight rates (§10).
- shuttle, piano, bulky, extra_stop: CONFIG rate × quantity (flat or per_cwt per config).
→ `accessorials_cents`.

**Step 6 — Valuation (§9).** From tier + declared_value → `valuation_cents`.

**Step 7 — Subtotal, discount, tax.**
- `regulated_subtotal = line_haul + packing_labor + flight/long-carry + valuation` (the tariff-capped pieces).
- `discount_cents = round( regulated_subtotal × discount_pct )` (discount applies to regulated charges; CONFIG whether SVM-set fees and materials are discountable).
- **Tax:** CA sales tax applies to **materials sold** (tangible goods), not to transportation/labor. `tax_cents = round( taxable_materials_cents × materials_tax_rate_pct )`. (CONFIG rate; confirm with SVM's accountant, §20.)
- `subtotal_cents = line_haul + packing + materials + accessorials + valuation`.
- `total_nte_cents = subtotal_cents − discount_cents + tax_cents`.

**Step 8 — Deposit & balance.**
- `deposit_cents` = salesperson input (per quote).
- `balance_due_cents = total_nte_cents − deposit_cents`.

`total_nte_cents` is the **Not-to-Exceed price** that prints on the quote and Agreement.

---

## 7. Rate & fee reference

**Tier A — verified, embed as-is:**
- Constructive weight: **7 lb / cubic foot**.
- Local/distance threshold: **100 constructive miles** (this app handles ≥100 only).
- Default liability if no value declared: Actual Cash Value up to **$20,000** (we instead default the UI to Released; see §9).
- Released value base built into line-haul: **$0.60 / lb / article**.
- Flight & long carry, distance basis: **$1.75 / 100 lb** per flight or long carry, per pickup/delivery (Item 140).
- Piano/organ (not hand-carryable) flights: inside **$30.45** first flight + **$15.25** each additional; outside **$30.45** first flight + **$0.60** each additional step (Item 140).
- Valuation rates: Released **$0.00**, FVRP-$250 deductible **$0.45 / $100** declared, FVRP-$500 deductible **$0.25 / $100** declared (Item 136). (Tiers SVM is **not** offering, for reference only: zero-deductible Full Value $1.70/$100, Actual Cash Value $0.75/$100.)

**Tier C — ingest (placeholders until imported):**
- Item 310 distance-rate matrix → `rate_item310`.
- Item 340 packing/unpacking labor rates → `packing_rates`.
- Item 340 carton/material max prices → `materials_catalog.max_price_cents`.
- Distance Table 8 → `distance_table8`.

**CONFIG — SVM-set defaults (settings screen, editable):**
- min_weight_lb = **5000**
- discount_pct_default = **0**
- shuttle fee, piano fee, bulky fee, extra-stop fee = **SVM to supply** (until then, default to tariff max where one exists, else a placeholder flagged in-app). See §20.
- materials_tax_rate_pct = **SVM to confirm** (Santa Clara County point-of-sale rate as starting default).

---

## 8. Sizing

Two paths, both resolve to cubic feet → weight (×7), per §6 Step 2.

**Room-based quick estimate** (fast phone/lead quote): user picks home size and/or rooms; app applies a preset cube per room from config (e.g., bedroom, living room, kitchen, garage, with light/average/heavy modifiers). Produces a ballpark NTE flagged "estimate, not binding."

**Cube-sheet inventory** (binding quote): item-by-item from `cube-catalog.csv`, grouped by room, each line carrying cubic_feet × quantity. The summed cube drives weight; the itemized list is reused verbatim on the Estimate and BOL. `default_packed` pre-checks items typically packed by the crew so packing labor auto-populates (user can override).

The cube catalog ships in `cube-catalog.csv` (Tier B). Reconcile with MAX4 Item 410 Table of Measurements on first run; the importer should flag any item whose cube differs from Item 410.

---

## 9. Valuation logic

Seed `valuation_tiers`:

| tier | rate per $100 declared | deductible | default |
|---|---|---|---|
| released | $0.00 | $0 | **yes (shown selected)** |
| fvrp250 | $0.45 | $250 | no |
| fvrp500 | $0.25 | $500 | no |

Rules:
- The quote **defaults to Released (free)**; the customer may upgrade to FVRP-$250 or FVRP-$500.
- `valuation_cents = ceil(declared_value_cents / 10000) × rate_cents_per_100_declared` (round declared value up to the next whole $100 per the tariff "or fraction thereof" rule). Released → $0.
- A declared value is required for either FVRP tier. Enforce a **minimum declared value** (Item 136 — confirm exact floor, §20; until confirmed use `max(declared, chargeable_weight_lb × $X/lb)` with X in config).
- The selected tier, declared value, deductible, and valuation charge print on the quote and on the Agreement, with the shipper's signature line for the valuation declaration (hard requirement, Item 136 / Item 128).
- The deductible is what the customer absorbs on a claim; it does **not** change the price.

---

## 10. Accessorials logic

Each is a `quote_accessorial` row; `leg` distinguishes origin vs destination where relevant.

- **Flight / long carry / elevator (Item 140, tariff-fixed):** `$1.75 / 100 lb` × chargeable_weight per occurrence per leg. A "flight" = a series of 8–20 stair steps (not inside a single dwelling), each additional ≤20-step series beyond the first 20, or a (non-vehicular) elevator. "Long carry" = carry beyond the tariff's free distance (≈75 ft; confirm in Item 140, §20). Count occurrences at each leg.
- **Piano / organ flights (Item 140, tariff-fixed):** inside $30.45 first + $15.25 each additional flight; outside $30.45 first + $0.60 each additional step. Applied **in addition** to any SVM piano handling fee below.
- **Shuttle (CONFIG):** when a tractor-trailer cannot reach the residence and a smaller vehicle is needed. Flat or per-cwt per config, per leg.
- **Piano fee (CONFIG):** SVM special-handling charge per piano/specialty instrument (separate from the Item 140 flight math).
- **Bulky article fee (CONFIG):** per flagged bulky item (e.g., safe, pool table, large statuary). Maintain a CONFIG list of bulky types and their fees; `quote_inventory_item.is_bulky` links to it.
- **Extra stop (CONFIG):** per additional pickup or delivery stop beyond the first origin and first destination.

Disabled in v1 (keep fields, hide UI): hoisting, appliance servicing.

---

## 11. Discounts, taxes, rounding, minimums

- **Discount:** `discount_pct` (default 0). Applies to the regulated subtotal; CONFIG flag controls whether SVM-set fees and materials are also discountable. Discount may only reduce; a negative/over-100% discount is rejected. Result can never exceed the MAX4 max (it won't, since discount only subtracts).
- **Minimum weight:** `max(estimated_weight, min_weight_lb)`; default 5,000.
- **Tax:** apply `materials_tax_rate_pct` to `taxable_materials_cents` only. Transportation and labor are not sales-taxed in CA. Cartons/supplies sold are taxable. (Confirm rate and any nuance with SVM's accountant, §20.)
- **Rounding (Item 32 "Disposition of Fractions" — confirm exact rule, §20):** until confirmed, default to: weight rounded **up** to the next 100 lb; declared value rounded **up** to the next $100; money rounded to the cent. Keep these in one place so the Item 32 rule can be set centrally.

---

## 12. CRM

- **Pipeline (Kanban + list):** stages **Lead → Estimate Sent → Booked → Completed → Lost**. Drag to change status; status is on `quote`.
- **Dashboard:** counts and $ value by stage, recent activity, quotes needing follow-up (e.g., estimate_sent > N days).
- **Customer record:** contact details + all their quotes.
- **Quote record:** full breakdown, editable inputs, recompute, version/duplicate, status, generate documents, record deposit, notes.
- **Search/filter:** by customer, status, move_date, route.

---

## 13. Outputs

**A. Customer quote document** (on-screen + print/PDF, SVM-branded with logo + brand colors):
- Header: SVM identity block (legal name, address, phone, website, **Cal T 188960**).
- Customer + move details: names, origin, destination, **constructive miles** (and Google miles as "approx. driving distance"), move date.
- Itemized breakdown: line-haul (weight, mileage, rate basis), packing (materials + labor), accessorials, valuation selection, subtotal, discount (if any), tax on materials, **Not-to-Exceed total**, deposit, balance due.
- Valuation block: selected tier, declared value, deductible, what it means.
- Terms: NTE explanation, change-order note, payment terms, quote validity period (CONFIG, e.g., 30 days).
- Clean, professional layout; print stylesheet; one-click save-to-PDF.

**B. MAX4 paperwork** (prefilled from the quote; generate on demand):
1. **Agreement for Moving Services (Item 128):** carrier identity + Cal T number, shipper/consignee, origin/destination, services, rates quoted, **Not-to-Exceed price**, valuation declaration with signature line, preferred/expected delivery window, required statutory notices. (Issue ≥3 days before move per the 3-day rule; capture issue date.)
2. **Estimated Cost of Services (Item 108/420):** "ESTIMATED COST OF SERVICES" header; basis of estimate; itemized estimated charges; the IMPORTANT NOTICE block; estimator signature.
3. **Change Order for Services (Item 120/440):** added articles/services, rates, revised valuation if changed, "NOT EXCEED" restated, signatures.
4. **Shipping Order / Freight Bill / BOL (Item 132/460)** — required fields verbatim from Item 132: carrier name/address/**T number**; all carrier names used; date issued; shipper & consignee; origin & destination; description of shipment; unit of measurement (actual & minimum weight); helpers/packers count; rates & charges; accessorial services and each charge; carrier signature; notification contact; preferred delivery date/window; **Not-to-Exceed price**; total charges on Estimate and Change Order; credit-card-payment flag; the "PLEASE INSPECT YOUR GOODS PROMPTLY" claims notice.

Records retention: documents must be retainable for **3 years** (Items 108, 128, 132). Store generated PDFs against the quote.

---

## 14. UI / user flows

**Dashboard** → pipeline board (Lead, Estimate Sent, Booked, Completed, Lost) with quote cards (customer, route, NTE, move date); quick filters; "needs follow-up" list.

**New quote wizard:**
1. Customer (new or pick existing).
2. Route: origin + destination (ZIP/address, CA-validated). App resolves constructive miles (Table 8) and shows Google driving miles for context. Hard stop if < 100 constructive miles.
3. Sizing: choose Room-quick or Cube-inventory. Cube path opens the room-grouped catalog picker.
4. Services: packing (materials + pack/unpack labor), accessorials (shuttle, piano, bulky, extra stop, flights/long carry/elevator with leg).
5. Valuation: Released (default) / FVRP-$250 / FVRP-$500, declared value if upgraded.
6. Deposit: salesperson enters amount.
7. Review: full live breakdown + NTE; save; generate quote PDF; generate MAX4 paperwork.

**Quote detail:** editable inputs with live recompute, status control, duplicate/revise, document generation, deposit/balance, notes.

**Settings/admin:** company identity & branding; rates/config (min weight, discount default, accessorial fees, material prices, tax rate, valuation tiers, room presets); tariff data import (Item 310, Table 8) with effective-date and validation.

---

## 15. Compliance guardrails (enforce in code)

- Block any quote under 100 constructive miles (wrong rate regime).
- Never allow a computed regulated charge above its MAX4 maximum; discount only subtracts.
- Require a valuation selection and signature capture before an Agreement is marked issued; default Released is pre-selected but still must be acknowledged.
- NTE is the ceiling; only a signed Change Order can raise the final bill, and that path must itself be documented.
- Surface the **3-day rule** on the Agreement issue date (≥3 days before move to bind above max; under 3 days cannot exceed max).
- Make it impossible to finalize without a properly populated Agreement (the 65%-of-max penalty exists precisely for missing/defective Agreements).
- Payment/collection: support a deposit and a balance-due-at-delivery model; do not enable holding goods hostage or demanding more than the agreed/NTE amount. (Confirm exact CA collection limits, §20.)

---

## 16. Edge cases

- **< 100 miles:** reject with explanation (local/hourly regime, not this tool).
- **Table 8 pair not found:** fall back to nearest known city key or ZIP centroid lookup, flag the quote as "distance estimated," and require confirmation. Never silently guess.
- **Very light shipment:** min weight (5,000) applies; show the customer the min-weight basis.
- **Weight-break:** verify the engine picks the lower "as-rated" charge (test in §18).
- **Declared value below floor:** enforce minimum declared value for FVRP tiers.
- **Multiple stops / split pickup or delivery:** each extra stop is an accessorial; mileage remains origin→final destination via Table 8.
- **Piano with stairs:** SVM piano fee **plus** Item 140 piano flight rates.
- **Discount entered:** confirm result stays ≤ max and ≥ 0.
- **Materials tax:** applied to materials only, never to labor/transport.

---

## 17. Worked example (structure; Item 310 cell is ILLUSTRATIVE)

Shipment 1,200 cu ft → 1,200 × 7 = **8,400 lb**. Min weight 5,000, so chargeable = 8,400 lb. Route San Jose → Los Angeles, constructive miles (Table 8) ≈ **340 mi**.

- **Line-haul:** rate for the ~8,000 lb group at the ~340-mi bracket = **$ILLUSTRATIVE 38.00 / 100 lb** (replace with real Item 310 cell). Check weight-break vs the next group's minimum at its lower rate; take the lower. Charge ≈ 84 × $38.00 = **$3,192.00**.
- **Packing:** 30 medium cartons packed at the Item 340 pack rate (SOURCE) + materials (30 cartons + paper + tape at Item 340 max prices).
- **Flights:** one flight at destination = $1.75/100 lb × 84 = **$147.00**.
- **Valuation:** customer picks FVRP-$250 on $60,000 declared = 600 × $0.45 = **$270.00**.
- **Subtotal** = line-haul + packing + materials + flights + valuation.
- **Discount** 0% (default). **Tax** on materials only.
- **Total = Not-to-Exceed price.** Deposit (salesperson input) subtracts to balance due.

Use this as an integration test once the real Item 310 cell is imported.

---

## 18. Acceptance criteria / test cases

1. Sub-100-mile route is blocked.
2. Cube→weight uses ×7 and rounds up to next 100 lb.
3. Min-weight floor applies when estimate < 5,000.
4. **Weight-break:** a shipment near a group ceiling is charged the lower as-rated amount; unit-test against a hand calc.
5. Regulated charges never exceed MAX4 max; a 10% discount reduces correctly and cannot go below 0 or above max.
6. Valuation: Released = $0; FVRP-$250 and FVRP-$500 compute on declared value rounded up to next $100; minimum declared value enforced.
7. Flight/long carry = $1.75/100 lb per occurrence per leg; piano flights use $30.45/$15.25/$0.60.
8. Materials taxed; labor/transport not taxed.
9. NTE prints on quote and Agreement; final cannot exceed NTE without a Change Order.
10. Each MAX4 document renders with all Item-required fields (esp. Item 132) and the Cal T number.
11. Tariff data import validates schema and stamps the effective date; engine reads the active version.
12. Pipeline status changes persist; dashboard totals reconcile.

---

## 19. Build sequence (suggested)

1. **Foundations:** schema, settings/config, `svm-config.json` load, tariff-data importer (Item 310, Table 8) with validation.
2. **Engine:** weight, line-haul + weight-break, accessorials, valuation, discount/tax/rounding, NTE. Unit tests (§18).
3. **CRM:** customers, quotes, pipeline, dashboard.
4. **Quote wizard UI** end to end.
5. **Outputs:** branded quote PDF, then the four MAX4 documents.
6. **Hardening:** edge cases, compliance guardrails, retention storage.
7. **Hooks (stubbed):** storage-in-transit, margin view, QuickBooks — schema present, UI hidden.

---

## 20. Open items to finalize

**From SVM (non-blocking; placeholders meanwhile):**
- Logo file + brand colors (hex).
- Standard amounts: shuttle, piano, bulky, extra-stop fees (or "default to max/typical").
- Material unit prices if SVM-specific (else Item 340 maxima).
- Materials sales-tax rate / handling (accountant confirm).
- Quote validity period (default 30 days?).

**From the tariff (ingest/confirm during build):**
- Item 310 distance-rate matrix → `rate_item310`.
- Distance Table 8 → `distance_table8`.
- Item 340 packing/unpacking rates + carton max prices.
- Item 32 exact rounding rule.
- Item 136 minimum-declared-value rule and exact valuation-declaration language.
- Item 140 exact long-carry distance threshold (≈75 ft) and counting rules.
- CA collection/deposit limits for the payment-terms language.

---

*End of spec v0.1. Companion files: `CLAUDE.md` (project rules), `svm-config.json` (locked config), `cube-catalog.csv`, `materials-catalog.csv` (Tier B data), `rate-schemas.md` (Tier C ingest schemas), `OPEN-ITEMS.md` (tracker).*
