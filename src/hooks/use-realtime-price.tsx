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

// Tick all active prices
let intervalId: any = null;
function startGlobalTicker() {
  if (intervalId) return;

  intervalId = setInterval(() => {
    globalPrices.forEach((state, key) => {
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
    // If not initialized, or if the API basePrice changes (e.g. fresh backend fetch), update it
    if (!current || Math.abs(current.price - basePrice) > basePrice * 0.002) {
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

