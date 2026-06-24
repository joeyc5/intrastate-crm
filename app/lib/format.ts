const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const plain = new Intl.NumberFormat("en-US");

/** Integer cents → "$1,234.56". */
export function centsToUsd(cents: number): string {
  return usd.format(cents / 100);
}

/** Pounds → "5,000 lb". */
export function formatLb(pounds: number): string {
  return `${plain.format(Math.round(pounds))} lb`;
}
