"use server";

import {
  priceQuote,
  loadRates,
  DistanceTooShortError,
  ValuationRequiredError,
  RateDataError,
  CapViolationError,
  type QuoteInput,
} from "../lib/pricing";
import type { CalcState, QuoteFormPayload } from "./lib/types";

// Loaded once per server instance (the rate dataset is static per tariff year).
const rates = loadRates("2026");

export async function calculateQuote(_prev: CalcState, payload: QuoteFormPayload): Promise<CalcState> {
  try {
    const originCounty = payload.originCounty.trim();
    const destCounty = payload.destCounty.trim();
    const distanceMiles = Number(payload.distanceMiles);

    if (!originCounty || !destCounty) {
      return { ok: false, error: "Please choose both an origin and a destination county." };
    }
    if (!Number.isFinite(distanceMiles) || distanceMiles <= 0) {
      return { ok: false, error: "Enter the move distance in miles." };
    }

    let weight: QuoteInput["weight"];
    if (payload.weightBasis === "scale") {
      const pounds = Number(payload.pounds);
      if (!Number.isFinite(pounds) || pounds <= 0) {
        return { ok: false, error: "Enter the scale weight in pounds." };
      }
      weight = { basis: "scale", pounds };
    } else {
      const cubicFeet = Number(payload.cubicFeet);
      if (!Number.isFinite(cubicFeet) || cubicFeet <= 0) {
        return { ok: false, error: "Enter the estimated cubic feet." };
      }
      weight = { basis: "cube", cubicFeet };
    }

    const tier = payload.valuationTier;
    let valuation: QuoteInput["valuation"];
    if (tier === "released") {
      valuation = { tier: "released" };
    } else if (tier === "fvrp250" || tier === "fvrp500") {
      const declaredValueUsd = Number(payload.declaredValueUsd);
      if (!Number.isFinite(declaredValueUsd) || declaredValueUsd <= 0) {
        return { ok: false, error: "Enter the declared value for Full Value protection." };
      }
      valuation = { tier, declaredValueUsd };
    } else {
      return { ok: false, error: "Please choose a valuation option." };
    }

    const discountRaw = Number(payload.discountPct);
    if (Number.isFinite(discountRaw) && (discountRaw < 0 || discountRaw > 100)) {
      return { ok: false, error: "Discount must be between 0 and 100%." };
    }
    const discountPct = Number.isFinite(discountRaw) && discountRaw > 0 ? discountRaw / 100 : 0;

    // Packing (optional)
    const containers = payload.containers
      .map((c) => ({ type: c.type, qty: Number(c.qty) }))
      .filter((c) => c.type !== "" && Number.isFinite(c.qty) && c.qty > 0);

    const pack = toLabor(payload.pack);
    const unpack = toLabor(payload.unpack);
    const packing = containers.length > 0 || pack || unpack ? { containers, pack, unpack } : undefined;

    const input: QuoteInput = {
      origin: { county: originCounty },
      destination: { county: destCounty },
      distanceMiles,
      weight,
      valuation,
      discountPct,
      packing,
    };

    return { ok: true, result: priceQuote(input, rates) };
  } catch (e) {
    if (e instanceof DistanceTooShortError) {
      return {
        ok: false,
        error:
          "That distance is 100 miles or less — that's the local/hourly regime this tool doesn't price. Enter a move over 100 miles.",
      };
    }
    if (e instanceof ValuationRequiredError) {
      return { ok: false, error: "Please choose a valuation option (and a declared value for the Full Value tiers)." };
    }
    if (e instanceof RateDataError) {
      return { ok: false, error: `Rate data issue: ${(e as Error).message}` };
    }
    if (e instanceof CapViolationError) {
      return { ok: false, error: `A charge exceeded its tariff cap: ${(e as Error).message}` };
    }
    return { ok: false, error: "Sorry — something went wrong calculating that quote." };
  }
}

function toLabor(
  labor: { hours: string; persons: string; timeClass: string } | undefined,
): { hours: number; persons: number; timeClass: "straight" | "time_and_half" | "double" } | undefined {
  if (!labor) return undefined;
  const hours = Number(labor.hours);
  if (!Number.isFinite(hours) || hours <= 0) return undefined;
  return {
    hours,
    persons: Math.max(1, Math.floor(Number(labor.persons) || 1)),
    timeClass: toTimeClass(labor.timeClass),
  };
}

function toTimeClass(s: string): "straight" | "time_and_half" | "double" {
  return s === "time_and_half" || s === "double" ? s : "straight";
}
