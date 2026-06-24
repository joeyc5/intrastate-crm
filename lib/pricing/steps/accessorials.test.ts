import { describe, it, expect } from "vitest";
import { accessorials } from "./accessorials.js";
import { priceQuote } from "../index.js";
import { loadRates } from "../rates/load.js";
import { bulkyArticles } from "../rates/accessorials.js";
import { RateDataError, type AccessorialsInput } from "../types.js";

const rates = loadRates("2026");
const piano = bulkyArticles(rates).find((a) => a.label.includes("Piano"))!.key;
const terr = { originTerritory: "A" as const, destTerritory: "B" as const };

describe("accessorials step", () => {
  it("flights: count × ceil(weight/100) × $2.26, non-discountable", () => {
    const items = accessorials({ flights: { count: 2, weightLb: 700 } }, rates, terr);
    const f = items.find((i) => i.key === "flights")!;
    expect(f.amountCents).toBe(3164); // 2 × 7 × $2.26
    expect(f.discountable).toBe(false);
  });

  it("long carry: only beyond 75 ft, per 50 ft", () => {
    const items = accessorials({ longCarry: { feet: 175, weightLb: 1000 } }, rates, terr);
    expect(items.find((i) => i.key === "long_carry")!.amountCents).toBe(4520); // 2 × 10 × $2.26
  });

  it("long carry: free within 75 ft", () => {
    const items = accessorials({ longCarry: { feet: 60, weightLb: 1000 } }, rates, terr);
    expect(items.find((i) => i.key === "long_carry")).toBeUndefined();
  });

  it("shuttle: hours × Item 320 crew rate at origin territory", () => {
    const items = accessorials({ shuttle: { hours: 4, persons: 2, timeClass: "straight" } }, rates, terr);
    expect(items.find((i) => i.key === "shuttle")!.amountCents).toBe(93756); // 4 × $234.39 (2-person straight, Terr A)
  });

  it("extra stops: $134.45 each", () => {
    const items = accessorials({ extraStops: 2 }, rates, terr);
    expect(items.find((i) => i.key === "extra_stops")!.amountCents).toBe(26890);
  });

  it("bulky: per-article max (piano = $122.65)", () => {
    const items = accessorials({ bulky: [{ type: piano, qty: 1 }] }, rates, terr);
    expect(items.find((i) => i.key.startsWith("bulky:"))!.amountCents).toBe(12265);
  });

  it("throws RateDataError on an unknown bulky article", () => {
    expect(() => accessorials({ bulky: [{ type: "nope", qty: 1 }] }, rates, terr)).toThrow(RateDataError);
  });
});

describe("priceQuote with accessorials", () => {
  const base = {
    origin: { county: "Santa Clara" },
    destination: { county: "Los Angeles" },
    distanceMiles: 110,
    weight: { basis: "scale", pounds: 5000 } as const,
    valuation: { tier: "released" } as const,
  };

  it("a discount never reduces flights (non-discountable)", () => {
    const acc: AccessorialsInput = { flights: { count: 2, weightLb: 700 } };
    const noDisc = priceQuote({ ...base, accessorials: acc }, rates);
    const withDisc = priceQuote({ ...base, accessorials: acc, discountPct: 0.2 }, rates);
    const f0 = noDisc.lineItems.find((i) => i.key === "flights")!.amountCents;
    const f1 = withDisc.lineItems.find((i) => i.key === "flights")!.amountCents;
    expect(f0).toBe(3164);
    expect(f1).toBe(f0); // 20% discount leaves flights untouched
  });
});
