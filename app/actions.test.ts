import { describe, it, expect } from "vitest";
import { calculateQuote } from "./actions";
import type { CalcState, QuoteFormPayload } from "./lib/types";
import { loadRates, packingContainers } from "../lib/pricing";

const INIT: CalcState = { ok: false };
const dishpack = packingContainers(loadRates("2026")).find((c) => c.label.includes("DISH-PACK"))!.key;

function payload(over: Partial<QuoteFormPayload> = {}): QuoteFormPayload {
  return {
    originCounty: "Santa Clara",
    destCounty: "Los Angeles",
    distanceMiles: "350",
    weightBasis: "cube",
    cubicFeet: "1000",
    pounds: "7000",
    valuationTier: "released",
    declaredValueUsd: "20000",
    discountPct: "0",
    containers: [],
    ...over,
  };
}

describe("calculateQuote server action", () => {
  it("prices a valid move into a Not-to-Exceed total", async () => {
    const state = await calculateQuote(
      INIT,
      payload({ distanceMiles: "110", weightBasis: "scale", pounds: "5000", valuationTier: "fvrp250", declaredValueUsd: "20000" }),
    );
    expect(state.ok).toBe(true);
    expect(state.result?.nteTotalCents).toBe(313150);
  });

  it("returns a friendly error for a move of 100 miles or less", async () => {
    const state = await calculateQuote(INIT, payload({ distanceMiles: "80" }));
    expect(state.ok).toBe(false);
    expect(state.error).toMatch(/100 miles/);
  });

  it("requires both origin and destination counties", async () => {
    const state = await calculateQuote(INIT, payload({ originCounty: "" }));
    expect(state.ok).toBe(false);
    expect(state.error).toBeTruthy();
  });

  it("wires packing materials + labor + tax through the action", async () => {
    const state = await calculateQuote(
      INIT,
      payload({
        distanceMiles: "110",
        weightBasis: "scale",
        pounds: "5000",
        valuationTier: "fvrp250",
        declaredValueUsd: "20000",
        containers: [{ type: dishpack, qty: "5" }],
        pack: { hours: "3", persons: "2", timeClass: "straight" },
      }),
    );
    expect(state.ok).toBe(true);
    expect(state.result?.materialsTaxCents).toBe(2791);
    expect(state.result?.nteTotalCents).toBe(402318);
  });
});
