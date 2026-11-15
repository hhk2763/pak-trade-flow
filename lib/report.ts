import type { LineupRow, MarketSnapshot, SeriesSnapshot } from "@/lib/data/vesselCalls";
import { formatMeasure, formatMonth, formatPct } from "@/lib/format";

// The weekly note's talking points. Every sentence is assembled in code from
// computed figures: nothing here is written by a language model, so a number
// in the note can always be traced to the table beneath it.

export interface Takeaway {
  headline: string;
  detail: string;
}

// Below this a week-on-week percentage is noise from one vessel more or less.
const MIN_WEEKLY_MT = 20_000;
const MIN_MOVE_PCT = 25;
const MAX_HEADLINE_PCT = 300;

function pct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export function buildTakeaways(market: MarketSnapshot, lineup: LineupRow[]): Takeaway[] {
  const series = market.sectors.flatMap((s) => s.series).filter((s) => s.series.unit === "mt");
  // The terminal series repeats coal; keep it out of the commentary.
  const flows = series.filter((s) => !s.series.terminals);
  const out: Takeaway[] = [];

  const movers = flows
    .map((s) => ({ s, change: pct(s.weekValue, s.avg4wValue) }))
    .filter(
      (m): m is { s: SeriesSnapshot; change: number } =>
        m.change != null &&
        Math.abs(m.change) >= MIN_MOVE_PCT &&
        // Both sides must be real volume: "0 MT, -100%" is one vessel that
        // did not arrive this week, not a trend.
        Math.min(m.s.weekValue, m.s.avg4wValue) >= MIN_WEEKLY_MT
    )
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  const up = movers.find((m) => m.change > 0);
  const down = movers.find((m) => m.change < 0);
  for (const m of [up, down]) {
    if (!m) continue;
    out.push({
      headline: `${m.s.series.label} ${m.change > 0 ? "ran ahead of" : "fell short of"} trend`,
      detail: `${formatMeasure(m.s.weekValue, "mt")} arrived in the last seven days across ${
        m.s.weekCalls
      } vessel call${m.s.weekCalls === 1 ? "" : "s"}, ${formatPct(m.change)} against the four-week average of ${formatMeasure(
        m.s.avg4wValue,
        "mt"
      )}.`,
    });
  }

  const queue = [...flows]
    .filter((s) => s.series.direction === "Import" && s.waitingValue > 0)
    .sort((a, b) => b.waitingValue - a.waitingValue)[0];
  if (queue) {
    const totalWaiting = lineup
      .filter((r) => r.status === "waiting" && r.direction === "Import")
      .reduce((sum, r) => sum + (r.weightMt ?? 0), 0);
    out.push({
      headline: `${queue.series.label.replace(/ imports$/i, "")} leads the anchorage queue`,
      detail: `${queue.waitingCalls} vessel${queue.waitingCalls === 1 ? "" : "s"} carrying ${formatMeasure(
        queue.waitingValue,
        "mt"
      )} are waiting for a berth, out of ${formatMeasure(
        totalWaiting,
        "mt"
      )} of import cargo at anchorage. This is volume that lands over the next fortnight.`,
    });
  }

  const mtd = flows
    .filter(
      (s) =>
        s.mtdPct != null &&
        Math.abs(s.mtdPct) <= MAX_HEADLINE_PCT &&
        s.mtdValue >= MIN_WEEKLY_MT
    )
    .sort((a, b) => Math.abs(b.mtdPct!) - Math.abs(a.mtdPct!))[0];
  if (mtd) {
    out.push({
      headline: `${formatMonth(mtd.mtdMonth)} to date: ${mtd.series.label.toLowerCase()} ${
        mtd.mtdPct! >= 0 ? "ahead" : "behind"
      }`,
      detail: `${formatMeasure(mtd.mtdValue, "mt")} in the first ${mtd.mtdDays} days, ${formatPct(
        mtd.mtdPct
      )} against the same days of the previous month.`,
    });
  }

  const yoy = flows
    // A move beyond +/-300% is a low base a year ago, not a story.
    .filter(
      (s) =>
        s.yoy.pct != null &&
        Math.abs(s.yoy.pct) <= MAX_HEADLINE_PCT &&
        s.lastMonthValue >= MIN_WEEKLY_MT
    )
    .sort((a, b) => Math.abs(b.yoy.pct!) - Math.abs(a.yoy.pct!))[0];
  if (yoy) {
    out.push({
      headline: `${yoy.series.label}: largest year-on-year move in ${formatMonth(yoy.lastMonth)}`,
      detail: `${formatMeasure(yoy.lastMonthValue, "mt")} in the month, ${formatPct(
        yoy.yoy.pct
      )} on a year earlier${yoy.yoy.basis ? ` (${yoy.yoy.basis})` : ""}.`,
    });
  }

  return out;
}
