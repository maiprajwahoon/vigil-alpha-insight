import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Star } from "lucide-react";
import { SectionHeading } from "@/components/Primitives";
import { useScanResults } from "@/hooks/use-scanner";
import { useWatchlist } from "@/hooks/use-watchlist";
import { StockLogo } from "@/components/StockLogo";
import { RealtimePriceCell } from "@/hooks/use-realtime-price";

export const Route = createFileRoute("/_app/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist — LynchMark" }] }),
  component: Watchlist,
});

function getLogoGrad(ticker: string) {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `linear-gradient(135deg, hsl(${h}, 65%, 40%), hsl(${(h + 40) % 360}, 70%, 20%))`;
}

function Sparkline({ data, isBullish }: { data: number[]; isBullish: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 16;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={isBullish ? "var(--bull)" : "var(--bear)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function getDeterministicSparkline(ticker: string, changePct: number): number[] {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seed = Math.abs(hash);
  const points: number[] = [100];
  let current = 100;
  for (let i = 1; i < 8; i++) {
    const stepSeed = (seed + i * 17) % 100;
    const change = (stepSeed - 48) / 15;
    current += change;
    points.push(current);
  }
  const finalVal = 100 + changePct * 4;
  points[points.length - 1] = finalVal;
  points[points.length - 2] = (points[points.length - 3] + finalVal) / 2;
  return points;
}

function Watchlist() {
  const navigate = useNavigate();
  const { watchlist, toggleWatchlist, loading } = useWatchlist();
  const { data } = useScanResults({});

  const items = useMemo(() => {
    const stocks = data?.stocks ?? [];
    return watchlist
      .map((t) => stocks.find((s) => s.ticker.toUpperCase() === t.toUpperCase()))
      .filter((s) => s != null);
  }, [watchlist, data?.stocks]);

  const remove = (ticker: string) => {
    toggleWatchlist(ticker);
  };

  const empty = items.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 select-none">
      {/* Header Title Section */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-label-mono text-muted-foreground/85">Watchlist</p>
          <h1 className="text-hero mt-2 text-3.5xl md:text-4xl">Companies you're following</h1>
        </div>
        <Link
          to="/scanner"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3 py-2 text-sm hover:bg-white/[0.06] transition"
        >
          <Plus className="h-4 w-4" strokeWidth={1.6} /> Add from scanner
        </Link>
      </div>

      {empty ? (
        <div className="glass-card grid place-items-center p-24 text-center">
          <Star className="h-8 w-8 text-muted-foreground animate-pulse" strokeWidth={1.4} />
          <h3 className="font-display mt-5 text-2xl">Great investments begin with great research.</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Add companies from stock detail pages to begin tracking quality opportunities.</p>
          <Link to="/scanner" className="mt-6 rounded-full bg-white px-5 py-2 text-sm text-background">Open scanner</Link>
        </div>
      ) : (
        <div className="glass-card p-5">
          <SectionHeading title={`${items.length} companies`} subtitle="Saved in your browser" />
          
          <div className="flex flex-col mt-4">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[1.5fr_1fr_1fr_1.6fr_1.6fr_0.4fr] gap-4 items-center px-4 py-3 text-label-mono text-muted-foreground font-bold border-b border-white/5">
              <div>Asset / Sector</div>
              <div className="text-right">Price Trend</div>
              <div className="text-right">Price Today</div>
              <div className="pl-6">LynchMark Quality</div>
              <div className="pl-6">Breakout Readiness</div>
              <div className="text-right">Action</div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-white/[0.04]">
              {items.map((s) => (
                <div
                  key={s.ticker}
                  onClick={() => navigate({ to: "/stock/$ticker", params: { ticker: s.ticker } })}
                  className="grid grid-cols-[minmax(0,1.5fr)_auto] sm:grid-cols-[1.5fr_1fr_1fr_1.6fr_1.6fr_0.4fr] gap-4 items-center px-4 py-4 premium-row-hover hover:bg-white/[0.02] hover:shadow-inner hover:shadow-black/25 active:bg-white/[0.04] relative group overflow-hidden first:rounded-t-xl last:rounded-b-xl border border-transparent hover:border-white/10 cursor-pointer"
                >
                  {/* Column 1: Asset / Sector */}
                  <div className="flex items-center gap-3 min-w-0">
                    <StockLogo
                      ticker={s.ticker}
                      size={40}
                      className="rounded-xl group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-sm font-bold text-foreground group-hover:text-[#3b82f6] transition-colors leading-none">
                          {s.ticker}
                        </span>
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-muted-foreground border border-white/5">
                          {s.sector}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px] mt-1.5">
                        {s.company}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Sparkline / Trend (Hidden on Mobile) */}
                  <div className="hidden sm:flex items-center justify-end pr-4 select-none">
                    <Sparkline data={getDeterministicSparkline(s.ticker, s.changePct)} isBullish={s.changePct >= 0} />
                  </div>

                  {/* Column 3: Price Today */}
                  <div className="text-right">
                    <div className="font-mono font-tabular-nums text-sm font-bold text-foreground">
                      <RealtimePriceCell ticker={s.ticker} basePrice={s.cmp} baseChangePct={s.changePct} />
                    </div>
                    <div className={`inline-flex items-center gap-0.5 text-[11px] font-bold mt-1 font-tabular-nums ${s.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                      {s.changePct >= 0 ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}%
                    </div>
                  </div>

                  {/* Column 4: LynchMark Quality */}
                  <div className="hidden sm:flex flex-col gap-1.5 pl-6">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none ${
                        s.investmentQuality >= 80 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                        s.investmentQuality >= 60 ? "bg-teal-500/10 border-teal-500/20 text-teal-400" :
                        s.investmentQuality >= 40 ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                        "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}>
                        {s.investmentQuality}/100
                      </span>
                      <span className="text-[10.5px] font-semibold text-muted-foreground/90">
                        {s.investmentQuality >= 80 ? "Excellent" :
                         s.investmentQuality >= 60 ? "Strong Buy" :
                         s.investmentQuality >= 40 ? "Good Hold" :
                         "Under Review"}
                      </span>
                    </div>
                    {/* Segmented signal-like score indicator */}
                    <div className="flex gap-0.5 items-center">
                      {[1, 2, 3, 4, 5].map((i) => {
                        const threshold = i * 20;
                        const isLit = s.investmentQuality >= threshold - 10;
                        const litColor = 
                          s.investmentQuality >= 80 ? "bg-emerald-400" :
                          s.investmentQuality >= 60 ? "bg-teal-400" :
                          s.investmentQuality >= 40 ? "bg-blue-400" :
                          "bg-amber-400";
                        return (
                          <div
                            key={i}
                            className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                              isLit ? `${litColor} shadow-[0_0_8px_rgba(255,255,255,0.15)]` : "bg-white/[0.06]"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 5: Breakout Readiness */}
                  <div className="hidden sm:flex flex-col gap-1.5 pl-6">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none ${
                        s.breakoutReadiness >= 80 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                        s.breakoutReadiness >= 60 ? "bg-teal-500/10 border-teal-500/20 text-teal-400" :
                        s.breakoutReadiness >= 40 ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                        "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}>
                        {s.breakoutReadiness}%
                      </span>
                      <span className="text-[10.5px] font-semibold text-muted-foreground/90">
                        {s.breakoutReadiness >= 80 ? "Breakout" :
                         s.breakoutReadiness >= 65 ? "Near Pivot" :
                         s.breakoutReadiness >= 40 ? "Consolidating" :
                         "Weak"}
                      </span>
                    </div>
                    {/* Segmented signal-like score indicator */}
                    <div className="flex gap-0.5 items-center">
                      {[1, 2, 3, 4, 5].map((i) => {
                        const threshold = i * 20;
                        const isLit = s.breakoutReadiness >= threshold - 10;
                        const litColor = 
                          s.breakoutReadiness >= 80 ? "bg-emerald-400" :
                          s.breakoutReadiness >= 60 ? "bg-teal-400" :
                          s.breakoutReadiness >= 40 ? "bg-blue-400" :
                          "bg-amber-400";
                        return (
                          <div
                            key={i}
                            className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                              isLit ? `${litColor} shadow-[0_0_8px_rgba(255,255,255,0.15)]` : "bg-white/[0.06]"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 6: Action */}
                  <div className="text-right flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => remove(s.ticker)}
                      title="Remove from watchlist"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition"
                    >
                      <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
