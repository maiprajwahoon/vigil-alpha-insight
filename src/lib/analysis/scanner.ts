import type { ScannerFilters, Status, Stock } from "@/lib/types/stock";

export function applyScannerFilters(stocks: Stock[], filters: ScannerFilters): Stock[] {
  let result = [...stocks];

  if (filters.query?.trim()) {
    const q = filters.query.toLowerCase().trim();
    result = result.filter(
      (s) => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q),
    );
  }

  if (filters.sectors?.length) {
    const set = new Set(filters.sectors.map((s) => s.toLowerCase()));
    result = result.filter((s) => set.has(s.sector.toLowerCase()));
  }

  if (filters.minMarketCap != null) {
    result = result.filter((s) => s.marketCap >= filters.minMarketCap!);
  }

  if (filters.minRevGrowth != null) {
    result = result.filter((s) => s.revGrowth >= filters.minRevGrowth!);
  }

  if (filters.maxPEG != null) {
    result = result.filter((s) => s.peg <= filters.maxPEG!);
  }

  if (filters.minROE != null) {
    result = result.filter((s) => s.roe >= filters.minROE!);
  }

  if (filters.status?.length) {
    const set = new Set<Status>(filters.status);
    result = result.filter((s) => set.has(s.status));
  }

  if (filters.priceAbove50EMA) {
    result = result.filter((s) => s.priceAbove50EMA);
  }

  if (filters.priceAbove150EMA) {
    result = result.filter((s) => s.priceAbove150EMA);
  }

  if (filters.priceAbove200EMA) {
    result = result.filter((s) => s.priceAbove200EMA);
  }

  if (filters.vcpDetected) {
    result = result.filter((s) => s.vcpDetected);
  }

  return result;
}

export function countActiveFilters(filters: ScannerFilters): number {
  let count = 0;
  if (filters.sectors?.length) count++;
  if (filters.minMarketCap != null) count++;
  if (filters.minRevGrowth != null) count++;
  if (filters.maxPEG != null) count++;
  if (filters.minROE != null) count++;
  if (filters.priceAbove50EMA) count++;
  if (filters.priceAbove150EMA) count++;
  if (filters.priceAbove200EMA) count++;
  if (filters.vcpDetected) count++;
  if (filters.status?.length) count++;
  return count;
}

export const DEFAULT_SCANNER_FILTERS: ScannerFilters = {};

export const FILTER_PRESETS: Record<string, Partial<ScannerFilters>> = {
  "Revenue Growth": { minRevGrowth: 15 },
  "EPS Growth": { minRevGrowth: 15 },
  "PEG Ratio": { maxPEG: 1.5 },
  ROE: { minROE: 15 },
  ROCE: { minROE: 15 },
  "Price Above 50 EMA": { priceAbove50EMA: true },
  "Price Above 150 EMA": { priceAbove150EMA: true },
  "Price Above 200 EMA": { priceAbove200EMA: true },
  "VCP Detection": { vcpDetected: true, status: ["VCP Ready", "Near Pivot", "Strong Buy"] },
  "Near Pivot": { status: ["Near Pivot", "Strong Buy"] },
};
