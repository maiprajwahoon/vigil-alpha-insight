import YahooFinance from "yahoo-finance2";
import universe from "@/data/nifty100.json";
import { growthFromSeries, mergeStatus, scoreGARP } from "@/lib/analysis/garp";
import { ema } from "@/lib/analysis/ema";
import { analyzeVCP, resampleToWeekly } from "@/lib/analysis/vcp";
import { CACHE_TTL, SCAN_CONFIG } from "@/lib/analysis/config";
import type { ChartData, Stock, StockDetail, WeeklyBar } from "@/lib/types/stock";
import { cacheGetOrSet, cacheKey } from "./cache";

const yahooFinance = new YahooFinance();

export interface UniverseEntry {
  ticker: string;
  company: string;
  sector: string;
}

export const UNIVERSE = universe as UniverseEntry[];

export function toYahooSymbol(ticker: string): string {
  const t = ticker.toUpperCase().replace(/\.NS$|\.BO$/, "");
  return `${t}.NS`;
}

export function fromYahooSymbol(symbol: string): string {
  return symbol.replace(/\.NS$|\.BO$/, "");
}

function croresFromMarketCap(raw: number | undefined): number {
  if (!raw || !Number.isFinite(raw)) return 0;
  return raw / 10_000_000;
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

export async function fetchHistoricalBars(yahooSymbol: string, interval: string, rangeYears = 3): Promise<WeeklyBar[]> {
  const key = cacheKey("bars", interval, rangeYears, yahooSymbol);
  const ttl = ["5m", "15m", "30m", "1h"].includes(interval)
    ? 5 * 60 * 1000 // 5 mins
    : 4 * 60 * 60 * 1000; // 4 hours

  return cacheGetOrSet(key, ttl, async () => {
    const period1 = new Date();
    if (interval === "5m" || interval === "15m" || interval === "30m") {
      period1.setDate(period1.getDate() - (rangeYears * 8)); // scale intraday range as well
    } else if (interval === "1h") {
      period1.setDate(period1.getDate() - (rangeYears * 25));
    } else {
      period1.setFullYear(period1.getFullYear() - rangeYears);
    }

    try {
      const res = await yahooFinance.chart(yahooSymbol, {
        period1: period1.toISOString().slice(0, 10),
        interval: interval as any,
      });

      const quotes = res.quotes || [];

      return quotes
        .map((h) => ({
          date: h.date instanceof Date ? h.date.toISOString() : new Date(h.date).toISOString(),
          open: h.open ?? 0,
          high: h.high ?? 0,
          low: h.low ?? 0,
          close: h.close ?? 0,
          volume: h.volume ?? 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (e) {
      console.warn(`Failed to fetch history for ${yahooSymbol} at interval ${interval}:`, e);
      return [];
    }
  });
}

async function fetchWeeklyBars(yahooSymbol: string): Promise<WeeklyBar[]> {
  const bars = await fetchHistoricalBars(yahooSymbol, "1wk");
  if (bars.length > 0) {
    // Strip ISO date to yyyy-mm-dd to be compatible with other weekly code
    return bars.map(b => ({
      ...b,
      date: b.date.slice(0, 10)
    }));
  }
  
  const daily = await fetchHistoricalBars(yahooSymbol, "1d");
  return resampleToWeekly(
    daily.map((d) => ({
      date: new Date(d.date),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }))
  );
}

async function fetchFundamentals(yahooSymbol: string) {
  const key = cacheKey("fundamentals", yahooSymbol);
  return cacheGetOrSet(key, CACHE_TTL.fundamentals, async () => {
    try {
      const summary = await yahooFinance.quoteSummary(yahooSymbol, {
        modules: ["summaryDetail", "defaultKeyStatistics", "financialData", "assetProfile"],
      });

      const fd = summary.financialData;
      const ks = summary.defaultKeyStatistics;
      const sd = summary.summaryDetail;

      let revGrowth = num(fd?.revenueGrowth) * 100;
      let epsGrowth = num(fd?.earningsGrowth) * 100;

      if (!revGrowth || !epsGrowth) {
        try {
          const period1 = new Date();
          period1.setFullYear(period1.getFullYear() - 5);
          const financials = await yahooFinance.fundamentalsTimeSeries(yahooSymbol, {
            period1: period1.toISOString().slice(0, 10),
            type: "annual",
            module: "financials",
          });
          const revenues = financials
            .map((f) => num((f as { totalRevenue?: number }).totalRevenue))
            .filter((v) => v > 0);
          const epsValues = financials
            .map((f) => num((f as { basicEPS?: number }).basicEPS))
            .filter((v) => v !== 0);
          if (!revGrowth && revenues.length >= 2) revGrowth = growthFromSeries(revenues);
          if (!epsGrowth && epsValues.length >= 2) epsGrowth = growthFromSeries(epsValues);
        } catch {
          // fundamentalsTimeSeries may be unavailable for some NSE tickers
        }
      }

      return {
        pe: num(sd?.trailingPE ?? ks?.trailingPE),
        peg: num(ks?.pegRatio),
        roe: num(fd?.returnOnEquity) * 100,
        roce: num(fd?.returnOnAssets) * 100 * 1.3,
        debtEquity: num(fd?.debtToEquity) / 100,
        opMargin: num(fd?.operatingMargins) * 100,
        netMargin: num(fd?.profitMargins) * 100,
        revGrowth,
        epsGrowth,
        sector: summary.assetProfile?.sector ?? "",
        industry: summary.assetProfile?.industry ?? "",
        bookValue: num(ks?.bookValue),
        netProfit: num(fd?.totalRevenue) * num(fd?.profitMargins),
      };
    } catch {
      return {
        pe: 0,
        peg: 99,
        roe: 0,
        roce: 0,
        debtEquity: 0,
        opMargin: 0,
        netMargin: 0,
        revGrowth: 0,
        epsGrowth: 0,
        sector: "",
        industry: "",
        bookValue: 0,
        netProfit: 0,
      };
    }
  });
}

async function fetchQuote(yahooSymbol: string) {
  const key = cacheKey("quote", yahooSymbol);
  return cacheGetOrSet(key, CACHE_TTL.quote, async () => {
    try {
      const q = await yahooFinance.quote(yahooSymbol);
      if (!q) throw new Error("No quote found");
      return {
        price: num(q.regularMarketPrice),
        change: num(q.regularMarketChange),
        changePct: num(q.regularMarketChangePercent),
        marketCap: croresFromMarketCap(num(q.marketCap)),
        name: q.shortName ?? q.longName ?? "",
      };
    } catch (e) {
      console.warn(`Failed to fetch quote for ${yahooSymbol}:`, e);
      return {
        price: 0,
        change: 0,
        changePct: 0,
        marketCap: 0,
        name: "",
      };
    }
  });
}

export async function analyzeTicker(entry: UniverseEntry): Promise<Stock | null> {
  const yahooSymbol = toYahooSymbol(entry.ticker);

  try {
    const [quote, fundamentals, weeklyBars] = await Promise.all([
      fetchQuote(yahooSymbol),
      fetchFundamentals(yahooSymbol),
      fetchWeeklyBars(yahooSymbol),
    ]);

    if (!quote.price) return null;

    const garp = scoreGARP({
      pe: fundamentals.pe || quote.price / 10,
      revGrowth: fundamentals.revGrowth,
      epsGrowth: fundamentals.epsGrowth,
      roe: fundamentals.roe,
      roce: fundamentals.roce || fundamentals.roe,
      debtEquity: fundamentals.debtEquity,
      opMargin: fundamentals.opMargin,
      netMargin: fundamentals.netMargin,
    });

    let vcp = {
      status: "Avoid" as const,
      technicalStrength: 0,
      breakoutReadiness: 0,
      analysis: {
        stages: [] as Array<{ name: string; pct: number; depth: string }>,
        pivotPrice: quote.price,
        distanceToPivotPct: 0,
        breakoutProbability: 0,
        priceAbove50EMA: false,
        priceAbove150EMA: false,
        priceAbove200EMA: false,
        emaAlignment: false,
        volumeDryUpRatio: 0,
        contractionCount: 0,
        patternIntegrity: "low" as const,
      }
    };

    try {
      if (weeklyBars.length >= 10) {
        vcp = analyzeVCP(weeklyBars, garp.garpPass) as any;
      }
    } catch (e) {
      console.warn("Failed to calculate VCP analysis:", e);
    }

    const status = mergeStatus(garp.garpPass, vcp.status);

    const vcpDetected =
      vcp.analysis.contractionCount >= 3 &&
      vcp.analysis.volumeDryUpRatio <= 0.6 &&
      vcp.analysis.contractionCount > 0;

    return {
      ticker: entry.ticker,
      company: quote.name || entry.company,
      sector: fundamentals.sector || entry.sector,
      industry: fundamentals.industry || entry.sector,
      cmp: quote.price,
      change: quote.change,
      changePct: quote.changePct,
      marketCap: quote.marketCap,
      growthQuality: garp.growthQuality,
      businessQuality: garp.businessQuality,
      valuation: garp.valuation,
      technicalStrength: vcp.technicalStrength,
      breakoutReadiness: vcp.breakoutReadiness,
      investmentQuality: Math.round(
        garp.investmentQuality * 0.55 + vcp.breakoutReadiness * 0.25 + vcp.technicalStrength * 0.2,
      ),
      status,
      pe: fundamentals.pe,
      peg: fundamentals.peg && fundamentals.peg > 0 && fundamentals.peg < 50 ? fundamentals.peg : garp.peg,
      roe: fundamentals.roe,
      roce: fundamentals.roce || fundamentals.roe,
      revGrowth: fundamentals.revGrowth,
      epsGrowth: fundamentals.epsGrowth,
      debtEquity: fundamentals.debtEquity,
      opMargin: fundamentals.opMargin,
      netMargin: fundamentals.netMargin,
      priceAbove50EMA: vcp.analysis.priceAbove50EMA,
      priceAbove150EMA: vcp.analysis.priceAbove150EMA,
      priceAbove200EMA: vcp.analysis.priceAbove200EMA,
      vcpDetected,
    };
  } catch (error) {
    console.error(`Failed to analyze ${entry.ticker}:`, error);
    return null;
  }
}

export async function getStockDetail(ticker: string): Promise<StockDetail | null> {
  const entry = UNIVERSE.find((u) => u.ticker.toUpperCase() === ticker.toUpperCase()) || {
    ticker: ticker.toUpperCase(),
    company: ticker.toUpperCase(),
    sector: "Other",
    industry: "Other",
  };

  const yahooSymbol = toYahooSymbol(entry.ticker);
  const stock = await analyzeTicker(entry);
  if (!stock) return null;

  const weeklyBars = await fetchWeeklyBars(yahooSymbol);
  const fundamentals = await fetchFundamentals(yahooSymbol);
  
  let vcpAnalysis = {
    stages: [] as any[],
    pivotPrice: stock.cmp,
    distanceToPivotPct: 0,
    breakoutProbability: 50,
    priceAbove50EMA: false,
    priceAbove150EMA: false,
    priceAbove200EMA: false,
    emaAlignment: false,
    volumeDryUpRatio: 1.0,
    contractionCount: 0,
    patternIntegrity: "low" as const,
  };

  try {
    if (weeklyBars && weeklyBars.length >= 10) {
      const vcp = analyzeVCP(weeklyBars, stock.growthQuality >= 50);
      vcpAnalysis = vcp.analysis;
    }
  } catch (e) {
    console.warn("Failed to calculate VCP analysis in getStockDetail:", e);
  }

  return {
    ...stock,
    vcp: vcpAnalysis,
    bookValue: fundamentals.bookValue,
    netProfit: fundamentals.netProfit,
  };
}

export async function getStockChart(ticker: string, interval = "1wk", rangeYears = 3): Promise<ChartData | null> {
  const entry = UNIVERSE.find((u) => u.ticker.toUpperCase() === ticker.toUpperCase()) || {
    ticker: ticker.toUpperCase(),
    company: ticker.toUpperCase(),
    sector: "Other",
    industry: "Other",
  };

  const bars = await fetchHistoricalBars(toYahooSymbol(entry.ticker), interval, rangeYears);
  if (!bars.length) return null;

  const closes = bars.map((b) => b.close);
  
  // Use a fallback pivot if we are on intraday or don't have enough weekly history
  let pivotPrice = closes[closes.length - 1];
  try {
    const vcp = analyzeVCP(bars, true);
    pivotPrice = vcp.analysis.pivotPrice;
  } catch (e) {
    // Ignore VCP calculation errors for non-standard charts
  }

  return {
    bars,
    ema50: ema(closes, 50),
    ema150: ema(closes, 150),
    ema200: ema(closes, 200),
    pivotPrice,
  };
}

export async function batchAnalyze(entries: UniverseEntry[]): Promise<Stock[]> {
  const results: Stock[] = [];

  for (let i = 0; i < entries.length; i += SCAN_CONFIG.concurrency) {
    const batch = entries.slice(i, i + SCAN_CONFIG.concurrency);
    const batchResults = await Promise.all(batch.map((e) => analyzeTicker(e)));
    results.push(...batchResults.filter((s): s is Stock => s != null));
    if (i + SCAN_CONFIG.concurrency < entries.length) {
      await new Promise((r) => setTimeout(r, SCAN_CONFIG.batchDelayMs));
    }
  }

  return results.sort((a, b) => b.investmentQuality - a.investmentQuality);
}

export async function fetchMarketOverview() {
  const indices = await Promise.all(
    [
      { name: "NIFTY 50", symbol: "^NSEI" },
      { name: "SENSEX", symbol: "^BSESN" },
      { name: "BANK NIFTY", symbol: "^NSEBANK" },
    ].map(async ({ name, symbol }) => {
      try {
        const q = await yahooFinance.quote(symbol);
        return {
          name,
          value: num(q.regularMarketPrice),
          change: num(q.regularMarketChange),
          changePct: num(q.regularMarketChangePercent),
        };
      } catch {
        return { name, value: 0, change: 0, changePct: 0 };
      }
    }),
  );

  const sectorMap = new Map<string, number[]>();
  const sample = UNIVERSE.slice(0, 20);
  const scanned = await batchAnalyze(sample);

  for (const s of scanned) {
    const arr = sectorMap.get(s.sector) ?? [];
    arr.push(s.changePct);
    sectorMap.set(s.sector, arr);
  }

  const sectors = [...sectorMap.entries()].map(([name, changes]) => ({
    name,
    change: changes.reduce((a, b) => a + b, 0) / changes.length,
  }));

  return { indices, sectors };
}
