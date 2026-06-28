import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, RefreshCw, Save, SlidersHorizontal } from "lucide-react";
import { SectionHeading, StatusChip, ScoreBar } from "@/components/Primitives";
import { STOCKS, type Stock } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/scanner")({
  head: () => ({ meta: [{ title: "Scanner — LynchMark" }] }),
  component: Scanner,
});

const FILTER_GROUPS: Array<{ title: string; items: string[] }> = [
  { title: "Universe", items: ["Market", "Exchange", "Sector", "Industry", "Country", "Market Cap"] },
  { title: "Growth & Quality", items: ["Revenue Growth", "EPS Growth", "Quarterly Growth", "PEG Ratio", "ROE", "ROCE"] },
  { title: "Balance Sheet", items: ["Debt to Equity", "Operating Margin", "Net Margin", "Cash Flow"] },
  { title: "Ownership", items: ["Institutional Holding", "Promoter Holding", "Relative Strength"] },
  { title: "Technical (Weekly)", items: ["Price Above 50 EMA", "Price Above 150 EMA", "Price Above 200 EMA", "EMA Alignment", "Volume Dry Up", "Near Pivot", "Inside Week", "Weekly Tight Close", "VCP Detection"] },
];

function Scanner() {
  const [sort, setSort] = useState<keyof Stock>("investmentQuality");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = q ? STOCKS.filter((s) => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)) : STOCKS;
    return [...filtered].sort((a, b) => (b[sort] as number) - (a[sort] as number));
  }, [sort, query]);

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Research</p>
          <h1 className="font-display mt-2 text-4xl">Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">GARP fundamentals refined by weekly volume contraction.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Filters */}
        <aside className="glass-card p-5 lg:sticky lg:top-20 lg:h-fit">
          <div className="mb-4 flex items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
            <span className="font-medium">Filters</span>
            <span className="ml-auto text-xs text-muted-foreground">7 active</span>
          </div>

          <div className="space-y-5 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
            {FILTER_GROUPS.map((g) => (
              <div key={g.title}>
                <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">{g.title}</div>
                <div className="space-y-1.5">
                  {g.items.map((it) => (
                    <button
                      key={it}
                      className="group flex w-full items-center justify-between rounded-lg border border-border bg-white/[0.015] px-3 py-2 text-left text-xs text-foreground/90 transition hover:bg-white/[0.04]"
                    >
                      <span>{it}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-foreground" strokeWidth={1.6} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button className="rounded-xl bg-white py-2 text-sm font-medium text-background transition hover:bg-white/90">
              Apply Filters
            </button>
            <div className="flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs hover:bg-white/[0.04]">
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.6} /> Reset
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs hover:bg-white/[0.04]">
                <Save className="h-3.5 w-3.5" strokeWidth={1.6} /> Save
              </button>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="glass-card p-5">
          <SectionHeading
            title={`${rows.length} matches`}
            subtitle="Sorted by investment quality"
            action={
              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search results…"
                  className="h-9 w-56 rounded-lg border border-border bg-card/60 px-3 text-sm outline-none focus:border-white/20"
                />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as keyof Stock)}
                  className="h-9 rounded-lg border border-border bg-card/60 px-3 text-sm outline-none"
                >
                  <option value="investmentQuality">Investment Quality</option>
                  <option value="growthQuality">Growth Quality</option>
                  <option value="technicalStrength">Technical Strength</option>
                  <option value="breakoutReadiness">Breakout Readiness</option>
                </select>
              </div>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card/80 backdrop-blur">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 font-medium">Ticker</th>
                  <th className="font-medium">Company</th>
                  <th className="font-medium text-right">CMP</th>
                  <th className="font-medium">Sector</th>
                  <th className="font-medium w-32">Growth</th>
                  <th className="font-medium w-32">Valuation</th>
                  <th className="font-medium w-32">Technical</th>
                  <th className="font-medium w-32">Breakout</th>
                  <th className="font-medium w-32">Investment</th>
                  <th className="font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.ticker} className="group border-t border-border transition-colors hover:bg-white/[0.025]">
                    <td className="py-3.5 font-mono text-xs">
                      <Link to="/stock/$ticker" params={{ ticker: s.ticker }} className="text-foreground hover:underline underline-offset-4">
                        {s.ticker}
                      </Link>
                    </td>
                    <td className="text-foreground/90">{s.company}</td>
                    <td className="text-right font-mono">₹{s.cmp.toLocaleString()}</td>
                    <td className="text-muted-foreground">{s.sector}</td>
                    <td><ScoreBar value={s.growthQuality} /></td>
                    <td><ScoreBar value={s.valuation} /></td>
                    <td><ScoreBar value={s.technicalStrength} /></td>
                    <td><ScoreBar value={s.breakoutReadiness} /></td>
                    <td><ScoreBar value={s.investmentQuality} /></td>
                    <td><StatusChip status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing 1–{rows.length} of {rows.length}</span>
            <div className="flex items-center gap-1">
              <button className="rounded-md border border-border px-2.5 py-1 hover:bg-white/[0.04]">Prev</button>
              <button className="rounded-md border border-border bg-white/[0.04] px-2.5 py-1">1</button>
              <button className="rounded-md border border-border px-2.5 py-1 hover:bg-white/[0.04]">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
