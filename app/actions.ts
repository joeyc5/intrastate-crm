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
import type { CalcState } from "./lib/types";

// Loaded once per server instance (the rate dataset is static per tariff year).
const rates = loadRates("2026");

export async function calculateQuote(_prev: CalcState, formData: FormData): Promise<CalcState> {
  try {
    const originCounty = String(formData.get("originCounty") ?? "").trim();
    const destCounty = String(formData.get("destCounty") ?? "").trim();
    const distanceMiles = Number(formData.get("distanceMiles"));
    const weightBasis = String(formData.get("weightBasis") ?? "cube");
    const tier = String(formData.get("valuationTier") ?? "");
    const discountRaw = Number(formData.get("discountPct"));

    if (!originCounty || !destCounty) {
      return { ok: false, error: "Please choose both an origin and a destination county." };
    }
    if (!Number.isFinite(distanceMiles) || distanceMiles <= 0) {
      return { ok: false, error: "Enter the move distance in miles." };
    }

    let weight: QuoteInput["weight"];
    if (weightBasis === "scale") {
      const pounds = Number(formData.get("pounds"));
      if (!Number.isFinite(pounds) || pounds <= 0) {
        return { ok: false, error: "Enter the scale weight in pounds." };
      }
      weight = { basis: "scale", pounds };
    } else {
      const cubicFeet = Number(formData.get("cubicFeet"));
      if (!Number.isFinite(cubicFeet) || cubicFeet <= 0) {
        return { ok: false, error: "Enter the estimated cubic feet." };
      }
      weight = { basis: "cube", cubicFeet };
    }

    let valuation: QuoteInput["valuation"];
    if (tier === "released") {
      valuation = { tier: "released" };
    } else if (tier === "fvrp250" || tier === "fvrp500") {
      const declaredValueUsd = Number(formData.get("declaredValueUsd"));
      if (!Number.isFinite(declaredValueUsd) || declaredValueUsd <= 0) {
        return { ok: false, error: "Enter the declared value for Full Value protection." };
      }
      valuation = { tier, declaredValueUsd };
    } else {
      return { ok: false, error: "Please choose a valuation option." };
    }

    if (Number.isFinite(discountRaw) && (discountRaw < 0 || discountRaw > 100)) {
      return { ok: false, error: "Discount must be between 0 and 100%." };
    }
    const discountPct = Number.isFinite(discountRaw) && discountRaw > 0 ? discountRaw / 100 : 0;

    const input: QuoteInput = {
      origin: { county: originCounty },
      destination: { county: destCounty },
      distanceMiles,
      weight,
      valuation,
      discountPct,
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
