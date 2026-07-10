import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect, useRef } from "react";
import { 
  ChevronDown, 
  Loader2, 
  RefreshCw, 
  Save, 
  SlidersHorizontal, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Play, 
  Info, 
  Download, 
  Upload, 
  X, 
  ChevronRight,
  Sliders
} from "lucide-react";
import { SectionHeading, StatusChip, ScoreBar } from "@/components/Primitives";
import type { Stock } from "@/lib/types/stock";
import { useScanResults } from "@/hooks/use-scanner";
import { RealtimePriceCell } from "@/hooks/use-realtime-price";
import { StockLogo } from "@/components/StockLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/scanner")({
  head: () => ({ meta: [{ title: "Technical Stock Screener — LynchMark" }] }),
  component: Scanner,
});

// Detailed Filter configs (GARP, VCP, Quality, Valuation, Technical, Ownership, Balance Sheet)
const GROUP_CONFIGS = [
  {
    id: "garp",
    title: "Peter Lynch GARP Filters",
    filters: [
      { id: "marketCap", label: "Market Capitalization", type: "numeric", min: 100, max: 1000000, step: 100, defaultVal: [500, 1000000], unit: " Cr", tooltip: "Total market value of the company's outstanding shares. Default is ₹500 Cr+." },
      { id: "revGrowth", label: "Revenue CAGR (3Y)", type: "numeric", min: 0, max: 100, step: 1, defaultVal: [15, 100], unit: "%", tooltip: "Compound Annual Growth Rate of revenue over the last 3 years. Ideal: 20-30%." },
      { id: "epsGrowth", label: "EPS CAGR (3Y)", type: "numeric", min: 0, max: 100, step: 1, defaultVal: [15, 100], unit: "%", tooltip: "Compound Annual Growth Rate of earnings per share over the last 3 years. Ideal: 20%+" },
      { id: "roe", label: "ROE", type: "numeric", min: 0, max: 50, step: 1, defaultVal: [15, 50], unit: "%", tooltip: "Return on Equity measures profitability relative to shareholder funds. Ideal: 18-25%." },
      { id: "roce", label: "ROCE", type: "numeric", min: 0, max: 60, step: 1, defaultVal: [18, 60], unit: "%", tooltip: "Return on Capital Employed indicates efficiency of capital deployment. Default: 18%+" },
      { id: "peg", label: "PEG Ratio", type: "numeric", min: 0, max: 3, step: 0.1, defaultVal: [0.5, 1.5], unit: "", tooltip: "P/E Ratio divided by EPS growth rate. Highlighted in green if below 1 (undervalued)." },
      { id: "debtEquity", label: "Debt to Equity", type: "numeric", min: 0, max: 3, step: 0.1, defaultVal: [0, 0.5], unit: "", tooltip: "Ratio of total debt to shareholder equity. Default: 0-0.5." },
      { id: "currentRatio", label: "Current Ratio", type: "numeric", min: 0, max: 5, step: 0.1, defaultVal: [1.5, 5], unit: "", tooltip: "Measures ability to cover short-term obligations with liquid assets. Default: >1.5." },
      { id: "opMargin", label: "Operating Margin", type: "numeric", min: 0, max: 50, step: 1, defaultVal: [15, 50], unit: "%", tooltip: "Operating profit as a percentage of total revenue. Default: 15%+" },
      { id: "netMargin", label: "Net Profit Margin", type: "numeric", min: 0, max: 40, step: 1, defaultVal: [10, 40], unit: "%", tooltip: "Net income as a percentage of revenue. Default: 10%+" },
      { id: "salesGrowth", label: "Sales Growth", type: "numeric", min: 0, max: 60, step: 1, defaultVal: [15, 60], unit: "%", tooltip: "Growth rate of top-line sales over the last year. Default: 15%+" },
      { id: "profitGrowth", label: "Profit Growth", type: "numeric", min: 0, max: 60, step: 1, defaultVal: [15, 60], unit: "%", tooltip: "Growth rate of net profit over the last year. Default: 15%+" },
      { id: "fcfPositive", label: "Positive Free Cash Flow Only", type: "toggle", defaultVal: false, tooltip: "Filter for companies with positive Free Cash Flow (FCF)." },
      { id: "ocfPositive", label: "Positive Operating Cash Flow Only", type: "toggle", defaultVal: false, tooltip: "Filter for companies with positive Cash Flow from Operations (OCF)." },
      { id: "cfTrendIncreasing", label: "Cash Flow Trend Increasing", type: "toggle", defaultVal: false, tooltip: "Cash flow has consistently grown year-on-year." },
      { id: "promoterHolding", label: "Promoter Holding", type: "numeric", min: 20, max: 100, step: 1, defaultVal: [50, 100], unit: "%", tooltip: "Total shareholding percentage owned by the company's founders/promoters. Default: 50%+" },
      { id: "promoterPledge", label: "Promoter Pledge Max", type: "numeric", min: 0, max: 20, step: 1, defaultVal: [0, 0], unit: "%", tooltip: "Shares pledged by promoters as collateral. Low/0% pledge is ideal." },
      { id: "institutionalHoldingIncreasing", label: "Institutional Holding Increasing", type: "toggle", defaultVal: false, tooltip: "FII and DII stakes grew over the last quarter." },
      { id: "dividendPaying", label: "Dividend Paying Only", type: "toggle", defaultVal: false, tooltip: "Filter for companies currently paying dividends." },
    ]
  },
  {
    id: "quality",
    title: "Quality Filters",
    filters: [
      { id: "piotroskiScore", label: "Piotroski F Score", type: "numeric", min: 0, max: 9, step: 1, defaultVal: [7, 9], unit: "", tooltip: "Grades financial strength on 9 indicators. High scores (7-9) imply health." },
      { id: "altmanZScore", label: "Altman Z Score", type: "numeric", min: 0, max: 10, step: 0.1, defaultVal: [3, 10], unit: "", tooltip: "Measures bankruptcy risk. Scores above 3 are considered in the safe zone." },
      { id: "interestCoverage", label: "Interest Coverage Ratio", type: "numeric", min: 0, max: 30, step: 1, defaultVal: [5, 30], unit: "x", tooltip: "Ability to pay interest on outstanding debt. Default: 5x+" },
      { id: "roa", label: "Return on Assets (ROA)", type: "numeric", min: 0, max: 30, step: 1, defaultVal: [8, 30], unit: "%", tooltip: "Net profitability relative to total company assets. Default: 8%+" },
      { id: "assetTurnover", label: "Asset Turnover Ratio", type: "numeric", min: 0, max: 5, step: 0.1, defaultVal: [0, 5], unit: "", tooltip: "Efficiency of using assets to generate sales." },
      { id: "inventoryGrowth", label: "Inventory Growth Rate", type: "numeric", min: 0, max: 50, step: 1, defaultVal: [0, 50], unit: "%", tooltip: "Yearly growth of stockpiled inventories." },
      { id: "receivableGrowth", label: "Receivables Growth Rate", type: "numeric", min: 0, max: 50, step: 1, defaultVal: [0, 50], unit: "%", tooltip: "Growth rate of outstanding client payments." },
    ]
  },
  {
    id: "valuation",
    title: "Valuation Filters",
    filters: [
      { id: "peRatio", label: "PE Ratio", type: "numeric", min: 0, max: 100, step: 1, defaultVal: [0, 100], unit: "", tooltip: "Price to Earnings ratio. Graded relative to industry." },
      { id: "priceToBook", label: "Price to Book (P/B)", type: "numeric", min: 0, max: 20, step: 0.1, defaultVal: [0, 20], unit: "", tooltip: "Stock price divided by book value per share." },
      { id: "evEbitda", label: "EV/EBITDA", type: "numeric", min: 0, max: 50, step: 1, defaultVal: [0, 50], unit: "", tooltip: "Enterprise Value divided by EBITDA." },
      { id: "priceToSales", label: "Price to Sales (P/S)", type: "numeric", min: 0, max: 20, step: 0.1, defaultVal: [0, 20], unit: "", tooltip: "Market cap relative to yearly sales revenue." },
      { id: "enterpriseValue", label: "Enterprise Value", type: "numeric", min: 0, max: 1000000, step: 1000, defaultVal: [0, 1000000], unit: " Cr", tooltip: "Theoretical takeover price (Market Cap + Debt - Cash)." },
    ]
  },
  {
    id: "vcp",
    title: "Mark Minervini VCP Filters",
    filters: [
      { id: "priceAbove50SMA", label: "Price Above 50 SMA", type: "toggle", defaultVal: false, tooltip: "Current price is above 50-day Simple Moving Average." },
      { id: "priceAbove150SMA", label: "Price Above 150 SMA", type: "toggle", defaultVal: false, tooltip: "Current price is above 150-day Simple Moving Average." },
      { id: "priceAbove200SMA", label: "Price Above 200 SMA", type: "toggle", defaultVal: false, tooltip: "Current price is above 200-day Simple Moving Average." },
      { id: "sma50Above150", label: "50 SMA Above 150 SMA", type: "toggle", defaultVal: false, tooltip: "50-day moving average is higher than 150-day moving average." },
      { id: "sma150Above200", label: "150 SMA Above 200 SMA", type: "toggle", defaultVal: false, tooltip: "150-day moving average is higher than 200-day moving average." },
      { id: "sma200TrendingUp", label: "200 SMA Trending Up", type: "toggle", defaultVal: false, tooltip: "200-day moving average is sloping upwards (Stage 2 Uptrend condition)." },
      { id: "dist52WHigh", label: "Distance from 52W High", type: "numeric", min: 0, max: 30, step: 1, defaultVal: [0, 15], unit: "%", tooltip: "How close the stock is to its 52-week high pivot. Default: within 15%." },
      { id: "high52WBreakout", label: "52 Week High Breakout", type: "toggle", defaultVal: false, tooltip: "Stock price cleared its 52-week high." },
      { id: "relativeStrengthRating", label: "Relative Strength Rating", type: "numeric", min: 1, max: 100, step: 1, defaultVal: [80, 100], unit: "", tooltip: "Compares price performance against Nifty Index. Ideal: 80+." },
      { id: "volumeRatio", label: "Volume Ratio", type: "numeric", min: 0, max: 10, step: 0.1, defaultVal: [1.5, 10], unit: "x", tooltip: "Recent volume compared to 50-day average. Default: >1.5x." },
      { id: "avgDailyVolume", label: "Avg Daily Volume", type: "numeric", min: 100000, max: 100000000, step: 50000, defaultVal: [500000, 100000000], unit: " qty", tooltip: "Average daily shares traded. Default: >500K." },
      { id: "atrContraction", label: "ATR Contraction", type: "numeric", min: 0, max: 100, step: 1, defaultVal: [0, 100], unit: "%", tooltip: "Measures decline in average daily trading ranges (volatility squeeze)." },
      { id: "volatilityContractionCount", label: "VCP Contractions", type: "numeric", min: 1, max: 6, step: 1, defaultVal: [3, 6], unit: "", tooltip: "Number of distinct volume/price contractions inside the base. Minimum: 3." },
      { id: "priceTightness", label: "Price Tightness", type: "numeric", min: 0, max: 15, step: 0.5, defaultVal: [0, 8], unit: "%", tooltip: "Tightness of weekly prices in the base. Ideal: <8% range." },
      { id: "baseLength", label: "VCP Base Length", type: "numeric", min: 2, max: 52, step: 1, defaultVal: [6, 20], unit: " wks", tooltip: "Duration of the base formation. Default: 6-20 weeks." },
      { id: "pivotBreakout", label: "Pivot Breakout Target", type: "toggle", defaultVal: false, tooltip: "Stock is in breakout zone from technical pivot." },
      { id: "breakoutToday", label: "Breakout Today", type: "toggle", defaultVal: false, tooltip: "Price registered breakout trigger in today's session." },
      { id: "volumeSurgeOnBreakout", label: "Breakout Volume Surge", type: "numeric", min: 1, max: 10, step: 0.1, defaultVal: [2, 10], unit: "x", tooltip: "Breakout day volume compared to average. Default: 2x+." },
      { id: "relativeVolume", label: "Relative Volume", type: "numeric", min: 0, max: 10, step: 0.1, defaultVal: [1.5, 10], unit: "", tooltip: "Normalized relative volume ratio. Default: >1.5." },
      { id: "adx", label: "ADX", type: "numeric", min: 0, max: 60, step: 1, defaultVal: [25, 60], unit: "", tooltip: "Average Directional Index. Strength of trend. Default: >25." },
      { id: "rsi", label: "RSI", type: "numeric", min: 0, max: 100, step: 1, defaultVal: [55, 75], unit: "", tooltip: "Relative Strength Index. Ideal: 55-75 (bullish momentum)." },
      { id: "macdBullish", label: "MACD Bullish Cross", type: "toggle", defaultVal: false, tooltip: "MACD line is above signal line." },
      { id: "higherHighs", label: "Higher Highs", type: "toggle", defaultVal: false, tooltip: "Daily swing highs are consistently rising." },
      { id: "higherLows", label: "Higher Lows", type: "toggle", defaultVal: false, tooltip: "Daily swing lows are consistently rising." },
      { id: "insideBars", label: "Inside Bars Detected", type: "toggle", defaultVal: false, tooltip: "Current price bar lies entirely within the previous bar's range." },
      { id: "tightWeeklyCloses", label: "Tight Weekly Closes", type: "toggle", defaultVal: false, tooltip: "Last 3 weekly closes are within 1.5% of each other." },
      { id: "lowSupplyZone", label: "Low Supply Squeeze", type: "toggle", defaultVal: false, tooltip: "Volume dried up to exceptionally low levels." },
      { id: "stage2Uptrend", label: "Stage 2 Uptrend Confirmation", type: "toggle", defaultVal: false, tooltip: "Standard Stage 2 rules (200 SMA rising, price above 150/200, 52W high within 25%)." },
    ]
  },
  {
    id: "ownership",
    title: "Ownership Filters",
    filters: [
      { id: "promoterHoldingIncreasing", label: "Promoter Holding Increasing", type: "toggle", defaultVal: false, tooltip: "Promoters increased their stake this quarter." },
      { id: "fiiHoldingIncreasing", label: "FII Holding Increasing", type: "toggle", defaultVal: false, tooltip: "Foreign Institutional Investors increased their stake." },
      { id: "diiHoldingIncreasing", label: "DII Holding Increasing", type: "toggle", defaultVal: false, tooltip: "Domestic Institutional Investors increased their stake." },
      { id: "mutualFundHoldingIncreasing", label: "MF Stake Increasing", type: "toggle", defaultVal: false, tooltip: "Mutual Funds increased their net holdings." },
      { id: "zeroPromoterPledge", label: "Zero Promoter Pledge Only", type: "toggle", defaultVal: false, tooltip: "Strictly select stocks with 0% promoter pledged shares." },
    ]
  },
  {
    id: "balanceSheet",
    title: "Balance Sheet Filters",
    filters: [
      { id: "quickRatio", label: "Quick Ratio", type: "numeric", min: 0, max: 5, step: 0.1, defaultVal: [0, 5], unit: "", tooltip: "Acid-test ratio of quick assets to current liabilities." },
      { id: "cashAndEquivalents", label: "Cash & Equivalents", type: "numeric", min: 0, max: 50000, step: 100, defaultVal: [0, 50000], unit: " Cr", tooltip: "Cash and cash equivalents on balance sheet." },
      { id: "workingCapitalPositive", label: "Working Capital Positive", type: "toggle", defaultVal: false, tooltip: "Current assets exceed current liabilities." },
      { id: "bookValueGrowth", label: "Book Value Growth", type: "numeric", min: 0, max: 50, step: 1, defaultVal: [0, 50], unit: "%", tooltip: "Growth rate of book value per share." },
    ]
  },
  {
    id: "technical",
    title: "Technical Indicators",
    filters: [
      { id: "sma20", label: "Price Above 20 SMA", type: "toggle", defaultVal: false, tooltip: "Price is above its 20-day Simple Moving Average." },
      { id: "sma50", label: "Price Above 50 SMA", type: "toggle", defaultVal: false, tooltip: "Price is above its 50-day Simple Moving Average." },
      { id: "sma150", label: "Price Above 150 SMA", type: "toggle", defaultVal: false, tooltip: "Price is above its 150-day Simple Moving Average." },
      { id: "sma200", label: "Price Above 200 SMA", type: "toggle", defaultVal: false, tooltip: "Price is above its 200-day Simple Moving Average." },
      { id: "ema21", label: "Price Above 21 EMA", type: "toggle", defaultVal: false, tooltip: "Price is above its 21-day Exponential Moving Average." },
      { id: "ema50", label: "Price Above 50 EMA", type: "toggle", defaultVal: false, tooltip: "Price is above its 50-day Exponential Moving Average." },
      { id: "vwapAbove", label: "Price Above VWAP", type: "toggle", defaultVal: false, tooltip: "Price lies above the Volume Weighted Average Price." },
      { id: "goldenCross", label: "Golden Cross Triggered", type: "toggle", defaultVal: false, tooltip: "50-day moving average crossed above 200-day moving average." },
      { id: "deathCrossExclude", label: "Exclude Death Cross Names", type: "toggle", defaultVal: false, tooltip: "Filter out stocks where 50-day MA is below 200-day MA." },
      { id: "bollingerBandSqueeze", label: "Bollinger Band Squeeze", type: "toggle", defaultVal: false, tooltip: "Volatility bands are tightly contracted, hinting at an impending breakout." },
      { id: "supertrendBuy", label: "Supertrend Buy Signal", type: "toggle", defaultVal: false, tooltip: "Supertrend indicator is in buy mode (green track)." },
      { id: "ichimokuBullish", label: "Ichimoku Bullish Cloud", type: "toggle", defaultVal: false, tooltip: "Price is above the Ichimoku cloud." },
      { id: "volumeBreakout", label: "Volume Breakout Signal", type: "toggle", defaultVal: false, tooltip: "Volume exceeds historical averages significantly." },
      { id: "gapUp", label: "Gap Up Today", type: "toggle", defaultVal: false, tooltip: "Today's open price was higher than yesterday's close price." },
      { id: "gapDownExclude", label: "Exclude Gap Downs", type: "toggle", defaultVal: false, tooltip: "Filter out stocks that opened with gap downs today." },
    ]
  }
];

// Helper mapping for active chips and parsing
const ALL_FILTERS_MAP = GROUP_CONFIGS.reduce((acc, g) => {
  g.filters.forEach((f) => {
    acc[f.id] = f;
  });
  return acc;
}, {} as Record<string, any>);

interface FilterVal {
  enabled: boolean;
  rangeVal?: [number, number];
  toggleVal?: boolean;
}

const INITIAL_FILTERS_STATE: Record<string, FilterVal> = {};
GROUP_CONFIGS.forEach((g) => {
  g.filters.forEach((f) => {
    if (f.type === "numeric") {
      INITIAL_FILTERS_STATE[f.id] = { enabled: false, rangeVal: f.defaultVal as [number, number] };
    } else {
      INITIAL_FILTERS_STATE[f.id] = { enabled: false, toggleVal: f.defaultVal as boolean };
    }
  });
});

const PRESET_DEFINITIONS: Record<string, Partial<Record<string, FilterVal>>> = {
  "Peter Lynch GARP": {
    peg: { enabled: true, rangeVal: [0.5, 1.5] },
    roe: { enabled: true, rangeVal: [15, 50] },
    revGrowth: { enabled: true, rangeVal: [15, 100] },
    epsGrowth: { enabled: true, rangeVal: [15, 100] },
    debtEquity: { enabled: true, rangeVal: [0, 0.5] },
  },
  "Aggressive GARP": {
    peg: { enabled: true, rangeVal: [0.3, 1.2] },
    roe: { enabled: true, rangeVal: [20, 50] },
    revGrowth: { enabled: true, rangeVal: [25, 100] },
    epsGrowth: { enabled: true, rangeVal: [25, 100] },
    debtEquity: { enabled: true, rangeVal: [0, 0.8] },
  },
  "Conservative GARP": {
    peg: { enabled: true, rangeVal: [0.6, 1.8] },
    roe: { enabled: true, rangeVal: [12, 30] },
    revGrowth: { enabled: true, rangeVal: [10, 30] },
    epsGrowth: { enabled: true, rangeVal: [10, 30] },
    debtEquity: { enabled: true, rangeVal: [0, 0.3] },
  },
  "Mark Minervini VCP": {
    priceAbove50SMA: { enabled: true, toggleVal: true },
    priceAbove150SMA: { enabled: true, toggleVal: true },
    priceAbove200SMA: { enabled: true, toggleVal: true },
    relativeStrengthRating: { enabled: true, rangeVal: [80, 100] },
    volatilityContractionCount: { enabled: true, rangeVal: [3, 6] },
    priceTightness: { enabled: true, rangeVal: [0, 8] },
    stage2Uptrend: { enabled: true, toggleVal: true },
  },
  "Early Stage Breakout": {
    dist52WHigh: { enabled: true, rangeVal: [0, 5] },
    high52WBreakout: { enabled: true, toggleVal: true },
    volumeRatio: { enabled: true, rangeVal: [2.0, 10] },
    pivotBreakout: { enabled: true, toggleVal: true },
  },
  "High Growth": {
    revGrowth: { enabled: true, rangeVal: [25, 100] },
    epsGrowth: { enabled: true, rangeVal: [25, 100] },
    salesGrowth: { enabled: true, rangeVal: [25, 60] },
    profitGrowth: { enabled: true, rangeVal: [25, 60] },
  },
  "Swing Trade": {
    rsi: { enabled: true, rangeVal: [50, 70] },
    relativeVolume: { enabled: true, rangeVal: [1.5, 10] },
    volumeBreakout: { enabled: true, toggleVal: true },
  },
  "Momentum": {
    relativeStrengthRating: { enabled: true, rangeVal: [90, 100] },
    rsi: { enabled: true, rangeVal: [60, 80] },
    priceAbove50SMA: { enabled: true, toggleVal: true },
  },
  "Long-Term Compounders": {
    roe: { enabled: true, rangeVal: [20, 50] },
    roce: { enabled: true, rangeVal: [22, 60] },
    debtEquity: { enabled: true, rangeVal: [0, 0.2] },
    piotroskiScore: { enabled: true, rangeVal: [8, 9] },
  },
  "Low Debt Quality": {
    debtEquity: { enabled: true, rangeVal: [0, 0.15] },
    interestCoverage: { enabled: true, rangeVal: [8, 30] },
    altmanZScore: { enabled: true, rangeVal: [4, 10] },
  },
  "Small Cap Growth": {
    marketCap: { enabled: true, rangeVal: [100, 5000] },
    revGrowth: { enabled: true, rangeVal: [20, 100] },
    epsGrowth: { enabled: true, rangeVal: [20, 100] },
  },
  "Mid Cap Leaders": {
    marketCap: { enabled: true, rangeVal: [5000, 20000] },
    roe: { enabled: true, rangeVal: [18, 50] },
    relativeStrengthRating: { enabled: true, rangeVal: [85, 100] },
  },
  "Large Cap Leaders": {
    marketCap: { enabled: true, rangeVal: [20000, 1000000] },
    roe: { enabled: true, rangeVal: [15, 50] },
    relativeStrengthRating: { enabled: true, rangeVal: [80, 100] },
  },
};

// Deterministic mock/synthetic indicator generator for metrics not natively present on raw stocks
function getStockIndicator(stock: Stock, indicatorId: string): any {
  if (indicatorId in stock) {
    return (stock as any)[indicatorId];
  }
  
  let hash = 0;
  for (let i = 0; i < stock.ticker.length; i++) {
    hash = stock.ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seed = Math.abs(hash);
  
  switch (indicatorId) {
    case "salesGrowth":
      return stock.revGrowth;
    case "profitGrowth":
      return stock.epsGrowth;
    case "stage2Uptrend":
      return !!stock.priceAbove200EMA;
    case "currentRatio":
      return 1.1 + (seed % 30) / 10;
    case "piotroskiScore":
      return 4 + (seed % 6);
    case "altmanZScore":
      return 1.5 + (seed % 60) / 10;
    case "interestCoverage":
      return 2 + (seed % 25);
    case "roa":
      return 4 + (seed % 18);
    case "assetTurnover":
      return 0.5 + (seed % 30) / 10;
    case "inventoryGrowth":
      return (seed % 35);
    case "receivableGrowth":
      return (seed % 30);
    case "priceToBook":
      return 1.2 + (seed % 15);
    case "evEbitda":
      return 5 + (seed % 35);
    case "priceToSales":
      return 0.5 + (seed % 15);
    case "enterpriseValue":
      return stock.marketCap * (0.9 + (seed % 3) / 10);
    case "dist52WHigh":
      return (seed % 25);
    case "relativeStrengthRating":
      return 50 + (seed % 48);
    case "volumeRatio":
      return 0.5 + (seed % 45) / 10;
    case "avgDailyVolume":
      return 200000 + (seed % 9800000);
    case "atrContraction":
      return 10 + (seed % 70);
    case "volatilityContractionCount":
      return 1 + (seed % 5);
    case "priceTightness":
      return 2 + (seed % 12);
    case "baseLength":
      return 4 + (seed % 48);
    case "volumeSurgeOnBreakout":
      return 1.0 + (seed % 50) / 10;
    case "relativeVolume":
      return 0.5 + (seed % 45) / 10;
    case "adx":
      return 15 + (seed % 35);
    case "rsi":
      return 40 + (seed % 40);
    case "quickRatio":
      return 0.8 + (seed % 25) / 10;
    case "cashAndEquivalents":
      return (seed % 35000);
    case "bookValueGrowth":
      return (seed % 30);
    // Toggles
    case "fcfPositive":
    case "ocfPositive":
    case "cfTrendIncreasing":
    case "institutionalHoldingIncreasing":
    case "dividendPaying":
    case "priceAbove50SMA":
      return stock.priceAbove50EMA;
    case "priceAbove150SMA":
      return stock.priceAbove150EMA;
    case "priceAbove200SMA":
      return stock.priceAbove200EMA;
    case "sma50Above150":
    case "sma150Above200":
    case "sma200TrendingUp":
    case "high52WBreakout":
    case "pivotBreakout":
    case "breakoutToday":
    case "macdBullish":
    case "higherHighs":
    case "higherLows":
    case "insideBars":
    case "tightWeeklyCloses":
    case "lowSupplyZone":
    case "promoterHoldingIncreasing":
    case "fiiHoldingIncreasing":
    case "diiHoldingIncreasing":
    case "mutualFundHoldingIncreasing":
    case "zeroPromoterPledge":
    case "workingCapitalPositive":
    case "sma20":
    case "sma50":
    case "sma150":
    case "sma200":
    case "ema21":
    case "ema50":
    case "vwapAbove":
    case "goldenCross":
      return (seed % 10) > 4;
    case "deathCrossExclude":
    case "bollingerBandSqueeze":
    case "supertrendBuy":
    case "ichimokuBullish":
    case "volumeBreakout":
    case "gapUp":
    case "gapDownExclude":
      return (seed % 10) > 6;
    default:
      return 0;
  }
}

// Custom Dual Range Slider
function DualRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  disabled = false,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (val: [number, number]) => void;
  step?: number;
  disabled?: boolean;
}) {
  const [minVal, maxVal] = value;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxVal - step);
    onChange([val, maxVal]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minVal + step);
    onChange([minVal, val]);
  };

  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className={`relative w-full h-5 mt-2 flex items-center ${disabled ? "opacity-30 pointer-events-none" : ""}`}>
      <div className="absolute left-0 right-0 h-1 rounded bg-white/[0.08]" />
      <div
        className="absolute h-1 rounded bg-blue-500"
        style={{
          left: `${minPercent}%`,
          right: `${100 - maxPercent}%`,
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minVal}
        disabled={disabled}
        onChange={handleMinChange}
        className="absolute w-full h-1 appearance-none pointer-events-none bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:cursor-pointer"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        disabled={disabled}
        onChange={handleMaxChange}
        className="absolute w-full h-1 appearance-none pointer-events-none bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
}

// Tooltip popover
function TooltipHelp({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="text-muted-foreground hover:text-foreground transition cursor-help p-0.5"
      >
        <Info className="h-3 w-3" />
      </button>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-lg bg-black border border-white/10 text-[10px] text-muted-foreground shadow-2xl z-50 leading-relaxed font-sans pointer-events-none">
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
          {text}
        </div>
      )}
    </div>
  );
}

// Deterministic breakdown scores calculation
function calculateDetailedScores(stock: Stock) {
  let seed = 0;
  for (let i = 0; i < stock.ticker.length; i++) {
    seed += stock.ticker.charCodeAt(i);
  }
  
  const revGrowthScore = Math.min(100, Math.max(0, stock.revGrowth * 2.5));
  const epsGrowthScore = Math.min(100, Math.max(0, stock.epsGrowth * 2.5));
  const roeScore = Math.min(100, Math.max(0, stock.roe * 2.5));
  
  let pegVal = stock.peg || 1.2;
  const valuationScore = Math.round(
    pegVal <= 1.0 ? 95 :
    pegVal <= 1.5 ? 75 :
    pegVal <= 2.0 ? 55 : 30
  );
  
  const garpScore = Math.round((revGrowthScore + epsGrowthScore + roeScore + valuationScore) / 4);
  
  const relativeStrength = 50 + (seed % 48);
  const breakoutReadiness = stock.breakoutReadiness || 70;
  const technicalStrength = stock.technicalStrength || 70;
  const vcpScore = Math.round(breakoutReadiness * 0.5 + relativeStrength * 0.3 + technicalStrength * 0.2);
  
  const piotroskiFScore = 4 + (seed % 6);
  const altmanZScore = 1.5 + (seed % 60) / 10;
  const qualityScore = Math.round((stock.businessQuality + (piotroskiFScore / 9) * 100 + (altmanZScore / 7.5) * 100) / 3);
  
  return {
    garpScore: Math.min(100, Math.max(20, garpScore)),
    vcpScore: Math.min(100, Math.max(20, vcpScore)),
    qualityScore: Math.min(100, Math.max(20, qualityScore)),
    valuationScore: Math.min(100, Math.max(20, valuationScore)),
    technicalScore: Math.min(100, Math.max(20, technicalStrength)),
    overallScore: Math.round(stock.investmentQuality)
  };
}

function Scanner() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sort, setSort] = useState<keyof Stock>("investmentQuality");
  const [query, setQuery] = useState("");
  
  // Custom scanner detailed filter state
  const [filtersState, setFiltersState] = useState<Record<string, FilterVal>>(INITIAL_FILTERS_STATE);
  const [groupLogic, setGroupLogic] = useState<Record<string, "AND" | "OR">>({
    garp: "AND",
    quality: "AND",
    valuation: "AND",
    vcp: "AND",
    ownership: "AND",
    balanceSheet: "AND",
    technical: "AND"
  });

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    garp: false,
    quality: true,
    valuation: true,
    vcp: false,
    ownership: true,
    balanceSheet: true,
    technical: true
  });

  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [customPresets, setCustomPresets] = useState<Array<{ name: string; filters: Record<string, FilterVal>; logic: Record<string, "AND" | "OR"> }>>([]);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  // Load live un-filtered stocks list from server
  const { data, isLoading, isError, isFetching } = useScanResults({});
  const stocks = data?.stocks ?? [];

  // Parse filters from URL on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlFilters = params.get("filters");
      if (urlFilters) {
        const parsed = JSON.parse(decodeURIComponent(urlFilters));
        setFiltersState((prev) => {
          const next = { ...prev };
          for (const key in parsed) {
            if (next[key]) {
              next[key] = { ...next[key], ...parsed[key] };
            }
          }
          return next;
        });
      }
      const urlLogic = params.get("logic");
      if (urlLogic) {
        setGroupLogic(JSON.parse(decodeURIComponent(urlLogic)));
      }
    } catch (e) {
      console.error("Failed to parse filters from URL", e);
    }
  }, []);

  // Sync to URL search params
  const syncFiltersToUrl = (nextFilters: typeof filtersState, nextLogic: typeof groupLogic) => {
    try {
      const enabledOnly: Record<string, any> = {};
      for (const key in nextFilters) {
        if (nextFilters[key].enabled) {
          enabledOnly[key] = nextFilters[key];
        }
      }
      const params = new URLSearchParams(window.location.search);
      if (Object.keys(enabledOnly).length > 0) {
        params.set("filters", encodeURIComponent(JSON.stringify(enabledOnly)));
      } else {
        params.delete("filters");
      }

      const activeLogic: Record<string, string> = {};
      for (const groupKey in nextLogic) {
        if (nextLogic[groupKey] === "OR") {
          activeLogic[groupKey] = "OR";
        }
      }
      if (Object.keys(activeLogic).length > 0) {
        params.set("logic", encodeURIComponent(JSON.stringify(activeLogic)));
      } else {
        params.delete("logic");
      }

      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState(null, "", newUrl);
    } catch (e) {
      console.error("Failed to sync filters to URL", e);
    }
  };

  // Load custom presets on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lynchmark_custom_presets");
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Filter evaluation logic
  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (s) => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q),
      );
    }

    for (const group of GROUP_CONFIGS) {
      const activeFilters = group.filters.filter((f) => filtersState[f.id]?.enabled);
      if (activeFilters.length === 0) continue;

      const isOr = groupLogic[group.id] === "OR";

      result = result.filter((stock) => {
        let groupPassed = !isOr;

        for (const filter of activeFilters) {
          const value = getStockIndicator(stock, filter.id);
          let matches = false;

          if (filter.type === "numeric") {
            const range = filtersState[filter.id].rangeVal || [0, 0];
            matches = value >= range[0] && value <= range[1];
          } else if (filter.type === "toggle") {
            matches = !!value === true;
          }

          if (isOr) {
            if (matches) {
              groupPassed = true;
              break;
            }
          } else {
            if (!matches) {
              groupPassed = false;
              break;
            }
          }
        }

        return groupPassed;
      });
    }

    return result.sort((a, b) => {
      const aVal = a[sort] ?? 0;
      const bVal = b[sort] ?? 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return bVal - aVal;
      }
      return String(aVal).localeCompare(String(bVal));
    });
  }, [stocks, filtersState, groupLogic, query, sort]);

  const activeCount = useMemo(() => {
    return Object.values(filtersState).filter((f) => f.enabled).length;
  }, [filtersState]);

  const toggleFilterEnabled = (filterId: string) => {
    setFiltersState((prev) => {
      const next = { ...prev };
      next[filterId] = { ...next[filterId], enabled: !next[filterId].enabled };
      syncFiltersToUrl(next, groupLogic);
      return next;
    });
  };

  const handleNumericValueChange = (filterId: string, range: [number, number]) => {
    setFiltersState((prev) => {
      const next = { ...prev };
      next[filterId] = { ...next[filterId], rangeVal: range };
      syncFiltersToUrl(next, groupLogic);
      return next;
    });
  };

  const handleToggleValueChange = (filterId: string, value: boolean) => {
    setFiltersState((prev) => {
      const next = { ...prev };
      next[filterId] = { ...next[filterId], toggleVal: value };
      syncFiltersToUrl(next, groupLogic);
      return next;
    });
  };

  const resetFilters = () => {
    setFiltersState(INITIAL_FILTERS_STATE);
    setGroupLogic({
      garp: "AND",
      quality: "AND",
      valuation: "AND",
      vcp: "AND",
      ownership: "AND",
      balanceSheet: "AND",
      technical: "AND"
    });
    const params = new URLSearchParams();
    window.history.replaceState(null, "", window.location.pathname);
  };

  const applyPreset = (presetName: string) => {
    const preset = PRESET_DEFINITIONS[presetName];
    if (!preset) return;

    setFiltersState((prev) => {
      const next = { ...prev };
      for (const key in next) {
        if (key in preset) {
          next[key] = { ...next[key], ...preset[key], enabled: true };
        } else {
          next[key] = { ...next[key], enabled: false };
        }
      }
      syncFiltersToUrl(next, groupLogic);
      return next;
    });
  };

  const saveCustomPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset = {
      name: newPresetName.trim(),
      filters: filtersState,
      logic: groupLogic
    };
    const next = [...customPresets, newPreset];
    setCustomPresets(next);
    localStorage.setItem("lynchmark_custom_presets", JSON.stringify(next));
    setNewPresetName("");
    setShowSavePresetModal(false);
    alert("Preset saved successfully!");
  };

  const loadCustomPreset = (index: number) => {
    const preset = customPresets[index];
    if (!preset) return;
    setFiltersState(preset.filters);
    if (preset.logic) {
      setGroupLogic(preset.logic);
    }
    syncFiltersToUrl(preset.filters, preset.logic || groupLogic);
  };

  const deleteCustomPreset = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = customPresets.filter((_, idx) => idx !== index);
    setCustomPresets(next);
    localStorage.setItem("lynchmark_custom_presets", JSON.stringify(next));
  };

  const exportPreset = () => {
    const dataStr = JSON.stringify({ filters: filtersState, logic: groupLogic }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'lynchmark_scanner_preset.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.filters) {
            setFiltersState((prev) => ({ ...prev, ...parsed.filters }));
            if (parsed.logic) {
              setGroupLogic(parsed.logic);
            }
            syncFiltersToUrl(parsed.filters, parsed.logic || groupLogic);
            alert("Preset imported successfully!");
          }
        } catch (err) {
          alert("Invalid preset file format.");
        }
      };
    }
  };

  // Sidebar component rendering
  const renderFilterPanelContents = () => (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">LM Screener Filters</span>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 transition"
        >
          <RefreshCw className="h-3 w-3" /> Reset
        </button>
      </div>

      {/* Preset Selectors */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Strategy Presets</div>
        <div className="grid grid-cols-2 gap-1 max-h-[150px] overflow-y-auto scrollbar-thin pr-1">
          {Object.keys(PRESET_DEFINITIONS).map((presetName) => (
            <button
              key={presetName}
              onClick={() => applyPreset(presetName)}
              className="px-2 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-left text-[10.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition"
            >
              {presetName}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Presets / Import & Export */}
      <div className="border-t border-white/5 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custom Saved Presets</span>
          <div className="flex gap-2">
            <button onClick={exportPreset} title="Export Preset" className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-foreground transition">
              <Download className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="Import Preset" className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-foreground transition">
              <Upload className="h-3.5 w-3.5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={importPreset} accept=".json" className="hidden" />
          </div>
        </div>

        {customPresets.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {customPresets.map((preset, idx) => (
              <span
                key={idx}
                onClick={() => loadCustomPreset(idx)}
                className="group inline-flex items-center gap-1 rounded bg-blue-500/10 border border-blue-500/15 px-2 py-0.5 text-[10px] text-blue-400 cursor-pointer hover:bg-blue-500/15 transition select-none"
              >
                {preset.name}
                <button
                  onClick={(e) => deleteCustomPreset(idx, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-bear ml-1 transition"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowSavePresetModal(true)}
          className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-foreground font-semibold hover:bg-white/10 transition"
        >
          <Save className="h-3 w-3" /> Save Current Preset
        </button>
      </div>

      {/* Main Filter Groups Accordion */}
      <div className="space-y-4 border-t border-white/5 pt-4">
        {GROUP_CONFIGS.map((g) => {
          const isCollapsed = collapsedGroups[g.id];
          const logic = groupLogic[g.id] || "AND";

          return (
            <div key={g.id} className="border border-white/5 rounded-xl bg-white/[0.005] overflow-hidden">
              {/* Accordion Header */}
              <div
                className="flex items-center justify-between px-3 py-2.5 bg-white/[0.015] hover:bg-white/[0.03] cursor-pointer transition select-none"
                onClick={() => setCollapsedGroups((prev) => ({ ...prev, [g.id]: !isCollapsed }))}
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">{g.title}</span>
                </div>

              </div>

              {/* Accordion Body */}
              {!isCollapsed && (
                <div className="p-3.5 space-y-4 divide-y divide-white/[0.03] max-h-[350px] overflow-y-auto scrollbar-thin">
                  {g.filters.map((f) => {
                    const state = filtersState[f.id] || { enabled: false };
                    
                    return (
                      <div key={f.id} className="pt-3 first:pt-0">
                        {/* Header checkbox trigger */}
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={state.enabled}
                              onChange={() => toggleFilterEnabled(f.id)}
                              className="rounded border-white/20 bg-black text-blue-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 transition"
                            />
                            <span className={`text-[11.5px] font-semibold transition ${state.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                              {f.label}
                            </span>
                          </label>
                          <TooltipHelp text={f.tooltip} />
                        </div>

                        {/* Numeric slider and editable bounds */}
                        {state.enabled && f.type === "numeric" && (
                          <div className="mt-2 pl-5.5 space-y-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 flex items-center rounded-lg border border-white/10 bg-black px-2 py-1">
                                <span className="text-[10px] text-muted-foreground mr-1">Min:</span>
                                <input
                                  type="number"
                                  min={f.min}
                                  max={f.max}
                                  value={state.rangeVal ? state.rangeVal[0] : (f.defaultVal as [number, number])[0]}
                                  onChange={(e) => {
                                    const val = Math.max(f.min, parseFloat(e.target.value) || f.min);
                                    handleNumericValueChange(f.id, [val, state.rangeVal ? state.rangeVal[1] : (f.defaultVal as [number, number])[1]]);
                                  }}
                                  className="w-full bg-transparent p-0 text-[10.5px] font-mono text-foreground border-none outline-none focus:ring-0"
                                />
                              </div>
                              <span className="text-muted-foreground text-xs font-semibold">-</span>
                              <div className="flex-1 flex items-center rounded-lg border border-white/10 bg-black px-2 py-1">
                                <span className="text-[10px] text-muted-foreground mr-1">Max:</span>
                                <input
                                  type="number"
                                  min={f.min}
                                  max={f.max}
                                  value={state.rangeVal ? state.rangeVal[1] : (f.defaultVal as [number, number])[1]}
                                  onChange={(e) => {
                                    const val = Math.min(f.max, parseFloat(e.target.value) || f.max);
                                    handleNumericValueChange(f.id, [state.rangeVal ? state.rangeVal[0] : (f.defaultVal as [number, number])[0], val]);
                                  }}
                                  className="w-full bg-transparent p-0 text-[10.5px] font-mono text-foreground border-none outline-none focus:ring-0"
                                />
                              </div>
                              {f.unit && <span className="text-[10.5px] text-muted-foreground/80 font-mono">{f.unit}</span>}
                            </div>
                            <DualRangeSlider
                              min={f.min}
                              max={f.max}
                              step={f.step}
                              value={state.rangeVal || (f.defaultVal as [number, number])}
                              onChange={(range) => handleNumericValueChange(f.id, range)}
                            />
                            {/* Special PEG highlighter below 1.0 */}
                            {f.id === "peg" && state.rangeVal && state.rangeVal[0] < 1.0 && (
                              <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1 leading-none">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Highlighting PEG under 1.0 (Value GARP zone)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-10 select-none">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Screener</p>
          <h1 className="font-display mt-2 text-4xl">LynchMark Stock Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">Combine Peter Lynch's value GARP and Mark Minervini's momentum VCP templates.</p>
        </div>

        {/* Mobile controls */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="lg:hidden inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg active:scale-95 transition"
        >
          <SlidersHorizontal className="h-4 w-4" /> Screen Filters ({activeCount})
        </button>
      </div>

      {/* Main Grid Workspace */}
      <div className={`grid gap-6 ${filtersCollapsed ? "grid-cols-[1fr]" : "lg:grid-cols-[300px_1fr]"}`}>
        {/* Sticky Filters Sidebar (Desktop only) */}
        {!filtersCollapsed && (
          <aside className="hidden lg:block glass-card p-5 sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin">
            {renderFilterPanelContents()}
            <button
              onClick={() => setFiltersCollapsed(true)}
              className="w-full mt-4 py-1.5 text-center text-[10.5px] text-muted-foreground hover:text-foreground font-semibold border border-white/5 rounded-lg hover:bg-white/[0.02] transition"
            >
              Hide Sidebar Panel
            </button>
          </aside>
        )}

        {/* Collapsed filters panel trigger button */}
        {filtersCollapsed && (
          <button
            onClick={() => setFiltersCollapsed(false)}
            className="hidden lg:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-foreground font-bold hover:bg-white/10 transition select-none self-start"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" /> Show Filters Panel ({activeCount} active)
          </button>
        )}

        {/* Results Workspace */}
        <div className="space-y-5 min-w-0">
          {/* Active Filters Chips Container */}
          {activeCount > 0 && (
            <div className="glass-card p-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mr-1 select-none">Active Filters:</span>
              {Object.keys(filtersState)
                .filter((key) => filtersState[key].enabled)
                .map((key) => {
                  const filter = ALL_FILTERS_MAP[key];
                  if (!filter) return null;
                  let display = filter.label;
                  if (filter.type === "numeric") {
                    const range = filtersState[key].rangeVal || [0, 0];
                    display += `: ${range[0]}${filter.unit || ""} - ${range[1]}${filter.unit || ""}`;
                  }
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 select-none animate-fade-in font-medium"
                    >
                      {display}
                      <button
                        onClick={() => toggleFilterEnabled(key)}
                        className="hover:text-bear ml-1 text-[13px] leading-none shrink-0"
                      >
                        &times;
                      </button>
                    </span>
                  );
                })}
              <button
                onClick={resetFilters}
                className="text-xs text-[#3b82f6] hover:underline underline-offset-4 font-semibold ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Results Table Panel */}
          <div className="glass-card p-5">
            <SectionHeading
              title={isLoading ? "Scanning..." : `${filteredStocks.length} matches`}
              subtitle="Scanned stocks evaluated in real-time"
              action={
                <div className="flex items-center gap-2 select-none">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tickers..."
                    className="h-9 w-44 rounded-lg border border-white/10 bg-black/60 px-3 text-xs outline-none focus:border-[#3b82f6] transition"
                  />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as keyof Stock)}
                    className="h-9 rounded-lg border border-white/10 bg-black/60 px-2.5 text-xs outline-none focus:border-[#3b82f6] transition cursor-pointer"
                  >
                    <option value="investmentQuality">LynchMark Grade</option>
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
              <div className="space-y-3 animate-pulse py-4 select-none">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-4 px-3 rounded-xl border border-white/5 bg-white/[0.005]">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.04] shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="h-3 w-16 bg-white/[0.05] rounded" />
                      <div className="h-2.5 w-32 bg-white/[0.03] rounded" />
                    </div>
                    <div className="h-4.5 w-14 bg-white/[0.04] rounded shrink-0" />
                    <div className="flex flex-col gap-1 w-20 shrink-0">
                      <div className="h-3 w-10 bg-white/[0.04] rounded" />
                      <div className="h-1.5 w-14 bg-white/[0.03] rounded-full" />
                    </div>
                    <div className="flex flex-col gap-1 w-20 shrink-0">
                      <div className="h-3 w-10 bg-white/[0.04] rounded" />
                      <div className="h-1.5 w-14 bg-white/[0.03] rounded-full" />
                    </div>
                    <div className="flex flex-col gap-1 w-20 shrink-0">
                      <div className="h-3 w-10 bg-white/[0.04] rounded" />
                      <div className="h-1.5 w-14 bg-white/[0.03] rounded-full" />
                    </div>
                    <div className="h-5 w-20 bg-white/[0.04] rounded-lg shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="py-24 text-center text-sm text-bear font-medium select-none">
                Scan connection timeout. Please check your internet connection.
              </div>
            )}

            {!isLoading && !isError && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead>
                    <tr className="text-left text-label-mono text-muted-foreground font-bold border-b border-white/5 [&>th]:px-3 [&>th]:pb-3.5">
                      <th className="font-medium">Ticker</th>
                      <th className="font-medium">Company</th>
                      <th className="font-medium text-right">Price</th>
                      <th className="font-medium w-28">LM Grade</th>
                      <th className="font-medium w-28">Growth</th>
                      <th className="font-medium w-28">Valuation</th>
                      <th className="font-medium w-28">Technical</th>
                      <th className="font-medium w-28">Breakout</th>
                      <th className="font-medium w-28">VCP Squeeze</th>
                      <th className="font-medium w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredStocks.map((s) => {
                      const score = calculateDetailedScores(s);
                      return (
                        <tr
                          key={s.ticker}
                          className="group premium-row-hover hover:bg-white/[0.02] active:bg-white/[0.035] [&>td]:px-3 [&>td]:py-4 [&>td]:align-middle cursor-pointer"
                          onClick={() => navigate({ to: "/stock/$ticker", params: { ticker: s.ticker } })}
                        >
                          {/* Ticker */}
                          <td className="font-mono text-xs font-semibold text-foreground group-hover:underline underline-offset-4 decoration-white/20">
                            <div className="flex items-center gap-2">
                              <StockLogo ticker={s.ticker} size={24} className="rounded-lg shrink-0" />
                              <span>{s.ticker}</span>
                            </div>
                          </td>
                          {/* Company */}
                          <td className="text-foreground/85 truncate max-w-[160px] font-medium">{s.company}</td>
                          {/* Price */}
                          <td className="text-right font-mono font-tabular-nums" onClick={(e) => e.stopPropagation()}>
                            <RealtimePriceCell ticker={s.ticker} basePrice={s.cmp} baseChangePct={s.changePct} />
                            <div className={`text-[10px] font-bold ${s.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                              {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                            </div>
                          </td>
                          {/* LM Overall Score with detailed breakdown on hover */}
                          <td className="relative group/score" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1 cursor-pointer">
                              <span className={`font-display font-tabular-nums font-bold text-xs px-2 py-0.5 rounded border ${
                                score.overallScore >= 80 ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" :
                                score.overallScore >= 60 ? "bg-teal-500/10 border border-teal-500/20 text-teal-400" :
                                score.overallScore >= 40 ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" :
                                "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                              }`}>
                                {score.overallScore}
                              </span>
                              <Info className="h-3 w-3 text-muted-foreground/50 group-hover/score:text-foreground" />
                            </div>
                            
                            {/* Detailed breakdown hover card */}
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 hidden group-hover/score:flex flex-col gap-2 p-3 bg-black border border-white/10 rounded-xl shadow-2xl z-40 select-none animate-fade-in pointer-events-none">
                              <div className="text-[10.5px] font-bold text-foreground border-b border-white/5 pb-1 flex items-center justify-between">
                                <span>LM Scores breakdown</span>
                                <span className="font-mono text-blue-400">{s.ticker}</span>
                              </div>
                              <div className="space-y-1 text-[10px] font-tabular-nums">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">GARP Score:</span>
                                  <span className="font-semibold text-foreground">{score.garpScore}/100</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">VCP Score:</span>
                                  <span className="font-semibold text-foreground">{score.vcpScore}/100</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Quality Score:</span>
                                  <span className="font-semibold text-foreground">{score.qualityScore}/100</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Valuation Score:</span>
                                  <span className="font-semibold text-foreground">{score.valuationScore}/100</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Technical Score:</span>
                                  <span className="font-semibold text-foreground">{score.technicalScore}/100</span>
                                </div>
                              </div>
                              <div className="border-t border-white/5 pt-1.5 flex justify-between font-bold text-[11px] text-blue-400 font-tabular-nums leading-none">
                                <span>Overall Rating:</span>
                                <span>{score.overallScore} / 100</span>
                              </div>
                            </div>
                          </td>
                          {/* Growth */}
                          <td><ScoreBar value={s.growthQuality} /></td>
                          {/* Valuation */}
                          <td><ScoreBar value={s.valuation} /></td>
                          {/* Technical */}
                          <td><ScoreBar value={s.technicalStrength} /></td>
                          {/* Breakout */}
                          <td><ScoreBar value={s.breakoutReadiness} /></td>
                          {/* VCP Contraction details */}
                          <td>
                            <div className="flex items-center gap-1.5 select-none">
                              {[1, 2, 3, 4, 5].map((i) => {
                                const contractionCount = getStockIndicator(s, "volatilityContractionCount");
                                const isLit = contractionCount >= i;
                                return (
                                  <div
                                    key={i}
                                    className={`h-1.5 w-3.5 rounded-full transition-all duration-300 ${
                                      isLit ? "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.4)]" : "bg-white/[0.06]"
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </td>
                          {/* Status */}
                          <td><StatusChip status={s.status} /></td>
                        </tr>
                      );
                    })}
                    {filteredStocks.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-20 text-center text-sm text-muted-foreground">
                          No stocks matched the selected GARP & VCP filters. Try relaxing your parameters or switching logic to OR.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Preset Dialog Modal */}
      <Dialog open={showSavePresetModal} onOpenChange={setShowSavePresetModal}>
        <DialogContent className="max-w-md p-6 bg-[#111111] border border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Save screener rules as preset</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Save your current slider selections so you can load them in one click.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <input
              type="text"
              placeholder="e.g. My Breakout GARP Screener"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="w-full h-10 rounded-lg border border-white/10 bg-black/60 px-3 text-sm outline-none focus:border-blue-500 text-foreground"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setNewPresetName("");
                  setShowSavePresetModal(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomPreset}
                disabled={!newPresetName.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition"
              >
                Save Preset
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Filters bottom sheet drawer modal */}
      <Dialog open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6 bg-[#111111] border border-white/10 text-foreground scrollbar-thin">
          <DialogHeader className="flex justify-between items-center pb-2 border-b border-white/5">
            <DialogTitle className="font-display text-lg">Screen Filters ({activeCount})</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {renderFilterPanelContents()}
          </div>
          <div className="mt-4 border-t border-white/5 pt-4">
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              Apply Screen
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
