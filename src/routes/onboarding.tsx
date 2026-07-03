import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { User, Mail, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "@/lib/motion-shim";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Complete Your Profile — LynchMark" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If not logged in, redirect to login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
    // If already has a name, skip onboarding
    if (!authLoading && user) {
      const hasName = user.user_metadata?.full_name?.trim();
      if (hasName) {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
        },
      });

      if (error) throw error;

      setSuccessMsg("Profile saved! Taking you to the terminal...");
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#111111]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md glass-card p-8 z-10 relative space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-1.5 select-none">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-background mb-4 shadow-lg shadow-black/30">
            <span className="font-display text-2xl font-bold leading-none">L</span>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground/95">
            Complete Your Profile
          </h1>
          <p className="text-xs text-muted-foreground">
            Tell us your name to personalise your experience
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 select-none">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-6 rounded-full bg-white/30" />
            <span className="text-[10px] text-muted-foreground">Account</span>
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-6 rounded-full bg-white" />
            <span className="text-[10px] text-foreground font-semibold">Profile</span>
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-6 rounded-full bg-white/10" />
            <span className="text-[10px] text-muted-foreground">Terminal</span>
          </div>
        </div>

        {/* Alert Banners */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/15 bg-red-500/10 p-3.5 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 select-none">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground/60 select-none">
                <User className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <input
                type="text"
                required
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Anand Mehta"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.015] text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500/50 focus:bg-white/[0.03] transition-all"
              />
            </div>
          </div>

          {/* Email — auto-filled, read-only */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 select-none">
              Email Address <span className="text-muted-foreground/50 normal-case tracking-normal font-normal">(auto-saved)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground/40 select-none">
                <Mail className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <input
                type="email"
                disabled
                value={user.email || ""}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.008] text-sm text-muted-foreground/50 cursor-not-allowed outline-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground/50 pl-1">
              This is automatically saved from your account
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-background hover:bg-white/90 active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none transition shadow-lg shadow-black/20 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-background" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Save & Enter Terminal</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
