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

export type Item320Crew = "one_person_driver" | "two_person_driver_helper" | "additional_person_each";

export interface FlightsInput {
  count: number; // number of flights (an elevator counts as one)
  weightLb: number; // weight of the articles carried up the flights
}
export interface LongCarryInput {
  feet: number; // total carry distance; first 75 ft is free
  weightLb: number; // weight of the articles carried
}
export interface ShuttleInput {
  hours: number;
  persons: number; // crew size
  timeClass: TimeClass;
}
export interface BulkyItemInput {
  type: string; // matches a BulkyArticleRate.key
  qty: number;
}
export interface AccessorialsInput {
  flights?: FlightsInput;
  longCarry?: LongCarryInput;
  shuttle?: ShuttleInput; // Item 184 -> Item 320 hourly, at the ORIGIN territory
  extraStops?: number; // additional pickup/delivery stops beyond the first of each
  bulky?: BulkyItemInput[];
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
  accessorials?: AccessorialsInput;
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

export interface BulkyArticleRate {
  key: string;
  label: string;
  maxChargeCents: number; // Item 164 per-article flat maximum
}

export interface AccessorialRates {
  flightPer100Cents: number; // Item 140 — $2.26 per 100 lb of articles carried (non-discountable)
  extraStopMaxCents: number; // Items 148/152/156 — $134.45 per stop
  shuttleMaxPerHourCents: number; // Item 184 -> Item 320 governing hourly max ($398.40)
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
  item320: Map<string, number>; // `${timeClass}:${crew}:${territory}` -> cents/hour
  item164Bulky: Map<string, BulkyArticleRate>; // key -> bulky article rate
  accessorialRates: AccessorialRates;
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
