# OPEN ITEMS — to finalize before/while building

Nothing here blocks scaffolding the app; placeholders are in `svm-config.json` and the engine fails loudly where a required rate is missing.

## A. From SVM (Joey) — business inputs
- [ ] **Logo file** (SVG/PNG) and **brand colors** (primary + secondary hex) → quote & paperwork design.
- [ ] **Accessorial amounts:** shuttle fee, piano fee, bulky fee(s), extra-stop fee. Or confirm "default to tariff max / typical and I'll adjust in-app."
- [ ] **Bulky list:** which article types get a bulky fee (e.g., safe, gun safe, pool table, riding mower) and each amount.
- [ ] **Material prices:** SVM's own carton/supply prices if not using Item 340 max.
- [ ] **Materials sales-tax rate** and handling (accountant confirm; Santa Clara County point-of-sale ≈ 9.125% as a starting reference, do not hardcode without confirming).
- [ ] **Quote validity period** (default 30 days?).
- [ ] **Payment terms** language: deposit policy, accepted methods, any card surcharge, when balance is due.

## B. From the tariff — ingest/confirm during build
- [ ] **Item 310** distance-rate matrix → `rate_item310.csv` (see `rate-schemas.md`).
- [ ] **Distance Table 8** → `distance_table8.csv`.
- [ ] **Item 340** packing/unpacking labor rates + carton/material max prices.
- [ ] **Item 32** exact rounding ("Disposition of Fractions") rule.
- [ ] **Item 136** minimum-declared-value rule and exact valuation-declaration wording for the Agreement.
- [ ] **Item 140** exact long-carry distance threshold (≈75 ft) and flight-counting specifics.
- [ ] **CA collection/deposit limits** for compliant payment-terms language (how much can be required at delivery; no hostage-holding).
- [ ] Reconcile `cube-catalog.csv` against **Item 410** Table of Measurements; flag deltas.

## C. Decisions locked (for reference)
- Rate basis: **MAX4 maximum** (discount lever default 0%).
- Distance: **Table 8 governs**, Google miles context-only.
- Sizing: **room quick + cube inventory**, cube primary for binding.
- Min weight: **5,000 lb** default, adjustable.
- Packing: **materials + pack/unpack labor**.
- Accessorials on: shuttle, piano, bulky, extra stop, flight/long carry/elevator. Off: hoisting, appliance, storage-in-transit.
- Valuation: **Released (default, free)**, FVRP-$250 ($0.45/$100), FVRP-$500 ($0.25/$100).
- Deposit: **per-quote field**.
- CRM pipeline: **Lead → Estimate Sent → Booked → Completed → Lost**.
- Output: professional printable/PDF quote + MAX4 paperwork.
- Out of v1 (hooks kept): margin view, QuickBooks sync, storage-in-transit.
