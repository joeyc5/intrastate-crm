import type { QuoteInput, QuoteResult, RateTables } from "./types.js";
import { resolveRoute } from "./steps/resolveRoute.js";
import { deriveWeight } from "./steps/deriveWeight.js";
import { lineHaul } from "./steps/lineHaul.js";
import { valuation } from "./steps/valuation.js";
import { applyCaps } from "./steps/applyCaps.js";
import { applyDiscount } from "./steps/applyDiscount.js";
import { total } from "./steps/total.js";
import { packing } from "./steps/packing.js";
import { accessorials } from "./steps/accessorials.js";
import { roundItem32 } from "./money.js";
import { assertInvariants } from "./guardrails/invariants.js";

export function priceQuote(input: QuoteInput, rates: RateTables): QuoteResult {
  const { originTerritory, destTerritory } = resolveRoute(input, rates);
  const { chargeableWeightLb, weightBasisUsed } = deriveWeight(input, rates);

  const lh = lineHaul(chargeableWeightLb, input.distanceMiles, rates);
  const valuationLine = valuation(input, rates);
  const lineItems = [lh.lineItem, valuationLine];

  const pack = packing(input.packing, rates, { originTerritory, destTerritory });
  lineItems.push(...pack.lineItems);

  lineItems.push(...accessorials(input.accessorials, rates, { originTerritory, destTerritory }));

  applyCaps(lineItems);

  const discountPct = input.discountPct ?? rates.policy.discountPctDefault;
  const discountCents = applyDiscount(lineItems, discountPct);

  const warnings: string[] = [];
  let materialsTaxCents = 0;
  if (pack.materialsCents > 0) {
    const taxPct = rates.policy.materialsTaxRatePct;
    if (taxPct == null) {
      warnings.push("Materials sales tax is not configured — confirm the Santa Clara County rate.");
    } else {
      materialsTaxCents = roundItem32((pack.materialsCents * taxPct) / 100);
    }
  }

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
    warnings,
  };

  assertInvariants(result);
  return result;
}

export { loadRates } from "./rates/load.js";
export { packingContainers } from "./rates/item340.js";
export { bulkyArticles } from "./rates/accessorials.js";
export { penalty65Tier1, penalty65Tier2 } from "./guardrails/penalty65.js";
export type {
  QuoteInput, QuoteResult, LineItem, QuoteDerived, RateTables,
  Territory, ValuationTier, WeightInput, ValuationInput,
  PackingInput, PackingContainerInput, PackingLaborInput, TimeClass, ContainerRate,
  AccessorialsInput, FlightsInput, LongCarryInput, ShuttleInput, BulkyItemInput, BulkyArticleRate,
} from "./types.js";
export {
  DistanceTooShortError, RateDataError, CapViolationError, ValuationRequiredError,
} from "./types.js";
