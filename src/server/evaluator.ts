import { fetchHistoricalBars, toYahooSymbol } from "./yahoo";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateATR,
  calculateBollingerBands,
  calculateSupertrend,
  detectCandlestickPatterns,
  Candle,
} from "../lib/analysis/indicators";
import type { Stock } from "../lib/types/stock";

export interface ScanCondition {
  timeframe: string; // "5m" | "15m" | "30m" | "1h" | "1d" | "1wk" | "1mo"
  parameter1: string; // e.g. "close", "volume", "rsi", "macd", "sma_50", "ema_200", "supertrend", "pattern_doji", "minervini_trend"
  operator: string; // ">", "<", "=", "crosses_above", "crosses_below", "is_bullish", "is_bearish"
  parameter2Type: "value" | "parameter";
  parameter2Value: string | number; // e.g. "200" or "sma_200"
}

export interface MatchedCondition {
  timeframe: string;
  description: string;
}

export async function evaluateCustomConditions(
  stocks: Stock[],
  conditions: ScanCondition[]
): Promise<Array<Stock & { matchedConditions?: MatchedCondition[] }>> {
  if (!conditions || conditions.length === 0) return stocks;

  const results: Array<Stock & { matchedConditions?: MatchedCondition[] }> = [];

  // Group conditions by timeframe to avoid fetching same timeframe multiple times
  const timeframesUsed = Array.from(new Set(conditions.map((c) => c.timeframe)));

  // Concurrency limit for scanning
  const batchSize = 10;
  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (stock) => {
        const matchedConditions: MatchedCondition[] = [];
        const yahooSymbol = toYahooSymbol(stock.ticker);

        // Fetch all required timeframes for this stock
        const timeframeData: Record<string, Candle[]> = {};
        for (const tf of timeframesUsed) {
          const bars = await fetchHistoricalBars(yahooSymbol, tf);
          if (bars && bars.length > 0) {
            timeframeData[tf] = bars;
          }
        }

        // Check each condition
        let allMatched = true;
        for (const cond of conditions) {
          const candles = timeframeData[cond.timeframe];
          if (!candles || candles.length < 5) {
            allMatched = false;
            break;
          }

          const matched = checkCondition(candles, cond);
          if (!matched) {
            allMatched = false;
            break;
          }

          // Generate human readable description
          const param1Desc = getParamLabel(cond.parameter1);
          const param2Desc = cond.parameter2Type === "value" ? cond.parameter2Value.toString() : getParamLabel(cond.parameter2Value as string);
          const opDesc = getOperatorLabel(cond.operator);
          matchedConditions.push({
            timeframe: cond.timeframe,
            description: `${param1Desc} ${opDesc} ${param2Desc}`,
          });
        }

        if (allMatched && matchedConditions.length > 0) {
          return {
            ...stock,
            matchedConditions,
          };
        }
        return null;
      })
    );

    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  return results;
}

function getParamLabel(param: string): string {
  if (param.startsWith("sma_")) return `${param.substring(4)} SMA`;
  if (param.startsWith("ema_")) return `${param.substring(4)} EMA`;
  if (param.startsWith("rsi_")) return `RSI (${param.substring(4)})`;
  if (param === "supertrend") return "Supertrend";
  if (param === "bollinger_upper") return "Bollinger Upper Band";
  if (param === "bollinger_lower") return "Bollinger Lower Band";
  if (param === "bollinger_middle") return "Bollinger Basis";
  if (param.startsWith("pattern_")) return `${param.substring(8).replace("_", " ")} Pattern`;
  if (param === "minervini_trend") return "Minervini Trend Template";
  return param.toUpperCase();
}

function getOperatorLabel(op: string): string {
  const map: Record<string, string> = {
    ">": ">",
    "<": "<",
    "=": "=",
    "crosses_above": "crossed above",
    "crosses_below": "crossed below",
    "is_bullish": "is bullish",
    "is_bearish": "is bearish",
  };
  return map[op] || op;
}

function getIndicatorValues(candles: Candle[], parameter: string): number[] {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const opens = candles.map((c) => c.open);
  const volumes = candles.map((c) => c.volume);

  if (parameter === "close") return closes;
  if (parameter === "open") return opens;
  if (parameter === "high") return highs;
  if (parameter === "low") return lows;
  if (parameter === "volume") return volumes;

  // Moving Averages
  if (parameter.startsWith("sma_")) {
    const period = parseInt(parameter.split("_")[1]);
    return calculateSMA(closes, period);
  }
  if (parameter.startsWith("ema_")) {
    const period = parseInt(parameter.split("_")[1]);
    return calculateEMA(closes, period);
  }

  // RSI
  if (parameter.startsWith("rsi_")) {
    const period = parseInt(parameter.split("_")[1]);
    return calculateRSI(closes, period);
  }
  if (parameter === "rsi") {
    return calculateRSI(closes, 14);
  }

  // MACD
  if (parameter === "macd") {
    return calculateMACD(closes).macdLine;
  }
  if (parameter === "macd_signal") {
    return calculateMACD(closes).signalLine;
  }
  if (parameter === "macd_hist") {
    return calculateMACD(closes).histogram;
  }

  // Bollinger Bands
  if (parameter === "bollinger_upper") {
    return calculateBollingerBands(closes).upper;
  }
  if (parameter === "bollinger_lower") {
    return calculateBollingerBands(closes).lower;
  }
  if (parameter === "bollinger_middle") {
    return calculateBollingerBands(closes).middle;
  }

  // Supertrend
  if (parameter === "supertrend") {
    return calculateSupertrend(highs, lows, closes).band;
  }

  // Candlestick Patterns
  const patterns = detectCandlestickPatterns(opens, highs, lows, closes);
  if (parameter === "pattern_doji") return patterns.doji.map((v) => (v ? 1 : 0));
  if (parameter === "pattern_hammer") return patterns.hammer.map((v) => (v ? 1 : 0));
  if (parameter === "pattern_engulfing_bullish") return patterns.engulfingBullish.map((v) => (v ? 1 : 0));
  if (parameter === "pattern_engulfing_bearish") return patterns.engulfingBearish.map((v) => (v ? 1 : 0));

  // Minervini Trend Template
  if (parameter === "minervini_trend") {
    const result = Array(closes.length).fill(0);
    const sma50 = calculateSMA(closes, 50);
    const sma150 = calculateSMA(closes, 150);
    const sma200 = calculateSMA(closes, 200);

    for (let i = 200; i < closes.length; i++) {
      const price = closes[i];
      const p50 = sma50[i];
      const p150 = sma150[i];
      const p200 = sma200[i];

      if (isNaN(p50) || isNaN(p150) || isNaN(p200)) continue;

      // 1. Current Price is above both the 150-day and 200-day moving average
      const c1 = price > p150 && price > p200;
      // 2. The 150-day moving average is above the 200-day
      const c2 = p150 > p200;
      // 3. The 200-day moving average is trending up for at least 1 month (approx 20 trading days)
      let c3 = true;
      for (let j = 1; j <= 20; j++) {
        if (sma200[i - j] >= sma200[i - j + 1]) {
          c3 = false;
          break;
        }
      }
      // 4. The 50-day moving average is above both the 150-day and 200-day
      const c4 = p50 > p150 && p50 > p200;
      // 5. The current price is above the 50-day moving average
      const c5 = price > p50;
      
      // Calculate 52-week high and low
      let low52 = highs[i];
      let high52 = lows[i];
      for (let j = 0; j < 250; j++) {
        const idx = i - j;
        if (idx < 0) break;
        if (lows[idx] < low52) low52 = lows[idx];
        if (highs[idx] > high52) high52 = highs[idx];
      }

      // 6. The current price is at least 30% above its 52-week low
      const c6 = price >= low52 * 1.3;
      // 7. The current price is within at least 25% of its 52-week high
      const c7 = price >= high52 * 0.75;

      if (c1 && c2 && c3 && c4 && c5 && c6 && c7) {
        result[i] = 1;
      }
    }
    return result;
  }

  return Array(closes.length).fill(NaN);
}

function checkCondition(candles: Candle[], cond: ScanCondition): boolean {
  const values1 = getIndicatorValues(candles, cond.parameter1);
  const len = values1.length;
  
  if (len === 0 || isNaN(values1[len - 1])) return false;

  const val1 = values1[len - 1];
  const val1Prev = len >= 2 ? values1[len - 2] : NaN;

  // Resolve second parameter
  let val2 = 0;
  let val2Prev = NaN;

  if (cond.parameter2Type === "value") {
    val2 = parseFloat(cond.parameter2Value as string);
    val2Prev = val2;
  } else {
    const values2 = getIndicatorValues(candles, cond.parameter2Value as string);
    if (values2.length === 0 || isNaN(values2[len - 1])) return false;
    val2 = values2[len - 1];
    val2Prev = len >= 2 ? values2[len - 2] : NaN;
  }

  // Operators
  if (cond.operator === ">") return val1 > val2;
  if (cond.operator === "<") return val1 < val2;
  if (cond.operator === "=") return Math.abs(val1 - val2) < 0.0001;

  if (cond.operator === "crosses_above") {
    if (isNaN(val1Prev) || isNaN(val2Prev)) return false;
    return val1Prev <= val2Prev && val1 > val2;
  }

  if (cond.operator === "crosses_below") {
    if (isNaN(val1Prev) || isNaN(val2Prev)) return false;
    return val1Prev >= val2Prev && val1 < val2;
  }

  if (cond.operator === "is_bullish") {
    if (cond.parameter1 === "supertrend") {
      const supertrend = calculateSupertrend(
        candles.map((c) => c.high),
        candles.map((c) => c.low),
        candles.map((c) => c.close)
      );
      return supertrend.trend[len - 1] === "up";
    }
    return val1 > 0;
  }

  if (cond.operator === "is_bearish") {
    if (cond.parameter1 === "supertrend") {
      const supertrend = calculateSupertrend(
        candles.map((c) => c.high),
        candles.map((c) => c.low),
        candles.map((c) => c.close)
      );
      return supertrend.trend[len - 1] === "down";
    }
    return val1 === 0;
  }

  return false;
}
