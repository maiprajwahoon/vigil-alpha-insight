import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "@/lib/motion-shim";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Access Terminal — LynchMark" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all credentials.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        
        if (error) throw error;
        
        if (data.user && data.session === null) {
          setSuccessMsg("Verification link sent! Please check your email to complete registration.");
          setEmail("");
          setPassword("");
        } else {
          setSuccessMsg("Account created! Logging in...");
          setTimeout(() => {
            navigate({ to: "/dashboard" });
          }, 1500);
        }
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        
        if (error) throw error;
        
        setSuccessMsg("Welcome back. Entering terminal...");
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#111111] select-none">
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
        {/* Header Title */}
        <div className="text-center space-y-1.5 select-none">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-background mb-4 shadow-lg shadow-black/30">
            <span className="font-display text-2xl font-bold leading-none">L</span>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground/95">
            {isSignUp ? "Create Access Account" : "Enter the Terminal"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isSignUp ? "Register to begin stock research" : "GARP × Weekly VCP analysis scanner"}
          </p>
        </div>

        {/* Alerts Notification Banner */}
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

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 select-none">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground/60 select-none">
                <Mail className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.015] text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500/50 focus:bg-white/[0.03] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center select-none">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Password</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => alert("Supabase auth handles password reset requests directly. Please trigger from console or invite flows.")}
                  className="text-[10.5px] font-semibold text-blue-400 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground/60 select-none">
                <Lock className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10.5 pr-11 py-2.5 rounded-xl border border-white/5 bg-white/[0.015] text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500/50 focus:bg-white/[0.03] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3.5 flex items-center text-muted-foreground/60 hover:text-foreground transition select-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-background hover:bg-white/90 active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none transition shadow-lg shadow-black/20 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-background" />
                <span>{isSignUp ? "Registering Account..." : "Connecting Terminal..."}</span>
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" strokeWidth={1.8} />
                <span>{isSignUp ? "Sign Up" : "Sign In to Terminal"}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="text-center pt-2 select-none">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold transition"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
