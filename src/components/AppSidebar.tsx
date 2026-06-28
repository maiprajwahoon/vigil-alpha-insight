import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScanLine,
  LineChart,
  Star,
  Briefcase,
  Bell,
  Compass,
  Settings,
} from "lucide-react";
import { motion } from "motion/react";

const items = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Scanner", to: "/scanner", icon: ScanLine },
  { label: "Market", to: "/market", icon: LineChart },
  { label: "Watchlist", to: "/watchlist", icon: Star },
  { label: "Portfolio", to: "/portfolio", icon: Briefcase },
  { label: "Alerts", to: "/alerts", icon: Bell },
  { label: "Stock Explorer", to: "/explorer", icon: Compass },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar/60 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2.5 px-6 pt-6 pb-8">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-background">
          <span className="font-display text-lg leading-none">L</span>
        </div>
        <div className="font-display text-xl tracking-tight">LynchMark</div>
      </Link>

      <nav className="flex-1 px-3 space-y-0.5">
        {items.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-white/[0.06] ring-1 ring-white/10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="relative h-4 w-4 shrink-0" strokeWidth={1.6} />
              <span className="relative">{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-4 rounded-2xl border border-border bg-card/50 p-4">
        <div className="text-xs text-muted-foreground">Market</div>
        <div className="mt-1 flex items-baseline justify-between">
          <div className="font-display text-2xl">NIFTY</div>
          <div className="text-bull text-sm">+0.62%</div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">24,812.40</div>
      </div>
    </aside>
  );
}
