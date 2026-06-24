import type { LineItem, RateTables } from "../types.js";
import { item310Charge } from "../rates/item310.js";

export function lineHaul(chargeableWeightLb: number, miles: number, rates: RateTables): { lineItem: LineItem; weightColumnLb: number; bandLabel: string } {
  const { amountCents, weightColumnLb, bandLabel } = item310Charge(chargeableWeightLb, miles, rates.item310);
  const lineItem: LineItem = {
    key: "line_haul",
    label: "Line haul (distance)",
    itemRef: "Item 310",
    basis: `${chargeableWeightLb} lb @ ${bandLabel} mi (weight column ${weightColumnLb} lb)`,
    amountCents,
    capCents: amountCents,
    discountable: true,
  };
  return { lineItem, weightColumnLb, bandLabel };
}
