import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Loader2, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { StatCard, SectionHeading, StatusChip, ScoreBar } from "@/components/Primitives";
import { StockLogo } from "@/components/StockLogo";
import { ALERTS } from "@/lib/mock-data";
import { motion } from "@/lib/motion-shim";
import { useMarketOverview, useScanResults } from "@/hooks/use-scanner";
import { useRealtimePrice, RealtimePriceCell } from "@/hooks/use-realtime-price";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function RealtimeIndexStatCard({
  label,
  ticker,
  baseValue,
  baseChangePct,
  hint,
}: {
  label: string;
  ticker: string;
  baseValue: number;
  baseChangePct: number;
  hint?: string;
}) {
  const { price, changePct, direction } = useRealtimePrice(ticker, baseValue, baseChangePct);
  const flashClass =
    direction === "up"
      ? "animate-flash-up text-bull"
      : direction === "down"
        ? "animate-flash-down text-bear"
        : "";

  return (
    <StatCard
      label={label}
      value={
        <span className={flashClass}>
          {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      }
      delta={changePct}
      hint={hint}
      icon={TrendingUp}
      sparkline={[baseValue * 0.99, baseValue * 0.995, baseValue * 0.992, baseValue * 1.001, baseValue * 0.998, baseValue * 1.003, price]}
    />
  );
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

function getLogoGrad(ticker: string) {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `linear-gradient(135deg, hsl(${h}, 65%, 40%), hsl(${(h + 40) % 360}, 70%, 20%))`;
}

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LynchMark" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { data: scan, isLoading } = useScanResults({});
  const { data: market } = useMarketOverview();

  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const stocks = scan?.stocks ?? [];
  const top = [...stocks].sort((a, b) => b.investmentQuality - a.investmentQuality).slice(0, 6);
  const breakouts = stocks.filter((s) => s.status === "Breakout" || s.status === "VCP Ready").slice(0, 5);
  const sectors = market?.sectors ?? [];

  const sortedSectors = useMemo(() => {
    return [...sectors].sort((a, b) => b.change - a.change);
  }, [sectors]);

  const strongCount = stocks.filter((s) => s.investmentQuality >= 80).length;
  const breakoutCount = stocks.filter((s) => s.status === "Breakout").length;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning.";
    if (hour < 17) return "Good afternoon.";
    return "Good evening.";
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <p className="text-label-mono text-muted-foreground/85">Overview</p>
        <h1 className="text-hero mt-2 text-3.5xl md:text-4xl">{greeting}</h1>
        <p className="text-body-readable mt-1.5 text-xs md:text-sm text-muted-foreground/80">A calm read of the market, curated for the patient investor.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          label="Market Health" 
          value={strongCount > 10 ? "Strong" : "Mixed"} 
          delta={1.25} 
          icon={ShieldCheck} 
          sparkline={[75, 78, 77, 80, 79, 81, 82]} 
          hint={`${stocks.length} stocks scanned`} 
        />
        <StatCard 
          label="Strong Opportunities" 
          value={strongCount} 
          delta={6.4} 
          icon={TrendingUp} 
          sparkline={[12, 14, 13, 15, 17, 16, 18]} 
          hint="Investment quality ≥ 80" 
        />
        <StatCard 
          label="Weekly Breakouts" 
          value={breakoutCount} 
          delta={14.8} 
          icon={Zap} 
          sparkline={[4, 6, 5, 8, 9, 7, 10]} 
          hint="Confirmed pivot breaks" 
        />
        {(() => {
          const nifty = market?.indices?.find((i) => i.name === "NIFTY 50");
          return nifty?.value ? (
            <RealtimeIndexStatCard
              label="NIFTY 50"
              ticker="^NSEI"
              baseValue={nifty.value}
              baseChangePct={nifty.changePct}
              hint="Live index"
            />
          ) : (
            <StatCard label="NIFTY 50" value="—" hint="Live index" />
          );
        })()}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-card p-6">
          <SectionHeading title="Sector heatmap" subtitle="Relative performance across scanned sectors" />
          {sectors.length === 0 ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Loading sector data…
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
              {sortedSectors.map((s) => {
                const up = s.change >= 0;
                const intensity = Math.min(1, Math.abs(s.change) / 2.5);
                return (
                  <motion.div
                    key={s.name}
                    whileHover={{ y: -5, scale: 1.04, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                    onClick={() => setSelectedSector(s.name)}
                    className="relative aspect-[5/3] rounded-xl border border-border p-3 overflow-hidden cursor-pointer hover:border-white/35 hover:shadow-lg hover:shadow-black/50 transition-all select-none"
                    style={{
                      background: `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)), ${up ? `rgba(34,197,94,${0.08 + intensity * 0.18})` : `rgba(239,68,68,${0.08 + intensity * 0.18})`}`,
                    }}
                  >
                    <div className="text-xs text-foreground/90">{s.name}</div>
                    <div className={`absolute bottom-3 left-3 font-display font-tabular-nums text-xl ${up ? "text-bull" : "text-bear"}`}>
                      {up ? "+" : ""}{s.change.toFixed(2)}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <SectionHeading title="Recent alerts" subtitle="Curated signals from your watchlist" />
            <div className="space-y-1 mt-4">
              {ALERTS.map((a) => (
                <Link
                  key={a.id}
                  to="/stock/$ticker"
                  params={{ ticker: a.ticker }}
                  className="flex items-start gap-3 px-2 py-2.5 transition-all duration-300 hover:bg-white/[0.015] rounded-xl relative group border border-transparent hover:border-white/5 active:bg-white/[0.03]"
                >
                  {/* Avatar Icon */}
                  <StockLogo
                    ticker={a.ticker}
                    size={36}
                    className="rounded-xl group-hover:scale-105 transition-transform"
                  />

                  {/* Detail details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-foreground group-hover:text-[#3b82f6] transition-colors leading-none">
                          {a.ticker}
                        </span>
                        <span className={`rounded bg-white/5 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider leading-none ${
                          a.type === "Breakout" || a.type === "Volume Spike" ? "bg-emerald-500/10 border-emerald-500/15 text-emerald-400" :
                          a.type === "VCP" || a.type === "Near Pivot" ? "bg-blue-500/10 border-blue-500/15 text-blue-400" :
                          "bg-amber-500/10 border-amber-500/15 text-amber-400"
                        }`}>
                          {a.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-medium">
                        {a.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/85 mt-1 leading-relaxed truncate group-hover:text-foreground/90 transition-colors">
                      {a.message}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <Link to="/alerts" className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors">
            View all alerts <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="glass-card p-6">
        <SectionHeading
          title="Top ranked businesses"
          subtitle="Ranked by Investment Quality across growth, structure, and timing"
          action={
            <Link to="/scanner" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              Open scanner <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {isLoading ? (
          <div className="space-y-3 animate-pulse py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4 px-4 rounded-xl border border-white/5 bg-white/[0.005]">
                <div className="h-10 w-10 rounded-xl bg-white/[0.04] shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-3 w-16 bg-white/[0.06] rounded" />
                  <div className="h-2.5 w-36 bg-white/[0.03] rounded" />
                </div>
                <div className="hidden sm:block h-6 w-14 bg-white/[0.04] rounded shrink-0" />
                <div className="h-4 w-12 bg-white/[0.05] rounded shrink-0" />
                <div className="hidden sm:block flex flex-col gap-1 w-28 shrink-0">
                  <div className="h-3.5 w-16 bg-white/[0.05] rounded" />
                  <div className="h-1.5 w-20 bg-white/[0.03] rounded-full" />
                </div>
                <div className="h-6 w-20 bg-white/[0.04] rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col select-none">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[1.5fr_1fr_1fr_1.6fr_1fr] gap-4 items-center px-4 py-3 text-label-mono text-muted-foreground font-bold border-b border-white/5">
              <div>Asset / Sector</div>
              <div className="text-right">Price Trend</div>
              <div className="text-right">Price Today</div>
              <div className="pl-6">LynchMark Rating</div>
              <div className="text-right">Status & Ratios</div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-white/[0.04]">
              {top.map((s) => (
                <Link
                  key={s.ticker}
                  to="/stock/$ticker"
                  params={{ ticker: s.ticker }}
                  className="grid grid-cols-[minmax(0,1.5fr)_auto] sm:grid-cols-[1.5fr_1fr_1fr_1.6fr_1fr] gap-4 items-center px-4 py-4 premium-row-hover hover:bg-white/[0.02] hover:shadow-inner hover:shadow-black/25 active:bg-white/[0.04] relative group overflow-hidden first:rounded-t-xl last:rounded-b-xl border border-transparent hover:border-white/10"
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
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-foreground/80 border border-white/10">
                          {s.sector}
                        </span>
                      </div>
                      <div className="text-xs text-foreground/80 truncate max-w-[200px] mt-1.5">
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

                  {/* Column 4: LynchMark Rating */}
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
                      <span className="text-[10.5px] font-bold text-foreground/85">
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

                  {/* Column 5: Status & Ratios */}
                  <div className="text-right hidden sm:flex flex-col items-end gap-1">
                    <StatusChip status={s.status} />
                    <span className="text-[9.5px] text-foreground/80 font-mono font-tabular-nums mt-0.5">
                      P/E: {s.pe ? s.pe.toFixed(1) : "—"} · ROE: {s.roe ? s.roe.toFixed(0) : "—"}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <SectionHeading title="Recent breakouts" subtitle="Confirmed weekly closes through pivot" />
          <ul className="space-y-3">
            {breakouts.length === 0 && !isLoading && (
              <li className="text-sm text-muted-foreground">No breakouts detected in current scan.</li>
            )}
            {breakouts.map((s) => (
              <li key={s.ticker} className="flex items-center gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[0.04] font-mono text-[10px] leading-none">{s.ticker.length > 5 ? s.ticker.slice(0, 4) : s.ticker}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-foreground/95 font-medium">{s.company}</div>
                  <div className="text-xs text-foreground/75">{s.sector}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">
                    <RealtimePriceCell ticker={s.ticker} basePrice={s.cmp} baseChangePct={s.changePct} />
                  </div>
                  <div className="text-xs">
                    <RealtimePriceCell ticker={s.ticker} basePrice={s.cmp} baseChangePct={s.changePct} showChangePct={true} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-6">
          <SectionHeading title="Upcoming earnings" subtitle="Top-ranked names from scan" />
          <ul className="space-y-3">
            {top.slice(0, 5).map((s, i) => (
              <li key={s.ticker} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.015] px-4 py-3">
                <div>
                  <div className="text-sm text-foreground/95 font-medium">{s.company}</div>
                  <div className="text-xs text-foreground/75">{s.sector}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-foreground/70">Quality</div>
                  <div className="font-mono text-sm text-foreground">{s.investmentQuality}/100</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sector Stocks Dialog Modal */}
      <Dialog open={selectedSector !== null} onOpenChange={(open) => !open && setSelectedSector(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 bg-[#111111] border-white/10 text-foreground overflow-hidden">
          <DialogHeader className="pb-4 border-b border-white/5">
            <DialogTitle className="font-display text-2xl text-foreground flex items-center gap-2">
              <span>{selectedSector} Stocks</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              List of all scanned stocks in the {selectedSector} sector.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60 [&>th]:px-3 [&>th]:pb-2">
                  <th className="font-medium">Ticker</th>
                  <th className="font-medium">Company</th>
                  <th className="font-medium text-right">CMP</th>
                  <th className="font-medium w-28">Quality</th>
                  <th className="font-medium w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {stocks
                  .filter((x) => x.sector === selectedSector)
                  .sort((a, b) => b.investmentQuality - a.investmentQuality)
                  .map((x) => (
                    <tr
                      key={x.ticker}
                      onClick={() => {
                        setSelectedSector(null);
                        navigate({
                          to: "/stock/$ticker",
                          params: { ticker: x.ticker },
                        });
                      }}
                      className="group transition-colors hover:bg-white/[0.04] cursor-pointer [&>td]:py-3 [&>td]:px-3"
                    >
                      <td className="font-mono text-xs font-semibold text-foreground group-hover:underline underline-offset-4">
                        {x.ticker}
                      </td>
                      <td className="text-foreground/85 truncate max-w-[180px]">{x.company}</td>
                      <td className="text-right font-mono">
                        <RealtimePriceCell ticker={x.ticker} basePrice={x.cmp} baseChangePct={x.changePct} />
                        <div className={`text-[10px] ${x.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                          {x.changePct >= 0 ? "+" : ""}{x.changePct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="align-middle">
                        <ScoreBar value={x.investmentQuality} />
                      </td>
                      <td>
                        <StatusChip status={x.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
