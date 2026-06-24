export function dollarStringToCents(s: string): number {
  const n = Number(s);
  if (!Number.isFinite(n)) {
    throw new Error(`dollarStringToCents: not a number: "${s}"`);
  }
  return Math.round(n * 100);
}

// Item 32: a fraction of a cent of one-half or more rounds up to the next
// whole cent; less than one-half is dropped. (Round-half-up on the cents value.)
export function roundItem32(cents: number): number {
  return Math.floor(cents + 0.5);
}

// Item 136: declared value is taken to the next $100 "or fraction thereof".
export function nextHundredDollarsUsd(usd: number): number {
  return Math.ceil(usd / 100) * 100;
}
