// lib/pricing/money.test.ts
import { describe, it, expect } from "vitest";
import { dollarStringToCents, roundItem32, nextHundredDollarsUsd } from "./money.js";

describe("dollarStringToCents", () => {
  it("converts dollars to integer cents, float-safe", () => {
    expect(dollarStringToCents("59.95")).toBe(5995);
    expect(dollarStringToCents("114.49")).toBe(11449);
    expect(dollarStringToCents("1.95")).toBe(195);
    expect(dollarStringToCents("0")).toBe(0);
  });
  it("throws on non-numeric", () => {
    expect(() => dollarStringToCents("abc")).toThrow();
  });
});

describe("roundItem32 (half-cent up)", () => {
  it("rounds a half cent up, less than half down", () => {
    expect(roundItem32(100.5)).toBe(101);
    expect(roundItem32(100.49)).toBe(100);
    expect(roundItem32(100)).toBe(100);
    expect(roundItem32(5724.5)).toBe(5725);
  });
});

describe("nextHundredDollarsUsd", () => {
  it("rounds up to the next $100, or fraction thereof", () => {
    expect(nextHundredDollarsUsd(20000)).toBe(20000);
    expect(nextHundredDollarsUsd(20001)).toBe(20100);
    expect(nextHundredDollarsUsd(1)).toBe(100);
    expect(nextHundredDollarsUsd(0)).toBe(0);
  });
});
