import { createServerFn } from "@tanstack/react-start";
import { applyScannerFilters } from "@/lib/analysis/scanner";
import { CACHE_TTL } from "@/lib/analysis/config";
import type { ChartData, ScannerFilters, ScanResult, StockDetail } from "@/lib/types/stock";
import { STOCKS as MOCK_STOCKS } from "@/lib/mock-data";

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === "true";

export const scanStocks = createServerFn({ method: "POST" })
  .validator((data: ScannerFilters) => data ?? {})
  .handler(async ({ data: rawFilters }): Promise<ScanResult> => {
    const { force, ...filters } = rawFilters;

    if (USE_MOCK) {
      const stocks = applyScannerFilters(MOCK_STOCKS, filters).sort(
        (a, b) => b.investmentQuality - a.investmentQuality,
      );
      return {
        stocks,
        scannedAt: new Date().toISOString(),
        totalScanned: MOCK_STOCKS.length,
        fromCache: true,
      };
    }

    const { cacheDelete, cacheGetOrSet, cacheKey } = await import("@/server/cache");
    const { batchAnalyze, UNIVERSE } = await import("@/server/yahoo");

    if (force) cacheDelete(cacheKey("scan-all"));

    const all = await cacheGetOrSet(cacheKey("scan-all"), CACHE_TTL.scan, () => batchAnalyze(UNIVERSE));
    const stocks = applyScannerFilters(all, filters);

    return {
      stocks,
      scannedAt: new Date().toISOString(),
      totalScanned: UNIVERSE.length,
      fromCache: !force,
    };
  });

export const getStock = createServerFn({ method: "GET" })
  .validator((data: { ticker: string }) => data)
  .handler(async ({ data }): Promise<StockDetail | null> => {
    if (USE_MOCK) {
      const s = MOCK_STOCKS.find((x) => x.ticker.toUpperCase() === data.ticker.toUpperCase());
      if (!s) return null;
      return {
        ...s,
        vcp: {
          stages: [],
          pivotPrice: s.cmp,
          distanceToPivotPct: 2,
          breakoutProbability: s.breakoutReadiness,
          priceAbove50EMA: true,
          priceAbove150EMA: true,
          priceAbove200EMA: false,
          emaAlignment: false,
          volumeDryUpRatio: 0.5,
          contractionCount: 3,
          patternIntegrity: "medium",
        },
      };
    }
    const { getStockDetail } = await import("@/server/yahoo");
    return getStockDetail(data.ticker);
  });

export const getChart = createServerFn({ method: "GET" })
  .validator((data: { ticker: string }) => data)
  .handler(async ({ data }): Promise<ChartData | null> => {
    if (USE_MOCK) return null;
    const { getStockChart } = await import("@/server/yahoo");
    return getStockChart(data.ticker);
  });

export const getMarketOverview = createServerFn({ method: "GET" }).handler(async () => {
  if (USE_MOCK) {
    const { INDICES, SECTORS } = await import("@/lib/mock-data");
    return {
      indices: INDICES.map((i) => ({
        name: i.name,
        value: i.value,
        change: i.change,
        changePct: i.change,
      })),
      sectors: SECTORS,
    };
  }
  const { fetchMarketOverview } = await import("@/server/yahoo");
  return fetchMarketOverview();
});
