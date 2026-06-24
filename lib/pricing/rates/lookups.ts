import { RateDataError, type RateTables, type Territory, type ValuationTier, type ValuationTierRate } from "../types.js";

export function territoryForCounty(county: string, rates: RateTables): Territory {
  const t = rates.territories.get(county.trim().toLowerCase());
  if (!t) throw new RateDataError(`Unknown CA county "${county}" — not in the Item 210 territory table.`);
  return t;
}

export function valuationTierRate(tier: ValuationTier, rates: RateTables): ValuationTierRate {
  const r = rates.valuationTiers.get(tier);
  if (!r) throw new RateDataError(`Unknown valuation tier "${tier}".`);
  return r;
}
