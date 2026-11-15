import Link from "next/link";
import { buildMarketSnapshot, getCoverage, getVesselCalls } from "@/lib/data/vesselCalls";
import { formatDateLong, formatMeasure, formatMonth } from "@/lib/format";
import { SectorCard } from "@/components/sectors/SectorCard";
import { Delta } from "@/components/sectors/Delta";
import { DataPending } from "@/components/ui/DataPending";

// The four flows an equity desk asks about first.
const HEADLINE_KEYS = ["coal-imports", "palm-oil-imports", "gasoline-imports", "cement-exports"];

export default async function SectorMonitorPage() {
  const [calls, coverage] = await Promise.all([getVesselCalls(), getCoverage()]);
  const market = buildMarketSnapshot(calls, coverage);
  if (!market.hasData) return <DataPending />;

  const allSeries = market.sectors.flatMap((s) => s.series);
  const headline = HEADLINE_KEYS.map((k) => allSeries.find((s) => s.series.key === k)).filter(
    (s): s is NonNullable<typeof s> => Boolean(s)
  );

  return (
    <div className="flex flex-col w-full gap-xl">
      <section className="flex flex-col gap-sm max-w-4xl">
        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
          Sector Monitor · data to {formatDateLong(market.asOf)}
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          What landed at Pakistan&apos;s ports, by listed sector
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Every cargo vessel at Port Qasim and Karachi Port, counted once per call and mapped to
          the companies it matters to. Updated nightly, weeks ahead of official trade statistics,
          with history back to 2019.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
        {headline.map((s) => (
          <div
            key={s.series.key}
            className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col gap-xs"
          >
            <span className="font-label-caps text-label-caps text-outline uppercase">
              {s.series.label}
            </span>
            <span className="font-body-md text-[11px] text-on-surface-variant/80">
              {formatMonth(s.lastMonth)} · {s.lastMonthCalls} calls
            </span>
            <span className="font-display-lg text-display-lg text-on-surface font-data-tabular">
              {formatMeasure(s.lastMonthValue, s.series.unit)}
            </span>
            <span className="flex flex-wrap gap-x-md">
              <Delta pct={s.mom.pct} label="MoM" basis={s.mom.basis} />
              <Delta pct={s.yoy.pct} label="YoY" basis={s.yoy.basis} />
            </span>
          </div>
        ))}
      </section>

      <p className="font-body-md text-[12px] text-on-surface-variant -mt-md max-w-4xl">
        Figures are for the last fully reported month. <sup>PQ</sup> marks a comparison made on Port
        Qasim alone, because Karachi Port history on the same basis starts in March 2026. See{" "}
        <Link href="/about" className="underline">
          methodology
        </Link>
        .
      </p>

      <div className="flex flex-col gap-lg pb-xl">
        {market.sectors.map((s) => (
          <SectorCard key={s.sector.slug} snap={s} />
        ))}
      </div>
    </div>
  );
}
