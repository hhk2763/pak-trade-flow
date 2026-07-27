"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMt, formatDateShort, categoryImportKey, categoryExportKey } from "@/lib/format";
import type { DailyTrendPoint } from "@/lib/data/commodityFlow";

const IMPORT_COLOR = "#006a61";
const EXPORT_COLOR = "#000000";

export function VolumeTrendChart({
  data,
  categories,
  initialView = "import-export",
}: {
  data: DailyTrendPoint[];
  categories: string[];
  initialView?: string;
}) {
  const [view, setView] = useState<string>(initialView);

  const importKey = view === "import-export" ? "importMt" : categoryImportKey(view);
  const exportKey = view === "import-export" ? "exportMt" : categoryExportKey(view);

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between flex-wrap gap-sm">
        <h3 className="font-headline-md text-headline-md">Daily Volume Trend</h3>
        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
          className="bg-surface-container-low border border-outline-variant rounded-lg py-xs px-md font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50"
        >
          <option value="import-export">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#c6c6cd" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 11, fill: "#45464d" }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#45464d" }}
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              labelFormatter={(label: string) => formatDateShort(label)}
              formatter={(value: number) => `${formatMt(value)} MT`}
              contentStyle={{ fontSize: 13, borderRadius: 8 }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={importKey}
              name="Import"
              stroke={IMPORT_COLOR}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey={exportKey}
              name="Export"
              stroke={EXPORT_COLOR}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
