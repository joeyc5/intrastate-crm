import type { QuoteResult as QR } from "../../lib/pricing";
import { centsToUsd, formatLb } from "../lib/format";

export function QuoteResult({ result }: { result: QR }) {
  const d = result.derived;
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="bg-svm-blue px-6 py-6 text-white">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
          Not-to-Exceed
        </div>
        <div className="mt-1 text-4xl font-extrabold tabular-nums">{centsToUsd(result.nteTotalCents)}</div>
        <div className="mt-2 text-sm text-white/85">
          Territory {d.originTerritory} → {d.destTerritory} · {d.distanceBandMiles} mi ·{" "}
          {formatLb(d.chargeableWeightLb)} ({d.weightBasisUsed})
        </div>
      </div>

      <div className="px-6 py-5">
        <table className="w-full text-sm">
          <tbody>
            {result.lineItems.map((li) => (
              <tr key={li.key} className="border-b border-black/5 last:border-0">
                <td className="py-3 pr-3 align-top">
                  <div className="font-medium text-ink">{li.label}</div>
                  <div className="mt-0.5 text-xs text-black/45">
                    {li.itemRef} · {li.basis}
                  </div>
                </td>
                <td className="py-3 text-right align-top font-medium tabular-nums">
                  {centsToUsd(li.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-black/55">Subtotal</dt>
            <dd className="tabular-nums">{centsToUsd(result.subtotalCents)}</dd>
          </div>
          {result.discountCents > 0 && (
            <div className="flex justify-between text-svm-red-dark">
              <dt>Discount</dt>
              <dd className="tabular-nums">−{centsToUsd(result.discountCents)}</dd>
            </div>
          )}
          {result.materialsTaxCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-black/55">Materials sales tax</dt>
              <dd className="tabular-nums">{centsToUsd(result.materialsTaxCents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-black/10 pt-2 text-base font-bold text-ink">
            <dt>Not-to-Exceed total</dt>
            <dd className="tabular-nums">{centsToUsd(result.nteTotalCents)}</dd>
          </div>
        </dl>

        {result.warnings.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-svm-red-dark">
            {result.warnings.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        )}

        <p className="mt-5 text-xs leading-relaxed text-black/45">
          MAX4-compliant estimate · valid 30 days · the final charge will not exceed this
          Not-to-Exceed price without a signed change order.
        </p>
      </div>
    </section>
  );
}
