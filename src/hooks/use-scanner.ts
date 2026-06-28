import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChartData, ScannerFilters, ScanResult, StockDetail } from "@/lib/types/stock";
import { getChart, getMarketOverview, getStock, scanStocks } from "@/lib/scan.functions";

export function useScanResults(filters: ScannerFilters, enabled = true) {
  return useQuery<ScanResult>({
    queryKey: ["scan", filters],
    queryFn: () => scanStocks({ data: filters }),
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });
}

export function useStockChart(ticker: string, enabled = true) {
  return useQuery<ChartData | null>({
    queryKey: ["chart", ticker],
    queryFn: () => getChart({ data: { ticker } }),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

export function useMarketOverview() {
  return useQuery({
    queryKey: ["market-overview"],
    queryFn: () => getMarketOverview(),
    staleTime: 15 * 60 * 1000,
  });
}
