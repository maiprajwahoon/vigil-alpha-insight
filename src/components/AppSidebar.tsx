import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScanLine,
  LineChart,
  Star,
  Bell,
  Compass,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "@/lib/motion-shim";
import { useMarketOverview } from "@/hooks/use-scanner";
import { useRealtimePrice } from "@/hooks/use-realtime-price";

const items = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Scanner", to: "/scanner", icon: ScanLine },
  { label: "Market", to: "/market", icon: LineChart },
  { label: "Watchlist", to: "/watchlist", icon: Star },
  { label: "Alerts", to: "/alerts", icon: Bell },
  { label: "Stock Explorer", to: "/explorer", icon: Compass },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: market } = useMarketOverview();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredRect, setHoveredRect] = useState<{ top: number; height: number } | null>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const niftyData = market?.indices?.find((i) => i.name === "NIFTY 50") || { value: 24300, changePct: 0.5 };
  const { price, changePct, direction } = useRealtimePrice("^NSEI", niftyData.value, niftyData.changePct);
  
  const flashClass =
    direction === "up"
      ? "animate-flash-up text-bull"
      : direction === "down"
        ? "animate-flash-down text-bear"
        : "";

  return (
    <aside
      className={`hidden md:flex shrink-0 flex-col border-r border-border bg-[#181818]/60 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between px-4 pt-6 pb-8 overflow-hidden min-h-[56px] relative">
        <div
          className="flex items-center gap-2.5 min-w-0 transition-all duration-300 ease-in-out origin-left"
          style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? "0px" : "150px",
            transform: collapsed ? "scale(0.8) translateX(-10px)" : "scale(1) translateX(0)",
            pointerEvents: collapsed ? "none" : "auto",
          }}
        >
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.jpg"
              alt="LynchMark"
              className="h-8 w-8 rounded-lg object-cover shrink-0 select-none"
            />
            <span className="font-display text-xl tracking-tight text-foreground/95 truncate">LynchMark</span>
          </Link>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all duration-300 shrink-0"
          style={{
            transform: collapsed ? "translateX(-1px)" : "translateX(0)",
          }}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav
        className="flex-1 px-3 space-y-0.5 relative"
        onMouseLeave={() => {
          setHoveredRect(null);
          setHoveredPath(null);
        }}
      >
        {/* Animated gliding hover pill background */}
        <div
          className="absolute left-3 right-3 rounded-xl bg-white/[0.03] border border-white/5 pointer-events-none transition-all"
          style={{
            height: hoveredRect ? `${hoveredRect.height}px` : "40px",
            transform: hoveredRect ? `translateY(${hoveredRect.top}px) scale(1)` : "translateY(0px) scale(0.95)",
            opacity: hoveredRect ? 1 : 0,
            transitionProperty: "transform, opacity",
            transitionDuration: hoveredRect ? "300ms" : "200ms",
            transitionTimingFunction: hoveredRect ? "cubic-bezier(0.16, 1, 0.3, 1)" : "cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        />

        {items.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          const isHovered = hoveredPath === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              title={collapsed ? it.label : undefined}
              onMouseEnter={(e) => {
                const target = e.currentTarget;
                const parent = target.parentElement;
                if (parent) {
                  const targetRect = target.getBoundingClientRect();
                  const parentRect = parent.getBoundingClientRect();
                  setHoveredRect({
                    top: targetRect.top - parentRect.top,
                    height: targetRect.height,
                  });
                  setHoveredPath(it.to);
                }
              }}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-white/[0.06] ring-1 ring-white/10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                className={`relative h-4 w-4 shrink-0 transition-all duration-300 ${
                  active || isHovered
                    ? "text-foreground scale-105 translate-x-0.5"
                    : "text-muted-foreground"
                }`}
                strokeWidth={1.6}
              />
              {!collapsed && (
                <span
                  className={`relative truncate transition-colors duration-300 ${
                    active || isHovered ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {it.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Market widget at bottom */}
      {!collapsed ? (
        <div className="m-4 rounded-2xl border border-border bg-card/50 p-4 transition-all duration-300">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold">Market</div>
          <div className="mt-1 flex items-baseline justify-between select-none">
            <div className="font-display text-lg">NIFTY 50</div>
            <div className={`text-xs font-bold ${changePct >= 0 ? "text-bull" : "text-bear"}`}>
              {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
            </div>
          </div>
          <div className={`mt-1 text-xs font-mono font-bold ${flashClass}`}>
            {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      ) : (
        <div className="m-2 py-3 rounded-xl border border-border bg-card/50 flex flex-col items-center gap-1.5 transition-all duration-300">
          <span className={`h-2 w-2 rounded-full ${changePct >= 0 ? "bg-bull" : "bg-bear"} animate-pulse-subtle`} />
          <span className="text-[9px] font-bold font-mono tracking-tight">{changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}%</span>
        </div>
      )}
    </aside>
  );
}
