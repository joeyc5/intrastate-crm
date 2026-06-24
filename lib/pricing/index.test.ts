// lib/pricing/index.test.ts
import { describe, it, expect } from "vitest";
import { priceQuote, loadRates } from "./index.js";
import { DistanceTooShortError, type QuoteInput } from "./types.js";

const rates = loadRates("2026");
const base: QuoteInput = {
  origin: { county: "Santa Clara" },
  destination: { county: "Los Angeles" },
  distanceMiles: 110,
  weight: { basis: "scale", pounds: 5000 },
  valuation: { tier: "fvrp250", declaredValueUsd: 20000 },
};

describe("priceQuote end-to-end", () => {
  it("prices line-haul + valuation into an NTE with full breakdown", () => {
    const r = priceQuote(base, rates);
    // line haul 5000 lb @ 100-120 mi = 299750; valuation 20000 -> 200*67 = 13400
    expect(r.lineItems.map((li) => li.key)).toEqual(["line_haul", "valuation"]);
    expect(r.subtotalCents).toBe(299750 + 13400);
    expect(r.discountCents).toBe(0);
    expect(r.nteTotalCents).toBe(313150);
    expect(r.derived.originTerritory).toBe("A");
    expect(r.derived.destTerritory).toBe("B");
    expect(r.derived.item310WeightColumnLb).toBe(5000);
  });

  it("applies a discount to line-haul only, never to valuation", () => {
    const r = priceQuote({ ...base, discountPct: 0.1 }, rates);
    // 10% of line-haul 299750 = 29975; valuation untouched
    expect(r.discountCents).toBe(29975);
    expect(r.nteTotalCents).toBe(299750 + 13400 - 29975);
  });

  it("a bigger discount never raises the NTE (property)", () => {
    const lo = priceQuote({ ...base, discountPct: 0.1 }, rates).nteTotalCents;
    const hi = priceQuote({ ...base, discountPct: 0.2 }, rates).nteTotalCents;
    expect(hi).toBeLessThanOrEqual(lo);
  });

  it("the NTE never exceeds the sum of caps (property)", () => {
    const r = priceQuote({ ...base, discountPct: 0.15 }, rates);
    const capSum = r.lineItems.reduce((s, li) => s + (li.capCents ?? li.amountCents), 0);
    expect(r.nteTotalCents - r.materialsTaxCents).toBeLessThanOrEqual(capSum);
  });

  it("blocks a <=100-mile move", () => {
    expect(() => priceQuote({ ...base, distanceMiles: 80 }, rates)).toThrow(DistanceTooShortError);
  });
});
