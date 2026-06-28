import { createFileRoute } from "@tanstack/react-router";
import { SectionHeading } from "@/components/Primitives";
import { INDICES, SECTORS, STOCKS } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/market")({
  head: () => ({ meta: [{ title: "Market — LynchMark" }] }),
  component: Market,
});

function Market() {
  const gainers = [...STOCKS].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers = [...STOCKS].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
  const active = [...STOCKS].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Market</p>
        <h1 className="font-display mt-2 text-4xl">Today's tape</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {INDICES.map((i) => (
          <div key={i.name} className="glass-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{i.name}</div>
            <div className="mt-3 font-display text-3xl">{i.value.toLocaleString()}</div>
            <div className={`mt-2 text-sm ${i.change >= 0 ? "text-bull" : "text-bear"}`}>
              {i.change >= 0 ? "+" : ""}{i.change.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <SectionHeading title="Sector performance" subtitle="Broad-market rotation snapshot" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
          {SECTORS.map((s) => {
            const up = s.change >= 0;
            const intensity = Math.min(1, Math.abs(s.change) / 2.5);
            return (
              <div
                key={s.name}
                className="rounded-xl border border-border p-3 aspect-[5/3] relative overflow-hidden"
                style={{ background: up ? `rgba(34,197,94,${0.08 + intensity * 0.2})` : `rgba(239,68,68,${0.08 + intensity * 0.2})` }}
              >
                <div className="text-xs text-foreground/90">{s.name}</div>
                <div className={`absolute bottom-3 left-3 font-display text-lg ${up ? "text-bull" : "text-bear"}`}>
                  {up ? "+" : ""}{s.change.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { title: "Top gainers", data: gainers },
          { title: "Top losers", data: losers },
          { title: "Most active", data: active },
        ].map((b) => (
          <div key={b.title} className="glass-card p-6">
            <SectionHeading title={b.title} />
            <ul className="space-y-3">
              {b.data.map((s) => (
                <li key={s.ticker} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-mono text-xs">{s.ticker}</div>
                    <div className="text-xs text-muted-foreground">{s.company}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">₹{s.cmp.toLocaleString()}</div>
                    <div className={`text-xs ${s.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                      {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
