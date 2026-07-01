import { useState, useEffect, useRef, useMemo } from "react";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateSupertrend,
  Candle,
} from "@/lib/analysis/indicators";
import {
  Maximize2,
  Minimize2,
  TrendingUp,
  Download,
  Eye,
  PenTool,
  Settings,
  Grid,
  Info,
  ChevronDown,
  Trash2,
  Menu,
  Activity,
} from "lucide-react";

interface StockChartProps {
  data: {
    bars: Candle[];
    pivotPrice?: number;
  };
  ticker: string;
  onTimeframeChange?: (timeframe: string) => void;
  currentTimeframe?: string;
  rangeYears?: number;
  onRangeYearsChange?: (years: number) => void;
}

interface Drawing {
  type: string; // "trend", "horizontal", "rectangle", "fibonacci", "text"
  points: Array<{ index: number; price: number }>; // Anchor points in data coordinates
  text?: string;
  color: string;
  lineWidth: number;
}

export function StockChart({
  data,
  ticker,
  onTimeframeChange,
  currentTimeframe = "1d",
  rangeYears = 3,
  onRangeYearsChange,
}: StockChartProps) {
  const bars = data.bars;

  // Chart config states
  const [chartType, setChartType] = useState<"candle" | "hollow" | "heikin_ashi" | "line" | "area" | "bar">("candle");
  const [timeframe, setTimeframe] = useState(currentTimeframe);
  const [scaleType, setScaleType] = useState<"linear" | "log">("linear");
  const [isAutoScale, setIsAutoScale] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Active indicators overlays & panels
  const [overlays, setOverlays] = useState<Record<string, boolean>>({
    sma20: false,
    ema50: true,
    sma100: false,
    ema200: true,
    bollinger: false,
    supertrend: false,
  });
  const [oscillators, setOscillators] = useState<Record<string, boolean>>({
    volume: true,
    rsi: false,
    macd: false,
  });

  // Scaling / Panning / Zooming parameters
  const [candleWidth, setCandleWidth] = useState(8);
  const [scrollOffset, setScrollOffset] = useState(0); // offset in pixels from the start (oldest candles)
  const [manualPriceRange, setManualPriceRange] = useState<{ min: number; max: number } | null>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const [isScalingY, setIsScalingY] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scaleYStart, setScaleYStart] = useState({ y: 0, rangeMin: 0, rangeMax: 0 });

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [crosshairPos, setCrosshairPos] = useState({ x: 0, y: 0 });
  
  // Right-click context menu position
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Drawings state
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load/Save drawings
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`drawings_${ticker}`);
      if (saved) setDrawings(JSON.parse(saved));
      else setDrawings([]);
    } catch (e) {
      console.error(e);
    }
  }, [ticker]);

  const saveDrawings = (nextDrawings: Drawing[]) => {
    setDrawings(nextDrawings);
    try {
      localStorage.setItem(`drawings_${ticker}`, JSON.stringify(nextDrawings));
    } catch (e) {
      console.error(e);
    }
  };

  // Keep internal timeframe state synced
  useEffect(() => {
    if (currentTimeframe !== timeframe) {
      setTimeframe(currentTimeframe);
    }
  }, [currentTimeframe]);

  const handleTimeframeSelect = (tf: string) => {
    setTimeframe(tf);
    if (onTimeframeChange) onTimeframeChange(tf);
  };

  // Convert bars to Heikin Ashi if active
  const processedBars = useMemo(() => {
    if (chartType !== "heikin_ashi") return bars;
    const haBars: Candle[] = [];
    if (bars.length === 0) return haBars;

    let prevOpen = bars[0].open;
    let prevClose = bars[0].close;

    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      const haClose = (b.open + b.high + b.low + b.close) / 4;
      const haOpen = (prevOpen + prevClose) / 2;
      const haHigh = Math.max(b.high, haOpen, haClose);
      const haLow = Math.min(b.low, haOpen, haClose);

      haBars.push({
        date: b.date,
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
        volume: b.volume,
      });

      prevOpen = haOpen;
      prevClose = haClose;
    }
    return haBars;
  }, [bars, chartType]);

  // Calculate Indicator values dynamically
  const indicatorsData = useMemo(() => {
    if (bars.length === 0) return null;
    const closes = bars.map((b) => b.close);
    const highs = bars.map((b) => b.high);
    const lows = bars.map((b) => b.low);
    const volumes = bars.map((b) => b.volume);

    return {
      sma20: calculateSMA(closes, 20),
      ema50: calculateEMA(closes, 50),
      sma100: calculateSMA(closes, 100),
      ema200: calculateEMA(closes, 200),
      rsi: calculateRSI(closes, 14),
      macd: calculateMACD(closes),
      bollinger: calculateBollingerBands(closes, 20, 2),
      supertrend: calculateSupertrend(highs, lows, closes, 10, 3),
      volumeSma: calculateSMA(volumes, 20),
    };
  }, [bars]);

  // Scroll to the end (newest candles) on load
  const lastBarsLength = useRef(0);
  useEffect(() => {
    if (processedBars.length > 0 && processedBars.length !== lastBarsLength.current) {
      const prevLength = lastBarsLength.current;
      lastBarsLength.current = processedBars.length;
      
      const canvas = canvasRef.current;
      if (canvas) {
        const width = canvas.getBoundingClientRect().width;
        if (prevLength === 0) {
          // Initial scroll to the end
          const maxOffset = Math.max(0, processedBars.length * candleWidth - width + 60);
          setScrollOffset(maxOffset);
        } else if (processedBars.length > prevLength) {
          // Prepend correction (keep viewport focused when older bars load)
          const addedCount = processedBars.length - prevLength;
          setScrollOffset((prev) => prev + addedCount * candleWidth);
        }
      }
    }
  }, [processedBars, candleWidth]);

  // Infinite Loader: Fetch older history when scrolling to the left edge
  const isFetchingOlder = useRef(false);
  useEffect(() => {
    if (scrollOffset < 60 && processedBars.length > 0 && !isFetchingOlder.current) {
      if (onRangeYearsChange && rangeYears < 15) {
        isFetchingOlder.current = true;
        onRangeYearsChange(rangeYears + 3);
        // Reset fetch guard once bars length expands
        setTimeout(() => {
          isFetchingOlder.current = false;
        }, 1200);
      }
    }
  }, [scrollOffset, processedBars.length, rangeYears, onRangeYearsChange]);

  // Attach keyboard shortcuts (+, -, Arrow keys, Home, End)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setCandleWidth((w) => Math.min(40, w + 1));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setCandleWidth((w) => Math.max(2, w - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setScrollOffset((off) => Math.max(0, off - candleWidth * 3));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setScrollOffset((off) => off + candleWidth * 3);
      } else if (e.key === "Home") {
        e.preventDefault();
        setScrollOffset(0);
      } else if (e.key === "End") {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (canvas) {
          const width = canvas.getBoundingClientRect().width;
          setScrollOffset(Math.max(0, processedBars.length * candleWidth - width + 60));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [candleWidth, processedBars.length]);

  // Attach non-passive wheel zoom centered on mouse cursor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const nextWidth = Math.max(2, Math.min(40, candleWidth * zoomFactor));

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      
      const indexUnderMouse = Math.floor((mouseX + (scrollOffset % candleWidth) - candleWidth/2) / candleWidth) + Math.max(0, Math.floor(scrollOffset / candleWidth));
      const widthDiff = nextWidth - candleWidth;
      const nextOffset = Math.max(0, scrollOffset + indexUnderMouse * widthDiff);

      setCandleWidth(nextWidth);
      setScrollOffset(nextOffset);
    };

    canvas.addEventListener("wheel", handleWheelRaw, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheelRaw);
  }, [candleWidth, scrollOffset, processedBars.length]);

  // Draw loop for Main Chart & oscillators
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || processedBars.length === 0 || !indicatorsData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Layout configuration
    const rsiActive = oscillators.rsi;
    const macdActive = oscillators.macd;
    const activeOscillatorsCount = (rsiActive ? 1 : 0) + (macdActive ? 1 : 0);

    const mainPanelHeight = height - activeOscillatorsCount * 105 - 30; // 30px axis margin at bottom
    const rsiPanelTop = mainPanelHeight + 10;
    const macdPanelTop = rsiPanelTop + (rsiActive ? 105 : 0);

    // Viewport coordinates
    const maxVisibleCandles = Math.ceil(width / candleWidth);
    const clampedOffset = Math.max(0, scrollOffset);
    const startIdx = Math.max(0, Math.floor(clampedOffset / candleWidth));
    const endIdx = Math.min(processedBars.length, startIdx + maxVisibleCandles + 2);

    const visibleCandles = processedBars.slice(startIdx, endIdx);
    if (visibleCandles.length === 0) return;

    // Determine price range
    let minPrice = Math.min(...visibleCandles.map((b) => b.low));
    let maxPrice = Math.max(...visibleCandles.map((b) => b.high));

    // Pad range slightly
    const padding = (maxPrice - minPrice) * 0.05 || 10;
    minPrice -= padding;
    maxPrice += padding;

    // Override range if manual Y-scaling is active
    if (!isAutoScale && manualPriceRange) {
      minPrice = manualPriceRange.min;
      maxPrice = manualPriceRange.max;
    }

    // Coordinate conversions
    const priceToY = (price: number) => {
      if (scaleType === "log") {
        const logMin = Math.log(Math.max(0.1, minPrice));
        const logMax = Math.log(Math.max(0.1, maxPrice));
        const logPrice = Math.log(Math.max(0.1, price));
        return mainPanelHeight - 10 - ((logPrice - logMin) / (logMax - logMin)) * (mainPanelHeight - 30);
      }
      return mainPanelHeight - 10 - ((price - minPrice) / (maxPrice - minPrice)) * (mainPanelHeight - 30);
    };

    const yToPrice = (y: number) => {
      const pct = (mainPanelHeight - 10 - y) / (mainPanelHeight - 30);
      if (scaleType === "log") {
        const logMin = Math.log(Math.max(0.1, minPrice));
        const logMax = Math.log(Math.max(0.1, maxPrice));
        return Math.exp(logMin + pct * (logMax - logMin));
      }
      return minPrice + pct * (maxPrice - minPrice);
    };

    const indexToX = (idx: number) => {
      return (idx - startIdx) * candleWidth - (clampedOffset % candleWidth) + candleWidth / 2;
    };

    // Draw background
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, width, height);

    // Draw gridlines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;
    
    // Draw vertical grids
    const gridSpacing = 85;
    for (let x = gridSpacing; x < width - 65; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
    }

    // Draw horizontal grids
    const horizontalGridSpacing = 50;
    for (let y = horizontalGridSpacing; y < mainPanelHeight; y += horizontalGridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 65, y);
      ctx.stroke();
    }

    // Draw Bollinger Bands Shading
    if (overlays.bollinger && indicatorsData.bollinger) {
      ctx.fillStyle = "rgba(100, 150, 255, 0.03)";
      ctx.beginPath();
      let first = true;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.bollinger.upper[i])) continue;
        const x = indexToX(i);
        const y = priceToY(indicatorsData.bollinger.upper[i]);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else ctx.lineTo(x, y);
      }
      for (let i = Math.min(processedBars.length - 1, endIdx - 1); i >= startIdx; i--) {
        if (isNaN(indicatorsData.bollinger.lower[i])) continue;
        const x = indexToX(i);
        const y = priceToY(indicatorsData.bollinger.lower[i]);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(100, 150, 255, 0.3)";
      ctx.beginPath();
      first = true;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.bollinger.upper[i])) continue;
        const x = indexToX(i);
        const y = priceToY(indicatorsData.bollinger.upper[i]);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      first = true;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.bollinger.lower[i])) continue;
        const x = indexToX(i);
        const y = priceToY(indicatorsData.bollinger.lower[i]);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw Candlesticks / Price chart
    for (let i = startIdx; i < endIdx; i++) {
      if (i >= processedBars.length) break;
      const b = processedBars[i];
      const x = indexToX(i);
      const isBullish = b.close >= b.open;

      ctx.strokeStyle = b.close >= b.open ? "#00c076" : "#ff333a";
      ctx.fillStyle = b.close >= b.open ? "#00c076" : "#ff333a";
      ctx.lineWidth = Math.max(1, candleWidth * 0.1);

      if (chartType === "candle" || chartType === "heikin_ashi" || chartType === "hollow") {
        // Draw wick
        ctx.beginPath();
        ctx.moveTo(x, priceToY(b.high));
        ctx.lineTo(x, priceToY(b.low));
        ctx.stroke();

        // Draw body
        const yOpen = priceToY(b.open);
        const yClose = priceToY(b.close);
        const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
        const bodyY = Math.min(yOpen, yClose);
        const bodyW = Math.max(1.5, candleWidth - 2.2);

        if (chartType === "hollow" && isBullish) {
          ctx.strokeStyle = "#00c076";
          ctx.lineWidth = 1.3;
          ctx.strokeRect(x - bodyW / 2, bodyY, bodyW, bodyHeight);
        } else {
          ctx.fillRect(x - bodyW / 2, bodyY, bodyW, bodyHeight);
        }
      } else if (chartType === "bar") {
        ctx.beginPath();
        ctx.moveTo(x, priceToY(b.high));
        ctx.lineTo(x, priceToY(b.low));
        ctx.stroke();

        // Open tick
        ctx.beginPath();
        ctx.moveTo(x - candleWidth/2 + 0.5, priceToY(b.open));
        ctx.lineTo(x, priceToY(b.open));
        ctx.stroke();

        // Close tick
        ctx.beginPath();
        ctx.moveTo(x, priceToY(b.close));
        ctx.lineTo(x + candleWidth/2 - 0.5, priceToY(b.close));
        ctx.stroke();
      } else if (chartType === "line") {
        if (i > startIdx) {
          const prevX = indexToX(i - 1);
          const prevY = priceToY(processedBars[i - 1].close);
          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, priceToY(b.close));
          ctx.stroke();
        }
      } else if (chartType === "area") {
        if (i > startIdx) {
          const prevX = indexToX(i - 1);
          const prevY = priceToY(processedBars[i - 1].close);
          
          // Fill gradient area
          const grad = ctx.createLinearGradient(0, priceToY(maxPrice), 0, mainPanelHeight);
          grad.addColorStop(0, "rgba(37, 99, 235, 0.25)");
          grad.addColorStop(1, "rgba(37, 99, 235, 0.0)");
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, priceToY(b.close));
          ctx.lineTo(x, mainPanelHeight);
          ctx.lineTo(prevX, mainPanelHeight);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, priceToY(b.close));
          ctx.stroke();
        }
      }
    }

    // Draw SMAs (DMA options)
    if (overlays.sma20 && indicatorsData.sma20) {
      ctx.strokeStyle = "#3b82f6"; // blue
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      let active = false;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.sma20[i])) continue;
        const x = indexToX(i);
        const y = priceToY(indicatorsData.sma20[i]);
        if (!active) {
          ctx.moveTo(x, y);
          active = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (overlays.sma100 && indicatorsData.sma100) {
      ctx.strokeStyle = "#10b981"; // green / emerald
      ctx.lineWidth = 1.45;
      ctx.beginPath();
      let active = false;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.sma100[i])) continue;
        const x = indexToX(i);
        const y = priceToY(indicatorsData.sma100[i]);
        if (!active) {
          ctx.moveTo(x, y);
          active = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw EMAs
    if (overlays.ema50 && indicatorsData.ema50) {
      ctx.strokeStyle = "#eab308"; // yellow
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      let active = false;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.ema50[i])) continue;
        const x = indexToX(i);
        const y = priceToY(indicatorsData.ema50[i]);
        if (!active) {
          ctx.moveTo(x, y);
          active = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (overlays.ema200 && indicatorsData.ema200) {
      ctx.strokeStyle = "#ec4899"; // pink
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      let active = false;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.ema200[i])) continue;
        const x = indexToX(i);
        const y = priceToY(indicatorsData.ema200[i]);
        if (!active) {
          ctx.moveTo(x, y);
          active = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw Supertrend
    if (overlays.supertrend && indicatorsData.supertrend) {
      ctx.lineWidth = 1.5;
      for (let i = startIdx + 1; i < endIdx; i++) {
        if (i >= processedBars.length) break;
        const prevTrend = indicatorsData.supertrend.trend[i - 1];
        const currTrend = indicatorsData.supertrend.trend[i];
        
        if (prevTrend === currTrend) {
          ctx.strokeStyle = currTrend === 1 ? "#00c076" : "#ff333a";
          ctx.beginPath();
          ctx.moveTo(indexToX(i - 1), priceToY(indicatorsData.supertrend.value[i - 1]));
          ctx.lineTo(indexToX(i), priceToY(indicatorsData.supertrend.value[i]));
          ctx.stroke();
        }
      }
    }

    // Dedicated Volume panel at the bottom (if volume active and oscillators are turned off)
    if (oscillators.volume) {
      const volMax = Math.max(...visibleCandles.map((c) => c.volume)) || 1;
      ctx.save();
      
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length) break;
        const b = processedBars[i];
        const x = indexToX(i);
        const isUp = b.close >= b.open;
        const volH = (b.volume / volMax) * (mainPanelHeight * 0.16);

        ctx.fillStyle = isUp ? "rgba(0, 192, 118, 0.18)" : "rgba(255, 51, 58, 0.18)";
        ctx.fillRect(x - (candleWidth - 2) / 2, mainPanelHeight - volH, candleWidth - 2, volH);

        ctx.strokeStyle = isUp ? "rgba(0, 192, 118, 0.45)" : "rgba(255, 51, 58, 0.45)";
        ctx.lineWidth = 0.6;
        ctx.strokeRect(x - (candleWidth - 2) / 2, mainPanelHeight - volH, candleWidth - 2, volH);
      }

      // Draw 20-period Volume SMA
      if (indicatorsData.volumeSma) {
        ctx.strokeStyle = "rgba(100, 200, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        let first = true;
        for (let i = startIdx; i < endIdx; i++) {
          if (i >= processedBars.length || isNaN(indicatorsData.volumeSma[i])) continue;
          const x = indexToX(i);
          const smaH = (indicatorsData.volumeSma[i] / volMax) * (mainPanelHeight * 0.16);
          const y = mainPanelHeight - smaH;
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Draw Drawings
    const allDrawings = currentDrawing ? [...drawings, currentDrawing] : drawings;
    for (const d of allDrawings) {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.lineWidth;
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";

      if (d.type === "trend" && d.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(indexToX(d.points[0].index), priceToY(d.points[0].price));
        ctx.lineTo(indexToX(d.points[1].index), priceToY(d.points[1].price));
        ctx.stroke();
      } else if (d.type === "horizontal" && d.points.length >= 1) {
        ctx.beginPath();
        ctx.moveTo(0, priceToY(d.points[0].price));
        ctx.lineTo(width - 65, priceToY(d.points[0].price));
        ctx.stroke();
      } else if (d.type === "rectangle" && d.points.length >= 2) {
        const x1 = indexToX(d.points[0].index);
        const y1 = priceToY(d.points[0].price);
        const x2 = indexToX(d.points[1].index);
        const y2 = priceToY(d.points[1].price);
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      } else if (d.type === "fibonacci" && d.points.length >= 2) {
        const x1 = indexToX(d.points[0].index);
        const y1 = priceToY(d.points[0].price);
        const x2 = indexToX(d.points[1].index);
        const y2 = priceToY(d.points[1].price);

        const p1 = d.points[0].price;
        const p2 = d.points[1].price;
        const diff = p2 - p1;

        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        ctx.lineWidth = 1;
        for (const lvl of levels) {
          const lvlPrice = p2 - diff * lvl;
          const lvlY = priceToY(lvlPrice);
          ctx.strokeStyle = lvl === 0.5 ? "rgba(255, 100, 100, 0.5)" : "rgba(255, 255, 255, 0.25)";
          
          ctx.beginPath();
          ctx.moveTo(x1, lvlY);
          ctx.lineTo(x2, lvlY);
          ctx.stroke();

          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.font = "9px monospace";
          ctx.fillText(`Fib ${lvl} (₹${lvlPrice.toFixed(1)})`, x1 + 5, lvlY - 3);
        }
      } else if (d.type === "text" && d.points.length >= 1 && d.text) {
        ctx.fillStyle = d.color;
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText(d.text, indexToX(d.points[0].index) + 5, priceToY(d.points[0].price) - 5);
      }
    }

    // 7. Draw RSI Oscillator Panel
    if (rsiActive && indicatorsData.rsi) {
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, rsiPanelTop, width, 95);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeRect(0, rsiPanelTop, width - 65, 95);

      const rsi70Y = rsiPanelTop + 95 - (70 / 100) * 95;
      const rsi30Y = rsiPanelTop + 95 - (30 / 100) * 95;

      ctx.strokeStyle = "rgba(100, 100, 255, 0.15)";
      ctx.beginPath();
      ctx.moveTo(0, rsi70Y); ctx.lineTo(width - 65, rsi70Y);
      ctx.moveTo(0, rsi30Y); ctx.lineTo(width - 65, rsi30Y);
      ctx.stroke();

      ctx.fillStyle = "rgba(100, 100, 255, 0.015)";
      ctx.fillRect(0, rsi70Y, width - 65, rsi30Y - rsi70Y);

      // RSI line
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      let active = false;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.rsi[i])) continue;
        const x = indexToX(i);
        const y = rsiPanelTop + 95 - (indicatorsData.rsi[i] / 100) * 95;
        if (!active) {
          ctx.moveTo(x, y);
          active = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "9px monospace";
      ctx.fillText("70", width - 58, rsi70Y + 3);
      ctx.fillText("30", width - 58, rsi30Y + 3);
      ctx.fillText("RSI (14)", 5, rsiPanelTop + 12);
    }

    // 8. Draw MACD Panel
    if (macdActive && indicatorsData.macd) {
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, macdPanelTop, width, 95);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeRect(0, macdPanelTop, width - 65, 95);

      const visibleMacd = indicatorsData.macd.macd.slice(startIdx, endIdx);
      const visibleSig = indicatorsData.macd.signal.slice(startIdx, endIdx);
      const visibleHist = indicatorsData.macd.histogram.slice(startIdx, endIdx);
      const mMax = Math.max(...visibleMacd, ...visibleSig, ...visibleHist) || 1;
      const mMin = Math.min(...visibleMacd, ...visibleSig, ...visibleHist) || -1;

      const macdToY = (val: number) => {
        return macdPanelTop + 95/2 - (val / (Math.max(Math.abs(mMax), Math.abs(mMin)) || 1)) * 40;
      };

      // Zero line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.moveTo(0, macdToY(0));
      ctx.lineTo(width - 65, macdToY(0));
      ctx.stroke();

      // Histogram
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.macd.histogram[i])) continue;
        const x = indexToX(i);
        const val = indicatorsData.macd.histogram[i];
        const y0 = macdToY(0);
        const y1 = macdToY(val);
        ctx.fillStyle = val >= 0 ? "rgba(0, 192, 118, 0.45)" : "rgba(255, 51, 58, 0.45)";
        ctx.fillRect(x - 2, Math.min(y0, y1), 4, Math.abs(y1 - y0));
      }

      // MACD Line
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let first = true;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.macd.macd[i])) continue;
        const x = indexToX(i);
        const y = macdToY(indicatorsData.macd.macd[i]);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Signal Line
      ctx.strokeStyle = "#f97316";
      ctx.beginPath();
      first = true;
      for (let i = startIdx; i < endIdx; i++) {
        if (i >= processedBars.length || isNaN(indicatorsData.macd.signal[i])) continue;
        const x = indexToX(i);
        const y = macdToY(indicatorsData.macd.signal[i]);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "9px monospace";
      ctx.fillText("MACD (12, 26, 9)", 5, macdPanelTop + 12);
    }

    // Axis Borders
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(width - 65, 0); ctx.lineTo(width - 65, height - 30);
    ctx.moveTo(0, height - 30); ctx.lineTo(width, height - 30);
    ctx.stroke();

    // Right Y-Axis Price Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";

    const priceLabelsCount = 6;
    for (let i = 0; i <= priceLabelsCount; i++) {
      const pct = i / priceLabelsCount;
      const yVal = 20 + pct * (mainPanelHeight - 40);
      const priceVal = yToPrice(yVal);
      ctx.fillText(`₹${priceVal.toFixed(1)}`, width - 58, yVal + 3);
    }

    // Bottom X-Axis Date Labels
    ctx.textAlign = "center";
    const dateLabelsCount = 5;
    const dateInterval = Math.floor(visibleCandles.length / dateLabelsCount) || 1;

    for (let i = 0; i < visibleCandles.length; i += dateInterval) {
      const idx = startIdx + i;
      if (idx >= processedBars.length) break;
      const b = processedBars[idx];
      const x = indexToX(idx);
      
      let label = b.date;
      if (label.includes("T")) {
        label = label.split("T")[1].substring(0, 5);
      } else {
        const dateObj = new Date(b.date);
        label = dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      }
      ctx.fillText(label, x, height - 12);
    }

    // Hover, Crosshairs & Legend Info overlay
    if (hoverIndex !== null && hoverIndex >= startIdx && hoverIndex < endIdx && hoverIndex < processedBars.length) {
      const hoveredCandle = processedBars[hoverIndex];
      const x = indexToX(hoverIndex);
      const y = crosshairPos.y;

      // Draw crosshairs
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 0.95;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, height - 30);
      ctx.stroke();

      if (y < mainPanelHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(width - 65, y);
        ctx.stroke();
      }
      ctx.setLineDash([]); // reset

      // Coordinate Labels Badges
      // X-Axis Badge
      ctx.fillStyle = "#2a2e39";
      ctx.fillRect(x - 42, height - 30, 84, 18);
      ctx.fillStyle = "#ffffff";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(hoveredCandle.date, x, height - 18);

      // Y-Axis Badge
      if (y < mainPanelHeight) {
        const priceAtCrosshair = yToPrice(y);
        ctx.fillStyle = "#2a2e39";
        ctx.fillRect(width - 65, y - 8, 65, 17);
        ctx.fillStyle = "#ffffff";
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`₹${priceAtCrosshair.toFixed(1)}`, width - 58, y + 4);
      }

      // Legend Info
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${ticker} (${timeframe.toUpperCase()})`, 10, 20);

      const isBull = hoveredCandle.close >= hoveredCandle.open;
      const chgVal = hoveredCandle.close - hoveredCandle.open;
      const chgPct = (chgVal / hoveredCandle.open) * 100;
      
      const details = [
        `O:${hoveredCandle.open.toFixed(1)}`,
        `H:${hoveredCandle.high.toFixed(1)}`,
        `L:${hoveredCandle.low.toFixed(1)}`,
        `C:${hoveredCandle.close.toFixed(1)}`,
        `Chg:${chgVal >= 0 ? "+" : ""}${chgVal.toFixed(1)} (${chgVal >= 0 ? "+" : ""}${chgPct.toFixed(2)}%)`,
        `Vol:${(hoveredCandle.volume / 1000000).toFixed(2)}M`,
      ];
      ctx.fillStyle = isBull ? "#00c076" : "#ff333a";
      ctx.fillText(details.join("   "), 10, 36);
    }
  }, [
    processedBars,
    indicatorsData,
    candleWidth,
    scrollOffset,
    chartType,
    scaleType,
    isAutoScale,
    manualPriceRange,
    overlays,
    oscillators,
    drawings,
    currentDrawing,
    hoverIndex,
    crosshairPos,
    timeframe,
    ticker,
  ]);

  // Draw loop for Bottom Navigator canvas
  useEffect(() => {
    const navCanvas = navCanvasRef.current;
    if (!navCanvas || processedBars.length === 0) return;

    const ctx = navCanvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = navCanvas.getBoundingClientRect();
    navCanvas.width = rect.width * dpr;
    navCanvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, w, h);

    const closes = processedBars.map((b) => b.close);
    const minC = Math.min(...closes);
    const maxC = Math.max(...closes);
    const rC = maxC - minC || 1;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < processedBars.length; i++) {
      const x = (i / (processedBars.length - 1)) * w;
      const y = h - 4 - ((closes[i] - minC) / rC) * (h - 8);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const canvas = canvasRef.current;
    if (canvas) {
      const viewW = canvas.getBoundingClientRect().width;
      const maxVisibleCandles = Math.ceil(viewW / candleWidth);
      const clampedOffset = Math.max(0, scrollOffset);
      const startIdx = Math.max(0, Math.floor(clampedOffset / candleWidth));
      const endIdx = Math.min(processedBars.length, startIdx + maxVisibleCandles);

      const x1 = (startIdx / processedBars.length) * w;
      const x2 = (endIdx / processedBars.length) * w;

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, x1, h);
      ctx.fillRect(x2, 0, w - x2, h);

      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.8;
      ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
      ctx.fillRect(x1, 0, x2 - x1, h);
      ctx.strokeRect(x1, 0, x2 - x1, h);
    }
  }, [processedBars, scrollOffset, candleWidth]);

  // Main Canvas Click & Drag Handling (Panning & Price Scaling)
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || processedBars.length === 0) return;

    setContextMenu(null);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const mainPanelHeight = rect.height - ((oscillators.rsi ? 1 : 0) + (oscillators.macd ? 1 : 0)) * 105 - 30;

    const maxVisibleCandles = Math.ceil(rect.width / candleWidth);
    const clampedOffset = Math.max(0, scrollOffset);
    const startIdx = Math.max(0, Math.floor(clampedOffset / candleWidth));
    const index = Math.min(processedBars.length - 1, Math.max(0, Math.round((x + (clampedOffset % candleWidth) - candleWidth/2) / candleWidth) + startIdx));

    let minPrice = Math.min(...processedBars.slice(startIdx, startIdx + maxVisibleCandles).map((b) => b.low));
    let maxPrice = Math.max(...processedBars.slice(startIdx, startIdx + maxVisibleCandles).map((b) => b.high));
    const padding = (maxPrice - minPrice) * 0.05 || 10;
    minPrice -= padding;
    maxPrice += padding;

    if (!isAutoScale && manualPriceRange) {
      minPrice = manualPriceRange.min;
      maxPrice = manualPriceRange.max;
    }

    const pct = (mainPanelHeight - 10 - y) / (mainPanelHeight - 30);
    const price = minPrice + pct * (maxPrice - minPrice);

    if (x > rect.width - 65 && y < mainPanelHeight) {
      setIsScalingY(true);
      setScaleYStart({
        y: e.clientY,
        rangeMin: minPrice,
        rangeMax: maxPrice,
      });
      return;
    }

    if (activeTool && activeTool !== "eraser") {
      if (activeTool === "text") {
        const text = prompt("Enter label text for chart:");
        if (text) {
          saveDrawings([
            ...drawings,
            {
              type: "text",
              points: [{ index, price }],
              text,
              color: "#ffffff",
              lineWidth: 1,
            },
          ]);
        }
        setActiveTool(null);
      } else {
        setCurrentDrawing({
          type: activeTool,
          points: [{ index, price }],
          color: "#3b82f6",
          lineWidth: 1.5,
        });
      }
    } else if (activeTool === "eraser") {
      const nextDrawings = drawings.filter((d) => {
        if (d.points.length === 0) return true;
        const dist = Math.abs(d.points[0].index - index) + Math.abs((d.points[0].price - price) / price * 100);
        return dist > 5;
      });
      saveDrawings(nextDrawings);
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || processedBars.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCrosshairPos({ x, y });

    const mainPanelHeight = rect.height - ((oscillators.rsi ? 1 : 0) + (oscillators.macd ? 1 : 0)) * 105 - 30;

    const maxVisibleCandles = Math.ceil(rect.width / candleWidth);
    const clampedOffset = Math.max(0, scrollOffset);
    const startIdx = Math.max(0, Math.floor(clampedOffset / candleWidth));
    const index = Math.min(processedBars.length - 1, Math.max(0, Math.round((x + (clampedOffset % candleWidth) - candleWidth/2) / candleWidth) + startIdx));

    setHoverIndex(index);

    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const nextOffset = Math.max(0, scrollOffset - dx);
      setScrollOffset(nextOffset);

      if (!isAutoScale && manualPriceRange) {
        const dy = e.clientY - panStart.y;
        const pricePerPixel = (manualPriceRange.max - manualPriceRange.min) / mainPanelHeight;
        const dPrice = dy * pricePerPixel;
        setManualPriceRange({
          min: manualPriceRange.min + dPrice,
          max: manualPriceRange.max + dPrice,
        });
      }

      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (isScalingY) {
      const dy = e.clientY - scaleYStart.y;
      const scaleFactor = 1 + dy * 0.005;
      const rangeCenter = (scaleYStart.rangeMax + scaleYStart.rangeMin) / 2;
      const halfRange = ((scaleYStart.rangeMax - scaleYStart.rangeMin) / 2) * scaleFactor;
      
      setIsAutoScale(false);
      setManualPriceRange({
        min: rangeCenter - halfRange,
        max: rangeCenter + halfRange,
      });
    } else if (currentDrawing) {
      let minPrice = Math.min(...processedBars.slice(startIdx, startIdx + maxVisibleCandles).map((b) => b.low));
      let maxPrice = Math.max(...processedBars.slice(startIdx, startIdx + maxVisibleCandles).map((b) => b.high));
      const padding = (maxPrice - minPrice) * 0.05 || 10;
      minPrice -= padding;
      maxPrice += padding;

      if (!isAutoScale && manualPriceRange) {
        minPrice = manualPriceRange.min;
        maxPrice = manualPriceRange.max;
      }

      const pct = (mainPanelHeight - 10 - y) / (mainPanelHeight - 30);
      const price = minPrice + pct * (maxPrice - minPrice);

      setCurrentDrawing((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [prev.points[0], { index, price }],
        };
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsScalingY(false);

    if (currentDrawing) {
      saveDrawings([...drawings, currentDrawing]);
      setCurrentDrawing(null);
      setActiveTool(null);
    }
  };

  const handleNavInteraction = (e: React.MouseEvent) => {
    const navCanvas = navCanvasRef.current;
    if (!navCanvas || processedBars.length === 0) return;

    const rect = navCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;

    const canvas = canvasRef.current;
    if (canvas) {
      const viewW = canvas.getBoundingClientRect().width;
      const maxVisibleCandles = Math.ceil(viewW / candleWidth);
      const targetStartIdx = Math.max(0, Math.round(ratio * processedBars.length) - Math.round(maxVisibleCandles / 2));
      setScrollOffset(targetStartIdx * candleWidth);
    }
  };

  const handlePriceAxisDoubleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width - 65) {
      setIsAutoScale(true);
      setManualPriceRange(null);
    }
  };

  const toggleOverlay = (key: string) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleOscillator = (key: string) => {
    setOscillators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setContextMenu({ x, y });
  };

  const clearAllDrawings = () => {
    saveDrawings([]);
    setActiveTool(null);
  };

  const downloadChartScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement("a");
      link.download = `${ticker}_technical_chart.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col rounded-2xl border border-border bg-[#111111] shadow-lg select-none ${
        fullscreen ? "fixed inset-0 z-50 rounded-none w-screen h-screen" : "w-full h-[520px]"
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between border-b border-border bg-[#181818] p-2.5 px-4 gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Timeframes */}
          <div className="flex items-center rounded-lg bg-card border border-border p-0.5">
            {["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"].map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeSelect(tf)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition ${
                  timeframe === tf
                    ? "bg-[#2563eb] text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {tf === "1d" ? "D" : tf === "1wk" ? "W" : tf === "1mo" ? "M" : tf}
              </button>
            ))}
          </div>

          {/* Chart Types */}
          <div className="flex items-center rounded-lg bg-card border border-border p-0.5">
            {([
              { key: "candle", label: "Candles" },
              { key: "hollow", label: "Hollow" },
              { key: "heikin_ashi", label: "Heikin" },
              { key: "line", label: "Line" },
              { key: "area", label: "Area" },
              { key: "bar", label: "Bars" },
            ] as const).map((ct) => (
              <button
                key={ct.key}
                onClick={() => setChartType(ct.key)}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                  chartType === ct.key
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Technical Indicators Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
              <Activity className="h-3.5 w-3.5" />
              <span>Indicators</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            
            <div className="absolute right-0 top-full mt-1.5 hidden w-48 rounded-xl border border-border bg-[#181818] p-1.5 shadow-xl group-hover:block z-30">
              <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Overlays</div>
              <IndicatorMenuBtn active={overlays.sma20} onClick={() => toggleOverlay("sma20")}>20 DMA (SMA)</IndicatorMenuBtn>
              <IndicatorMenuBtn active={overlays.ema50} onClick={() => toggleOverlay("ema50")}>EMA (50)</IndicatorMenuBtn>
              <IndicatorMenuBtn active={overlays.sma100} onClick={() => toggleOverlay("sma100")}>100 DMA (SMA)</IndicatorMenuBtn>
              <IndicatorMenuBtn active={overlays.ema200} onClick={() => toggleOverlay("ema200")}>EMA (200)</IndicatorMenuBtn>
              <IndicatorMenuBtn active={overlays.bollinger} onClick={() => toggleOverlay("bollinger")}>Bollinger Bands</IndicatorMenuBtn>
              <IndicatorMenuBtn active={overlays.supertrend} onClick={() => toggleOverlay("supertrend")}>Supertrend</IndicatorMenuBtn>
              <div className="border-t border-border/60 my-1" />
              <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Oscillators</div>
              <IndicatorMenuBtn active={oscillators.volume} onClick={() => toggleOscillator("volume")}>Volume indicator</IndicatorMenuBtn>
              <IndicatorMenuBtn active={oscillators.rsi} onClick={() => toggleOscillator("rsi")}>Relative Strength Index (RSI)</IndicatorMenuBtn>
              <IndicatorMenuBtn active={oscillators.macd} onClick={() => toggleOscillator("macd")}>MACD Oscillator</IndicatorMenuBtn>
            </div>
          </div>

          {/* Screenshot */}
          <button
            onClick={downloadChartScreenshot}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
            title="Download Chart image"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
            title={fullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Main Workspace (Sidebar tools + Canvas) */}
      <div className="flex flex-1 min-h-0 bg-[#111111]">
        {/* Left Drawing Sidebar */}
        <div className="flex shrink-0 flex-col items-center gap-1.5 border-r border-border bg-[#181818] p-1.5 py-3">
          <DrawingToolBtn
            active={activeTool === "trend"}
            onClick={() => setActiveTool(activeTool === "trend" ? null : "trend")}
            icon={<span className="text-[14px] font-bold">╱</span>}
            title="Trend Line"
          />
          <DrawingToolBtn
            active={activeTool === "horizontal"}
            onClick={() => setActiveTool(activeTool === "horizontal" ? null : "horizontal")}
            icon={<span className="text-[14px] font-bold">──</span>}
            title="Horizontal Line"
          />
          <DrawingToolBtn
            active={activeTool === "fibonacci"}
            onClick={() => setActiveTool(activeTool === "fibonacci" ? null : "fibonacci")}
            icon={<span className="text-[12px] font-semibold">FIB</span>}
            title="Fibonacci Retracements"
          />
          <DrawingToolBtn
            active={activeTool === "rectangle"}
            onClick={() => setActiveTool(activeTool === "rectangle" ? null : "rectangle")}
            icon={<span className="text-[12px] font-semibold">█</span>}
            title="Rectangle highlight"
          />
          <DrawingToolBtn
            active={activeTool === "text"}
            onClick={() => setActiveTool(activeTool === "text" ? null : "text")}
            icon={<span className="text-[12px] font-bold">T</span>}
            title="Text Note Placement"
          />
          <div className="border-t border-border w-5 my-1.5" />
          <DrawingToolBtn
            active={activeTool === "eraser"}
            onClick={() => setActiveTool(activeTool === "eraser" ? null : "eraser")}
            icon={<span className="text-[11px] font-semibold text-bear">DEL</span>}
            title="Eraser (Click a drawing to remove)"
          />
          <button
            onClick={clearAllDrawings}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-bear hover:bg-white/5 transition"
            title="Clear all drawings"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Central dynamic canvas viewport */}
        <div className="flex-1 min-w-0 flex flex-col relative h-full">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setHoverIndex(null)}
            onDoubleClick={handlePriceAxisDoubleClick}
            onContextMenu={handleContextMenu}
            className="flex-1 h-full cursor-crosshair outline-none"
          />

          {/* Right-click Custom Context Menu */}
          {contextMenu && (
            <div
              className="absolute z-40 w-44 rounded-xl border border-border bg-[#181818] p-1 shadow-2xl space-y-0.5 text-xs text-muted-foreground"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                onClick={() => {
                  setIsAutoScale(true);
                  setManualPriceRange(null);
                  setContextMenu(null);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 hover:bg-white/5 hover:text-foreground transition"
              >
                Reset Scale (Auto)
              </button>
              <button
                onClick={() => {
                  clearAllDrawings();
                  setContextMenu(null);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 hover:bg-white/5 hover:text-foreground transition"
              >
                Clear Drawings
              </button>
              <div className="border-t border-border/60 my-1" />
              <button
                onClick={() => {
                  downloadChartScreenshot();
                  setContextMenu(null);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 hover:bg-white/5 hover:text-foreground transition"
              >
                Copy/Save Image
              </button>
              <button
                onClick={() => {
                  alert("Price alerts will notify you in secondary alerts dashboard!");
                  setContextMenu(null);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 hover:bg-white/5 hover:text-foreground transition"
              >
                Create alert...
              </button>
            </div>
          )}

          {/* Scale auto/log controls bar at bottom corner */}
          <div className="absolute right-16 bottom-[38px] flex items-center gap-1 bg-[#181818]/85 backdrop-blur border border-white/5 rounded-md p-0.5 z-20 text-[9px] font-semibold text-muted-foreground">
            <button
              onClick={() => {
                setIsAutoScale(true);
                setManualPriceRange(null);
              }}
              className={`rounded px-1.5 py-0.5 transition ${isAutoScale ? "bg-blue/15 text-bull border border-bull/20" : "hover:text-foreground"}`}
            >
              AUTO
            </button>
            <button
              onClick={() => setScaleType((prev) => (prev === "linear" ? "log" : "linear"))}
              className={`rounded px-1.5 py-0.5 transition ${scaleType === "log" ? "bg-white/10 text-white" : "hover:text-foreground"}`}
            >
              LOG
            </button>
          </div>

          {/* Slider Navigator */}
          <div className="shrink-0 h-8 relative select-none">
            <canvas
              ref={navCanvasRef}
              onMouseDown={handleNavInteraction}
              onMouseMove={(e) => { if (e.buttons === 1) handleNavInteraction(e); }}
              className="w-full h-8 bg-[#111111] border-t border-border cursor-ew-resize outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DrawingToolBtn({
  active,
  icon,
  ...p
}: { active: boolean; icon: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`grid h-8 w-8 place-items-center rounded-lg transition ${
        active ? "bg-[#3b82f6] text-white" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      {icon}
    </button>
  );
}

function IndicatorMenuBtn({
  active,
  children,
  ...p
}: { active: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition ${
        active ? "bg-white/[0.06] text-foreground font-semibold" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      <span>{children}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-bull" />}
    </button>
  );
}
