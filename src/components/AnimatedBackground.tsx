import { useEffect, useState } from "react";
import { THOUGHTS } from "@/lib/mock-data";

/**
 * Ambient background: slow grid drift, candlestick outlines, trend sweeps,
 * floating particles, faint market numbers, and rotating investing thoughts.
 */
export function AnimatedBackground() {
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const [showThought, setShowThought] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setShowThought(false);
      setTimeout(() => {
        setThoughtIdx((i) => (i + 1) % THOUGHTS.length);
        setShowThought(true);
      }, 800);
    }, 20000);
    return () => clearInterval(id);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* drifting grid */}
      <div className="absolute -inset-[20%] bg-grid animate-drift opacity-60" />

      {/* radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 50% 0%, transparent 0%, oklch(0.18 0 0 / 0.0) 40%, oklch(0.12 0 0 / 0.85) 100%)",
        }}
      />

      {/* sweeping trend lines */}
      <svg className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trend" x1="0" x2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[15, 38, 62, 81].map((y, i) => (
          <g key={i} className="animate-line-sweep" style={{ animationDelay: `${i * 4}s` }}>
            <line
              x1="0"
              y1={`${y}%`}
              x2="100%"
              y2={`${y - 6}%`}
              stroke="url(#trend)"
              strokeWidth="1"
            />
          </g>
        ))}
      </svg>

      {/* faint candlestick outlines */}
      <svg className="absolute bottom-0 left-0 right-0 h-72 w-full opacity-[0.07]" preserveAspectRatio="none">
        {Array.from({ length: 60 }).map((_, i) => {
          const x = i * 28 + 12;
          const seed = (Math.sin(i * 1.7) + 1) / 2;
          const h = 40 + seed * 80;
          const y = 120 - seed * 60;
          const up = i % 3 !== 0;
          return (
            <g key={i} stroke="white" strokeWidth="1" fill="none">
              <line x1={x} y1={y - 14} x2={x} y2={y + h + 14} />
              <rect x={x - 6} y={y} width="12" height={h} fill={up ? "white" : "transparent"} fillOpacity={up ? 0.25 : 0} />
            </g>
          );
        })}
      </svg>

      {/* floating particles + glowing dots */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white/60 animate-float-y"
          style={{
            left: `${(i * 73) % 100}%`,
            top: `${(i * 47) % 100}%`,
            animationDelay: `${(i % 6) * 1.5}s`,
            animationDuration: `${10 + (i % 5) * 2}s`,
          }}
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`d-${i}`}
          className="absolute h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot"
          style={{
            left: `${10 + i * 15}%`,
            top: `${20 + ((i * 23) % 60)}%`,
            animationDelay: `${i * 0.8}s`,
            boxShadow: "0 0 12px rgba(255,255,255,0.6)",
          }}
        />
      ))}

      {/* faint market numbers */}
      <div className="absolute inset-0 select-none font-mono text-[10px] text-white/[0.04]">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: `${(i * 13) % 95}%`, top: `${(i * 29) % 95}%` }}
          >
            {(18000 + i * 137).toLocaleString()}.{(i * 7) % 100}
          </span>
        ))}
      </div>

      {/* investing thought */}
      <div className="absolute inset-x-0 bottom-24 flex justify-center">
        {showThought && (
          <p
            key={thoughtIdx}
            className="font-display text-3xl md:text-5xl text-white animate-thought"
            style={{ opacity: 0.05 }}
          >
            {THOUGHTS[thoughtIdx]}
          </p>
        )}
      </div>
    </div>
  );
}
