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
