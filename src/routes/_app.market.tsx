import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SectionHeading, ScoreBar, StatusChip } from "@/components/Primitives";
import { StockLogo } from "@/components/StockLogo";
import { useMarketOverview, useScanResults } from "@/hooks/use-scanner";
import { useRealtimePrice, RealtimePriceCell } from "@/hooks/use-realtime-price";
import { Loader2 } from "lucide-react";
import { motion } from "@/lib/motion-shim";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/market")({
  head: () => ({ meta: [{ title: "Market — LynchMark" }] }),
  component: Market,
});

const INDEX_SYMBOLS: Record<string, string> = {
  "NIFTY 50": "^NSEI",
  "SENSEX": "^BSESN",
  "BANK NIFTY": "^NSEBANK",
};

function getLogoGrad(ticker: string) {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `linear-gradient(135deg, hsl(${h}, 65%, 40%), hsl(${(h + 40) % 360}, 70%, 20%))`;
}

function RealtimeIndexCard({
  name,
  baseValue,
  baseChangePct,
}: {
  name: string;
  baseValue: number;
  baseChangePct: number;
}) {
  const ticker = INDEX_SYMBOLS[name] || name;
  const { price, changePct, direction } = useRealtimePrice(ticker, baseValue, baseChangePct);
  const flashClass =
    direction === "up"
      ? "animate-flash-up text-bull"
      : direction === "down"
        ? "animate-flash-down text-bear"
        : "";

  return (
    <div className="glass-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{name}</div>
      <div className={`mt-3 font-display text-3xl ${flashClass}`}>
        {price.toLocaleString(undefined, { maximumFractionDigits: 1 })}
      </div>
      <div className={`mt-2 text-sm ${changePct >= 0 ? "text-bull" : "text-bear"}`}>
        {changePct >= 0 ? "+" : ""}
        {changePct.toFixed(2)}%
      </div>
    </div>
  );
}

function Market() {
  const navigate = useNavigate();
  const { data: market, isLoading: isMarketLoading } = useMarketOverview();
  const { data: scan, isLoading: isScanLoading } = useScanResults({});

  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const indices = market?.indices ?? [];
  const sectors = market?.sectors ?? [];
  const stocks = scan?.stocks ?? [];

  const sortedSectors = useMemo(() => {
    return [...sectors].sort((a, b) => b.change - a.change);
  }, [sectors]);

  const gainers = useMemo(
    () => [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 5),
    [stocks]
  );
  const losers = useMemo(
    () => [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 5),
    [stocks]
  );
  const active = useMemo(
    () => [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5),
    [stocks]
  );

  if (isMarketLoading || isScanLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-10 animate-pulse select-none">
        <div>
          <div className="h-3 w-16 bg-white/[0.05] rounded" />
          <div className="h-8 w-48 bg-white/[0.04] mt-2 rounded" />
        </div>

        {/* Index Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 space-y-4">
              <div className="h-3.5 w-24 bg-white/[0.06] rounded" />
              <div className="h-8 w-32 bg-white/[0.04] rounded" />
              <div className="h-4.5 w-16 bg-white/[0.03] rounded" />
            </div>
          ))}
        </div>

        {/* Sector Heatmap & Tickers list skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 glass-card p-6 space-y-4">
            <div className="h-4 w-36 bg-white/[0.05] rounded" />
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/[0.02] border border-white/5" />
              ))}
            </div>
          </div>
          <div className="glass-card p-6 space-y-4">
            <div className="h-4 w-32 bg-white/[0.05] rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-white/[0.02]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 select-none">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Market</p>
        <h1 className="font-display mt-2 text-4xl">Today's tape</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {indices.map((i) => (
          <RealtimeIndexCard
            key={i.name}
            name={i.name}
            baseValue={i.value}
            baseChangePct={i.changePct}
          />
        ))}
      </div>

      {/* Sector Performance (styled identical to dashboard Sector Heatmap) */}
      <div className="glass-card p-6">
        <SectionHeading title="Sector performance" subtitle="Broad-market rotation snapshot (click to view stocks)" />
        {sortedSectors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sector performance data available.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
            {sortedSectors.map((s) => {
              const up = s.change >= 0;
              const intensity = Math.min(1, Math.abs(s.change) / 2.5);
              return (
                <motion.div
                  key={s.name}
                  whileHover={{ y: -5, scale: 1.04, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  onClick={() => setSelectedSector(s.name)}
                  className="rounded-xl border border-border p-3 aspect-[5/3] relative overflow-hidden cursor-pointer hover:border-white/35 hover:shadow-lg hover:shadow-black/50 transition-all select-none"
                  style={{
                    background: `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)), ${up ? `rgba(34,197,94,${0.08 + intensity * 0.18})` : `rgba(239,68,68,${0.08 + intensity * 0.18})`}`,
                  }}
                >
                  <div className="text-xs text-foreground/90 leading-tight">{s.name}</div>
                  <div className={`absolute bottom-3 left-3 font-display text-lg ${up ? "text-bull" : "text-bear"}`}>
                    {up ? "+" : ""}
                    {s.change.toFixed(2)}%
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gainers / Losers / Active Rows Redesigned for Click-Nav & Gradient Badges */}
      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { title: "Top gainers", data: gainers },
          { title: "Top losers", data: losers },
          { title: "Most active", data: active },
        ].map((b) => (
          <div key={b.title} className="glass-card p-6 flex flex-col justify-between">
            <div>
              <SectionHeading title={b.title} />
              {b.data.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No ticker data available.</p>
              ) : (
                <div className="space-y-1 mt-4">
                  {b.data.map((s) => (
                    <Link
                      key={s.ticker}
                      to="/stock/$ticker"
                      params={{ ticker: s.ticker }}
                      className="flex items-center gap-3 px-2 py-2.5 transition-all duration-300 hover:bg-white/[0.015] rounded-xl relative group border border-transparent hover:border-white/5 active:bg-white/[0.03]"
                    >
                      {/* Avatar Icon */}
                      <StockLogo
                        ticker={s.ticker}
                        size={36}
                        className="rounded-xl group-hover:scale-105 transition-transform"
                      />

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-xs font-bold text-foreground group-hover:text-[#3b82f6] transition-colors leading-none block">
                          {s.ticker}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px] sm:max-w-[150px] mt-1 block">
                          {s.company}
                        </span>
                      </div>

                      {/* Prices & Badges */}
                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-foreground">
                          <RealtimePriceCell ticker={s.ticker} basePrice={s.cmp} baseChangePct={s.changePct} />
                        </div>
                        <div className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-1 ${s.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                          {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sector Details Dialogue Popup */}
      <Dialog open={selectedSector !== null} onOpenChange={(open) => !open && setSelectedSector(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 bg-[#111111] border border-white/10 text-foreground overflow-hidden">
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
