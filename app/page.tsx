import { getCounties } from "./lib/data";
import { QuoteForm } from "./components/QuoteForm";

export default function HomePage() {
  const counties = getCounties();
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Intrastate Move Quote</h1>
      <p className="mt-1 mb-6 text-sm text-black/55">
        California intrastate moves over 100 miles · MAX4 2026 Not-to-Exceed pricing
      </p>
      <QuoteForm counties={counties} />
    </div>
  );
}
