import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronDown, Loader2, RefreshCw, Save, SlidersHorizontal } from "lucide-react";
import { SectionHeading, StatusChip, ScoreBar } from "@/components/Primitives";
import { countActiveFilters, FILTER_PRESETS } from "@/lib/analysis/scanner";
import type { ScannerFilters, Stock } from "@/lib/types/stock";
import { useScanResults, useRefreshScan } from "@/hooks/use-scanner";

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

const TOGGLEABLE_FILTERS = new Set(Object.keys(FILTER_PRESETS));

function buildFilters(active: Set<string>, query: string): ScannerFilters {
  const filters: ScannerFilters = { query };
  for (const key of active) {
    const preset = FILTER_PRESETS[key];
    if (!preset) continue;
    Object.assign(filters, preset);
  }
  return filters;
}

function Scanner() {
  const queryClient = useQueryClient();
  const refreshScanFn = useRefreshScan();
  const [sort, setSort] = useState<keyof Stock>("investmentQuality");
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const filters = useMemo(() => buildFilters(activeFilters, query), [activeFilters, query]);
  const { data, isLoading, isError, isFetching } = useScanResults(filters);

  const rows = useMemo(() => {
    const stocks = data?.stocks ?? [];
    return [...stocks].sort((a, b) => (b[sort] as number) - (a[sort] as number));
  }, [data?.stocks, sort]);

  const toggleFilter = (item: string) => {
    if (!TOGGLEABLE_FILTERS.has(item)) return;
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const resetFilters = () => {
    setActiveFilters(new Set());
    setQuery("");
  };

  const refreshScan = async () => {
    await refreshScanFn(filters);
    queryClient.invalidateQueries({ queryKey: ["scan"] });
  };

  const activeCount = countActiveFilters(filters);

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Research</p>
          <h1 className="font-display mt-2 text-4xl">Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">GARP fundamentals refined by weekly volume contraction.</p>
          {data?.scannedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last scanned {new Date(data.scannedAt).toLocaleString()} · {data.totalScanned} tickers
            </p>
          )}
        </div>
        <button
          onClick={refreshScan}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-white/[0.04] disabled:opacity-50"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" strokeWidth={1.6} />}
          Refresh scan
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="glass-card p-5 lg:sticky lg:top-20 lg:h-fit">
          <div className="mb-4 flex items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
            <span className="font-medium">Filters</span>
            <span className="ml-auto text-xs text-muted-foreground">{activeCount} active</span>
          </div>

          <div className="space-y-5 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
            {FILTER_GROUPS.map((g) => (
              <div key={g.title}>
                <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">{g.title}</div>
                <div className="space-y-1.5">
                  {g.items.map((it) => {
                    const enabled = TOGGLEABLE_FILTERS.has(it);
                    const active = activeFilters.has(it);
                    return (
                      <button
                        key={it}
                        onClick={() => toggleFilter(it)}
                        disabled={!enabled}
                        className={`group flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                          active
                            ? "border-white/20 bg-white/[0.08] text-foreground"
                            : "border-border bg-white/[0.015] text-foreground/90 hover:bg-white/[0.04]"
                        } ${!enabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <span>{it}</span>
                        {enabled && (
                          <ChevronDown
                            className={`h-3.5 w-3.5 ${active ? "text-foreground" : "text-muted-foreground"}`}
                            strokeWidth={1.6}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={refreshScan}
              className="rounded-xl bg-white py-2 text-sm font-medium text-background transition hover:bg-white/90"
            >
              Run Scan
            </button>
            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs hover:bg-white/[0.04]"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.6} /> Reset
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs hover:bg-white/[0.04]">
                <Save className="h-3.5 w-3.5" strokeWidth={1.6} /> Save
              </button>
            </div>
          </div>
        </aside>

        <div className="glass-card p-5">
          <SectionHeading
            title={isLoading ? "Scanning…" : `${rows.length} matches`}
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

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Scanning NSE universe — this may take a minute on first run…
            </div>
          )}

          {isError && (
            <div className="py-24 text-center text-sm text-bear">
              Scan failed. Check your connection and try again.
            </div>
          )}

          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="sticky top-0 bg-card/80 backdrop-blur">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground [&>th]:px-3 [&>th]:whitespace-nowrap">
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
                    <tr key={s.ticker} className="group border-t border-border transition-colors hover:bg-white/[0.025] [&>td]:px-3 [&>td]:whitespace-nowrap">
                      <td className="py-3.5 font-mono text-xs">
                        <Link to="/stock/$ticker" params={{ ticker: s.ticker }} className="text-foreground hover:underline underline-offset-4">
                          {s.ticker}
                        </Link>
                      </td>
                      <td className="text-foreground/90">{s.company}</td>
                      <td className="text-right font-mono">₹{s.cmp.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="text-muted-foreground">{s.sector}</td>
                      <td><ScoreBar value={s.growthQuality} /></td>
                      <td><ScoreBar value={s.valuation} /></td>
                      <td><ScoreBar value={s.technicalStrength} /></td>
                      <td><ScoreBar value={s.breakoutReadiness} /></td>
                      <td><ScoreBar value={s.investmentQuality} /></td>
                      <td><StatusChip status={s.status} /></td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-muted-foreground">
                        No stocks match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {rows.length} of {data?.totalScanned ?? rows.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
