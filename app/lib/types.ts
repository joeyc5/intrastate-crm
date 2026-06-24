import type { QuoteResult } from "../../lib/pricing";

/** State returned by the calculateQuote server action to the form. */
export type CalcState = {
  ok: boolean;
  result?: QuoteResult;
  error?: string;
};

/**
 * Raw form values (strings, as held in controlled state) sent to the server
 * action. Driving submission from state — rather than the form's DOM via an
 * `action` prop — keeps React state authoritative and avoids React 19's
 * automatic post-action form reset desyncing the controls.
 */
export interface QuoteFormPayload {
  originCounty: string;
  destCounty: string;
  distanceMiles: string;
  weightBasis: "cube" | "scale";
  cubicFeet: string;
  pounds: string;
  valuationTier: string;
  declaredValueUsd: string;
  discountPct: string;
  containers: { type: string; qty: string }[];
  pack?: { hours: string; persons: string; timeClass: string };
  unpack?: { hours: string; persons: string; timeClass: string };
  flights?: { count: string; weightLb: string };
  longCarry?: { feet: string; weightLb: string };
  shuttle?: { hours: string; persons: string; timeClass: string };
  extraStops?: string;
  bulky: { type: string; qty: string }[];
}
