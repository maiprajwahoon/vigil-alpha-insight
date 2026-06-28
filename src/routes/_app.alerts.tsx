import { createFileRoute } from "@tanstack/react-router";
import { Activity, BarChart3, Bell, FileText, TrendingUp, Zap } from "lucide-react";
import { SectionHeading } from "@/components/Primitives";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({ meta: [{ title: "Alerts — LynchMark" }] }),
  component: Alerts,
});

const CARDS = [
  { icon: TrendingUp, title: "Price crossed Pivot", count: 8, hint: "Across 5 watchlist names" },
  { icon: Zap, title: "Weekly Breakout", count: 14, hint: "In the last 5 sessions" },
  { icon: Activity, title: "Volume Spike", count: 22, hint: "Above 2x 50-day average" },
  { icon: FileText, title: "Quarterly Results", count: 6, hint: "Reporting this week" },
  { icon: BarChart3, title: "EPS Growth", count: 11, hint: "Accelerating year-on-year" },
  { icon: Bell, title: "New VCP", count: 9, hint: "Fresh contraction patterns" },
];

function Alerts() {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Alerts</p>
        <h1 className="font-display mt-2 text-4xl">Signals worth your attention</h1>
        <p className="mt-1 text-sm text-muted-foreground">We'll notify you when opportunity appears.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.title} className="glass-card group p-6 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05]">
                <c.icon className="h-4.5 w-4.5" strokeWidth={1.6} />
              </div>
              <span className="font-display text-3xl">{c.count}</span>
            </div>
            <div className="mt-5">
              <div className="text-sm">{c.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <SectionHeading title="Recent activity" subtitle="A timeline of triggered alerts" />
        <ol className="relative space-y-6 border-l border-border pl-6">
          {[
            { t: "Just now", title: "BEL", body: "Weekly breakout above pivot 308 confirmed on 2.1x volume." },
            { t: "12m ago", title: "HAL", body: "Entered pivot zone within 1.2%. Contraction tightening." },
            { t: "1h ago", title: "KPIGREEN", body: "Volume spike 2.4x — early accumulation signature." },
            { t: "3h ago", title: "ICICIBANK", body: "New weekly VCP detected. 4th contraction in formation." },
            { t: "5h ago", title: "TRENT", body: "Quarterly results scheduled in 2 days." },
          ].map((e) => (
            <li key={e.t} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-foreground ring-4 ring-background" />
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{e.t}</div>
              <div className="mt-1 text-sm"><span className="font-mono text-xs mr-2">{e.title}</span>{e.body}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
