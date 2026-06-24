export type Territory = "A" | "B";
export type ValuationTier = "released" | "fvrp250" | "fvrp500";

export type WeightInput =
  | { basis: "cube"; cubicFeet: number }
  | { basis: "scale"; pounds: number };

export type ValuationInput =
  | { tier: "released" }
  | { tier: "fvrp250"; declaredValueUsd: number }
  | { tier: "fvrp500"; declaredValueUsd: number };

export type TimeClass = "straight" | "time_and_half" | "double";

export interface PackingContainerInput {
  type: string; // matches a ContainerRate.key
  qty: number;
}

export interface PackingLaborInput {
  hours: number;
  persons: number;
  timeClass: TimeClass;
}

export interface PackingInput {
  containers: PackingContainerInput[];
  pack?: PackingLaborInput; // hourly crew labor at the ORIGIN territory
  unpack?: PackingLaborInput; // hourly crew labor at the DESTINATION territory
}

export interface QuoteInput {
  origin: { county: string };
  destination: { county: string };
  distanceMiles: number;
  weight: WeightInput;
  minWeightFloorLb?: number;
  valuation: ValuationInput;
  discountPct?: number;
  packing?: PackingInput;
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

export interface ContainerRate {
  key: string; // stable id (the full Item 340 description)
  label: string; // short display label
  salePriceCents: number; // Item 340 ¶1 container sale price (materials, taxable)
  packCents: { A: number; B: number }; // per-container labor (unused in hourly mode)
  unpackCents: { A: number; B: number };
}

export interface PackingHourlyRate {
  perHourPerPersonCents: { A: number; B: number };
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
  item340Containers: Map<string, ContainerRate>; // key -> container rate
  item340Hourly: Map<TimeClass, PackingHourlyRate>;
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
