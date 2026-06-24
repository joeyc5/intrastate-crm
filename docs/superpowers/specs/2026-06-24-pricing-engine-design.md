# Pricing Engine — Design Spec (Core Spine)

**Project:** SVM California Intrastate Move Quoting App
**Sub-project:** #1 of 6 — the pricing calculation engine + rate-data layer
**Status:** Approved design (2026-06-24). Ready for `writing-plans`.
**Tariff basis:** MAX4 effective January 1, 2026 (`2026_max_rate_tariff.pdf`, data in `data/2026/`).
**Author:** brainstormed with Joey (SVM), 2026-06-24.

---

## 0. Where this fits

The full app decomposes into ~6 subsystems:

1. **Pricing engine** — pure logic: inputs → priced quote (line items + Not-to-Exceed total). ← *this spec*
2. **Rate-data layer** — the versioned 2026 tables, normalized to cents, fail-loud lookups. ← *this spec*
3. CRM — customers, quotes, sales pipeline (Supabase). *(later sub-project)*
4. Quote document + PDF — the formatted, printable quote. *(later)*
5. MAX4 paperwork — Estimate/Agreement generation + the 65%-penalty compliance gate. *(later)*
6. Auth + Settings — editing config, managing rate versions. *(later)*

This spec covers **#1 + #2 only**, and within those, the **core spine** (see Scope). Everything else in the app calls *into* this engine; the engine depends on nothing else (no UI, no database, no network).

---

## 1. Goal & success criteria

Build a pure, fully-tested TypeScript module that, given a move's inputs, returns a **MAX4-compliant Not-to-Exceed (NTE) price** with a complete, auditable line-item breakdown — or a typed, plain-English error if it cannot.

**Success =**
- Every published golden-fixture case (real Item 310 cells + whole quotes) reproduces the exact expected cents.
- The compliance invariants (Section 7) hold under property tests.
- The module has zero dependencies on the web app, database, or network and is importable by API routes, the PDF renderer, and tests alike.

---

## 2. Scope

**In (core spine, this build):**
- Route resolution: >100-mile gate (Item 16), Territory A/B (Item 210).
- Chargeable weight: cube×7 constructive (Item 116) or scale-weight override; SVM min-weight floor.
- Line-haul: Item 310 distance rate with the weight-break optimization (Item 310 NOTE 1 / Item 20).
- Valuation: Released / FVRP-$250 / FVRP-$500, required affirmative election (Item 136).
- Discount lever applied to the **eligible base only**, with the non-discountable carve-out logic (Item 24 NOTE; Item 140 NOTE 3; Item 32).
- Cap-at-tariff-max enforcement (golden rule #1) and runtime invariants.
- Item 28 two-tiered 65%-penalty as a tested pure function (built now; consumed by the paperwork layer later).
- Money as integer cents; Item 32 and Item 136 rounding.
- Typed fail-loud errors.

**In, but as later passes (clean seams, not built now):**
- Packing — materials (Item 340 containers) + pack/unpack labor by territory.
- Accessorials — flights/long-carry/elevator (Item 140), shuttle (Item 184/320), extra-stop (Items 148/152/156), bulky (Item 164).
- Materials sales tax (Santa Clara County rate; `materialsTaxCents` exists in the result, = 0 until packing lands).

**Out (kept as schema hooks elsewhere, not this engine):**
- GPS/Google distance lookup — `distanceMiles` is an **input** to the engine; the GPS integration belongs to the app layer.
- Hourly/local (≤100 mi), interstate, storage-in-transit, rigging/hoisting (Item 168), disassembly/reassembly (Item 172), appliance servicing (Item 176).

---

## 3. Architecture (Approach A — pure calculation module)

Chosen over (B) logic-in-web-app and (C) generic rules-engine because a legally-constrained engine's top priority is **isolated testability**; A maximizes it and avoids floating-point/DB coupling.

```
lib/pricing/
  index.ts            public entry: priceQuote(input, rates), loadRates(version)
  types.ts            QuoteInput, QuoteResult, LineItem, RateTables, enums, error types

  money.ts            integer-cent helpers + the only two rounding rules

  rates/
    load.ts           read versioned data/<year>/, normalize ALL money to integer cents,
                      validate shape, return immutable RateTables (fail-loud)
    item310.ts        distance-band resolve + weight-break optimization
    lookups.ts        territory(county), valuation tier rate, materials tax rate

  steps/              one small pure function per step, run in order by index.ts:
    resolveRoute.ts   >100-mile gate (Item 16) + Territory A/B (Item 210)
    deriveWeight.ts   cube×7 (Item 116) or scale; SVM min-weight floor
    lineHaul.ts       Item 310 + weight-break → capped line item
    valuation.ts      tier rate × declared value (Item 136); requires election
    applyCaps.ts      assert every line ≤ its tariff cap (CapViolationError)
    applyDiscount.ts  discount eligible base only; carve-outs; Item 32 rounding
    total.ts          subtotal − discount + materials tax → nteTotalCents
    (packing.ts)      later pass
    (accessorials.ts) later pass

  guardrails/
    penalty65.ts      Item 28 two-tiered 65% rule (pure; for paperwork layer)
    invariants.ts     runtime asserts: nte ≤ Σ caps, nothing negative, discount ≥ 0

  __tests__/          golden fixtures (real tariff cells) + property tests
```

**The one structural rule:** `index.ts` is the *only* surface the rest of the app may import. `priceQuote` runs the `steps/` in order, accumulating `LineItem`s, and returns a `QuoteResult`. Each step and lookup is independently unit-testable.

---

## 4. The contract (interfaces)

### 4.1 Input

```ts
type QuoteInput = {
  origin:      { county: string }   // CA county name → Territory A/B
  destination: { county: string }
  distanceMiles: number             // GPS shortest-highway; engine rejects ≤ 100

  weight:
    | { basis: "cube";  cubicFeet: number }   // constructive weight = cubicFeet × 7
    | { basis: "scale"; pounds: number }       // actual scale weight (overrides cube)
  minWeightFloorLb?: number                    // overrides policy default (config, e.g. 5000)

  valuation:                                   // REQUIRED — affirmative signed election
    | { tier: "released" }
    | { tier: "fvrp250"; declaredValueUsd: number }
    | { tier: "fvrp500"; declaredValueUsd: number }

  discountPct?: number                         // 0..1; overrides policy default (config, 0% if unset); only ever lowers eligible lines
}
```

### 4.2 Output

```ts
type LineItem = {
  key: string            // stable id, e.g. "line_haul", "valuation"
  label: string          // human label for the quote
  itemRef: string        // MAX4 citation, e.g. "Item 310"
  basis: string          // plain-English explanation of the math
  amountCents: number    // computed amount, already capped at the tariff max
  capCents: number | null// the ceiling checked against (null when no tariff cap applies)
  discountable: boolean   // did the discount lever apply to this line?
}

type QuoteDerived = {
  originTerritory: "A" | "B"
  destTerritory:   "A" | "B"
  chargeableWeightLb: number
  weightBasisUsed: "cube" | "scale"
  item310WeightColumnLb: number   // which weight-break column won
  distanceBandMiles: string       // e.g. "250–275"
}

type QuoteResult = {
  derived: QuoteDerived
  lineItems: LineItem[]
  subtotalCents: number       // Σ lineItems.amountCents (pre-discount)
  discountCents: number       // amount subtracted (from the eligible base only)
  materialsTaxCents: number   // tax on taxable materials (0 in the core spine)
  nteTotalCents: number       // subtotal − discount + tax = the Not-to-Exceed price
  warnings: string[]          // non-fatal notes
}
```

The engine **never** returns a partially-computed number. Any condition it cannot fully justify is a typed error (Section 6), surfaced to the caller, not silently defaulted.

---

## 5. Rate-data layer

- **Source of truth:** the versioned files in `data/<year>/` (today `data/2026/`). These stay human-editable CSV/JSON, stamped with the tariff effective date.
- **Loading:** `loadRates("2026")` reads the active dataset, **normalizes every monetary value to integer cents** (the `item340` CSVs are in dollars; `item310`/`item320` are already cents — the loader unifies them), validates the shape, and returns an **immutable** `RateTables` object stamped `effectiveDate: "2026-01-01"`. Runs server-side (Node), so reading the files at load is acceptable; the result is cached.
- **Policy block:** the dataset also loads the SVM **policy** config from `data/2026/svm-config-2026.json` — the min-weight-floor default, default discount %, the valuation-discountability flag, and the weight-rounding flag. So `RateTables` carries both `rates` (tables) and `policy` (business defaults). Input fields (`minWeightFloorLb`, `discountPct`) override the matching policy defaults; if omitted, the policy default is used (which itself defaults to 0% discount / 5,000-lb floor).
- **Versioning:** a future `data/2027/` + `loadRates("2027")` requires **zero** engine changes.
- **Fail-loud:** a missing county, a missing distance/weight cell, a malformed row, or a unit it cannot normalize **throws `RateDataError`** at load — never a silent default.

### 5.1 Item 310 line-haul lookup (`rates/item310.ts`)

Per the corrected schema in `data/2026/README.md`:

- **Weight columns** are single *minimum-weight* columns (no upper bound): `ANY-QTY (<1000)`, `1000`, `2000`, `5000`, `8000`, `12000`, `16000`.
- **Mileage rows** are over/not-over, variable width (10-mi steps to 100, 20-mi to 200, 25-mi to 500, 50-mi to 850). For distance **> 850 mi**: `rate(800–850) + ceil((miles − 850) / 50) × add_per_50`.
- **Weight-break optimization (Item 310 NOTE 1 / Item 20):** compute the charge using the shipment's actual weight column **and** each higher minimum-weight column (substituting that column's minimum weight as the billed weight), and **return the cheapest**. Record which weight column won (`item310WeightColumnLb`). Computed crossovers must match the tariff's published Break Points (verified by test).
- Rate unit: **cents per 100 lb**. `line_haul amountCents = round(weightLb × ratePer100 / 100)`.

---

## 6. The calculation pipeline (core spine, in order)

| # | Step | Logic | Item(s) |
|---|------|-------|---------|
| 1 | `resolveRoute` | Reject `distanceMiles ≤ 100` → `DistanceTooShortError`. Look up Territory A/B for origin & destination counties. | 16, 210 |
| 2 | `deriveWeight` | `cube`: `cubicFeet × 7`. `scale`: use `pounds`. Then `chargeableWeightLb = max(derived, minWeightFloorLb)`. (Weight→100-lb rounding is a config flag, **not** a tariff rule.) | 116 |
| 3 | `lineHaul` | Item 310 lookup + weight-break (Section 5.1) → `line_haul` LineItem, `discountable: true`, `capCents = amountCents` (Item 310 is itself the ceiling). | 310, 20 |
| 4 | `valuation` | `released` → $0. `fvrp250`/`fvrp500` → `ceil(declaredValueUsd / 100) × tierRatePer100Cents`. → `valuation` LineItem, `capCents = amountCents` (the Item 136 tier rate is itself the maximum). **Default `discountable: false`** (liability charge; configurable — see Open Items). | 136 |
| 5 | `applyCaps` | Assert every LineItem `amountCents ≤ capCents` (when `capCents` non-null). A config-supplied rate above its cap → `CapViolationError`. (Golden rule #1.) | 24 |
| 6 | `applyDiscount` | Apply `discountPct` to the **discountable base** = Σ of LineItems with `discountable: true`. `discountCents = roundItem32(base × discountPct)`. Carve-outs (`discountable: false`): valuation (default), and — once present — flights/long-carry (Item 140 NOTE 3) and any Item 32 fraction result. Discount only subtracts; never < 0. | 24 NOTE, 32, 140 NOTE 3 |
| 7 | `total` | `subtotalCents = Σ amountCents`. `nteTotalCents = subtotalCents − discountCents + materialsTaxCents` (tax = 0 in the spine). | 128, 132 |

After step 7, `guardrails/invariants.ts` asserts: `nteTotalCents ≤ Σ capCents` (for capped lines), no negative amounts, `discountCents ≥ 0`. A violation throws (a bug, caught before a customer sees it).

`guardrails/penalty65.ts` (not in the pricing path): implements Item 28 ¶3 —
- **Tier 1 (partial):** Agreement missing service description or quoted rates → affected charges = **65% of tariff max**.
- **Tier 2 (total):** Agreement missing NTE price, shipper signature, or mover signature → **all** charges = **lowest of** {65% of max, Estimate rates, Agreement rates}.
Built and unit-tested now; the paperwork layer will call it.

---

## 7. Compliance invariants the engine enforces (golden rules)

1. **Never above the MAX4 maximum.** Every regulated line is capped at its tariff ceiling *before* discount; `applyCaps` rejects any config rate that exceeds its cap.
2. **Discount only subtracts**, and only from the discountable base. It can never raise a charge, and never touches non-discountable items (Item 140 NOTE 3 flights/long-carry; Item 32 fraction results).
3. **>100-mile floor.** Routes ≤100 mi are blocked (wrong regime).
4. **Weight = cube × 7** unless a scale weight is supplied (Item 116).
5. **The NTE total is the binding ceiling** — and `nteTotalCents ≤ Σ caps` is asserted at runtime.
6. **Valuation is required** — no silent default; a missing election is a typed error.
7. **No fabricated rates** — a missing rate fails loud (`RateDataError`), never estimates.

---

## 8. Money & rounding

- **All money is integer cents.** No floating-point dollars anywhere in the engine.
- `money.ts` owns the only two rounding rules:
  - `roundItem32(cents)` — half-cent up (≥ ½¢ → next whole cent); used **only** for percentage-of-rate results (the discount; the 65% penalty). (Item 32.)
  - `nextHundredDollars(usd)` — round declared value up to the next $100, "or fraction thereof." (Item 136.)
- Weight→100-lb rounding is an **SVM convention**, implemented as a config flag and clearly labeled *not* a tariff rule.

---

## 9. Error handling (typed, fail-loud, plain-English)

| Error | When |
|-------|------|
| `DistanceTooShortError` | `distanceMiles ≤ 100` — distance-rate regime doesn't apply (use the hourly/local tool). |
| `RateDataError` | A required rate/county/cell is missing or malformed, or a unit can't be normalized. |
| `CapViolationError` | A config-supplied rate exceeds its tariff maximum (golden rule #1). |
| `ValuationRequiredError` | No affirmative valuation election supplied. |

Each carries a human-readable message. The engine never returns a number it couldn't fully justify.

---

## 10. Testing strategy (test-driven — tests written first)

- **Golden fixtures:** hand-verified cases drawn directly from real Item 310 cells (e.g., "5,000 lb, 250–275 mi → exact $X/100 lb → exact line-haul cents"), plus a handful of end-to-end `priceQuote` cases with known totals (line-haul + valuation, with and without a discount).
- **Property / invariant tests:**
  - `nteTotalCents ≤ Σ capCents` for every input.
  - Raising `discountPct` never raises any line and never raises the total.
  - The weight-break optimization never selects a costlier column than the actual-weight column.
  - Valuation (default) and (later) flights are unaffected by any discount.
- **Crossover checks:** computed weight-break crossovers equal the tariff's published Break Points for sampled cells.
- **Error-path tests:** each typed error fires on its trigger condition.
- Every `steps/` and `rates/` function gets unit tests; `priceQuote` gets end-to-end tests.

---

## 11. Open items (do not block the build; defaults are explicit and safe)

1. **ACV-$20k default chargeable?** The no-declaration default (ACV up to $20,000) may carry a $1.12/$100 charge — tariff text is ambiguous. **Engine default:** require an affirmative election (no silent ACV default). Confirm with BHGS/insurer; revisit if SVM wants the default offered.
2. **Is valuation discountable?** Conventionally a liability pass-through is **not** discounted. **Engine default:** `valuation.discountable = false`, configurable. Confirm SVM's intended policy; matters only when a discount > 0 is configured (default discount is 0%).
3. **Materials sales-tax rate** (Santa Clara County, ≈9.125% as of 2026-06) — needed when packing lands; stored as config, accountant to confirm exact rate. Not used in the core spine.
4. **Min-weight floor value** — default 5,000 lb (SVM policy). Confirm SVM's number; it's config, not tariff.

---

## 12. What "done" looks like for this sub-project

`lib/pricing/` exists, `priceQuote(input, rates)` returns a correct itemized `QuoteResult` (or a typed error) for line-haul + valuation + discount + NTE; all golden fixtures pass; all property/invariant tests pass; `loadRates("2026")` reads `data/2026/` normalized to cents with fail-loud validation; `penalty65` is implemented and tested. No UI, no database, no network. Ready for packing & accessorials as follow-on passes, and ready for the CRM/PDF/paperwork sub-projects to import.
