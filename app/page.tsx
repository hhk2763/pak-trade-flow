import {
  getAllCommodityFlow,
  getHeroKpis,
  getCategoryTotals,
  getRecentShipments,
} from "@/lib/data/commodityFlow";
import { HeroKpis } from "@/components/dashboard/HeroKpis";
import { TopCommodities } from "@/components/dashboard/TopCommodities";
import { RecentShipments } from "@/components/dashboard/RecentShipments";

export default async function DashboardPage() {
  const rows = await getAllCommodityFlow();
  const kpis = getHeroKpis(rows);
  const categories = getCategoryTotals(rows);
  const recent = getRecentShipments(rows, 8);

  return (
    <div className="flex flex-col w-full gap-xl">
      <HeroKpis kpis={kpis} />
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-xl pb-xl">
        <div className="lg:col-span-7">
          <RecentShipments shipments={recent} />
        </div>
        <div className="lg:col-span-5">
          <TopCommodities categories={categories} />
        </div>
      </section>
    </div>
  );
}
