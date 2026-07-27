import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface TrendItem {
  pct: number | null;
  label: string;
}

interface StatCardProps {
  label: string;
  period?: string;
  value: number;
  unit?: string;
  trends?: TrendItem[];
  progressPct?: number;
  accentClass?: string;
}

export function StatCard({
  label,
  period,
  value,
  unit,
  trends,
  progressPct,
  accentClass = "bg-secondary",
}: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm flex flex-col gap-xs group hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <span className="font-label-caps text-label-caps text-outline uppercase">{label}</span>
          {period && (
            <span className="font-body-md text-[11px] text-on-surface-variant/70">{period}</span>
          )}
        </div>
        {trends && trends.length > 0 && (
          <div className="flex flex-col items-end gap-0.5">
            {trends.map((trend) =>
              trend.pct == null ? null : (
                <span
                  key={trend.label}
                  className={`font-data-tabular text-data-tabular flex items-center gap-xs ${
                    trend.pct >= 0 ? "text-secondary" : "text-error"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {trend.pct >= 0 ? "trending_up" : "trending_down"}
                  </span>
                  {trend.pct >= 0 ? "+" : ""}
                  {trend.pct.toFixed(1)}% {trend.label}
                </span>
              )
            )}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-sm">
        <span className="font-display-lg text-display-lg text-on-surface">
          <AnimatedNumber value={value} />
        </span>
        {unit && <span className="font-headline-sm text-headline-sm text-outline">{unit}</span>}
      </div>
      {progressPct != null && (
        <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-md overflow-hidden">
          <div
            className={`${accentClass} h-full rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
      )}
    </div>
  );
}
