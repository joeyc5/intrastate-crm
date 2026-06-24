import {
  RateDataError,
  type ContainerRate,
  type PackingHourlyRate,
  type RateTables,
  type TimeClass,
} from "../types.js";

/** The packing-material catalog for the UI: stable key + short label, sorted. */
export function packingContainers(rates: RateTables): { key: string; label: string }[] {
  return [...rates.item340Containers.values()]
    .map((c) => ({ key: c.key, label: c.label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function containerRate(key: string, rates: RateTables): ContainerRate {
  const c = rates.item340Containers.get(key);
  if (!c) throw new RateDataError(`Unknown packing container "${key}".`);
  return c;
}

export function packingHourlyRate(timeClass: TimeClass, rates: RateTables): PackingHourlyRate {
  const r = rates.item340Hourly.get(timeClass);
  if (!r) throw new RateDataError(`Unknown packing time class "${timeClass}".`);
  return r;
}
