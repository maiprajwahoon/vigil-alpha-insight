import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowDown, LineChart, ShieldCheck, Sparkles, Mail, LogOut } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "@/lib/motion-shim";
import { CountUp } from "@/components/Primitives";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/AuthModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LynchMark — Institutional-grade stock research" },
      { name: "description", content: "GARP investing meets weekly VCP analysis. Discover exceptional businesses before institutional accumulation." },
      { property: "og:title", content: "LynchMark" },
      { property: "og:description", content: "Institutional-grade stock research for serious long-term investors." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, signOut } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialSignUp, setInitialSignUp] = useState(false);

  const openSignIn = () => {
    setInitialSignUp(false);
    setIsAuthOpen(true);
  };

  const openSignUp = () => {
    setInitialSignUp(true);
    setIsAuthOpen(true);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt="LynchMark"
            className="h-8 w-8 rounded-lg object-cover shrink-0 select-none"
          />
          <span className="font-display text-xl">LynchMark</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a className="hover:text-foreground transition" href="#philosophy">Philosophy</a>
          <a className="hover:text-foreground transition" href="#stats">Coverage</a>
          <a className="hover:text-foreground transition" href="#approach">Approach</a>
          <a className="hover:text-foreground transition" href="#about">About</a>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs text-foreground font-semibold transition"
              >
                Enter Terminal
              </Link>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-xl border border-white/5 hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={openSignIn}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1.5 transition"
              >
                Sign In
              </button>
              <button
                onClick={openSignUp}
                className="rounded-xl bg-white px-4 py-2 text-xs text-background font-semibold hover:bg-white/90 active:scale-95 transition"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-32 text-center">

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="text-hero mt-8 text-[clamp(3.5rem,10vw,9rem)]"
        >
          LynchMark
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.25 }}
          className="text-subheading text-muted-foreground/90 mx-auto mt-6 max-w-2xl text-base md:text-lg"
        >
          Inspired by legendary growth investors and trend-following traders.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-body-readable text-muted-foreground/80 mx-auto mt-4 max-w-2xl text-sm md:text-base"
        >
          Discover fundamentally exceptional businesses forming high-probability technical setups using
          GARP investing and weekly VCP analysis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {user ? (
            <>
              <Link
                to="/scanner"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-background transition hover:bg-white/90"
              >
                Start Screening
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.02] px-6 py-3 text-sm font-medium text-foreground transition hover:bg-white/[0.06]"
              >
                Explore Dashboard
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={openSignUp}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-background transition hover:bg-white/90"
              >
                Start Screening
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
              </button>
              <button
                onClick={openSignIn}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.02] px-6 py-3 text-sm font-medium text-foreground transition hover:bg-white/[0.06]"
              >
                Explore Dashboard
              </button>
            </>
          )}
        </motion.div>

        {/* stats */}
        <div id="stats" className="mx-auto mt-28 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {[
            { label: "Companies Tracked", value: 4280, suffix: "+" },
            { label: "Weekly VCP Candidates", value: 126 },
            { label: "Avg Growth Quality", value: 87, suffix: "/100" },
            { label: "Market Health", value: "Strong", isText: true },
          ].map((s) => (
            <div key={s.label} className="bg-background px-6 py-7 text-left">
              <div className="text-label-mono text-muted-foreground/75">{s.label}</div>
              <div className="mt-2 font-display font-tabular-nums text-3xl tracking-tight text-foreground/95">
                {s.isText ? s.value : <CountUp to={s.value as number} />}
                {s.suffix && <span className="ml-0.5 text-base text-muted-foreground font-normal">{s.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          className="mx-auto mt-20 flex w-fit flex-col items-center gap-2 text-xs text-muted-foreground"
        >
          <span>Scroll to explore</span>
          <ArrowDown className="h-4 w-4" strokeWidth={1.6} />
        </motion.div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="relative z-10 mx-auto max-w-6xl px-6 py-32">
        <div className="grid gap-12 md:grid-cols-3">
          {[
            { icon: Sparkles, title: "Quality first.", body: "We surface businesses with durable economics, expanding margins, and rational capital allocation — the kind that compound for decades." },
            { icon: LineChart, title: "Confirmed by tape.", body: "Weekly VCP analysis filters for the quiet phases that precede institutional accumulation, so conviction meets timing." },
            { icon: ShieldCheck, title: "Discipline by design.", body: "Risk-aware scoring across growth, valuation, and structure keeps you patient when others chase, and decisive when it matters." },
          ].map((c) => (
            <div key={c.title} className="glass-card premium-card-hover p-8">
              <c.icon className="h-5 w-5 text-foreground" strokeWidth={1.6} />
              <h3 className="text-section-heading mt-6 text-xl md:text-2xl">{c.title}</h3>
              <p className="text-body-readable mt-3 text-xs md:text-sm text-muted-foreground/85">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Approach */}
      <section id="approach" className="relative z-10 mx-auto max-w-6xl px-6 pb-40">
        <div className="glass-card premium-card-hover p-10 md:p-16 text-center">
          <p className="text-label-mono text-muted-foreground/75">The LynchMark approach</p>
          <p className="font-display mt-6 text-3xl md:text-5xl leading-[1.1] tracking-tight max-w-3xl mx-auto">
            "Know what you own, and know why you own it."
          </p>
          <p className="text-body-readable mx-auto mt-6 max-w-xl text-xs md:text-sm text-muted-foreground/80">
            A research surface that rewards patience — built for investors who let exceptional businesses do the heavy lifting.
          </p>
          {user ? (
            <Link
              to="/dashboard"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-background transition hover:bg-white/90"
            >
              Enter the terminal
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          ) : (
            <button
              onClick={openSignIn}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-background transition hover:bg-white/90"
            >
              Enter the terminal
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative z-10 mx-auto max-w-6xl px-6 pb-32">
        <div className="glass-card premium-card-hover p-10 md:p-14 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-label-mono text-muted-foreground/75">About</p>
            <h2 className="text-section-heading text-3xl md:text-4xl">LynchMark <span className="text-muted-foreground text-2xl font-normal">(LM)</span></h2>
          </div>

          {/* Body */}
          <div className="space-y-5 max-w-3xl">
            <p className="text-body-readable text-xs md:text-sm text-muted-foreground/85">
              LynchMark (LM) is a stock analysis platform designed to help investors better understand
              the Indian stock market using{" "}
              <span className="text-foreground font-semibold">GARP (Growth at a Reasonable Price)</span>{" "}
              investing principles and{" "}
              <span className="text-foreground font-semibold">Mark Minervini's VCP strategy</span>.
            </p>
            <p className="text-body-readable text-xs md:text-sm text-muted-foreground/85">
              Built by <span className="text-foreground font-semibold">Prajwal</span>, a 3rd Year Engineering
              Student, LM aims to simplify stock research by combining fundamental and technical analysis
              into one intuitive platform.
            </p>

            {/* Disclaimer */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-label-mono text-muted-foreground/60 mb-2">Disclaimer</p>
              <p className="text-body-readable text-xs md:text-sm text-muted-foreground/80">
                LM is only a <span className="text-foreground">research and learning tool</span> and does not
                provide financial or investment advice. Please invest at your own risk and always do your own
                research before making any investment decisions.
              </p>
            </div>

            {/* Contact */}
            <div className="pt-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3">Contact</p>
              <p className="text-sm text-muted-foreground mb-3">
                For suggestions, feedback, or bug reports, feel free to reach out:
              </p>
              <a
                href="mailto:gdoom298@gmail.com"
                className="inline-flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm text-foreground hover:bg-white/[0.07] transition group"
              >
                <Mail className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" strokeWidth={1.6} />
                gdoom298@gmail.com
              </a>
            </div>
          </div>
        </div>

        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} LynchMark Research</span>
          <span>For research and education. Not investment advice.</span>
        </footer>
      </section>
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialSignUp={initialSignUp}
      />
    </div>
  );
}
