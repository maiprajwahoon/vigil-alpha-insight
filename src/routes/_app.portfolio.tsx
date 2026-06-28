import { createFileRoute } from "@tanstack/react-router";
import { StatCard, SectionHeading } from "@/components/Primitives";
import { PORTFOLIO } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — LynchMark" }] }),
  component: Portfolio,
});

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Portfolio() {
  const p = PORTFOLIO;
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Portfolio</p>
        <h1 className="font-display mt-2 text-4xl">Your positions</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current Value" value={fmt(p.currentValue)} />
        <StatCard label="Investment" value={fmt(p.invested)} />
        <StatCard label="Today's Gain" value={fmt(p.todaysGain)} delta={p.todaysGainPct} />
        <StatCard label="Overall Return" value={`+${p.overallReturn.toFixed(2)}`} suffix="%" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="glass-card p-6">
          <SectionHeading title="Holdings" subtitle="Position-level breakdown" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 font-medium">Ticker</th>
                  <th className="font-medium">Company</th>
                  <th className="text-right font-medium">Qty</th>
                  <th className="text-right font-medium">Avg</th>
                  <th className="text-right font-medium">CMP</th>
                  <th className="text-right font-medium">Value</th>
                  <th className="text-right font-medium">P/L</th>
                </tr>
              </thead>
              <tbody>
                {p.holdings.map((h) => {
                  const value = h.qty * h.cmp;
                  const pl = (h.cmp - h.avg) * h.qty;
                  const plPct = ((h.cmp - h.avg) / h.avg) * 100;
                  return (
                    <tr key={h.ticker} className="border-t border-border transition-colors hover:bg-white/[0.02]">
                      <td className="py-3.5 font-mono text-xs">{h.ticker}</td>
                      <td>{h.company}</td>
                      <td className="text-right font-mono">{h.qty}</td>
                      <td className="text-right font-mono text-muted-foreground">₹{h.avg.toFixed(2)}</td>
                      <td className="text-right font-mono">₹{h.cmp.toLocaleString()}</td>
                      <td className="text-right font-mono">₹{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                      <td className={`text-right font-mono ${pl >= 0 ? "text-bull" : "text-bear"}`}>
                        {pl >= 0 ? "+" : ""}{plPct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6">
          <SectionHeading title="Allocation" subtitle="By position weight" />
          {/* simple radial chart placeholder */}
          <div className="relative mx-auto grid h-56 w-56 place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              {(() => {
                let offset = 0;
                return p.holdings.map((h, i) => {
                  const c = 2 * Math.PI * 40;
                  const dash = (h.weight / 100) * c;
                  const el = (
                    <circle
                      key={h.ticker}
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={`hsl(0 0% ${85 - i * 6}%)`}
                      strokeWidth="10"
                      strokeDasharray={`${dash} ${c}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += dash;
                  return el;
                });
              })()}
            </svg>
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Holdings</div>
              <div className="font-display text-3xl">{p.holdings.length}</div>
            </div>
          </div>
          <ul className="mt-5 space-y-2 text-xs">
            {p.holdings.slice(0, 5).map((h, i) => (
              <li key={h.ticker} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: `hsl(0 0% ${85 - i * 6}%)` }} />
                  {h.ticker}
                </span>
                <span className="font-mono text-muted-foreground">{h.weight}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
