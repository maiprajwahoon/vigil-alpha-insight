import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChartData, ScannerFilters, ScanResult, StockDetail } from "@/lib/types/stock";
import { getChart, getMarketOverview, getStock, scanStocks, searchStocks, getStockNews } from "@/lib/scan.functions";

export function useScanResults(filters: ScannerFilters, enabled = true) {
  return useQuery<ScanResult>({
    queryKey: ["scan", filters],
    queryFn: () => scanStocks({ data: filters }),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch in background every 30 seconds
    enabled,
  });
}

export function useRefreshScan() {
  const queryClient = useQueryClient();
  return (filters: ScannerFilters) =>
    scanStocks({ data: { ...filters, force: true } }).then((result) => {
      queryClient.setQueryData(["scan", filters], result);
      return result;
    });
}

export function useStock(ticker: string) {
  return useQuery<StockDetail | null>({
    queryKey: ["stock", ticker],
    queryFn: () => getStock({ data: { ticker } }),
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 15 * 1000, // Refetch in background every 15 seconds
  });
}

export function useStockChart(ticker: string, timeframe = "1d", rangeYears = 3, enabled = true) {
  return useQuery<ChartData | null>({
    queryKey: ["chart", ticker, timeframe, rangeYears],
    queryFn: () => getChart({ data: { ticker, timeframe, rangeYears } }),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!ticker,
    placeholderData: (prev) => prev,
  });
}

export function useMarketOverview() {
  return useQuery({
    queryKey: ["market-overview"],
    queryFn: () => getMarketOverview(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch in background every 30 seconds
  });
}

export function useSearchStocks(query: string, enabled = true) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchStocks({ data: { query } }),
    staleTime: 60 * 1000, // 1 minute cache
    enabled,
  });
}

export function useStockNews(ticker: string) {
  return useQuery({
    queryKey: ["news", ticker],
    queryFn: () => getStockNews({ data: { ticker } }),
    staleTime: 5 * 60 * 1000,
    enabled: !!ticker,
  });
}

