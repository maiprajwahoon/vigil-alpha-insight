import { supabase } from "./supabase";

export interface DbAlert {
  id: string | number;
  user_id: string;
  ticker: string;
  type: string;
  value: number | null;
  is_active: boolean;
  created_at?: string;
}

// Watchlist Helpers
export async function fetchWatchlistDb(userId: string): Promise<string[]> {
  let { data, error } = await supabase.from("watchlist").select("ticker").eq("user_id", userId);
  if (error && (error.code === "PGRST813" || error.message?.includes("does not exist"))) {
    const res = await supabase.from("watchlists").select("ticker").eq("user_id", userId);
    data = res.data;
    error = res.error;
  }
  if (error) throw error;
  return data?.map((d: any) => d.ticker.toUpperCase()) || [];
}

export async function addToWatchlistDb(userId: string, ticker: string): Promise<void> {
  const upper = ticker.toUpperCase();
  let { error } = await supabase.from("watchlist").insert({ user_id: userId, ticker: upper });
  if (error && (error.code === "PGRST813" || error.message?.includes("does not exist"))) {
    const res = await supabase.from("watchlists").insert({ user_id: userId, ticker: upper });
    error = res.error;
  }
  if (error) throw error;
}

export async function removeFromWatchlistDb(userId: string, ticker: string): Promise<void> {
  const upper = ticker.toUpperCase();
  let { error } = await supabase.from("watchlist").delete().eq("user_id", userId).eq("ticker", upper);
  if (error && (error.code === "PGRST813" || error.message?.includes("does not exist"))) {
    const res = await supabase.from("watchlists").delete().eq("user_id", userId).eq("ticker", upper);
    error = res.error;
  }
  if (error) throw error;
}

// Alerts Helpers
export async function fetchAlertsDb(userId: string): Promise<DbAlert[]> {
  let { data, error } = await supabase.from("alerts").select("*").eq("user_id", userId);
  if (error && (error.code === "PGRST813" || error.message?.includes("does not exist"))) {
    const res = await supabase.from("price_alerts").select("*").eq("user_id", userId);
    data = res.data;
    error = res.error;
  }
  if (error) throw error;
  return (data || []) as DbAlert[];
}

export async function createAlertDb(alert: Omit<DbAlert, "id" | "user_id" | "is_active">, userId: string): Promise<void> {
  const upper = alert.ticker.toUpperCase();
  let { error } = await supabase.from("alerts").insert({
    user_id: userId,
    ticker: upper,
    type: alert.type,
    value: alert.value,
    is_active: true,
  });
  if (error && (error.code === "PGRST813" || error.message?.includes("does not exist"))) {
    const res = await supabase.from("price_alerts").insert({
      user_id: userId,
      ticker: upper,
      type: alert.type,
      value: alert.value,
      is_active: true,
    });
    error = res.error;
  }
  if (error) throw error;
}

export async function toggleAlertDb(alertId: string | number, isActive: boolean): Promise<void> {
  let { error } = await supabase.from("alerts").update({ is_active: isActive }).eq("id", alertId);
  if (error && (error.code === "PGRST813" || error.message?.includes("does not exist"))) {
    const res = await supabase.from("price_alerts").update({ is_active: isActive }).eq("id", alertId);
    error = res.error;
  }
  if (error) throw error;
}

export async function deleteAlertDb(alertId: string | number): Promise<void> {
  let { error } = await supabase.from("alerts").delete().eq("id", alertId);
  if (error && (error.code === "PGRST813" || error.message?.includes("does not exist"))) {
    const res = await supabase.from("price_alerts").delete().eq("id", alertId);
    error = res.error;
  }
  if (error) throw error;
}
