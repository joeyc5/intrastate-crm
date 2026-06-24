// lib/pricing/guardrails/guardrails.test.ts
import { describe, it, expect } from "vitest";
import { assertInvariants } from "./invariants.js";
import { penalty65Tier1, penalty65Tier2 } from "./penalty65.js";
import type { QuoteResult } from "../types.js";

function result(over: Partial<QuoteResult>): QuoteResult {
  return {
    derived: { originTerritory: "A", destTerritory: "B", chargeableWeightLb: 5000, weightBasisUsed: "cube", item310WeightColumnLb: 5000, distanceBandMiles: "100–120" },
    lineItems: [{ key: "line_haul", label: "L", itemRef: "Item 310", basis: "b", amountCents: 100000, capCents: 100000, discountable: true }],
    subtotalCents: 100000, discountCents: 0, materialsTaxCents: 0, nteTotalCents: 100000, warnings: [],
    ...over,
  };
}

describe("assertInvariants", () => {
  it("passes a well-formed result", () => {
    expect(() => assertInvariants(result({}))).not.toThrow();
  });
  it("throws when NTE exceeds the sum of caps", () => {
    expect(() => assertInvariants(result({ nteTotalCents: 100001 }))).toThrow();
  });
  it("allows materials tax above the cap sum (tax is a pass-through)", () => {
    expect(() => assertInvariants(result({ materialsTaxCents: 500, nteTotalCents: 100500 }))).not.toThrow();
  });
  it("throws on a negative discount", () => {
    expect(() => assertInvariants(result({ discountCents: -1 }))).toThrow();
  });
});

describe("penalty65", () => {
  it("tier 1 is 65% of max (half-cent up)", () => {
    expect(penalty65Tier1(100000)).toBe(65000);
    expect(penalty65Tier1(101)).toBe(66); // 101*0.65 = 65.65 -> 66
  });
  it("tier 2 is the lowest of {65% max, estimate, agreement}", () => {
    expect(penalty65Tier2(100000, 70000, 90000)).toBe(65000);
    expect(penalty65Tier2(100000, 60000, 90000)).toBe(60000);
  });
});
