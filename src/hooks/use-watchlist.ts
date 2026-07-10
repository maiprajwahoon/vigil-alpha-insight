import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./use-auth";
import { fetchWatchlistDb, addToWatchlistDb, removeFromWatchlistDb } from "@/lib/supabase-db";
import { toast } from "sonner";

const LOCAL_STORAGE_KEY = "lynchmark-watchlist";

function getLocalWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]).map(t => t.toUpperCase()) : [];
  } catch {
    return [];
  }
}

function setLocalWatchlist(tickers: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickers.map(t => t.toUpperCase())));
}

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        const dbList = await fetchWatchlistDb(user.id);
        setWatchlist(dbList);
      } else {
        setWatchlist(getLocalWatchlist());
      }
    } catch (err: any) {
      console.error("Failed to load watchlist:", err);
      setError(err);
      // Fallback to local storage on error
      setWatchlist(getLocalWatchlist());
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle sync on login
  useEffect(() => {
    if (user) {
      const syncLocalToDb = async () => {
        try {
          const localList = getLocalWatchlist();
          if (localList.length === 0) return;

          const dbList = await fetchWatchlistDb(user.id);
          const newTickers = localList.filter(t => !dbList.includes(t));

          if (newTickers.length > 0) {
            await Promise.all(newTickers.map(t => addToWatchlistDb(user.id, t)));
          }

          // Clear local storage after sync
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          window.dispatchEvent(new Event("lynchmark-watchlist-change"));
        } catch (err) {
          console.error("Failed to sync watchlist to database:", err);
        }
      };
      syncLocalToDb();
    }
  }, [user]);

  // Load and listen for changes
  useEffect(() => {
    fetchWatchlist();

    const handler = () => {
      if (user) {
        fetchWatchlistDb(user.id)
          .then(setWatchlist)
          .catch(console.error);
      } else {
        setWatchlist(getLocalWatchlist());
      }
    };

    window.addEventListener("lynchmark-watchlist-change", handler);
    return () => {
      window.removeEventListener("lynchmark-watchlist-change", handler);
    };
  }, [user, fetchWatchlist]);

  const toggleWatchlist = useCallback(async (ticker: string) => {
    const upper = ticker.toUpperCase();
    const isWatchlisted = watchlist.includes(upper);
    const prevWatchlist = [...watchlist];

    // 1. Optimistic Update
    const nextWatchlist = isWatchlisted
      ? watchlist.filter(t => t !== upper)
      : [...watchlist, upper];
    
    setWatchlist(nextWatchlist);
    if (!user) {
      setLocalWatchlist(nextWatchlist);
    }

    // Notify other components immediately
    window.dispatchEvent(new Event("lynchmark-watchlist-change"));

    // 2. Perform DB operation if logged in
    if (user) {
      try {
        if (isWatchlisted) {
          await removeFromWatchlistDb(user.id, upper);
          toast.success(`${upper} removed from watchlist`);
        } else {
          await addToWatchlistDb(user.id, upper);
          toast.success(`${upper} added to watchlist`);
        }
      } catch (err: any) {
        console.error("Failed to toggle watchlist in DB:", err);
        // Rollback on error
        setWatchlist(prevWatchlist);
        window.dispatchEvent(new Event("lynchmark-watchlist-change"));
        toast.error(`Failed to update watchlist. Rollback applied.`);
      }
    } else {
      if (isWatchlisted) {
        toast.success(`${upper} removed from watchlist (locally)`);
      } else {
        toast.success(`${upper} added to watchlist (locally)`);
      }
    }
  }, [watchlist, user]);

  const isWatchlisted = useCallback((ticker: string) => {
    return watchlist.includes(ticker.toUpperCase());
  }, [watchlist]);

  return {
    watchlist,
    loading,
    error,
    toggleWatchlist,
    isWatchlisted,
    refetch: fetchWatchlist,
  };
}
