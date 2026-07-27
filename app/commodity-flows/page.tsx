import {
  getAllCommodityFlow,
  getCategoryTotals,
  getPortComparison,
  getTerminalBreakdown,
} from "@/lib/data/commodityFlow";
import { CategoryBreakdownChart } from "@/components/commodity-flows/CategoryBreakdownChart";
import { PortComparison } from "@/components/commodity-flows/PortComparison";
import { TerminalDrilldown } from "@/components/commodity-flows/TerminalDrilldown";

export default async function CommodityFlowsPage() {
  const rows = await getAllCommodityFlow();
  const categories = getCategoryTotals(rows);
  const portComparison = getPortComparison(rows);
  const pqTerminals = getTerminalBreakdown(rows, "PQ");

  return (
    <div className="flex flex-col w-full gap-xl">
      <section className="flex flex-col gap-sm">
        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
          Commodity Intelligence
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          Commodity Flows
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-md">
          Volume by category and port, drawn from daily shipping cargo statements at Port
          Qasim and Karachi Port Trust.
        </p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-lg">
        <h3 className="font-headline-md text-headline-md mb-md">Volume by Category</h3>
        <CategoryBreakdownChart data={categories} />
      </section>

      <section className="flex flex-col gap-md">
        <h3 className="font-headline-md text-headline-md">Import vs Export by Port</h3>
        <PortComparison data={portComparison} />
      </section>

      <section className="pb-xl">
        <TerminalDrilldown data={pqTerminals} />
      </section>
    </div>
  );
}
