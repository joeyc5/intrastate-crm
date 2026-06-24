// lib/pricing/rates/csv.test.ts
import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv.js";

describe("parseCsv", () => {
  it("parses simple rows into header-keyed objects", () => {
    const rows = parseCsv("a,b,c\n1,2,3\n4,5,6\n");
    expect(rows).toEqual([
      { a: "1", b: "2", c: "3" },
      { a: "4", b: "5", c: "6" },
    ]);
  });
  it("handles quoted fields with embedded commas and escaped quotes", () => {
    const rows = parseCsv('item,notes\n164,"a, b, and ""c"""\n');
    expect(rows[0]).toEqual({ item: "164", notes: 'a, b, and "c"' });
  });
  it("treats a trailing empty cell as empty string (not missing)", () => {
    const rows = parseCsv("miles_over,miles_not_over,rate\n850,,1.95\n");
    expect(rows[0]).toEqual({ miles_over: "850", miles_not_over: "", rate: "1.95" });
  });
});
