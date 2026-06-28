import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Plus, Star } from "lucide-react";
import { SectionHeading, ScoreBar } from "@/components/Primitives";
import { useScanResults } from "@/hooks/use-scanner";
import { getWatchlist, setWatchlist } from "@/lib/watchlist";

export const Route = createFileRoute("/_app/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist — LynchMark" }] }),
  component: Watchlist,
});

function Watchlist() {
  const [watchlist, setWatchlistState] = useState<string[]>(() => getWatchlist());
  const { data } = useScanResults({});

  const items = useMemo(() => {
    const stocks = data?.stocks ?? [];
    return watchlist
      .map((t) => stocks.find((s) => s.ticker.toUpperCase() === t.toUpperCase()))
      .filter((s) => s != null);
  }, [watchlist, data?.stocks]);

  const remove = (ticker: string) => {
    const next = watchlist.filter((t) => t !== ticker.toUpperCase());
    setWatchlist(next);
    setWatchlistState(next);
  };

  const empty = items.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Watchlist</p>
          <h1 className="font-display mt-2 text-4xl">Companies you're following</h1>
        </div>
        <Link
          to="/scanner"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3 py-2 text-sm hover:bg-white/[0.06]"
        >
          <Plus className="h-4 w-4" strokeWidth={1.6} /> Add from scanner
        </Link>
      </div>

      {empty ? (
        <div className="glass-card grid place-items-center p-24 text-center">
          <Star className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
          <h3 className="font-display mt-5 text-2xl">Great investments begin with great research.</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Add companies from stock detail pages to begin tracking quality opportunities.</p>
          <Link to="/scanner" className="mt-6 rounded-full bg-white px-5 py-2 text-sm text-background">Open scanner</Link>
        </div>
      ) : (
        <div className="glass-card p-5">
          <SectionHeading title={`${items.length} companies`} subtitle="Saved in your browser" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 font-medium">Ticker</th>
                  <th className="font-medium">Company</th>
                  <th className="font-medium text-right">Price</th>
                  <th className="font-medium text-right">Today</th>
                  <th className="font-medium w-44">Investment Quality</th>
                  <th className="font-medium w-44">Breakout Readiness</th>
                  <th className="font-medium text-right">Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.ticker} className="border-t border-border transition-colors hover:bg-white/[0.025]">
                    <td className="py-3.5 font-mono text-xs">
                      <Link to="/stock/$ticker" params={{ ticker: s.ticker }}>{s.ticker}</Link>
                    </td>
                    <td>{s.company}</td>
                    <td className="text-right font-mono">₹{s.cmp.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className={`text-right text-xs ${s.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                      {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                    </td>
                    <td><ScoreBar value={s.investmentQuality} /></td>
                    <td><ScoreBar value={s.breakoutReadiness} /></td>
                    <td className="text-right">
                      <button
                        onClick={() => remove(s.ticker)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                      >
                        <Bell className="h-3.5 w-3.5" strokeWidth={1.6} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
