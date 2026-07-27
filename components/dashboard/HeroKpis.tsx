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
      <div className="lg:col-span-4 flex flex-col gap-sm">
        <DataFreshnessBadge latestReportDate={kpis.latestReportDate} />
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none mt-sm">
          Executive Performance
          <br />
          Dashboard
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mt-md">
          Commodity flow across Port Qasim (PQ) and Karachi Port Trust (KPT),
          built from daily shipping cargo reports.
        </p>
      </div>
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-md">
        <StatCard
          label="Imports (Last 7 Days)"
          period={periodLabel}
          value={kpis.totalImportMt}
          unit="MT"
          trendPct={kpis.importWoWPct}
          trendLabel="WoW"
          progressPct={importProgress}
          accentClass="bg-secondary"
        />
        <StatCard
          label="Exports (Last 7 Days)"
          period={periodLabel}
          value={kpis.totalExportMt}
          unit="MT"
          trendPct={kpis.exportWoWPct}
          trendLabel="WoW"
          progressPct={exportProgress}
          accentClass="bg-primary"
        />
      </div>
    </section>
  );
}
