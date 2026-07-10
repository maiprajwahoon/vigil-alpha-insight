import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Eye, EyeOff, Loader2, KeyRound, CheckCircle2, AlertCircle, X, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSignUp?: boolean;
}

export function AuthModal({ isOpen, onClose, initialSignUp = false }: AuthModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  const [isSignUp, setIsSignUp] = useState(initialSignUp);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [capsLock, setCapsLock] = useState(false);

  // Sync initial mode
  useEffect(() => {
    setIsSignUp(initialSignUp);
  }, [initialSignUp]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Caps Lock detection helper
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const caps = e.getModifierState && e.getModifierState("CapsLock");
    setCapsLock(caps);
  };

  // Input validation computations
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  const passwordStrengthScore = [hasMinLen, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const isPasswordSecure = passwordStrengthScore === 5;
  const passwordsMatch = password === confirmPassword;

  const isFormValid = isSignUp
    ? isEmailValid && isPasswordSecure && passwordsMatch && fullName.trim() !== "" && agreeTerms
    : isEmailValid && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: fullName.trim(),
            },
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
            "Verification link sent! Please check your email to verify your account before logging in."
          );
        } else {
          // Logged in immediately, send to onboarding
          toastSuccessAnimation();
        }
      } else {
        // Sign In
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) {
            throw new Error(
              "Invalid login credentials. If you just registered, please check your email for the verification link."
            );
          }
          throw error;
        }

        toastSuccessAnimation();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const toastSuccessAnimation = () => {
    setSuccessMsg("Success! Accessing terminal...");
    setTimeout(() => {
      onClose();
      // Redirect
      navigate({ to: "/dashboard" });
    }, 1000);
  };

  // Get Strength Color
  const getStrengthColor = () => {
    if (passwordStrengthScore <= 2) return "bg-rose-500";
    if (passwordStrengthScore <= 4) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthLabel = () => {
    if (password.length === 0) return "";
    if (passwordStrengthScore <= 2) return "Weak";
    if (passwordStrengthScore <= 4) return "Medium";
    return "Strong";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with 12px blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card with 20px-24px rounded corners and smooth scale transform */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#121212]/90 backdrop-blur-2xl p-8 shadow-2xl transition-all duration-300 transform scale-100 opacity-100 flex flex-col justify-between"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5 select-none mb-6">
          <img
            src="/logo.jpg"
            alt="LynchMark"
            className="mx-auto h-12 w-12 rounded-xl object-cover mb-3 shadow-md shadow-black/40 select-none"
          />
          <h1 className="font-display text-2.5xl font-semibold tracking-tight text-foreground/95 leading-none">
            {isSignUp ? "Create Account" : "Sign In to Terminal"}
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pt-0.5">
            {isSignUp ? "Register to begin stock research" : "GARP × Weekly VCP analysis scanner"}
          </p>
        </div>

        {/* Alert Banners */}
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/15 bg-red-500/10 p-3 text-xs text-red-400 mb-4 leading-normal">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/10 p-3 text-xs text-emerald-400 mb-4 leading-normal">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            /* Full Name */
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="peer w-full pl-10 pr-4 pt-6 pb-2 rounded-xl border border-white/5 bg-white/[0.015] text-sm text-foreground outline-none focus:border-blue-500/50 focus:bg-white/[0.03] transition-all placeholder-transparent"
                placeholder="Full Name"
                autoComplete="name"
                autoFocus
              />
              <span className="absolute left-3.5 top-[18px] text-muted-foreground/60 select-none pointer-events-none">
                <User className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <label className="absolute left-10 top-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-blue-400 pointer-events-none select-none">
                Full Name
              </label>
            </div>
          )}

          {/* Email Address with Floating Label & Inline validation */}
          <div className="space-y-1">
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full pl-10 pr-10 pt-6 pb-2 rounded-xl border border-white/5 bg-white/[0.015] text-sm text-foreground outline-none focus:border-blue-500/50 focus:bg-white/[0.03] transition-all placeholder-transparent"
                placeholder="Email Address"
                autoComplete="email"
                autoFocus={!isSignUp}
              />
              <span className="absolute left-3.5 top-[18px] text-muted-foreground/60 select-none pointer-events-none">
                <Mail className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <label className="absolute left-10 top-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-blue-400 pointer-events-none select-none">
                Email Address
              </label>
              {email && (
                <span className="absolute right-3.5 top-[18px] flex items-center pointer-events-none">
                  {isEmailValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400 animate-pulse" />
                  )}
                </span>
              )}
            </div>
            {!isEmailValid && email && (
              <span className="text-[10px] text-rose-400 px-1 leading-none block">Please enter a valid email address.</span>
            )}
          </div>

          {/* Password with Floating Label, Space Prevention & CapsLock Warning */}
          <div className="space-y-1">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onKeyDown={handleKeyDown}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
                className="peer w-full pl-10 pr-11 pt-6 pb-2 rounded-xl border border-white/5 bg-white/[0.015] text-sm text-foreground outline-none focus:border-blue-500/50 focus:bg-white/[0.03] transition-all placeholder-transparent"
                placeholder="Password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
              <span className="absolute left-3.5 top-[18px] text-muted-foreground/60 select-none pointer-events-none">
                <Lock className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <label className="absolute left-10 top-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-blue-400 pointer-events-none select-none">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[18px] flex items-center text-muted-foreground/60 hover:text-foreground transition select-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {capsLock && (
              <span className="text-[10px] text-amber-400 px-1 leading-none flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Caps Lock is ON
              </span>
            )}

            {/* Password Strength Indicator for Sign Up */}
            {isSignUp && password && (
              <div className="space-y-1 pt-1.5 px-1">
                <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                  <span>Password Strength</span>
                  <span className={getStrengthColor().replace("bg-", "text-")}>{getStrengthLabel()}</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 transition-all ${
                        i < passwordStrengthScore ? getStrengthColor() : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <ul className="text-[9px] text-muted-foreground/75 list-disc pl-3 space-y-0.5 mt-1 font-medium leading-none">
                  <li className={hasMinLen ? "text-emerald-400" : ""}>Minimum 8 characters</li>
                  <li className={hasUpper && hasLower ? "text-emerald-400" : ""}>Uppercase & lowercase letters</li>
                  <li className={hasNumber ? "text-emerald-400" : ""}>At least one number (0-9)</li>
                  <li className={hasSpecial ? "text-emerald-400" : ""}>At least one special character</li>
                </ul>
              </div>
            )}
          </div>

          {isSignUp && (
            /* Confirm Password */
            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ""))}
                  className="peer w-full pl-10 pr-11 pt-6 pb-2 rounded-xl border border-white/5 bg-white/[0.015] text-sm text-foreground outline-none focus:border-blue-500/50 focus:bg-white/[0.03] transition-all placeholder-transparent"
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                />
                <span className="absolute left-3.5 top-[18px] text-muted-foreground/60 select-none pointer-events-none">
                  <Lock className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <label className="absolute left-10 top-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-blue-400 pointer-events-none select-none">
                  Confirm Password
                </label>
              </div>
              {!passwordsMatch && confirmPassword && (
                <span className="text-[10px] text-rose-400 px-1 leading-none block">Passwords do not match.</span>
              )}
            </div>
          )}

          {isSignUp && (
            /* Terms checkbox */
            <label className="flex items-start gap-2.5 text-[11px] text-muted-foreground select-none cursor-pointer pt-1 px-1">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-white/10 bg-white/[0.02] text-blue-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="leading-snug">I agree to the Terms of Service and Privacy Policy</span>
            </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-background hover:bg-white/90 active:scale-[0.985] disabled:opacity-40 disabled:pointer-events-none transition shadow-lg shadow-black/20 mt-2 font-display"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-background" />
                <span>{isSignUp ? "Creating Account..." : "Connecting..."}</span>
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" strokeWidth={1.8} />
                <span>{isSignUp ? "Create Account" : "Sign In to Terminal"}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle between login and register */}
        <div className="text-center pt-5 border-t border-white/5 mt-5 select-none">
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
      </div>
    </div>
  );
}
