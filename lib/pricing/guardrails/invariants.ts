import type { QuoteResult } from "../types.js";

export function assertInvariants(result: QuoteResult): void {
  for (const li of result.lineItems) {
    if (li.amountCents < 0) throw new Error(`Invariant violated: negative line "${li.key}"`);
  }
  if (result.discountCents < 0) throw new Error("Invariant violated: negative discount");
  if (result.nteTotalCents < 0) throw new Error("Invariant violated: negative NTE");
  const capSum = result.lineItems.reduce((sum, li) => sum + (li.capCents ?? li.amountCents), 0);
  if (result.nteTotalCents - result.materialsTaxCents > capSum) {
    throw new Error(`Invariant violated: NTE (${result.nteTotalCents}¢ less tax) exceeds sum of caps (${capSum}¢)`);
  }
}
