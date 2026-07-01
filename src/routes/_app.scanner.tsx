import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { ChevronDown, Loader2, RefreshCw, Save, SlidersHorizontal, Plus, Trash2, CheckCircle2, Play } from "lucide-react";
import { SectionHeading, StatusChip, ScoreBar } from "@/components/Primitives";
import { countActiveFilters, FILTER_PRESETS } from "@/lib/analysis/scanner";
import type { ScannerFilters, Stock, ScanCondition } from "@/lib/types/stock";
import { useScanResults, useRefreshScan } from "@/hooks/use-scanner";
import { RealtimePriceCell } from "@/hooks/use-realtime-price";

export const Route = createFileRoute("/_app/scanner")({
  head: () => ({ meta: [{ title: "Technical Stock Screener — LynchMark" }] }),
  component: Scanner,
});

const FILTER_GROUPS: Array<{ title: string; items: string[] }> = [
  { title: "Universe", items: ["Market", "Exchange", "Sector", "Industry", "Country", "Market Cap"] },
  { title: "Growth & Quality", items: ["Revenue Growth", "EPS Growth", "Quarterly Growth", "PEG Ratio", "ROE", "ROCE"] },
  { title: "Balance Sheet", items: ["Debt to Equity", "Operating Margin", "Net Margin", "Cash Flow"] },
  { title: "Ownership", items: ["Institutional Holding", "Promoter Holding", "Relative Strength"] },
  { title: "Technical (Weekly)", items: ["Price Above 50 EMA", "Price Above 150 EMA", "Price Above 200 EMA", "EMA Alignment", "Volume Dry Up", "Near Pivot", "Inside Week", "Weekly Tight Close", "VCP Detection"] },
];

const TOGGLEABLE_FILTERS = new Set(Object.keys(FILTER_PRESETS));

const TIMEFRAMES = [
  { value: "5m", label: "5 Min" },
  { value: "15m", label: "15 Min" },
  { value: "30m", label: "30 Min" },
  { value: "1h", label: "1 Hour" },
  { value: "1d", label: "Daily" },
  { value: "1wk", label: "Weekly" },
  { value: "1mo", label: "Monthly" },
];

const PARAMETERS = [
  { value: "close", label: "Close Price" },
  { value: "volume", label: "Volume" },
  { value: "sma_5", label: "5 SMA" },
  { value: "sma_10", label: "10 SMA" },
  { value: "sma_20", label: "20 SMA" },
  { value: "sma_50", label: "50 SMA" },
  { value: "sma_100", label: "100 SMA" },
  { value: "sma_200", label: "200 SMA" },
  { value: "ema_5", label: "5 EMA" },
  { value: "ema_9", label: "9 EMA" },
  { value: "ema_20", label: "20 EMA" },
  { value: "ema_50", label: "50 EMA" },
  { value: "ema_200", label: "200 EMA" },
  { value: "rsi", label: "RSI (14)" },
  { value: "macd", label: "MACD Line" },
  { value: "macd_signal", label: "MACD Signal" },
  { value: "macd_hist", label: "MACD Histogram" },
  { value: "supertrend", label: "Supertrend" },
  { value: "bollinger_upper", label: "Bollinger Upper" },
  { value: "bollinger_lower", label: "Bollinger Lower" },
  { value: "bollinger_middle", label: "Bollinger Basis" },
  { value: "pattern_doji", label: "Doji Candlestick" },
  { value: "pattern_hammer", label: "Hammer Candlestick" },
  { value: "pattern_engulfing_bullish", label: "Engulfing Bullish" },
  { value: "pattern_engulfing_bearish", label: "Engulfing Bearish" },
  { value: "minervini_trend", label: "Minervini Trend Template" },
];

const OPERATORS = [
  { value: ">", label: "Greater Than (>)" },
  { value: "<", label: "Less Than (<)" },
  { value: "=", label: "Equals (=)" },
  { value: "crosses_above", label: "Crosses Above" },
  { value: "crosses_below", label: "Crosses Below" },
  { value: "is_bullish", label: "Is Bullish" },
  { value: "is_bearish", label: "Is Bearish" },
];

const TECHNICAL_PRESETS = [
  {
    name: "RSI Overbought (RSI > 70)",
    conditions: [{ timeframe: "1d", parameter1: "rsi", operator: ">", parameter2Type: "value", parameter2Value: 70 }],
  },
  {
    name: "RSI Bullish Breakout (RSI Crosses Above 50)",
    conditions: [{ timeframe: "1d", parameter1: "rsi", operator: "crosses_above", parameter2Type: "value", parameter2Value: 50 }],
  },
  {
    name: "Golden Cross (50 SMA > 200 SMA)",
    conditions: [{ timeframe: "1d", parameter1: "sma_50", operator: ">", parameter2Type: "parameter", parameter2Value: "sma_200" }],
  },
  {
    name: "Minervini Stage 2 Template",
    conditions: [{ timeframe: "1d", parameter1: "minervini_trend", operator: ">", parameter2Type: "value", parameter2Value: 0 }],
  },
  {
    name: "Supertrend Bullish (Daily)",
    conditions: [{ timeframe: "1d", parameter1: "supertrend", operator: "is_bullish", parameter2Type: "value", parameter2Value: 0 }],
  },
  {
    name: "Bullish Engulfing Candle",
    conditions: [{ timeframe: "1d", parameter1: "pattern_engulfing_bullish", operator: ">", parameter2Type: "value", parameter2Value: 0 }],
  },
];

function buildFilters(active: Set<string>, query: string, conditions: ScanCondition[]): ScannerFilters {
  const filters: ScannerFilters = { query, conditions };
  for (const key of active) {
    const preset = FILTER_PRESETS[key];
    if (!preset) continue;
    Object.assign(filters, preset);
  }
  return filters;
}

function Scanner() {
  const queryClient = useQueryClient();
  const refreshScanFn = useRefreshScan();
  const [sort, setSort] = useState<keyof Stock>("investmentQuality");
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  
  // Custom Scan Conditions State
  const [conditions, setConditions] = useState<ScanCondition[]>([]);
  const [customPresets, setCustomPresets] = useState<Array<{ name: string; conditions: ScanCondition[] }>>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  // Load custom presets on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("scanner_presets");
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const filters = useMemo(() => buildFilters(activeFilters, query, conditions), [activeFilters, query, conditions]);
  const { data, isLoading, isError, isFetching } = useScanResults(filters);

  const rows = useMemo(() => {
    const stocks = data?.stocks ?? [];
    return [...stocks].sort((a, b) => {
      const valB = b[sort] ?? 0;
      const valA = a[sort] ?? 0;
      return (valB as number) - (valA as number);
    });
  }, [data?.stocks, sort]);

  const toggleFilter = (item: string) => {
    if (!TOGGLEABLE_FILTERS.has(item)) return;
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const resetFilters = () => {
    setActiveFilters(new Set());
    setQuery("");
    setConditions([]);
  };

  const refreshScan = async () => {
    await refreshScanFn(filters);
    queryClient.invalidateQueries({ queryKey: ["scan"] });
  };

  const activeCount = countActiveFilters(filters) + conditions.length;

  const addConditionRow = () => {
    setConditions((prev) => [
      ...prev,
      {
        timeframe: "1d",
        parameter1: "close",
        operator: ">",
        parameter2Type: "value",
        parameter2Value: 200,
      },
    ]);
  };

  const updateCondition = (index: number, key: keyof ScanCondition, value: any) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      
      // Reset parameter2Value if operator changes to "is_bullish" or "is_bearish"
      if (key === "operator" && (value === "is_bullish" || value === "is_bearish")) {
        next[index].parameter2Type = "value";
        next[index].parameter2Value = 0;
      }
      return next;
    });
  };

  const removeConditionRow = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const loadPreset = (preset: { name: string; conditions: ScanCondition[] }) => {
    setConditions(preset.conditions);
  };

  const saveCurrentPreset = () => {
    if (!newPresetName.trim() || conditions.length === 0) return;
    const nextPresets = [...customPresets, { name: newPresetName.trim(), conditions }];
    setCustomPresets(nextPresets);
    localStorage.setItem("scanner_presets", JSON.stringify(nextPresets));
    setNewPresetName("");
    setShowPresetModal(false);
  };

  const deletePreset = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPresets = customPresets.filter((_, i) => i !== index);
    setCustomPresets(nextPresets);
    localStorage.setItem("scanner_presets", JSON.stringify(nextPresets));
  };

  return (
    <div className="mx-auto max-w-[1500px] px-2 sm:px-4">
      {/* Heading */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Advanced Screener</p>
          <h1 className="font-display mt-2 text-4xl">Technical & Fundamental Stock Screener</h1>
          <p className="mt-1 text-sm text-muted-foreground">Combine multiple timeframe technical scans with GARP investment quality metrics.</p>
          {data?.scannedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last scanned {new Date(data.scannedAt).toLocaleString()} · {data.totalScanned} tickers
            </p>
          )}
        </div>
        <button
          onClick={refreshScan}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-4 py-2 text-sm hover:bg-white/[0.04] disabled:opacity-50 self-start sm:self-auto"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" strokeWidth={1.6} />}
          Scan Status
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar Filters */}
        <aside className="glass-card p-5 lg:sticky lg:top-20 lg:h-fit">
          <div className="mb-4 flex items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
            <span className="font-medium">Fundamental Screeners</span>
            <span className="ml-auto text-xs text-muted-foreground">{activeCount} active</span>
          </div>

          <div className="space-y-5 max-h-[50vh] overflow-y-auto scrollbar-thin pr-1">
            {FILTER_GROUPS.map((g) => (
              <div key={g.title}>
                <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">{g.title}</div>
                <div className="space-y-1.5">
                  {g.items.map((it) => {
                    const enabled = TOGGLEABLE_FILTERS.has(it);
                    const active = activeFilters.has(it);
                    return (
                      <button
                        key={it}
                        onClick={() => toggleFilter(it)}
                        disabled={!enabled}
                        className={`group flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                          active
                            ? "border-white/20 bg-white/[0.08] text-foreground"
                            : "border-border bg-white/[0.015] text-foreground/90 hover:bg-white/[0.04]"
                        } ${!enabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <span>{it}</span>
                        {enabled && (
                          <ChevronDown
                            className={`h-3.5 w-3.5 ${active ? "text-foreground" : "text-muted-foreground"}`}
                            strokeWidth={1.6}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={refreshScan}
              className="rounded-xl bg-white py-2 text-sm font-medium text-background transition hover:bg-white/90"
            >
              Run Screener
            </button>
            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs hover:bg-white/[0.04]"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.6} /> Reset
              </button>
              <button
                onClick={() => setShowPresetModal(true)}
                disabled={conditions.length === 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs hover:bg-white/[0.04] disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" strokeWidth={1.6} /> Save Scan
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Query/Condition Builder (TradingView/Chartink style) */}
          <div className="glass-card p-5">
            <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-base font-medium text-foreground">Technical Scan Rules (Chartink & TradingView Style)</h3>
                <p className="text-xs text-muted-foreground">Add custom indicators, candlestick patterns, and multiple timeframe conditions.</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={addConditionRow}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Rule
                </button>
              </div>
            </div>

            {/* Condition Rows */}
            {conditions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-border bg-white/[0.005]">
                <p className="text-xs text-muted-foreground mb-3 text-center px-4">
                  No technical rules defined. The scanner will run on basic fundamental metrics only.
                </p>
                <button
                  onClick={addConditionRow}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs text-background font-medium hover:bg-white/90"
                >
                  <Plus className="h-3.5 w-3.5" /> Build Custom Scan
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {conditions.map((cond, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/35 p-3"
                  >
                    {/* Timeframe */}
                    <select
                      value={cond.timeframe}
                      onChange={(e) => updateCondition(index, "timeframe", e.target.value)}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-white/20"
                    >
                      {TIMEFRAMES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>

                    {/* Parameter 1 */}
                    <select
                      value={cond.parameter1}
                      onChange={(e) => updateCondition(index, "parameter1", e.target.value)}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-white/20"
                    >
                      {PARAMETERS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      value={cond.operator}
                      onChange={(e) => updateCondition(index, "operator", e.target.value)}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-white/20"
                    >
                      {OPERATORS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    {/* Parameter 2 Type / Value (only if not is_bullish/is_bearish) */}
                    {cond.operator !== "is_bullish" && cond.operator !== "is_bearish" && (
                      <>
                        <select
                          value={cond.parameter2Type}
                          onChange={(e) => updateCondition(index, "parameter2Type", e.target.value)}
                          className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-white/20"
                        >
                          <option value="value">Value</option>
                          <option value="parameter">Indicator</option>
                        </select>

                        {cond.parameter2Type === "value" ? (
                          <input
                            type="number"
                            value={cond.parameter2Value}
                            onChange={(e) => updateCondition(index, "parameter2Value", parseFloat(e.target.value) || 0)}
                            className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-xs font-mono text-foreground outline-none focus:border-white/20"
                          />
                        ) : (
                          <select
                            value={cond.parameter2Value}
                            onChange={(e) => updateCondition(index, "parameter2Value", e.target.value)}
                            className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-white/20"
                          >
                            {PARAMETERS.filter(p => !p.value.startsWith("pattern_") && p.value !== "minervini_trend").map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => removeConditionRow(index)}
                      className="ml-auto p-1.5 text-muted-foreground hover:text-bear hover:bg-white/[0.04] rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Presets and Examples */}
            <div className="mt-4 border-t border-border/60 pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Popular Scans & Presets
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TECHNICAL_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset)}
                    className="inline-flex items-center gap-1 rounded-full border border-border hover:border-white/20 bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                  >
                    <Play className="h-2.5 w-2.5 fill-muted-foreground text-transparent" />
                    {preset.name}
                  </button>
                ))}
                {customPresets.map((preset, idx) => (
                  <span
                    key={idx}
                    onClick={() => loadPreset(preset)}
                    className="group inline-flex items-center gap-1 rounded-full border border-bull/20 bg-bull/5 hover:bg-bull/10 px-2.5 py-1 text-[11px] text-bull cursor-pointer transition"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {preset.name}
                    <button
                      onClick={(e) => deletePreset(idx, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-bear ml-1 text-bull/60 shrink-0 transition"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="glass-card p-5">
            <SectionHeading
              title={isLoading ? "Scanning…" : `${rows.length} matches`}
              subtitle="Sorted by selected metrics"
              action={
                <div className="flex items-center gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search results…"
                    className="h-9 w-56 rounded-lg border border-border bg-card/60 px-3 text-sm outline-none focus:border-white/20"
                  />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as keyof Stock)}
                    className="h-9 rounded-lg border border-border bg-card/60 px-3 text-sm outline-none"
                  >
                    <option value="investmentQuality">Investment Quality</option>
                    <option value="growthQuality">Growth Quality</option>
                    <option value="technicalStrength">Technical Strength</option>
                    <option value="breakoutReadiness">Breakout Readiness</option>
                    <option value="cmp">CMP (Price)</option>
                    <option value="changePct">Daily Return</option>
                  </select>
                </div>
              }
            />

            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Scanning Indian stock universe — calculating indicators on multiple timeframes…
              </div>
            )}

            {isError && (
              <div className="py-24 text-center text-sm text-bear font-medium">
                Scan failed. Check connectivity to Yahoo Finance API and try again.
              </div>
            )}

            {!isLoading && !isError && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="sticky top-0 bg-card/85 backdrop-blur z-10">
                    <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border [&>th]:px-3 [&>th]:pb-3.5 [&>th]:whitespace-nowrap">
                      <th className="font-medium">Ticker</th>
                      <th className="font-medium">Company</th>
                      <th className="font-medium text-right">CMP</th>
                      <th className="font-medium">Sector</th>
                      <th className="font-medium w-28">Growth</th>
                      <th className="font-medium w-28">Valuation</th>
                      <th className="font-medium w-28">Technical</th>
                      <th className="font-medium w-28">Breakout</th>
                      <th className="font-medium">Matched Scan Details</th>
                      <th className="font-medium w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => (
                      <tr
                        key={s.ticker}
                        className="group border-b border-border/60 transition-colors hover:bg-white/[0.025] [&>td]:px-3 [&>td]:py-3.5 [&>td]:whitespace-nowrap"
                      >
                        <td className="font-mono text-xs">
                          <Link
                            to="/stock/$ticker"
                            params={{ ticker: s.ticker }}
                            className="text-foreground hover:underline underline-offset-4 font-semibold"
                          >
                            {s.ticker}
                          </Link>
                        </td>
                        <td className="text-foreground/90 font-medium truncate max-w-[160px]">{s.company}</td>
                        <td className="text-right font-mono">
                          <RealtimePriceCell ticker={s.ticker} basePrice={s.cmp} baseChangePct={s.changePct} />
                        </td>
                        <td className="text-muted-foreground text-xs">{s.sector}</td>
                        <td><ScoreBar value={s.growthQuality} /></td>
                        <td><ScoreBar value={s.valuation} /></td>
                        <td><ScoreBar value={s.technicalStrength} /></td>
                        <td><ScoreBar value={s.breakoutReadiness} /></td>
                        <td className="max-w-[280px] overflow-hidden text-ellipsis">
                          <div className="flex flex-wrap gap-1">
                            {s.matchedConditions && s.matchedConditions.length > 0 ? (
                              s.matchedConditions.map((mc, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded bg-bull/5 border border-bull/15 px-1.5 py-0.5 text-[10px] text-bull"
                                  title={`${mc.timeframe.toUpperCase()}: ${mc.description}`}
                                >
                                  <span className="font-bold opacity-85">{mc.timeframe.toUpperCase()}:</span>
                                  {mc.description}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-muted-foreground/60">Fundamentals only</span>
                            )}
                          </div>
                        </td>
                        <td><StatusChip status={s.status} /></td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-16 text-center text-muted-foreground font-medium">
                          No stocks found matching the criteria. Try lowering threshold values or adding fewer rules.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && !isError && (
              <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Showing {rows.length} of {data?.totalScanned ?? rows.length} stocks</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Scan Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-display text-xl text-foreground">Save Custom Scan</h3>
            <p className="text-xs text-muted-foreground mt-1">Provide a name to save the current technical rules list as a preset.</p>
            <input
              type="text"
              placeholder="e.g. Daily RSI & EMA alignment"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="mt-4 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-foreground outline-none focus:border-white/20"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2 text-sm font-medium">
              <button
                onClick={() => setShowPresetModal(false)}
                className="rounded-xl border border-border px-4 py-2 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentPreset}
                disabled={!newPresetName.trim()}
                className="rounded-xl bg-white px-4 py-2 text-background hover:bg-white/90 disabled:opacity-50"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
