// lib/pricing/steps/lineHaul.test.ts
import { describe, it, expect } from "vitest";
import { lineHaul } from "./lineHaul.js";
import { loadRates } from "../rates/load.js";

const rates = loadRates("2026");

describe("lineHaul", () => {
  it("produces a capped, discountable line_haul item", () => {
    const { lineItem, weightColumnLb, bandLabel } = lineHaul(5000, 110, rates);
    expect(lineItem.key).toBe("line_haul");
    expect(lineItem.itemRef).toBe("Item 310");
    expect(lineItem.amountCents).toBe(299750);
    expect(lineItem.capCents).toBe(299750);
    expect(lineItem.discountable).toBe(true);
    expect(weightColumnLb).toBe(5000);
    expect(bandLabel).toBe("100–120");
  });
});
