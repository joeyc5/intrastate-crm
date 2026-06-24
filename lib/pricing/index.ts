import type { QuoteInput, QuoteResult, RateTables } from "./types.js";
import { resolveRoute } from "./steps/resolveRoute.js";
import { deriveWeight } from "./steps/deriveWeight.js";
import { lineHaul } from "./steps/lineHaul.js";
import { valuation } from "./steps/valuation.js";
import { applyCaps } from "./steps/applyCaps.js";
import { applyDiscount } from "./steps/applyDiscount.js";
import { total } from "./steps/total.js";
import { assertInvariants } from "./guardrails/invariants.js";

export function priceQuote(input: QuoteInput, rates: RateTables): QuoteResult {
  const { originTerritory, destTerritory } = resolveRoute(input, rates);
  const { chargeableWeightLb, weightBasisUsed } = deriveWeight(input, rates);

  const lh = lineHaul(chargeableWeightLb, input.distanceMiles, rates);
  const valuationLine = valuation(input, rates);
  const lineItems = [lh.lineItem, valuationLine];

  applyCaps(lineItems);

  const discountPct = input.discountPct ?? rates.policy.discountPctDefault;
  const discountCents = applyDiscount(lineItems, discountPct);
  const materialsTaxCents = 0; // core spine: no materials yet
  const { subtotalCents, nteTotalCents } = total(lineItems, discountCents, materialsTaxCents);

  const result: QuoteResult = {
    derived: {
      originTerritory,
      destTerritory,
      chargeableWeightLb,
      weightBasisUsed,
      item310WeightColumnLb: lh.weightColumnLb,
      distanceBandMiles: lh.bandLabel,
    },
    lineItems,
    subtotalCents,
    discountCents,
    materialsTaxCents,
    nteTotalCents,
    warnings: [],
  };

  assertInvariants(result);
  return result;
}

export { loadRates } from "./rates/load.js";
export { penalty65Tier1, penalty65Tier2 } from "./guardrails/penalty65.js";
export type {
  QuoteInput, QuoteResult, LineItem, QuoteDerived, RateTables,
  Territory, ValuationTier, WeightInput, ValuationInput,
} from "./types.js";
export {
  DistanceTooShortError, RateDataError, CapViolationError, ValuationRequiredError,
} from "./types.js";
