// lib/pricing/steps/deriveWeight.test.ts
import { describe, it, expect } from "vitest";
import { deriveWeight } from "./deriveWeight.js";
import { loadRates } from "../rates/load.js";
import type { QuoteInput } from "../types.js";

const rates = loadRates("2026"); // constructive 7 lb/cf, floor 5000

function input(weight: QuoteInput["weight"], minWeightFloorLb?: number): QuoteInput {
  return {
    origin: { county: "Santa Clara" }, destination: { county: "Los Angeles" },
    distanceMiles: 350, weight, minWeightFloorLb, valuation: { tier: "released" },
  };
}

describe("deriveWeight", () => {
  it("computes constructive weight as cubicFeet x 7", () => {
    expect(deriveWeight(input({ basis: "cube", cubicFeet: 1000 }), rates)).toEqual({
      chargeableWeightLb: 7000, weightBasisUsed: "cube",
    });
  });
  it("applies the min-weight floor when constructive weight is below it", () => {
    expect(deriveWeight(input({ basis: "cube", cubicFeet: 100 }), rates).chargeableWeightLb).toBe(5000);
  });
  it("uses scale weight directly", () => {
    expect(deriveWeight(input({ basis: "scale", pounds: 8200 }), rates)).toEqual({
      chargeableWeightLb: 8200, weightBasisUsed: "scale",
    });
  });
  it("honors an input floor override", () => {
    expect(deriveWeight(input({ basis: "scale", pounds: 4000 }, 6000), rates).chargeableWeightLb).toBe(6000);
  });
});
