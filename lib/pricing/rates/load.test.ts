// lib/pricing/rates/load.test.ts
import { describe, it, expect } from "vitest";
import { loadRates, assertItem310Complete } from "./load.js";
import { RateDataError, type Item310Cell } from "../types.js";

describe("loadRates('2026')", () => {
  const rates = loadRates("2026");

  it("stamps the effective date", () => {
    expect(rates.effectiveDate).toBe("2026-01-01");
  });
  it("normalizes item310 rate_per_100lb (dollars) to integer cents", () => {
    const cell = rates.item310.find(
      (c) => c.milesOver === 100 && c.milesNotOver === 120 && c.weightGroupMinLb === 5000,
    );
    expect(cell).toBeDefined();
    expect(cell!.rateCentsPer100).toBe(5995); // $59.95/100 lb
    expect(Number.isInteger(cell!.rateCentsPer100)).toBe(true);
  });
  it("loads the ADD-over-850 row with milesNotOver = null", () => {
    const add = rates.item310.find((c) => c.milesOver === 850 && c.milesNotOver === null && c.weightGroupMinLb === 0);
    expect(add).toBeDefined();
    expect(add!.breakPointLb).toBeNull();
  });
  it("maps Santa Clara to Territory A and Los Angeles to Territory B", () => {
    expect(rates.territories.get("santa clara")).toBe("A");
    expect(rates.territories.get("los angeles")).toBe("B");
  });
  it("loads valuation tiers in integer cents per $100", () => {
    expect(rates.valuationTiers.get("released")!.ratePer100DeclaredCents).toBe(0);
    expect(rates.valuationTiers.get("fvrp250")!.ratePer100DeclaredCents).toBe(67);
    expect(rates.valuationTiers.get("fvrp500")!.ratePer100DeclaredCents).toBe(38);
  });
  it("loads the SVM policy block", () => {
    expect(rates.policy.minWeightFloorLb).toBe(5000);
    expect(rates.policy.constructiveWeightLbPerCf).toBe(7);
    expect(rates.policy.minConstructiveMiles).toBe(100);
    expect(rates.policy.minMilesStrictlyGreater).toBe(true);
    expect(rates.policy.discountPctDefault).toBe(0);
  });
  it("throws RateDataError when the data directory is missing", () => {
    expect(() => loadRates("1999")).toThrow(RateDataError);
  });
});

describe("assertItem310Complete", () => {
  const fullBand = (milesOver: number, milesNotOver: number | null): Item310Cell[] =>
    [0, 1000, 2000, 5000, 8000, 12000, 16000].map((col) => ({
      milesOver,
      milesNotOver,
      weightGroupMinLb: col,
      rateCentsPer100: 5000,
      breakPointLb: null,
    }));

  it("passes when every band has all 7 weight columns", () => {
    const cells = [...fullBand(100, 120), ...fullBand(850, null)];
    expect(() => assertItem310Complete(cells)).not.toThrow();
  });

  it("throws RateDataError when a band is missing a weight column", () => {
    // Remove the 2000 lb column from the 100-120 band.
    const cells = fullBand(100, 120).filter((c) => c.weightGroupMinLb !== 2000);
    expect(() => assertItem310Complete(cells)).toThrow(RateDataError);
  });

  it("includes the band key and missing column in the error message", () => {
    const cells = fullBand(100, 120).filter((c) => c.weightGroupMinLb !== 5000);
    let msg = "";
    try { assertItem310Complete(cells); } catch (e) { msg = (e as Error).message; }
    expect(msg).toContain("100:120");
    expect(msg).toContain("5000");
  });
});
