export type Status =
  | "Strong Buy"
  | "VCP Ready"
  | "Near Pivot"
  | "Base Building"
  | "Breakout"
  | "Extended"
  | "Avoid";

export interface Stock {
  ticker: string;
  company: string;
  sector: string;
  industry: string;
  cmp: number;
  change: number;
  changePct: number;
  marketCap: number; // in crores
  growthQuality: number;
  businessQuality: number;
  valuation: number;
  technicalStrength: number;
  breakoutReadiness: number;
  investmentQuality: number;
  status: Status;
  pe: number;
  peg: number;
  roe: number;
  roce: number;
  revGrowth: number;
  epsGrowth: number;
  debtEquity: number;
  opMargin: number;
  netMargin: number;
  /** Populated during scan for filter application */
  priceAbove50EMA?: boolean;
  priceAbove150EMA?: boolean;
  priceAbove200EMA?: boolean;
  vcpDetected?: boolean;
}

export interface WeeklyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface VCPStage {
  name: string;
  pct: number;
  depth: string;
}

export interface VCPAnalysis {
  stages: VCPStage[];
  pivotPrice: number;
  distanceToPivotPct: number;
  breakoutProbability: number;
  priceAbove50EMA: boolean;
  priceAbove150EMA: boolean;
  priceAbove200EMA: boolean;
  emaAlignment: boolean;
  volumeDryUpRatio: number;
  contractionCount: number;
  patternIntegrity: "high" | "medium" | "low";
}

export interface StockDetail extends Stock {
  vcp: VCPAnalysis;
  bookValue?: number;
  netProfit?: number;
  cashFlow?: number;
}

export interface ChartData {
  bars: WeeklyBar[];
  ema50: (number | null)[];
  ema150: (number | null)[];
  ema200: (number | null)[];
  pivotPrice: number;
}

export interface ScannerFilters {
  sectors?: string[];
  minMarketCap?: number;
  minRevGrowth?: number;
  maxPEG?: number;
  minROE?: number;
  priceAbove50EMA?: boolean;
  priceAbove150EMA?: boolean;
  priceAbove200EMA?: boolean;
  vcpDetected?: boolean;
  status?: Status[];
  query?: string;
  force?: boolean;
}

export interface ScanResult {
  stocks: Stock[];
  scannedAt: string;
  totalScanned: number;
  fromCache: boolean;
}

export interface MarketOverview {
  indices: Array<{ name: string; value: number; change: number; changePct: number }>;
  sectors: Array<{ name: string; change: number }>;
}
