import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity, BarChart3, Bell, FileText, TrendingUp, Zap, Trash2 } from "lucide-react";
import { SectionHeading, ScoreBar, StatusChip } from "@/components/Primitives";
import { useScanResults } from "@/hooks/use-scanner";
import { RealtimePriceCell } from "@/hooks/use-realtime-price";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAlerts } from "@/hooks/use-alerts";
import { StockLogo } from "@/components/StockLogo";
import { CompanyMetadataService } from "@/lib/stock-resolver";

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

function getLogoGrad(ticker: string) {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `linear-gradient(135deg, hsl(${h}, 65%, 40%), hsl(${(h + 40) % 360}, 70%, 20%))`;
}

function Alerts() {
  const navigate = useNavigate();
  const { alerts, toggleAlert, deleteAlert } = useAlerts();
  const { data: scan } = useScanResults({});
  const stocks = scan?.stocks ?? [];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getMatchingStocks = (category: string) => {
    switch (category) {
      case "Price crossed Pivot":
        return stocks.filter((s) => s.status === "Near Pivot" || s.status === "Strong Buy" || s.breakoutReadiness >= 75);
      case "Weekly Breakout":
        return stocks.filter((s) => s.status === "Breakout" || s.status === "Extended");
      case "Volume Spike":
        return stocks.filter((s) => s.technicalStrength >= 70);
      case "Quarterly Results":
        return stocks.filter((s) => s.pe > 0 && s.roe > 20).slice(0, 8);
      case "EPS Growth":
        return stocks.filter((s) => s.epsGrowth >= 15);
      case "New VCP":
        return stocks.filter((s) => s.status === "VCP Ready");
      default:
        return [];
    }
  };

  const getDynamicCount = (title: string, defaultCount: number) => {
    if (stocks.length === 0) return defaultCount;
    return getMatchingStocks(title).length;
  };

  const matchingStocks = selectedCategory ? getMatchingStocks(selectedCategory) : [];

  return (
    <div className="mx-auto max-w-7xl space-y-10 select-none">
      {/* Title Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Alerts</p>
        <h1 className="font-display mt-2 text-4xl">Signals worth your attention</h1>
        <p className="mt-1 text-sm text-muted-foreground">Deterministic signal triggers across technical and fundamental patterns.</p>
      </div>

      {/* Signal Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((c) => {
          const isGreen = c.title.includes("Breakout") || c.title.includes("New VCP");
          const isBlue = c.title.includes("Pivot") || c.title.includes("Volume Spike");
          const accentClass = isGreen 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.06)] animate-pulse-subtle"
            : isBlue
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.06)]"
              : "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_15px_rgba(139,92,246,0.06)]";

          const count = getDynamicCount(c.title, c.count);

          return (
            <div 
              key={c.title} 
              onClick={() => setSelectedCategory(c.title)}
              className="glass-card group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.015] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-xl border transition-colors group-hover:scale-105 duration-300 ${accentClass}`}>
                  <c.icon className="h-4.5 w-4.5" strokeWidth={1.6} />
                </div>
                <span className="font-display text-4xl font-semibold tracking-tight text-foreground/90">{count}</span>
              </div>
              <div className="mt-5">
                <div className="text-sm font-semibold text-foreground group-hover:text-[#3b82f6] transition-colors">{c.title}</div>
                <div className="mt-1.5 text-xs text-muted-foreground/80">{c.hint}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Alerts Section */}
      <div className="glass-card p-6">
        <SectionHeading 
          title="Active Price Alerts" 
          subtitle="Your custom defined trigger thresholds and crossover alerts" 
        />
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/5 rounded-2xl mt-6">
            <Bell className="h-8 w-8 text-muted-foreground/50 mb-3 animate-pulse" strokeWidth={1.2} />
            <p className="text-sm text-muted-foreground font-sans">
              No custom alerts configured
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs leading-relaxed">
              Navigate to any stock details page and click the "Alert" button to configure your price thresholds.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60 [&>th]:px-4 [&>th]:pb-2">
                  <th className="font-medium">Ticker</th>
                  <th className="font-medium">Condition</th>
                  <th className="font-medium">Target Value</th>
                  <th className="font-medium text-center w-24">Status</th>
                  <th className="font-medium text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="group transition-colors hover:bg-white/[0.015] [&>td]:py-3 [&>td]:px-4">
                    <td className="font-mono text-xs font-semibold text-foreground">
                      <Link 
                        to="/stock/$ticker" 
                        params={{ ticker: alert.ticker }}
                        className="hover:underline hover:text-[#3b82f6]"
                      >
                        {alert.ticker}
                      </Link>
                    </td>
                    <td className="text-foreground/80 text-xs">
                      {alert.type}
                    </td>
                    <td className="font-mono text-xs text-foreground/80">
                      {alert.value !== null ? (alert.type.startsWith("RSI") ? `${alert.value}` : `₹${alert.value.toLocaleString()}`) : "—"}
                    </td>
                    <td className="text-center align-middle">
                      <button
                        onClick={() => toggleAlert(alert.id, !alert.is_active)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all border ${
                          alert.is_active
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-white/5 border-white/10 text-muted-foreground"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${alert.is_active ? "bg-emerald-400" : "bg-muted-foreground"} animate-pulse`} />
                        {alert.is_active ? "Enabled" : "Disabled"}
                      </button>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-1 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition active:scale-90"
                        title="Delete alert"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="glass-card p-6">
        <SectionHeading title="Recent activity" subtitle="A real-time timeline of triggered alerts" />
        <ol className="relative space-y-5 border-l border-white/5 pl-8 mt-6">
          {[
            { t: "Just now", title: "BEL", type: "Breakout", body: "Weekly breakout above pivot 308 confirmed on 2.1x volume." },
            { t: "12m ago", title: "HAL", type: "Near Pivot", body: "Entered pivot zone within 1.2%. Contraction tightening." },
            { t: "1h ago", title: "KPIGREEN", type: "Volume Spike", body: "Volume spike 2.4x — early accumulation signature." },
            { t: "3h ago", title: "ICICIBANK", type: "VCP", body: "New weekly VCP detected. 4th contraction in formation." },
            { t: "5h ago", title: "TRENT", type: "Earnings", body: "Quarterly results scheduled in 2 days." },
          ].map((e) => {
            const isGreen = e.type === "Breakout" || e.type === "Volume Spike";
            const isBlue = e.type === "VCP" || e.type === "Near Pivot";
            const dotColor = isGreen 
              ? "bg-emerald-400 ring-emerald-500/20" 
              : isBlue 
                ? "bg-blue-400 ring-blue-500/20" 
                : "bg-amber-400 ring-amber-500/20";

            return (
              <li key={e.title + e.t} className="relative">
                {/* Timeline Pulsing Node */}
                <span className={`absolute -left-[37px] top-6 h-2.5 w-2.5 rounded-full ring-4 ${dotColor} animate-pulse`} />
                
                {/* Clickable Card Link */}
                <Link
                  to="/stock/$ticker"
                  params={{ ticker: e.title }}
                  className="flex items-start gap-4 p-4 transition-all duration-300 hover:bg-white/[0.015] bg-white/[0.005] rounded-2xl border border-white/5 hover:border-white/10 relative group"
                >
                  {/* HSL Gradient Logo Avatar */}
                  <StockLogo
                    ticker={e.title}
                    size={40}
                    className="rounded-xl group-hover:scale-105 transition-transform"
                  />

                  {/* Alert Metadata & Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-foreground group-hover:text-[#3b82f6] transition-colors leading-none">
                          {e.title}
                        </span>
                        <span className={`rounded bg-white/5 px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider leading-none ${
                          isGreen ? "bg-emerald-500/10 border border-emerald-500/15 text-emerald-400" :
                          isBlue ? "bg-blue-500/10 border border-blue-500/15 text-blue-400" :
                          "bg-amber-500/10 border border-amber-500/15 text-amber-400"
                        }`}>
                          {e.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-medium">{e.t}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/85 mt-2 leading-relaxed truncate group-hover:text-foreground/90 transition-colors">
                      {e.body}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Interactive Category Stocks Dialog */}
      <Dialog open={selectedCategory !== null} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 bg-[#111111] border border-white/10 text-foreground overflow-hidden">
          <DialogHeader className="pb-4 border-b border-white/5">
            <DialogTitle className="font-display text-2xl text-foreground flex items-center gap-2">
              <span>{selectedCategory} Stocks</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              List of all scanned stocks matching the "{selectedCategory}" criteria.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
            {matchingStocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground font-sans">
                  No stocks are currently triggering this alert rule.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-2 max-w-xs leading-relaxed">
                  LynchMark is scanning live market data. Under consolidations, filters are highly strict to preserve capital.
                </p>
              </div>
            ) : (
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
                  {matchingStocks.map((x) => (
                    <tr
                      key={x.ticker}
                      onClick={() => {
                        setSelectedCategory(null);
                        navigate({
                          to: "/stock/$ticker",
                          params: { ticker: x.ticker },
                        });
                      }}
                      className="group transition-colors hover:bg-white/[0.04] cursor-pointer [&>td]:py-3 [&>td]:px-3 animate-fade-in"
                    >
                      <td className="font-mono text-xs font-semibold text-foreground group-hover:underline underline-offset-4">
                        {x.ticker}
                      </td>
                      <td className="text-foreground/85 truncate max-w-[180px]" title={CompanyMetadataService.getOfficialName(x.ticker, x.company)}>
                        {CompanyMetadataService.getOfficialName(x.ticker, x.company)}
                      </td>
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
