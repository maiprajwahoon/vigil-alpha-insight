import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SectionHeading, StatusChip } from "@/components/Primitives";
import { StockLogo } from "@/components/StockLogo";
import { CompanyMetadataService } from "@/lib/stock-resolver";
import { useScanResults } from "@/hooks/use-scanner";

export const Route = createFileRoute("/_app/explorer")({
  head: () => ({ meta: [{ title: "Stock Explorer — LynchMark" }] }),
  component: Explorer,
});

function Explorer() {
  const { data, isLoading } = useScanResults({});
  const stocks = data?.stocks ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Explorer</p>
        <h1 className="font-display mt-2 text-4xl">Browse the universe</h1>
        <p className="mt-1 text-sm text-muted-foreground">Curated tiles for fast discovery across sectors and setups.</p>
      </div>

      <SectionHeading title="High-conviction setups" subtitle="GARP fundamentals with weekly VCP confirmation" />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3.5 w-16 bg-white/[0.05] rounded" />
                  <div className="h-3 w-32 bg-white/[0.03] rounded" />
                </div>
                <div className="h-5 w-16 bg-white/[0.04] rounded-full" />
              </div>
              <div className="flex items-end justify-between pt-2">
                <div className="space-y-1.5">
                  <div className="h-5.5 w-20 bg-white/[0.05] rounded" />
                  <div className="h-3 w-12 bg-white/[0.03] rounded" />
                </div>
                <div className="space-y-1.5 flex flex-col items-end">
                  <div className="h-3 w-12 bg-white/[0.03] rounded" />
                  <div className="h-3.5 w-8 bg-white/[0.05] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stocks.map((s) => (
            <Link
              key={s.ticker}
              to="/stock/$ticker"
              params={{ ticker: s.ticker }}
              className="glass-card group p-5 transition hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <StockLogo ticker={s.ticker} size={28} className="rounded-lg shrink-0" />
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-muted-foreground">{s.ticker}</div>
                    <div className="mt-0.5 text-sm truncate font-medium text-foreground/95" title={CompanyMetadataService.getOfficialName(s.ticker, s.company)}>
                      {CompanyMetadataService.getOfficialName(s.ticker, s.company)}
                    </div>
                  </div>
                </div>
                <StatusChip status={s.status} />
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="font-display text-2xl">₹{s.cmp.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  <div className={`text-xs ${s.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                    {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}% today
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Investment</div>
                  <div className="font-mono text-sm">{s.investmentQuality}/100</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
