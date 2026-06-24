import { roundItem32 } from "../money.js";
import { containerRate, packingHourlyRate } from "../rates/item340.js";
import type { LineItem, PackingInput, PackingLaborInput, RateTables, Territory, TimeClass } from "../types.js";

const TIME_CLASS_LABEL: Record<TimeClass, string> = {
  straight: "straight time",
  time_and_half: "time-and-a-half",
  double: "double time",
};

export interface PackingResult {
  lineItems: LineItem[];
  /** Taxable materials subtotal (container sale prices); labor is NOT taxable. */
  materialsCents: number;
}

export function packing(
  packingInput: PackingInput | undefined,
  rates: RateTables,
  territories: { originTerritory: Territory; destTerritory: Territory },
): PackingResult {
  const lineItems: LineItem[] = [];
  let materialsCents = 0;
  if (!packingInput) return { lineItems, materialsCents };

  // Materials — Item 340 ¶1 container sale prices (taxable, capped at the tariff price).
  for (const c of packingInput.containers) {
    if (!Number.isFinite(c.qty) || c.qty <= 0) continue;
    const rate = containerRate(c.type, rates);
    const qty = Math.floor(c.qty);
    const amountCents = rate.salePriceCents * qty;
    materialsCents += amountCents;
    lineItems.push({
      key: `materials:${rate.key}`,
      label: `Materials — ${rate.label} ×${qty}`,
      itemRef: "Item 340",
      basis: `${qty} × $${(rate.salePriceCents / 100).toFixed(2)} sale price`,
      amountCents,
      capCents: amountCents,
      discountable: false,
    });
  }

  // Hourly crew labor — Item 340 ¶2 (per hour per person; NOT taxable).
  const addLabor = (labor: PackingLaborInput | undefined, leg: "pack" | "unpack", territory: Territory) => {
    if (!labor) return;
    if (!Number.isFinite(labor.hours) || labor.hours <= 0) return;
    if (!Number.isFinite(labor.persons) || labor.persons <= 0) return;
    const rate = packingHourlyRate(labor.timeClass, rates);
    const perHr = territory === "A" ? rate.perHourPerPersonCents.A : rate.perHourPerPersonCents.B;
    const amountCents = roundItem32(perHr * labor.persons * labor.hours);
    lineItems.push({
      key: `${leg}_labor`,
      label: leg === "pack" ? "Packing labor" : "Unpacking labor",
      itemRef: "Item 340",
      basis: `${labor.persons} × ${labor.hours} hr @ $${(perHr / 100).toFixed(2)}/hr/person (Terr ${territory}, ${TIME_CLASS_LABEL[labor.timeClass]})`,
      amountCents,
      capCents: amountCents,
      discountable: false,
    });
  };

  addLabor(packingInput.pack, "pack", territories.originTerritory);
  addLabor(packingInput.unpack, "unpack", territories.destTerritory);

  return { lineItems, materialsCents };
}
