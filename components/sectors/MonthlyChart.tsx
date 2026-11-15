"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthPoint } from "@/lib/data/vesselCalls";
import { formatCompact, formatMeasure, formatMonth, formatMonthShort } from "@/lib/format";

const FULL = "#00897b";
const PARTIAL = "#9fd3cc";

const RANGES = [
  { key: "2y", label: "2 years", months: 24 },
  { key: "4y", label: "4 years", months: 48 },
  { key: "all", label: "All", months: Infinity },
] as const;

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: { payload: MonthPoint }[];
  unit: "mt" | "calls";
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-md px-md py-sm">
      <p className="font-label-caps text-label-caps text-outline uppercase">{formatMonth(p.month)}</p>
      <p className="font-headline-sm text-headline-sm text-on-surface">
        {p.observed ? formatMeasure(p.value, unit) : "No source reports"}
      </p>
      {p.observed && (
        <p className="font-body-md text-[12px] text-on-surface-variant">
          {p.calls} vessel call{p.calls === 1 ? "" : "s"}
          {p.complete ? "" : " · partial month"}
        </p>
      )}
    </div>
  );
}

export function MonthlyChart({ points, unit }: { points: MonthPoint[]; unit: "mt" | "calls" }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("2y");
  const months = RANGES.find((r) => r.key === range)!.months;
  const data = Number.isFinite(months) ? points.slice(-months) : points;
  const hasPartial = data.some((p) => !p.complete);
  // Label roughly a dozen ticks whatever the range, always on the same months.
  const tickEvery = Math.max(1, Math.ceil(data.length / 12));

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-center justify-end gap-xs" role="group" aria-label="Time range">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            aria-pressed={range === r.key}
            className={`px-sm py-0.5 rounded-full font-label-caps text-label-caps uppercase transition-colors ${
              range === r.key
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
            <CartesianGrid stroke="#e3e5ea" vertical={false} />
            <XAxis
              dataKey="month"
              interval={tickEvery - 1}
              tickFormatter={formatMonthShort}
              tick={{ fontSize: 11, fill: "#76777d" }}
              axisLine={{ stroke: "#c6c6cd" }}
              tickLine={false}
            />
            <YAxis
              width={48}
              tickFormatter={(v: number) => (unit === "calls" ? String(v) : formatCompact(v))}
              tick={{ fontSize: 11, fill: "#76777d" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "#0b1c30", fillOpacity: 0.06 }}
              content={<ChartTooltip unit={unit} />}
            />
            <Bar dataKey="value" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((p) => (
                <Cell key={p.month} fill={p.complete ? FULL : PARTIAL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {hasPartial && (
        <p className="flex items-center gap-md font-body-md text-[12px] text-on-surface-variant">
          <span className="inline-flex items-center gap-xs">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: FULL }} />
            Full month
          </span>
          <span className="inline-flex items-center gap-xs">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: PARTIAL }} />
            Partial: month in progress, or source reports missing
          </span>
        </p>
      )}

      <details className="font-body-md text-[13px] text-on-surface-variant">
        <summary className="cursor-pointer select-none">View as table</summary>
        <div className="mt-sm max-h-64 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="font-label-caps text-label-caps text-outline uppercase">
                <th className="py-xs pr-md">Month</th>
                <th className="py-xs pr-md text-right">Volume</th>
                <th className="py-xs pr-md text-right">Calls</th>
                <th className="py-xs">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((p) => (
                <tr key={p.month} className="border-t border-outline-variant/50">
                  <td className="py-xs pr-md">{formatMonth(p.month)}</td>
                  <td className="py-xs pr-md text-right font-data-tabular">
                    {p.observed ? formatMeasure(p.value, unit) : "-"}
                  </td>
                  <td className="py-xs pr-md text-right font-data-tabular">{p.observed ? p.calls : "-"}</td>
                  <td className="py-xs">
                    {!p.observed ? "No reports" : p.complete ? "Full" : "Partial"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
