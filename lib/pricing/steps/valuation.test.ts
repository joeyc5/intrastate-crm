// lib/pricing/steps/valuation.test.ts
import { describe, it, expect } from "vitest";
import { valuation } from "./valuation.js";
import { loadRates } from "../rates/load.js";
import { ValuationRequiredError, type QuoteInput } from "../types.js";

const rates = loadRates("2026");
function input(v: QuoteInput["valuation"]): QuoteInput {
  return { origin: { county: "Santa Clara" }, destination: { county: "Los Angeles" }, distanceMiles: 350, weight: { basis: "cube", cubicFeet: 1000 }, valuation: v };
}

describe("valuation", () => {
  it("released is $0 and non-discountable", () => {
    const li = valuation(input({ tier: "released" }), rates);
    expect(li.amountCents).toBe(0);
    expect(li.discountable).toBe(false);
    expect(li.capCents).toBe(0);
  });
  it("fvrp250 rounds declared value up to next $100 then applies 67c/$100", () => {
    // $20,001 -> $20,100 -> 201 * 67 = 13467 cents
    const li = valuation(input({ tier: "fvrp250", declaredValueUsd: 20001 }), rates);
    expect(li.amountCents).toBe(13467);
    expect(li.itemRef).toBe("Item 136");
  });
  it("fvrp500 applies 38c/$100", () => {
    // $30,000 -> 300 * 38 = 11400 cents
    const li = valuation(input({ tier: "fvrp500", declaredValueUsd: 30000 }), rates);
    expect(li.amountCents).toBe(11400);
  });
  it("throws when an FVRP tier has no declared value", () => {
    // @ts-expect-error intentionally missing declaredValueUsd
    expect(() => valuation(input({ tier: "fvrp250" }), rates)).toThrow(ValuationRequiredError);
  });
});
