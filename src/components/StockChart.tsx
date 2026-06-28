import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartData } from "@/lib/types/stock";

export function StockChart({ data }: { data: ChartData }) {
  const chartData = data.bars.map((bar, i) => ({
    date: bar.date.slice(5),
    close: bar.close,
    ema50: data.ema50[i],
    ema150: data.ema150[i],
    ema200: data.ema200[i],
    volume: bar.volume,
  }));

  const display = chartData.slice(-104);

  return (
    <div className="space-y-4">
      <div className="relative h-80 rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_60%)]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={display} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              width={56}
              tickFormatter={(v) => `₹${Math.round(v)}`}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(17,17,17,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [`₹${value.toFixed(2)}`, name]}
            />
            <Line type="monotone" dataKey="close" stroke="white" strokeWidth={1.5} dot={false} name="Close" />
            <Line type="monotone" dataKey="ema50" stroke="rgba(255,255,255,0.85)" strokeWidth={1} dot={false} name="50 EMA" connectNulls />
            <Line type="monotone" dataKey="ema150" stroke="rgba(255,255,255,0.55)" strokeWidth={1} dot={false} name="150 EMA" connectNulls />
            <Line type="monotone" dataKey="ema200" stroke="rgba(255,255,255,0.3)" strokeWidth={1} dot={false} name="200 EMA" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="absolute right-4 top-4 rounded-md border border-border bg-background/70 px-2 py-1 font-mono text-[10px] text-muted-foreground">
          Weekly · Pivot ₹{data.pivotPrice.toFixed(0)}
        </div>
      </div>
    </div>
  );
}
