# Pricing Engine (Core Spine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure, fully-tested TypeScript module (`lib/pricing/`) that turns a California intrastate move's inputs into a MAX4-compliant Not-to-Exceed price with an auditable line-item breakdown — covering the *core spine* (line-haul, valuation, discount, caps, totals) only.

**Architecture:** Approach A — a pure calculation module with no DB/network/UI. `index.ts` is the only public surface; `priceQuote(input, rates)` runs small pure `steps/` in order and returns a `QuoteResult`. Rate data loads once from the versioned `data/2026/` files, normalized to integer cents. Test-driven throughout.

**Tech Stack:** TypeScript (strict), Node ESM, Vitest, npm. Source of truth for rates: `data/2026/` (CSV + `svm-config-2026.json`).

**Companion spec:** `docs/superpowers/specs/2026-06-24-pricing-engine-design.md` (read for rationale; this plan is self-contained for implementation).

## Global Constraints

*(Every task's requirements implicitly include this section. Exact values are binding.)*

- **Tariff basis:** MAX4 effective **2026-01-01**; all rate data read from `data/2026/`.
- **Money:** integer **cents** everywhere for stored/returned amounts; **no floating-point dollars** in any returned/stored money value. Source `rate_per_100lb` is in **DOLLARS per 100 lb** → loader normalizes to **integer cents per 100 lb** via `round(dollars × 100)`.
- **Distance floor:** engine **rejects `distanceMiles ≤ 100`** (config `min_constructive_miles: 100`, comparator `strictly_greater_than`) → `DistanceTooShortError`.
- **Weight:** `cube` → `cubicFeet × 7` (config `constructive_weight_lb_per_cf`); `scale` → pounds as-is. Then apply min-weight floor (config `min_weight_lb: 5000`; input may override).
- **Caps:** every regulated line is capped at its tariff max **before** discount; a config-supplied rate above its cap throws `CapViolationError`.
- **Discount:** only ever subtracts; applies **only to lines with `discountable: true`**; valuation defaults `discountable: false`; flights/long-carry and Item 32 fraction results are never discounted (arrive in later passes). Percentage results use **Item 32 half-cent-up** rounding (`roundItem32`).
- **Valuation:** **required** affirmative election — no silent default. Tiers: `released` (0¢), `fvrp250` (67¢ per $100 declared), `fvrp500` (38¢ per $100 declared). Declared value rounds **up to the next $100** (Item 136) before applying the rate.
- **Fail loud:** a missing county / rate / cell, or an un-normalizable unit → `RateDataError`. Never estimate or default a rate.
- **Purity:** `lib/pricing/` only — no database, no network, no UI. `index.ts` is the sole public import surface.
- **Conventions:** 2-space indentation, named exports, TypeScript `strict`, files focused on one responsibility, frequent commits, TDD (test first).

---

### Task 1: Project scaffold + toolchain smoke test

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `lib/pricing/smoke.test.ts` (temporary — deleted at end of task)

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm test` (Vitest) and `npm run typecheck` (tsc) toolchain for all later tasks.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "intrastate-crm",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "noEmit": true
  },
  "include": ["lib"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 4: Create `.gitignore`**

```gitignore
node_modules/
dist/
.DS_Store
*.log
.remember/
```

- [ ] **Step 5: Create a temporary smoke test `lib/pricing/smoke.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("toolchain", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Install and run**

Run: `npm install && npm test`
Expected: Vitest runs, 1 test passes.

- [ ] **Step 7: Delete the smoke test**

Run: `rm lib/pricing/smoke.test.ts`

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore
git commit -m "chore: scaffold TypeScript + Vitest toolchain for pricing engine"
```

---

### Task 2: Shared types + typed errors (`types.ts`)

**Files:**
- Create: `lib/pricing/types.ts`
- Test: `lib/pricing/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Territory`, `ValuationTier`, `QuoteInput`, `WeightInput`, `ValuationInput`, `LineItem`, `QuoteDerived`, `QuoteResult`, `Item310Cell`, `ValuationTierRate`, `PricingPolicy`, `RateTables`; error classes `DistanceTooShortError`, `RateDataError`, `CapViolationError`, `ValuationRequiredError` (each with a distinct `.name`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/types.test.ts
import { describe, it, expect } from "vitest";
import {
  DistanceTooShortError, RateDataError, CapViolationError, ValuationRequiredError,
} from "./types.js";

describe("error classes", () => {
  it("each error has a distinct name and is an Error", () => {
    expect(new DistanceTooShortError("x").name).toBe("DistanceTooShortError");
    expect(new RateDataError("x").name).toBe("RateDataError");
    expect(new CapViolationError("x").name).toBe("CapViolationError");
    expect(new ValuationRequiredError("x").name).toBe("ValuationRequiredError");
    expect(new RateDataError("x")).toBeInstanceOf(Error);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/pricing/types.test.ts`
Expected: FAIL — cannot find module `./types.js`.

- [ ] **Step 3: Write `lib/pricing/types.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/pricing/types.test.ts && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/pricing/types.ts lib/pricing/types.test.ts
git commit -m "feat: pricing engine shared types and typed errors"
```

---

### Task 3: Money helpers (`money.ts`)

**Files:**
- Create: `lib/pricing/money.ts`
- Test: `lib/pricing/money.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `dollarStringToCents(s: string): number` — parse a decimal-dollar string to integer cents (float-safe).
  - `roundItem32(cents: number): number` — Item 32 half-cent-up rounding of a (possibly fractional) cents value.
  - `nextHundredDollarsUsd(usd: number): number` — Item 136 round up to next $100.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/money.test.ts
import { describe, it, expect } from "vitest";
import { dollarStringToCents, roundItem32, nextHundredDollarsUsd } from "./money.js";

describe("dollarStringToCents", () => {
  it("converts dollars to integer cents, float-safe", () => {
    expect(dollarStringToCents("59.95")).toBe(5995);
    expect(dollarStringToCents("114.49")).toBe(11449);
    expect(dollarStringToCents("1.95")).toBe(195);
    expect(dollarStringToCents("0")).toBe(0);
  });
  it("throws on non-numeric", () => {
    expect(() => dollarStringToCents("abc")).toThrow();
  });
});

describe("roundItem32 (half-cent up)", () => {
  it("rounds a half cent up, less than half down", () => {
    expect(roundItem32(100.5)).toBe(101);
    expect(roundItem32(100.49)).toBe(100);
    expect(roundItem32(100)).toBe(100);
    expect(roundItem32(5724.5)).toBe(5725);
  });
});

describe("nextHundredDollarsUsd", () => {
  it("rounds up to the next $100, or fraction thereof", () => {
    expect(nextHundredDollarsUsd(20000)).toBe(20000);
    expect(nextHundredDollarsUsd(20001)).toBe(20100);
    expect(nextHundredDollarsUsd(1)).toBe(100);
    expect(nextHundredDollarsUsd(0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/pricing/money.test.ts`
Expected: FAIL — cannot find module `./money.js`.

- [ ] **Step 3: Write `lib/pricing/money.ts`**

```ts
export function dollarStringToCents(s: string): number {
  const n = Number(s);
  if (!Number.isFinite(n)) {
    throw new Error(`dollarStringToCents: not a number: "${s}"`);
  }
  return Math.round(n * 100);
}

// Item 32: a fraction of a cent of one-half or more rounds up to the next
// whole cent; less than one-half is dropped. (Round-half-up on the cents value.)
export function roundItem32(cents: number): number {
  return Math.floor(cents + 0.5);
}

// Item 136: declared value is taken to the next $100 "or fraction thereof".
export function nextHundredDollarsUsd(usd: number): number {
  return Math.ceil(usd / 100) * 100;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/pricing/money.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/pricing/money.ts lib/pricing/money.test.ts
git commit -m "feat: integer-cent money helpers (Item 32 + Item 136 rounding)"
```

---

### Task 4: CSV parser + rate loader (`rates/csv.ts`, `rates/load.ts`)

**Files:**
- Create: `lib/pricing/rates/csv.ts`
- Create: `lib/pricing/rates/load.ts`
- Test: `lib/pricing/rates/csv.test.ts`
- Test: `lib/pricing/rates/load.test.ts`

**Interfaces:**
- Consumes: `dollarStringToCents` (money.ts); `RateTables`, `Item310Cell`, `ValuationTierRate`, `PricingPolicy`, `Territory`, `ValuationTier`, `RateDataError` (types.ts).
- Produces:
  - `parseCsv(text: string): Record<string, string>[]` — RFC4180-lite (handles quoted fields with embedded commas and `""` escapes).
  - `loadRates(version: string, dataRoot?: string): RateTables` — reads `data/<version>/item310_distance_rates.csv`, `territories.csv`, `svm-config-<version>.json`; normalizes money to integer cents; validates; returns an immutable `RateTables`. `dataRoot` defaults to `join(process.cwd(), "data")`.

- [ ] **Step 1: Write the failing test for the CSV parser**

```ts
// lib/pricing/rates/csv.test.ts
import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv.js";

describe("parseCsv", () => {
  it("parses simple rows into header-keyed objects", () => {
    const rows = parseCsv("a,b,c\n1,2,3\n4,5,6\n");
    expect(rows).toEqual([
      { a: "1", b: "2", c: "3" },
      { a: "4", b: "5", c: "6" },
    ]);
  });
  it("handles quoted fields with embedded commas and escaped quotes", () => {
    const rows = parseCsv('item,notes\n164,"a, b, and ""c"""\n');
    expect(rows[0]).toEqual({ item: "164", notes: 'a, b, and "c"' });
  });
  it("treats a trailing empty cell as empty string (not missing)", () => {
    const rows = parseCsv("miles_over,miles_not_over,rate\n850,,1.95\n");
    expect(rows[0]).toEqual({ miles_over: "850", miles_not_over: "", rate: "1.95" });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/pricing/rates/csv.test.ts`
Expected: FAIL — cannot find module `./csv.js`.

- [ ] **Step 3: Write `lib/pricing/rates/csv.ts`**

```ts
export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  const header = nonEmpty.shift();
  if (!header) return [];
  return nonEmpty.map((cols) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => { obj[h.trim()] = (cols[idx] ?? "").trim(); });
    return obj;
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/pricing/rates/csv.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the loader (uses real `data/2026/`)**

```ts
// lib/pricing/rates/load.test.ts
import { describe, it, expect } from "vitest";
import { loadRates } from "./load.js";
import { RateDataError } from "../types.js";

describe("loadRates('2026')", () => {
  const rates = loadRates("2026");

  it("stamps the effective date", () => {
    expect(rates.effectiveDate).toBe("2026-01-01");
  });
  it("normalizes item310 rate_per_100lb (dollars) to integer cents", () => {
    const cell = rates.item310.find(
      (c) => c.milesOver === 100 && c.milesNotOver === 120 && c.weightGroupMinLb === 5000,
    );
    expect(cell).toBeDefined();
    expect(cell!.rateCentsPer100).toBe(5995); // $59.95/100 lb
    expect(Number.isInteger(cell!.rateCentsPer100)).toBe(true);
  });
  it("loads the ADD-over-850 row with milesNotOver = null", () => {
    const add = rates.item310.find((c) => c.milesOver === 850 && c.milesNotOver === null && c.weightGroupMinLb === 0);
    expect(add).toBeDefined();
    expect(add!.breakPointLb).toBeNull();
  });
  it("maps Santa Clara to Territory A and Los Angeles to Territory B", () => {
    expect(rates.territories.get("santa clara")).toBe("A");
    expect(rates.territories.get("los angeles")).toBe("B");
  });
  it("loads valuation tiers in integer cents per $100", () => {
    expect(rates.valuationTiers.get("released")!.ratePer100DeclaredCents).toBe(0);
    expect(rates.valuationTiers.get("fvrp250")!.ratePer100DeclaredCents).toBe(67);
    expect(rates.valuationTiers.get("fvrp500")!.ratePer100DeclaredCents).toBe(38);
  });
  it("loads the SVM policy block", () => {
    expect(rates.policy.minWeightFloorLb).toBe(5000);
    expect(rates.policy.constructiveWeightLbPerCf).toBe(7);
    expect(rates.policy.minConstructiveMiles).toBe(100);
    expect(rates.policy.minMilesStrictlyGreater).toBe(true);
    expect(rates.policy.discountPctDefault).toBe(0);
  });
  it("throws RateDataError when the data directory is missing", () => {
    expect(() => loadRates("1999")).toThrow(RateDataError);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run lib/pricing/rates/load.test.ts`
Expected: FAIL — cannot find module `./load.js`.

- [ ] **Step 7: Write `lib/pricing/rates/load.ts`**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "./csv.js";
import { dollarStringToCents } from "../money.js";
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

function num(value: string, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new RateDataError(`Bad numeric "${value}" in ${label}`);
  return n;
}

function loadItem310(path: string): Item310Cell[] {
  const rows = parseCsv(readFileOrThrow(path));
  if (rows.length === 0) throw new RateDataError(`Empty item310 file: ${path}`);
  return rows.map((r) => ({
    milesOver: num(r.miles_over, "item310.miles_over"),
    milesNotOver: r.miles_not_over === "" ? null : num(r.miles_not_over, "item310.miles_not_over"),
    weightGroupMinLb: num(r.weight_group_min_lb, "item310.weight_group_min_lb"),
    rateCentsPer100: dollarStringToCents(r.rate_per_100lb),
    breakPointLb: r.break_point_lb === "" ? null : num(r.break_point_lb, "item310.break_point_lb"),
  }));
}

function loadTerritories(path: string): Map<string, Territory> {
  const rows = parseCsv(readFileOrThrow(path));
  const map = new Map<string, Territory>();
  for (const r of rows) {
    const t = r.territory as Territory;
    if (t !== "A" && t !== "B") throw new RateDataError(`Bad territory "${r.territory}" for ${r.county}`);
    map.set(r.county.trim().toLowerCase(), t);
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
  return {
    effectiveDate: `${version}-01-01`,
    item310,
    territories,
    valuationTiers: buildValuationTiers(config),
    policy: buildPolicy(config),
  };
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx vitest run lib/pricing/rates/load.test.ts && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 9: Commit**

```bash
git add lib/pricing/rates/csv.ts lib/pricing/rates/load.ts lib/pricing/rates/csv.test.ts lib/pricing/rates/load.test.ts
git commit -m "feat: CSV parser + fail-loud rate loader (dollars->cents normalization)"
```

---

### Task 5: Item 310 line-haul + weight-break (`rates/item310.ts`)

**Files:**
- Create: `lib/pricing/rates/item310.ts`
- Test: `lib/pricing/rates/item310.test.ts`

**Interfaces:**
- Consumes: `Item310Cell`, `RateDataError` (types.ts); `loadRates` (load.ts, for golden tests).
- Produces: `item310Charge(weightLb: number, miles: number, cells: Item310Cell[]): { amountCents: number; weightColumnLb: number; bandLabel: string }` — resolves the over/not-over mileage band (per-50mi add beyond 850), runs the weight-break optimization across the 7 minimum-weight columns, returns the **cheapest** charge and the winning column.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/rates/item310.test.ts
import { describe, it, expect } from "vitest";
import { item310Charge } from "./item310.js";
import { loadRates } from "./load.js";
import type { Item310Cell } from "../types.js";

// Tiny synthetic band for isolated weight-break logic: 100-120 mi, two columns.
const SYNTH: Item310Cell[] = [
  { milesOver: 100, milesNotOver: 120, weightGroupMinLb: 0, rateCentsPer100: 10000, breakPointLb: 500 },
  { milesOver: 100, milesNotOver: 120, weightGroupMinLb: 1000, rateCentsPer100: 5000, breakPointLb: null },
];

describe("item310Charge weight-break (synthetic)", () => {
  it("uses the any-qty column below the break point", () => {
    // 400 lb: anyqty = 400*10000/100 = 40000; bump-to-1000 = 1000*5000/100 = 50000 -> anyqty cheaper
    const r = item310Charge(400, 110, SYNTH);
    expect(r.amountCents).toBe(40000);
    expect(r.weightColumnLb).toBe(0);
  });
  it("bumps up to the 1000 column above the break point", () => {
    // 600 lb: anyqty = 60000; bump = 50000 -> bump cheaper
    const r = item310Charge(600, 110, SYNTH);
    expect(r.amountCents).toBe(50000);
    expect(r.weightColumnLb).toBe(1000);
  });
});

describe("item310Charge against real 2026 data", () => {
  const rates = loadRates("2026");
  it("prices 5,000 lb at 110 mi from the 100-120 band", () => {
    const r = item310Charge(5000, 110, rates.item310);
    // 5,000 lb in the 5000 column, $59.95/100 lb -> 5000 * 5995 / 100 = 299750 cents
    expect(r.amountCents).toBe(299750);
    expect(r.weightColumnLb).toBe(5000);
    expect(r.bandLabel).toBe("100–120");
  });
  it("computed 5000-column crossover matches the published break point", () => {
    const band5000 = rates.item310.find((c) => c.milesOver === 100 && c.milesNotOver === 120 && c.weightGroupMinLb === 5000)!;
    const band8000 = rates.item310.find((c) => c.milesOver === 100 && c.milesNotOver === 120 && c.weightGroupMinLb === 8000)!;
    // crossover W: W * rate5000 == 8000 * rate8000  ->  W = 8000 * rate8000 / rate5000
    const crossover = (8000 * band8000.rateCentsPer100) / band5000.rateCentsPer100;
    expect(Math.round(crossover)).toBe(band5000.breakPointLb);
  });
  it("applies the per-50mi add beyond 850 miles", () => {
    const r = item310Charge(5000, 900, rates.item310);
    const base = rates.item310.find((c) => c.milesOver === 800 && c.milesNotOver === 850 && c.weightGroupMinLb === 5000)!;
    const add = rates.item310.find((c) => c.milesOver === 850 && c.milesNotOver === null && c.weightGroupMinLb === 5000)!;
    const inc = Math.ceil((900 - 850) / 50); // = 1
    const expected = Math.round((5000 * (base.rateCentsPer100 + inc * add.rateCentsPer100)) / 100);
    // 900 mi may weight-break to a higher column; assert it is no more than the 5000-column figure
    expect(r.amountCents).toBeLessThanOrEqual(expected);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/pricing/rates/item310.test.ts`
Expected: FAIL — cannot find module `./item310.js`.

- [ ] **Step 3: Write `lib/pricing/rates/item310.ts`**

```ts
import { RateDataError, type Item310Cell } from "../types.js";

const WEIGHT_COLUMNS = [0, 1000, 2000, 5000, 8000, 12000, 16000] as const;

function cellsForBand(cells: Item310Cell[], milesOver: number, milesNotOver: number | null): Map<number, Item310Cell> {
  const map = new Map<number, Item310Cell>();
  for (const c of cells) {
    if (c.milesOver === milesOver && c.milesNotOver === milesNotOver) map.set(c.weightGroupMinLb, c);
  }
  return map;
}

export function item310Charge(
  weightLb: number,
  miles: number,
  cells: Item310Cell[],
): { amountCents: number; weightColumnLb: number; bandLabel: string } {
  if (!(miles > 0)) throw new RateDataError(`Invalid distance: ${miles}`);

  let rateFor: (col: number) => number;
  let bandLabel: string;

  if (miles <= 850) {
    let over: number | null = null;
    let notOver: number | null = null;
    for (const c of cells) {
      if (c.milesNotOver !== null && c.milesOver < miles && miles <= c.milesNotOver) {
        over = c.milesOver; notOver = c.milesNotOver; break;
      }
    }
    if (over === null || notOver === null) throw new RateDataError(`No Item 310 mileage band for ${miles} mi`);
    const map = cellsForBand(cells, over, notOver);
    rateFor = (col) => {
      const cell = map.get(col);
      if (!cell) throw new RateDataError(`Missing Item 310 cell ${over}-${notOver} col ${col}`);
      return cell.rateCentsPer100;
    };
    bandLabel = `${over}–${notOver}`;
  } else {
    const base = cellsForBand(cells, 800, 850);
    const add = cellsForBand(cells, 850, null);
    const inc = Math.ceil((miles - 850) / 50);
    rateFor = (col) => {
      const b = base.get(col);
      const a = add.get(col);
      if (!b || !a) throw new RateDataError(`Missing Item 310 over-850 cell col ${col}`);
      return b.rateCentsPer100 + inc * a.rateCentsPer100;
    };
    bandLabel = `over 850 (+${inc}×50)`;
  }

  let best: { amountCents: number; weightColumnLb: number } | null = null;
  for (const col of WEIGHT_COLUMNS) {
    const billed = weightLb >= col ? weightLb : col;
    const amountCents = Math.round((billed * rateFor(col)) / 100);
    if (best === null || amountCents < best.amountCents) best = { amountCents, weightColumnLb: col };
  }
  if (!best) throw new RateDataError("Item 310: no weight columns configured");
  return { ...best, bandLabel };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/pricing/rates/item310.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/pricing/rates/item310.ts lib/pricing/rates/item310.test.ts
git commit -m "feat: Item 310 line-haul lookup with weight-break optimization"
```

---

### Task 6: Lookups — territory + valuation tier (`rates/lookups.ts`)

**Files:**
- Create: `lib/pricing/rates/lookups.ts`
- Test: `lib/pricing/rates/lookups.test.ts`

**Interfaces:**
- Consumes: `RateTables`, `Territory`, `ValuationTier`, `ValuationTierRate`, `RateDataError` (types.ts); `loadRates` (load.ts) in tests.
- Produces:
  - `territoryForCounty(county: string, rates: RateTables): Territory` — case-insensitive; throws `RateDataError` if unknown.
  - `valuationTierRate(tier: ValuationTier, rates: RateTables): ValuationTierRate` — throws `RateDataError` if unknown.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/rates/lookups.test.ts
import { describe, it, expect } from "vitest";
import { territoryForCounty, valuationTierRate } from "./lookups.js";
import { loadRates } from "./load.js";
import { RateDataError } from "../types.js";

const rates = loadRates("2026");

describe("territoryForCounty", () => {
  it("resolves territory case-insensitively", () => {
    expect(territoryForCounty("Santa Clara", rates)).toBe("A");
    expect(territoryForCounty("  los angeles  ", rates)).toBe("B");
  });
  it("throws on an unknown county", () => {
    expect(() => territoryForCounty("Atlantis", rates)).toThrow(RateDataError);
  });
});

describe("valuationTierRate", () => {
  it("returns the tier rate", () => {
    expect(valuationTierRate("fvrp250", rates).ratePer100DeclaredCents).toBe(67);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/pricing/rates/lookups.test.ts`
Expected: FAIL — cannot find module `./lookups.js`.

- [ ] **Step 3: Write `lib/pricing/rates/lookups.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/pricing/rates/lookups.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/pricing/rates/lookups.ts lib/pricing/rates/lookups.test.ts
git commit -m "feat: territory + valuation-tier lookups (fail-loud)"
```

---

### Task 7: Step — resolve route (`steps/resolveRoute.ts`)

**Files:**
- Create: `lib/pricing/steps/resolveRoute.ts`
- Test: `lib/pricing/steps/resolveRoute.test.ts`

**Interfaces:**
- Consumes: `QuoteInput`, `RateTables`, `Territory`, `DistanceTooShortError` (types.ts); `territoryForCounty` (rates/lookups.ts); `loadRates` (load.ts) in tests.
- Produces: `resolveRoute(input: QuoteInput, rates: RateTables): { originTerritory: Territory; destTerritory: Territory }` — throws `DistanceTooShortError` when distance is not over the floor.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/steps/resolveRoute.test.ts
import { describe, it, expect } from "vitest";
import { resolveRoute } from "./resolveRoute.js";
import { loadRates } from "../rates/load.js";
import { DistanceTooShortError, type QuoteInput } from "../types.js";

const rates = loadRates("2026");
const base: QuoteInput = {
  origin: { county: "Santa Clara" },
  destination: { county: "Los Angeles" },
  distanceMiles: 350,
  weight: { basis: "cube", cubicFeet: 1000 },
  valuation: { tier: "released" },
};

describe("resolveRoute", () => {
  it("resolves origin and destination territories for a valid distance", () => {
    expect(resolveRoute(base, rates)).toEqual({ originTerritory: "A", destTerritory: "B" });
  });
  it("rejects a distance of exactly 100 miles (strictly greater than required)", () => {
    expect(() => resolveRoute({ ...base, distanceMiles: 100 }, rates)).toThrow(DistanceTooShortError);
  });
  it("rejects a distance under 100 miles", () => {
    expect(() => resolveRoute({ ...base, distanceMiles: 50 }, rates)).toThrow(DistanceTooShortError);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/pricing/steps/resolveRoute.test.ts`
Expected: FAIL — cannot find module `./resolveRoute.js`.

- [ ] **Step 3: Write `lib/pricing/steps/resolveRoute.ts`**

```ts
import { DistanceTooShortError, type QuoteInput, type RateTables, type Territory } from "../types.js";
import { territoryForCounty } from "../rates/lookups.js";

export function resolveRoute(input: QuoteInput, rates: RateTables): { originTerritory: Territory; destTerritory: Territory } {
  const { policy } = rates;
  const overFloor = policy.minMilesStrictlyGreater
    ? input.distanceMiles > policy.minConstructiveMiles
    : input.distanceMiles >= policy.minConstructiveMiles;
  if (!overFloor) {
    throw new DistanceTooShortError(
      `Distance ${input.distanceMiles} mi is not over the ${policy.minConstructiveMiles}-mile floor; this needs the hourly/local tool.`,
    );
  }
  return {
    originTerritory: territoryForCounty(input.origin.county, rates),
    destTerritory: territoryForCounty(input.destination.county, rates),
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/pricing/steps/resolveRoute.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/pricing/steps/resolveRoute.ts lib/pricing/steps/resolveRoute.test.ts
git commit -m "feat: resolveRoute step (>100mi gate + territories)"
```

---

### Task 8: Step — derive weight (`steps/deriveWeight.ts`)

**Files:**
- Create: `lib/pricing/steps/deriveWeight.ts`
- Test: `lib/pricing/steps/deriveWeight.test.ts`

**Interfaces:**
- Consumes: `QuoteInput`, `RateTables` (types.ts); `loadRates` (load.ts) in tests.
- Produces: `deriveWeight(input: QuoteInput, rates: RateTables): { chargeableWeightLb: number; weightBasisUsed: "cube" | "scale" }`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/steps/deriveWeight.test.ts
import { describe, it, expect } from "vitest";
import { deriveWeight } from "./deriveWeight.js";
import { loadRates } from "../rates/load.js";
import type { QuoteInput } from "../types.js";

const rates = loadRates("2026"); // constructive 7 lb/cf, floor 5000

function input(weight: QuoteInput["weight"], minWeightFloorLb?: number): QuoteInput {
  return {
    origin: { county: "Santa Clara" }, destination: { county: "Los Angeles" },
    distanceMiles: 350, weight, minWeightFloorLb, valuation: { tier: "released" },
  };
}

describe("deriveWeight", () => {
  it("computes constructive weight as cubicFeet x 7", () => {
    expect(deriveWeight(input({ basis: "cube", cubicFeet: 1000 }), rates)).toEqual({
      chargeableWeightLb: 7000, weightBasisUsed: "cube",
    });
  });
  it("applies the min-weight floor when constructive weight is below it", () => {
    expect(deriveWeight(input({ basis: "cube", cubicFeet: 100 }), rates).chargeableWeightLb).toBe(5000);
  });
  it("uses scale weight directly", () => {
    expect(deriveWeight(input({ basis: "scale", pounds: 8200 }), rates)).toEqual({
      chargeableWeightLb: 8200, weightBasisUsed: "scale",
    });
  });
  it("honors an input floor override", () => {
    expect(deriveWeight(input({ basis: "scale", pounds: 4000 }, 6000), rates).chargeableWeightLb).toBe(6000);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/pricing/steps/deriveWeight.test.ts`
Expected: FAIL — cannot find module `./deriveWeight.js`.

- [ ] **Step 3: Write `lib/pricing/steps/deriveWeight.ts`**

```ts
import type { QuoteInput, RateTables } from "../types.js";

export function deriveWeight(input: QuoteInput, rates: RateTables): { chargeableWeightLb: number; weightBasisUsed: "cube" | "scale" } {
  const { policy } = rates;
  let derived: number;
  let weightBasisUsed: "cube" | "scale";

  if (input.weight.basis === "cube") {
    derived = input.weight.cubicFeet * policy.constructiveWeightLbPerCf;
    weightBasisUsed = "cube";
  } else {
    derived = input.weight.pounds;
    weightBasisUsed = "scale";
  }

  if (policy.weightRoundUpLb && policy.weightRoundUpLb > 0) {
    derived = Math.ceil(derived / policy.weightRoundUpLb) * policy.weightRoundUpLb;
  }

  const floor = input.minWeightFloorLb ?? policy.minWeightFloorLb;
  return { chargeableWeightLb: Math.max(derived, floor), weightBasisUsed };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/pricing/steps/deriveWeight.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/pricing/steps/deriveWeight.ts lib/pricing/steps/deriveWeight.test.ts
git commit -m "feat: deriveWeight step (cube x7 / scale + min-weight floor)"
```

---

### Task 9: Step — line haul (`steps/lineHaul.ts`)

**Files:**
- Create: `lib/pricing/steps/lineHaul.ts`
- Test: `lib/pricing/steps/lineHaul.test.ts`

**Interfaces:**
- Consumes: `LineItem`, `RateTables` (types.ts); `item310Charge` (rates/item310.ts); `loadRates` (load.ts) in tests.
- Produces: `lineHaul(chargeableWeightLb: number, miles: number, rates: RateTables): { lineItem: LineItem; weightColumnLb: number; bandLabel: string }` — a discountable `line_haul` LineItem whose `capCents` equals its amount (Item 310 is itself the ceiling).

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/steps/lineHaul.test.ts
import { describe, it, expect } from "vitest";
import { lineHaul } from "./lineHaul.js";
import { loadRates } from "../rates/load.js";

const rates = loadRates("2026");

describe("lineHaul", () => {
  it("produces a capped, discountable line_haul item", () => {
    const { lineItem, weightColumnLb, bandLabel } = lineHaul(5000, 110, rates);
    expect(lineItem.key).toBe("line_haul");
    expect(lineItem.itemRef).toBe("Item 310");
    expect(lineItem.amountCents).toBe(299750);
    expect(lineItem.capCents).toBe(299750);
    expect(lineItem.discountable).toBe(true);
    expect(weightColumnLb).toBe(5000);
    expect(bandLabel).toBe("100–120");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/pricing/steps/lineHaul.test.ts`
Expected: FAIL — cannot find module `./lineHaul.js`.

- [ ] **Step 3: Write `lib/pricing/steps/lineHaul.ts`**

```ts
import type { LineItem, RateTables } from "../types.js";
import { item310Charge } from "../rates/item310.js";

export function lineHaul(chargeableWeightLb: number, miles: number, rates: RateTables): { lineItem: LineItem; weightColumnLb: number; bandLabel: string } {
  const { amountCents, weightColumnLb, bandLabel } = item310Charge(chargeableWeightLb, miles, rates.item310);
  const lineItem: LineItem = {
    key: "line_haul",
    label: "Line haul (distance)",
    itemRef: "Item 310",
    basis: `${chargeableWeightLb} lb @ ${bandLabel} mi (weight column ${weightColumnLb} lb)`,
    amountCents,
    capCents: amountCents,
    discountable: true,
  };
  return { lineItem, weightColumnLb, bandLabel };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/pricing/steps/lineHaul.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/pricing/steps/lineHaul.ts lib/pricing/steps/lineHaul.test.ts
git commit -m "feat: lineHaul step (Item 310 line item)"
```

---

### Task 10: Step — valuation (`steps/valuation.ts`)

**Files:**
- Create: `lib/pricing/steps/valuation.ts`
- Test: `lib/pricing/steps/valuation.test.ts`

**Interfaces:**
- Consumes: `QuoteInput`, `LineItem`, `RateTables`, `ValuationRequiredError`, `RateDataError` (types.ts); `valuationTierRate` (rates/lookups.ts); `nextHundredDollarsUsd` (money.ts); `loadRates` (load.ts) in tests.
- Produces: `valuation(input: QuoteInput, rates: RateTables): LineItem` — `released` → $0; FVRP → `ceil(declared/100) × ratePer100`; `discountable: false`, `capCents = amountCents`. Throws `ValuationRequiredError` when the election or a required declared value is missing.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/steps/valuation.test.ts
import { describe, it, expect } from "vitest";
import { valuation } from "./valuation.js";
import { loadRates } from "../rates/load.js";
import { ValuationRequiredError, type QuoteInput } from "../types.js";

const rates = loadRates("2026");
function input(v: QuoteInput["valuation"]): QuoteInput {
  return { origin: { county: "Santa Clara" }, destination: { county: "Los Angeles" }, distanceMiles: 350, weight: { basis: "cube", cubicFeet: 1000 }, valuation: v };
}

describe("valuation", () => {
  it("released is $0 and non-discountable", () => {
    const li = valuation(input({ tier: "released" }), rates);
    expect(li.amountCents).toBe(0);
    expect(li.discountable).toBe(false);
    expect(li.capCents).toBe(0);
  });
  it("fvrp250 rounds declared value up to next $100 then applies 67c/$100", () => {
    // $20,001 -> $20,100 -> 201 * 67 = 13467 cents
    const li = valuation(input({ tier: "fvrp250", declaredValueUsd: 20001 }), rates);
    expect(li.amountCents).toBe(13467);
    expect(li.itemRef).toBe("Item 136");
  });
  it("fvrp500 applies 38c/$100", () => {
    // $30,000 -> 300 * 38 = 11400 cents
    const li = valuation(input({ tier: "fvrp500", declaredValueUsd: 30000 }), rates);
    expect(li.amountCents).toBe(11400);
  });
  it("throws when an FVRP tier has no declared value", () => {
    // @ts-expect-error intentionally missing declaredValueUsd
    expect(() => valuation(input({ tier: "fvrp250" }), rates)).toThrow(ValuationRequiredError);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/pricing/steps/valuation.test.ts`
Expected: FAIL — cannot find module `./valuation.js`.

- [ ] **Step 3: Write `lib/pricing/steps/valuation.ts`**

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/pricing/steps/valuation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/pricing/steps/valuation.ts lib/pricing/steps/valuation.test.ts
git commit -m "feat: valuation step (required election, Item 136 rounding)"
```

---

### Task 11: Finalize trio — caps, discount, total (`steps/applyCaps.ts`, `steps/applyDiscount.ts`, `steps/total.ts`)

**Files:**
- Create: `lib/pricing/steps/applyCaps.ts`
- Create: `lib/pricing/steps/applyDiscount.ts`
- Create: `lib/pricing/steps/total.ts`
- Test: `lib/pricing/steps/finalize.test.ts`

**Interfaces:**
- Consumes: `LineItem`, `CapViolationError` (types.ts); `roundItem32` (money.ts).
- Produces:
  - `applyCaps(lineItems: LineItem[]): void` — throws `CapViolationError` if any `amountCents > capCents`.
  - `applyDiscount(lineItems: LineItem[], discountPct: number): number` — returns `discountCents = roundItem32(eligibleBase × pct)`; `eligibleBase` = Σ of `discountable` lines; throws `RangeError` if pct out of 0..1.
  - `total(lineItems: LineItem[], discountCents: number, materialsTaxCents: number): { subtotalCents: number; nteTotalCents: number }`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/steps/finalize.test.ts
import { describe, it, expect } from "vitest";
import { applyCaps } from "./applyCaps.js";
import { applyDiscount } from "./applyDiscount.js";
import { total } from "./total.js";
import { CapViolationError, type LineItem } from "../types.js";

function li(over: Partial<LineItem>): LineItem {
  return { key: "k", label: "L", itemRef: "Item X", basis: "b", amountCents: 0, capCents: null, discountable: false, ...over };
}

describe("applyCaps", () => {
  it("passes when amounts are within caps", () => {
    expect(() => applyCaps([li({ amountCents: 100, capCents: 100 })])).not.toThrow();
  });
  it("throws when an amount exceeds its cap", () => {
    expect(() => applyCaps([li({ amountCents: 101, capCents: 100 })])).toThrow(CapViolationError);
  });
});

describe("applyDiscount", () => {
  const items = [
    li({ key: "line_haul", amountCents: 100000, capCents: 100000, discountable: true }),
    li({ key: "valuation", amountCents: 13467, capCents: 13467, discountable: false }),
  ];
  it("discounts only the discountable base", () => {
    // 10% of 100000 = 10000; valuation excluded
    expect(applyDiscount(items, 0.1)).toBe(10000);
  });
  it("returns 0 for a 0% discount", () => {
    expect(applyDiscount(items, 0)).toBe(0);
  });
  it("applies Item 32 half-cent-up rounding", () => {
    // base 100001 * 0.005 = 500.005 -> 500
    expect(applyDiscount([li({ amountCents: 100001, discountable: true })], 0.005)).toBe(500);
    // base 100100 * 0.005 = 500.5 -> 501
    expect(applyDiscount([li({ amountCents: 100100, discountable: true })], 0.005)).toBe(501);
  });
  it("never raises a line (monotonic): more discount, not less", () => {
    expect(applyDiscount(items, 0.2)).toBeGreaterThanOrEqual(applyDiscount(items, 0.1));
  });
  it("rejects an out-of-range pct", () => {
    expect(() => applyDiscount(items, 1.5)).toThrow(RangeError);
  });
});

describe("total", () => {
  const items = [
    li({ amountCents: 100000, capCents: 100000, discountable: true }),
    li({ amountCents: 13467, capCents: 13467, discountable: false }),
  ];
  it("computes subtotal and NTE = subtotal - discount + tax", () => {
    expect(total(items, 10000, 0)).toEqual({ subtotalCents: 113467, nteTotalCents: 103467 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/pricing/steps/finalize.test.ts`
Expected: FAIL — cannot find the three modules.

- [ ] **Step 3: Write `lib/pricing/steps/applyCaps.ts`**

```ts
import { CapViolationError, type LineItem } from "../types.js";

export function applyCaps(lineItems: LineItem[]): void {
  for (const li of lineItems) {
    if (li.capCents !== null && li.amountCents > li.capCents) {
      throw new CapViolationError(`${li.label} (${li.amountCents}¢) exceeds its tariff cap (${li.capCents}¢) — ${li.itemRef}.`);
    }
  }
}
```

- [ ] **Step 4: Write `lib/pricing/steps/applyDiscount.ts`**

```ts
import type { LineItem } from "../types.js";
import { roundItem32 } from "../money.js";

export function applyDiscount(lineItems: LineItem[], discountPct: number): number {
  if (discountPct < 0 || discountPct > 1) throw new RangeError(`discountPct ${discountPct} out of range 0..1`);
  if (discountPct === 0) return 0;
  const base = lineItems.filter((li) => li.discountable).reduce((sum, li) => sum + li.amountCents, 0);
  return roundItem32(base * discountPct);
}
```

- [ ] **Step 5: Write `lib/pricing/steps/total.ts`**

```ts
import type { LineItem } from "../types.js";

export function total(lineItems: LineItem[], discountCents: number, materialsTaxCents: number): { subtotalCents: number; nteTotalCents: number } {
  const subtotalCents = lineItems.reduce((sum, li) => sum + li.amountCents, 0);
  return { subtotalCents, nteTotalCents: subtotalCents - discountCents + materialsTaxCents };
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `npx vitest run lib/pricing/steps/finalize.test.ts`
Expected: PASS (all cases).

- [ ] **Step 7: Commit**

```bash
git add lib/pricing/steps/applyCaps.ts lib/pricing/steps/applyDiscount.ts lib/pricing/steps/total.ts lib/pricing/steps/finalize.test.ts
git commit -m "feat: finalize trio — caps, discount (eligible base), total"
```

---

### Task 12: Guardrails — invariants + 65% penalty (`guardrails/invariants.ts`, `guardrails/penalty65.ts`)

**Files:**
- Create: `lib/pricing/guardrails/invariants.ts`
- Create: `lib/pricing/guardrails/penalty65.ts`
- Test: `lib/pricing/guardrails/guardrails.test.ts`

**Interfaces:**
- Consumes: `QuoteResult`, `LineItem` (types.ts); `roundItem32` (money.ts).
- Produces:
  - `assertInvariants(result: QuoteResult): void` — throws `Error` if any line is negative, discount < 0, NTE < 0, or `(nteTotalCents − materialsTaxCents) > Σ capCents` (tax is a pass-through above the capped charges).
  - `penalty65Tier1(maxCents: number): number` — `roundItem32(maxCents × 0.65)`.
  - `penalty65Tier2(maxCents: number, estimateCents: number, agreementCents: number): number` — `min(tier1, estimate, agreement)`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/guardrails/guardrails.test.ts
import { describe, it, expect } from "vitest";
import { assertInvariants } from "./invariants.js";
import { penalty65Tier1, penalty65Tier2 } from "./penalty65.js";
import type { QuoteResult } from "../types.js";

function result(over: Partial<QuoteResult>): QuoteResult {
  return {
    derived: { originTerritory: "A", destTerritory: "B", chargeableWeightLb: 5000, weightBasisUsed: "cube", item310WeightColumnLb: 5000, distanceBandMiles: "100–120" },
    lineItems: [{ key: "line_haul", label: "L", itemRef: "Item 310", basis: "b", amountCents: 100000, capCents: 100000, discountable: true }],
    subtotalCents: 100000, discountCents: 0, materialsTaxCents: 0, nteTotalCents: 100000, warnings: [],
    ...over,
  };
}

describe("assertInvariants", () => {
  it("passes a well-formed result", () => {
    expect(() => assertInvariants(result({}))).not.toThrow();
  });
  it("throws when NTE exceeds the sum of caps", () => {
    expect(() => assertInvariants(result({ nteTotalCents: 100001 }))).toThrow();
  });
  it("allows materials tax above the cap sum (tax is a pass-through)", () => {
    expect(() => assertInvariants(result({ materialsTaxCents: 500, nteTotalCents: 100500 }))).not.toThrow();
  });
  it("throws on a negative discount", () => {
    expect(() => assertInvariants(result({ discountCents: -1 }))).toThrow();
  });
});

describe("penalty65", () => {
  it("tier 1 is 65% of max (half-cent up)", () => {
    expect(penalty65Tier1(100000)).toBe(65000);
    expect(penalty65Tier1(101)).toBe(66); // 101*0.65 = 65.65 -> 66
  });
  it("tier 2 is the lowest of {65% max, estimate, agreement}", () => {
    expect(penalty65Tier2(100000, 70000, 90000)).toBe(65000);
    expect(penalty65Tier2(100000, 60000, 90000)).toBe(60000);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/pricing/guardrails/guardrails.test.ts`
Expected: FAIL — cannot find the two modules.

- [ ] **Step 3: Write `lib/pricing/guardrails/invariants.ts`**

```ts
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
```

- [ ] **Step 4: Write `lib/pricing/guardrails/penalty65.ts`**

```ts
import { roundItem32 } from "../money.js";

// Item 28 ¶3 Tier 1: charges for undescribed/unquoted services drop to 65% of max.
export function penalty65Tier1(maxCents: number): number {
  return roundItem32(maxCents * 0.65);
}

// Item 28 ¶3 Tier 2: a defective Agreement (no NTE / missing signature) caps all
// charges at the lowest of {65% of max, Estimate rates, Agreement rates}.
export function penalty65Tier2(maxCents: number, estimateCents: number, agreementCents: number): number {
  return Math.min(penalty65Tier1(maxCents), estimateCents, agreementCents);
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run lib/pricing/guardrails/guardrails.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/pricing/guardrails/invariants.ts lib/pricing/guardrails/penalty65.ts lib/pricing/guardrails/guardrails.test.ts
git commit -m "feat: guardrails — runtime invariants + Item 28 65% penalty"
```

---

### Task 13: Orchestration — `priceQuote` + end-to-end golden tests (`index.ts`)

**Files:**
- Create: `lib/pricing/index.ts`
- Test: `lib/pricing/index.test.ts`

**Interfaces:**
- Consumes: every step + guardrail above; `loadRates` (rates/load.ts); `QuoteInput`, `QuoteResult`, `RateTables` (types.ts).
- Produces: `priceQuote(input: QuoteInput, rates: RateTables): QuoteResult` — the sole public pricing entry. Re-exports `loadRates` and the public types/errors so the rest of the app imports only from `lib/pricing`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pricing/index.test.ts
import { describe, it, expect } from "vitest";
import { priceQuote, loadRates } from "./index.js";
import { DistanceTooShortError, type QuoteInput } from "./types.js";

const rates = loadRates("2026");
const base: QuoteInput = {
  origin: { county: "Santa Clara" },
  destination: { county: "Los Angeles" },
  distanceMiles: 110,
  weight: { basis: "scale", pounds: 5000 },
  valuation: { tier: "fvrp250", declaredValueUsd: 20000 },
};

describe("priceQuote end-to-end", () => {
  it("prices line-haul + valuation into an NTE with full breakdown", () => {
    const r = priceQuote(base, rates);
    // line haul 5000 lb @ 100-120 mi = 299750; valuation 20000 -> 200*67 = 13400
    expect(r.lineItems.map((li) => li.key)).toEqual(["line_haul", "valuation"]);
    expect(r.subtotalCents).toBe(299750 + 13400);
    expect(r.discountCents).toBe(0);
    expect(r.nteTotalCents).toBe(313150);
    expect(r.derived.originTerritory).toBe("A");
    expect(r.derived.destTerritory).toBe("B");
    expect(r.derived.item310WeightColumnLb).toBe(5000);
  });

  it("applies a discount to line-haul only, never to valuation", () => {
    const r = priceQuote({ ...base, discountPct: 0.1 }, rates);
    // 10% of line-haul 299750 = 29975; valuation untouched
    expect(r.discountCents).toBe(29975);
    expect(r.nteTotalCents).toBe(299750 + 13400 - 29975);
  });

  it("a bigger discount never raises the NTE (property)", () => {
    const lo = priceQuote({ ...base, discountPct: 0.1 }, rates).nteTotalCents;
    const hi = priceQuote({ ...base, discountPct: 0.2 }, rates).nteTotalCents;
    expect(hi).toBeLessThanOrEqual(lo);
  });

  it("the NTE never exceeds the sum of caps (property)", () => {
    const r = priceQuote({ ...base, discountPct: 0.15 }, rates);
    const capSum = r.lineItems.reduce((s, li) => s + (li.capCents ?? li.amountCents), 0);
    expect(r.nteTotalCents - r.materialsTaxCents).toBeLessThanOrEqual(capSum);
  });

  it("blocks a <=100-mile move", () => {
    expect(() => priceQuote({ ...base, distanceMiles: 80 }, rates)).toThrow(DistanceTooShortError);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/pricing/index.test.ts`
Expected: FAIL — cannot find module `./index.js`.

- [ ] **Step 3: Write `lib/pricing/index.ts`**

```ts
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
```

- [ ] **Step 4: Run the full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS — every test across all tasks green; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/pricing/index.ts lib/pricing/index.test.ts
git commit -m "feat: priceQuote orchestration + end-to-end golden/property tests"
```

---

## Self-Review (author checklist — completed)

**1. Spec coverage** — every spec section maps to a task:
- §3 architecture/file layout → Tasks 1–13 (the files match the spec's `lib/pricing/` tree).
- §4 contract (types) → Task 2.
- §5 rate-data layer + Item 310 weight-break + dollars→cents → Tasks 4 & 5.
- §6 pipeline steps 1–7 → Tasks 7 (resolveRoute), 8 (deriveWeight), 9 (lineHaul), 10 (valuation), 11 (applyCaps/applyDiscount/total).
- §6 guardrails (invariants, penalty65) → Task 12.
- §7 compliance invariants → enforced in Tasks 5/9 (caps=amount), 11 (caps + discount carve-out), 12 (invariants).
- §8 money/rounding → Task 3.
- §9 typed errors → Task 2 (defined), thrown in Tasks 4/5/6/7/10/11.
- §10 testing (golden, property, crossover) → Tasks 5 & 13.
- §11 open items → encoded as defaults (valuation required & non-discountable; floor 5000; distance as input).
- §12 "done" → Task 13's full-suite green.

**2. Placeholder scan** — no "TBD/TODO/handle edge cases/similar to Task N"; every code step shows complete code.

**3. Type consistency** — `Item310Cell`, `RateTables`, `LineItem`, `PricingPolicy`, `QuoteInput/Result` defined once in Task 2 and consumed with identical names/shapes throughout; function names (`item310Charge`, `territoryForCounty`, `valuationTierRate`, `resolveRoute`, `deriveWeight`, `lineHaul`, `valuation`, `applyCaps`, `applyDiscount`, `total`, `assertInvariants`, `priceQuote`, `loadRates`) are used identically across consumer tasks.

---

## Execution notes
- **Branch/worktree:** start implementation on an isolated branch/worktree (per `superpowers:using-git-worktrees`), not on `main`.
- **Model guidance:** Tasks 1–3, 6–11 are mechanical (cheap model); Tasks 4, 5, 13 carry the most judgment (standard model). Reviews scaled to diff risk.
- **Out of scope here (later passes/sub-projects):** packing (Item 340), accessorials (Items 140/164/184/148-156), materials tax wiring, GPS distance integration, CRM/PDF/paperwork.
