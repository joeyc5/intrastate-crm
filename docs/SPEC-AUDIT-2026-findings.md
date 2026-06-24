# Spec Audit — Full Findings Appendix (MAX4 2026)

Companion to `SPEC-AUDIT-2026.md`. **77 findings** from an independent per-category verification pass (6 auditors) against *Maximum Rate Tariff 4, Effective January 1, 2026*. Every row cites an Item + tariff page. Generated from the audit workflow's structured output.

**Severity:** 21 critical · 22 high · 15 medium · 19 low  

**Verdict:** 20 wrong · 14 stale · 20 missing-in-spec · 21 confirmed · 2 unverifiable


---

## CRITICAL

### 1. [missing-in-spec] The bulky charge is a single per-item flat fee (no weight-additive mechanism)
- **Spec says:** config basis is 'per_item' only. Spec has no concept of a weight additive that increases the shipment's chargeable weight for the line-haul.
- **2026 tariff says:** Item 164 WEIGHT ADDITIVES: for travel camper trailers, mini-mobile homes, airplanes, boats, light rowboats, kayaks, canoes, gliders, skiffs, sailboats and/or boat trailers, 'transportation charges will be based on the net scale weight of the shipment, PLUS a weight additive': Airplanes/gliders 120 lb per linear ft of fuselage; Boats ≥14ft 115 lb/ft; Boat trailers (any length) 75 lb/ft; Canoes/skiffs/light rowboats/kayaks ≥14ft 40 lb/ft; Sailboats ≥14ft 125 lb/ft; Travel camper trailers & mini-mobile homes 300 lb/ft. NOTE 1: additive does NOT apply to boats/canoes/etc under 14 ft, nor dinghies/sculls any size. NOTE 2: multiple additive articles are summed. NOTE 3: fractions of a foot disregarded.
- **Citation:** Item 164 (Continued), WEIGHT ADDITIVES + NOTES 1-3, PDF p51-52 (printed p47); read from rendered PNG p-51
- **Fix (v0.2):** Add a second bulky basis: 'weight_additive' (lb per linear foot, by article type, ≥14ft threshold where noted, fractions of a foot dropped, summed per NOTE 2). For additive-eligible articles the lb/ft additive is ADDED to net scale weight and then priced through the Item 310 line-haul — it is not a flat per-item fee. Seed the lb/ft table from Item 164. Note for boats/trailers the per-article flat charge ($108.42 etc) and the weight additive are alternative/complementary per the item header ('charges OR weight additive ... may apply'); model both and apply per Item 164's basis.

### 2. [stale] Engine compute order (spec §6) hardcodes flight/long-carry at $1.75/100 lb inside the line-haul flow
- **Spec says:** Spec §6 Step 5 + §7 + §10 + §18 test 7 + svm-config accessorials.flight_long_carry.rate_cents=175: 'flight / long carry / elevator: $1.75 per 100 lb x chargeable_weight, per occurrence per leg (Item 140).'
- **2026 tariff says:** Item 140 ¶1, distance basis (Item 310/390): '$2.26 per 100 pounds' (see NOTE 3). Hourly basis: 'No additional'. Piece basis: '$6.54 per piece'. NOTE 3 basis = actual weight of the articles carried. The $1.75 figure does not appear.
- **Citation:** Item 140 ¶1 PDF p45 (txt L2076-2080)
- **Fix (v0.2):** Update flight/long-carry distance basis to $2.26/100 lb (Item 140, 2026) in §6 Step 5, §7, §10, svm-config (175->226), and acceptance test 7. NOTE 3: charge on ACTUAL WEIGHT OF THE ARTICLES carried per occurrence, not whole-shipment chargeable weight - the spec's 'x chargeable_weight' is also wrong. (Full Item 140 detail is owned by the flight/long-carry category; flagged here because it is wired into the §6 compute order.)

### 3. [stale] FVRP-$250 valuation rate is $0.45 per $100 of declared value
- **Spec says:** SPEC line 162, 197 and §9 table: fvrp250 = $0.45/$100; config fvrp250 rate_per_100_declared_cents = 45. Worked example line 315: $60,000 declared × $0.45/$100 = $270.00.
- **2026 tariff says:** Item 136 ¶7(a): 'When the shipper assumes responsibility for the first $250 of any claim, the maximum fixed rate shall be $0.67 for each $100 (or fraction thereof) of the declared value.'
- **Citation:** Item 136 ¶7(a), PDF p43 (printed p39)
- **Fix (v0.2):** Change fvrp250 rate from $0.45 to $0.67/$100 (config rate_per_100_declared_cents: 45 → 67). The spec's mapping of 'fvrp250'→'first $250 of claim' is correct per ¶7(a); only the rate is stale (2025 edition). Also fix the worked example line 315: $60,000 × $0.67/$100 = $402.00, not $270.00 — that stale example ships a wrong price in the spec.

### 4. [stale] FVRP-$500 valuation rate is $0.25 per $100 of declared value
- **Spec says:** SPEC line 162, 198 and §9 table: fvrp500 = $0.25/$100; config fvrp500 rate_per_100_declared_cents = 25.
- **2026 tariff says:** Item 136 ¶7(b): 'When the shipper assumes responsibility for the first $500 of any claim, the maximum fixed rate shall be $0.38 for each $100 (or fraction thereof) of the declared value.'
- **Citation:** Item 136 ¶7(b), PDF p43 (printed p39)
- **Fix (v0.2):** Change fvrp500 rate from $0.25 to $0.38/$100 (config rate_per_100_declared_cents: 25 → 38). Mapping 'fvrp500'→'first $500 of claim' per ¶7(b) is correct; only the rate is stale.

### 5. [stale] Flight/long-carry distance-rated basis rate ($/100 lb)
- **Spec says:** $1.75 per 100 lb (spec §6 Step 5 line 132, §7 Tier A line 160, §10 line 213, worked example line 314, acceptance test line 332; config accessorials.flight_long_carry.rate_cents=175)
- **2026 tariff says:** $2.26 per 100 pounds — Item 140 para 1: 'Distance under Item 310 or 390 ...... $2.26 per 100 pounds (see NOTE 3)'. Verified in layout text and on rendered PNG p-45 (printed page 41).
- **Citation:** Item 140, para 1, PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Change all instances of $1.75/100 lb to $2.26/100 lb (rate_cents 175 -> 226). Update spec lines 132,160,213,314,332 and config accessorials.flight_long_carry.rate_cents. Re-run worked example: 84 cwt x $2.26 = $189.84 (not $147.00).

### 6. [stale] Elevator accessorial rate (counts as one flight)
- **Spec says:** config accessorials.elevator.rate_cents=175 (per_100lb); spec §6 line 132 'Elevator counts as one flight'
- **2026 tariff says:** Elevator (non-vehicular) is a flight under Item 140 NOTE 1(c); therefore billed at the same distance-basis rate of $2.26 per 100 pounds. No separate elevator rate exists in the tariff.
- **Citation:** Item 140 NOTE 1(c) + para 1, PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Update config accessorials.elevator.rate_cents 175 -> 226 (mirror flight_long_carry). The 'counts as one flight' logic is correct per Note 1(c); only the rate number is stale.

### 7. [stale] Piano/organ flight rate — INSIDE a building: first flight
- **Spec says:** $30.45 first flight (spec §7 line 161, §10 line 214, acceptance test line 332; config piano_flight_inside.first_cents=3045)
- **2026 tariff says:** $39.30 — Item 140 para 2(a): 'First Flight ... $39.30 (see NOTES 4 and 6)'. Verified on PNG p-45.
- **Citation:** Item 140 para 2(a), PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Change $30.45 -> $39.30 (config piano_flight_inside.first_cents 3045 -> 3930). Update spec lines 161, 214, 332.

### 8. [stale] Piano/organ flight rate — INSIDE a building: each additional flight
- **Spec says:** $15.25 each additional (spec §7 line 161, §10 line 214, acceptance test line 332; config piano_flight_inside.each_additional_cents=1525)
- **2026 tariff says:** $19.71 — Item 140 para 2(a): 'Each additional Flight ... $19.71'. Verified on PNG p-45.
- **Citation:** Item 140 para 2(a), PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Change $15.25 -> $19.71 (config piano_flight_inside.each_additional_cents 1525 -> 1971). Update spec lines 161, 214, 332.

### 9. [stale] Piano/organ flight rate — OUTSIDE a building: first flight
- **Spec says:** $30.45 first flight (spec §7 line 161, §10 line 214; config piano_flight_outside.first_cents=3045)
- **2026 tariff says:** $39.30 — Item 140 para 2(b): 'First Flight ... $39.30'. Verified on PNG p-45.
- **Citation:** Item 140 para 2(b), PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Change $30.45 -> $39.30 (config piano_flight_outside.first_cents 3045 -> 3930). Update spec lines 161, 214.

### 10. [stale] Piano/organ flight rate — OUTSIDE a building: each additional STEP
- **Spec says:** $0.60 each additional step (spec §7 line 161, §10 line 214, acceptance test line 332; config piano_flight_outside.each_additional_step_cents=60)
- **2026 tariff says:** $0.90 — Item 140 para 2(b): 'Each additional Step ... $0.90'. Verified on PNG p-45.
- **Citation:** Item 140 para 2(b), PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Change $0.60 -> $0.90 (config piano_flight_outside.each_additional_step_cents 60 -> 90). Update spec lines 161, 214, 332. Note the unit is 'each additional STEP' (outside) vs 'each additional FLIGHT' (inside) — wording is already correct, only the number is stale.

### 11. [unverifiable] A no-declaration (default-ACV-$20,000) shipment carries $0 valuation charge
- **Spec says:** SPEC §9 defaults to Released → valuation_cents = $0; no valuation charge is computed when no value is declared.
- **2026 tariff says:** Item 136 ¶6: '...or if protection defaults to Actual Cash Value up to $20,000 because no value is declared, the mover shall guarantee recovery ... The maximum fixed rate for Actual Cash Value protection ... will be $1.12 for each $100 (or fraction thereof) of the declared value.' Read literally, the $1.12/$100 rate attaches to the default-ACV-$20,000 case as well as to written ACV orders (1.12 × $20,000/100 = $224.00).
- **Citation:** Item 136 ¶6, PDF p43 (printed p39)
- **Fix (v0.2):** FLAG for human/BHGS confirmation: does the $1.12/$100 ACV rate apply to the no-declaration $20,000 default, or is the default coverage provided at no charge? The tariff grammar attaches the charge to both clauses. If chargeable, the spec's '$0 when Released-default' is a material under-pricing/illegal-quote risk. Do not silently treat default coverage as free in v0.2 without confirming this with a human.

### 12. [wrong] Item 310 data schema: line-haul rate matrix is weight-group ranges (min/max) x mileage brackets, one rate per cell
- **Spec says:** rate-schemas.md defines rate_item310.csv as weight_group_min_lb,weight_group_max_lb,mile_bracket_min,mile_bracket_max,rate_cents_per_100lb with example rows '2000,2999,100,150,<cents>' and '8000,9999,301,350,<cents>'. Data model entity rate_item310 has weight_group_min_lb AND weight_group_max_lb (a closed range per group).
- **2026 tariff says:** Item 310 publishes a single REGION-1 table (no min/max ranges). Columns are MINIMUM WEIGHT IN POUNDS breakpoints: 'Any Quantity' (under 1000), 1000, 2000, 5000, 8000, 12000, 16000 - each a single minimum-weight column, NOT a closed [min,max] band. Between each weight column the tariff prints a 'B.P.' (Break Point) column. Header reads 'MILES NOT OVER/OVER ... BREAK ANY POINT QTY lbs. 1000 B.P. 2000 B.P. 5000 B.P. 8000 B.P. 12000 B.P. 16000'. First data row (0-10 mi): AnyQty 114.49 | BP 607 | 1000:69.44 | BP 1489 | 2000:51.69 | BP 4939 | 5000:51.05 | BP 7696 | 8000:49.11 | BP 11639 | 12000:47.63 | BP 15789 | 16000:47.00.
- **Citation:** Item 310, PDF p56 (PNG p-60 / hi-60); concluded p57 (PNG p-61)
- **Fix (v0.2):** Rewrite the rate_item310 schema to model the actual tariff grid: one row per mileage bracket carrying seven rate columns keyed by MINIMUM-WEIGHT breakpoint (any_qty<1000, 1000, 2000, 5000, 8000, 12000, 16000) plus the published Break-Point value after each weight column. Drop weight_group_max_lb (there is no upper bound per group - weights >=16000 use the 16000 column). Delete the fabricated example rows ('2000,2999,...','8000,9999,301,350') - those weight bands and mileage edges do not exist in MAX4.

### 13. [wrong] Item 310 mileage brackets are uniform 50-mile bands (spec example uses 100-150, 151-200, 301-350)
- **Spec says:** rate-schemas.md example rows imply uniform brackets like 100-150,151-200,...,301-350; data model uses generic mile_bracket_min,mile_bracket_max.
- **2026 tariff says:** Brackets are NON-uniform and OVER/NOT-OVER (open-low, closed-high), not min-max inclusive: 0-10,10-20,...,90-100 (10-mi steps); 100-120,120-140,140-160,160-180,180-200 (20-mi steps); 200-225,225-250,250-275,275-300,300-325,325-350,...,475-500 (25-mi steps); 500-550,550-600,...,800-850 (50-mi steps); then 'ADD FOR EACH 50 MILES OR FRACTION THEREOF OVER 850 MILES' with per-column add-on amounts (e.g., +1.95 for AnyQty, +1.79 for 1000/2000/5000, +1.58 for 8000, +1.21 for 12000/16000).
- **Citation:** Item 310, PDF p56 (PNG p-60 / hi-60)
- **Fix (v0.2):** Model brackets as variable-width OVER/NOT-OVER bands exactly as printed (boundary belongs to the higher bracket: '100 miles or less' vs 'in excess of 100'). Importer must store the per-weight-column 'ADD per 50 mi over 850' tail so distances >850 mi compute as base(800-850) + ceil((miles-850)/50) x add. The spec/importer 'no gaps/overlaps' check must use these real edges, not 50-mi assumptions.

### 14. [wrong] Default liability when no value is declared is Actual Cash Value up to $20,000
- **Spec says:** SPEC line 158: 'Default liability if no value declared: Actual Cash Value up to $20,000 (we instead default the UI to Released; see §9).' §9 defaults the quote and price to Released ($0).
- **2026 tariff says:** Item 136 ¶2: 'Unless the shipper expressly declares a value other than $20,000 ... mover's maximum liability ... shall be up to $20,000 of actual cash value.' ¶6: protection 'defaults to Actual Cash Value up to $20,000 because no value is declared.' Item 128 NOTE 3 mandates a printed NOTICE that coverage is limited to ACV up to $20,000 unless the shipper hand-writes another value.
- **Citation:** Item 136 ¶2 & ¶6 (PDF p42-43); Item 128 NOTE 3 (PDF p39)
- **Fix (v0.2):** The tariff's NO-DECLARATION default is ACV up to $20,000, NOT Released. A UI that silently books a no-declaration shipment as 'Released, $0' contradicts the mandated coverage and the required NOTICE. v0.2 must: (a) treat the legal default as ACV/$20,000; (b) print the exact Item 128 NOTE 3 NOTICE verbatim on the Agreement; (c) require the shipper to affirmatively select/initial Released (or hand-write a value) rather than pre-booking $0 coverage. Pre-selecting Released in the UI is acceptable ONLY if the shipper still acknowledges/initials it, which spec §16 line 286 gestures at but §9 undercuts.

### 15. [wrong] Charge basis for flight/long-carry = which weight? (Item 140 Note 3)
- **Spec says:** spec §6 Step 5 line 132 and §10 line 213: '$1.75 / 100 lb x chargeable_weight'; worked example line 314: '$1.75/100 lb x 84' (84 = whole-shipment chargeable cwt of 8,400 lb); acceptance test line 332 'per occurrence per leg'. The spec multiplies by the full shipment chargeable_weight.
- **2026 tariff says:** Item 140 NOTE 3: 'Charges shall be based upon the actual weight of the article(s) for which flight or long carry service is provided.' i.e. NOT the whole-shipment / chargeable weight, but only the weight of the specific article(s) actually carried up the flight or on the long carry. Verified in layout text and PNG p-45.
- **Citation:** Item 140 NOTE 3, PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Replace 'chargeable_weight' as the multiplier with a per-occurrence 'articles_carried_weight_lb' input captured per flight/long-carry occurrence per leg. Add a quote_accessorial field for the actual article weight carried. Fix worked example (line 314): the 84 cwt is the whole shipment, which over-charges and is non-compliant. Engine Step 5 must NOT use chargeable_weight for flight/long-carry.

### 16. [wrong] Discount lever applicability to flight/long-carry charges (Item 24 NOTE)
- **Spec says:** spec §6 Step 7 line 139: 'regulated_subtotal = line_haul + packing_labor + flight/long-carry + valuation'; line 140 'discount applies to regulated charges'; §11 line 226 discount 'Applies to the regulated subtotal'. Flight/long-carry is INSIDE the discountable regulated subtotal.
- **2026 tariff says:** Item 24 NOTE: the para-1 allowance to 'quote and assess levels of rates lower than these published maximum fixed rates' SHALL NOT apply to '- Note 3 of Item 140 (Flight and Long Carry Rates).' So flight/long-carry charges may NOT be discounted below the published max. Verified in layout text (lines 565-573).
- **Citation:** Item 24 NOTE (bullet 'Note 3 of Item 140'), PDF p10 (printed p10 area); cross-ref Item 140 Note 3 PDF p45
- **Fix (v0.2):** Remove flight/long-carry (and elevator) from the discountable base. Move it out of the discount-eligible 'regulated_subtotal' so discount_cents is computed on line_haul + packing_labor + valuation only. Flight/long-carry must always bill at the Item 140 max. (Per Item 24 NOTE, Item 32 and Item 160 para1/Note2 are also non-discountable — but those are out of this category's scope.)

### 17. [wrong] Shuttle service is a free-form SVM CONFIG flat (or per-cwt) fee with no tariff cap
- **Spec says:** SPEC §10: 'Shuttle (CONFIG): ... Flat or per-cwt per config, per leg.' config: shuttle {enabled:true, basis:'flat', default_rate_cents:null}. §6 line 133 computes it as 'CONFIG rate × quantity (flat or per_cwt per config)'. §6 line 139 regulated_subtotal = line_haul + packing_labor + flight/long-carry + valuation — shuttle is EXCLUDED from the tariff-capped pieces. §7 line 173: shuttle fee = 'SVM to supply ... default to tariff max where one exists.'
- **2026 tariff says:** Item 184(3): 'Such service shall be provided at rates no higher than those in Item 320 and shall be in addition to all other transportation or accessorial charges.' The maximum basis is HOURLY (Item 320 hourly rates), not a flat fee. There IS a tariff maximum and shuttle is a regulated charge.
- **Citation:** Item 184 (Shuttle Service), PDF p54-55 (printed p50); confirmed on rendered PNG p-54
- **Fix (v0.2):** Reclassify shuttle from free-form CONFIG to a tariff-regulated charge. Set unit_basis to 'hourly' with the cap = Item 320 hourly rate × hours (× crew size per Item 320 structure). Include shuttle in regulated_subtotal so golden rule #1 caps it at the Item 320 max. SVM's per-leg flat default must be hard-capped at the computed Item 320 hourly maximum, never billed above it. Cite Item 184(3) + Item 320.

### 18. [wrong] Extra stop (split pickup/delivery/combination) is a free-form flat CONFIG fee per additional stop
- **Spec says:** SPEC §10: 'Extra stop (CONFIG): per additional pickup or delivery stop beyond the first origin and first destination.' config: extra_stop {enabled:true, basis:'flat', default_rate_cents:null}. §6 line 133: 'extra_stop ... CONFIG rate × quantity (flat ...).' §13 line 301: 'each extra stop is an accessorial; mileage remains origin→final destination via Table 8.' Excluded from regulated_subtotal (§6 line 139).
- **2026 tariff says:** Item 148 §2(b)(2) (distance rates): 'An additional charge of not more than $134.45 for each stop to load between first point of origin and point destination.' Item 152 §2(b)(2): 'not more than $134.45 each stop to unload.' Item 156 §3(b)(2): 'not more than $134.45 for each stop to load or unload.' There IS a flat per-stop maximum = $134.45 (distance-rate basis).
- **Citation:** Item 148 §2(b)(2) / Item 152 §2(b)(2) / Item 156 §3(b)(2), PDF p46-48 (printed p42-43); $134.45 confirmed on rendered PNG p-46
- **Fix (v0.2):** Reclassify extra-stop from free-form CONFIG to tariff-regulated. Seed default_rate_cents at the cap 13445 (=$134.45) per stop and hard-cap any SVM value at $134.45/stop under distance rates. Cite Item 148/152/156. Include extra-stop in regulated_subtotal so golden rule #1 enforces the cap. Note: the figure is a per-edition tariff number — store it as versioned data, not a constant.

### 19. [wrong] Bulky article fee is a free-form per-item CONFIG fee with an empty type list and no caps
- **Spec says:** SPEC §10: 'Bulky article fee (CONFIG): per flagged bulky item (e.g., safe, pool table, large statuary). Maintain a CONFIG list of bulky types and their fees.' config: bulky_fee {enabled:true, basis:'per_item', default_rate_cents:null, types:[]}. §6 line 133: 'bulky ... CONFIG rate × quantity.' Excluded from regulated_subtotal.
- **2026 tariff says:** Item 164 publishes a fixed MAXIMUM loading/unloading charge per enumerated article, e.g. Automobiles/trucks/vans $188.98 each; Motorcycles ≥250cc $120.60; Tractors/riding mowers ≥25hp $144.77, <25hp $96.38; Snowmobiles/golf carts $96.38; Trailers $108.42; Campers (unmounted or mounted) $274.28 each; Pianos/organs (any size) $122.65; Playhouses/sheds >100cf $180.70; Hot tubs/spas >100cf $180.70; Satellite dishes ≤4ft $96.38 / >4–8ft $144.77 / >8–12ft $213.96 / >12ft $334.55. 'the following MAXIMUM loading and unloading charges ... may be applied.'
- **Citation:** Item 164, PDF p49-52 (printed p45-47); rate grid read from rendered PNG p-50 and p-51
- **Fix (v0.2):** Reclassify bulky from free-form CONFIG to a tariff-regulated charge. Seed the Item 164 article table as versioned tariff data (each article + max $) and key quote_inventory_item.is_bulky to it. SVM per-item fees must hard-cap at the Item 164 maximum for that article (golden rule #1). The example items the spec lists (safe, pool table, statuary) are NOT in Item 164's enumerated list — Item 164 is a closed list of named articles; pool tables fall under Item 172 (disassembly, Item 320 hourly), not a bulky additive. Don't invent bulky fees for unlisted items. Include in regulated_subtotal.

### 20. [wrong] Accessorials shuttle/bulky/extra-stop are excluded from the MAX4 cap enforcement (regulated_subtotal)
- **Spec says:** §6 line 139: regulated_subtotal = line_haul + packing_labor + flight/long-carry + valuation. Shuttle, bulky, and extra-stop are computed as plain 'CONFIG rate × quantity' (line 133) and are NOT in the capped set. §11/§14 golden rule: 'Never allow a computed regulated charge above its MAX4 maximum' — but these three are not treated as regulated.
- **2026 tariff says:** Items 184, 164, and 148/152/156 each publish a MAXIMUM (Item 320 hourly for shuttle; per-article $ + weight additive for bulky; $134.45/stop + re-routed line-haul for split). Per Item 24 these are maximum fixed rates the mover may not exceed. They ARE regulated charges and must be capped.
- **Citation:** Item 24 (Levels of Rates) + Items 184/164/148/152/156; spec §6 lines 133/139
- **Fix (v0.2):** Move shuttle, bulky, and extra-stop into the regulated/capped path: add them to regulated_subtotal (or a parallel 'regulated_accessorials' bucket that is cap-enforced). Each must compute its Item-184/164/148-152-156 maximum and reject any SVM/CONFIG value above it. This is the core golden-rule-#1 violation: the spec currently lets SVM set these three above the tariff ceiling, producing potentially illegal prices.

### 21. [wrong] Failure to issue a proper Agreement forces charges down to 65% of maximum fixed rates (Item 28 para 3).
- **Spec says:** Spec section 2 (line 36) and section 15 (line 289): 'Failure to issue a proper Agreement forces charges down to 65% of maximum fixed rates (Item 28 para 3)' and 'the 65%-of-max penalty exists precisely for missing/defective Agreements.' Test 18.x treats it as a flat 65% floor.
- **2026 tariff says:** Item 28 para 3 is TWO-TIERED, not a flat 65%. If no Agreement per Item 128, or Agreement is missing (a) description of services or (b) rates quoted, then 65% of max applies ONLY to 'service not described or rates not quoted' (partial penalty). If the Agreement is missing (c) Not to Exceed Price, (d) shipper signature, or (e) mover signature, then ALL transportation and accessorial charges = 'the lowest of: (1) 65 percent of the maximum fixed rates...; (2) rates quoted in the Estimate; or (3) rates quoted in the Agreement' — which can be BELOW 65%. Plus EXCEPTION: a mover that advertises/regularly charges below 65% uses that lower rate level.
- **Citation:** Item 28 (Concluded) para 3 and (a)-(e); PDF p15 (printed p11), tariff-layout.txt lines 601-620.
- **Fix (v0.2):** Rewrite the 65% rule in section 2/section 15 to encode BOTH tiers: (i) missing (a)/(b) => 65%-of-max applies only to the undescribed/unquoted items (partial); (ii) missing (c) NTE, (d) shipper signature, or (e) mover signature => ALL charges = lowest of {65% of max, Estimate rates, Agreement rates}, with the advertised-lower-rate EXCEPTION. Tie the trigger to Item 128 para 1 (failure to DELIVER the Agreement timely, not merely 'issue' it). Update acceptance test 18.x accordingly.


---

## HIGH

### 22. [confirmed] 100-mile application boundary (Item 16): distance-rate basis floor
- **Spec says:** Spec §1/§2/§6: app handles '100 or more' / '100+' constructive miles; min_constructive_miles=100; blocks anything '< 100'; svm-config min_constructive_miles=100. Spec §2 'For shipments over 100 constructive miles charges MUST be on distance rates.'
- **2026 tariff says:** Item 16(1)(a): 'For transportation of shipments for distances of 100 miles or less, the distance rates (Item 310 or 390) OR hourly rates (Item 320) apply...' Item 16(1)(b): 'For the transportation of shipments for distances in excess of 100 miles, the distance rates (Item 310 or 390) shall apply, subject to Item 20.' Item 320 header confirms hourly applies '100 miles or less.' So exactly 100 mi = either basis; distance-only begins strictly >100.
- **Citation:** Item 16(1)(a)(b) PDF p9 (txt L528-534); Item 320 PDF p58 (txt L2742-2743)
- **Fix (v0.2):** Confirms brief: spec's '>=100' / '100 or more' floor is WRONG. A 100.0-mile move may still be hourly; distance-only is mandatory only for >100. Fix scope wording to 'more than 100 constructive miles' (strictly >100) for the distance-rate gate, and either out-scope exactly-100 or allow hourly there. Update svm-config and §15 guardrail accordingly.

### 23. [confirmed] A minimum declared value floor exists in Item 136 and must be confirmed
- **Spec says:** SPEC §9 line 203 / §20 line 367 / config line 37-38 (min_declared_value_per_lb_cents: null, _min_declared_source: 'Item 136 — confirm floor'): treats a tariff-mandated minimum declared value as an open item to confirm; interim formula max(declared, chargeable_weight_lb × $X/lb).
- **2026 tariff says:** Item 136 imposes NO mandatory minimum per-pound declared value. Item 128 NOTE 3 states: 'if the mover elects to apply a minimum per pound valuation level, the mover must so state' — i.e., a minimum is a MOVER ELECTION that must be disclosed, not a tariff requirement. Item 450 likewise requires each offered valuation option to be listed with the mover's charge and an initial space.
- **Citation:** Item 128 NOTE 3 (PDF p39); Item 136 ¶3 references Item 128 NOTE 3; Item 450 (PDF p78)
- **Fix (v0.2):** Resolve the OPEN-ITEM: there is NO tariff floor to look up. The minimum per-pound declared value is OPTIONAL and set BY SVM. If SVM elects one, it must be stated on the Agreement (Item 128 NOTE 3). v0.2 should reclassify min_declared_value_per_lb_cents from 'tariff value to confirm' to a CONFIG/SVM-set business value, and require it (if non-null) to print on the Agreement. Remove the '_min_declared_source: Item 136 — confirm floor' framing.

### 24. [confirmed] The valuation declaration must be captured and signed by the shipper on the Agreement
- **Spec says:** SPEC line 35, 204, 254, §16 line 286: valuation selection 'must be captured and signed on the Agreement'; signature line is a 'hard requirement (Item 136 / Item 128).' Spec does not include the verbatim mandated NOTICE wording.
- **2026 tariff says:** Item 136 ¶3: declared value 'must be entered on the Agreement for Moving Services and signed by the shipper, as described in Item 128, NOTE 3.' Item 128 NOTE 3 prescribes EXACT wording under heading 'VALUATION DECLARATION': 'NOTICE: Coverage for loss and damage is limited to the Actual Cash Value of losses up to the amount of $20,000 unless the shipper signing this contract inserts in the space below, in his or her own handwriting, another value. You may be charged for coverage provided other than $.60 per pound per article. Shipper hereby releases the entire shipment to a value not exceeding $____ (To be completed by shipper signing below.)' Plus: each offered option listed with the mover's charge and an initial space (Item 450).
- **Citation:** Item 136 ¶3 (PDF p42); Item 128 NOTE 3 (PDF p39); Item 450 (PDF p78)
- **Fix (v0.2):** The signature requirement is correct, but the spec must embed the EXACT Item 128 NOTE 3 NOTICE text verbatim (it is statutorily prescribed, not paraphrasable) under a 'VALUATION DECLARATION' heading, include the handwritten declared-value blank, and list each offered tier with its per-$100 charge and a shipper-initial space (Item 450). Add this verbatim block to the Agreement template spec (§14).

### 25. [missing-in-spec] Spec ignores the published Break Point (B.P.) column; weight-break is computed only in code
- **Spec says:** rate-schemas.md: 'The data file just supplies cells; the optimization lives in code.' Spec §6 Step 3 computes min over actual group and higher groups of chargeable_weight_g x R(g). No Break Point is ingested or stored.
- **2026 tariff says:** Item 310 PUBLISHES a Break Point per cell and defines it: NOTE 1 - 'When shipment charges based on actual weight exceed those based on a greater minimum weight, the latter shall apply. Break Point indicates the weight at which a lower charge results by using the minimum weight and applicable rate at next higher minimum weight bracket.' The B.P. is an authoritative datum, not a derived convenience.
- **Citation:** Item 310 NOTE 1, PDF p57 (PNG p-61); B.P. columns on p56 (PNG p-60)
- **Fix (v0.2):** Ingest the published Break Point alongside each rate column and use it (or validate the code's computed crossover against it) so the engine reproduces the tariff exactly. The data model must add a break_point field per weight column; the importer acceptance test should assert code-derived crossover == published B.P.

### 26. [missing-in-spec] Item 24 NOTE - non-reducible provisions (discount lever cannot lower these)
- **Spec says:** Spec §2/§7/§11/§15: published rates are maximums, SVM may quote at/below; discount only subtracts; discount_applies_to_svm_fees=false, discount_applies_to_materials=false. Spec does NOT enumerate the Item 24 NOTE carve-outs.
- **2026 tariff says:** Item 24 ¶1: rates are maximum fixed rates; movers may quote LOWER. NOTE: that allowance 'shall NOT apply' to: Item 32 (Disposition of Fractions); Item 36 ¶5 (computation of time, hourly); Item 88 ¶9(e) (Relationships with the Public); Item 92 (Claims for Loss and Damage); Item 100 ¶4 (Delays in Pickup/Delivery); Item 140 NOTE 3 (Flight and Long Carry); Item 160 ¶1 & NOTE 2 (Storage-In-Transit). So flight/long-carry charges (Item 140 Note 3 basis) are NON-discountable.
- **Citation:** Item 24 ¶1 + NOTE PDF p10 (txt L562-574)
- **Fix (v0.2):** Add the Item 24 NOTE carve-out list to §2/§11. The discount engine must EXCLUDE flight/long-carry (Item 140 Note 3) and any Item 32 fraction-disposition result from the discountable base - confirming the brief: the discount lever may NOT reduce flight/long-carry charges. Spec §6 Step 7 currently folds 'flight/long-carry' into regulated_subtotal that the discount multiplies - that is non-compliant and must be fixed.

### 27. [missing-in-spec] Piece-basis flight/long-carry rate (Item 330 shipments)
- **Spec says:** Not modeled. Config accessorials only define per_100lb basis (flight_long_carry, elevator). quote_accessorial.unit_basis enumerates per_flight but no $6.54/piece rate is stored anywhere; rate-schemas doc has no Item 140 piece entry.
- **2026 tariff says:** Item 140 para 1: 'Piece under Item 330 ...... $6.54 per piece'. Verified in layout text and PNG p-45.
- **Citation:** Item 140 para 1, PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Add a piece-basis flight/long-carry rate of $6.54/piece for shipments rated under Item 330 (Distance Piece Rates). The basis used must match the shipment's rate basis (hourly vs piece vs distance). Add config accessorials.flight_long_carry.piece_rate_cents=654. Currently out of scope only if SVM never rates by piece — but the spec should state which basis applies.

### 28. [missing-in-spec] Shuttle has no published flat maximum; 'default to tariff max where one exists' implies SVM thinks none exists
- **Spec says:** §7 line 173: shuttle/piano/bulky/extra-stop = 'SVM to supply (until then, default to tariff max where one exists, else a placeholder flagged in-app).' The phrasing treats a tariff max as merely possible, not mandatory.
- **2026 tariff says:** Item 184(3) ties shuttle to Item 320 hourly rates as the ceiling. A maximum DOES exist for shuttle (hourly via Item 320). There is no flat-fee maximum because the tariff regulates it hourly.
- **Citation:** Item 184 (Shuttle Service), PDF p55 (printed p50)
- **Fix (v0.2):** State explicitly in §7/§10 that shuttle's tariff max exists and is hourly (Item 320). Remove the 'else a placeholder' fallback for shuttle — there is a real ceiling. The app must compute the Item 320 hourly cap and reject any SVM flat fee that exceeds it.

### 29. [missing-in-spec] Pack/unpack labor per container is a single per-container rate (no territory distinction)
- **Spec says:** Spec data model line 94: packing_rates(container_type, pack_rate_cents, unpack_rate_cents, unit). rate-schemas §3 CSV header line 45: 'container_type,pack_rate_cents,unpack_rate_cents,source' — ONE pack and ONE unpack value per container. No Territory field anywhere in spec/config/CSVs (grep for 'territor' returns NONE).
- **2026 tariff says:** Item 340 para 1 splits 'Packing Charges' into Territory A and B columns, and 'Unpacking Charges' into A and B. e.g. Dish-pack: packing 51.41 (A) / 45.19 (B), unpacking 21.51 (A) / 19.21 (B); 3 cu.ft carton: packing 18.71 (A) / 16.60 (B), unpacking 7.76 (A) / 6.89 (B). Note 3: 'The applicable rate shall be the rate for the territory in which the service is provided.' Note 2: territories per Item 210.
- **Citation:** Item 340 para 1 + Notes 2-3, PDF p.64-65 (printed p.60-61) — hi-64.png / hi-65.png
- **Fix (v0.2):** Add Territory to the data model. packing_rates needs pack_rate_a_cents/pack_rate_b_cents and unpack_rate_a_cents/unpack_rate_b_cents (or a territory key column). Add origin_territory and dest_territory to the quote (derived from county via Item 210). Per Note 3, select PACKING labor by ORIGIN territory and UNPACKING labor by DESTINATION territory. Using the wrong territory (e.g. B-priced labor charged at A rate) over-bills above the Item 340 maximum, so flag this as a compliance/over-max risk.

### 30. [missing-in-spec] Item 340 hourly per-person packing/unpacking labor rates (straight / time-and-a-half / double time, by territory)
- **Spec says:** Not present. config.packing has charge_pack_labor/charge_unpack_labor booleans and labor_rates_source='Item 340' but no hourly rate values. Spec §6 Step 4 charges pack/unpack labor 'per packed container' only; no hourly-labor option is modeled. No straight/1.5x/2x rates anywhere.
- **2026 tariff says:** Item 340 para 2 'RATES PER HOUR PER PERSON' by Territory: (a) STRAIGHT TIME A $93.67 / B $82.56; (b) TIME-AND-A-HALF A $138.04 / B $121.07; (c) DOUBLE TIME A $181.98 / B $159.74. Note 4: these hourly rates may be used in lieu of per-container rates if mover and shipper agree before service, subject to Items 28 & 128; the Agreement for Moving Services determines the applicable max rate.
- **Citation:** Item 340 para 2 + Note 4, PDF p.65 (printed p.61) — hi-65.png
- **Fix (v0.2):** Add an hourly packing-labor option to the model and config: store the six rates (straight/1.5x/2x × A/B) as Tier A embedded values, and add a per-quote election (unit vs hourly) per Note 4. The hourly basis is a legitimate, in-scope pricing path the current spec cannot represent.

### 31. [missing-in-spec] San Jose (SVM HQ) and typical CA destinations fall in defined territories (Item 200/210/230)
- **Spec says:** Spec/config never reference Territory or Items 200/210/230 (grep 'territor' = NONE; grep 'Item 210' = NONE). No origin/destination territory concept exists.
- **2026 tariff says:** Item 210 (Descriptions of Territories): Territory A = City & County of San Francisco and Counties of Alameda, Contra Costa, Marin, Monterey, San Mateo, SANTA CLARA, Santa Cruz and Sonoma. Territory B = all counties in the state not in Territory A. San Jose is in Santa Clara County → Territory A. Typical 100+-mile CA destinations (Los Angeles, San Diego, Sacramento, Fresno) are NOT in the Item 210 list → Territory B. Item 200 = application of territorial descriptions; Item 230 = map.
- **Citation:** Item 210, PDF p.57 (printed p.52); map Item 230 PDF p.58 (printed p.53)
- **Fix (v0.2):** Add a county→territory resolver (Item 210) and store origin_territory/dest_territory on the quote. For SVM's typical move (San Jose origin = Territory A; destinations LA/SD/Sacramento/Fresno = Territory B), packing labor at origin uses Territory A rates and unpacking labor at destination uses Territory B rates (Item 340 Note 3 — rate = territory where service is provided). This is the structural backbone the Territory A/B Item 340 labor split depends on.

### 32. [missing-in-spec] Required generated MAX4 paperwork is exactly four documents: Agreement, Estimate, Change Order, Shipping Order/BOL.
- **Spec says:** Spec section 13.B lists four documents to generate: (1) Agreement (Item 128/450), (2) Estimated Cost of Services (Item 108/420), (3) Change Order (Item 120/440), (4) Shipping Order/Freight Bill (Item 132/460). Item 130 'Important Notice About Your Move' (form Item 465) is never listed as a generated document.
- **2026 tariff says:** Item 130 requires a SEPARATE signed 'Important Notice About Your Move' (form in Item 465) containing a Not to Exceed amount, provided at least 3 days before the move; if requested on short notice, 'in no event may the mover commence any services until the consignor has signed and received a signed copy of the notice.' 'Any waiver of the requirements of this item is void and unenforceable.' Form Item 465 carries the consumer NTE notice, the right to refuse at no charge, the no-hostage release rule, and the BHGS phone (833) 488-2327.
- **Citation:** Item 130 PDF p40 (printed p36), tariff-layout.txt lines 1822-1858; Item 465 form PDF p87, lines 4106-4149.
- **Fix (v0.2):** Add the Item 130 / Item 465 'Important Notice About Your Move' as a fifth required generated document. Its NTE must be non-preprinted, just/reasonable, and signed by the consignor BEFORE any service begins (the waiver of this notice is void). The app must block 'commence move' until this notice is signed and a signed copy returned to the consignor. Retain 3 years from signature (Item 130).

### 33. [missing-in-spec] The Estimate (Item 108/420) is generated standalone; the spec does not generate its required companion forms.
- **Spec says:** Spec section 13.B.2 generates only the 'Estimated Cost of Services (Item 108/420).' The 'Basis for Mover's Estimated Cost of Services' (Item 112/Item 400) and the 'Table of Measurements and Estimate' (Item 116/Item 410) are referenced only as a cube-catalog reconciliation source (section 4 line 62, section 8 line 186), never as required generated forms.
- **2026 tariff says:** Item 108 1(c)(1): the estimator shall 'Base the Estimate on information contained in the Basis for Mover's Estimated Cost of Services as indicated in Items 112 and 400.' Item 112 para 1: the mover SHALL complete the 'Basis for Estimate' only after visual inspection, signed by the shipper, duplicate given to shipper (form Item 400, retained 3 years). Item 116: the mover SHALL complete the Table of Measurements and Estimate (form Item 410) whenever rates are weight/cube-based; total cubic feet x 7 = approximate weight; Item 410 is printed on the reverse of Item 400. So an Estimate legally requires the Basis (400) AND the Table of Measurements (410) as companion documents.
- **Citation:** Item 108 1(c)(1) PDF p31 line 1415; Item 112 paras 1-2 PDF p33 lines 1506-1515; Item 116 paras 1-4 PDF p34 lines 1531-1543; Item 400 form PDF p70 line 3074; Item 410 form PDF p71-75 line 3143.
- **Fix (v0.2):** Add two required companion forms to the document generator whenever an Estimate is issued: (1) 'Basis for Mover's Estimated Cost of Services' (Item 112 / form Item 400) — signed by shipper, duplicate to shipper, includes the booklet-receipt acknowledgment and valuation-options table; (2) 'Table of Measurements and Estimate' (Item 116 / form Item 410) — the itemized cube sheet (x7 => weight), printed on the reverse of Item 400. Both retained 3 years. The spec already builds the cube inventory (section 8); render it as Item 410 rather than treating Item 410 only as a reconciliation reference.

### 34. [stale] Computation of distances basis (Item 40) - constructive miles from 'Distance Table 8'
- **Spec says:** Spec §2/§4/§16 + rate-schemas: mileage MUST be constructive miles from 'Distance Table 8' (a versioned ingested CSV distance_table8); Google driving miles 'context only, NOT the price basis'; treats Table 8 as the sole authoritative distance source. Brief also asserts 'Distance Table 8 is genuinely external, never estimate a mileage.'
- **2026 tariff says:** Item 40: 'Distances...shall be the shortest mileage via any public highway route, computed in accordance with the method provided in the Distance Table OR by using a global positioning system (GPS) navigation tool or platform.' Item 310 NOTE 2: 'For computation of distances, see Item 40.' The 2026 tariff explicitly authorizes a GPS navigation tool as an alternative basis, and names 'the Distance Table' (singular) - not 'Distance Table 8'.
- **Citation:** Item 40 PDF p17 (txt L708-714); Item 310 NOTE 2 PDF p57 (txt L2713)
- **Fix (v0.2):** Update §2/§4/§16: distance basis is shortest highway mileage via the Distance Table OR a GPS navigation tool/platform (Item 40, 2026). The spec's hard rule 'Google driving miles are NOT the price basis' is no longer correct - a GPS/Google-derived shortest-highway mileage is now an ALLOWED basis. Rename 'Distance Table 8' to 'the Distance Table' (the '8' is not in Item 40). Reconsider whether ingesting a static Distance Table CSV is even required, given GPS is permitted; at minimum stop blocking on missing Table pairs when a compliant GPS distance is available.

### 35. [stale] Tariff edition label
- **Spec says:** Spec header 'MAX4...January 1, 2025 edition'; svm-config tariff_edition_label 'MAX4 effective 2025-01-01'; rate-schemas '2025-01-01'.
- **2026 tariff says:** Every page footer: 'MAXIMUM RATE TARIFF 4 — Effective January 1, 2026.'
- **Citation:** Page footers throughout (e.g., PDF p9/p10/p56/p57)
- **Fix (v0.2):** Update all edition labels to 'MAX4 Effective January 1, 2026' (spec header, svm-config.tariff_edition_label, rate-schemas effective dates, importer tariff_edition stamp). Re-ingest Item 310 from the 2026 table - every rate cell changed vs 2025.

### 36. [stale] Long-carry billing unit / 50-ft increment structure (Item 140 Note 2)
- **Spec says:** spec §10 line 213: 'Long carry = carry beyond the tariff free distance (approx 75 ft; confirm in Item 140, §20)'; billed as '$1.75/100 lb x chargeable_weight per occurrence per leg'. §20 open-items line 368 lists 'Item 140 exact long-carry distance threshold (approx 75 ft) and counting rules' as unconfirmed. The spec treats long carry as a single flat occurrence and is unsure of the unit.
- **2026 tariff says:** Item 140 NOTE 2: 'LONG CARRY means each 50 feet or portion thereof carried in excess of the first 75 feet when, through no fault of the mover, its unit of equipment cannot be placed 75 feet or closer...'. So: first 75 ft free; then EACH 50 ft (or portion) is one chargeable long-carry unit at $2.26/100 lb. Verified in layout text and PNG p-45.
- **Citation:** Item 140 NOTE 2, PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Resolve the §20 open item with the confirmed values: free first 75 ft, then ceil((carry_distance_ft - 75)/50) chargeable long-carry units, each unit = $2.26/100 lb x (actual weight of articles carried per Note 3). The 'approx 75 ft' should be exactly 75 ft. Replace flat 'per occurrence' with a distance-driven unit count.

### 37. [wrong] min_weight_lb = 5000 is a tariff-set minimum shipment/charge weight
- **Spec says:** Spec §5/§6/§7/§18 and svm-config: min_weight_lb default 5000; chargeable_weight = max(estimated, 5000); listed in §7 Tier A near verified tariff values; acceptance test 3 treats 5000 as a floor. (Spec does label it CONFIG in §7 CONFIG block, but mixes it into Tier A 'verified' framing and the worked example.)
- **2026 tariff says:** No tariff minimum shipment weight or 5,000-lb minimum charge exists in MAX4. Item 310's smallest column is 'Any Quantity (under 1000 lb)'; the table itself prices sub-1000-lb loads. The only '5,000 pounds' in scope-relevant text is Item 80 ¶5 reweigh tolerance (>100 lb diff on shipments <=5,000 lb vs >2% above 5,000 lb) - a weighing-accuracy rule, NOT a charging minimum. Item 116 ¶4 only sets cube x 7 = approximate weight; no floor.
- **Citation:** Item 310 'Any Quantity' column PDF p56 (PNG p-60); Item 80 ¶5 PDF p15 (txt L851-859); Item 116 ¶4 PDF p34 (txt L1542-1543)
- **Fix (v0.2):** Reclassify min_weight_lb=5000 as PURELY SVM business CONFIG (a quoting-policy minimum), not a tariff value. Remove it from §7 'Tier A - verified fixed rates'. Add a note that the tariff prices any weight down to 'Any Quantity'; the 5,000 floor is SVM's own and must never be presented to the customer as a regulatory requirement.

### 38. [wrong] Declared value rounds up to the next $100 per the 'or fraction thereof' rule, sourced to Item 32
- **Spec says:** Config rounding block lines 31-33: declared_value_round_up_dollars = 100, _source = 'Item 32 Disposition of Fractions — confirm exact rule.' SPEC §11 line 229 attributes declared-value rounding to Item 32. SPEC §9 line 202 correctly references the 'or fraction thereof' rule.
- **2026 tariff says:** The authority for rounding declared value up to the next $100 is Item 136 itself: every valuation rate is stated 'for each $100 (or fraction thereof) of the declared value' (¶4, ¶6, ¶7, ¶8). Item 32 'Disposition of Fractions' governs ONLY 'a rate based on a percentage of another rate' (round to whole cent, halves up) — it does not define declared-value rounding.
- **Citation:** Item 136 ¶4/¶6/¶7 'or fraction thereof' (PDF p42-43); Item 32 (PDF p15)
- **Fix (v0.2):** The ceil(declared/$100) math is correct, but the citation is wrong. In config and §11, change the source of declared_value_round_up_dollars from 'Item 32' to 'Item 136 ((or fraction thereof))'. Item 32 should be cited only for percentage-of-rate fractions, not declared value or weight.

### 39. [wrong] Under split pickup/delivery the line-haul mileage is unchanged (origin→final destination)
- **Spec says:** §13 line 301: 'each extra stop is an accessorial; mileage remains origin→final destination via Table 8.'
- **2026 tariff says:** Item 148 §2(b)(1): distance-rate charge is on total composite weight 'to point of destination from the point of origin which produces the SHORTEST DISTANCE VIA the other point or points of origin.' Item 152 §2(b)(1) and Item 156 §3(b)(1) likewise route the line-haul through the intermediate stop(s) via the shortest path. The line-haul distance is NOT plain origin→final-destination; it must be recomputed through every stop.
- **Citation:** Item 148 §2(b)(1) / Item 152 §2(b)(1) / Item 156 §3(b)(1), PDF p46-48 (printed p42-43)
- **Fix (v0.2):** Correct §13: for split pickup/delivery the chargeable distance is the shortest route THROUGH the intermediate stop(s), not direct origin→final destination, PLUS the $134.45/stop additive. Update the mileage logic and Table-8 lookup accordingly. (Two-part charge: re-routed line-haul + per-stop additive.)

### 40. [wrong] Item 340 (packing/unpacking & container rates) is a Tier C bulk dataset to ingest later, not yet obtained / placeholders until imported
- **Spec says:** Spec §4 line 62: reconcile against Item 340 'when those pages are obtained'; §7 lines 164-167 lists Item 340 packing/unpacking labor rates and carton max prices under 'Tier C — ingest (placeholders until imported)'; OPEN-ITEMS line 17 lists Item 340 as outstanding. config: packing.labor_rates_source='Item 340' with no values; rate-schemas §3 has <cents> placeholders.
- **2026 tariff says:** Item 340 is fully published in MAX4 2026 right in the tariff PDF: para 1 'RATES PER CONTAINER (In Dollars Per Unit)' and para 2 'RATES PER HOUR PER PERSON', with all dollar figures printed. e.g. Dish-pack container 60.35; 3 cu.ft. carton 22.48; wardrobe carton 33.23; hourly straight A $93.67 / B $82.56.
- **Citation:** Item 340, PDF p.64-66 (printed p.60-62) — hi-64.png / hi-65.png / hi-66.png
- **Fix (v0.2):** Reclassify Item 340 from Tier C to Tier A (verified fixed rates, embed as-is). The rates are not an external bulk dataset (unlike Item 310 / Distance Table 8) — they are a small fixed table fully present in the tariff. Embed the verified 2026 container and hourly numbers directly in packing_rates / materials_catalog, with tariff_edition='2026-01-01', and remove the 'placeholders until imported' framing.

### 41. [wrong] Loose packing supplies (paper, tape, bubble wrap, shrink wrap, mattress bag) are separately-priced taxable materials sourced from Item 340
- **Spec says:** materials-catalog.csv lists 'Packing paper (newsprint bundle)', 'Bubble wrap', 'Packing tape', 'Stretch/shrink wrap', 'Mattress bag' each with source 'Item 340 (SOURCE)', taxable=true, and a max_price_cents column to be filled from Item 340. Spec §6 Step 4 bills materials as Σ(quantity × unit_price).
- **2026 tariff says:** Item 340 Note 6: 'Container charges in paragraph 1 include all materials used in the packing and sealing of the container indicated. No additional charge shall be made for such materials including dividers, paper, tape and labels.' Item 340 publishes NO standalone maximum price for any loose supply; para 2 hourly basis is '...plus all materials used on the job' (per the Item 410/420 form), i.e. loose materials are not a fixed-rate line in Item 340.
- **Citation:** Item 340 Note 6, PDF p.65 (printed p.61) — hi-65.png
- **Fix (v0.2):** Two fixes: (1) When a per-container Item 340 charge is billed, do NOT also charge paper/tape/dividers/labels — they are included in the container rate (Note 6); billing both exceeds the Item 340 maximum (overcharge). (2) Remove the 'Item 340 (SOURCE)' attribution from loose supplies — Item 340 sets no max price for them, so max_price_cents cannot be sourced from Item 340. Mark loose-supply prices as CONFIG (SVM-set, market price), not tariff-capped, and gate them so they only apply on the hourly basis (where materials are billed separately) or when no per-container charge covers them.

### 42. [wrong] The Agreement (Item 128) required fields are: carrier identity + Cal T number, shipper/consignee, origin/destination, services, rates quoted, NTE, valuation declaration with signature, delivery window, statutory notices.
- **Spec says:** Spec section 13.B.1 (line 254): lists 'carrier identity + Cal T number, shipper/consignee, origin/destination, services, rates quoted, Not-to-Exceed price, valuation declaration with signature line, preferred/expected delivery window, required statutory notices.'
- **2026 tariff says:** Item 128 para 2 enumerates (a)-(r): (a) name/address/CAL-T of mover; (b) date move is tendered; (c) date Agreement issued; (d) date/time of pickup requested; (e) names of shippers and consignees; (f) name/address/phone of party to be notified; (g) description of notification and delivery arrangements; (h) points of origin and destination; (i) description of shipment in sufficient detail; (j) description of transportation/accessorial services INCLUDING number of helpers and packers; (k) rates and charges INCLUDING any minimums (hours, weights, packing materials, per-pound valuation); (l) valuation of shipment; (m) signatures of mover and shipper; (n) name/address/phone of Item 100 notification person; (o) preferred delivery date/period; (p) whether payment is cash/check/credit card; (q) NTE Price; (r) a Consumer Protections and/or Waivers section per Item 450 with: (1) booklet-receipt statement shipper must initial ('I have received the booklet'), (2) explanation of all loss/damage protection options + valuation declaration, (3) 3-day-delivery obligation explanation, (4) shipper signature. Plus NOTE 2 IMPORTANT NOTICE block, NOTE 3 VALUATION DECLARATION ($20,000 ACV default / $0.60/lb language), NOTE 4 non-exemption statement, NOTE 5 (NTE may not be preprinted).
- **Citation:** Item 128 para 2 (a)-(r) and NOTES 1-5; PDF p35-39 (printed p31-35), tariff-layout.txt lines 1664-1813.
- **Fix (v0.2):** Replace the section-13.B.1 field list with the full Item 128 (a)-(r) set. Spec OMITS: date move tendered (b), date issued (c), date/time pickup requested (d), notification party (f)/(g)/(n), helpers/packers count (j), minimums in rates (k), payment method (p), and critically the entire (r) Consumer Protections/Waivers section (booklet-receipt initial with $100 penalty, loss/damage options, 3-day waiver flow, shipper signature). Add NOTE 2/3/4/5 statements verbatim. Also fix section-13 language: Item 128 para 1 requires the Agreement be DELIVERED / in shipper's hands no less than 3 days before the move (EXCEPTIONS 1-2 govern short-notice and waiver), not merely 'issued.'

### 43. [wrong] Shipping Order / Freight Bill required fields are verbatim from Item 132.
- **Spec says:** Spec section 13.B.4 (line 257): 'required fields verbatim from Item 132: carrier name/address/T number; all carrier names used; date issued; shipper & consignee; origin & destination; description of shipment; unit of measurement (actual & minimum weight); helpers/packers count; rates & charges; accessorial services and each charge; carrier signature; notification contact; preferred delivery date/window; Not-to-Exceed price; total charges on Estimate and Change Order; credit-card-payment flag; the PLEASE INSPECT YOUR GOODS PROMPTLY claims notice.'
- **2026 tariff says:** Item 132 para 1 (a)-(u): (a) name/address/T-number of mover; (b) all real and fictitious names used; (c) identification of which mover name performed the transportation; (d) address of mover's principal place of business and local offices; (e) Date Issued; (f) name of each shipper and consignee; (g) points of origin and destination; (h) description of shipment; (i) unit of measurement (actual time & min hours, OR actual pieces, OR actual & minimum weight, OR minimum per-pound valuations); (j) deductions in time and reasons; (k) number of helpers and packers; (l) rates and charges assessed; (m) description of accessorial services and each separate charge; (n) signature of mover or agent; (o) such other info needed to determine the rate/charge; (p) Item 100 notification name/address/phone; (q) preferred delivery date/period; (r) Not to Exceed Price; (s) Total charges on Estimated Cost of Services and Change Order; (t) whether payment is by credit card; (u) the 'PLEASE INSPECT YOUR GOODS PROMPTLY' notice. The spec list is mostly correct but OMITS several Item-132 fields.
- **Citation:** Item 132 para 1 (a)-(u); PDF p41 (printed p37), tariff-layout.txt lines 1870-1911.
- **Fix (v0.2):** Add the Item 132 fields the spec omits: (b) all fictitious/DBA names used, (c) which name performed THIS transportation, (d) principal place of business + local office addresses, (j) deductions in time and reasons (matters for hourly legs), and (o) catch-all 'other information necessary to determine the rate.' The spec's 'unit of measurement (actual & minimum weight)' is incomplete — Item 132(i) lists four mutually-exclusive bases (hours, pieces, weight, per-pound valuation); render the one matching the move.


---

## MEDIUM

### 44. [confirmed] Constructive weight factor = 7 lb per cubic foot (Items 116/164)
- **Spec says:** Spec §2/§6/§7 + svm-config constructive_weight_lb_per_cf=7: cube x 7 = weight. Cites 'Items 108, 116' and §7 lists 'Items 116/164'.
- **2026 tariff says:** Item 116 ¶4: 'The total cubic footage determined under the provisions of this item shall be multiplied by seven (7) to determine total approximate weight in pounds.' Item 410 estimator instruction: 'It is mandatory to use cubic footage for each article at not less than that shown on the Table of Measurements' - i.e., cube is a MINIMUM. Item 164 (Light and Bulky) does NOT contain the 7 lb factor; it sets per-article bulky charges and separate weight additives (e.g., boats 115 lb/linear ft).
- **Citation:** Item 116 ¶4 PDF p34 (txt L1542-1543); Item 410 note PDF p67 (txt L3578); Item 164 PDF p45-48 (txt L2277-2406)
- **Fix (v0.2):** 7 lb/cf CONFIRMED current. Cite it to Item 116 ¶4 (primary) and the Item 410 'not less than' minimum-cube rule. REMOVE the Item 164 citation for the 7-lb factor - Item 164 is bulky-article charges/additives, unrelated. Capture Item 410's 'not less than' so the importer flags any cube-catalog value below the Table-of-Measurements minimum (spec §8 already wants this; tie it to Item 410, not Item 116).

### 45. [confirmed] Compute-order step ordering: cap at max BEFORE discount; min-weight before line-haul; weight-break inside line-haul
- **Spec says:** Spec §6: Step1 validate miles; Step2 weight (cube x7, round up 100, then max with min_weight); Step3 line-haul with weight-break; Step4 packing; Step5 accessorials; Step6 valuation; Step7 subtotal/discount/tax; Step8 deposit. Each step 'caps at the MAX4 maximum before the discount is applied.'
- **2026 tariff says:** Sequencing is broadly tariff-consistent: distance rates apply to shipment weight (Item 16, Item 310); weight-break (Item 20/Item 310 NOTE 1) selects the lower as-rated charge; rates are maxima reducible only per Item 24 (with NOTE carve-outs). HOWEVER the tariff imposes constraints the order omits: (1) chargeable weight for line-haul should be the WEIGHED net scale weight where obtainable (Item 80 ¶1-2) - constructive cube x7 (Item 116) is the ESTIMATE basis, not necessarily the final-charge basis; (2) discount base must exclude Item 24 NOTE items; (3) min-weight floor of 5000 is SVM policy, not tariff.
- **Citation:** Item 16 PDF p9; Item 80 ¶1-2 PDF p15 (txt L826-835); Item 116 ¶4 PDF p34; Item 24 NOTE PDF p10
- **Fix (v0.2):** Keep the order but: (a) document that cube x7 produces the ESTIMATE/NTE weight; final billed weight uses the weighmaster certificate / lowest net scale weight (Item 80 ¶1-2,4) on actual-weight moves - add a 'binding-on-estimate' note tied to Item 108 EXCEPTION-to-2(a); (b) split the discount base to exclude Item 24 NOTE items (esp. flight/long-carry); (c) annotate min_weight as SVM config.

### 46. [confirmed] Piano/organ special-handling: which instruments qualify, and 'in addition to' SVM piano fee
- **Spec says:** spec §10 line 214 and §16 line 302: Item 140 piano flight rates applied 'in addition' to any SVM piano fee; §10 line 216 piano_fee is a separate CONFIG charge.
- **2026 tariff says:** Item 140 para 2 scope: 'Pipe Organs, Grand Pianos, Harpsichords, and all other types of pianos and organs not capable of being conveniently hand carried by the one person.' The tariff piano-flight rate replaces the standard flight rate for these items (it is not additive to the standard $2.26/100 lb flight rate). It does not address SVM's own piano fee, so stacking an SVM piano fee on top is a business choice, not a tariff requirement. Verified on PNG p-45.
- **Citation:** Item 140 para 2, PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Clarify in spec that the piano-flight rates apply specifically to pianos/organs 'not capable of being conveniently hand carried by one person' and are used INSTEAD OF the standard $2.26/100 lb flight rate for those articles (do not charge both the standard flight rate and the piano-flight rate on the same piano). The SVM piano_fee (CONFIG) stacking is permissible as it is outside the tariff. Capture the qualifying-instrument criterion in the inventory model.

### 47. [confirmed] Container/material sale prices ('Container Rates Per') are split by Territory A vs B (per brief's already-confirmed ground truth, line 64)
- **Spec says:** Spec data model line 92: materials_catalog.max_price_cents is a SINGLE column (SOURCE Item 340). materials-catalog.csv has one max_price_cents column. Brief line 64 asserts 'container sale prices + pack/unpack labor are split by Territory A vs B'.
- **2026 tariff says:** FALSE for sale price. Item 340 para 1 'Container Rates Per (See Note 9)' is a SINGLE column with one dollar value per container (e.g. Dish-pack 60.35; 3 cu.ft carton 22.48; corrugated/mirror 52.49). Only the 'Packing Charges' (Territory A/B) and 'Unpacking Charges' (Territory A/B) columns — i.e. the LABOR — are territory-split. The container sale price is not territory-dependent.
- **Citation:** Item 340 para 1, PDF p.64 (printed p.60) — hi-64.png column headers
- **Fix (v0.2):** CHALLENGE to the brief: keep materials_catalog.max_price_cents as a SINGLE column — it is correct. Do NOT add Territory A/B to the container sale price. Split A/B only on the LABOR fields (see packing-labor finding). Document in v0.2 that container max sale price is territory-independent; only pack/unpack labor and the hourly rates vary by territory.

### 48. [confirmed] Item 410/116 Table of Measurements cube values are MINIMUMS ('not less than')
- **Spec says:** Spec treats cube as the value used (sizing §8); does not state the cube figures are floors. Brief ground-truth line 54 asserts the Table of Measurements cube is a MINIMUM ('not less than').
- **2026 tariff says:** Confirmed. 'NOTICE TO THE ESTIMATOR: It is mandatory to use cubic footage for each article at not less than that shown on the Table of Measurements and Estimate and the total cubic footage be multiplied by seven to determine the total approximate weight for determining the charge under the maximum fixed rate.' This notice is on the Item 420 form page (NOT Item 410, and NOT Item 116 ¶4 — ¶4 gives only the ×7 multiplier).
- **Citation:** Item 420 'NOTICE TO THE ESTIMATOR', PDF p.78 (printed p.72); cube values themselves in Item 410, PDF p.71-75 (printed p.67-71)
- **Fix (v0.2):** Confirm the brief: cube figures are minimums. Correct the citation in v0.2 — the 'not less than' mandate lives in the Item 420 estimator notice (printed p.72), the cube values are in Item 410 (printed p.67-71), and the ×7 multiplier is Item 116 ¶4 (printed p.30). State in the spec that an estimator may never quote an article below its Table-of-Measurements cube.

### 49. [missing-in-spec] Units of measurement / weighing rules the engine must respect (Items 44, 80)
- **Spec says:** Spec §5 stores chargeable_weight_lb and references 'unit of measurement (actual & minimum weight)' only on the BOL (§13.B.4). No engine rule captures Item 80 weighing, lowest-of-multiple-certificates, or reweigh tolerance; Item 44 not cited.
- **2026 tariff says:** Item 44: rates 'shall not be quoted or assessed...based upon a unit of measurement different from that in which the rates...of this Tariff are stated' (i.e., must quote per 100 lb / per the tariff's units). Item 80 ¶1: weight = property tendered, excluding pads/containers/dollies/equipment. ¶2: for Item 310/390 shipments, mover must obtain a weighmaster's certificate/weight ticket before delivery (<1000 lb may use platform/hand scales with signed statement). ¶4: with multiple certificates, the LOWEST net scale weight applies. ¶5: reweigh on request; tolerance 100 lb (<=5000 lb) or 2% (>5000 lb), use lower weight, up to $60.27 reweigh charge if within tolerance. ¶3: no charge for the required weigh.
- **Citation:** Item 44 PDF p13 (txt L717-721); Item 80 ¶1-6 PDF p15 (txt L823-862)
- **Fix (v0.2):** Add an Item 44 guardrail (engine must express/charge in tariff units - rate per 100 lb; do not let UI quote per-cf money). Add Item 80 rules: actual-weight moves require a weighmaster certificate; when multiple certificates exist use the LOWEST net scale weight; surface reweigh tolerance (100 lb / 2%) and the $60.27 reweigh fee; the weigh itself is free. These belong in §6 and §15 (compliance guardrails), and on the BOL fields.

### 50. [missing-in-spec] Hourly-basis flight/long-carry charge (Item 320 shipments)
- **Spec says:** Not modeled. No 'no additional charge' branch exists for hourly-rated shipments in §6 Step 5 or config.
- **2026 tariff says:** Item 140 para 1: 'Hourly under Item 320 ...... No additional'. i.e. for hourly-rated shipments there is NO separate flight/long-carry charge. Verified in layout text and PNG p-45.
- **Citation:** Item 140 para 1, PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Document that flight/long-carry add a charge ONLY when the shipment is distance- or piece-rated; under hourly rates (Item 320) the charge is 'No additional'. The spec is scoped to 100+ mile distance-rated moves (§1, line 20), so hourly may be out of scope — but state this explicitly so the rate basis is never mis-applied if hourly is later added.

### 51. [missing-in-spec] Item 164 bulky charge applies 'each time loading and unloading is required'
- **Spec says:** Spec computes bulky as 'CONFIG rate × quantity' (per flagged item, once).
- **2026 tariff says:** Item 164: 'LOADING AND UNLOADING CHARGES include BOTH loading and unloading service and the handling and blocking of such article, and applies EACH TIME loading and unloading service is required, including shipments requiring storage-in-transit (except for mover convenience).'
- **Citation:** Item 164, PDF p49 (printed p45)
- **Fix (v0.2):** Document that the bulky loading/unloading charge re-applies on each load/unload event (e.g., SIT adds a cycle), excluding mover-convenience handling. For v1 (no SIT) the single application is fine, but the rule should be captured so SIT extension is correct.

### 52. [missing-in-spec] materials-catalog.csv carton container types map cleanly to Item 340 by name/size
- **Spec says:** materials-catalog.csv carton rows: Book 1.5cf, Medium 3.0cf, Large 4.5cf, Extra-large 6.0cf, Dish pack 5.2cf, Wardrobe 10cf, Mirror/picture 4cf, Lamp 5cf, plus Mattress cartons twin/full/queen/king (cubic_feet blank), Flat-screen TV carton. rate-schemas §3 lists book_1.5, medium_3.0, large_4.5, dishpack_5.2, wardrobe, mirror_carton.
- **2026 tariff says:** Item 340 para 1 container types: Drum/Dish-pack (≥5 cf) 60.35; Cartons <3cf 14.91 / 3cf 22.48 / 4-1/2cf 26.65 / 6cf 30.47 / 6-1/2cf 34.79; Wardrobe (≥10cf) 33.23; Corrugated (mirror/glass/marble) 52.49; CRATES priced per 'Cu. Ft. or Fraction Thereof' (20.26 A / 18.02 B pack labor, not 'Each'); Mattress cartons by DIMENSION (Crib; Not Over 39x75; 39x80; Not Over 54x75; Over 54x75) and Mattress Cover 15.90.
- **Citation:** Item 340 para 1, PDF p.64 (printed p.60) — hi-64.png
- **Fix (v0.2):** Fix the mapping table: (a) CSV 'Extra-large 6.0cf' must map to Item 340 '6 cu.ft.' (30.47) — but Item 340 also has a separate '6-1/2 cu.ft.' (34.79) the CSV lacks; add it or document the gap. (b) Mattress cartons map by DIMENSION not name — twin/full/queen/king labels don't exist in Item 340; map twin/full→'Not Over 39x75' or '39x80', queen→'Not Over 54x75', king→'Over 54x75'. (c) Mirror/picture carton maps to 'Corrugated Containers' (52.49). (d) CRATES are priced per cubic foot, so packing_rates.unit='per container' cannot represent them — add unit='per_cubic_foot'. (e) Lamp carton has no direct Item 340 row (lamps pack into dish-pack/cartons); treat as a CONFIG-priced supply, not Item 340-sourced. (f) Flat-screen TV carton has no Item 340 row — CONFIG, not tariff-capped.

### 53. [missing-in-spec] Item 104 Collection of Charges — confirm exact CA collection/deposit limits for payment-terms language.
- **Spec says:** Spec section 15 (line 290): 'support a deposit and a balance-due-at-delivery model; do not enable holding goods hostage or demanding more than the agreed/NTE amount. (Confirm exact CA collection limits, section 20.)' Section 20 (line 369) lists 'CA collection/deposit limits for the payment-terms language' as an open item.
- **2026 tariff says:** Item 104 imposes NO numeric deposit cap and NO advance-payment percentage limit. The model is: (1) charges may be collected before relinquishing possession; mover MUST unload upon payment of the NTE Price plus all valid Change Order charges; credit-card payment counts as cash (para 1); (2) mover may extend credit / relinquish in advance 'upon taking sufficient precautions to assure payment' (para 2); (4) freight bills must be presented within seven (7) calendar days from the first midnight following delivery. NOTE: lien secures only the NTE Price + bona fide Change Orders; no lien on food/medicine/medical devices/disability or child-care items. Item 128 para 5: charges collected in EXCESS of Agreement/Estimate/Change-Order rates must be refunded to debtor within ten (10) days. Item 465 (consumer notice): a mover cannot refuse to release goods once the NTE is paid. No deposit ceiling appears anywhere in the tariff.
- **Citation:** Item 104 paras 1-4 and NOTE; PDF p30-31 (printed p26), tariff-layout.txt lines 1343-1394. Item 128 para 5 (10-day refund) PDF p39 line 1744. Item 465 PDF p87 lines 4128-4131.
- **Fix (v0.2):** Resolve the section-20 open item: MAX4 sets NO maximum deposit/advance-payment figure — so any deposit policy is an SVM business decision, not a tariff constraint (a numeric cap, if any, would come from CA Civil Code / consumer law, outside MAX4 — flag for legal, do not invent a number). Encode the tariff's actual hard rules: (1) goods MUST be released on payment of NTE + valid Change Orders (Item 104 para 1; Item 465); (2) present the freight bill within 7 calendar days of the midnight after delivery (Item 104 para 4); (3) refund any over-collection within 10 days (Item 128 para 5); (4) credit card = cash; (5) no lien on food/medicine/medical/child-care items.

### 54. [stale] Reference (not-offered) zero-deductible Full Value and Actual Cash Value rates are $1.70/$100 and $0.75/$100
- **Spec says:** SPEC line 162: '(Tiers SVM is not offering, for reference only: zero-deductible Full Value $1.70/$100, Actual Cash Value $0.75/$100.)'
- **2026 tariff says:** Item 136 ¶7: Full Value (no deductible) = $2.20 for each $100 (or fraction thereof). Item 136 ¶6: Actual Cash Value = $1.12 for each $100 (or fraction thereof).
- **Citation:** Item 136 ¶6 & ¶7, PDF p43 (printed p39)
- **Fix (v0.2):** These tiers are present in the spec (as 'not offered, reference only'), so this is a stale-number fix, not a missing tier. Update reference values: Full Value (no deductible) $1.70 → $2.20/$100; Actual Cash Value $0.75 → $1.12/$100. The tariff does not compel offering these (Item 128 NOTE 3: only offered options must be listed), so SVM may keep them off the menu — but if the values are printed anywhere they must be current.

### 55. [unverifiable] Estimates require a visual (in-home or virtual) inspection and must be in writing; the 3-day rule governs binding-above-max.
- **Spec says:** Spec section 2 (line 37): 'Estimates require a visual (in-home or virtual) inspection and must be in writing. The 3-day rule: an Estimate issued 3+ days before the move may exceed max fixed rates...; issued under 3 days it may not exceed max fixed rates.'
- **2026 tariff says:** Item 108 1(a): 'If an estimate is given, the estimated cost shall be given only after visual inspection of the goods to be moved and shall be in writing.' Item 112 para 1 repeats 'only after the estimator visually inspects the goods.' The tariff requires 'visual inspection' but is SILENT on whether a remote/virtual (video) survey satisfies it — it does not define the medium. Booklet (Item 470, Estimates section) states 'A verbal or online rate quotation ... is not an Estimate' — but that addresses QUOTATIONS, not the inspection medium. The 3-day rule itself is CONFIRMED: Item 108 2(a) (Estimate >=3 days before move may exceed max fixed rate) and 2(b) (less than 3 days cannot exceed max fixed rate); NOTE: 'No less than three days ... means on or before the third day of the move.'
- **Citation:** Item 108 1(a), 2(a), 2(b), NOTE; PDF p31-33 (printed p27-29), tariff-layout.txt lines 1403-1499. Item 112 para 1, PDF p33, lines 1506-1509. Item 470 Estimates, PDF p88, lines 4264-4270.
- **Fix (v0.2):** Keep 'visual inspection, in writing' (confirmed) and the 3-day rule (confirmed). REMOVE the unqualified assertion that a 'virtual' inspection satisfies Item 108 — the tariff requires 'visual inspection of goods' and does not define whether a video/remote survey qualifies. Mark as an OPEN ITEM for human/BHGS confirmation. Note the booklet's 'verbal or online quotation is not an Estimate' as a caution against treating an online price as an Estimate.

### 56. [wrong] Disposition of Fractions governs weight/declared-value rounding (Item 32)
- **Spec says:** Spec §11 + svm-config.rounding._source 'Item 32 Disposition of Fractions': weight rounded up to next 100 lb; declared value up to next $100; money to the cent - all attributed to Item 32.
- **2026 tariff says:** Item 32: 'In computing a rate based on a PERCENTAGE OF ANOTHER RATE, the following rule shall be observed: (a) fractions less than 1/2 cent, omit; (b) 1/2 cent or greater, increase to next whole figure.' It governs ONLY percentage-derived rates rounding to the whole cent. It does NOT define weight rounding or declared-value rounding. (Cube x7 'approximate weight' is Item 116 ¶4; valuation 'or fraction thereof' next-$100 is Item 136.)
- **Citation:** Item 32 PDF p11 (txt L624-631); Item 116 ¶4 PDF p34; Item 24 NOTE (Item 32 non-reducible) PDF p10
- **Fix (v0.2):** Confirms brief: spec mis-attributes weight and declared-value rounding to Item 32. Re-source: weight basis = Item 116 ¶4 (cube x7 'approximate weight') with SVM's round-up-to-100-lb as a CONFIG convention (no tariff 100-lb rounding rule exists); declared-value next-$100 = Item 136 'or fraction thereof'; Item 32 applies ONLY to percentage-of-rate results (e.g., the 65% penalty calc, deviated rate levels) rounding to the whole cent, and per Item 24 NOTE is itself non-reducible. Fix svm-config rounding._source.

### 57. [wrong] Reconcile cube-catalog.csv against Item 410 by flagging any item whose cube 'differs from' Item 410
- **Spec says:** Spec §8 line 186: 'Reconcile with MAX4 Item 410 Table of Measurements on first run; the importer should flag any item whose cube differs from Item 410.' OPEN-ITEMS line 22 same. cube-catalog.csv (91 rows) uses finer/different granularity than Item 410.
- **2026 tariff says:** Because the Item 410 cube is a MINIMUM ('not less than', Item 420 notice), a catalog cube ABOVE the Item 410 figure is permissible; only a cube BELOW the Item 410 minimum is non-compliant (it understates weight and undercharges below the maximum fixed rate). Mapping is not 1:1: e.g. CSV splits 'Bookcase (small) 10' / 'Bookcase (large) 20' while Item 410 has a flat 'Bookcase 20' plus a separate 'Bookshelves, Sectional 5' — so 'Bookcase (small) 10' may sit below the Item 410 'Bookcase' minimum of 20 depending on the mapping.
- **Citation:** Item 410 cube values PDF p.71-75 (printed p.67-71); minimum rule Item 420 notice PDF p.78 (printed p.72); spec line 186
- **Fix (v0.2):** Change the reconciliation rule from 'flag where cube differs' to 'flag where catalog cube < Item 410 minimum for the matched article.' Cube ≥ minimum is compliant and must not be flagged. Build an explicit CSV-item → Item 410 article mapping first (the granularities differ — e.g. bookcase by size, beds bundled with spring+mattress in Item 410), then flag only sub-minimum rows. Note materials-catalog cartons are container sale items (Item 340), separate from the cube-catalog furniture reconciliation (Item 410).

### 58. [wrong] Change Order required fields (Item 120/440) per spec section 13.B.3.
- **Spec says:** Spec section 13.B.3 (line 256): 'Change Order for Services (Item 120/440): added articles/services, rates, revised valuation if changed, NOT EXCEED restated, signatures.'
- **2026 tariff says:** Item 120 para 1 (a)-(j): (a) date; (b) shipping order/bill of lading number; (c) name/address/CAL-T of mover(s); (d) description of additions to shipment (itemize additional articles only); (e) description of additional transportation/accessorial services INCLUDING number of helpers and packers; (f) rates to be applied to additional articles/services; (g) valuation if different from Agreement (per Item 136); (h) three certify/attest statements in >=10pt bold; (i) the 'I UNDERSTAND THAT THE COST FOR SERVICES RENDERED WILL NOT EXCEED ____ (Initial)' statement in >=12pt bold caps; (j) signatures of mover and shipper. Must be signed by mover and shipper BEFORE performance and the signed original delivered to shipper prior to/at the time service begins. Retain 3 years from date delivered (para 2).
- **Citation:** Item 120 paras 1-2 (a)-(j); PDF p34-35 (printed p30-31), tariff-layout.txt lines 1550-1611.
- **Fix (v0.2):** Expand the Change Order field list to the full Item 120 (a)-(j): add the date (a), the shipping-order/BOL number (b), mover name/address/CAL-T (c), helpers/packers count in (e), the three mandatory >=10pt-bold certification statements (h), and the >=12pt-bold-caps 'NOT EXCEED ___ (Initial)' statement (i). Note the timing/signature requirement: signed by both parties before any added service begins, signed original delivered to shipper at/before that time.


---

## LOW

### 59. [confirmed] Weight-break / as-rated-weight optimization direction and rule basis
- **Spec says:** Spec §6 Step 3 + §11: line_haul = min over actual group and every higher group g of (chargeable_weight_g x R(g)), chargeable_weight_g = actual weight for actual group, = weight_group_min_lb(g) for higher groups; cites 'Item 20 / Item 24'.
- **2026 tariff says:** Mechanism is CORRECT and matches Item 310 NOTE 1 ('latter [greater minimum weight] shall apply' when it yields a lower charge). The governing alternative-application rule is Item 20: 'In the event two or more rates are named for the same transportation, the lower rate shall apply as the maximum rate, subject to Item 16.' Item 24 governs max-rate levels, not the weight-break per se.
- **Citation:** Item 20 PDF p10 (txt L551-555); Item 310 NOTE 1 PDF p57 (PNG p-61)
- **Fix (v0.2):** Keep the optimization logic. Cite the weight-break to Item 20 + Item 310 NOTE 1 (primary), not Item 24. Note the weight columns are minimum weights (any_qty,1000,2000,5000,8000,12000,16000), so 'higher group' iterates those breakpoints, not the spec's invented 1000-lb bands.

### 60. [confirmed] Single distance-rate region applies statewide (no region/territory variation in Item 310)
- **Spec says:** Spec/rate-schemas model rate_item310 with no region or territory dimension; one rate per (weight,mileage) cell statewide.
- **2026 tariff says:** Item 310 is headed 'REGION 1. MAXIMUM FIXED DISTANCE RATES' - only ONE region table is published in this tariff, so a single statewide distance-rate region is correct for line-haul. (NOTE: Territory A/B DOES apply to Item 320 hourly and Item 340 packing/containers via Item 210 - out of line-haul scope but the spec omits Territory entirely, per the brief.)
- **Citation:** Item 310 'REGION 1' heading PDF p57 (PNG p-61); Item 210 Territory A/B PDF p55 (txt L2595-2615)
- **Fix (v0.2):** Line-haul (Item 310) is single-region statewide - no region field needed in rate_item310. But flag for the packing/hourly categories that Territory A/B (Item 210) DOES drive Item 320 and Item 340 rates; the data model's omission of Territory is a real gap there (not in line-haul).

### 61. [confirmed] Released-value base built into the line-haul rate is $0.60/lb/article
- **Spec says:** Released value base built into line-haul: $0.60/lb/article (SPEC line 35, 159; CLAUDE line 15 '60¢/lb'; config tier label 'Released Value (60¢/lb/article)' rate 0).
- **2026 tariff says:** Item 136 ¶1: 'The transportation rates provided in this Tariff are based upon a declared value of $0.60 per pound per article, for the actual weight of any article(s) in a shipment.' Released tier rate = $0.00 (built in).
- **Citation:** Item 136 ¶1, PDF p42 (printed p38)
- **Fix (v0.2):** Keep as-is. Verified against both layout text and rendered PNG p-42. No change needed for v0.2.

### 62. [confirmed] Default liability cap / declared-value default amount is $20,000
- **Spec says:** SPEC line 158: 'Actual Cash Value up to $20,000.' Config / §9 reference $20,000 as the no-declaration ceiling.
- **2026 tariff says:** Item 136 ¶2 & ¶6 state $20,000. Item 128 NOTE 3 NOTICE: 'Coverage for loss and damage is limited to the Actual Cash Value of losses up to the amount of $20,000 unless the shipper signing this contract inserts ... another value.'
- **Citation:** Item 136 ¶2/¶6 (PDF p42-43); Item 128 NOTE 3 (PDF p39)
- **Fix (v0.2):** $20,000 figure is current. Keep. (Note: this is the default coverage amount, not a maximum the shipper can declare — Item 136 NOTE 1 allows higher lump-sum declarations.)

### 63. [confirmed] Flight definition (Item 140 Note 1)
- **Spec says:** spec §10 line 213: 'a flight = a series of 8-20 stair steps (not inside a single dwelling), each additional <=20-step series beyond the first 20, or a (non-vehicular) elevator.'
- **2026 tariff says:** Item 140 NOTE 1: '(a) a series of at least eight (8), but not over 20 stairway steps, except when inside a single dwelling; (b) each series of not more than 20 stairway steps in excess of the first 20, except when inside a single dwelling; (c) elevator service other than vehicular (motor vehicle) elevator service.' Plus: a landing/level area does not break continuity of a series. Verified in layout text and PNG p-45.
- **Citation:** Item 140 NOTE 1, PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Definition is substantively correct. Add the missing clarifier from Note 1: 'a landing or level area occurring at a point on the stairway shall not be deemed to break the continuity of the series' so estimators count steps correctly. (Note: Notes 4/5 give a different first-flight rule for pianos/organs in para 2 — first inside flight = at least 8 steps; first outside flight = 8-20 steps; additional inside flights = complete floors above/below; elevator = one flight. These special piano-flight definitions are not in the spec.)

### 64. [confirmed] Long-carry free distance / definition (Item 140 Note 2)
- **Spec says:** spec §10 line 213: 'carry beyond the tariff free distance (approx 75 ft; confirm)'.
- **2026 tariff says:** Item 140 NOTE 2: first 75 feet free; long carry applies only when, through no fault of the mover, equipment cannot be placed within 75 ft of a stairway/entrance. Verified in layout text and PNG p-45.
- **Citation:** Item 140 NOTE 2, PDF p45 (printed p41); PNG p-45
- **Fix (v0.2):** Confirm the 75 ft figure as exact (not 'approx') and add the 'through no fault of the mover' qualifier so long carry isn't billed when the mover chose to park far away. Remove the §20 'confirm' flag.

### 65. [confirmed] Hoisting is correctly out of scope (disabled in v1)
- **Spec says:** §1 line 22 lists hoisting as out of scope; §10 'Disabled in v1: hoisting'; config hoisting {enabled:false}; out_of_scope_hooks includes 'hoisting'.
- **2026 tariff says:** Item 168 (Rigging, Hoisting or Lowering): mover performs 'at rates no higher than those provided in Item 320' (hourly), or acts as shipper's agent for third-party services billed in addition. Confirms hoisting IS a regulated, Item-320-hourly-capped accessorial.
- **Citation:** Item 168, PDF p52 (printed p48); confirmed on rendered PNG (text-confirmed, prose-only, no table)
- **Fix (v0.2):** Out-of-scope decision is correct. When the hook is enabled later, model hoisting as Item 320 hourly (capped), plus an Advanced-Charge passthrough (Item 180) for third-party rigging. Keep field; do not delete.

### 66. [confirmed] Appliance servicing is correctly out of scope (disabled in v1)
- **Spec says:** §1 line 22 lists appliance servicing out of scope; §10 'Disabled in v1: appliance servicing'; config appliance_servicing {enabled:false}; out_of_scope_hooks includes 'appliance_servicing'.
- **2026 tariff says:** Item 176 §3 fixed maximum rates, Territory-split (Item 210): First Item Territory A $23.34 / B $20.60; Each Additional Item A $15.44 / B $13.54. NOTE 3: rate is for the territory where service is provided. Confirms appliance servicing IS regulated (flat per-item, territory-tiered) — and reinforces that Territory A/B is a real tariff dimension the spec omits elsewhere (§ container/labor rates).
- **Citation:** Item 176 §3, PDF p53-54 (printed p49); table read from rendered PNG p-53
- **Fix (v0.2):** Out-of-scope decision is correct. When enabled, seed the Item 176 table with Territory A/B tiers (First/Each-Additional). This is another instance confirming the brief's Territory-A/B gap — ensure the data model carries a Territory dimension globally, not just for Item 340. Keep field; do not delete.

### 67. [confirmed] Note 9 — container rates exclude sales tax (CA sales tax applies to materials only, not labor/transportation)
- **Spec says:** Spec §6 Step 5 line 141 and §10 line 228: tax_cents = taxable_materials_cents × materials_tax_rate_pct; 'CA sales tax applies to materials sold (tangible goods), not to transportation/labor.' config.materials_tax_rate_pct=null (SVM to confirm).
- **2026 tariff says:** Item 340 Note 9: 'Packing container rates do not include sales tax.' Confirms the per-container sale price is pre-tax and sales tax is added on the tangible container/material, consistent with the spec's materials-only tax treatment.
- **Citation:** Item 340 Note 9, PDF p.65 (printed p.61) — hi-65.png
- **Fix (v0.2):** No rate change. Tighten wording: tax applies to the taxable container/material sale price (Note 9) and not to pack/unpack labor. Ensure the tax base is the container SALE price line (max_price_cents / svm_price_cents), not the labor lines. Keep materials_tax_rate_pct as CONFIG.

### 68. [confirmed] Constructive weight = total cubic feet × 7 lb/cf (Items 108, 116)
- **Spec says:** Spec §3 line 32 and §7 line 156: 'weight = total cubic feet × 7 lb per cubic foot'; §6 Step 2 line 116: estimated_weight_lb = round_up_100(total_cubic_feet × 7).
- **2026 tariff says:** Item 116 ¶4: 'The total cubic footage determined under the provisions of this item shall be multiplied by seven (7) to determine total approximate weight in pounds.' (Also Item 390 Note 2 and Item 410/420 estimator notice confirm ×7.)
- **Citation:** Item 116 ¶4, PDF p.34 (printed p.30)
- **Fix (v0.2):** No change. ×7 factor is current in the 2026 tariff. Keep. (Note: ¶4 gives the multiplier only — the 'minimum' rule comes from a separate notice; see next two findings.)

### 69. [confirmed] Document numbering: Agreement = Item 128. Shipping Order = Item 132.
- **Spec says:** Spec section 2 (line 36) and section 13.B cite 'Agreement for Moving Services (Item 128)' and 'Shipping Order / Freight Bill / BOL (Item 132/460)'. The Agreement is also referenced as 'Item 128/450' in headings.
- **2026 tariff says:** BOTH exist and are distinct. Item 128 is the RULE 'Agreement for Moving Services' (the requirement + the (a)-(r) field list). Item 450 is the FORM 'Agreement for Moving Services' (the blank template); Item 128 para 3 states 'The form of the Agreement in Item 450 will be suitable and proper.' Likewise Item 132 is the RULE 'Shipping Order and Freight Bill' (fields (a)-(u)); Item 460 is the FORM 'Shipping Order and Freight Bill for Used Household Goods and Related Articles'; Item 132 para 2 states 'The form of shipping document in Item 460 will be suitable and proper.'
- **Citation:** Item 128 para 3 (PDF p37, line 1728); Item 450 form (PDF p82, line 3800); Item 132 para 2 (PDF p42, line 1922); Item 460 form (PDF p85, line 3998).
- **Fix (v0.2):** Standardize spec citations as 'rule + form': Agreement = Item 128 (rule) / Item 450 (form); Shipping Order/Freight Bill = Item 132 (rule) / Item 460 (form); Change Order = Item 120 (rule) / Item 440 (form); Estimate = Item 108 (rule) / Item 420 (form). The confusion is benign — both numbers are correct for their roles.

### 70. [confirmed] Records retention: MAX4 documents must be retainable for 3 years (Items 108, 128, 132).
- **Spec says:** Spec section 13 (line 259): 'Records retention: documents must be retainable for 3 years (Items 108, 128, 132). Store generated PDFs against the quote.'
- **2026 tariff says:** CONFIRMED 3 years across all in-scope documents: Item 108 1(f) 'not less than three (3) years from the date of the freight bill or shipping order or from the date of the Estimate if the mover does not perform.' Item 112 para 3 (3 years). Item 120 para 2 (3 years from date delivered). Item 128 para 4 (3 years from date issued; Master Agreement 3 years from expiration/cancellation). Item 130 (3 years from date the Important Notice was signed). Item 132 para 3 (3 years; documents must be retained 'at a location within the State of California'; Master Agreement from expiration/cancellation, all others from date of issuance). Also: a copy must be given to the shipper when charges are collected (Item 132 para 3).
- **Citation:** Item 108 1(f) PDF p31 line 1451; Item 112 para 3 PDF p33 line 1517; Item 120 para 2 PDF p35 line 1609; Item 128 para 4 PDF p39 line 1737; Item 130 PDF p40 line 1856; Item 132 para 3 PDF p42 lines 1927-1937.
- **Fix (v0.2):** 3 years is correct. Strengthen the spec: cite Items 108, 112, 120, 128, 130, 132 (not just 108/128/132). Add the two missing requirements: (1) retention must be at a location WITHIN California (Item 132 para 3); (2) a copy of each document must be given to the shipper when charges are collected (Item 132 para 3). Master Agreement retention runs from expiration/cancellation, not issuance.

### 71. [confirmed] Form-item PDF page references for navigation.
- **Spec says:** The audit brief's Item->page map lists the FORM items at printed-page numbers (Item 420 -> p72, 440 -> p75, 450 -> p78, 460 -> p81, 465/470 -> p83/84), which are the printed page numbers and are +4 off the actual PDF page.
- **2026 tariff says:** Actual PDF pages (verified by form-feed count in tariff-raw.txt, which matched the brief exactly on rule items): Item 400 -> PDF p70; Item 410 -> PDF p71-75; Item 420 -> PDF p76-78; Item 440 -> PDF p79-81; Item 450 -> PDF p82-84; Item 460 -> PDF p85-86; Item 465 -> PDF p87; Item 470 -> PDF p88-98. The form items' printed page = PDF page minus 4.
- **Citation:** Form-feed page map, tariff-raw.txt (awk count); cross-checked against rule items which matched the brief (Item 28 -> PDF p14-15, Item 132 -> PDF p41-42).
- **Fix (v0.2):** When citing form items, use the actual PDF page (Agreement form = PDF p82, Shipping Order form = PDF p85, Important Notice form = PDF p87) to avoid a 4-page navigation error. Note in the spec/import notes that the tariff's printed page numbers run 4 behind the PDF page index from the appendix forms onward.

### 72. [missing-in-spec] Storage-in-transit valuation has its own rate schedule
- **Spec says:** Spec is silent on storage-in-transit valuation rates (scope line 20 excludes storage; §9 does not model SIT valuation).
- **2026 tariff says:** Item 136 ¶8: SIT Actual Cash Value $0.16/$100; SIT Full Value $0.38/$100; SIT Full Value w/ first $250 of claim $0.15/$100; SIT Full Value w/ first $500 of claim $0.07/$100 (all 'or fraction thereof'). NOTE 3: separate valuation charges may be assessed origin→storage and storage→destination. NOTE 6: no charge when SIT is for the mover's convenience.
- **Citation:** Item 136 ¶8 & NOTES 3/6, PDF p43-44 (printed p39-40)
- **Fix (v0.2):** Out of current scope (spec line 20 excludes storage), so low severity. If/when SVM adds storage-in-transit, seed these four SIT rates ($0.16 / $0.38 / $0.15 / $0.07 per $100). Document them as a known gap rather than implementing now.

### 73. [missing-in-spec] 'Article' definition for per-article valuation
- **Spec says:** Spec relies on 'per article' in the $0.60/lb/article base (line 35, 159) but does not define what constitutes an 'article.'
- **2026 tariff says:** Item 136 ¶5: 'Each shipping piece or package and contents thereof shall constitute an article, except that total component parts of any article taken apart or knocked down for handling and loading in vehicle shall constitute one article ... When an entire shipment is transported in containers, lift vans or shipping boxes, each shipping package, piece, or loose items not enclosed within a package ... will constitute the article.'
- **Citation:** Item 136 ¶5, PDF p42-43 (printed p38-39)
- **Fix (v0.2):** Add the Item 136 ¶5 'article' definition to §9 glossary/notes. It matters for liability presentation on the BOL even though the released base is built into line-haul; the per-article basis is how loss/damage liability is computed.

### 74. [missing-in-spec] Hourly-basis extra-stop pricing is not modeled
- **Spec says:** extra_stop config basis is 'flat' only; spec has no hourly extra-stop formula. (Spec is distance-only / 100+ mi in v1, but the data model claims to be the regulated source of truth.)
- **2026 tariff says:** Item 148 §2(a) / 152 §2(a) / 156 §3(a) (hourly rates): max = Item 320 rate for total loading/unloading time of each component part PLUS the rate for DOUBLE the driving time between each point. No $134.45 flat additive applies under hourly rates — the basis is entirely time-based.
- **Citation:** Item 148 §2(a) / Item 152 §2(a) / Item 156 §3(a), PDF p46-48 (printed p42-43)
- **Fix (v0.2):** Note in §10/§13 that under hourly rates (out of v1 scope) split-stop charges are time-based (double driving time + per-component load/unload), not the $134.45 flat. Keep the data field but document that the $134.45 cap is the distance-rate basis only. Low because v1 is distance-only.

### 75. [missing-in-spec] Item 156 combination has no eligibility conditions
- **Spec says:** Spec models extra stops generically with no minimum component count or time window.
- **2026 tariff says:** Item 156 §1: 'The entire shipment must be picked up within 24-hour period and shall be comprised of a minimum of four (4) component parts.' §2: single debtor. NOTE 1: does not apply to shipments under storage-in-transit (Item 160).
- **Citation:** Item 156 §1, PDF p47 (printed p43)
- **Fix (v0.2):** If/when combination split moves are supported, enforce the 4-component-part minimum and 24-hour pickup window, single-debtor billing, and the SIT exclusion. Document as a validation rule. Low for v1.

### 76. [missing-in-spec] Item 340 overtime rules (Note 5 and Note 10)
- **Spec says:** Not present. Spec/config model only straight per-container or (newly recommended) hourly labor; no overtime multipliers and no per-container overtime path.
- **2026 tariff says:** Note 5: overtime rates may be assessed up to the max rates in para 2(b)/2(c) [the 1.5x/2x hourly rates] when service is requested at a time the mover must pay overtime per IWC Wage Order 9-2001. Note 10: for work at para 1 (per-container) rates, overtime max = para-1 rate × 1.47 (time-and-a-half) or × 1.94 (double time).
- **Citation:** Item 340 Notes 5 & 10, PDF p.65-66 (printed p.61-62) — hi-65.png / hi-66.png
- **Fix (v0.2):** Document the overtime maxima (per-container × 1.47 / × 1.94; hourly capped at 2(b)/2(c)). Low priority unless SVM quotes overtime/after-hours packing, but include the factors so the engine can cap an overtime line at the legal maximum.

### 77. [stale] The deductible is what the customer absorbs on a claim
- **Spec says:** SPEC §9 line 205: 'The deductible is what the customer absorbs on a claim; it does not change the price.'
- **2026 tariff says:** Item 136 NOTE 5: 'When the shipper presents a properly documented claim for lost or non-delivered article(s) and the investigation establishes the mover's liability for the lost or non-delivered article(s), no deductible shall apply.'
- **Citation:** Item 136 NOTE 5, PDF p44 (printed p40)
- **Fix (v0.2):** Refine the consumer-facing explanation: the deductible applies to damage/partial-loss claims but is WAIVED for documented total-loss / non-delivery claims where mover liability is established. Update §9 line 205 and any customer 'what it means' copy accordingly.
