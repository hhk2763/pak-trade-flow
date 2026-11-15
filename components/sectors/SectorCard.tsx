import Link from "next/link";
import type { SectorSnapshot } from "@/lib/data/vesselCalls";
import { SeriesRow } from "@/components/sectors/SeriesRow";

export function TickerChips({ tickers }: { tickers: string[] }) {
  return (
    <span className="flex flex-wrap gap-xs">
      {tickers.map((t) => (
        <span
          key={t}
          className="px-sm py-0.5 rounded-full bg-surface-container font-data-tabular text-[11px] text-on-surface-variant"
        >
          {t}
        </span>
      ))}
    </span>
  );
}

export function SectorCard({ snap }: { snap: SectorSnapshot }) {
  const { sector, series } = snap;
  return (
    <section className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col gap-md">
      <header className="flex flex-col gap-sm">
        <div className="flex items-center justify-between gap-md">
          <h2 className="flex items-center gap-sm font-headline-md text-headline-md text-on-surface">
            <span className="material-symbols-outlined text-secondary" aria-hidden>
              {sector.icon}
            </span>
            {sector.name}
          </h2>
          <Link
            href={`/sectors/${sector.slug}`}
            className="font-label-caps text-label-caps uppercase text-on-surface-variant hover:text-on-surface inline-flex items-center gap-0.5 whitespace-nowrap"
          >
            Detail
            <span className="material-symbols-outlined text-[16px]" aria-hidden>
              chevron_right
            </span>
          </Link>
        </div>
        <TickerChips tickers={sector.tickers} />
        <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">{sector.summary}</p>
      </header>
      <div>
        {series.map((s) => (
          <SeriesRow key={s.series.key} snap={s} />
        ))}
      </div>
    </section>
  );
}
