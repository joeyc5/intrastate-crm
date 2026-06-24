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
    bulky: [],
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

  it("wires accessorials (flights, shuttle, extra stops) through the action", async () => {
    const state = await calculateQuote(
      INIT,
      payload({
        distanceMiles: "110",
        weightBasis: "scale",
        pounds: "5000",
        valuationTier: "fvrp250",
        declaredValueUsd: "20000",
        flights: { count: "2", weightLb: "700" },
        shuttle: { hours: "4", persons: "2", timeClass: "straight" },
        extraStops: "2",
      }),
    );
    expect(state.ok).toBe(true);
    const items = state.result!.lineItems;
    expect(items.find((i) => i.key === "flights")?.amountCents).toBe(3164); // 2 × 7 × $2.26
    expect(items.find((i) => i.key === "shuttle")?.amountCents).toBe(93756); // 4 hr × $234.39 (Terr A, 2-person straight)
    expect(items.find((i) => i.key === "extra_stops")?.amountCents).toBe(26890); // 2 × $134.45
  });

  it("wires long carry through the action (beyond the free 75 ft)", async () => {
    const state = await calculateQuote(
      INIT,
      payload({
        distanceMiles: "110",
        weightBasis: "scale",
        pounds: "5000",
        longCarry: { feet: "175", weightLb: "1000" },
      }),
    );
    expect(state.ok).toBe(true);
    expect(state.result!.lineItems.find((i) => i.key === "long_carry")?.amountCents).toBe(4520); // 2 × 10 × $2.26
  });

  it("ignores empty accessorial inputs (zeros add no lines)", async () => {
    const state = await calculateQuote(
      INIT,
      payload({
        flights: { count: "0", weightLb: "0" },
        shuttle: { hours: "0", persons: "2", timeClass: "straight" },
        extraStops: "0",
        bulky: [],
      }),
    );
    expect(state.ok).toBe(true);
    const keys = state.result!.lineItems.map((i) => i.key);
    expect(keys.some((k) => k === "flights" || k === "shuttle" || k === "extra_stops" || k.startsWith("bulky:"))).toBe(false);
  });
});
