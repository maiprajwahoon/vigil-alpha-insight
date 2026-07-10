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
      // If user has no full_name yet, send them to onboarding
      const hasName = user.user_metadata?.full_name?.trim();
      if (!hasName) {
        navigate({ to: "/onboarding" });
      } else {
        navigate({ to: "/dashboard" });
      }
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
        // Sign Up — just email + password, name collected later
        const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("security purposes") || error.message.toLowerCase().includes("limit exceeded")) {
            throw new Error(
              "Email rate limit exceeded (Supabase's default limit is 3 emails/hour). Please disable 'Confirm email' under Authentication > Providers > Email in your Supabase Dashboard to log in immediately without verification."
            );
          }
          throw error;
        }

        if (data.user && data.session === null) {
          setSuccessMsg(
            "Verification link sent! Please check your email to verify your account before logging in. Note: You can disable this verification requirement under Authentication > Providers > Email in your Supabase Dashboard to log in immediately."
          );
          setEmail("");
          setPassword("");
        } else {
          // After signup, redirect to onboarding to collect full name
          navigate({ to: "/onboarding" });
        }
      } else {
        // Sign In
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          if (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) {
            throw new Error(
              "Invalid login credentials. If you just registered, please check your email for the verification link or disable 'Confirm email' under Authentication > Providers > Email in your Supabase Dashboard."
            );
          }
          throw error;
        }

        // Check if user has completed onboarding
        const hasName = data.user?.user_metadata?.full_name?.trim();
        if (!hasName) {
          navigate({ to: "/onboarding" });
        } else {
          setSuccessMsg("Welcome back. Entering terminal...");
          setTimeout(() => {
            navigate({ to: "/dashboard" });
          }, 1200);
        }
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
        {/* Header */}
        <div className="text-center space-y-1.5 select-none">
          <img
            src="/logo.jpg"
            alt="LynchMark"
            className="mx-auto h-14 w-14 rounded-2xl object-cover mb-4 shadow-lg shadow-black/40 select-none"
          />
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground/95">
            {isSignUp ? "Create Account" : "Enter the Terminal"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isSignUp ? "Register to begin stock research" : "GARP × Weekly VCP analysis scanner"}
          </p>
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
          {/* Email */}
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.015] text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500/50 focus:bg-white/[0.03] transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center select-none">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Password</label>
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
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-white/5 bg-white/[0.015] text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500/50 focus:bg-white/[0.03] transition-all"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-background hover:bg-white/90 active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none transition shadow-lg shadow-black/20 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-background" />
                <span>{isSignUp ? "Creating Account..." : "Connecting..."}</span>
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" strokeWidth={1.8} />
                <span>{isSignUp ? "Sign Up" : "Sign In to Terminal"}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
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
