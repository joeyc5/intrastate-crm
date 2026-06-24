import type { QuoteResult } from "../../lib/pricing";

/** State returned by the calculateQuote server action to the form. */
export type CalcState = {
  ok: boolean;
  result?: QuoteResult;
  error?: string;
};
