/** Exponential moving average over a numeric series. */
export function ema(values: number[], period: number): (number | null)[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
  let prev: number | null = null;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (prev == null) {
      const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      prev = seed;
      result.push(seed);
    } else {
      prev = v * k + prev * (1 - k);
      result.push(prev);
    }
  }
  return result;
}

export function lastNonNull(values: (number | null)[]): number | null {
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] != null) return values[i];
  }
  return null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Map value into 0–100 using linear bands. */
export function scoreFromRange(value: number, min: number, max: number, invert = false): number {
  if (!Number.isFinite(value)) return 0;
  const t = clamp((value - min) / (max - min), 0, 1);
  const score = invert ? (1 - t) * 100 : t * 100;
  return Math.round(score);
}

export function pctChange(current: number, previous: number): number {
  if (!previous || !Number.isFinite(previous)) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
