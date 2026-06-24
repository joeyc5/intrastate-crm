import { describe, it, expect } from "vitest";
import { calculateQuote } from "./actions";
import type { CalcState } from "./lib/types";

const INIT: CalcState = { ok: false };

function fd(entries: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) form.set(key, value);
  return form;
}

describe("calculateQuote server action", () => {
  it("prices a valid move into a Not-to-Exceed total", async () => {
    const state = await calculateQuote(
      INIT,
      fd({
        originCounty: "Santa Clara",
        destCounty: "Los Angeles",
        distanceMiles: "110",
        weightBasis: "scale",
        pounds: "5000",
        valuationTier: "fvrp250",
        declaredValueUsd: "20000",
        discountPct: "0",
      }),
    );
    expect(state.ok).toBe(true);
    // line haul 5,000 lb @ 100–120 mi (299750) + valuation 200×67¢ (13400)
    expect(state.result?.nteTotalCents).toBe(313150);
  });

  it("returns a friendly error for a move of 100 miles or less", async () => {
    const state = await calculateQuote(
      INIT,
      fd({
        originCounty: "Santa Clara",
        destCounty: "Los Angeles",
        distanceMiles: "80",
        weightBasis: "cube",
        cubicFeet: "1000",
        valuationTier: "released",
        discountPct: "0",
      }),
    );
    expect(state.ok).toBe(false);
    expect(state.error).toMatch(/100 miles/);
  });

  it("requires both origin and destination counties", async () => {
    const state = await calculateQuote(
      INIT,
      fd({
        originCounty: "",
        destCounty: "Los Angeles",
        distanceMiles: "200",
        weightBasis: "cube",
        cubicFeet: "1000",
        valuationTier: "released",
        discountPct: "0",
      }),
    );
    expect(state.ok).toBe(false);
    expect(state.error).toBeTruthy();
  });
});
