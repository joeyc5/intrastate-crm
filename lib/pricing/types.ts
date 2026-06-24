export type Territory = "A" | "B";
export type ValuationTier = "released" | "fvrp250" | "fvrp500";

export type WeightInput =
  | { basis: "cube"; cubicFeet: number }
  | { basis: "scale"; pounds: number };

export type ValuationInput =
  | { tier: "released" }
  | { tier: "fvrp250"; declaredValueUsd: number }
  | { tier: "fvrp500"; declaredValueUsd: number };

export interface QuoteInput {
  origin: { county: string };
  destination: { county: string };
  distanceMiles: number;
  weight: WeightInput;
  minWeightFloorLb?: number;
  valuation: ValuationInput;
  discountPct?: number;
}

export interface LineItem {
  key: string;
  label: string;
  itemRef: string;
  basis: string;
  amountCents: number;
  capCents: number | null;
  discountable: boolean;
}

export interface QuoteDerived {
  originTerritory: Territory;
  destTerritory: Territory;
  chargeableWeightLb: number;
  weightBasisUsed: "cube" | "scale";
  item310WeightColumnLb: number;
  distanceBandMiles: string;
}

export interface QuoteResult {
  derived: QuoteDerived;
  lineItems: LineItem[];
  subtotalCents: number;
  discountCents: number;
  materialsTaxCents: number;
  nteTotalCents: number;
  warnings: string[];
}

export interface Item310Cell {
  milesOver: number;
  milesNotOver: number | null; // null = the ADD-per-50mi-over-850 row
  weightGroupMinLb: number;    // 0 = the ANY-QTY (<1000) column
  rateCentsPer100: number;     // normalized to integer cents per 100 lb
  breakPointLb: number | null;
}

export interface ValuationTierRate {
  tier: ValuationTier;
  label: string;
  ratePer100DeclaredCents: number;
  deductibleCents: number;
}

export interface PricingPolicy {
  minWeightFloorLb: number;
  discountPctDefault: number;
  constructiveWeightLbPerCf: number;
  minConstructiveMiles: number;
  minMilesStrictlyGreater: boolean;
  weightRoundUpLb: number | null;
  declaredValueRoundUpDollars: number;
  materialsTaxRatePct: number | null;
}

export interface RateTables {
  effectiveDate: string; // e.g. "2026-01-01"
  item310: Item310Cell[];
  territories: Map<string, Territory>; // key = county.trim().toLowerCase()
  valuationTiers: Map<ValuationTier, ValuationTierRate>;
  policy: PricingPolicy;
}

export class DistanceTooShortError extends Error {
  constructor(message: string) { super(message); this.name = "DistanceTooShortError"; }
}
export class RateDataError extends Error {
  constructor(message: string) { super(message); this.name = "RateDataError"; }
}
export class CapViolationError extends Error {
  constructor(message: string) { super(message); this.name = "CapViolationError"; }
}
export class ValuationRequiredError extends Error {
  constructor(message: string) { super(message); this.name = "ValuationRequiredError"; }
}
