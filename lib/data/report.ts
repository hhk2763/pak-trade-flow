import { formatMt, formatDateShort } from "@/lib/format";
import type { IncomingPipeline, TerminalCongestion, ThemeSignal } from "@/lib/data/vesselCalls";

// The weekly report's "what changed" bullets. Written by code from the same
// figures the tables show, so every number in a takeaway is one a reader can
// find again further down the page -- no model is trusted with arithmetic.

export interface Takeaway {
  headline: string;
  detail: string;
  tickers: string[];
}

// A move has to clear both bars to be worth a client's attention: enough
// vessels that one late tanker cannot fake it, and a change large enough to
// matter against normal week-to-week lumpiness.
const MIN_CALLS = 3;
const MIN_MOVE_PCT = 15;
const MIN_WAIT_RISE_DAYS = 3;
const MAX_SIGNAL_TAKEAWAYS = 3;

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildTakeaways(
  signals: ThemeSignal[],
  congestion: TerminalCongestion[],
  pipeline: IncomingPipeline
): Takeaway[] {
  const out: Takeaway[] = [];

  const moves = signals
    .filter(
      (s) =>
        s.changePct != null &&
        s.calls >= MIN_CALLS &&
        s.priorCalls >= MIN_CALLS &&
        Math.abs(s.changePct) >= MIN_MOVE_PCT
    )
    .sort((a, b) => Math.abs(b.changePct as number) - Math.abs(a.changePct as number))
    .slice(0, MAX_SIGNAL_TAKEAWAYS);

  for (const s of moves) {
    const pct = s.changePct as number;
    out.push({
      headline: `${s.theme.name} ${pct >= 0 ? "up" : "down"} ${Math.abs(pct).toFixed(0)}%`,
      detail:
        `${formatMt(s.tonnageMt)} MT across ${s.calls} vessels berthed ` +
        `${formatDateShort(s.periodStart)}–${formatDateShort(s.periodEnd)}, against ` +
        `${formatMt(s.priorTonnageMt)} MT from ${s.priorCalls} vessels in the 28 days before.` +
        (s.waitingVessels > 0
          ? ` A further ${formatMt(s.waitingTonnageMt)} MT is waiting at anchorage.`
          : ""),
      tickers: s.theme.exposures.map((e) => e.ticker),
    });
  }

  const slower = congestion
    .filter(
      (c) =>
        c.priorMedianWaitDays != null &&
        c.medianWaitDays - c.priorMedianWaitDays >= MIN_WAIT_RISE_DAYS
    )
    .sort(
      (a, b) =>
        b.medianWaitDays - (b.priorMedianWaitDays as number) -
        (a.medianWaitDays - (a.priorMedianWaitDays as number))
    );
  for (const c of slower.slice(0, 1)) {
    const cargo = c.mainCargo ? `${titleCase(c.mainCargo)} at ${c.terminal}` : c.terminal;
    out.push({
      headline: `${cargo}: anchorage wait up to ${c.medianWaitDays.toFixed(0)} days`,
      detail:
        `Median wait before berthing was ${c.medianWaitDays.toFixed(1)} days for the ${c.calls} ` +
        `vessels berthed in the last 28 days, from ${(c.priorMedianWaitDays as number).toFixed(1)} ` +
        `days before. ${c.waitingNow} more ${c.waitingNow === 1 ? "is" : "are"} waiting now. ` +
        `Longer waits mean demurrage for importers and later arrival of cargo inland.`,
      tickers: [],
    });
  }

  const biggest = pipeline.byCategory[0];
  if (biggest && biggest.tonnageMt > 0) {
    out.push({
      headline: `${formatMt(biggest.tonnageMt)} MT of ${biggest.category.toLowerCase()} waiting to berth`,
      detail:
        `${biggest.vessels} ${biggest.vessels === 1 ? "vessel" : "vessels"} at Port Qasim's outer ` +
        `anchorage on the ${formatDateShort(pipeline.asOf)} report, waiting ` +
        `${biggest.avgDaysWaiting.toFixed(1)} days on average so far. In all, ` +
        `${formatMt(pipeline.totalTonnageMt)} MT across ${pipeline.totalVessels} vessels is queued.`,
      tickers: [],
    });
  }

  return out;
}
