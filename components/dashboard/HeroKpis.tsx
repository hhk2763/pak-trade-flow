import { StatCard } from "@/components/ui/StatCard";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { formatDateRange } from "@/lib/format";
import type { HeroKpis as HeroKpisData } from "@/lib/data/commodityFlow";

export function HeroKpis({ kpis }: { kpis: HeroKpisData }) {
  const combined = kpis.totalImportMt + kpis.totalExportMt || 1;
  const importProgress = (kpis.totalImportMt / combined) * 100;
  const exportProgress = (kpis.totalExportMt / combined) * 100;
  const periodLabel = formatDateRange(kpis.periodStartDate, kpis.latestReportDate);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-end">
      <div className="lg:col-span-4 flex flex-col gap-md">
        <DataFreshnessBadge latestReportDate={kpis.latestReportDate} />
        <div className="flex flex-col gap-sm mt-sm">
          <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
            Strategic Trade
            <br />
            Dashboard
          </h1>
          <p className="font-headline-sm text-headline-sm text-secondary">
            Make your next move with confidence.
          </p>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
            Empowering your market strategy with daily, high-fidelity commodity insights.
          </p>
        </div>
      </div>
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-md">
        <StatCard
          label="Imports (Last 7 Days)"
          period={periodLabel}
          value={kpis.totalImportMt}
          unit="MT"
          trends={[
            { pct: kpis.importWoWPct, label: "WoW" },
            { pct: kpis.importMoMPct, label: "MoM" },
          ]}
          progressPct={importProgress}
          accentClass="bg-secondary"
        />
        <StatCard
          label="Exports (Last 7 Days)"
          period={periodLabel}
          value={kpis.totalExportMt}
          unit="MT"
          trends={[
            { pct: kpis.exportWoWPct, label: "WoW" },
            { pct: kpis.exportMoMPct, label: "MoM" },
          ]}
          progressPct={exportProgress}
          accentClass="bg-primary"
        />
      </div>
    </section>
  );
}
