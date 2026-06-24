import { roundItem32 } from "../money.js";
import { bulkyArticleRate, shuttleHourlyCents } from "../rates/accessorials.js";
import type { AccessorialsInput, LineItem, RateTables, Territory } from "../types.js";

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * Accessorial charges. Flights/long-carry are NON-discountable (Item 140 NOTE 3
 * / Item 24 NOTE); shuttle/extra-stop/bulky default non-discountable too. All
 * are capped at their tariff maxima.
 */
export function accessorials(
  input: AccessorialsInput | undefined,
  rates: RateTables,
  territories: { originTerritory: Territory; destTerritory: Territory },
): LineItem[] {
  const items: LineItem[] = [];
  if (!input) return items;
  const flightRate = rates.accessorialRates.flightPer100Cents; // Item 140 — $2.26/100 lb

  // Flights / elevator (Item 140) — per flight, on the weight of articles carried
  if (input.flights && input.flights.count > 0 && input.flights.weightLb > 0) {
    const { count, weightLb } = input.flights;
    const per100 = Math.ceil(weightLb / 100);
    const amountCents = count * per100 * flightRate;
    items.push({
      key: "flights",
      label: "Flights / elevator (carry up stairs)",
      itemRef: "Item 140",
      basis: `${count} flight(s) × ${per100} × ${usd(flightRate)}/100 lb (${weightLb} lb carried) — non-discountable`,
      amountCents,
      capCents: amountCents,
      discountable: false,
    });
  }

  // Long carry (Item 140) — first 75 ft free, then per 50 ft
  if (input.longCarry && input.longCarry.feet > 75 && input.longCarry.weightLb > 0) {
    const { feet, weightLb } = input.longCarry;
    const units = Math.ceil((feet - 75) / 50);
    const per100 = Math.ceil(weightLb / 100);
    const amountCents = units * per100 * flightRate;
    items.push({
      key: "long_carry",
      label: "Long carry (beyond 75 ft)",
      itemRef: "Item 140",
      basis: `${units} × 50 ft beyond 75 × ${per100} × ${usd(flightRate)}/100 lb — non-discountable`,
      amountCents,
      capCents: amountCents,
      discountable: false,
    });
  }

  // Shuttle (Item 184 → Item 320 hourly) — at the origin territory
  if (input.shuttle && input.shuttle.hours > 0 && input.shuttle.persons > 0) {
    const { hours, persons, timeClass } = input.shuttle;
    const perHr = shuttleHourlyCents(persons, timeClass, territories.originTerritory, rates);
    const amountCents = roundItem32(perHr * hours);
    items.push({
      key: "shuttle",
      label: "Shuttle",
      itemRef: "Item 184 / 320",
      basis: `${Math.max(1, Math.floor(persons))}-person × ${hours} hr @ ${usd(perHr)}/hr (Terr ${territories.originTerritory})`,
      amountCents,
      capCents: roundItem32(rates.accessorialRates.shuttleMaxPerHourCents * hours),
      discountable: false,
    });
  }

  // Extra stops (Items 148/152/156) — per-stop additive
  if (input.extraStops && input.extraStops > 0) {
    const stops = Math.floor(input.extraStops);
    const amountCents = stops * rates.accessorialRates.extraStopMaxCents;
    items.push({
      key: "extra_stops",
      label: "Extra stops",
      itemRef: "Items 148/152/156",
      basis: `${stops} × ${usd(rates.accessorialRates.extraStopMaxCents)}/stop (enter through-stops distance above)`,
      amountCents,
      capCents: amountCents,
      discountable: false,
    });
  }

  // Bulky articles (Item 164) — flat per-article maxima
  if (input.bulky) {
    for (const b of input.bulky) {
      if (!Number.isFinite(b.qty) || b.qty <= 0) continue;
      const rate = bulkyArticleRate(b.type, rates);
      const qty = Math.floor(b.qty);
      const amountCents = rate.maxChargeCents * qty;
      items.push({
        key: `bulky:${rate.key}`,
        label: `Bulky — ${rate.label} ×${qty}`,
        itemRef: "Item 164",
        basis: `${qty} × ${usd(rate.maxChargeCents)}`,
        amountCents,
        capCents: amountCents,
        discountable: false,
      });
    }
  }

  return items;
}
