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
