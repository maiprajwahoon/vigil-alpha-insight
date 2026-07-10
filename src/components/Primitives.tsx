import { useEffect, useState } from "react";
import { motion } from "@/lib/motion-shim";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

function MiniSparkline({ data, isBullish }: { data: number[]; isBullish: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 48;
      const y = 14 - ((val - min) / range) * 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="h-4.5 w-12 overflow-visible select-none" strokeWidth={1.3} fill="none">
      <polyline points={points} stroke={isBullish ? "var(--bull)" : "var(--bear)"} />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  delta,
  suffix,
  hint,
  icon: Icon,
  sparkline,
}: {
  label: string;
  value: number | string;
  delta?: number;
  suffix?: string;
  hint?: string;
  icon?: LucideIcon;
  sparkline?: number[];
}) {
  const isUp = delta !== undefined ? delta >= 0 : true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group glass-card premium-card-hover p-5 cursor-default select-none relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground/60 group-hover:text-[#3b82f6] transition-colors" strokeWidth={1.6} />}
          <span className="text-label-mono text-muted-foreground/80">{label}</span>
        </div>
        {delta !== undefined && (
          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold font-tabular-nums ${
            isUp ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-red-500/10 text-red-400 border border-red-500/15"
          }`}>
            {isUp ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
            {Math.abs(delta).toFixed(2)}%
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div className="font-display font-tabular-nums text-3xl font-semibold tracking-tight text-foreground/95">
          {typeof value === "number" ? <CountUp to={value} /> : value}
          {suffix && <span className="ml-0.5 text-lg text-muted-foreground font-normal">{suffix}</span>}
        </div>
        
        {sparkline && sparkline.length > 0 && (
          <div className="shrink-0">
            <MiniSparkline data={sparkline} isBullish={isUp} />
          </div>
        )}
      </div>

      {hint && <div className="mt-2.5 text-xs text-muted-foreground/80 leading-normal">{hint}</div>}
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
    "Strong Buy": "bg-emerald-500/10 border border-emerald-500/15 text-emerald-400",
    "VCP Ready": "bg-blue-500/10 border border-blue-500/15 text-blue-400",
    "Near Pivot": "bg-blue-500/10 border border-blue-500/15 text-blue-400",
    "Base Building": "bg-white/5 border border-white/5 text-muted-foreground",
    "Breakout": "bg-emerald-500/10 border border-emerald-500/15 text-emerald-400",
    "Extended": "bg-purple-500/10 border border-purple-500/15 text-purple-400",
    "Avoid": "bg-red-500/10 border border-red-500/15 text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider select-none leading-none border ${map[status] ?? "bg-white/5 border-white/5 text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export function ScoreBar({ value, label }: { value: number; label?: string }) {
  const isExcellent = value >= 80;
  const isStrong = value >= 60;
  const isGood = value >= 40;
  
  const badgeColor = 
    isExcellent ? "bg-emerald-500/10 border border-emerald-500/15 text-emerald-400" :
    isStrong ? "bg-teal-500/10 border border-teal-500/15 text-teal-400" :
    isGood ? "bg-blue-500/10 border border-blue-500/15 text-blue-400" :
    "bg-amber-500/10 border border-amber-500/15 text-amber-400";

  const litColor = 
    isExcellent ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.3)]" :
    isStrong ? "bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.3)]" :
    isGood ? "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.3)]" :
    "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.3)]";

  if (label) {
    return (
      <div className="space-y-1.5 select-none">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground/80 font-medium">{label}</span>
          <span className={`font-bold font-tabular-nums px-1.5 py-0.5 rounded leading-none ${badgeColor}`}>{value}/100</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full rounded-full ${isExcellent ? "bg-emerald-400" : isStrong ? "bg-teal-400" : isGood ? "bg-blue-400" : "bg-amber-400"}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 select-none">
      <div>
        <span className={`text-[10px] font-bold font-tabular-nums px-1.5 py-0.5 rounded leading-none ${badgeColor}`}>
          {value}/100
        </span>
      </div>
      <div className="flex gap-0.5 items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const threshold = i * 20;
          const isLit = value >= threshold - 10;
          return (
            <div
              key={i}
              className={`h-1 w-3.5 rounded-full transition-all duration-300 ${
                isLit ? litColor : "bg-white/[0.06]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 select-none">
      <div className="space-y-1">
        <h2 className="text-section-heading text-2xl md:text-2.5xl text-foreground/95">{title}</h2>
        {subtitle && <p className="text-body-readable text-xs md:text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
