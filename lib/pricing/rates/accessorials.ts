import {
  RateDataError,
  type BulkyArticleRate,
  type Item320Crew,
  type RateTables,
  type Territory,
  type TimeClass,
} from "../types.js";

/** Bulky-article catalog for the UI. */
export function bulkyArticles(rates: RateTables): { key: string; label: string }[] {
  return [...rates.item164Bulky.values()].map((a) => ({ key: a.key, label: a.label }));
}

export function bulkyArticleRate(key: string, rates: RateTables): BulkyArticleRate {
  const a = rates.item164Bulky.get(key);
  if (!a) throw new RateDataError(`Unknown bulky article "${key}".`);
  return a;
}

function item320Rate(timeClass: TimeClass, crew: Item320Crew, territory: Territory, rates: RateTables): number {
  const v = rates.item320.get(`${timeClass}:${crew}:${territory}`);
  if (v === undefined) throw new RateDataError(`Missing Item 320 rate ${timeClass}:${crew}:${territory}.`);
  return v;
}

/**
 * Shuttle hourly rate (Item 184 → Item 320) for a crew of N persons: 1 = driver
 * only; 2 = driver + helper; each beyond adds an "additional person" rate.
 * Capped at the Item 320 governing max ($398.40/hr).
 */
export function shuttleHourlyCents(persons: number, timeClass: TimeClass, territory: Territory, rates: RateTables): number {
  const n = Math.max(1, Math.floor(persons));
  const cents =
    n === 1
      ? item320Rate(timeClass, "one_person_driver", territory, rates)
      : item320Rate(timeClass, "two_person_driver_helper", territory, rates) +
        (n - 2) * item320Rate(timeClass, "additional_person_each", territory, rates);
  return Math.min(cents, rates.accessorialRates.shuttleMaxPerHourCents);
}
