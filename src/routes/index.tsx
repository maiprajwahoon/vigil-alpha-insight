import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowDown, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "@/lib/motion-shim";
import { CountUp } from "@/components/Primitives";

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
        </div>

      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-32 text-center">

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="font-display mt-8 text-[clamp(3.5rem,10vw,9rem)] leading-[0.95] tracking-tight"
        >
          LynchMark
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.25 }}
          className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground"
        >
          Inspired by legendary growth investors and trend-following traders.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mx-auto mt-3 max-w-2xl text-sm md:text-base text-muted-foreground/80"
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
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-2 font-display text-3xl">
                {s.isText ? s.value : <CountUp to={s.value as number} />}
                {s.suffix && <span className="ml-1 text-base text-muted-foreground">{s.suffix}</span>}
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
            <div key={c.title} className="glass-card p-8">
              <c.icon className="h-5 w-5 text-foreground" strokeWidth={1.6} />
              <h3 className="font-display mt-6 text-2xl">{c.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Approach */}
      <section id="approach" className="relative z-10 mx-auto max-w-6xl px-6 pb-40">
        <div className="glass-card p-10 md:p-16 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">The LynchMark approach</p>
          <p className="font-display mt-6 text-3xl md:text-5xl leading-tight max-w-3xl mx-auto">
            "Know what you own, and know why you own it."
          </p>
          <p className="mx-auto mt-6 max-w-xl text-sm text-muted-foreground">
            A research surface that rewards patience — built for investors who let exceptional businesses do the heavy lifting.
          </p>
          <Link
            to="/dashboard"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-background transition hover:bg-white/90"
          >
            Enter the terminal
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>

        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} LynchMark Research</span>
          <span>For research and education. Not investment advice.</span>
        </footer>
      </section>
    </div>
  );
}
