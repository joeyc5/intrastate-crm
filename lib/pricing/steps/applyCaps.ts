import { CapViolationError, type LineItem } from "../types.js";

export function applyCaps(lineItems: LineItem[]): void {
  for (const li of lineItems) {
    if (li.capCents !== null && li.amountCents > li.capCents) {
      throw new CapViolationError(`${li.label} (${li.amountCents}¢) exceeds its tariff cap (${li.capCents}¢) — ${li.itemRef}.`);
    }
  }
}
