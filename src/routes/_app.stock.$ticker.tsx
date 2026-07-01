import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bell, GitCompareArrows, Loader2, Share2, Star, CheckCircle2, Newspaper } from "lucide-react";
import { SectionHeading, ScoreBar, StatusChip } from "@/components/Primitives";
import { StockChart } from "@/components/StockChart";
import { OverviewDashboard } from "@/components/OverviewDashboard";
import { TechnicalDashboard } from "@/components/TechnicalDashboard";
import { useStock, useStockChart, useStockNews } from "@/hooks/use-scanner";
import { useRealtimePrice } from "@/hooks/use-realtime-price";
import { motion } from "@/lib/motion-shim";
import type { StockDetail } from "@/lib/types/stock";
import { isInWatchlist, toggleWatchlist } from "@/lib/watchlist";

export const Route = createFileRoute("/_app/stock/$ticker")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || "Overview",
      timeframe: (search.timeframe as string) || "1d",
    };
  },
  head: ({ params }) => ({ meta: [{ title: `${params.ticker} — LynchMark` }] }),
  component: StockPage,
  notFoundComponent: () => (
    <div className="grid place-items-center py-32 text-center">
      <h2 className="font-display text-3xl">Ticker not found</h2>
      <Link to="/scanner" className="mt-4 text-sm text-muted-foreground hover:text-foreground">Back to scanner</Link>
    </div>
  ),
});

const TABS = ["Overview", "Chart", "Fundamentals", "Technical", "News"] as const;

function StockPage() {
  const { ticker } = Route.useParams();
  const { tab: activeTab, timeframe: activeTimeframe } = Route.useSearch();
  const navigate = useNavigate();

  const setTab = (newTab: string) => {
    navigate({
      search: (prev) => ({ ...prev, tab: newTab }),
    });
  };

  const setTimeframe = (newTf: string) => {
    navigate({
      search: (prev) => ({ ...prev, timeframe: newTf }),
    });
  };

  const { data: stock, isLoading, isError, refetch } = useStock(ticker);
  const [watchlisted, setWatchlisted] = useState(() => isInWatchlist(ticker));
  const [rangeYears, setRangeYears] = useState(3);

  // Reset rangeYears to 3 when timeframe changes
  useEffect(() => {
    setRangeYears(3);
  }, [activeTimeframe]);

  const { data: chart } = useStockChart(ticker, activeTimeframe, rangeYears);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading {ticker}…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
        <div className="text-sm font-semibold text-bear">Failed to load stock data</div>
        <p className="text-xs text-muted-foreground max-w-xs">
          The exchange connection timed out or is temporarily busy.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 rounded-xl bg-card border border-border px-4 py-2 text-xs text-foreground hover:bg-white/5 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <h2 className="font-display text-3xl">Ticker not found</h2>
        <Link to="/scanner" className="mt-4 text-sm text-muted-foreground hover:text-foreground">Back to scanner</Link>
      </div>
    );
  }

  const { price: tickingPrice, changePct: tickingChangePct, direction } = useRealtimePrice(stock.ticker, stock.cmp, stock.changePct);
  const previousClose = stock.cmp / (1 + (stock.changePct || 0) / 100);
  const tickingChange = tickingPrice - previousClose;

  const flashClass =
    direction === "up"
      ? "animate-flash-up text-bull"
      : direction === "down"
        ? "animate-flash-down text-bear"
        : "";

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
                <span className={`font-display text-3xl ${flashClass}`}>
                  ₹{tickingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-sm ${tickingChangePct >= 0 ? "text-bull" : "text-bear"}`}>
                  {tickingChangePct >= 0 ? "+" : ""}
                  {tickingChange.toFixed(2)} ({tickingChangePct.toFixed(2)}%) today
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
                activeTab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeTab === t && (
                <motion.span layoutId="stock-tab" className="absolute inset-0 rounded-lg bg-white/[0.06]" />
              )}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Overview" && <OverviewDashboard stock={stock} chart={chart} />}
      {activeTab === "Chart" && (
        <ChartPanel
          chart={chart}
          ticker={ticker}
          onTimeframeChange={setTimeframe}
          currentTimeframe={activeTimeframe}
          rangeYears={rangeYears}
          onRangeYearsChange={setRangeYears}
        />
      )}
      {activeTab === "Fundamentals" && <Fundamentals stock={stock} />}
      {activeTab === "Technical" && <TechnicalDashboard stock={stock} chart={chart} />}
      {activeTab === "News" && <NewsPanel ticker={ticker} />}
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



function ChartPanel({
  chart,
  ticker,
  onTimeframeChange,
  currentTimeframe,
  rangeYears,
  onRangeYearsChange,
}: {
  chart: ReturnType<typeof useStockChart>["data"];
  ticker: string;
  onTimeframeChange: (tf: string) => void;
  currentTimeframe: string;
  rangeYears: number;
  onRangeYearsChange: (years: number) => void;
}) {
  if (!chart) {
    return (
      <div className="glass-card flex items-center justify-center gap-2 p-24 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading chart for {ticker}…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StockChart
        data={chart}
        ticker={ticker}
        onTimeframeChange={onTimeframeChange}
        currentTimeframe={currentTimeframe}
        rangeYears={rangeYears}
        onRangeYearsChange={onRangeYearsChange}
      />
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

interface NewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: string;
  thumbnail?: {
    resolutions: Array<{ url: string; width: number; height: number }>;
  };
}

function NewsPanel({ ticker }: { ticker: string }) {
  const { data: news, isLoading, isError } = useStockNews(ticker);

  if (isLoading) {
    return (
      <div className="glass-card flex items-center justify-center gap-2 p-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-[#2563eb]" />
        <span>Loading latest news for {ticker}…</span>
      </div>
    );
  }

  if (isError || !news || news.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-sm text-muted-foreground">
        No recent news stories found for {ticker}.
      </div>
    );
  }

  // Helper mapping common publishers to domains for clean favicons
  const getPublisherDomain = (publisher: string): string => {
    const p = publisher.toLowerCase().trim();
    if (p.includes("moneycontrol")) return "moneycontrol.com";
    if (p.includes("economic times") || p.includes("economictimes")) return "economictimes.indiatimes.com";
    if (p.includes("livemint") || p.includes("mint")) return "livemint.com";
    if (p.includes("business standard") || p.includes("business-standard")) return "business-standard.com";
    if (p.includes("ndtv") || p.includes("ndtv profit")) return "ndtv.com";
    if (p.includes("cnbctv18") || p.includes("cnbc")) return "cnbctv18.com";
    if (p.includes("financial express") || p.includes("financialexpress")) return "financialexpress.com";
    if (p.includes("reuters")) return "reuters.com";
    if (p.includes("bloomberg")) return "bloomberg.com";
    if (p.includes("zeebiz") || p.includes("zee business")) return "zeebiz.com";
    if (p.includes("upstox")) return "upstox.com";
    if (p.includes("groww")) return "groww.in";
    if (p.includes("indiatimes")) return "indiatimes.com";
    if (p.includes("times of india") || p.includes("toi")) return "timesofindia.indiatimes.com";
    if (p.includes("hindu")) return "thehindu.com";
    if (p.includes("express")) return "indianexpress.com";
    
    const clean = p.replace(/[^a-z0-9]/g, "");
    return clean ? `${clean}.com` : "google.com";
  };

  return (
    <div className="space-y-6">
      <SectionHeading title="Latest news" subtitle={`Recent market stories mentioning ${ticker}`} />
      <div className="grid gap-4 md:grid-cols-2">
        {news.map((item: NewsItem) => {
          const domain = getPublisherDomain(item.publisher);
          const logoUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
          const pubDate = new Date(item.providerPublishTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <a
              key={item.uuid}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 rounded-2xl border border-border bg-[#181818] p-4 transition-all hover:bg-white/[0.03] hover:border-white/10"
            >
              {/* Publisher logo container */}
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/5 shadow-inner">
                <img
                  src={logoUrl}
                  alt={item.publisher}
                  className="h-5 w-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement?.querySelector(".fallback-icon");
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                  referrerPolicy="no-referrer"
                />
                <Newspaper className="fallback-icon h-4 w-4 text-muted-foreground hidden" />
              </div>

              {/* News details */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <span className="text-[#2563eb]">{item.publisher}</span>
                  <span>·</span>
                  <span>{pubDate}</span>
                </div>
                <h3 className="font-sans line-clamp-2 text-sm text-foreground/90 font-medium group-hover:text-[#2563eb] transition-colors leading-snug">
                  {item.title}
                </h3>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
