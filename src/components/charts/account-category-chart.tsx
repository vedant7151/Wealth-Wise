"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CategoryBarData {
  category: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
}

interface AccountCategoryChartProps {
  data: CategoryBarData[];
}

export function AccountCategoryChart({ data }: AccountCategoryChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No transactions yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) =>
            `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
          }
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          width={55}
        />
        <Tooltip
          formatter={(value: any) =>
            `$${(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          }
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--background))",
          }}
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.type === "INCOME" ? "#10b981" : "#ef4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
