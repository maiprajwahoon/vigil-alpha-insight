import type { StockDetail, ChartData } from "@/lib/types/stock";
import { compileDashboardData } from "@/lib/stock-analysis";
import { TrendingUp, Shield, BarChart2, Zap, ArrowUpRight, Compass, LineChart } from "lucide-react";

interface TechnicalDashboardProps {
  stock: StockDetail;
  chart: ChartData | null;
}

export function TechnicalDashboard({ stock, chart }: TechnicalDashboardProps) {
  const data = compileDashboardData(stock, chart);
  const { vcp } = stock;

  const stages = vcp.stages.length
    ? vcp.stages
    : [
        { name: "Contraction 1 (T1)", pct: 30, depth: "-30.0% over 12w" },
        { name: "Contraction 2 (T2)", pct: 15, depth: "-15.0% over 6w" },
        { name: "Contraction 3 (T3)", pct: 7, depth: "-7.0% over 3w" }
      ];

  const getStageDepthVal = (depthStr: string): string => {
    const match = depthStr.match(/-?\d+(\.\d+)?%/);
    return match ? match[0] : depthStr;
  };

  const getStageWidthVal = (depthStr: string): string => {
    const match = depthStr.match(/over\s+\d+w|\d+\s*w/);
    return match ? match[0].replace("over", "").trim() : "—";
  };

  return (
    <div className="space-y-6 text-foreground font-sans">
      {/* 1. Header Trend Summary & Pivot card */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Technical Trend Card */}
        <div className="glass-card p-6 flex flex-col justify-between border border-white/5 bg-[#181818]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Technical Trend Status</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                stock.technicalStrength >= 70 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                stock.technicalStrength >= 50 ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}>
                {stock.technicalStrength >= 70 ? "Strong Trend" : stock.technicalStrength >= 50 ? "Neutral Setup" : "Weak Structure"}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-2xl font-bold font-mono">₹{stock.cmp.toLocaleString()}</h4>
              <p className="text-xs text-muted-foreground leading-normal">
                Currently trading in a <span className="text-foreground font-medium">{data.technical.trend.toLowerCase()}</span> with <span className="text-foreground font-medium">{data.technical.structure.toLowerCase()}</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Strength Rating</span>
                <span className="font-mono text-base font-bold text-foreground mt-0.5 block">{stock.technicalStrength}/100</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Relative Volume</span>
                <span className="font-mono text-base font-bold text-foreground mt-0.5 block">{data.technical.volRatio}x</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Proximity to Breakout Pivot:</span>
              <span className={`font-mono font-bold ${
                Math.abs(vcp.distanceToPivotPct) <= 3 ? "text-emerald-400" : "text-foreground"
              }`}>
                {Math.abs(vcp.distanceToPivotPct).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Pivot Targets Panel */}
        <div className="glass-card p-6 border border-white/5 bg-[#181818] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/5 text-muted-foreground">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">Breakout & Support Targets</h3>
                <span className="text-[10px] text-muted-foreground">Calculated bounds from price behavior</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Breakout Pivot</span>
                <span className="font-mono text-base font-bold text-emerald-400 mt-1 block">₹{data.targets.pivot}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Stop Loss Target</span>
                <span className="font-mono text-base font-bold text-rose-400 mt-1 block">₹{data.targets.stopLoss}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Immediate Resistances:</span>
              <span className="font-mono font-bold text-foreground">{data.targets.resistances.map(r => `₹${r}`).join(" | ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Immediate Supports:</span>
              <span className="font-mono font-bold text-foreground">{data.targets.supports.map(s => `₹${s}`).join(" | ")}</span>
            </div>
          </div>
        </div>

        {/* Volume Dry-Up Analysis card */}
        <div className="glass-card p-6 border border-white/5 bg-[#181818] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/5 text-muted-foreground">
                <LineChart className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">Volume Dry-Up Analysis (VUA)</h3>
                <span className="text-[10px] text-muted-foreground">Activity levels during base tightening</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Dry-Up Activity Ratio:</span>
                <span className="font-mono font-bold text-foreground">{vcp.volumeDryUpRatio.toFixed(2)}x</span>
              </div>
              <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (1 - vcp.volumeDryUpRatio) * 150)}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Volume status:</span>
            <span className={`font-semibold uppercase tracking-wider ${
              vcp.volumeDryUpRatio <= 0.6 ? "text-emerald-400" : "text-muted-foreground"
            }`}>
              {vcp.volumeDryUpRatio <= 0.6 ? "Accurate Volume Dry-Up" : "Normal Liquidity"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. VCP Volatility Contraction Footprint Visualizer */}
      <div className="glass-card p-6 border border-white/5 bg-[#181818]">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-none">VCP Contraction Footprint</h3>
            <span className="text-[10px] text-muted-foreground">Detailed signature stages of weekly base volatility compression</span>
          </div>
        </div>

        {/* Visual Wave graphic */}
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.005] p-6 relative overflow-hidden flex items-center justify-center h-28">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.02] to-transparent pointer-events-none" />
          
          {/* SVG Wave */}
          <svg className="w-full max-w-lg h-16 overflow-visible opacity-50" fill="none" strokeWidth={1.5}>
            <path
              d="M 10 32 Q 50 -20 90 32 T 170 32 T 240 32 T 300 32 T 350 32 T 390 32"
              className="stroke-blue-500/30"
              strokeDasharray="4,4"
            />
            {/* contracting waves */}
            <path
              d="M 10 32 Q 50 -5 90 32 T 170 32 T 240 32 T 290 32 T 330 32"
              className="stroke-blue-400"
              strokeLinecap="round"
            />
            <circle cx="330" cy="32" r="3.5" className="fill-emerald-400 stroke-[#181818]" strokeWidth={1.5} />
          </svg>

          <span className="absolute bottom-2 right-4 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
            Tightening Base Footprint
          </span>
        </div>

        {/* Footprint Stages grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {stages.map((s, i) => {
            const depth = getStageDepthVal(s.depth);
            const width = getStageWidthVal(s.depth);
            return (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-between hover:border-white/10 transition group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground/80 group-hover:text-[#2563eb] transition-colors">
                      {s.name}
                    </span>
                    <span className="text-[10px] font-semibold bg-white/[0.04] text-muted-foreground border border-white/5 px-2 py-0.5 rounded-full font-mono">
                      Stage T{i + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Contraction Depth</span>
                      <span className="font-mono text-sm font-bold text-rose-400 mt-0.5 block">{depth}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Base Width</span>
                      <span className="font-mono text-sm font-bold text-foreground mt-0.5 block">{width}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full mt-4">
                  <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Indicators Snapshots & Moving Averages */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Moving Averages alignments */}
        <div className="glass-card p-6 border border-white/5 bg-[#181818]">
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-white/5">Moving Average Structural Alignment</h3>
          <div className="space-y-4 text-xs">
            {[
              { period: "20 EMA (Short Term)", met: data.screenerChecklist[0].met, label: "Price Above 20 EMA" },
              { period: "50 EMA (Medium Term)", met: data.screenerChecklist[1].met, label: "Price Above 50 EMA" },
              { period: "150 EMA (Long Term)", met: data.screenerChecklist[2].met, label: "Price Above 150 EMA" },
              { period: "200 EMA (Trend Anchor)", met: data.screenerChecklist[3].met, label: "Price Above 200 EMA" },
            ].map((row, idx) => (
              <div key={idx} className="flex justify-between items-center py-1">
                <span className="text-muted-foreground font-medium">{row.period}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  row.met ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}>
                  {row.met ? "Price Above" : "Price Below"}
                </span>
              </div>
            ))}

            <div className="pt-4 border-t border-white/5 flex justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">EMA Alignment (50 &gt; 150 &gt; 200):</span>
              <span className={vcp.emaAlignment ? "text-emerald-400" : "text-rose-400"}>
                {vcp.emaAlignment ? "Bullish (Stage 2 aligned)" : "Consolidating / Mixed"}
              </span>
            </div>
          </div>
        </div>

        {/* Technical Indicators Snapshot Grid */}
        <div className="glass-card p-6 border border-white/5 bg-[#181818]">
          <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-white/5">Technical Snapshots</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Weekly RSI (14)</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{data.technical.rsi}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">MACD Signal</span>
              <span className="font-medium text-foreground mt-0.5 block truncate">{data.technical.macdText}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Bollinger Band Width</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{data.technical.bbWidth}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Weekly ATR</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">₹{data.technical.atr}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">52 Week High Bounds</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">{data.screenerChecklist[12].met ? "Near 52W High" : "Consolidating Mid-Range"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Pocket Pivot Readiness</span>
              <span className="font-medium text-foreground mt-0.5 block">{stock.breakoutReadiness >= 75 ? "Pocket Pivot Active" : "Developing"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
