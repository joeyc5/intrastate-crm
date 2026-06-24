import { loadRates, packingContainers, bulkyArticles, priceQuote } from "../lib/pricing";
import { getCounties } from "./lib/data";
import { QuoteForm } from "./components/QuoteForm";

export default function HomePage() {
  const counties = getCounties();
  const rates = loadRates("2026");

  // Price the default move server-side so the live summary is populated on load
  // (and matches QuoteForm's initial field values).
  const initialResult = priceQuote(
    {
      origin: { county: "Santa Clara" },
      destination: { county: "Los Angeles" },
      distanceMiles: 350,
      weight: { basis: "cube", cubicFeet: 1000 },
      valuation: { tier: "fvrp250", declaredValueUsd: 20000 },
      discountPct: 0,
    },
    rates,
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-10">
      <QuoteForm
        counties={counties}
        packingContainers={packingContainers(rates)}
        bulkyArticles={bulkyArticles(rates)}
        initialResult={initialResult}
      />
      <footer className="mt-12 border-t border-line pt-5 text-center text-xs leading-relaxed text-ink-faint print:hidden">
        Silicon Valley Moving &amp; Storage Inc · 186 Barnard Ave, San Jose CA 95125 · 408-941-0600 ·
        www.SiliconValleyMoving.com · Cal T 188960
      </footer>
    </div>
  );
}
