import { useState, useEffect, useRef } from "react";

export interface PriceState {
  price: number;
  changePct: number;
  direction: "up" | "down" | null;
}

export const globalPrices = new Map<string, PriceState>();
const listeners = new Map<string, Set<(state: PriceState) => void>>();

function getPreviousClose(basePrice: number, baseChangePct: number): number {
  return basePrice / (1 + (baseChangePct || 0) / 100);
}

/**
 * Checks if the stock market is currently open for a given ticker.
 * Indian stock market (NSE/BSE) hours: Mon-Fri, 9:15 AM - 3:30 PM IST (Asia/Kolkata).
 * US stock market (NYSE/NASDAQ) hours: Mon-Fri, 9:30 AM - 4:00 PM EST/EDT (America/New_York).
 */
export function isMarketOpen(ticker: string): boolean {
  const upperTicker = ticker.toUpperCase();
  
  // Determine market timezone and trading hours
  let timeZone = "Asia/Kolkata";
  let startHour = 9;
  let startMinute = 15;
  let endHour = 15;
  let endMinute = 30;

  // Identify US indices or US tickers
  const isUS =
    upperTicker.endsWith(".US") ||
    ["^GSPC", "^DJI", "^IXIC", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"].some((t) =>
      upperTicker.startsWith(t)
    );

  if (isUS) {
    timeZone = "America/New_York";
    startHour = 9;
    startMinute = 30;
    endHour = 16;
    endMinute = 0;
  }

  try {
    // Format current time into parts for the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
    });
    
    const parts = formatter.formatToParts(new Date());
    const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));

    const weekday = partMap.weekday; // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    if (weekday === "Sat" || weekday === "Sun") {
      return false;
    }

    const hour = parseInt(partMap.hour, 10);
    const minute = parseInt(partMap.minute, 10);
    const totalMinutes = hour * 60 + minute;

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return totalMinutes >= startMinutes && totalMinutes < endMinutes;
  } catch (e) {
    // Fallback: Default to local time checks if DateTimeFormat is unsupported or fails
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return false;

    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Default to NSE trading hours (9:15 AM - 3:30 PM) in local time
    return totalMinutes >= 9 * 60 + 15 && totalMinutes < 15 * 60 + 30;
  }
}

// Tick all active prices
let intervalId: any = null;
function startGlobalTicker() {
  if (intervalId) return;

  intervalId = setInterval(() => {
    globalPrices.forEach((state, key) => {
      // Only simulate updates if the market is currently open for this ticker
      if (!isMarketOpen(key)) {
        return;
      }

      // 50% chance of price update every second for each stock to simulate trade activity
      if (Math.random() > 0.5) {
        // Tickers like indices (^NSEI) fluctuate in similar ranges
        const multiplier = key.startsWith("^") ? 0.015 : 0.03; // Indices are less volatile
        const percentageChange = (Math.random() * multiplier * 2 - multiplier) / 100; // e.g. -0.03% to +0.03%
        const newPrice = state.price * (1 + percentageChange);
        
        // Calculate new change percent relative to the estimated previous close
        const prevClose = getPreviousClose(newPrice, state.changePct);
        const newChangePct = prevClose > 0 ? ((newPrice - prevClose) / prevClose) * 100 : state.changePct;
        const direction = newPrice > state.price ? "up" : "down";

        const newState: PriceState = {
          price: newPrice,
          changePct: newChangePct,
          direction,
        };

        globalPrices.set(key, newState);

        // Notify listeners
        const keyListeners = listeners.get(key);
        if (keyListeners) {
          keyListeners.forEach((cb) => cb(newState));
        }

        // Reset direction after 500ms so highlight doesn't stick
        setTimeout(() => {
          const current = globalPrices.get(key);
          if (current && current.price === newPrice) {
            const resetState = { ...current, direction: null as "up" | "down" | null };
            globalPrices.set(key, resetState);
            const l = listeners.get(key);
            if (l) l.forEach((cb) => cb(resetState));
          }
        }, 500);
      }
    });
  }, 1000);
}

/**
 * Custom hook to get real-time ticking prices and change percentages.
 * Synchronizes multiple instances of the same ticker across different components.
 */
export function useRealtimePrice(
  ticker: string,
  basePrice: number,
  baseChangePct: number
): PriceState {
  const upperKey = ticker.toUpperCase();
  const initRef = useRef(false);

  // Initialize store entry if it doesn't exist
  if (!globalPrices.has(upperKey) && basePrice) {
    globalPrices.set(upperKey, {
      price: basePrice,
      changePct: baseChangePct,
      direction: null,
    });
  }

  const [state, setState] = useState<PriceState>(() => {
    return (
      globalPrices.get(upperKey) || {
        price: basePrice || 0,
        changePct: baseChangePct || 0,
        direction: null,
      }
    );
  });

  // Keep track of latest basePrice and baseChangePct to detect changes from API refetches
  useEffect(() => {
    if (!basePrice) return;

    const current = globalPrices.get(upperKey);
    const open = isMarketOpen(upperKey);
    
    // Reset/force sync to the correct API base price if market is closed,
    // or if the item is not initialized, or if the basePrice has significantly changed
    if (!open || !current || Math.abs(current.price - basePrice) > basePrice * 0.002) {
      const newState: PriceState = {
        price: basePrice,
        changePct: baseChangePct,
        direction: null,
      };
      globalPrices.set(upperKey, newState);
      setState(newState);
      
      // Notify other listeners about the reset
      const keyListeners = listeners.get(upperKey);
      if (keyListeners) {
        keyListeners.forEach((cb) => {
          if (cb !== setState) cb(newState);
        });
      }
    }
    initRef.current = true;
  }, [upperKey, basePrice, baseChangePct]);

  useEffect(() => {
    if (!basePrice) return;

    // Start global interval if not started
    startGlobalTicker();

    // Register listener
    if (!listeners.has(upperKey)) {
      listeners.set(upperKey, new Set());
    }
    const keyListeners = listeners.get(upperKey)!;
    keyListeners.add(setState);

    return () => {
      keyListeners.delete(setState);
      if (keyListeners.size === 0) {
        listeners.delete(upperKey);
        // We keep globalPrices cached so price doesn't reset when component remounts
      }
    };
  }, [upperKey, basePrice]);

  return state;
}

export function RealtimePriceCell({
  ticker,
  basePrice,
  baseChangePct,
  showChangePct = false,
  className = "",
  decimals = 2,
}: {
  ticker: string;
  basePrice: number;
  baseChangePct: number;
  showChangePct?: boolean;
  className?: string;
  decimals?: number;
}) {
  const { price, changePct, direction } = useRealtimePrice(ticker, basePrice, baseChangePct);

  const flashClass =
    direction === "up"
      ? "animate-flash-up text-bull"
      : direction === "down"
        ? "animate-flash-down text-bear"
        : "";

  if (showChangePct) {
    return (
      <span className={`${flashClass} ${className}`}>
        {changePct >= 0 ? "+" : ""}
        {changePct.toFixed(decimals)}%
      </span>
    );
  }

  return (
    <span className={`${flashClass} ${className}`}>
      ₹{price.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}

