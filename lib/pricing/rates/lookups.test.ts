// lib/pricing/rates/lookups.test.ts
import { describe, it, expect } from "vitest";
import { territoryForCounty, valuationTierRate } from "./lookups.js";
import { loadRates } from "./load.js";
import { RateDataError } from "../types.js";

const rates = loadRates("2026");

describe("territoryForCounty", () => {
  it("resolves territory case-insensitively", () => {
    expect(territoryForCounty("Santa Clara", rates)).toBe("A");
    expect(territoryForCounty("  los angeles  ", rates)).toBe("B");
  });
  it("throws on an unknown county", () => {
    expect(() => territoryForCounty("Atlantis", rates)).toThrow(RateDataError);
  });
});

describe("valuationTierRate", () => {
  it("returns the tier rate", () => {
    expect(valuationTierRate("fvrp250", rates).ratePer100DeclaredCents).toBe(67);
  });
});
