// lib/pricing/types.test.ts
import { describe, it, expect } from "vitest";
import {
  DistanceTooShortError, RateDataError, CapViolationError, ValuationRequiredError,
} from "./types.js";

describe("error classes", () => {
  it("each error has a distinct name and is an Error", () => {
    expect(new DistanceTooShortError("x").name).toBe("DistanceTooShortError");
    expect(new RateDataError("x").name).toBe("RateDataError");
    expect(new CapViolationError("x").name).toBe("CapViolationError");
    expect(new ValuationRequiredError("x").name).toBe("ValuationRequiredError");
    expect(new RateDataError("x")).toBeInstanceOf(Error);
  });
});
