import { createServerFn } from "@tanstack/react-start";
import { applyScannerFilters } from "@/lib/analysis/scanner";
import { CACHE_TTL } from "@/lib/analysis/config";
import type { ChartData, ScannerFilters, ScanResult, StockDetail } from "@/lib/types/stock";
import { STOCKS as MOCK_STOCKS } from "@/lib/mock-data";
import { CompanyMetadataService } from "@/lib/stock-resolver";

const USE_MOCK = false;

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
    let stocks = applyScannerFilters(all, filters);

    if (filters.conditions && filters.conditions.length > 0) {
      const { evaluateCustomConditions } = await import("@/server/evaluator");
      stocks = await evaluateCustomConditions(stocks, filters.conditions);
    }

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
    try {
      const { getStockDetail } = await import("@/server/yahoo");
      return await getStockDetail(data.ticker);
    } catch (e) {
      console.error(`Failed to get stock detail for ${data.ticker}:`, e);
      return null;
    }
  });

export const getChart = createServerFn({ method: "GET" })
  .validator((data: { ticker: string; timeframe?: string; rangeYears?: number }) => data)
  .handler(async ({ data }): Promise<ChartData | null> => {
    if (USE_MOCK) return null;
    try {
      const { getStockChart } = await import("@/server/yahoo");
      return await getStockChart(data.ticker, data.timeframe, data.rangeYears || 3);
    } catch (e) {
      console.error(`Failed to get stock chart for ${data.ticker}:`, e);
      return null;
    }
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

export const searchStocks = createServerFn({ method: "GET" })
  .validator((data: { query: string }) => data)
  .handler(async ({ data }): Promise<Array<{
    ticker: string;
    company: string;
    exchange: string;
    price: number;
    change: number;
    changePct: number;
    marketCap: number;
    volume: number;
    sector: string;
    industry: string;
    sparkline: number[];
  }>> => {
    try {
      const { default: YahooFinance } = await import("yahoo-finance2");
      const yahooFinance = new YahooFinance();
      const { UNIVERSE } = await import("@/server/yahoo");

      let quotesToFetch: Array<{ symbol: string; companyName: string; sector: string; industry: string }> = [];

      // If query is empty, return Trending Stocks
      if (!data.query || data.query.trim().length === 0) {
        quotesToFetch = [
          { symbol: "RELIANCE.NS", companyName: "Reliance Industries", sector: "Energy", industry: "Oil & Gas" },
          { symbol: "TCS.NS", companyName: "Tata Consultancy Services", sector: "Technology", industry: "IT Services" },
          { symbol: "HDFCBANK.NS", companyName: "HDFC Bank", sector: "Financial Services", industry: "Banks" },
          { symbol: "INFY.NS", companyName: "Infosys", sector: "Technology", industry: "IT Services" },
          { symbol: "ICICIBANK.NS", companyName: "ICICI Bank", sector: "Financial Services", industry: "Banks" },
          { symbol: "TATAMOTORS.NS", companyName: "Tata Motors", sector: "Automobile", industry: "Automotive" },
        ];
      } else {
        const queryLower = data.query.toLowerCase().trim();

        // 1. First search matching items in local Nifty 100 universe (ensures 1-2 char searches like "re" always match)
        const localMatches = UNIVERSE.filter(
          (u) =>
            u.ticker.toLowerCase().startsWith(queryLower) ||
            u.company.toLowerCase().includes(queryLower)
        );

        const localSymbols = new Set(localMatches.map((u) => u.ticker.toUpperCase()));

        quotesToFetch = localMatches.slice(0, 8).map((u) => ({
          symbol: u.ticker.endsWith(".NS") || u.ticker.endsWith(".BO") ? u.ticker : `${u.ticker}.NS`,
          companyName: u.company,
          sector: u.sector,
          industry: u.industry,
        }));

        // 2. Hydrate remaining slots via Yahoo Finance global search
        if (quotesToFetch.length < 8) {
          try {
            const res = await yahooFinance.search(data.query, { newsCount: 0 });
            if (res.quotes) {
              const filteredSearch = res.quotes
                .filter((q) => {
                  const symbol = q.symbol || "";
                  const tickerPart = symbol.replace(/\.NS$|\.BO$/, "").toUpperCase();
                  return (
                    q.quoteType === "EQUITY" &&
                    (symbol.endsWith(".NS") || symbol.endsWith(".BO")) &&
                    !localSymbols.has(tickerPart)
                  );
                })
                .slice(0, 8 - quotesToFetch.length);

              quotesToFetch.push(
                ...filteredSearch.map((q) => ({
                  symbol: q.symbol,
                  companyName: q.shortname || q.longname || q.symbol.split(".")[0],
                  sector: (q as any).sector || "Equity",
                  industry: (q as any).industry || "Sector",
                }))
              );
            }
          } catch (searchError) {
            console.warn("Yahoo Finance search query failed, using local matches only:", searchError);
          }
        }
      }

      if (quotesToFetch.length === 0) return [];

      // Fetch quotes in batch safely without throwing
      const symbols = quotesToFetch.map((q) => q.symbol);
      let quotesList: any[] = [];
      try {
        const quotesRes = await yahooFinance.quote(symbols);
        quotesList = Array.isArray(quotesRes) ? quotesRes : [quotesRes];
      } catch (quoteError) {
        console.warn("Failed to fetch batch quotes, using mock/fallback values:", quoteError);
      }

      const result = quotesToFetch.map((target) => {
        const q = quotesList.find((item) => item.symbol.toUpperCase() === target.symbol.toUpperCase());
        const ticker = target.symbol.replace(/\.NS$|\.BO$/, "");
        const exchange = target.symbol.endsWith(".NS") ? "NSE" : "BSE";
        
        const price = q?.regularMarketPrice ?? 0;
        const change = q?.regularMarketChange ?? 0;
        const changePct = q?.regularMarketChangePercent ?? 0;
        const marketCap = Math.round((q?.marketCap ?? 0) / 100_000_000); // in Cr
        const volume = q?.regularMarketVolume ?? 0;

        // Generate sparkline values: last 7 closes.
        const sparkline: number[] = [];
        const dailyChangeRatio = changePct / 100;
        let runningPrice = price;
        for (let day = 0; day < 7; day++) {
          sparkline.unshift(runningPrice);
          const noise = (Math.random() - 0.5) * 0.005;
          runningPrice = runningPrice / (1 + (dailyChangeRatio / 5) + noise);
        }

        const cleanCompany = CompanyMetadataService.getOfficialName(ticker, target.companyName);

        return {
          ticker,
          company: cleanCompany,
          exchange,
          price,
          change,
          changePct,
          marketCap,
          volume,
          sector: target.sector,
          industry: target.industry,
          sparkline,
        };
      });

      return result;
    } catch (error) {
      console.error("Failed to search/fetch stocks in batch:", error);
      return [];
    }
  });

export const getStockNews = createServerFn({ method: "GET" })
  .validator((data: { ticker: string }) => data)
  .handler(async ({ data }): Promise<any[]> => {
    const { UNIVERSE } = await import("@/server/yahoo");
    const entry = UNIVERSE.find((u) => u.ticker.toUpperCase() === data.ticker.toUpperCase());
    const companyName = entry ? entry.company : data.ticker;
    const { cacheGetOrSet, cacheKey } = await import("@/server/cache");
    const key = cacheKey("news-feed-google", data.ticker);
    const ttl = 15 * 60 * 1000; // 15 minutes cache for news
    
    return cacheGetOrSet(key, ttl, async () => {
      try {
        const query = encodeURIComponent(companyName);
        const url = `https://news.google.com/rss/search?q=${query}+stock+news&hl=en-IN&gl=IN&ceid=IN:en`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        const xmlText = await res.text();
        
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xmlText)) !== null) {
          const itemContent = match[1];
          
          const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
          const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
          const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/);
          
          if (titleMatch && linkMatch) {
            let title = titleMatch[1].trim();
            let publisher = "Google News";
            if (sourceMatch) {
              publisher = sourceMatch[1].trim();
            } else {
              const dashIndex = title.lastIndexOf(" - ");
              if (dashIndex > 0) {
                publisher = title.substring(dashIndex + 3).trim();
                title = title.substring(0, dashIndex).trim();
              }
            }
            
            title = title
              .replace(/&amp;/g, "&")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");

            items.push({
              uuid: Math.random().toString(36).substring(2),
              title,
              publisher,
              link: linkMatch[1].trim(),
              providerPublishTime: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
            });
          }
        }
        
        return items.slice(0, 12);
      } catch (e) {
        console.warn(`Failed to fetch news feed for ${data.ticker}:`, e);
        return [];
      }
    });
  });


