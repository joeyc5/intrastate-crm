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
