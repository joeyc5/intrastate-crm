// lib/pricing/rates/item310.test.ts
import { describe, it, expect } from "vitest";
import { item310Charge } from "./item310.js";
import { loadRates } from "./load.js";
import type { Item310Cell } from "../types.js";

// Synthetic band for isolated weight-break logic: 100-120 mi.
// All 7 WEIGHT_COLUMNS are present so item310Charge can iterate WEIGHT_COLUMNS fail-loud.
// Cols 2000/5000/8000/12000/16000 are set to 5000 cents/100 lb (same as col 1000), so the
// weight-break optimization still picks col 0 below the break point and col 1000 above it.
const SYNTH: Item310Cell[] = [
  { milesOver: 100, milesNotOver: 120, weightGroupMinLb: 0, rateCentsPer100: 10000, breakPointLb: 500 },
  { milesOver: 100, milesNotOver: 120, weightGroupMinLb: 1000, rateCentsPer100: 5000, breakPointLb: null },
  { milesOver: 100, milesNotOver: 120, weightGroupMinLb: 2000, rateCentsPer100: 5000, breakPointLb: null },
  { milesOver: 100, milesNotOver: 120, weightGroupMinLb: 5000, rateCentsPer100: 5000, breakPointLb: null },
  { milesOver: 100, milesNotOver: 120, weightGroupMinLb: 8000, rateCentsPer100: 5000, breakPointLb: null },
  { milesOver: 100, milesNotOver: 120, weightGroupMinLb: 12000, rateCentsPer100: 5000, breakPointLb: null },
  { milesOver: 100, milesNotOver: 120, weightGroupMinLb: 16000, rateCentsPer100: 5000, breakPointLb: null },
];

describe("item310Charge weight-break (synthetic)", () => {
  it("uses the any-qty column below the break point", () => {
    // 400 lb: anyqty = 400*10000/100 = 40000; bump-to-1000 = 1000*5000/100 = 50000 -> anyqty cheaper
    const r = item310Charge(400, 110, SYNTH);
    expect(r.amountCents).toBe(40000);
    expect(r.weightColumnLb).toBe(0);
  });
  it("bumps up to the 1000 column above the break point", () => {
    // 600 lb: anyqty = 60000; bump = 50000 -> bump cheaper
    const r = item310Charge(600, 110, SYNTH);
    expect(r.amountCents).toBe(50000);
    expect(r.weightColumnLb).toBe(1000);
  });
});

describe("item310Charge against real 2026 data", () => {
  const rates = loadRates("2026");
  it("prices 5,000 lb at 110 mi from the 100-120 band", () => {
    const r = item310Charge(5000, 110, rates.item310);
    // 5,000 lb in the 5000 column, $59.95/100 lb -> 5000 * 5995 / 100 = 299750 cents
    expect(r.amountCents).toBe(299750);
    expect(r.weightColumnLb).toBe(5000);
    expect(r.bandLabel).toBe("100–120");
  });
  it("computed 5000-column crossover matches the published break point", () => {
    const band5000 = rates.item310.find((c) => c.milesOver === 100 && c.milesNotOver === 120 && c.weightGroupMinLb === 5000)!;
    const band8000 = rates.item310.find((c) => c.milesOver === 100 && c.milesNotOver === 120 && c.weightGroupMinLb === 8000)!;
    // crossover W: W * rate5000 == 8000 * rate8000  ->  W = 8000 * rate8000 / rate5000
    const crossover = (8000 * band8000.rateCentsPer100) / band5000.rateCentsPer100;
    expect(Math.round(crossover)).toBe(band5000.breakPointLb);
  });
  it("applies the per-50mi add beyond 850 miles", () => {
    const r = item310Charge(5000, 900, rates.item310);
    const base = rates.item310.find((c) => c.milesOver === 800 && c.milesNotOver === 850 && c.weightGroupMinLb === 5000)!;
    const add = rates.item310.find((c) => c.milesOver === 850 && c.milesNotOver === null && c.weightGroupMinLb === 5000)!;
    const inc = Math.ceil((900 - 850) / 50); // = 1
    const expected = Math.round((5000 * (base.rateCentsPer100 + inc * add.rateCentsPer100)) / 100);
    // 900 mi may weight-break to a higher column; assert it is no more than the 5000-column figure
    expect(r.amountCents).toBeLessThanOrEqual(expected);
  });
});
