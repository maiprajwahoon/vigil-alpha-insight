import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, GitCompareArrows, Loader2, Share2, Star } from "lucide-react";
import { SectionHeading, ScoreBar, StatusChip } from "@/components/Primitives";
import { StockChart } from "@/components/StockChart";
import { useStock, useStockChart } from "@/hooks/use-scanner";
import { motion } from "@/lib/motion-shim";
import type { StockDetail } from "@/lib/types/stock";
import { isInWatchlist, toggleWatchlist } from "@/lib/watchlist";

export const Route = createFileRoute("/_app/stock/$ticker")({
  head: ({ params }) => ({ meta: [{ title: `${params.ticker} — LynchMark` }] }),
  component: StockPage,
  notFoundComponent: () => (
    <div className="grid place-items-center py-32 text-center">
      <h2 className="font-display text-3xl">Ticker not found</h2>
      <Link to="/scanner" className="mt-4 text-sm text-muted-foreground hover:text-foreground">Back to scanner</Link>
    </div>
  ),
});

const TABS = ["Overview", "Chart", "Fundamentals", "Technical", "Financials", "News"] as const;

function StockPage() {
  const { ticker } = Route.useParams();
  const { data: stock, isLoading, isError } = useStock(ticker);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [watchlisted, setWatchlisted] = useState(() => isInWatchlist(ticker));
  const { data: chart } = useStockChart(ticker, tab === "Chart");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading {ticker}…
      </div>
    );
  }

  if (isError || !stock) throw notFound();

  const handleWatchlist = () => {
    toggleWatchlist(ticker);
    setWatchlisted(isInWatchlist(ticker));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="glass-card p-6 md:p-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/[0.05] font-mono text-sm">
              {stock.ticker.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{stock.ticker}</span>
                <span>·</span>
                <span>{stock.sector}</span>
              </div>
              <h1 className="font-display mt-1 truncate text-3xl md:text-4xl">{stock.company}</h1>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <span className="font-display text-3xl">₹{stock.cmp.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className={`text-sm ${stock.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                  {stock.changePct >= 0 ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePct.toFixed(2)}%) today
                </span>
                <span className="text-xs text-muted-foreground">Mkt cap ₹{(stock.marketCap / 1000).toFixed(1)}k Cr</span>
                <StatusChip status={stock.status} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <HeaderBtn icon={Star} label={watchlisted ? "Watching" : "Watchlist"} onClick={handleWatchlist} active={watchlisted} />
            <HeaderBtn icon={Bell} label="Alert" />
            <HeaderBtn icon={GitCompareArrows} label="Compare" />
            <HeaderBtn icon={Share2} label="Share" />
          </div>
        </div>

        <div className="mt-8 flex gap-1 overflow-x-auto border-t border-border pt-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative whitespace-nowrap rounded-lg px-4 py-2 text-sm transition ${
                tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === t && (
                <motion.span layoutId="stock-tab" className="absolute inset-0 rounded-lg bg-white/[0.06]" />
              )}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === "Overview" && <Overview stock={stock} />}
      {tab === "Chart" && <ChartPanel chart={chart} ticker={ticker} />}
      {tab === "Fundamentals" && <Fundamentals stock={stock} />}
      {tab === "Technical" && <VCPTimeline stock={stock} />}
      {tab === "Financials" && <Fundamentals stock={stock} />}
      {tab === "News" && <News />}
    </div>
  );
}

function HeaderBtn({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof Star;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
        active ? "border-white/20 bg-white/[0.08] text-foreground" : "border-border bg-white/[0.02] text-foreground hover:bg-white/[0.06]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
      {label}
    </button>
  );
}

function Overview({ stock }: { stock: StockDetail }) {
  const cards: Array<{ label: string; value: number }> = [
    { label: "Growth Quality", value: stock.growthQuality },
    { label: "Business Quality", value: stock.businessQuality },
    { label: "Valuation", value: stock.valuation },
    { label: "Technical Strength", value: stock.technicalStrength },
    { label: "Breakout Readiness", value: stock.breakoutReadiness },
    { label: "Investment Quality", value: stock.investmentQuality },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
              <span className="font-mono text-sm">{c.value}/100</span>
            </div>
            <div className="mt-3 font-display text-3xl">{rating(c.value)}</div>
            <div className="mt-3"><ScoreBar value={c.value} /></div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <SectionHeading title="LynchMark summary" subtitle="A narrative read of the setup" />
          <p className="text-sm leading-relaxed text-foreground/90">
            <span className="font-medium">{stock.company}</span> exhibits{" "}
            {stock.businessQuality >= 70 ? "durable economics" : "mixed fundamentals"} with a {stock.roe.toFixed(0)}% return on equity,
            and revenue compounding at {stock.revGrowth.toFixed(0)}% over recent years. The chart shows a{" "}
            {stock.vcp.contractionCount >= 3 ? "tightening weekly base with diminishing volume" : "developing base structure"} —{" "}
            {stock.breakoutReadiness > 80 ? "within striking distance" : "approaching"} its pivot at ₹{stock.vcp.pivotPrice.toFixed(0)}.
            Pattern integrity: {stock.vcp.patternIntegrity}.
          </p>
        </div>
        <div className="glass-card p-6">
          <SectionHeading title="Risk meter" />
          <RiskMeter value={100 - stock.valuation} />
        </div>
      </div>
    </div>
  );
}

function rating(v: number) {
  if (v >= 90) return "Exceptional";
  if (v >= 80) return "Excellent";
  if (v >= 70) return "Strong";
  if (v >= 60) return "Solid";
  return "Mixed";
}

function RiskMeter({ value }: { value: number }) {
  return (
    <div className="mt-4 grid place-items-center">
      <svg viewBox="0 0 200 120" className="h-44 w-full">
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke="white"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="251"
          initial={{ strokeDashoffset: 251 }}
          animate={{ strokeDashoffset: 251 - (value / 100) * 251 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="-mt-12 text-center">
        <div className="font-display text-3xl">{value < 30 ? "Low" : value < 60 ? "Moderate" : "Elevated"}</div>
        <div className="text-xs text-muted-foreground">Risk profile</div>
      </div>
    </div>
  );
}

function ChartPanel({ chart, ticker }: { chart: ReturnType<typeof useStockChart>["data"]; ticker: string }) {
  if (!chart) {
    return (
      <div className="glass-card flex items-center justify-center gap-2 p-24 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading weekly chart for {ticker}…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 text-xs mb-4">
          {[
            { name: "50 EMA", c: "rgba(255,255,255,0.85)" },
            { name: "150 EMA", c: "rgba(255,255,255,0.55)" },
            { name: "200 EMA", c: "rgba(255,255,255,0.3)" },
          ].map((l) => (
            <span key={l.name} className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="h-0.5 w-4 rounded-full" style={{ background: l.c }} />
              {l.name}
            </span>
          ))}
        </div>
        <StockChart data={chart} />
      </div>
    </div>
  );
}

function VCPTimeline({ stock }: { stock: StockDetail }) {
  const { vcp } = stock;
  const stages = vcp.stages.length
    ? vcp.stages
    : [{ name: "Base forming", pct: 40, depth: "—" }];

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 md:p-8">
        <SectionHeading title="VCP analysis" subtitle="Weekly volatility contraction structure" />
        <div className="relative grid gap-6 md:grid-cols-6">
          {stages.map((s, i) => (
            <div key={`${s.name}-${i}`} className="relative">
              {i < stages.length - 1 && (
                <div className="absolute left-full top-4 hidden h-px w-full -translate-x-2 bg-border md:block" />
              )}
              <div className="grid h-8 w-8 place-items-center rounded-full border border-border bg-white/[0.04] text-xs font-mono">{i + 1}</div>
              <div className="mt-3 text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.depth}</div>
              <div className="mt-3"><ScoreBar value={s.pct} /></div>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-white/[0.015] p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Breakout probability</div>
              <div className="font-display mt-1 text-4xl">{vcp.breakoutProbability}%</div>
            </div>
            <div className="text-xs text-muted-foreground max-w-xs text-right">
              Pattern integrity: {vcp.patternIntegrity} · Distance to pivot: {Math.abs(vcp.distanceToPivotPct).toFixed(1)}% ·
              Contractions: {vcp.contractionCount}
            </div>
          </div>
          <div className="mt-4"><ScoreBar value={vcp.breakoutProbability} /></div>
        </div>
      </div>
    </div>
  );
}

function Fundamentals({ stock }: { stock: StockDetail }) {
  const fmt = (v: number, suffix = "") => (Number.isFinite(v) && v !== 0 ? `${v.toFixed(suffix === "%" ? 0 : 1)}${suffix}` : "—");

  const items = [
    { label: "Revenue Growth", value: fmt(stock.revGrowth, "%") },
    { label: "EPS Growth", value: fmt(stock.epsGrowth, "%") },
    { label: "PEG Ratio", value: stock.peg < 50 ? stock.peg.toFixed(2) : "—" },
    { label: "ROE", value: fmt(stock.roe, "%") },
    { label: "ROCE", value: fmt(stock.roce, "%") },
    { label: "Debt / Equity", value: fmt(stock.debtEquity) },
    { label: "Operating Margin", value: fmt(stock.opMargin, "%") },
    { label: "Net Margin", value: fmt(stock.netMargin, "%") },
    { label: "P/E", value: stock.pe > 0 ? stock.pe.toFixed(1) : "—" },
    { label: "Book Value", value: stock.bookValue ? `₹${stock.bookValue.toFixed(0)}` : "—" },
    { label: "Net Profit", value: stock.netProfit ? `₹${(stock.netProfit / 10_000_000).toFixed(0)} Cr` : "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        {items.map((m) => (
          <div key={m.label} className="glass-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</div>
            <div className="font-display mt-2 text-2xl">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function News() {
  return (
    <div className="glass-card p-6">
      <SectionHeading title="Latest news" subtitle="News feed requires a dedicated provider — coming soon" />
      <p className="text-sm text-muted-foreground">Fundamental and technical analysis above is live from Yahoo Finance.</p>
    </div>
  );
}
