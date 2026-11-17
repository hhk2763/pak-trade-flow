import type { SeriesSnapshot } from "@/lib/data/vesselCalls";
import { formatMeasure, formatMonthShort } from "@/lib/format";
import { Delta } from "@/components/sectors/Delta";
import { Sparkline } from "@/components/sectors/Sparkline";

// One measured cargo flow: last full month, how it changed, the two-year
// shape, and what is queued at anchorage.
export function SeriesRow({ snap }: { snap: SeriesSnapshot }) {
  const unit = snap.series.unit;
  return (
    <div className="grid grid-cols-12 items-center gap-md py-md border-t border-outline-variant/60 first:border-t-0">
      <div className="col-span-12 md:col-span-4 flex flex-col gap-0.5">
        <span className="font-headline-sm text-headline-sm text-on-surface">{snap.series.label}</span>
        <span className="font-body-md text-[12px] text-on-surface-variant">
          {snap.series.direction} · {formatMonthShort(snap.lastMonth)} · {snap.lastMonthCalls} call
          {snap.lastMonthCalls === 1 ? "" : "s"}
        </span>
        {snap.series.coverageNote && <PartialBadge note={snap.series.coverageNote} />}
      </div>
      <div className="col-span-6 md:col-span-3 flex flex-col gap-0.5">
        <span className="font-headline-md text-headline-md text-on-surface font-data-tabular">
          {formatMeasure(snap.lastMonthValue, unit)}
        </span>
        {snap.series.coverageNote ? (
          <span className="font-data-tabular text-data-tabular text-outline">Not compared</span>
        ) : (
          <span className="flex flex-wrap gap-x-md">
            <Delta pct={snap.mom.pct} label="MoM" basis={snap.mom.basis} />
            <Delta pct={snap.yoy.pct} label="YoY" basis={snap.yoy.basis} />
          </span>
        )}
      </div>
      <div className="col-span-6 md:col-span-3">
        <Sparkline points={snap.history.slice(-24)} />
      </div>
      <div className="col-span-12 md:col-span-2 flex flex-col gap-0.5 md:items-end">
        <span className="font-label-caps text-label-caps text-outline uppercase">At anchorage</span>
        <span className="font-data-tabular text-data-tabular text-on-surface">
          {snap.waitingCalls === 0
            ? "None waiting"
            : unit === "calls"
              ? `${snap.waitingCalls} waiting`
              : `${snap.waitingCalls} · ${formatMeasure(snap.waitingValue, unit)}`}
        </span>
      </div>
    </div>
  );
}

/** Flags a flow the port statements only partly report; the note is the tooltip. */
export function PartialBadge({ note }: { note: string }) {
  return (
    <span
      className="mt-0.5 inline-flex w-fit items-center gap-0.5 rounded-full bg-surface-container px-sm py-0.5 font-label-caps text-[10px] uppercase text-on-surface-variant"
      title={note}
    >
      <span className="material-symbols-outlined text-[13px]" aria-hidden>
        info
      </span>
      Partial coverage
    </span>
  );
}
