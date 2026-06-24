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
