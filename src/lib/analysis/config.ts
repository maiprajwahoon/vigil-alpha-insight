export const GARP_WEIGHTS = {
  growth: 0.4,
  business: 0.35,
  valuation: 0.25,
} as const;

export const GARP_THRESHOLDS = {
  minRevGrowth: 15,
  minEpsGrowth: 15,
  minROE: 15,
  maxDebtEquity: 0.5,
  pegSweetMin: 0.5,
  pegSweetMax: 1.5,
  pegMax: 3,
} as const;

export const CACHE_TTL = {
  quote: 15 * 60 * 1000,
  fundamentals: 24 * 60 * 60 * 1000,
  weekly: 6 * 60 * 60 * 1000,
  scan: 30 * 60 * 1000,
} as const;

export const SCAN_CONFIG = {
  concurrency: 3,
  batchDelayMs: 200,
} as const;

export const VCP_CONFIG = {
  minContractions: 3,
  nearPivotPct: 3,
  extendedPct: 15,
  volumeDryUpRatio: 0.6,
  swingLookback: 2,
  baseLookbackWeeks: 52,
} as const;
