# Spec Audit — SVM Intrastate Quote App vs. MAX4 (Effective January 1, 2026)

**Audit date:** 2026-06-23
**Spec audited:** `SVM-Intrastate-Quote-App-SPEC.md` v0.1 + `CLAUDE.md`, `svm-config.json`, `rate-schemas.md`
**Primary source:** `2026_max_rate_tariff.pdf` — *Maximum Rate Tariff 4, Effective January 1, 2026* (BHGS, 98 pp.). Verified by reading the actual tariff text and rate-table page images; every finding cites an Item number and tariff page.

> **How to read this:** §1 is the headline. §2 is the corrected-numbers table (the load-bearing fixes). §3 is structural model changes. §4 is compliance wording. §5 reframes data provenance. §6 covers the Tier B catalogs. §7 is the actionable change-list for spec **v0.2**. §8 lists what's still genuinely external. Severity: **CRITICAL** = wrong number/rule that yields an illegal or incorrect price, or blocks compliance; **HIGH** = structural model gap; **MEDIUM** = accuracy/wording; **LOW** = cosmetic.

---

## 1. Executive summary — the three headlines

**① The spec is built on the wrong tariff edition.** The spec targets **MAX4 effective January 1, 2025**. The current law — and the PDF in this repo — is **MAX4 effective January 1, 2026**, which carries explicit **♦ "Rate Increase"** markers on Items 136 (valuation), 140 (flights/long carry), 164 (bulky), 310 (distance rates), 320 (hourly), 340 (packing), and the split-pickup/delivery items. **Every "Tier A — verified, embed as-is" dollar value in the spec is stale.** This is CRITICAL because the project's own golden rule #1 is "never price above the MAX4 maximum" — and the 2026 maxima are higher than the 2025 numbers the spec hard-codes, so a quote built on spec values would mis-state the legal ceiling.

**② "Item 310 and Item 340 are NOT external data to ingest later — they're in this PDF."** The spec's §4 classifies the Item 310 distance-rate matrix and Item 340 packing rates as *"Tier C — bulk official datasets to ingest at build time (NOT in this spec)."* That is now false. Both are printed in the 2026 tariff (Item 310 at p.56–57; Item 340 at p.60–62) and have been **extracted to `data/2026/`**. (The full Item 310 matrix — the tariff's single "Region 1" table; there is no Region 2 — is corroborated by its own internal arithmetic: all 204 published Break Points satisfy `BP(g) ≈ min_wt(g+1)·rate(g+1)/rate(g)`, and rates are monotone in both axes. Treat it as high-confidence-but-verify, not gospel — see `data/2026/README.md`.) The only candidate external dataset is **Distance Table 8** — **but even that may not be required:** **Item 40 (2026) now allows GPS.** Verbatim: *"Distances… shall be the shortest mileage via any public highway route, computed in accordance with the method provided in the **Distance Table or by using a global positioning system (GPS) navigation tool or platform**."* This **relaxes the project's golden rule #5** ("Distance Table 8 governs price; Google miles are context only"): in 2026 a GPS/Google **shortest-highway** mileage is itself a permitted pricing basis. Net effect: the project's hard dependency on obtaining Distance Table 8 is largely removed — the Google Distance Matrix the spec already planned to use (for "context only") can drive the price, provided it returns the shortest public-highway route. Still never *fabricate* a mileage (golden rule #2), but you may now compute it via GPS.

**④ The valuation default needs resolving (VERIFY — not a confirmed defect).** The spec defaults the UI to **Released ($0.60/lb, free)**. The tariff is genuinely ambiguous here, and there are two defensible readings:
- *Spec's reading (defensible):* Item 136 ¶1 says the line-haul rate **is based on** a $0.60/lb released value — so "default to Released" is arguably correct, with the **$20,000 ACV** in ¶2/¶6 being the **liability cap** that applies when nothing is declared, not a separate priced product.
- *The stricter reading:* the mandated NOTE 3 notice — *"Coverage… is limited to the Actual Cash Value of losses up to $20,000 unless the shipper… declares otherwise"* — frames ACV-$20,000 as the **no-declaration default**, and ¶6 attaches the **$1.12/$100 ACV rate** to "defaults to ACV because no value is declared," which would make a no-declaration shipment *chargeable*, not free.

These can't both be the intended behavior, and the difference is real money. **Action: do not silently book "Released $0" without a recorded, signed valuation election; resolve the default-coverage question with SVM/BHGS before launch.** (The verification pass marked the "is the $20k default chargeable?" sub-point *unverifiable* from the tariff text alone.)

**③ Three "accessorials" the spec models as free-form SVM flat fees are actually tariff-regulated with hard maxima.** Under golden rule #1, a configurable fee must **cap at the tariff maximum**, not float:
- **Shuttle** → **Item 184**: charged at **Item 320 hourly rates** (Territory A/B), *not* a flat fee.
- **"Extra stop"** → **Items 148 / 152 / 156** (Split Pickup / Split Delivery / combination): for distance-rated moves, line-haul on the composite weight **plus not more than $134.45 per extra stop**.
- **Bulky** → **Item 164** (Light & Bulky Articles): tariff *names* the bulky articles and sets a **maximum loading/unloading charge or weight additive** for each — the list and amounts are partly tariff-defined, not purely SVM config.

---

## 2. Corrected numbers (CRITICAL — these are legal ceilings)

All values read directly from the 2026 tariff page images. "Spec (2025)" is what `SVM-Intrastate-Quote-App-SPEC.md` §7 / `svm-config.json` currently encode.

| # | Charge | Spec value (2025) | **2026 tariff value** | Citation | Severity |
|---|---|---|---|---|---|
| 1 | Flight / long carry, **distance-rated** basis | $1.75 / 100 lb | **$2.26 / 100 lb** | Item 140 ¶1 (p.41) | CRITICAL |
| 2 | Flight / long carry, piece basis (Item 330) | — (not in spec) | **$6.54 / piece** | Item 140 ¶1 (p.41) | MEDIUM |
| 3 | Piano/organ flight **inside**, first | $30.45 | **$39.30** | Item 140 ¶2(a) (p.41) | CRITICAL |
| 4 | Piano/organ flight **inside**, each additional | $15.25 | **$19.71** | Item 140 ¶2(a) (p.41) | CRITICAL |
| 5 | Piano/organ flight **outside**, first | $30.45 | **$39.30** | Item 140 ¶2(b) (p.41) | CRITICAL |
| 6 | Piano/organ flight **outside**, each additional step | $0.60 | **$0.90** | Item 140 ¶2(b) (p.41) | CRITICAL |
| 7 | Valuation — Full Value, shipper holds first **$250** of claim ("FVRP-$250") | $0.45 / $100 | **$0.67 / $100** | Item 136 ¶7(a) (p.39) | CRITICAL |
| 8 | Valuation — Full Value, shipper holds first **$500** of claim ("FVRP-$500") | $0.25 / $100 | **$0.38 / $100** | Item 136 ¶7(b) (p.39) | CRITICAL |
| 9 | Valuation — Full Value, **no deductible** (reference) | $1.70 / $100 | **$2.20 / $100** | Item 136 ¶7 (p.39) | MEDIUM |
| 10 | Valuation — Actual Cash Value (reference) | $0.75 / $100 | **$1.12 / $100** | Item 136 ¶6 (p.39) | MEDIUM |
| 11 | Released-value base (built into line haul) | $0.60 / lb | **$0.60 / lb** ✓ | Item 136 ¶1 (p.38) | — confirmed |
| 12 | Default liability if no value declared | ACV up to $20,000 | **ACV up to $20,000** ✓ | Item 136 ¶6 (p.39) | — confirmed |
| 13 | Constructive weight factor | 7 lb / cu ft | **7 lb / cu ft** ✓ | Item 116 ¶4; Item 164 (p.30, 45) | — confirmed |
| 14 | "Extra stop" (split pickup/delivery), distance-rated | flat SVM fee (CONFIG, null) | **≤ $134.45 per stop** + composite-weight line haul | Items 148 ¶2(b), 152, 156 (p.42–43) | HIGH |
| 15 | Shuttle | flat SVM fee (CONFIG, null) | **Item 320 hourly rates** (Territory A/B) | Item 184 ¶3 (p.51) | HIGH |

> The full **Item 310 distance-rate matrix** and **Item 340 packing/container table** were extracted to data files — see §5 and `/data/2026/`. They were not in the spec at all (placeholders only); the real 2026 cells now exist.

---

## 3. Structural / model corrections

### 3.1 Territory A vs. B is missing everywhere (HIGH)
Item 340 (packing/container) **and** Item 320 (hourly) publish **two rate columns — Territory A and Territory B** (territories defined in Items 200/210/230). The spec and `svm-config.json` contain no concept of territory. Any packing-labor, hourly, or shuttle charge depends on which territory the service occurs in. **Add a territory dimension** to the rate model and resolve origin/destination → territory. *(Which territory San Jose and common CA destinations fall in is being extracted from Items 200/210.)*

### 3.2 The 100-mile boundary is off-by-one (MEDIUM, but compliance-relevant)
Spec says the app handles **"100+ / ≥100 constructive miles"** and blocks anything **"< 100."** Item 16 actually says:
- **16(1)(a):** *"For transportation of shipments for distances of **100 miles or less**, the distance rates (Item 310/390) **or** hourly rates (Item 320) apply…"*
- **16(1)(b):** *"For… distances **in excess of 100 miles**, the distance rates (Item 310/390) **shall** apply…"*

So distance rates are *mandatory* only **above 100 miles**; at exactly 100 miles (or below) the move is the "100 or less" regime. **Fix:** the mandatory-distance / app-scope floor is **> 100 miles**, and the block should trigger at **≤ 100**, not `< 100`. (Also note: the spec's rationale — "below 100 is hourly-only" — is imprecise; distance rates are *permitted* at ≤100, just not mandatory.)

### 3.3 Rounding is mis-attributed to Item 32 (MEDIUM)
Spec §11 and `svm-config.json.rounding` cite **Item 32 "Disposition of Fractions"** for "weight up to next 100 lb, declared value up to next $100, money to the cent." Item 32 actually reads: *"In computing a rate based on a **percentage of another rate**… (a) fractions < ½¢ omit; (b) fractions ≥ ½¢ increase to the next whole figure."* It governs **only percentage-of-rate math** (e.g., the discount %, or the 65% penalty calc) → **round to the whole cent, half-up.** It does **not** define weight or declared-value rounding. Correct sourcing:
- **Declared-value → next $100:** comes from Item 136's *"or fraction thereof"* per $100, not Item 32. ✓ keep the behavior, fix the citation.
- **Weight rounding:** there is no "round to next 100 lb" rule in Item 32. Weight feeds the Item 310 **minimum-weight bracket** lookup + the published **Break Point** (weight-break). Re-ground or remove the "round weight to 100 lb" default. *(Item 80 "Weights and Weighing" governs actual-weight determination; confirm any rounding there.)*
- **Discount %:** *is* a percentage-of-rate → Item 32 applies (half-cent up).

### 3.4 The discount lever may not be applicable to some charges (MEDIUM)
Item 24 says movers may quote **below** max — **except** for a list in its NOTE, which includes **Item 32** and **Item 140 Note 3** (flight/long-carry basis), plus Items 36¶5, 88¶9(e), 92, 100¶4, 160. The spec applies the discount to a "regulated subtotal" that *includes* flight/long-carry. That likely conflicts with Item 24's NOTE. **Action:** confirm exactly which charges are non-discountable and exclude them from the discount base. At minimum, do not discount the flight/long-carry charge or the Item 32 fraction result.

### 3.5 Flight/long-carry weight basis (MEDIUM)
Spec §6 Step 5 computes flights as `$rate × chargeable_weight` (whole shipment). Item 140 **Note 3**: *"Charges shall be based upon the **actual weight of the article(s) for which** flight or long carry service is provided."* For a whole-house carry that's ~the shipment weight, but the correct basis is the weight of the articles actually carried over that flight/long-carry. **Action:** model per-occurrence carried-article weight (default to shipment weight when all goods are carried), and note Item 140 Note 3 is non-discountable (see §3.4).

### 3.6 Item 320 hourly rates are never ingested (HIGH)
Even though the app is "distance-regime," several in-scope services bill at **Item 320 hourly rates**: shuttle (Item 184), split-pickup/delivery under the hourly option (Items 148/152/156), and disassembly/reassembly (Item 172). The spec ingests no hourly table. **Action:** ingest Item 320 (Territory A/B) as a rate source for these accessorials.

### 3.7 Disassembly / reassembly is unmodeled (MEDIUM)
**Item 172**: distance rates do **not** include disassembly/reassembly of outdoor articles (swing sets, trampolines, basketball goals) or unusual articles (pool tables, large wall units, waterbeds); these are billed at **Item 320 hourly** on request. The cube-catalog flags pool tables as "bulky + specialty" but there is no disassembly-labor line. **Action:** add a disassembly/reassembly service (hourly, Item 320), at least as a schema hook.

---

## 4. Compliance wording corrections

### 4.1 65% penalty — exact trigger and required fields (HIGH)
Spec: *"Failure to issue a proper Agreement forces charges down to 65% of maximum (Item 28 ¶3)."* The exact 2026 rule (Item 28 ¶3, p.10):
- If the mover fails to issue an Agreement per Item 128, **or** the Agreement is missing **(a)** a description of services or **(b)** the rates quoted → rates for the undescribed/unquoted services = **65% of max**.
- If the Agreement is missing **(c)** the Not-to-Exceed price, **(d)** the shipper's signature, or **(e)** the mover's signature → **all** transportation + accessorial charges = the **lowest of** {65% of max, Estimate rates, Agreement rates}.
- **EXCEPTION:** a mover that advertises/regularly charges below 65% uses that lower level.

**Action:** the app's "Agreement complete" gate must verify all five fields **(a)–(e)** are present before an Agreement can be marked issued. Encode the penalty exactly (it's not a single flat 65% — fields c/d/e trigger the "lowest of three" rule).

### 4.2 Document numbering — rule vs. form (MEDIUM)
The spec cites "Agreement = Item 128," "Estimate = Item 108/420," "Change Order = Item 120/440," "Shipping Order/BOL = Item 132/460." The 2026 tariff has **both** a *rule* item and a *form* item for each:

| Document | Rule item | Form item (the printable layout to reproduce) |
|---|---|---|
| Agreement for Moving Services | **128** | **450** (p.78) |
| Estimated Cost of Services | **108** (+112 basis) | **420** (p.72) |
| Change Order for Services | **120** | **440** (p.75) |
| Shipping Order & Freight Bill (BOL) | **132** | **460** (p.81) |
| Table of Measurements & Estimate | **116** | **410** (p.67) |
| Important Notice about Your Move | **130** | **465** (p.83) |
| Basis for Mover's Estimated Cost | **112** | **400** (p.66) |
| Important Information for Persons Moving | — | **470** (p.84) |

**Action:** the document generator must reproduce the **form** items (400/410/420/440/450/460/465/470); the **rule** items (108/112/116/120/128/130/132) define the required fields. The spec conflates them. *(Exact verbatim field lists for Item 132/460 and Item 128/450 are being extracted.)*

### 4.3 Retention confirmed (LOW)
3-year document retention confirmed — Item 132 ¶3 (p.38): retain not less than **three (3) years** from date of issuance (or expiration/cancellation for a Master Agreement). ✓

### 4.4 Estimates & the 3-day rule — confirmed (HIGH)
Confirmed from Items 108, 112, 128 (p.28–31):
- **Visual inspection is mandatory:** Item 112 ¶1 — the estimator must **visually inspect the goods** before estimating; the "Basis for Estimate" (form Item 400) is signed by the shipper. Header must read "BASIS FOR MOVER'S ESTIMATED COST OF SERVICES" in red ≥⅛-inch caps.
- **3-day rule (Item 108 ¶2):** an Estimate/Agreement issued **no less than 3 days before the day of the move** may bind **above** max fixed rates (¶2(a)); issued **less than 3 days before**, the charge **shall not exceed** max fixed rates (¶2(b)).
- **Exact counting rule (the app must implement this, not "≥3 days" loosely):** *"No less than three days before the move means on or before the **third day** before the move. E.g., if Saturday is the move day, the Estimate/Agreement must be in the shipper's hands on or before **Wednesday**."*
- **Agreement timing (Item 128):** the Agreement must be **delivered to the shipper ≥3 days before the move**; the mover's *initial* signature binds the quoted rates; the **NTE price and mover's final signature must be added no later than the move day, before any service begins**. Failure to deliver/complete → Item 28 ¶3 (the 65% penalty).
- **Exceptions to encode:** EXC.1 first contact <3 days → Agreement may complete on move day; EXC.2 the ≥3-day "blank/partial Agreement + signed waiver" path (but a fully completed Agreement incl. NTE on move day before the move **can never be waived**); EXC.3 Master Agreement for repeat shippers.

**Action:** the app must (a) require a recorded visual inspection before a binding estimate; (b) compute the 3-day test by the "in hands on/before the 3rd day before move" rule; (c) drive the Agreement signature/NTE workflow (initial mover signature → NTE + final signature before move start); (d) support the three exceptions.

---

## 5. Data-provenance reframe (rewrite spec §4)

| Dataset | Spec §4 says | Reality (2026) |
|---|---|---|
| Item 310 distance-rate matrix | "Tier C — ingest, NOT in this spec" | **In the PDF (p.56–57).** Real 2026 cells extracted → `data/2026/item310.csv`. Publishes a **Break Point** per cell (the weight-break is tariff-supplied). |
| Item 340 packing/container rates | "Tier C — ingest" | **In the PDF (p.60–62).** Territory A/B. Extracted → `data/2026/item340_*.csv`. |
| Item 320 hourly rates | not mentioned | **In the PDF (p.58).** Needed for shuttle/splits/disassembly. |
| Item 136/140/164/148/152/156/184 fee rates | partly "Tier A" (stale) / partly CONFIG | **All in the PDF**, all 2026-current, extracted. |
| **Distance Table 8** (constructive miles) | "Tier C — ingest" | **NOT in the PDF.** Genuinely external (separate BHGS issue). The one real ingest. Never estimate a mileage. |

So the spec's three-tier framing should be revised: almost everything it called "Tier C, external" is actually **in the official tariff** and now captured. Tier C shrinks to **Distance Table 8 only**.

---

## 6. Tier B catalog reconciliation

- **`cube-catalog.csv`:** The tariff makes the **Item 410 Table of Measurements cube a mandatory minimum** — the Estimate form notice (p.67) states it is *"mandatory to use cubic footage for each article at **not less than** that shown on the Table of Measurements."* Spot-checks show the catalog generally **meets or exceeds** Item 410 (e.g., Sofa 3-cushion 50 = 50 ✓; coffee table 10 ≥ 5; pianos 70–100 ≥ 60–70), which is compliant. **Action:** elevate the spec's "reconcile on first run" to a **hard validation: every catalog cube ≥ its Item 410 value**; flag (and never ship) any item below the minimum, and align item naming to Item 410.
- **`materials-catalog.csv`:** `max_price_cents` / `svm_price_cents` are empty. Item 340 supplies the **container max sale prices** (now extracted). Item 340 **Note 9:** container rates **exclude sales tax** → confirms materials are separately taxable. Fill `max_price_cents` from `data/2026/item340_containers.csv`; enforce `svm_price ≤ max_price`.

---

## 6.5 Additional confirmed findings (from the independent verification pass)

The verification pass produced **77 findings** (21 critical, 22 high, 15 medium, 19 low) — see the full table in **`SPEC-AUDIT-2026-findings.md`**. Beyond §2–§4 above, these are the material ones to act on:

- **Territory resolution is concrete (HIGH).** Item 210: **Territory A** = San Francisco City/County + Alameda, Contra Costa, Marin, Monterey, San Mateo, **Santa Clara**, Santa Cruz, Sonoma. **Territory B** = the rest of California. So **SVM's San Jose origin = Territory A**; typical destinations (LA, San Diego, Sacramento, Fresno) = **Territory B**. Per Item 340 Note 3, **packing labor uses the origin territory; unpacking labor uses the destination territory.** Captured in `data/2026/territories.csv`.
- **Split-pickup/delivery re-routes the mileage (HIGH/wrong).** Spec §16 says "mileage remains origin→final destination." Item 148/152/156 §2(b)(1): the line-haul is charged on the composite weight over the **shortest route *through* the intermediate stop(s)**, *plus* the ≤$134.45/stop additive. Two-part charge, and the mileage is not the direct route.
- **Item 310 publishes a Break Point per cell (HIGH/missing).** The weight-break crossover is tariff-supplied (Item 310 NOTE 1), not something to derive blind. Ingest it and assert the engine's computed crossover equals the published B.P. Also: the spec's `rate-schemas.md` Item 310 schema is **structurally wrong** (it assumes weight min/max bands + uniform 50-mi brackets with fabricated example rows). Real structure: minimum-weight columns {any-qty<1000, 1000, 2000, 5000, 8000, 12000, 16000} + B.P. per cell, OVER/NOT-OVER variable-width mileage bands, + an "ADD per 50 mi over 850" tail. Corrected schema in `data/2026/README` / change-list. (CRITICAL for the importer.)
- **`min_weight_lb = 5000` is NOT a tariff value (HIGH/wrong).** MAX4 has no minimum shipment/charge weight — Item 310 prices down to "Any Quantity (<1000 lb)." The 5,000 floor is purely an SVM business policy; remove it from the spec's "Tier A — verified fixed rates" framing and never present it to a customer as a regulatory requirement.
- **The required paperwork is 5+ documents, not 4 (HIGH/missing).** Add **Item 130 / form Item 465 "Important Notice About Your Move"** — a separately-signed notice carrying its own NTE, delivered ≥3 days before the move, whose signature **cannot be waived** and which **gates "commence move."** When an Estimate is issued it also requires its companions: **Item 112 / form Item 400 "Basis for Mover's Estimated Cost of Services"** and **Item 116 / form Item 410 "Table of Measurements and Estimate."**
- **Document field lists are incomplete (HIGH).** The Agreement (Item 128) requires fields **(a)–(r)** — the spec omits date-tendered, date-issued, pickup date/time, notification party, helpers/packers count, payment method, and the entire Consumer-Protections/Waivers block (booklet-receipt initials, valuation declaration). The BOL (Item 132) requires **(a)–(u)** — the spec omits DBA/fictitious names, which name performed the move, principal-office address, time deductions, and the catch-all. The Change Order (Item 120) requires **(a)–(j)** with mandatory ≥10pt-bold certification statements and a ≥12pt-bold "NOT EXCEED ___ (Initial)" line.
- **Packing supplies are included in container rates (HIGH/wrong).** Item 340 Note 6: paper, tape, dividers, labels used to pack/seal a container are **included** in the per-container charge — billing them separately on top of an Item 340 container line **exceeds the maximum** (overcharge). Also, Item 340 sets **no** max price for loose supplies, so the materials-catalog's "Item 340 (SOURCE)" attribution for paper/tape/bubble-wrap is wrong (those are SVM-priced, not tariff-capped).
- **Item 340 has an hourly packing option too (HIGH/missing).** Besides per-container rates, Item 340 ¶2 publishes per-hour-per-person labor by Territory A/B (straight $93.67/$82.56, 1.5× $138.04/$121.07, 2× $181.98/$159.74) — a legitimate pricing path the spec can't represent. Captured in `data/2026/item340_packing_hourly.csv`.
- **Units & weighing rules unmodeled (MEDIUM).** Item 44 forbids quoting in a non-tariff unit (must be per 100 lb, not per-cf dollars). Item 80: actual-weight moves need a weighmaster certificate, use the **lowest** net scale weight when several exist, with a reweigh tolerance (100 lb / 2%) and a **$60.27 reweigh fee**.
- **Item 164 bulky has a weight-additive mechanism too (CRITICAL/missing).** Besides flat per-named-article charges ($96.38–$334.55), boats/trailers/campers/aircraft use **lb-per-linear-foot additives** added to net weight, then priced through Item 310 line-haul. Captured in `data/2026/accessorials_148_164_184.csv`.

## 7. Change-list for spec v0.2 (actionable)

**A. Edition & numbers**
1. Re-stamp everything to **MAX4 effective 2026-01-01**; update `tariff_edition_label`.
2. Replace stale Tier A values per §2 table (flights $2.26; piano $39.30/$19.71/$0.90; valuation $0.67/$0.38; FV $2.20; ACV $1.12).
3. Update `svm-config.json.accessorials.flight_long_carry.rate_cents` 175 → **226**; `elevator` 175 → **226**; `piano_flight_inside` 3045/1525 → **3930/1971**; `piano_flight_outside` 3045/60 → **3930/90**.
4. Update `svm-config.json.valuation.tiers`: fvrp250 45 → **67**; fvrp500 25 → **38**.

**B. Structural**
5. Add **Territory A/B** to the data model + a territory resolver (Items 200/210/230); make packing/hourly/shuttle rates territory-keyed.
6. Reclassify accessorials: **shuttle** → Item 320 hourly (cap at max); **extra stop** → Items 148/152/156 (composite line haul + ≤ $134.45/stop); **bulky** → Item 164 named-article max charge/weight-additive. Each CONFIG fee must **cap at the tariff max**.
7. Ingest **Item 320 hourly** rates; add **disassembly/reassembly** (Item 172) service hook.
8. Fix the **>100-mile** boundary (block ≤ 100, not < 100).
9. Re-ground **rounding**: declared value → $100 via Item 136; discount % via Item 32 (half-cent up); drop/justify weight-to-100lb.
10. Exclude non-discountable charges (Item 24 NOTE: Item 32, Item 140 Note 3, …) from the discount base.
11. Flight/long-carry basis = **carried-article weight** (Item 140 Note 3), default = shipment weight.

**C. Compliance & data**
12. Encode the **65% penalty** precisely + the **(a)–(e)** Agreement-field gate (§4.1).
13. Separate **rule vs. form** items in the document generator (§4.2); reproduce form layouts 400/410/420/440/450/460/465/470.
14. Rewrite **§4 data provenance** (§5): Tier C = Distance Table 8 only; everything else is in-tariff and captured under `data/2026/`.
15. cube-catalog: hard "≥ Item 410" validation; materials-catalog: fill from Item 340, enforce `svm ≤ max`.

**E. From the verification pass (§6.5)**
17. **Distance basis:** allow **GPS** shortest-highway mileage as a pricing basis (Item 40, 2026); demote the "Table 8 governs, Google context-only" rule. Revise golden rule #5 / §13 accordingly.
18. **Valuation default:** make the legal default **ACV $20,000** (Item 136 ¶2/¶6), require an affirmative signed valuation election before "Released," embed the verbatim Item 128 NOTE 3 declaration, and flag the "is the default $20k ACV chargeable at $1.12/$100?" question for confirmation.
19. **Documents:** generate **5+** — add Item 130/465 "Important Notice" (signed, ≥3 days, gates move start), and the Estimate companions Item 112/400 + Item 116/410. Expand Agreement to Item 128 (a)–(r), BOL to Item 132 (a)–(u), Change Order to Item 120 (a)–(j).
20. **Territory resolver:** add county→territory (Item 210); pack at origin territory, unpack at destination territory; SVM HQ = Territory A.
21. **Packing supplies:** don't bill loose paper/tape/etc. on top of an Item 340 container line (Note 6 includes them); drop the "Item 340 SOURCE" attribution for loose supplies.
22. **Split mileage:** charge line-haul over the shortest route **through** the extra stop(s), plus ≤$134.45/stop (Items 148/152/156).
23. **Units/weighing:** add Item 44 (tariff-unit) + Item 80 (weighmaster cert, lowest net weight, reweigh tolerance + $60.27 fee) guardrails.

**D. Housekeeping**
16. Files are currently named `… copy.md/csv/json` and untracked; the "glossary" is **RTF mislabeled `.md`** (a clean conversion is in the audit scratch). Rename to canonical names and commit a baseline before applying edits, so v0.2 is a reviewable diff.

---

## 8. Still genuinely external / open (not resolvable from the tariff)

- **Distance Table 8** — **no longer a hard dependency.** Item 40 (2026) permits computing the constructive mileage by **GPS** (shortest public-highway route) as an alternative to the Distance Table. So the app can price off Google Distance Matrix's shortest-highway distance without obtaining Table 8 at all. If SVM still wants Table 8 as a cross-check or primary, it remains a separate BHGS publication to obtain. *(Either way: never fabricate a mileage — golden rule #2 stands; just compute it via GPS or the table.)*
- **Materials sales-tax rate** — external (CDTFA / Santa Clara County point-of-sale); the tariff only confirms materials are taxable (Item 340 Note 9). Confirm rate with SVM's accountant.
- **SVM-specific overrides** — logo/brand colors, any SVM prices below the tariff max, quote-validity period. Business inputs, not tariff facts.
- **CA deposit/collection limits** — partially addressed by Item 104 (Collection of Charges); *exact limits being extracted* — anything beyond the tariff is a legal/accountant confirmation.

---

*Sources: all citations are to `2026_max_rate_tariff.pdf` (MAX4 eff. 2026-01-01). Numeric values were read from page-image renders; structured rate data is under `/data/2026/`. This audit was cross-checked by an independent verification pass (per-category auditors + dual transcription of Item 310).*
