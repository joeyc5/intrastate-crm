import type { QuoteResult as QR } from "../../lib/pricing";
import { centsToUsd, formatLb } from "../lib/format";

const COMPANY = {
  name: "Silicon Valley Moving & Storage Inc",
  address: "186 Barnard Ave, San Jose, CA 95125",
  phone: "408-941-0600",
  web: "www.SiliconValleyMoving.com",
  calT: "Cal T 188960",
};

export interface PrintQuoteData {
  quoteNo: string;
  quoteDate: string;
  validThrough: string;
  customer: { name: string; phone: string; email: string };
  move: {
    originAddress: string;
    destAddress: string;
    originCounty: string;
    destCounty: string;
    pickup: string;
    delivery: string;
  };
  depositCents: number;
}

const orDash = (s: string) => (s.trim() ? s : "—");

/**
 * The customer-facing sales quote, rendered for print only (hidden on screen,
 * shown by `window.print()`). Light/professional — distinct from the dark
 * on-screen SummaryPanel. Every value is sourced: pricing from `result`,
 * identity/terms from config. This is a quote/estimate, not the signed Agreement.
 */
export function PrintQuote({ data, result }: { data: PrintQuoteData; result: QR }) {
  const d = result.derived;
  const balanceCents = Math.max(0, result.nteTotalCents - data.depositCents);

  return (
    <div id="print-quote" className="hidden bg-white text-ink print:block">
      <article className="mx-auto max-w-[8.5in] px-10 py-8">
        <header className="flex items-start justify-between gap-6 border-b border-black/15 pb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/svm-logo.png" alt="Silicon Valley Moving & Storage" className="h-11 w-auto" />
          <div className="text-right text-[11px] leading-relaxed text-ink-soft">
            <div className="font-semibold text-ink">{COMPANY.name}</div>
            <div>{COMPANY.address}</div>
            <div>{COMPANY.phone} · {COMPANY.web}</div>
            <div className="font-medium">{COMPANY.calT}</div>
          </div>
        </header>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Moving Quote</h1>
            <p className="mt-1 text-sm text-ink-soft">Quote {orDash(data.quoteNo)}</p>
          </div>
          <div className="text-right text-xs text-ink-soft">
            <div>Date: <span className="font-medium text-ink">{orDash(data.quoteDate)}</span></div>
            <div>Valid through: <span className="font-medium text-ink">{orDash(data.validThrough)}</span></div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Prepared for</h2>
            <div className="mt-1.5 space-y-0.5">
              <div className="font-medium">{orDash(data.customer.name)}</div>
              <div className="text-ink-soft">{orDash(data.customer.phone)}</div>
              <div className="text-ink-soft">{orDash(data.customer.email)}</div>
            </div>
          </section>
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Move</h2>
            <div className="mt-1.5 space-y-0.5">
              <div><span className="text-ink-soft">From:</span> {orDash(data.move.originAddress)} <span className="text-ink-faint">({data.move.originCounty} County)</span></div>
              <div><span className="text-ink-soft">To:</span> {orDash(data.move.destAddress)} <span className="text-ink-faint">({data.move.destCounty} County)</span></div>
              <div><span className="text-ink-soft">Pickup:</span> {orDash(data.move.pickup)} · <span className="text-ink-soft">Delivery:</span> {orDash(data.move.delivery)}</div>
              <div className="text-ink-soft">{d.distanceBandMiles} mi · {formatLb(d.chargeableWeightLb)} ({d.weightBasisUsed})</div>
            </div>
          </section>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-black/15 text-left text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="py-2 font-semibold">Charge</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {result.lineItems.map((li) => (
              <tr key={li.key} className="border-b border-black/10">
                <td className="py-2 pr-4 align-top">
                  <div className="font-medium">{li.label}</div>
                  <div className="text-[11px] text-ink-faint">{li.itemRef} · {li.basis}</div>
                </td>
                <td className="py-2 text-right align-top tabular-nums">{centsToUsd(li.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <Row label="Subtotal" value={centsToUsd(result.subtotalCents)} />
          {result.discountCents > 0 && <Row label="Discount" value={`−${centsToUsd(result.discountCents)}`} />}
          {result.materialsTaxCents > 0 && <Row label="Materials sales tax" value={centsToUsd(result.materialsTaxCents)} />}
          <div className="flex justify-between border-t border-black/20 pt-2 text-base font-bold">
            <span>Not-to-Exceed total</span>
            <span className="tabular-nums">{centsToUsd(result.nteTotalCents)}</span>
          </div>
          {data.depositCents > 0 && <Row label="Deposit" value={`−${centsToUsd(data.depositCents)}`} />}
          <div className="flex justify-between border-t border-black/10 pt-2 font-semibold">
            <span>Balance due at delivery</span>
            <span className="tabular-nums">{centsToUsd(balanceCents)}</span>
          </div>
        </div>

        <section className="mt-8 space-y-2 border-t border-black/15 pt-4 text-[11px] leading-relaxed text-ink-soft">
          <p><span className="font-semibold text-ink">Not-to-Exceed price.</span> This is a MAX4-compliant estimate. The final charge will not exceed the Not-to-Exceed total above without a change order signed by the customer.</p>
          <p><span className="font-semibold text-ink">Valuation.</span> Coverage is itemized above; the customer&rsquo;s signed valuation election is required before the move.</p>
          <p><span className="font-semibold text-ink">Payment.</span> All major credit cards, bank transfer, and check. This quote is valid 30 days from the date shown.</p>
          <p>This is a quote/estimate, not a binding agreement. A signed Agreement for Moving Services is issued before the move.</p>
        </section>

        <footer className="mt-6 border-t border-black/15 pt-3 text-center text-[10px] text-ink-faint">
          {COMPANY.name} · {COMPANY.address} · {COMPANY.phone} · {COMPANY.web} · {COMPANY.calT}
        </footer>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-soft">
      <span>{label}</span>
      <span className="tabular-nums text-ink">{value}</span>
    </div>
  );
}
