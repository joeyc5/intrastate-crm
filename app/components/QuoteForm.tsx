"use client";

import { useActionState, useRef, useState, type FormEvent, type ReactNode } from "react";
import { calculateQuote } from "../actions";
import type { CalcState, QuoteFormPayload } from "../lib/types";
import type { QuoteResult } from "../../lib/pricing";
import { SummaryPanel } from "./SummaryPanel";

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

const fieldBase =
  "rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-svm-blue focus:ring-4 focus:ring-svm-blue/15";
const inputCls = `w-full ${fieldBase}`;

interface BoxRow {
  id: number;
  type: string;
  qty: string;
}

export function QuoteForm({
  counties,
  packingContainers,
  bulkyArticles,
  initialResult,
}: {
  counties: string[];
  packingContainers: { key: string; label: string }[];
  bulkyArticles: { key: string; label: string }[];
  initialResult: QuoteResult;
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

  const [showAccessorials, setShowAccessorials] = useState(false);
  const [flightCount, setFlightCount] = useState("0");
  const [flightWeight, setFlightWeight] = useState("0");
  const [longCarryFeet, setLongCarryFeet] = useState("0");
  const [longCarryWeight, setLongCarryWeight] = useState("0");
  const [shuttleHours, setShuttleHours] = useState("0");
  const [shuttlePersons, setShuttlePersons] = useState("2");
  const [shuttleTimeClass, setShuttleTimeClass] = useState("straight");
  const [extraStops, setExtraStops] = useState("0");
  const [bulkyRows, setBulkyRows] = useState<BoxRow[]>([]);
  const nextBulkyId = useRef(0);

  const firstContainer = packingContainers[0]?.key ?? "";
  const addBox = () => setBoxes((b) => [...b, { id: nextId.current++, type: firstContainer, qty: "1" }]);
  const updateBox = (id: number, patch: Partial<BoxRow>) =>
    setBoxes((b) => b.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const removeBox = (id: number) => setBoxes((b) => b.filter((row) => row.id !== id));

  const firstBulky = bulkyArticles[0]?.key ?? "";
  const addBulky = () => setBulkyRows((b) => [...b, { id: nextBulkyId.current++, type: firstBulky, qty: "1" }]);
  const updateBulky = (id: number, patch: Partial<BoxRow>) =>
    setBulkyRows((b) => b.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const removeBulky = (id: number) => setBulkyRows((b) => b.filter((row) => row.id !== id));

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
      flights: showAccessorials ? { count: flightCount, weightLb: flightWeight } : undefined,
      longCarry: showAccessorials ? { feet: longCarryFeet, weightLb: longCarryWeight } : undefined,
      shuttle: showAccessorials ? { hours: shuttleHours, persons: shuttlePersons, timeClass: shuttleTimeClass } : undefined,
      extraStops: showAccessorials ? extraStops : undefined,
      bulky: showAccessorials ? bulkyRows.map((b) => ({ type: b.type, qty: b.qty })) : [],
    };
    formAction(payload);
  };

  const result = state.result ?? initialResult;

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Intrastate move quote</h1>
        <p className="mt-1 text-sm text-ink-soft">
          California moves over 100 miles · MAX4 2026 Not-to-Exceed pricing
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <form onSubmit={onSubmit} className="space-y-5 lg:col-span-7">
          {/* Route & shipment */}
          <Card>
            <CardTitle>Route &amp; shipment</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Origin county">
                <select required value={originCounty} onChange={(e) => setOriginCounty(e.target.value)} className={`${inputCls} bg-white`}>
                  {counties.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Destination county">
                <select required value={destCounty} onChange={(e) => setDestCounty(e.target.value)} className={`${inputCls} bg-white`}>
                  {counties.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Distance (miles)" hint="Must exceed 100 — GPS shortest-highway route">
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={distanceMiles}
                  onChange={(e) => setDistanceMiles(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Shipment weight">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="weightBasis" value="cube" checked={weightBasis === "cube"} onChange={() => setWeightBasis("cube")} className="accent-svm-blue" />
                    By cubic feet
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="weightBasis" value="scale" checked={weightBasis === "scale"} onChange={() => setWeightBasis("scale")} className="accent-svm-blue" />
                    Actual scale weight
                  </label>
                </div>
                {weightBasis === "cube" ? (
                  <input type="number" min={1} step={1} required value={cubicFeet} onChange={(e) => setCubicFeet(e.target.value)} placeholder="cubic feet" className={`${inputCls} mt-2`} />
                ) : (
                  <input type="number" min={1} step={1} required value={pounds} onChange={(e) => setPounds(e.target.value)} placeholder="pounds" className={`${inputCls} mt-2`} />
                )}
              </Field>
            </div>
          </Card>

          {/* Valuation */}
          <Card>
            <CardTitle>Valuation</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Coverage">
                <select value={tier} onChange={(e) => setTier(e.target.value)} className={`${inputCls} bg-white`}>
                  {TIERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
              {tier !== "released" && (
                <Field label="Declared value ($)">
                  <input type="number" min={1} step={1} required value={declaredValueUsd} onChange={(e) => setDeclaredValueUsd(e.target.value)} className={inputCls} />
                </Field>
              )}
            </div>
          </Card>

          {/* Packing */}
          <Card>
            <ToggleHeader checked={showPacking} onChange={setShowPacking} label="Packing" />
            {showPacking && (
              <div className="mt-5 space-y-5">
                <div>
                  <SubLabel>Materials (boxes)</SubLabel>
                  <div className="space-y-2">
                    {boxes.map((box) => (
                      <div key={box.id} className="flex gap-2">
                        <select value={box.type} onChange={(e) => updateBox(box.id, { type: e.target.value })} className={`${fieldBase} min-w-0 flex-1 bg-white`}>
                          {packingContainers.map((c) => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                          ))}
                        </select>
                        <input type="number" min={1} step={1} value={box.qty} onChange={(e) => updateBox(box.id, { qty: e.target.value })} aria-label="quantity" className={`${fieldBase} w-20 shrink-0 text-center`} />
                        <button type="button" onClick={() => removeBox(box.id)} aria-label="Remove box" className="px-2 text-ink-faint transition hover:text-svm-red">✕</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addBox} className="mt-2 text-sm font-medium text-svm-blue transition hover:text-svm-blue-dark">+ Add box type</button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Pack hours"><input type="number" min={0} step={0.5} value={packHours} onChange={(e) => setPackHours(e.target.value)} className={inputCls} /></Field>
                  <Field label="Crew (packers)"><input type="number" min={1} step={1} value={packPersons} onChange={(e) => setPackPersons(e.target.value)} className={inputCls} /></Field>
                  <Field label="Rate">
                    <select value={packTimeClass} onChange={(e) => setPackTimeClass(e.target.value)} className={`${inputCls} bg-white`}>
                      {TIME_CLASSES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                    </select>
                  </Field>
                </div>

                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={showUnpack} onChange={(e) => setShowUnpack(e.target.checked)} className="accent-svm-blue" />
                  Include unpacking (at destination)
                </label>
                {showUnpack && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Unpack hours"><input type="number" min={0} step={0.5} value={unpackHours} onChange={(e) => setUnpackHours(e.target.value)} className={inputCls} /></Field>
                    <Field label="Crew (packers)"><input type="number" min={1} step={1} value={unpackPersons} onChange={(e) => setUnpackPersons(e.target.value)} className={inputCls} /></Field>
                    <Field label="Rate">
                      <select value={unpackTimeClass} onChange={(e) => setUnpackTimeClass(e.target.value)} className={`${inputCls} bg-white`}>
                        {TIME_CLASSES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                      </select>
                    </Field>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Additional services */}
          <Card>
            <ToggleHeader checked={showAccessorials} onChange={setShowAccessorials} label="Additional services" />
            {showAccessorials && (
              <div className="mt-5 space-y-5">
                <div>
                  <SubLabel>Stairs &amp; long carry</SubLabel>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Flights of stairs / elevator" hint="Above the ground floor">
                      <input type="number" min={0} step={1} value={flightCount} onChange={(e) => setFlightCount(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Weight carried up (lb)" hint="Items taken up the stairs">
                      <input type="number" min={0} step={1} value={flightWeight} onChange={(e) => setFlightWeight(e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Long-carry distance (ft)" hint="First 75 ft are free">
                      <input type="number" min={0} step={1} value={longCarryFeet} onChange={(e) => setLongCarryFeet(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Weight long-carried (lb)">
                      <input type="number" min={0} step={1} value={longCarryWeight} onChange={(e) => setLongCarryWeight(e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                </div>

                <div>
                  <SubLabel>Shuttle</SubLabel>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Hours"><input type="number" min={0} step={0.5} value={shuttleHours} onChange={(e) => setShuttleHours(e.target.value)} className={inputCls} /></Field>
                    <Field label="Crew (persons)"><input type="number" min={1} step={1} value={shuttlePersons} onChange={(e) => setShuttlePersons(e.target.value)} className={inputCls} /></Field>
                    <Field label="Rate">
                      <select value={shuttleTimeClass} onChange={(e) => setShuttleTimeClass(e.target.value)} className={`${inputCls} bg-white`}>
                        {TIME_CLASSES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                      </select>
                    </Field>
                  </div>
                </div>

                <Field label="Extra stops" hint="$134.45 each — include the through-stops distance in the mileage above">
                  <input type="number" min={0} step={1} value={extraStops} onChange={(e) => setExtraStops(e.target.value)} className={`${inputCls} sm:max-w-[12rem]`} />
                </Field>

                <div>
                  <SubLabel>Bulky / special articles</SubLabel>
                  <div className="space-y-2">
                    {bulkyRows.map((row) => (
                      <div key={row.id} className="flex gap-2">
                        <select value={row.type} onChange={(e) => updateBulky(row.id, { type: e.target.value })} className={`${fieldBase} min-w-0 flex-1 bg-white`}>
                          {bulkyArticles.map((a) => (<option key={a.key} value={a.key}>{a.label}</option>))}
                        </select>
                        <input type="number" min={1} step={1} value={row.qty} onChange={(e) => updateBulky(row.id, { qty: e.target.value })} aria-label="quantity" className={`${fieldBase} w-20 shrink-0 text-center`} />
                        <button type="button" onClick={() => removeBulky(row.id)} aria-label="Remove article" className="px-2 text-ink-faint transition hover:text-svm-red">✕</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addBulky} className="mt-2 text-sm font-medium text-svm-blue transition hover:text-svm-blue-dark">+ Add article</button>
                </div>
              </div>
            )}
          </Card>

          {/* Discount */}
          <Card>
            <Field label="Discount off max (%)" hint="Internal lever — only ever lowers the price">
              <input type="number" min={0} max={100} step={1} value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} className={`${inputCls} sm:max-w-[12rem]`} />
            </Field>
          </Card>

          {state.error && (
            <p role="alert" className="rounded-xl border border-svm-red/20 bg-svm-red/5 px-4 py-3 text-sm text-svm-red-dark">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-svm-red px-4 py-3.5 font-semibold text-white shadow-sm transition hover:bg-svm-red-dark focus-visible:ring-4 focus-visible:ring-svm-red/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Calculating…" : "Calculate Not-to-Exceed"}
          </button>
        </form>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <SummaryPanel result={result} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">{children}</section>;
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-sm font-semibold text-ink">{children}</h2>;
}

function SubLabel({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-sm font-medium text-ink">{children}</span>;
}

function ToggleHeader({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-svm-blue" />
      {label}
    </label>
  );
}
