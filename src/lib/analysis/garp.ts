import type { Status } from "@/lib/types/stock";
import { GARP_THRESHOLDS, GARP_WEIGHTS } from "./config";
import { clamp, pctChange, scoreFromRange } from "./ema";

export interface FundamentalInput {
  pe: number;
  revGrowth: number;
  epsGrowth: number;
  roe: number;
  roce: number;
  debtEquity: number;
  opMargin: number;
  netMargin: number;
}

export interface GARPResult {
  growthQuality: number;
  businessQuality: number;
  valuation: number;
  investmentQuality: number;
  peg: number;
  garpPass: boolean;
}

export function computePEG(pe: number, epsGrowth: number): number {
  if (!epsGrowth || epsGrowth <= 0 || !Number.isFinite(pe)) return 99;
  return pe / epsGrowth;
}

export function scoreGARP(input: FundamentalInput): GARPResult {
  const peg = computePEG(input.pe, input.epsGrowth);

  const growthQuality = Math.round(
    scoreFromRange(input.revGrowth, 0, 40) * 0.5 + scoreFromRange(input.epsGrowth, 0, 40) * 0.5,
  );

  const businessQuality = Math.round(
    scoreFromRange(input.roe, 0, 35) * 0.35 +
      scoreFromRange(input.opMargin, 0, 35) * 0.25 +
      scoreFromRange(input.netMargin, 0, 25) * 0.2 +
      scoreFromRange(input.debtEquity, 2, 0, true) * 0.2,
  );

  let valuation = 0;
  if (peg >= GARP_THRESHOLDS.pegSweetMin && peg <= GARP_THRESHOLDS.pegSweetMax) {
    valuation = 90;
  } else if (peg < GARP_THRESHOLDS.pegSweetMin) {
    valuation = scoreFromRange(peg, 0, GARP_THRESHOLDS.pegSweetMin);
  } else {
    valuation = scoreFromRange(peg, GARP_THRESHOLDS.pegSweetMax, GARP_THRESHOLDS.pegMax, true);
  }

  const investmentQuality = Math.round(
    growthQuality * GARP_WEIGHTS.growth +
      businessQuality * GARP_WEIGHTS.business +
      valuation * GARP_WEIGHTS.valuation,
  );

  const garpPass =
    input.revGrowth >= GARP_THRESHOLDS.minRevGrowth * 0.5 &&
    input.roe >= GARP_THRESHOLDS.minROE * 0.5 &&
    peg <= GARP_THRESHOLDS.pegMax;

  return {
    growthQuality: clamp(growthQuality, 0, 100),
    businessQuality: clamp(businessQuality, 0, 100),
    valuation: clamp(valuation, 0, 100),
    investmentQuality: clamp(investmentQuality, 0, 100),
    peg,
    garpPass,
  };
}

export function growthFromSeries(values: number[]): number {
  if (values.length < 2) return 0;
  const latest = values[values.length - 1]!;
  const previous = values[values.length - 2]!;
  return pctChange(latest, previous);
}

export function mergeStatus(garpPass: boolean, technicalStatus: Status): Status {
  if (!garpPass && technicalStatus !== "Breakout") return "Avoid";
  if (garpPass && (technicalStatus === "VCP Ready" || technicalStatus === "Near Pivot")) {
    return "Strong Buy";
  }
  return technicalStatus;
}
