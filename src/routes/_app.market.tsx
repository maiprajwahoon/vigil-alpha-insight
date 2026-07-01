import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { SectionHeading } from "@/components/Primitives";
import { useMarketOverview, useScanResults } from "@/hooks/use-scanner";
import { useRealtimePrice, RealtimePriceCell } from "@/hooks/use-realtime-price";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/market")({
  head: () => ({ meta: [{ title: "Market — LynchMark" }] }),
  component: Market,
});

const INDEX_SYMBOLS: Record<string, string> = {
  "NIFTY 50": "^NSEI",
  "SENSEX": "^BSESN",
  "BANK NIFTY": "^NSEBANK",
};

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
  const { data: market, isLoading: isMarketLoading } = useMarketOverview();
  const { data: scan, isLoading: isScanLoading } = useScanResults({});

  const indices = market?.indices ?? [];
  const sectors = market?.sectors ?? [];
  const stocks = scan?.stocks ?? [];

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
      <div className="flex items-center justify-center gap-2 py-32 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading market data…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10">
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

      <div className="glass-card p-6">
        <SectionHeading title="Sector performance" subtitle="Broad-market rotation snapshot" />
        {sectors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sector performance data available.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
            {sectors.map((s) => {
              const up = s.change >= 0;
              const intensity = Math.min(1, Math.abs(s.change) / 2.5);
              return (
                <div
                  key={s.name}
                  className="rounded-xl border border-border p-3 aspect-[5/3] relative overflow-hidden"
                  style={{
                    background: up
                      ? `rgba(34,197,94,${0.08 + intensity * 0.2})`
                      : `rgba(239,68,68,${0.08 + intensity * 0.2})`,
                  }}
                >
                  <div className="text-xs text-foreground/90">{s.name}</div>
                  <div className={`absolute bottom-3 left-3 font-display text-lg ${up ? "text-bull" : "text-bear"}`}>
                    {up ? "+" : ""}
                    {s.change.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { title: "Top gainers", data: gainers },
          { title: "Top losers", data: losers },
          { title: "Most active", data: active },
        ].map((b) => (
          <div key={b.title} className="glass-card p-6">
            <SectionHeading title={b.title} />
            {b.data.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No ticker data available.</p>
            ) : (
              <ul className="space-y-3">
                {b.data.map((s) => (
                  <li key={s.ticker} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-mono text-xs">{s.ticker}</div>
                      <div className="text-xs text-muted-foreground">{s.company}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">
                        <RealtimePriceCell
                          ticker={s.ticker}
                          basePrice={s.cmp}
                          baseChangePct={s.changePct}
                        />
                      </div>
                      <div className="text-xs">
                        <RealtimePriceCell
                          ticker={s.ticker}
                          basePrice={s.cmp}
                          baseChangePct={s.changePct}
                          showChangePct={true}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
