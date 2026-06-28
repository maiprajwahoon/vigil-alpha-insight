import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Bell, GitCompareArrows, Share2, Star } from "lucide-react";
import { SectionHeading, ScoreBar, StatusChip } from "@/components/Primitives";
import { STOCKS } from "@/lib/mock-data";

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
  const s = STOCKS.find((x) => x.ticker === ticker);
  if (!s) throw notFound();
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="glass-card p-6 md:p-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/[0.05] font-mono text-sm">
              {s.ticker.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{s.ticker}</span>
                <span>·</span>
                <span>{s.sector}</span>
              </div>
              <h1 className="font-display mt-1 truncate text-3xl md:text-4xl">{s.company}</h1>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <span className="font-display text-3xl">₹{s.cmp.toLocaleString()}</span>
                <span className={`text-sm ${s.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                  {s.changePct >= 0 ? "+" : ""}{s.change} ({s.changePct.toFixed(2)}%) today
                </span>
                <span className="text-xs text-muted-foreground">Mkt cap ₹{(s.marketCap / 1000).toFixed(1)}k Cr</span>
                <StatusChip status={s.status} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <HeaderBtn icon={Star} label="Watchlist" />
            <HeaderBtn icon={Bell} label="Alert" />
            <HeaderBtn icon={GitCompareArrows} label="Compare" />
            <HeaderBtn icon={Share2} label="Share" />
          </div>
        </div>

        {/* tabs */}
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

      {tab === "Overview" && <Overview stock={s} />}
      {tab === "Chart" && <Chart />}
      {tab === "Fundamentals" && <Fundamentals stock={s} />}
      {tab === "Technical" && <VCPTimeline />}
      {tab === "Financials" && <Fundamentals stock={s} />}
      {tab === "News" && <News />}
    </div>
  );
}

function HeaderBtn({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white/[0.02] px-3 py-2 text-xs text-foreground transition hover:bg-white/[0.06]">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
      {label}
    </button>
  );
}

function Overview({ stock }: { stock: typeof STOCKS[number] }) {
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
            <span className="font-medium">{stock.company}</span> exhibits durable economics with consistent free cash flow,
            a {stock.roe}% return on equity, and revenue compounding at {stock.revGrowth}% over recent years. The chart
            shows a tightening weekly base with diminishing volume — a textbook contraction pattern — within {stock.breakoutReadiness > 80 ? "striking" : "approachable"} distance of its pivot.
            For a patient investor, the combination of business quality and structural readiness offers an asymmetric setup.
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

function Chart() {
  const ranges = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"];
  const active = "1W";
  return (
    <div className="space-y-4">
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1">
            {ranges.map((r) => (
              <button
                key={r}
                className={`rounded-lg px-3 py-1.5 text-xs ${r === active ? "bg-white text-background" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs">
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
        </div>

        <div className="relative mt-6 h-80 rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_60%)]">
          {/* mock chart */}
          <svg viewBox="0 0 600 240" className="h-full w-full">
            <defs>
              <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.18" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,180 C60,160 100,170 140,140 C200,100 240,150 290,120 C340,90 390,110 440,80 C500,50 550,90 600,40 L600,240 L0,240 Z" fill="url(#area)" />
            <path d="M0,180 C60,160 100,170 140,140 C200,100 240,150 290,120 C340,90 390,110 440,80 C500,50 550,90 600,40" fill="none" stroke="white" strokeWidth="1.5" />
            <path d="M0,200 L600,90" stroke="white" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          <div className="absolute right-4 top-4 rounded-md border border-border bg-background/70 px-2 py-1 font-mono text-[10px] text-muted-foreground">Weekly · Last 156 bars</div>
        </div>

        <div className="mt-4 h-20 rounded-2xl border border-border">
          <svg viewBox="0 0 600 60" className="h-full w-full">
            {Array.from({ length: 60 }).map((_, i) => {
              const h = 8 + ((i * 17) % 40);
              return <rect key={i} x={i * 10 + 2} y={60 - h} width="6" height={h} fill="rgba(255,255,255,0.18)" />;
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

function VCPTimeline() {
  const stages = [
    { name: "Contraction 1", pct: 100, depth: "-28%" },
    { name: "Contraction 2", pct: 100, depth: "-17%" },
    { name: "Contraction 3", pct: 100, depth: "-9%" },
    { name: "Contraction 4", pct: 88, depth: "-5%" },
    { name: "Volume dry-up", pct: 72, depth: "0.4x avg" },
    { name: "Pivot", pct: 56, depth: "₹312" },
  ];
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 md:p-8">
        <SectionHeading title="VCP analysis" subtitle="Weekly volatility contraction structure" />
        <div className="relative grid gap-6 md:grid-cols-6">
          {stages.map((s, i) => (
            <div key={s.name} className="relative">
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
              <div className="font-display mt-1 text-4xl">76%</div>
            </div>
            <div className="text-xs text-muted-foreground max-w-xs text-right">
              Pattern integrity: high · Distance to pivot: 1.4% · Relative strength: 92nd percentile
            </div>
          </div>
          <div className="mt-4"><ScoreBar value={76} /></div>
        </div>
      </div>
    </div>
  );
}

function Fundamentals({ stock }: { stock: typeof STOCKS[number] }) {
  const items = [
    { label: "Revenue Growth", value: `${stock.revGrowth}%` },
    { label: "EPS Growth", value: `${stock.epsGrowth}%` },
    { label: "PEG Ratio", value: stock.peg.toFixed(2) },
    { label: "ROE", value: `${stock.roe}%` },
    { label: "ROCE", value: `${stock.roce}%` },
    { label: "Debt / Equity", value: stock.debtEquity.toFixed(2) },
    { label: "Operating Margin", value: `${stock.opMargin}%` },
    { label: "Net Margin", value: `${stock.netMargin}%` },
    { label: "P/E", value: stock.pe.toFixed(1) },
    { label: "Cash Flow", value: "₹4,820 Cr" },
    { label: "Book Value", value: "₹186" },
    { label: "Net Profit", value: "₹3,210 Cr" },
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

      <div className="glass-card p-6">
        <SectionHeading title="Shareholding pattern" />
        <div className="grid gap-2 sm:grid-cols-4">
          {[
            { name: "Promoters", v: 52.3 },
            { name: "FIIs", v: 22.8 },
            { name: "DIIs", v: 14.6 },
            { name: "Public", v: 10.3 },
          ].map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-white/[0.015] p-4">
              <div className="text-xs text-muted-foreground">{p.name}</div>
              <div className="font-display mt-1 text-2xl">{p.v}%</div>
              <div className="mt-2"><ScoreBar value={p.v} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function News() {
  return (
    <div className="glass-card p-6">
      <SectionHeading title="Latest news" subtitle="A clean digest, updated through the day" />
      <ul className="divide-y divide-border">
        {[
          "Order book swells past ₹1.1 lakh crore as new tenders close",
          "Management guides for 22% revenue growth through FY26",
          "Brokerage upgrades target on operating leverage thesis",
          "Quarterly results expected to beat consensus on margins",
          "Promoter shareholding remains steady — no dilution flagged",
        ].map((t, i) => (
          <li key={t} className="flex items-start gap-4 py-4">
            <div className="text-xs text-muted-foreground w-16 shrink-0">{i + 1}d ago</div>
            <div className="text-sm text-foreground/90">{t}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
