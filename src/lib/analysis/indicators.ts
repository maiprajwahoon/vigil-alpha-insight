export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  if (data.length === 0) return result;

  const k = 2 / (period + 1);
  let emaVal = data[0]; // initialize with first value
  result.push(emaVal);

  for (let i = 1; i < data.length; i++) {
    emaVal = data[i] * k + emaVal * (1 - k);
    result.push(emaVal);
  }

  // Set the first period-1 elements as NaN to be consistent with SMA
  for (let i = 0; i < Math.min(period - 1, result.length); i++) {
    result[i] = NaN;
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(closes: number[], period = 14): number[] {
  const result: number[] = [];
  if (closes.length <= period) {
    return Array(closes.length).fill(NaN);
  }

  let gains = 0;
  let losses = 0;

  // First RSI value calculation
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    result.push(NaN);
  }
  
  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    let gain = 0;
    let loss = 0;
    if (diff > 0) {
      gain = diff;
    } else {
      loss = -diff;
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }

  return result;
}

/**
 * Calculates MACD
 */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  // Filter out NaNs for signal line calculation, but keep indexing aligned
  const validMacdValues = macdLine.map(v => isNaN(v) ? 0 : v);
  const tempSignal = calculateEMA(validMacdValues, signalPeriod);
  
  const signalLine: number[] = [];
  const histogram: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < slowPeriod + signalPeriod - 2) {
      signalLine.push(NaN);
      histogram.push(NaN);
    } else {
      signalLine.push(tempSignal[i]);
      histogram.push(macdLine[i] - tempSignal[i]);
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const tr: number[] = [highs[0] - lows[0]];

  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(hl, hpc, lpc));
  }

  const atr: number[] = [];
  if (tr.length < period) {
    return Array(closes.length).fill(NaN);
  }

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += tr[i];
    atr.push(NaN);
  }
  
  let currentAtr = sum / period;
  atr[period - 1] = currentAtr;

  for (let i = period; i < tr.length; i++) {
    currentAtr = (currentAtr * (period - 1) + tr[i]) / period;
    atr.push(currentAtr);
  }

  return atr;
}

/**
 * Calculates Bollinger Bands
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): { middle: number[]; upper: number[]; lower: number[]; width: number[]; squeeze: boolean[] } {
  const middle = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];
  const width: number[] = [];
  const squeeze: boolean[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      width.push(NaN);
      squeeze.push(false);
      continue;
    }

    let varianceSum = 0;
    const mean = middle[i];
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(closes[i - j] - mean, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    const upVal = mean + stdDevMultiplier * stdDev;
    const lowVal = mean - stdDevMultiplier * stdDev;
    const wVal = mean > 0 ? ((upVal - lowVal) / mean) * 100 : 0;

    upper.push(upVal);
    lower.push(lowVal);
    width.push(wVal);
    
    // BB Squeeze is typically defined when Bollinger Band Width is at a low (e.g. less than 10-period minimum)
    squeeze.push(false); 
  }

  // Post-process squeezes based on relative bandwidth
  for (let i = 10; i < width.length; i++) {
    if (isNaN(width[i])) continue;
    let minWidth = width[i];
    for (let j = 1; j <= 10; j++) {
      if (width[i - j] < minWidth) minWidth = width[i - j];
    }
    squeeze[i] = width[i] <= minWidth * 1.05; // within 5% of 10-period min
  }

  return { middle, upper, lower, width, squeeze };
}

/**
 * Calculates Supertrend
 */
export function calculateSupertrend(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 10,
  multiplier = 3
): { trend: ("up" | "down")[]; band: number[] } {
  const atr = calculateATR(highs, lows, closes, period);
  const trend: ("up" | "down")[] = Array(closes.length).fill("up");
  const band: number[] = Array(closes.length).fill(NaN);

  if (closes.length <= period) return { trend, band };

  let longBand = (highs[period - 1] + lows[period - 1]) / 2 - multiplier * atr[period - 1];
  let shortBand = (highs[period - 1] + lows[period - 1]) / 2 + multiplier * atr[period - 1];
  
  trend[period - 1] = closes[period - 1] > shortBand ? "up" : "down";
  band[period - 1] = trend[period - 1] === "up" ? longBand : shortBand;

  for (let i = period; i < closes.length; i++) {
    const mid = (highs[i] + lows[i]) / 2;
    const currentAtr = atr[i];

    let tempLong = mid - multiplier * currentAtr;
    let tempShort = mid + multiplier * currentAtr;

    longBand = tempLong > longBand || closes[i - 1] < longBand ? tempLong : longBand;
    shortBand = tempShort < shortBand || closes[i - 1] > shortBand ? tempShort : shortBand;

    const prevTrend = trend[i - 1];
    let currentTrend = prevTrend;

    if (prevTrend === "up" && closes[i] < longBand) {
      currentTrend = "down";
    } else if (prevTrend === "down" && closes[i] > shortBand) {
      currentTrend = "up";
    }

    trend[i] = currentTrend;
    band[i] = currentTrend === "up" ? longBand : shortBand;
  }

  return { trend, band };
}

/**
 * Calculates Average Directional Index (ADX) and DMI
 */
export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): { adx: number[]; plusDI: number[]; minusDI: number[] } {
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const tr: number[] = [highs[0] - lows[0]];

  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(hl, hpc, lpc));

    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
    } else {
      plusDM.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      minusDM.push(downMove);
    } else {
      minusDM.push(0);
    }
  }

  const plusDI: number[] = Array(closes.length).fill(NaN);
  const minusDI: number[] = Array(closes.length).fill(NaN);
  const adx: number[] = Array(closes.length).fill(NaN);

  if (closes.length <= period * 2) return { adx, plusDI, minusDI };

  // Calculate first smoothed TR, DM+ and DM-
  let smoothedTR = 0;
  let smoothedPlusDM = 0;
  let smoothedMinusDM = 0;

  for (let i = 0; i < period; i++) {
    smoothedTR += tr[i];
    smoothedPlusDM += plusDM[i];
    smoothedMinusDM += minusDM[i];
  }

  plusDI[period - 1] = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
  minusDI[period - 1] = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;

  const dx: number[] = Array(closes.length).fill(NaN);
  const diff = Math.abs(plusDI[period - 1] - minusDI[period - 1]);
  const sum = plusDI[period - 1] + minusDI[period - 1];
  dx[period - 1] = sum > 0 ? (diff / sum) * 100 : 0;

  for (let i = period; i < closes.length; i++) {
    smoothedTR = smoothedTR - smoothedTR / period + tr[i];
    smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDM[i];
    smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDM[i];

    plusDI[i] = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
    minusDI[i] = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;

    const currentDiff = Math.abs(plusDI[i] - minusDI[i]);
    const currentSum = plusDI[i] + minusDI[i];
    dx[i] = currentSum > 0 ? (currentDiff / currentSum) * 100 : 0;
  }

  // Smooth DX to get ADX
  let dxSum = 0;
  for (let i = period - 1; i < period * 2 - 1; i++) {
    dxSum += dx[i];
  }
  
  let currentAdx = dxSum / period;
  adx[period * 2 - 2] = currentAdx;

  for (let i = period * 2 - 1; i < closes.length; i++) {
    currentAdx = (currentAdx * (period - 1) + dx[i]) / period;
    adx[i] = currentAdx;
  }

  return { adx, plusDI, minusDI };
}

/**
 * Calculates VWAP (Volume Weighted Average Price)
 */
export function calculateVWAP(highs: number[], lows: number[], closes: number[], volumes: number[]): number[] {
  const vwap: number[] = [];
  let sumPriceVol = 0;
  let sumVol = 0;

  for (let i = 0; i < closes.length; i++) {
    const avgPrice = (highs[i] + lows[i] + closes[i]) / 3;
    sumPriceVol += avgPrice * volumes[i];
    sumVol += volumes[i];

    vwap.push(sumVol > 0 ? sumPriceVol / sumVol : avgPrice);
  }
  return vwap;
}

/**
 * Calculates Donchian Channels
 */
export function calculateDonchianChannels(
  highs: number[],
  lows: number[],
  period = 20
): { upper: number[]; lower: number[]; middle: number[] } {
  const upper: number[] = [];
  const lower: number[] = [];
  const middle: number[] = [];

  for (let i = 0; i < highs.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      middle.push(NaN);
      continue;
    }

    let maxHigh = highs[i];
    let minLow = lows[i];

    for (let j = 1; j < period; j++) {
      if (highs[i - j] > maxHigh) maxHigh = highs[i - j];
      if (lows[i - j] < minLow) minLow = lows[i - j];
    }

    upper.push(maxHigh);
    lower.push(minLow);
    middle.push((maxHigh + minLow) / 2);
  }

  return { upper, lower, middle };
}

/**
 * Checks for Candlestick Patterns
 */
export function detectCandlestickPatterns(
  opens: number[],
  highs: number[],
  lows: number[],
  closes: number[]
): { doji: boolean[]; hammer: boolean[]; engulfingBullish: boolean[]; engulfingBearish: boolean[] } {
  const length = closes.length;
  const doji = Array(length).fill(false);
  const hammer = Array(length).fill(false);
  const engulfingBullish = Array(length).fill(false);
  const engulfingBearish = Array(length).fill(false);

  for (let i = 1; i < length; i++) {
    const body = Math.abs(closes[i] - opens[i]);
    const range = highs[i] - lows[i];
    
    // Doji
    if (range > 0 && body <= range * 0.1) {
      doji[i] = true;
    }

    // Hammer
    const lowerShadow = Math.min(opens[i], closes[i]) - lows[i];
    const upperShadow = highs[i] - Math.max(opens[i], closes[i]);
    if (range > 0 && lowerShadow >= body * 2 && upperShadow <= body * 0.2) {
      hammer[i] = true;
    }

    // Engulfing Bullish
    if (closes[i] > opens[i] && closes[i - 1] < opens[i - 1]) {
      if (opens[i] <= closes[i - 1] && closes[i] >= opens[i - 1]) {
        engulfingBullish[i] = true;
      }
    }

    // Engulfing Bearish
    if (closes[i] < opens[i] && closes[i - 1] > opens[i - 1]) {
      if (opens[i] >= closes[i - 1] && closes[i] <= opens[i - 1]) {
        engulfingBearish[i] = true;
      }
    }
  }

  return { doji, hammer, engulfingBullish, engulfingBearish };
}
