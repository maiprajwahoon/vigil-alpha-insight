import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SectionHeading, StatusChip } from "@/components/Primitives";
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
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading universe…
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
                <div>
                  <div className="font-mono text-[11px] text-muted-foreground">{s.ticker}</div>
                  <div className="mt-0.5 text-sm">{s.company}</div>
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
