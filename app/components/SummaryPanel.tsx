import type { QuoteResult as QR } from "../../lib/pricing";
import { centsToUsd, formatLb } from "../lib/format";

/**
 * The signature surface: a dark, layered panel anchored by the live
 * Not-to-Exceed figure with the itemized breakdown beneath it.
 */
export function SummaryPanel({ result }: { result: QR }) {
  const d = result.derived;
  return (
    <div
      className="overflow-hidden rounded-2xl text-white shadow-panel ring-1 ring-white/10"
      style={{
        backgroundImage:
          "radial-gradient(125% 80% at 88% -12%, rgba(0,100,221,0.38), transparent 58%), linear-gradient(180deg, #1c2536 0%, #14171f 62%)",
      }}
    >
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-svm-red" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">
            Not-to-Exceed
          </span>
        </div>
        <div className="mt-2 text-5xl font-bold tabular-nums tracking-tight">
          {centsToUsd(result.nteTotalCents)}
        </div>
        <div className="mt-2 text-sm text-white/65">
          Territory {d.originTerritory} → {d.destTerritory} · {d.distanceBandMiles} mi ·{" "}
          {formatLb(d.chargeableWeightLb)} ({d.weightBasisUsed})
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/[0.03] px-6 py-5">
        <ul className="space-y-2.5 text-sm">
          {result.lineItems.map((li) => (
            <li key={li.key} className="flex items-baseline justify-between gap-4">
              <span className="text-white/70">{li.label}</span>
              <span className="shrink-0 tabular-nums text-white/90">{centsToUsd(li.amountCents)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          <Row label="Subtotal" value={centsToUsd(result.subtotalCents)} tone="muted" />
          {result.discountCents > 0 && (
            <Row label="Discount" value={`−${centsToUsd(result.discountCents)}`} tone="discount" />
          )}
          {result.materialsTaxCents > 0 && (
            <Row label="Materials tax" value={centsToUsd(result.materialsTaxCents)} tone="muted" />
          )}
          <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-3">
            <dt className="text-sm font-semibold text-white">Not-to-Exceed total</dt>
            <dd className="text-xl font-bold tabular-nums text-white">{centsToUsd(result.nteTotalCents)}</dd>
          </div>
        </dl>

        {result.warnings.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-amber-300">
            {result.warnings.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-white/10 px-6 py-5">
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-xl bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white/55 ring-1 ring-inset ring-white/10"
        >
          Make PDF quote
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/55">
            next
          </span>
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-white/55">
          MAX4-compliant estimate · valid 30 days · the final charge won&rsquo;t exceed this price without a
          signed change order.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "muted" | "discount" }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={tone === "discount" ? "text-rose-300" : "text-white/55"}>{label}</dt>
      <dd className={`tabular-nums ${tone === "discount" ? "text-rose-300" : "text-white/80"}`}>{value}</dd>
    </div>
  );
}
