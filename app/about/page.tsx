import {
  getAllCommodityFlow,
  getCategoryTotals,
  getHeroKpis,
} from "@/lib/data/commodityFlow";
import { formatDateShort } from "@/lib/format";

export default async function AboutPage() {
  const rows = await getAllCommodityFlow();
  const categories = getCategoryTotals(rows).filter((c) => c.totalMt > 0);
  const { latestReportDate } = getHeroKpis(rows);

  const stats = [
    { label: "Shipping Records Analyzed", value: rows.length.toLocaleString("en-US") },
    { label: "Commodity Categories Tracked", value: categories.length.toString() },
    { label: "Deep-Water Ports Covered", value: "2" },
  ];

  return (
    <div className="flex flex-col w-full gap-xl max-w-3xl">
      <section className="flex flex-col gap-sm">
        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
          About Us
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          Transforming Maritime Activity Into Real-Time Market Intelligence
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-md">
          Over 90% of Pakistan&apos;s international trade volume flows through its deep-water
          gateways. PAK Trade Flow exists to bring immediate, unified visibility to this massive
          economic engine, transforming fragmented daily port activities into a single,
          cohesive view of the market.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-surface-container-lowest rounded-xl shadow-sm p-lg text-center"
          >
            <p className="font-display-lg text-display-lg text-on-surface">{s.value}</p>
            <p className="font-label-caps text-label-caps text-outline uppercase mt-xs">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col gap-md">
        <h3 className="font-headline-md text-headline-md text-on-surface">The Problem</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Despite the fact that nearly all of the nation&apos;s inbound and outbound
          commodities pass through Port Qasim and Karachi Port Trust, gaining a real-time,
          holistic picture of these movements has historically been an opaque process. Data
          regarding critical supply lines—from energy sectors to agriculture—often remains
          siloed and disconnected. Market participants are frequently left navigating delayed,
          fragmented reports, making it incredibly difficult to spot macro trends, anticipate
          supply shifts, or answer critical strategic questions when time is of the essence.
        </p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col gap-md">
        <h3 className="font-headline-md text-headline-md text-on-surface">Our Approach</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">
          We believe that clarity drives better market decisions. By intelligently aggregating
          and standardizing daily maritime activities across Pakistan&apos;s primary ports, we
          provide a transparent, unified view of national commodity flows. We focus on accuracy
          and standardization over assumptions, delivering a high-fidelity intelligence hub that
          reflects the true, real-time state of the market so you can act with confidence.
        </p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col gap-md">
        <h3 className="font-headline-md text-headline-md text-on-surface">Who It&apos;s For</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Designed for strategic decision-makers: commodity traders, supply chain executives,
          financial market analysts, and logistics planners who require an immediate, clear
          read on macroeconomic maritime movements to maintain their competitive edge.
        </p>
      </section>

      <p className="font-label-caps text-label-caps text-outline uppercase">
        Data as of {formatDateShort(latestReportDate)}
      </p>
    </div>
  );
}
