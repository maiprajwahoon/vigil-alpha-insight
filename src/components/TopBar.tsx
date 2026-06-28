import { Bell, Search, SunMoon, User } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/70 px-6 backdrop-blur-xl">
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.6} />
        <input
          type="text"
          placeholder="Search a company, ticker, or screener…"
          className="h-10 w-full rounded-xl border border-border bg-card/60 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground/80 outline-none transition focus:border-white/20 focus:bg-card"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-1.5">
        <IconBtn aria-label="Theme"><SunMoon className="h-4 w-4" strokeWidth={1.6} /></IconBtn>
        <IconBtn aria-label="Notifications">
          <Bell className="h-4 w-4" strokeWidth={1.6} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-bull" />
        </IconBtn>
        <div className="ml-2 grid h-9 w-9 place-items-center rounded-full bg-card border border-border">
          <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
        </div>
      </div>
    </header>
  );
}

function IconBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className="relative grid h-9 w-9 place-items-center rounded-xl border border-transparent text-muted-foreground transition hover:text-foreground hover:bg-white/[0.04] hover:border-border"
    >
      {children}
    </button>
  );
}
