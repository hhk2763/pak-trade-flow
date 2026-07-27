import {
  getAllCommodityFlow,
  getDailyTrendDetailed,
  getCategoryTotals,
  getHeroKpis,
} from "@/lib/data/commodityFlow";
import { VolumeTrendChart } from "@/components/market-trends/VolumeTrendChart";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateRange } from "@/lib/format";

export default async function MarketTrendsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const rows = await getAllCommodityFlow();
  const trend = getDailyTrendDetailed(rows);
  const categories = getCategoryTotals(rows).map((c) => c.category);
  const kpis = getHeroKpis(rows);

  const requestedCategory = searchParams.category;
  const initialView =
    requestedCategory && categories.includes(requestedCategory)
      ? requestedCategory
      : "import-export";
  const periodLabel = formatDateRange(kpis.periodStartDate, kpis.latestReportDate);

  return (
    <div className="flex flex-col w-full gap-xl">
      <section className="flex flex-col gap-sm">
        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
          Market Intelligence
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          Market Trends
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-md">
          Daily commodity volume across both ports since {trend[0]?.date ?? "the start of the record"}.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <StatCard
          label="Import Volume (Last 7 Days)"
          period={periodLabel}
          value={kpis.totalImportMt}
          unit="MT total"
          trendPct={kpis.importWoWPct}
          trendLabel="WoW"
          accentClass="bg-secondary"
        />
        <StatCard
          label="Export Volume (Last 7 Days)"
          period={periodLabel}
          value={kpis.totalExportMt}
          unit="MT total"
          trendPct={kpis.exportWoWPct}
          trendLabel="WoW"
          accentClass="bg-primary"
        />
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-lg pb-xl">
        <VolumeTrendChart data={trend} categories={categories} initialView={initialView} />
      </section>
    </div>
  );
}
