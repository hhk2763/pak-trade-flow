"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMt } from "@/lib/format";
import type { CategoryTotal } from "@/lib/data/commodityFlow";

export function CategoryBreakdownChart({ data }: { data: CategoryTotal[] }) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#c6c6cd" vertical={false} />
          <XAxis
            dataKey="category"
            angle={-35}
            textAnchor="end"
            interval={0}
            height={70}
            tick={{ fontSize: 11, fill: "#45464d" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#45464d" }}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            formatter={(value: number) => [`${formatMt(value)} MT`, "Volume"]}
            contentStyle={{ fontSize: 13, borderRadius: 8 }}
          />
          <Bar
            dataKey="totalMt"
            fill="#006a61"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
