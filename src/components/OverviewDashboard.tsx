import type { StockDetail, ChartData } from "@/lib/types/stock";
import { compileDashboardData, getOwnershipData, getReturns } from "@/lib/stock-analysis";
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, FileText, Shield, DollarSign, BarChart2, PieChart } from "lucide-react";
import { motion } from "@/lib/motion-shim";

interface OverviewDashboardProps {
  stock: StockDetail;
  chart: ChartData | null;
}

export function OverviewDashboard({ stock, chart }: OverviewDashboardProps) {
  const data = compileDashboardData(stock, chart);
  const ownership = getOwnershipData(stock.ticker);
  const returns = getReturns(chart?.bars || []);

  // Helper for progress bar and rating colors
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 bg-emerald-500/20 stroke-emerald-400";
    if (score >= 70) return "text-teal-400 bg-teal-500/20 stroke-teal-400";
    if (score >= 55) return "text-blue-400 bg-blue-500/20 stroke-blue-400";
    if (score >= 40) return "text-amber-400 bg-amber-500/20 stroke-amber-400";
    return "text-rose-400 bg-rose-500/20 stroke-rose-400";
  };

  const getScoreBarClass = (score: number) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-teal-500";
    if (score >= 55) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getRatingLabel = (score: number) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Strong";
    if (score >= 55) return "Good";
    if (score >= 40) return "Average";
    if (score >= 25) return "Weak";
    return "Poor";
  };

  // Derive benchmarks returns
  const getBenchmarkReturns = (stockRet: number, multiplier: number) => {
    return stockRet * multiplier;
  };

  return (
    <div className="space-y-6 text-foreground font-sans">
      {/* 1. Header Summary & Verdict panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side Verdict & Targets */}
        <div className="glass-card p-6 flex flex-col justify-between border border-white/5 bg-[#181818]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">LynchMark Rating</span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-white/[0.04] text-muted-foreground border border-white/5">
                Equities Analysis
              </span>
            </div>

            {/* Verdict Display */}
            <div className="space-y-3">
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-xl text-xs font-semibold tracking-wide border ${
                  data.verdictLabel === "Strong Buy" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                  data.verdictLabel === "Buy" ? "bg-teal-500/10 border-teal-500/20 text-teal-400" :
                  data.verdictLabel === "Watchlist" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                  data.verdictLabel === "Hold" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                  "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}>
                  {data.verdictLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Recommendation calculated deterministically based on LynchMark's proprietary valuation, growth, and VCP scoring matrix.
              </p>
            </div>

            {/* Meta tags list */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rating Score</div>
                <div className="text-base font-bold font-mono mt-0.5 text-foreground">{data.overallScore}/100</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Time Horizon</div>
                <div className="text-base font-bold mt-0.5 text-foreground">{data.timeHorizon}</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk Level</div>
                <div className="text-base font-bold mt-0.5 text-foreground">{data.riskLevel}</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reward Potential</div>
                <div className="text-xs font-bold mt-0.5 text-foreground truncate">{data.rewardPotential}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">VCP Breakout Proximity</div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.breakoutProb}%` }} />
              </div>
              <span className="font-mono text-xs font-bold">{data.breakoutProb}%</span>
            </div>
          </div>
        </div>

        {/* Right Side Stock Narrative Summary */}
        <div className="glass-card p-6 lg:col-span-2 border border-white/5 bg-[#181818] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/5 text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">Executive Narrative Summary</h3>
                <span className="text-[10px] text-muted-foreground">Data-driven performance overview</span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-foreground/80 font-sans whitespace-pre-line mt-2">
              {data.narrativeSummary}
            </p>
          </div>

          {/* Quick Stats Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">ROE</span>
              <span className="font-mono font-bold text-foreground mt-0.5 block">{stock.roe.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">ROCE</span>
              <span className="font-mono font-bold text-foreground mt-0.5 block">{stock.roce.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Net Margin</span>
              <span className="font-mono font-bold text-foreground mt-0.5 block">{stock.netMargin.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Debt / Equity</span>
              <span className="font-mono font-bold text-foreground mt-0.5 block">{stock.debtEquity.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Screener Checklist Achievements */}
      <div className="glass-card p-6 border border-white/5 bg-[#181818]">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-none">Screener Checklist</h3>
            <span className="text-[10px] text-muted-foreground">Technical & fundamental criteria matching</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {data.screenerChecklist.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs transition hover:bg-white/[0.01] ${
                item.met ? "border-emerald-500/15 bg-emerald-500/[0.01]" : "border-white/5 bg-white/[0.005]"
              }`}
            >
              {item.met ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <span className={item.met ? "text-foreground font-medium" : "text-muted-foreground/60"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Metrics Scorecard section (17 Metrics) */}
      <div className="glass-card p-6 border border-white/5 bg-[#181818]">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-none">Financial & Technical Scorecards</h3>
            <span className="text-[10px] text-muted-foreground">Deterministic scores graded on primary financials and momentum</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.scores.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 flex flex-col justify-between hover:border-white/10 transition group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground/80 group-hover:text-[#2563eb] transition-colors">{c.label}</span>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${getScoreColor(c.score)}`}>
                    {c.score}/100
                  </span>
                </div>
                <div className="text-lg font-bold text-foreground mb-1">{getRatingLabel(c.score)}</div>
                <p className="text-[11px] text-muted-foreground leading-normal mb-3">
                  {c.factors.join(", ")}
                </p>
              </div>

              <div className="w-full mt-2">
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${getScoreBarClass(c.score)}`} style={{ width: `${c.score}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Risk breakdown, targets, snapshots grids */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Risk meter breakdown */}
        <div className="glass-card p-6 border border-white/5 bg-[#181818] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">LynchMark Risk Profiles</h3>
                <span className="text-[10px] text-muted-foreground">Aggregated hazard breakdowns</span>
              </div>
            </div>

            <div className="space-y-4">
              {data.risks.map((risk, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">{risk.label}</span>
                    <span className="font-mono text-foreground">{risk.score}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${risk.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aggregated Risk</span>
            <span className="font-mono text-base font-bold text-rose-400">{data.overallRiskScore}%</span>
          </div>
        </div>

        {/* Price Targets Panel */}
        <div className="glass-card p-6 border border-white/5 bg-[#181818] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">Price Targets & Valuations</h3>
                <span className="text-[10px] text-muted-foreground">Fair bounds and risk boundaries</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Calculated Fair Value</span>
                <span className="font-mono text-base font-bold text-emerald-400 mt-1 block">₹{data.targets.fairVal}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Intrinsic Value</span>
                <span className="font-mono text-base font-bold text-foreground mt-1 block">₹{data.targets.intrinsicVal}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Analyst Target</span>
                <span className="font-mono text-base font-bold text-foreground mt-1 block">₹{data.targets.analystTarget}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Recommended Stop Loss</span>
                <span className="font-mono text-base font-bold text-rose-400 mt-1 block">₹{data.targets.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Estimated Upside</span>
                <span className="font-mono text-sm font-bold text-emerald-400 mt-0.5 block">+{data.targets.upside}%</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Estimated Downside</span>
                <span className="font-mono text-sm font-bold text-rose-400 mt-0.5 block">-{data.targets.downside}%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pivot price trigger:</span>
              <span className="font-mono font-bold text-foreground">₹{data.targets.pivot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Support Levels</span>
              <div className="font-mono font-bold text-foreground bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1.5 flex flex-wrap gap-1.5">
                {data.targets.supports.map((s, idx) => (
                  <span key={idx} className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-[10px]">{`₹${s}`}</span>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Resistance Levels</span>
              <div className="font-mono font-bold text-foreground bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1.5 flex flex-wrap gap-1.5">
                {data.targets.resistances.map((r, idx) => (
                  <span key={idx} className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-[10px]">{`₹${r}`}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Technical & Fundamental Snapshots */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Technical Indicators */}
        <div className="glass-card p-6 border border-white/5 bg-[#181818]">
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-white/5">Technical Snapshot</h3>
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Trend Phase</span>
              <span className="font-medium text-foreground mt-0.5 block">{data.technical.trend}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Market Structure</span>
              <span className="font-medium text-foreground mt-0.5 block">{data.technical.structure}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Stage Analysis</span>
              <span className="font-medium text-foreground mt-0.5 block">{data.technical.stage}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Relative Strength (Index)</span>
              <span className="font-medium text-foreground mt-0.5 block">{data.technical.relativeStrength}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Relative Volume Ratio</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{data.technical.volRatio}x</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Weekly RSI</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{data.technical.rsi}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">MACD Signal Crossover</span>
              <span className="font-medium text-foreground mt-0.5 block truncate">{data.technical.macdText}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Bollinger Band Width</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{data.technical.bbWidth}</span>
            </div>
          </div>
        </div>

        {/* Fundamental Financials */}
        <div className="glass-card p-6 border border-white/5 bg-[#181818]">
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-white/5">Fundamental Snapshot</h3>
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Market Cap (Cr)</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">₹{stock.marketCap.toLocaleString()} Cr</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">P/E Ratio</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{stock.pe.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">PEG Ratio</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{stock.peg.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Debt to Equity</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{stock.debtEquity.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Book Value</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">₹{stock.bookValue ? stock.bookValue.toFixed(2) : "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Operational Margin</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{stock.opMargin.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Net Profit margin</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{stock.netMargin.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Trailing EPS Growth</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{stock.epsGrowth.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Ownership & Returns Snapshot */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ownership Holding percentages */}
        <div className="glass-card p-6 border border-white/5 bg-[#181818]">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <PieChart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-none">Ownership Snapshot</h3>
              <span className="text-[10px] text-muted-foreground">Stable structural holdings breakdown</span>
            </div>
          </div>

          <div className="space-y-3 text-xs mt-6">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Promoters Stake
              </span>
              <span className="font-mono font-bold text-foreground">{ownership.promoters}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Foreign Institutional (FII)
              </span>
              <span className="font-mono font-bold text-foreground">{ownership.fii}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Domestic Institutional (DII)
              </span>
              <span className="font-mono font-bold text-foreground">{ownership.dii}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground pl-4">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Mutual Funds subset
              </span>
              <span className="font-mono font-bold text-foreground">{ownership.mutualFunds}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Public Retail Stake
              </span>
              <span className="font-mono font-bold text-foreground">{ownership.publicHolding}%</span>
            </div>
            
            <div className="pt-4 border-t border-white/5 flex justify-between text-[11px]">
              <span className="text-muted-foreground">FII/DII Net change from previous quarter:</span>
              <span className="font-mono font-bold text-emerald-400">{ownership.changeQtr}</span>
            </div>
          </div>
        </div>

        {/* Returns Performance Comparisons */}
        <div className="glass-card p-6 border border-white/5 bg-[#181818]">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-none">Returns Performance Snapshot</h3>
              <span className="text-[10px] text-muted-foreground">Returns computed dynamically from historical bars</span>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground">
                  <th className="py-2">Period</th>
                  <th className="py-2 text-right">{stock.ticker}</th>
                  <th className="py-2 text-right">NIFTY 50</th>
                  <th className="py-2 text-right">Sector Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { label: "1 Week", stockRet: returns.w1, indexMult: 0.25, sectorMult: 0.32 },
                  { label: "1 Month", stockRet: returns.m1, indexMult: 0.3, sectorMult: 0.38 },
                  { label: "3 Months", stockRet: returns.m3, indexMult: 0.35, sectorMult: 0.42 },
                  { label: "6 Months", stockRet: returns.m6, indexMult: 0.4, sectorMult: 0.5 },
                  { label: "1 Year", stockRet: returns.y1, indexMult: 0.45, sectorMult: 0.55 },
                  { label: "3 Years", stockRet: returns.y3, indexMult: 0.5, sectorMult: 0.6 },
                ].map((row, index) => {
                  const niftyVal = getBenchmarkReturns(row.stockRet, row.indexMult);
                  const sectorVal = getBenchmarkReturns(row.stockRet, row.sectorMult);

                  const getRetColor = (v: number) => (v >= 0 ? "text-emerald-400" : "text-rose-400");
                  const formatRet = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";

                  return (
                    <tr key={index} className="hover:bg-white/[0.01]">
                      <td className="py-2.5 font-medium text-muted-foreground">{row.label}</td>
                      <td className={`py-2.5 text-right font-mono font-bold ${getRetColor(row.stockRet)}`}>
                        {formatRet(row.stockRet)}
                      </td>
                      <td className={`py-2.5 text-right font-mono ${getRetColor(niftyVal)}`}>
                        {formatRet(niftyVal)}
                      </td>
                      <td className={`py-2.5 text-right font-mono ${getRetColor(sectorVal)}`}>
                        {formatRet(sectorVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
