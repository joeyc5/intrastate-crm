import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "./csv.js";
import { dollarStringToCents } from "../money.js";
import { ITEM310_WEIGHT_COLUMNS } from "./constants.js";
import {
  RateDataError,
  type Item310Cell,
  type PricingPolicy,
  type RateTables,
  type Territory,
  type ValuationTier,
  type ValuationTierRate,
} from "../types.js";

function readFileOrThrow(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new RateDataError(`Missing rate file: ${path}`);
  }
}

function num(value: string | undefined, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new RateDataError(`Bad numeric "${String(value)}" in ${label}`);
  return n;
}

function req(value: string | undefined, label: string): string {
  if (value === undefined) throw new RateDataError(`Missing field ${label}`);
  return value;
}

export { ITEM310_WEIGHT_COLUMNS };

export function assertItem310Complete(cells: Item310Cell[]): void {
  // Group cells by mileage band; each band must have all 7 weight columns.
  const bands = new Map<string, Set<number>>();
  for (const c of cells) {
    const key = `${c.milesOver}:${c.milesNotOver}`;
    const existing = bands.get(key) ?? new Set<number>();
    existing.add(c.weightGroupMinLb);
    bands.set(key, existing);
  }
  for (const [bandKey, cols] of bands) {
    for (const required of ITEM310_WEIGHT_COLUMNS) {
      if (!cols.has(required)) {
        throw new RateDataError(
          `Item 310 data incomplete: band "${bandKey}" is missing weight column ${required} lb`,
        );
      }
    }
  }
}

function loadItem310(path: string): Item310Cell[] {
  const rows = parseCsv(readFileOrThrow(path));
  if (rows.length === 0) throw new RateDataError(`Empty item310 file: ${path}`);
  const cells = rows.map((r) => ({
    milesOver: num(r.miles_over, "item310.miles_over"),
    milesNotOver: r.miles_not_over === "" ? null : num(r.miles_not_over, "item310.miles_not_over"),
    weightGroupMinLb: num(r.weight_group_min_lb, "item310.weight_group_min_lb"),
    rateCentsPer100: dollarStringToCents(req(r.rate_per_100lb, "item310.rate_per_100lb")),
    breakPointLb: r.break_point_lb === "" ? null : num(r.break_point_lb, "item310.break_point_lb"),
  }));
  assertItem310Complete(cells);
  return cells;
}

function loadTerritories(path: string): Map<string, Territory> {
  const rows = parseCsv(readFileOrThrow(path));
  const map = new Map<string, Territory>();
  for (const r of rows) {
    const t = r.territory as Territory;
    if (t !== "A" && t !== "B") throw new RateDataError(`Bad territory "${String(r.territory)}" for ${String(r.county)}`);
    map.set(req(r.county, "territories.county").trim().toLowerCase(), t);
  }
  if (map.size === 0) throw new RateDataError(`Empty territories file: ${path}`);
  return map;
}

interface ConfigShape {
  pricing: {
    discount_pct_default: number;
    min_weight_lb: number;
    constructive_weight_lb_per_cf: number;
    min_constructive_miles: number;
    min_miles_comparator: string;
    materials_tax_rate_pct: number | null;
  };
  rounding: { weight_round_up_lb: number | null; declared_value_round_up_dollars: number };
  valuation: {
    tiers: Array<{ tier: string; label: string; rate_per_100_declared_cents: number; deductible_cents: number }>;
  };
}

function loadConfig(path: string): ConfigShape {
  try {
    return JSON.parse(readFileOrThrow(path)) as ConfigShape;
  } catch (e) {
    if (e instanceof RateDataError) throw e;
    throw new RateDataError(`Bad config JSON: ${path}`);
  }
}

function buildValuationTiers(config: ConfigShape): Map<ValuationTier, ValuationTierRate> {
  const map = new Map<ValuationTier, ValuationTierRate>();
  for (const t of config.valuation.tiers) {
    map.set(t.tier as ValuationTier, {
      tier: t.tier as ValuationTier,
      label: t.label,
      ratePer100DeclaredCents: t.rate_per_100_declared_cents,
      deductibleCents: t.deductible_cents,
    });
  }
  for (const required of ["released", "fvrp250", "fvrp500"] as const) {
    if (!map.has(required)) throw new RateDataError(`Missing valuation tier "${required}" in config`);
  }
  return map;
}

function buildPolicy(config: ConfigShape): PricingPolicy {
  return {
    minWeightFloorLb: config.pricing.min_weight_lb,
    discountPctDefault: config.pricing.discount_pct_default,
    constructiveWeightLbPerCf: config.pricing.constructive_weight_lb_per_cf,
    minConstructiveMiles: config.pricing.min_constructive_miles,
    minMilesStrictlyGreater: config.pricing.min_miles_comparator === "strictly_greater_than",
    weightRoundUpLb: config.rounding.weight_round_up_lb,
    declaredValueRoundUpDollars: config.rounding.declared_value_round_up_dollars,
    materialsTaxRatePct: config.pricing.materials_tax_rate_pct,
  };
}

export function loadRates(version: string, dataRoot = join(process.cwd(), "data")): RateTables {
  const dir = join(dataRoot, version);
  const item310 = loadItem310(join(dir, "item310_distance_rates.csv"));
  const territories = loadTerritories(join(dir, "territories.csv"));
  const config = loadConfig(join(dir, `svm-config-${version}.json`));
  const tables: RateTables = {
    effectiveDate: `${version}-01-01`,
    item310,
    territories,
    valuationTiers: buildValuationTiers(config),
    policy: buildPolicy(config),
  };
  // Spec §5: loadRates returns an immutable RateTables. Freeze the top-level
  // object so the loaded dataset can't be reassigned by consumers.
  return Object.freeze(tables);
}
