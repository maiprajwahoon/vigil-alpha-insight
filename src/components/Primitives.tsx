import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function StatCard({
  label,
  value,
  delta,
  suffix,
  hint,
}: {
  label: string;
  value: number | string;
  delta?: number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group glass-card p-5 transition-shadow hover:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)]"
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        {delta !== undefined && (
          <div className={`text-xs ${delta >= 0 ? "text-bull" : "text-bear"}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}%
          </div>
        )}
      </div>
      <div className="mt-3 font-display text-4xl">
        {typeof value === "number" ? <CountUp to={value} /> : value}
        {suffix && <span className="ml-1 text-xl text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}

export function CountUp({ to, duration = 1.1, decimals = 0 }: { to: number; duration?: number; decimals?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setN(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}</>;
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Strong Buy": "bg-bull-soft",
    "VCP Ready": "bg-white/[0.06] text-foreground",
    "Near Pivot": "bg-white/[0.06] text-foreground",
    "Base Building": "bg-white/[0.04] text-muted-foreground",
    "Breakout": "bg-bull-soft",
    "Extended": "bg-white/[0.05] text-info",
    "Avoid": "bg-bear-soft",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-white/[0.06] ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}

export function ScoreBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono text-foreground">{value}</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-white/80"
        />
      </div>
    </div>
  );
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
