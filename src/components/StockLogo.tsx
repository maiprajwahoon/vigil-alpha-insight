import React, { useState } from "react";

interface StockLogoProps {
  ticker: string;
  className?: string;
  size?: number; // e.g. 32
}

export function StockLogo({ ticker, className = "", size = 32 }: StockLogoProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Clean ticker symbol (strip exchange suffixes)
  const baseTicker = ticker.replace(/\.NS$|\.BO$/i, "").toUpperCase();
  const logoUrl = `https://images.financialmodelingprep.com/symbol/${baseTicker}.png`;

  // Get initials fallback (e.g. RELIANCE -> RE, TCS -> TC)
  const getInitials = () => {
    return baseTicker.slice(0, 2);
  };

  // Generate HSL color based on ticker name for consistent avatar background
  const getHslColor = () => {
    let hash = 0;
    for (let i = 0; i < baseTicker.length; i++) {
      hash = baseTicker.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 60%, 25%)`;
  };

  if (error || !baseTicker) {
    return (
      <div
        className={`${className} flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-inner uppercase select-none`}
        style={{
          background: `linear-gradient(135deg, ${getHslColor()}, rgba(0,0,0,0.4))`,
          width: size,
          height: size,
        }}
      >
        {getInitials()}
      </div>
    );
  }

  return (
    <div 
      className={`${className} bg-white flex items-center justify-center overflow-hidden shrink-0 select-none border border-white/10 relative`}
      style={{ width: size, height: size }}
    >
      {/* Skeleton / Placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}
      <img
        src={logoUrl}
        alt={`${baseTicker} Logo`}
        className={`object-contain p-1 transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: size, height: size }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
