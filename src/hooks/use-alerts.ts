import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./use-auth";
import { DbAlert, fetchAlertsDb, createAlertDb, toggleAlertDb, deleteAlertDb } from "@/lib/supabase-db";
import { toast } from "sonner";

const LOCAL_STORAGE_KEY = "lynchmark-price-alerts";

function getLocalAlerts(): DbAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DbAlert[]) : [];
  } catch {
    return [];
  }
}

function setLocalAlerts(alerts: DbAlert[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(alerts));
}

export function useAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<DbAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        const dbAlerts = await fetchAlertsDb(user.id);
        setAlerts(dbAlerts);
      } else {
        setAlerts(getLocalAlerts());
      }
    } catch (err: any) {
      console.error("Failed to load alerts:", err);
      setError(err);
      setAlerts(getLocalAlerts());
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle sync on login
  useEffect(() => {
    if (user) {
      const syncLocalToDb = async () => {
        try {
          const localList = getLocalAlerts();
          if (localList.length === 0) return;

          const dbList = await fetchAlertsDb(user.id);
          
          // Filter out alerts that already exist in DB
          const newAlerts = localList.filter(
            local => !dbList.some(
              db => db.ticker.toUpperCase() === local.ticker.toUpperCase() && 
                    db.type === local.type && 
                    db.value === local.value
            )
          );

          if (newAlerts.length > 0) {
            await Promise.all(
              newAlerts.map(a => createAlertDb({ ticker: a.ticker, type: a.type, value: a.value }, user.id))
            );
          }

          // Clear local storage after sync
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          window.dispatchEvent(new Event("lynchmark-alerts-change"));
        } catch (err) {
          console.error("Failed to sync alerts to database:", err);
        }
      };
      syncLocalToDb();
    }
  }, [user]);

  // Load and listen for changes
  useEffect(() => {
    fetchAlerts();

    const handler = () => {
      if (user) {
        fetchAlertsDb(user.id)
          .then(setAlerts)
          .catch(console.error);
      } else {
        setAlerts(getLocalAlerts());
      }
    };

    window.addEventListener("lynchmark-alerts-change", handler);
    return () => {
      window.removeEventListener("lynchmark-alerts-change", handler);
    };
  }, [user, fetchAlerts]);

  const createAlert = useCallback(async (alertData: Omit<DbAlert, "id" | "user_id" | "is_active">) => {
    const upperTicker = alertData.ticker.toUpperCase();
    
    // Check for duplicate alert
    const isDuplicate = alerts.some(
      a => a.ticker.toUpperCase() === upperTicker &&
           a.type === alertData.type &&
           a.value === alertData.value
    );

    if (isDuplicate) {
      toast.error("Alert for this condition already exists!");
      return;
    }

    const prevAlerts = [...alerts];
    const newAlertId = Date.now(); // temporary id for local state / optimistic updates

    const tempAlert: DbAlert = {
      id: newAlertId,
      user_id: user?.id || "anonymous",
      ticker: upperTicker,
      type: alertData.type,
      value: alertData.value,
      is_active: true,
    };

    const nextAlerts = [...alerts, tempAlert];
    setAlerts(nextAlerts);
    if (!user) {
      setLocalAlerts(nextAlerts);
    }

    window.dispatchEvent(new Event("lynchmark-alerts-change"));

    if (user) {
      try {
        await createAlertDb(alertData, user.id);
        toast.success(`Alert set for ${upperTicker}`);
      } catch (err: any) {
        console.error("Failed to create alert in DB:", err);
        // Rollback
        setAlerts(prevAlerts);
        window.dispatchEvent(new Event("lynchmark-alerts-change"));
        toast.error("Failed to save alert. Rollback applied.");
      }
    } else {
      toast.success(`Alert set for ${upperTicker} (saved locally)`);
    }
  }, [alerts, user]);

  const toggleAlert = useCallback(async (alertId: string | number, isActive: boolean) => {
    const prevAlerts = [...alerts];
    
    const nextAlerts = alerts.map(a => a.id === alertId ? { ...a, is_active: isActive } : a);
    setAlerts(nextAlerts);
    if (!user) {
      setLocalAlerts(nextAlerts);
    }

    window.dispatchEvent(new Event("lynchmark-alerts-change"));

    if (user) {
      try {
        await toggleAlertDb(alertId, isActive);
        toast.success(`Alert ${isActive ? "enabled" : "disabled"}`);
      } catch (err: any) {
        console.error("Failed to toggle alert in DB:", err);
        // Rollback
        setAlerts(prevAlerts);
        window.dispatchEvent(new Event("lynchmark-alerts-change"));
        toast.error("Failed to update alert state. Rollback applied.");
      }
    } else {
      toast.success(`Alert ${isActive ? "enabled" : "disabled"} (locally)`);
    }
  }, [alerts, user]);

  const deleteAlert = useCallback(async (alertId: string | number) => {
    const prevAlerts = [...alerts];
    
    const nextAlerts = alerts.filter(a => a.id !== alertId);
    setAlerts(nextAlerts);
    if (!user) {
      setLocalAlerts(nextAlerts);
    }

    window.dispatchEvent(new Event("lynchmark-alerts-change"));

    if (user) {
      try {
        await deleteAlertDb(alertId);
        toast.success("Alert deleted");
      } catch (err: any) {
        console.error("Failed to delete alert in DB:", err);
        // Rollback
        setAlerts(prevAlerts);
        window.dispatchEvent(new Event("lynchmark-alerts-change"));
        toast.error("Failed to delete alert. Rollback applied.");
      }
    } else {
      toast.success("Alert deleted (locally)");
    }
  }, [alerts, user]);

  return {
    alerts,
    loading,
    error,
    createAlert,
    toggleAlert,
    deleteAlert,
    refetch: fetchAlerts,
  };
}
