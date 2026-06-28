import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { StatCard, SectionHeading, StatusChip, ScoreBar } from "@/components/Primitives";
import { STOCKS, ALERTS, SECTORS } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LynchMark" }] }),
  component: Dashboard,
});

function Dashboard() {
  const top = [...STOCKS].sort((a, b) => b.investmentQuality - a.investmentQuality).slice(0, 6);
  const breakouts = STOCKS.filter((s) => s.status === "Breakout" || s.status === "VCP Ready").slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Overview</p>
        <h1 className="font-display mt-2 text-4xl">Good morning.</h1>
        <p className="mt-1 text-sm text-muted-foreground">A calm read of the market, curated for the patient investor.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Market Health" value="Strong" hint="Breadth +62% advancing" />
        <StatCard label="Strong Opportunities" value={28} delta={6.4} hint="Across 9 sectors" />
        <StatCard label="Weekly Breakouts" value={14} delta={2.1} hint="In the last 5 sessions" />
        <StatCard label="Watchlist Performance" value="+4.82" suffix="%" delta={0.74} hint="vs. NIFTY +0.62%" />
      </div>

      {/* Heatmap + Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-card p-6">
          <SectionHeading title="Sector heatmap" subtitle="Relative performance across the broader market" />
          <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
            {SECTORS.map((s) => {
              const up = s.change >= 0;
              const intensity = Math.min(1, Math.abs(s.change) / 2.5);
              return (
                <motion.div
                  key={s.name}
                  whileHover={{ y: -2 }}
                  className="relative aspect-[5/3] rounded-xl border border-border p-3 overflow-hidden"
                  style={{
                    background: `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)), ${up ? `rgba(34,197,94,${0.08 + intensity * 0.18})` : `rgba(239,68,68,${0.08 + intensity * 0.18})`}`,
                  }}
                >
                  <div className="text-xs text-foreground/90">{s.name}</div>
                  <div className={`absolute bottom-3 left-3 font-display text-xl ${up ? "text-bull" : "text-bear"}`}>
                    {up ? "+" : ""}{s.change.toFixed(2)}%
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-6">
          <SectionHeading title="Recent alerts" subtitle="Curated signals from your watchlist" />
          <ul className="-mx-2 divide-y divide-border">
            {ALERTS.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-2 py-3 transition-colors hover:bg-white/[0.02] rounded-lg">
                <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/[0.05] text-[10px] font-mono leading-none">{a.ticker.length > 5 ? a.ticker.slice(0, 4) : a.ticker}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">{a.type}</span>
                    <span className="text-[11px] text-muted-foreground">{a.time}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{a.message}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/alerts" className="mt-4 inline-flex items-center gap-1 text-xs text-foreground hover:underline underline-offset-4">
            View all alerts <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Top ranked stocks */}
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 font-medium">Ticker</th>
                <th className="font-medium">Company</th>
                <th className="font-medium">Sector</th>
                <th className="font-medium text-right">CMP</th>
                <th className="font-medium w-44">Investment Quality</th>
                <th className="font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {top.map((s) => (
                <tr key={s.ticker} className="group border-t border-border transition-colors hover:bg-white/[0.02]">
                  <td className="py-3.5 font-mono text-xs">
                    <Link to="/stock/$ticker" params={{ ticker: s.ticker }} className="hover:text-foreground">
                      {s.ticker}
                    </Link>
                  </td>
                  <td className="text-foreground/90">{s.company}</td>
                  <td className="text-muted-foreground">{s.sector}</td>
                  <td className="text-right font-mono">₹{s.cmp.toLocaleString()}</td>
                  <td><ScoreBar value={s.investmentQuality} /></td>
                  <td><StatusChip status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <SectionHeading title="Recent breakouts" subtitle="Confirmed weekly closes through pivot" />
          <ul className="space-y-3">
            {breakouts.map((s) => (
              <li key={s.ticker} className="flex items-center gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[0.04] font-mono text-[10px] leading-none">{s.ticker.length > 5 ? s.ticker.slice(0, 4) : s.ticker}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{s.company}</div>
                  <div className="text-xs text-muted-foreground">{s.sector}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">₹{s.cmp.toLocaleString()}</div>
                  <div className={`text-xs ${s.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                    {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-6">
          <SectionHeading title="Upcoming earnings" subtitle="Watchlist names reporting this week" />
          <ul className="space-y-3">
            {STOCKS.slice(0, 5).map((s, i) => (
              <li key={s.ticker} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.015] px-4 py-3">
                <div>
                  <div className="text-sm">{s.company}</div>
                  <div className="text-xs text-muted-foreground">{s.sector}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Reports in</div>
                  <div className="font-mono text-sm">{i + 1}d</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
