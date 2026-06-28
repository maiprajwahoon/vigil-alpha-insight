const WATCHLIST_KEY = "lynchmark-watchlist";

export function getWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function setWatchlist(tickers: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(tickers));
}

export function toggleWatchlist(ticker: string): string[] {
  const list = getWatchlist();
  const upper = ticker.toUpperCase();
  const next = list.includes(upper) ? list.filter((t) => t !== upper) : [...list, upper];
  setWatchlist(next);
  return next;
}

export function isInWatchlist(ticker: string): boolean {
  return getWatchlist().includes(ticker.toUpperCase());
}
