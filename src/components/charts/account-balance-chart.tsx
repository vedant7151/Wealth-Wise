"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BalancePoint {
  date: string;
  balance: number;
}

interface AccountBalanceChartProps {
  data: BalancePoint[];
}

export function AccountBalanceChart({ data }: AccountBalanceChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No transactions yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis
          tickFormatter={(v) =>
            `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
          }
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <Tooltip
          formatter={(value: any) =>
            [`$${(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Balance"]
          }
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--background))",
          }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#balanceGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
