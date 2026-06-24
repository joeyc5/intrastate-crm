// lib/pricing/steps/finalize.test.ts
import { describe, it, expect } from "vitest";
import { applyCaps } from "./applyCaps.js";
import { applyDiscount } from "./applyDiscount.js";
import { total } from "./total.js";
import { CapViolationError, type LineItem } from "../types.js";

function li(over: Partial<LineItem>): LineItem {
  return { key: "k", label: "L", itemRef: "Item X", basis: "b", amountCents: 0, capCents: null, discountable: false, ...over };
}

describe("applyCaps", () => {
  it("passes when amounts are within caps", () => {
    expect(() => applyCaps([li({ amountCents: 100, capCents: 100 })])).not.toThrow();
  });
  it("throws when an amount exceeds its cap", () => {
    expect(() => applyCaps([li({ amountCents: 101, capCents: 100 })])).toThrow(CapViolationError);
  });
});

describe("applyDiscount", () => {
  const items = [
    li({ key: "line_haul", amountCents: 100000, capCents: 100000, discountable: true }),
    li({ key: "valuation", amountCents: 13467, capCents: 13467, discountable: false }),
  ];
  it("discounts only the discountable base", () => {
    // 10% of 100000 = 10000; valuation excluded
    expect(applyDiscount(items, 0.1)).toBe(10000);
  });
  it("returns 0 for a 0% discount", () => {
    expect(applyDiscount(items, 0)).toBe(0);
  });
  it("applies Item 32 half-cent-up rounding", () => {
    // base 100001 * 0.005 = 500.005 -> 500
    expect(applyDiscount([li({ amountCents: 100001, discountable: true })], 0.005)).toBe(500);
    // base 100100 * 0.005 = 500.5 -> 501
    expect(applyDiscount([li({ amountCents: 100100, discountable: true })], 0.005)).toBe(501);
  });
  it("never raises a line (monotonic): more discount, not less", () => {
    expect(applyDiscount(items, 0.2)).toBeGreaterThanOrEqual(applyDiscount(items, 0.1));
  });
  it("rejects an out-of-range pct", () => {
    expect(() => applyDiscount(items, 1.5)).toThrow(RangeError);
  });
});

describe("total", () => {
  const items = [
    li({ amountCents: 100000, capCents: 100000, discountable: true }),
    li({ amountCents: 13467, capCents: 13467, discountable: false }),
  ];
  it("computes subtotal and NTE = subtotal - discount + tax", () => {
    expect(total(items, 10000, 0)).toEqual({ subtotalCents: 113467, nteTotalCents: 103467 });
  });
});
