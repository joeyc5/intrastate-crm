import type { LineItem } from "../types.js";
import { roundItem32 } from "../money.js";

export function applyDiscount(lineItems: LineItem[], discountPct: number): number {
  if (discountPct < 0 || discountPct > 1) throw new RangeError(`discountPct ${discountPct} out of range 0..1`);
  if (discountPct === 0) return 0;
  const base = lineItems.filter((li) => li.discountable).reduce((sum, li) => sum + li.amountCents, 0);
  return roundItem32(base * discountPct);
}
