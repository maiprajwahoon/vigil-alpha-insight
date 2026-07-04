import { Bell, Search, SunMoon, User, Loader2, TrendingUp, History, Star, ArrowRight, X, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useSearchStocks } from "@/hooks/use-scanner";
import { getWatchlist } from "@/lib/watchlist";
import { useAuth } from "@/hooks/use-auth";

export function TopBar() {
  const { user, signOut } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Click outside to close user dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const router = useRouter();

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(rawQuery);
    }, 180);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  // Fetch search results (or trending stocks if query is empty)
  const { data: results, isLoading } = useSearchStocks(debouncedQuery, isOpen);

  // Reset active item when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Load Watchlist & Recently Viewed
  useEffect(() => {
    if (isOpen) {
      setWatchlist(getWatchlist());
      try {
        const saved = localStorage.getItem("recently_viewed");
        if (saved) setRecentlyViewed(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  // Keyboard Shortcuts (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync focus to modal input when it opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (ticker: string) => {
    // Save to recently viewed
    try {
      const saved = localStorage.getItem("recently_viewed");
      const parsed = saved ? JSON.parse(saved) : [];
      const next = [ticker, ...parsed.filter((t: string) => t !== ticker)].slice(0, 6);
      localStorage.setItem("recently_viewed", JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }

    const currentSearch = router.state.location.search;
    setRawQuery("");
    setIsOpen(false);
    navigate({ to: "/stock/$ticker", params: { ticker }, search: currentSearch });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex].ticker);
      } else if (results.length > 0) {
        handleSelect(results[0].ticker);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/70 px-6 backdrop-blur-xl">
        {/* Static Header Search Button Trigger */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex flex-1 max-w-xl items-center gap-2 rounded-xl border border-border bg-card/45 px-3 py-2 text-left text-sm text-muted-foreground/80 hover:bg-white/[0.04] transition group outline-none"
        >
          <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground/80 transition" strokeWidth={1.6} />
          <span>Search Indian stocks (e.g. RELIANCE, TCS)…</span>
        </button>

        <div className="flex items-center gap-1.5 ml-auto">


          <div ref={dropdownRef} className="relative ml-2">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="grid h-9 w-9 place-items-center rounded-full bg-card border border-border hover:bg-white/[0.04] transition cursor-pointer"
            >
              <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#161616] p-1.5 shadow-xl z-50">
                <div className="px-2.5 py-2 text-[11px] font-medium text-foreground/80 truncate">
                  {user?.email || "Investor Account"}
                </div>
                <div className="my-1 border-t border-white/5" />
                <button
                  onClick={async () => {
                    setShowUserDropdown(false);
                    await signOut();
                  }}
                  className="w-full inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Spotlight Command Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-10 md:p-20 overflow-y-auto">
          {/* Click outside backdrop close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <div
            onKeyDown={handleKeyDown}
            className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111111] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-3 border-b border-border bg-[#181818] px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                ref={modalInputRef}
                type="text"
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder="Type to search all listed Indian equities..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/80 outline-none"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Results / Sections Panel */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
              {isLoading && (
                <div className="flex items-center justify-center gap-2.5 py-12 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-bull" />
                  Resolving quotes from Indian exchanges...
                </div>
              )}

              {/* Show default items (recently viewed, watchlist, trending) when rawQuery is empty */}
              {!isLoading && rawQuery.trim().length === 0 && (
                <>
                  {/* Recently Viewed */}
                  {recentlyViewed.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        <History className="h-3 w-3" /> Recently Viewed
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-3">
                        {recentlyViewed.map((ticker) => (
                          <button
                            key={ticker}
                            onClick={() => handleSelect(ticker)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-foreground/90 hover:border-white/15 hover:bg-white/[0.04] transition font-mono"
                          >
                            {ticker}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Watchlist Favorites */}
                  {watchlist.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        <Star className="h-3 w-3 text-bull fill-bull" /> Favorites / Watchlist
                      </div>
                      <div className="grid gap-1">
                        {watchlist.map((ticker) => (
                          <button
                            key={ticker}
                            onClick={() => handleSelect(ticker)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-white/[0.03] transition text-xs"
                          >
                            <span className="font-mono font-bold text-foreground">{ticker}</span>
                            <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                              View details <ArrowRight className="h-3 w-3" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Stocks */}
                  {results && results.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        <TrendingUp className="h-3 w-3 text-bull" /> Trending / Active Stocks
                      </div>
                      <div className="grid gap-1">
                        {results.map((r, index) => {
                          const isActive = index === activeIndex;
                          return (
                            <SearchSuggestionRow
                              key={r.ticker}
                              item={r}
                              active={isActive}
                              onClick={() => handleSelect(r.ticker)}
                              query={rawQuery}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Show matching results when query is active */}
              {!isLoading && rawQuery.trim().length > 0 && (
                <div>
                  <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Matching Equities
                  </div>
                  {results && results.length > 0 ? (
                    <div className="grid gap-1">
                      {results.map((r, index) => {
                        const isActive = index === activeIndex;
                        return (
                          <SearchSuggestionRow
                            key={r.ticker}
                            item={r}
                            active={isActive}
                            onClick={() => handleSelect(r.ticker)}
                            query={rawQuery}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-foreground px-4">
                      No Indian equities match "{rawQuery}". Try typing "TATA", "RELIANCE", or "INFY".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky footer helper */}
            <div className="border-t border-border bg-[#181818]/85 p-2 px-4 flex items-center justify-between text-[10px] text-muted-foreground select-none">
              <span>Use arrows <kbd>↑</kbd><kbd>↓</kbd> and <kbd>Enter</kbd> to navigate</span>
              <span>Press <kbd>Esc</kbd> to exit</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchSuggestionRow({
  item,
  active,
  onClick,
  query,
}: {
  item: any;
  active: boolean;
  onClick: () => void;
  query: string;
}) {
  const isBullish = item.changePct >= 0;

  // Generate HSL gradient logo background based on ticker name
  const getLogoGrad = (ticker: string) => {
    let hash = 0;
    for (let i = 0; i < ticker.length; i++) {
      hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `linear-gradient(135deg, hsl(${h}, 70%, 45%), hsl(${(h + 40) % 360}, 75%, 25%))`;
  };

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition ${
        active ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
      }`}
    >
      {/* 1. Initials Logo icon */}
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold text-white shadow-inner uppercase select-none"
        style={{ background: getLogoGrad(item.ticker) }}
      >
        {item.ticker.slice(0, 2)}
      </div>

      {/* 2. Symbol & Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            <HighlightText text={item.ticker} query={query} />
          </span>
          <span className="rounded bg-white/5 px-1 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/80 font-semibold border border-white/5">
            {item.exchange}
          </span>
          <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
            {item.sector}
          </span>
        </div>
        <div className="text-xs text-muted-foreground/85 truncate max-w-xs sm:max-w-md mt-0.5">
          <HighlightText text={item.company} query={query} />
        </div>
      </div>

      {/* 3. Sparkline */}
      <div className="shrink-0 hidden xs:block pr-2">
        <Sparkline data={item.sparkline} isBullish={isBullish} />
      </div>

      {/* 4. Live Quote Details */}
      <div className="text-right shrink-0">
        <div className="font-mono text-xs font-bold text-foreground">
          ₹{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`font-mono text-[10px] font-semibold mt-0.5 ${isBullish ? "text-bull" : "text-bear"}`}>
          {isBullish ? "+" : ""}
          {item.changePct.toFixed(2)}%
        </div>
      </div>
    </button>
  );
}

// Mini SVG Sparkline Component
function Sparkline({ data, isBullish }: { data: number[]; isBullish: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 52; // 52px width
      const y = 18 - ((val - min) / range) * 14; // 14px range height, 2px padding top/bottom
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="h-5 w-14 overflow-visible" strokeWidth={1.3} fill="none">
      <polyline points={points} stroke={isBullish ? "#00c076" : "#ff333a"} />
    </svg>
  );
}

// Matching Text Highlight Component
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <span>{text}</span>;
  
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <strong key={i} className="text-bull font-extrabold bg-bull/5 px-0.5 rounded border border-bull/10">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
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
