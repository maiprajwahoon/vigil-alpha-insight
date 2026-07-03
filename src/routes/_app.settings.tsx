import { createFileRoute } from "@tanstack/react-router";
import { SectionHeading } from "@/components/Primitives";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — LynchMark" }] }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [updating, setUpdating] = useState(false);

  // Sync state with user session
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
        },
      });

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Settings</p>
        <h1 className="font-display mt-2 text-4xl">Preferences</h1>
      </div>

      {/* Profile Section Card */}
      <form onSubmit={handleSaveProfile} className="glass-card p-6 space-y-6">
        <SectionHeading title="Profile" subtitle="How you appear inside LynchMark" />
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Anand Mehta"
              className="mt-1.5 h-10 w-full rounded-xl border border-border bg-white/[0.02] px-3 text-sm text-foreground outline-none focus:border-white/20 transition"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email address</label>
            <input
              type="email"
              disabled
              value={email}
              className="mt-1.5 h-10 w-full rounded-xl border border-border bg-white/[0.01] px-3 text-sm text-muted-foreground/60 cursor-not-allowed outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updating}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-xs text-background font-semibold hover:bg-white/90 disabled:opacity-50 transition cursor-pointer"
          >
            {updating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-background" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>

      {/* Notifications Section Card */}
      <div className="glass-card p-6">
        <SectionHeading title="Notifications" subtitle="Choose which signals reach you" />
        <ul className="divide-y divide-border">
          {["Weekly breakouts", "New VCP detected", "Earnings results", "Watchlist price alerts", "Volume spikes"].map((t) => (
            <li key={t} className="flex items-center justify-between py-3.5 text-sm">
              <div>
                <div>{t}</div>
                <div className="text-xs text-muted-foreground">Push, email and in-app</div>
              </div>
              <Toggle defaultOn />
            </li>
          ))}
        </ul>
      </div>

      {/* Saved Screeners Section Card */}
      <div className="glass-card p-6">
        <SectionHeading title="Saved screeners" subtitle="Your custom GARP × VCP setups" />
        <ul className="space-y-2">
          {["GARP — Indian Compounders", "Weekly VCP Ready", "Defense Leaders", "Renewables Momentum"].map((s) => (
            <li key={s} className="flex items-center justify-between rounded-xl border border-border bg-white/[0.015] px-4 py-3 text-sm">
              <span>{s}</span>
              <button className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Open</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  return (
    <label className="relative inline-flex h-6 w-10 cursor-pointer items-center select-none">
      <input type="checkbox" defaultChecked={defaultOn} className="peer sr-only" />
      <span className="absolute inset-0 rounded-full bg-white/[0.08] transition peer-checked:bg-white/80" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow transition peer-checked:left-[18px]" />
    </label>
  );
}
