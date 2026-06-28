// Mock data for LynchMark — Indian stocks (fallback when VITE_USE_MOCK_DATA=true)
export type { Status, Stock } from "@/lib/types/stock";
import type { Stock } from "@/lib/types/stock";

const mk = (s: Partial<Stock> & Pick<Stock, "ticker" | "company" | "sector" | "cmp">): Stock => ({
  industry: s.sector!,
  change: 0,
  changePct: 0,
  marketCap: 50000,
  growthQuality: 80,
  businessQuality: 80,
  valuation: 70,
  technicalStrength: 80,
  breakoutReadiness: 70,
  investmentQuality: 80,
  status: "VCP Ready",
  pe: 28,
  peg: 1.2,
  roe: 22,
  roce: 26,
  revGrowth: 18,
  epsGrowth: 22,
  debtEquity: 0.2,
  opMargin: 24,
  netMargin: 18,
  ...s,
} as Stock);

export const STOCKS: Stock[] = [
  mk({ ticker: "TCS", company: "Tata Consultancy Services", sector: "IT Services", cmp: 4128.5, change: 32.4, changePct: 0.79, marketCap: 1490000, growthQuality: 86, businessQuality: 94, valuation: 72, technicalStrength: 78, breakoutReadiness: 71, investmentQuality: 89, status: "Strong Buy" }),
  mk({ ticker: "INFY", company: "Infosys", sector: "IT Services", cmp: 1834.2, change: -8.6, changePct: -0.47, marketCap: 762000, growthQuality: 82, businessQuality: 92, valuation: 75, technicalStrength: 74, breakoutReadiness: 68, investmentQuality: 86, status: "Base Building" }),
  mk({ ticker: "HDFCBANK", company: "HDFC Bank", sector: "Banking", cmp: 1701.0, change: 12.3, changePct: 0.73, marketCap: 1290000, growthQuality: 78, businessQuality: 95, valuation: 80, technicalStrength: 71, breakoutReadiness: 64, investmentQuality: 87, status: "Near Pivot" }),
  mk({ ticker: "ICICIBANK", company: "ICICI Bank", sector: "Banking", cmp: 1268.4, change: 21.8, changePct: 1.74, marketCap: 894000, growthQuality: 84, businessQuality: 92, valuation: 78, technicalStrength: 86, breakoutReadiness: 82, investmentQuality: 90, status: "Strong Buy" }),
  mk({ ticker: "HAL", company: "Hindustan Aeronautics", sector: "Defense", cmp: 4720.6, change: 68.2, changePct: 1.46, marketCap: 316000, growthQuality: 92, businessQuality: 88, valuation: 64, technicalStrength: 88, breakoutReadiness: 91, investmentQuality: 90, status: "VCP Ready" }),
  mk({ ticker: "BEL", company: "Bharat Electronics", sector: "Defense", cmp: 312.85, change: 4.6, changePct: 1.49, marketCap: 228000, growthQuality: 90, businessQuality: 86, valuation: 68, technicalStrength: 91, breakoutReadiness: 94, investmentQuality: 92, status: "Breakout" }),
  mk({ ticker: "BSE", company: "BSE Limited", sector: "Capital Markets", cmp: 4980.5, change: 121.4, changePct: 2.5, marketCap: 67000, growthQuality: 94, businessQuality: 81, valuation: 58, technicalStrength: 93, breakoutReadiness: 88, investmentQuality: 88, status: "Extended" }),
  mk({ ticker: "DIXON", company: "Dixon Technologies", sector: "Consumer Electronics", cmp: 14820.0, change: -132, changePct: -0.88, marketCap: 88000, growthQuality: 96, businessQuality: 84, valuation: 48, technicalStrength: 79, breakoutReadiness: 66, investmentQuality: 84, status: "Base Building" }),
  mk({ ticker: "KEI", company: "KEI Industries", sector: "Capital Goods", cmp: 4205.2, change: 38.1, changePct: 0.91, marketCap: 39000, growthQuality: 88, businessQuality: 82, valuation: 66, technicalStrength: 84, breakoutReadiness: 81, investmentQuality: 86, status: "VCP Ready" }),
  mk({ ticker: "POLYCAB", company: "Polycab India", sector: "Capital Goods", cmp: 6740.3, change: 22.1, changePct: 0.33, marketCap: 101000, growthQuality: 89, businessQuality: 86, valuation: 70, technicalStrength: 80, breakoutReadiness: 74, investmentQuality: 87, status: "Near Pivot" }),
  mk({ ticker: "KPIGREEN", company: "KPI Green Energy", sector: "Renewables", cmp: 932.4, change: 18.2, changePct: 2.0, marketCap: 19000, growthQuality: 95, businessQuality: 76, valuation: 54, technicalStrength: 86, breakoutReadiness: 84, investmentQuality: 84, status: "Strong Buy" }),
  mk({ ticker: "PERSISTENT", company: "Persistent Systems", sector: "IT Services", cmp: 5612.0, change: 47.6, changePct: 0.86, marketCap: 87000, growthQuality: 91, businessQuality: 88, valuation: 62, technicalStrength: 82, breakoutReadiness: 78, investmentQuality: 88, status: "VCP Ready" }),
  mk({ ticker: "COFORGE", company: "Coforge", sector: "IT Services", cmp: 7864.5, change: -42.3, changePct: -0.54, marketCap: 52000, growthQuality: 87, businessQuality: 84, valuation: 66, technicalStrength: 76, breakoutReadiness: 70, investmentQuality: 84, status: "Base Building" }),
  mk({ ticker: "CGPOWER", company: "CG Power & Industrial", sector: "Capital Goods", cmp: 742.8, change: 9.4, changePct: 1.28, marketCap: 113000, growthQuality: 93, businessQuality: 80, valuation: 50, technicalStrength: 90, breakoutReadiness: 87, investmentQuality: 88, status: "VCP Ready" }),
  mk({ ticker: "TRENT", company: "Trent Limited", sector: "Retail", cmp: 7124.6, change: 84.2, changePct: 1.2, marketCap: 253000, growthQuality: 97, businessQuality: 90, valuation: 42, technicalStrength: 89, breakoutReadiness: 83, investmentQuality: 89, status: "Extended" }),
];

export const SECTORS = [
  { name: "IT Services", change: 1.42 },
  { name: "Banking", change: 0.84 },
  { name: "Defense", change: 2.18 },
  { name: "Capital Goods", change: 1.05 },
  { name: "Renewables", change: 2.46 },
  { name: "Retail", change: 0.62 },
  { name: "Pharma", change: -0.28 },
  { name: "Auto", change: -0.84 },
  { name: "FMCG", change: 0.12 },
  { name: "Metals", change: -1.32 },
  { name: "Energy", change: 0.46 },
  { name: "Realty", change: 1.18 },
];

export const INDICES = [
  { name: "NIFTY 50", value: 24812.4, change: 0.62 },
  { name: "SENSEX", value: 81204.8, change: 0.54 },
  { name: "BANK NIFTY", value: 51326.2, change: 0.81 },
  { name: "NIFTY MIDCAP", value: 58102.6, change: 1.14 },
];

export const ALERTS = [
  { id: 1, ticker: "BEL", type: "Breakout", message: "Weekly breakout above pivot 308", time: "12m ago" },
  { id: 2, ticker: "HAL", type: "Near Pivot", message: "Within 1.2% of pivot zone", time: "48m ago" },
  { id: 3, ticker: "KPIGREEN", type: "Volume Spike", message: "Volume 2.4x 50-day average", time: "1h ago" },
  { id: 4, ticker: "ICICIBANK", type: "VCP", message: "New weekly VCP detected", time: "3h ago" },
  { id: 5, ticker: "TRENT", type: "Earnings", message: "Quarterly results in 2 days", time: "5h ago" },
];

export const THOUGHTS = [
  "Focus on quality businesses.",
  "Patience compounds.",
  "Great companies create great wealth.",
  "Risk management is investing.",
  "Strong fundamentals deserve technical confirmation.",
  "Let winners grow.",
  "Discipline beats emotion.",
  "Time in the market beats timing the market.",
  "Buy quality, hold conviction.",
];

export const PORTFOLIO = {
  currentValue: 4_82_56_400,
  invested: 3_92_10_000,
  todaysGain: 1_24_500,
  todaysGainPct: 0.26,
  overallReturn: 23.07,
  holdings: STOCKS.slice(0, 8).map((s, i) => ({
    ticker: s.ticker,
    company: s.company,
    qty: [120, 80, 200, 150, 60, 400, 30, 25][i],
    avg: s.cmp * 0.82,
    cmp: s.cmp,
    weight: [18, 14, 13, 12, 11, 10, 12, 10][i],
  })),
};
