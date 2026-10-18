import { formatMt } from "@/lib/format";
import type { ThemeSignal } from "@/lib/data/vesselCalls";

// Below this many vessels in either window a percentage is noise (one late
// tanker reads as -100%), so the counts are shown instead.
const MIN_CALLS_FOR_PCT = 3;

function Change({ pct, calls, priorCalls }: { pct: number | null; calls: number; priorCalls: number }) {
  if (pct == null || calls < MIN_CALLS_FOR_PCT || priorCalls < MIN_CALLS_FOR_PCT) {
    return (
      <span className="font-data-tabular text-data-tabular text-outline">
        {calls} vs {priorCalls} vessels
      </span>
    );
  }
  const up = pct >= 0;
  return (
    <span
      className={`font-data-tabular text-data-tabular flex items-center justify-end gap-xs ${
        up ? "text-secondary" : "text-error"
      }`}
    >
      <span className="material-symbols-outlined text-[14px]">
        {up ? "trending_up" : "trending_down"}
      </span>
      {up ? "+" : ""}
      {pct.toFixed(0)}%
    </span>
  );
}

export function SignalRow({ signal }: { signal: ThemeSignal }) {
  const { theme } = signal;
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col gap-md">
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div className="flex flex-col gap-xs min-w-0">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            {theme.direction ?? "Import + Export"}
            {theme.terminal ? ` · ${theme.terminal} terminal` : ""}
          </span>
          <h3 className="font-headline-md text-headline-md text-on-surface">{theme.name}</h3>
        </div>
        <div className="flex gap-xs flex-wrap">
          {theme.exposures.map((e) => (
            <span
              key={e.ticker}
              className="px-sm py-xs bg-secondary-container text-on-secondary-container rounded-md font-data-tabular text-data-tabular"
            >
              {e.ticker}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Last {signal.windowDays} days
          </span>
          <span className="font-headline-sm text-headline-sm text-on-surface">
            {formatMt(signal.tonnageMt)} MT
          </span>
          <span className="font-body-md text-[12px] text-on-surface-variant">
            {signal.calls} {signal.calls === 1 ? "vessel" : "vessels"}
          </span>
        </div>
        <div className="flex flex-col items-end md:items-start">
          <span className="font-label-caps text-label-caps text-outline uppercase">vs prior</span>
          <Change pct={signal.changePct} calls={signal.calls} priorCalls={signal.priorCalls} />
          <span className="font-body-md text-[12px] text-on-surface-variant">
            {formatMt(signal.priorTonnageMt)} MT · {signal.priorCalls} vessels
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">Waiting now</span>
          <span className="font-headline-sm text-headline-sm text-on-surface">
            {formatMt(signal.waitingTonnageMt)} MT
          </span>
          <span className="font-body-md text-[12px] text-on-surface-variant">
            {signal.waitingVessels} at PQ anchorage
          </span>
        </div>
        <div className="flex flex-col items-end md:items-start">
          <span className="font-label-caps text-label-caps text-outline uppercase">Median wait</span>
          <span className="font-headline-sm text-headline-sm text-on-surface">
            {signal.medianWaitDays != null ? `${signal.medianWaitDays.toFixed(1)} days` : "—"}
          </span>
          <span className="font-body-md text-[12px] text-on-surface-variant">PQ, before berthing</span>
        </div>
      </div>

      <div className="border-t border-outline-variant/30 pt-md flex flex-col gap-sm">
        <p className="font-body-md text-body-md text-on-surface-variant">{theme.readAs}</p>
        <details className="font-body-md text-body-md text-on-surface-variant">
          <summary className="cursor-pointer font-label-caps text-label-caps text-secondary uppercase">
            Why these companies
          </summary>
          <ul className="mt-sm flex flex-col gap-xs">
            {theme.exposures.map((e) => (
              <li key={e.ticker}>
                <span className="font-data-tabular text-data-tabular text-on-surface">{e.ticker}</span>
                {" — "}
                {e.why}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
