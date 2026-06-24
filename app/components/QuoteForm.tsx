"use client";

import { useActionState, useState, type ReactNode } from "react";
import { calculateQuote } from "../actions";
import type { CalcState } from "../lib/types";
import { QuoteResult } from "./QuoteResult";

const INITIAL: CalcState = { ok: false };

const TIERS = [
  { value: "released", label: "Released value — free ($0.60/lb)" },
  { value: "fvrp250", label: "Full Value — $250 deductible" },
  { value: "fvrp500", label: "Full Value — $500 deductible" },
];

const inputCls =
  "w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none transition focus:border-svm-blue focus:ring-2 focus:ring-svm-blue/20";

export function QuoteForm({ counties }: { counties: string[] }) {
  const [state, formAction, pending] = useActionState(calculateQuote, INITIAL);
  const [weightBasis, setWeightBasis] = useState<"cube" | "scale">("cube");
  const [tier, setTier] = useState("fvrp250");

  return (
    <div>
      <form action={formAction} className="space-y-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Origin county">
            <select name="originCounty" required defaultValue="Santa Clara" className={`${inputCls} bg-white`}>
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Destination county">
            <select name="destCounty" required defaultValue="Los Angeles" className={`${inputCls} bg-white`}>
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Distance (miles)" hint="Must exceed 100 — GPS shortest-highway route">
          <input name="distanceMiles" type="number" min={1} step={1} required defaultValue={350} className={inputCls} />
        </Field>

        <Field label="Shipment weight">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="weightBasis"
                value="cube"
                checked={weightBasis === "cube"}
                onChange={() => setWeightBasis("cube")}
              />
              By cubic feet
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="weightBasis"
                value="scale"
                checked={weightBasis === "scale"}
                onChange={() => setWeightBasis("scale")}
              />
              Actual scale weight
            </label>
          </div>
          {weightBasis === "cube" ? (
            <input
              name="cubicFeet"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={1000}
              placeholder="cubic feet"
              className={`${inputCls} mt-2`}
            />
          ) : (
            <input
              name="pounds"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={7000}
              placeholder="pounds"
              className={`${inputCls} mt-2`}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valuation">
            <select
              name="valuationTier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          {tier !== "released" && (
            <Field label="Declared value ($)">
              <input
                name="declaredValueUsd"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={20000}
                className={inputCls}
              />
            </Field>
          )}
        </div>

        <Field label="Discount off max (%)" hint="Internal lever — only ever lowers the price">
          <input name="discountPct" type="number" min={0} max={100} step={1} defaultValue={0} className={inputCls} />
        </Field>

        {state.error && (
          <p role="alert" className="rounded-lg bg-svm-red/10 px-4 py-3 text-sm text-svm-red-dark">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-svm-red px-4 py-3 font-semibold text-white transition hover:bg-svm-red-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Calculating…" : "Calculate Not-to-Exceed"}
        </button>
      </form>

      {state.ok && state.result && <QuoteResult result={state.result} />}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-black/45">{hint}</span>}
    </label>
  );
}
