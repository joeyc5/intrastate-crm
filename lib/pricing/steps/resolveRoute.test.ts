// lib/pricing/steps/resolveRoute.test.ts
import { describe, it, expect } from "vitest";
import { resolveRoute } from "./resolveRoute.js";
import { loadRates } from "../rates/load.js";
import { DistanceTooShortError, type QuoteInput } from "../types.js";

const rates = loadRates("2026");
const base: QuoteInput = {
  origin: { county: "Santa Clara" },
  destination: { county: "Los Angeles" },
  distanceMiles: 350,
  weight: { basis: "cube", cubicFeet: 1000 },
  valuation: { tier: "released" },
};

describe("resolveRoute", () => {
  it("resolves origin and destination territories for a valid distance", () => {
    expect(resolveRoute(base, rates)).toEqual({ originTerritory: "A", destTerritory: "B" });
  });
  it("rejects a distance of exactly 100 miles (strictly greater than required)", () => {
    expect(() => resolveRoute({ ...base, distanceMiles: 100 }, rates)).toThrow(DistanceTooShortError);
  });
  it("rejects a distance under 100 miles", () => {
    expect(() => resolveRoute({ ...base, distanceMiles: 50 }, rates)).toThrow(DistanceTooShortError);
  });
});
