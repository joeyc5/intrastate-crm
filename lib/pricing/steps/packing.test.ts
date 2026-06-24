import { describe, it, expect } from "vitest";
import { packing } from "./packing.js";
import { priceQuote } from "../index.js";
import { loadRates } from "../rates/load.js";
import { packingContainers } from "../rates/item340.js";
import { RateDataError, type PackingInput } from "../types.js";

const rates = loadRates("2026");
const dishpack = packingContainers(rates).find((c) => c.label.includes("DISH-PACK"))!.key;

describe("packing step", () => {
  it("prices materials (sale price × qty) and hourly crew labor", () => {
    const input: PackingInput = {
      containers: [{ type: dishpack, qty: 5 }],
      pack: { hours: 3, persons: 2, timeClass: "straight" },
    };
    const r = packing(input, rates, { originTerritory: "A", destTerritory: "B" });
    expect(r.materialsCents).toBe(30175); // 5 × $60.35
    const materials = r.lineItems.find((li) => li.key.startsWith("materials:"))!;
    expect(materials.amountCents).toBe(30175);
    expect(materials.itemRef).toBe("Item 340");
    expect(materials.discountable).toBe(false);
    const labor = r.lineItems.find((li) => li.key === "pack_labor")!;
    expect(labor.amountCents).toBe(56202); // 2 persons × 3 hr × $93.67 (Terr A straight)
    expect(labor.discountable).toBe(false);
  });

  it("uses the destination territory for unpacking labor", () => {
    const input: PackingInput = {
      containers: [],
      unpack: { hours: 2, persons: 1, timeClass: "straight" },
    };
    const r = packing(input, rates, { originTerritory: "A", destTerritory: "B" });
    const labor = r.lineItems.find((li) => li.key === "unpack_labor")!;
    expect(labor.amountCents).toBe(16512); // 1 × 2 hr × $82.56 (Terr B straight)
  });

  it("returns nothing when packing is undefined", () => {
    const r = packing(undefined, rates, { originTerritory: "A", destTerritory: "B" });
    expect(r.lineItems).toEqual([]);
    expect(r.materialsCents).toBe(0);
  });

  it("throws RateDataError on an unknown container type", () => {
    expect(() =>
      packing({ containers: [{ type: "not-a-real-box", qty: 1 }] }, rates, {
        originTerritory: "A",
        destTerritory: "B",
      }),
    ).toThrow(RateDataError);
  });
});

describe("priceQuote with packing", () => {
  const base = {
    origin: { county: "Santa Clara" },
    destination: { county: "Los Angeles" },
    distanceMiles: 110,
    weight: { basis: "scale", pounds: 5000 } as const,
  };

  it("folds materials, labor, and 9.25% materials tax into the NTE", () => {
    const result = priceQuote(
      {
        ...base,
        valuation: { tier: "fvrp250", declaredValueUsd: 20000 },
        packing: { containers: [{ type: dishpack, qty: 5 }], pack: { hours: 3, persons: 2, timeClass: "straight" } },
      },
      rates,
    );
    // line_haul 299750 + valuation 13400 + materials 30175 + pack labor 56202
    expect(result.subtotalCents).toBe(399527);
    expect(result.materialsTaxCents).toBe(2791); // 30175 × 9.25%
    expect(result.nteTotalCents).toBe(402318); // subtotal - 0 discount + tax
  });

  it("taxes materials only, never labor", () => {
    const laborOnly = priceQuote(
      {
        ...base,
        valuation: { tier: "released" },
        packing: { containers: [], pack: { hours: 3, persons: 2, timeClass: "straight" } },
      },
      rates,
    );
    expect(laborOnly.materialsTaxCents).toBe(0);
  });
});
