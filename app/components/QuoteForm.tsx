"use client";

import { useActionState, useRef, useState, type FormEvent, type ReactNode } from "react";
import { calculateQuote } from "../actions";
import type { CalcState, QuoteFormPayload } from "../lib/types";
import { QuoteResult } from "./QuoteResult";

const INITIAL: CalcState = { ok: false };

const TIERS = [
  { value: "released", label: "Released value — free ($0.60/lb)" },
  { value: "fvrp250", label: "Full Value — $250 deductible" },
  { value: "fvrp500", label: "Full Value — $500 deductible" },
];

const TIME_CLASSES = [
  { value: "straight", label: "Straight time" },
  { value: "time_and_half", label: "Time-and-a-half" },
  { value: "double", label: "Double time" },
];

const inputCls =
  "w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none transition focus:border-svm-blue focus:ring-2 focus:ring-svm-blue/20";

interface BoxRow {
  id: number;
  type: string;
  qty: string;
}

export function QuoteForm({
  counties,
  packingContainers,
}: {
  counties: string[];
  packingContainers: { key: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(calculateQuote, INITIAL);

  // Controlled state — survives the server action so inputs persist for tweak-and-recalc.
  const [originCounty, setOriginCounty] = useState("Santa Clara");
  const [destCounty, setDestCounty] = useState("Los Angeles");
  const [distanceMiles, setDistanceMiles] = useState("350");
  const [weightBasis, setWeightBasis] = useState<"cube" | "scale">("cube");
  const [cubicFeet, setCubicFeet] = useState("1000");
  const [pounds, setPounds] = useState("7000");
  const [tier, setTier] = useState("fvrp250");
  const [declaredValueUsd, setDeclaredValueUsd] = useState("20000");
  const [discountPct, setDiscountPct] = useState("0");

  const [showPacking, setShowPacking] = useState(false);
  const [boxes, setBoxes] = useState<BoxRow[]>([]);
  const nextId = useRef(0);
  const [packHours, setPackHours] = useState("0");
  const [packPersons, setPackPersons] = useState("2");
  const [packTimeClass, setPackTimeClass] = useState("straight");
  const [showUnpack, setShowUnpack] = useState(false);
  const [unpackHours, setUnpackHours] = useState("0");
  const [unpackPersons, setUnpackPersons] = useState("2");
  const [unpackTimeClass, setUnpackTimeClass] = useState("straight");

  const firstContainer = packingContainers[0]?.key ?? "";
  const addBox = () => setBoxes((b) => [...b, { id: nextId.current++, type: firstContainer, qty: "1" }]);
  const updateBox = (id: number, patch: Partial<BoxRow>) =>
    setBoxes((b) => b.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const removeBox = (id: number) => setBoxes((b) => b.filter((row) => row.id !== id));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: QuoteFormPayload = {
      originCounty,
      destCounty,
      distanceMiles,
      weightBasis,
      cubicFeet,
      pounds,
      valuationTier: tier,
      declaredValueUsd,
      discountPct,
      containers: showPacking ? boxes.map((b) => ({ type: b.type, qty: b.qty })) : [],
      pack: showPacking ? { hours: packHours, persons: packPersons, timeClass: packTimeClass } : undefined,
      unpack:
        showPacking && showUnpack
          ? { hours: unpackHours, persons: unpackPersons, timeClass: unpackTimeClass }
          : undefined,
    };
    formAction(payload);
  };

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Origin county">
            <select
              name="originCounty"
              required
              value={originCounty}
              onChange={(e) => setOriginCounty(e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Destination county">
            <select
              name="destCounty"
              required
              value={destCounty}
              onChange={(e) => setDestCounty(e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Distance (miles)" hint="Must exceed 100 — GPS shortest-highway route">
          <input
            name="distanceMiles"
            type="number"
            min={1}
            step={1}
            required
            value={distanceMiles}
            onChange={(e) => setDistanceMiles(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Shipment weight">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="weightBasis" value="cube" checked={weightBasis === "cube"} onChange={() => setWeightBasis("cube")} />
              By cubic feet
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="weightBasis" value="scale" checked={weightBasis === "scale"} onChange={() => setWeightBasis("scale")} />
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
              value={cubicFeet}
              onChange={(e) => setCubicFeet(e.target.value)}
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
              value={pounds}
              onChange={(e) => setPounds(e.target.value)}
              placeholder="pounds"
              className={`${inputCls} mt-2`}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valuation">
            <select name="valuationTier" value={tier} onChange={(e) => setTier(e.target.value)} className={`${inputCls} bg-white`}>
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
                value={declaredValueUsd}
                onChange={(e) => setDeclaredValueUsd(e.target.value)}
                className={inputCls}
              />
            </Field>
          )}
        </div>

        {/* Packing (optional) */}
        <div className="rounded-xl border border-black/10 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={showPacking} onChange={(e) => setShowPacking(e.target.checked)} />
            Include packing
          </label>

          {showPacking && (
            <div className="mt-4 space-y-4">
              <div>
                <span className="mb-1 block text-sm font-medium text-ink">Materials (boxes)</span>
                <div className="space-y-2">
                  {boxes.map((box) => (
                    <div key={box.id} className="flex gap-2">
                      <select
                        name="containerType"
                        value={box.type}
                        onChange={(e) => updateBox(box.id, { type: e.target.value })}
                        className={`${inputCls} flex-1 bg-white`}
                      >
                        {packingContainers.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        name="containerQty"
                        type="number"
                        min={1}
                        step={1}
                        value={box.qty}
                        onChange={(e) => updateBox(box.id, { qty: e.target.value })}
                        aria-label="quantity"
                        className={`${inputCls} w-20`}
                      />
                      <button
                        type="button"
                        onClick={() => removeBox(box.id)}
                        aria-label="Remove box"
                        className="px-2 text-black/40 transition hover:text-svm-red"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addBox}
                  className="mt-2 text-sm font-medium text-svm-blue transition hover:text-svm-blue-dark"
                >
                  + Add box type
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Pack hours">
                  <input name="packHours" type="number" min={0} step={0.5} value={packHours} onChange={(e) => setPackHours(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Crew (packers)">
                  <input name="packPersons" type="number" min={1} step={1} value={packPersons} onChange={(e) => setPackPersons(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Rate">
                  <select name="packTimeClass" value={packTimeClass} onChange={(e) => setPackTimeClass(e.target.value)} className={`${inputCls} bg-white`}>
                    {TIME_CLASSES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showUnpack} onChange={(e) => setShowUnpack(e.target.checked)} />
                Include unpacking (at destination)
              </label>
              {showUnpack && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Unpack hours">
                    <input name="unpackHours" type="number" min={0} step={0.5} value={unpackHours} onChange={(e) => setUnpackHours(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Crew (packers)">
                    <input name="unpackPersons" type="number" min={1} step={1} value={unpackPersons} onChange={(e) => setUnpackPersons(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Rate">
                    <select name="unpackTimeClass" value={unpackTimeClass} onChange={(e) => setUnpackTimeClass(e.target.value)} className={`${inputCls} bg-white`}>
                      {TIME_CLASSES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
            </div>
          )}
        </div>

        <Field label="Discount off max (%)" hint="Internal lever — only ever lowers the price">
          <input name="discountPct" type="number" min={0} max={100} step={1} value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} className={inputCls} />
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
