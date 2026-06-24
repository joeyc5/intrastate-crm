import { ValuationRequiredError, type LineItem, type QuoteInput, type RateTables } from "../types.js";
import { valuationTierRate } from "../rates/lookups.js";
import { nextHundredDollarsUsd } from "../money.js";

export function valuation(input: QuoteInput, rates: RateTables): LineItem {
  const v = input.valuation;
  if (!v || !v.tier) throw new ValuationRequiredError("A signed valuation election is required.");

  const tierRate = valuationTierRate(v.tier, rates);
  let amountCents = 0;
  let basis = tierRate.label;

  if (v.tier !== "released") {
    const declared = v.declaredValueUsd;
    if (typeof declared !== "number" || !Number.isFinite(declared) || declared <= 0) {
      throw new ValuationRequiredError(`Valuation tier "${v.tier}" requires a declared value.`);
    }
    const hundreds = nextHundredDollarsUsd(declared) / 100;
    amountCents = hundreds * tierRate.ratePer100DeclaredCents;
    basis = `${tierRate.label}; $${declared} declared → ${hundreds} × ${tierRate.ratePer100DeclaredCents}¢/$100`;
  }

  return {
    key: "valuation",
    label: "Valuation (liability coverage)",
    itemRef: "Item 136",
    basis,
    amountCents,
    capCents: amountCents,
    discountable: false,
  };
}
