import type { LineItem } from "../types.js";

export function total(lineItems: LineItem[], discountCents: number, materialsTaxCents: number): { subtotalCents: number; nteTotalCents: number } {
  const subtotalCents = lineItems.reduce((sum, li) => sum + li.amountCents, 0);
  return { subtotalCents, nteTotalCents: subtotalCents - discountCents + materialsTaxCents };
}
