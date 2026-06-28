import type { Status, WeeklyBar, VCPAnalysis, VCPStage } from "@/lib/types/stock";
import { VCP_CONFIG } from "./config";
import { clamp, ema, lastNonNull, scoreFromRange } from "./ema";

export interface VCPResult {
  technicalStrength: number;
  breakoutReadiness: number;
  status: Status;
  analysis: VCPAnalysis;
}

interface SwingPoint {
  index: number;
  high: number;
  low: number;
}

function detectSwings(bars: WeeklyBar[], lookback: number): SwingPoint[] {
  const swings: SwingPoint[] = [];
  for (let i = lookback; i < bars.length - lookback; i++) {
    const window = bars.slice(i - lookback, i + lookback + 1);
    const high = bars[i].high;
    const low = bars[i].low;
    const isHigh = window.every((b) => b.high <= high);
    const isLow = window.every((b) => b.low >= low);
    if (isHigh || isLow) {
      swings.push({ index: i, high, low });
    }
  }
  return swings;
}

function measureContractions(bars: WeeklyBar[]): Array<{ depthPct: number; tightness: number }> {
  const lookback = Math.min(VCP_CONFIG.baseLookbackWeeks, bars.length);
  const base = bars.slice(-lookback);
  const swings = detectSwings(base, VCP_CONFIG.swingLookback);
  const highs = swings.map((s) => s.high).sort((a, b) => b - a).slice(0, 6);
  const contractions: Array<{ depthPct: number; tightness: number }> = [];

  for (let i = 1; i < highs.length; i++) {
    const prev = highs[i - 1];
    const curr = highs[i];
    const depthPct = ((curr - prev) / prev) * 100;
    if (depthPct < 0) {
      contractions.push({
        depthPct: Math.abs(depthPct),
        tightness: scoreFromRange(Math.abs(depthPct), 30, 3, true),
      });
    }
  }
  return contractions.slice(-4);
}

function computePivot(bars: WeeklyBar[]): number {
  const lookback = Math.min(VCP_CONFIG.baseLookbackWeeks, bars.length);
  const base = bars.slice(-lookback);
  return Math.max(...base.map((b) => b.high));
}

export function analyzeVCP(bars: WeeklyBar[], garpPass = true): VCPResult {
  if (bars.length < 30) {
    return emptyVCP("Base Building");
  }

  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);
  const ema50 = ema(closes, 50);
  const ema150 = ema(closes, 150);
  const ema200 = ema(closes, 200);

  const lastClose = closes[closes.length - 1]!;
  const e50 = lastNonNull(ema50);
  const e150 = lastNonNull(ema150);
  const e200 = lastNonNull(ema200);

  const priceAbove50 = e50 != null && lastClose > e50;
  const priceAbove150 = e150 != null && lastClose > e150;
  const priceAbove200 = e200 != null && lastClose > e200;
  const emaAlignment = priceAbove50 && priceAbove150 && priceAbove200 && e50 != null && e150 != null && e50 > e150 && e150 > e200!;

  const contractions = measureContractions(bars);
  const pivotPrice = computePivot(bars);
  const distanceToPivotPct = pivotPrice > 0 ? ((pivotPrice - lastClose) / pivotPrice) * 100 : 0;

  const avgVol50 = volumes.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, volumes.length);
  const recentVol = volumes.slice(-4).reduce((a, b) => a + b, 0) / Math.min(4, volumes.length);
  const volumeDryUpRatio = avgVol50 > 0 ? recentVol / avgVol50 : 1;

  const decreasingContractions =
    contractions.length >= 2 &&
    contractions.every((c, i) => i === 0 || c.depthPct < contractions[i - 1]!.depthPct);

  const vcpDetected =
    contractions.length >= VCP_CONFIG.minContractions &&
    decreasingContractions &&
    volumeDryUpRatio <= VCP_CONFIG.volumeDryUpRatio;

  const stages: VCPStage[] = contractions.map((c, i) => ({
    name: `Contraction ${i + 1}`,
    pct: c.tightness,
    depth: `-${c.depthPct.toFixed(0)}%`,
  }));

  if (volumeDryUpRatio <= VCP_CONFIG.volumeDryUpRatio) {
    stages.push({
      name: "Volume dry-up",
      pct: scoreFromRange(volumeDryUpRatio, 1, 0.3, true),
      depth: `${volumeDryUpRatio.toFixed(1)}x avg`,
    });
  }

  stages.push({
    name: "Pivot",
    pct: clamp(100 - Math.abs(distanceToPivotPct) * 10, 20, 100),
    depth: `₹${pivotPrice.toFixed(0)}`,
  });

  let status: Status = "Base Building";
  const brokeOut = lastClose > pivotPrice * 1.001;
  const extended = lastClose > pivotPrice * (1 + VCP_CONFIG.extendedPct / 100);
  const nearPivot = distanceToPivotPct >= 0 && distanceToPivotPct <= VCP_CONFIG.nearPivotPct;

  if (extended) status = "Extended";
  else if (brokeOut && recentVol > avgVol50 * 1.2) status = "Breakout";
  else if (nearPivot && vcpDetected) status = "Near Pivot";
  else if (vcpDetected && emaAlignment) status = "VCP Ready";
  else if (vcpDetected) status = "VCP Ready";
  else if (!garpPass) status = "Avoid";
  else if (!priceAbove200) status = "Base Building";

  if (garpPass && (status === "VCP Ready" || status === "Near Pivot") && emaAlignment) {
    status = "Strong Buy";
  }

  const patternIntegrity: VCPAnalysis["patternIntegrity"] =
    vcpDetected && decreasingContractions ? "high" : contractions.length >= 2 ? "medium" : "low";

  const technicalStrength = Math.round(
    (priceAbove50 ? 25 : 0) +
      (priceAbove150 ? 25 : 0) +
      (priceAbove200 ? 20 : 0) +
      (emaAlignment ? 15 : 0) +
      scoreFromRange(contractions.length, 0, 4) * 0.15,
  );

  const breakoutReadiness = Math.round(
    clamp(100 - Math.max(0, distanceToPivotPct) * 8, 0, 100) * 0.4 +
      scoreFromRange(volumeDryUpRatio, 1, 0.3, true) * 0.3 +
      (vcpDetected ? 30 : 0),
  );

  const breakoutProbability = Math.round(
    breakoutReadiness * 0.5 + (vcpDetected ? 30 : 0) + (nearPivot ? 20 : 0),
  );

  return {
    technicalStrength: clamp(technicalStrength, 0, 100),
    breakoutReadiness: clamp(breakoutReadiness, 0, 100),
    status,
    analysis: {
      stages,
      pivotPrice,
      distanceToPivotPct,
      breakoutProbability: clamp(breakoutProbability, 0, 100),
      priceAbove50EMA: priceAbove50,
      priceAbove150EMA: priceAbove150,
      priceAbove200EMA: priceAbove200,
      emaAlignment,
      volumeDryUpRatio,
      contractionCount: contractions.length,
      patternIntegrity,
    },
  };
}

function emptyVCP(status: Status): VCPResult {
  return {
    technicalStrength: 0,
    breakoutReadiness: 0,
    status,
    analysis: {
      stages: [],
      pivotPrice: 0,
      distanceToPivotPct: 0,
      breakoutProbability: 0,
      priceAbove50EMA: false,
      priceAbove150EMA: false,
      priceAbove200EMA: false,
      emaAlignment: false,
      volumeDryUpRatio: 1,
      contractionCount: 0,
      patternIntegrity: "low",
    },
  };
}

export function resampleToWeekly(
  daily: Array<{ date: Date; open: number; high: number; low: number; close: number; volume: number }>,
): WeeklyBar[] {
  const weeks = new Map<string, WeeklyBar>();

  for (const bar of daily) {
    const d = new Date(bar.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);

    const existing = weeks.get(key);
    if (!existing) {
      weeks.set(key, {
        date: key,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      });
    } else {
      existing.high = Math.max(existing.high, bar.high);
      existing.low = Math.min(existing.low, bar.low);
      existing.close = bar.close;
      existing.volume += bar.volume;
    }
  }

  return [...weeks.values()].sort((a, b) => a.date.localeCompare(b.date));
}
