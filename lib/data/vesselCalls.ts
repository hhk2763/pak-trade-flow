import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import type { VesselCallRow } from "@/lib/types/database";
import { SIGNAL_THEMES, type SignalTheme } from "@/lib/psxExposure";

// vessel_calls is one row per ship visit and cargo line (built nightly by the
// ship-codex ETL). Unlike commodity_flow's daily snapshots, its tonnage_mt is
// the call's manifest, so summing it over calls neither double-counts a vessel
// that sat at berth for a week nor drops berths that never report a 24h figure.

const PAGE_SIZE = 1000;

async function fetchAllVesselCalls(): Promise<VesselCallRow[]> {
  const rows: VesselCallRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseServer
      .from("vessel_calls")
      .select("*")
      .order("port")
      .order("call_id")
      .order("commodity")
      .order("imp_exp")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to fetch vessel_calls: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

export const getAllVesselCalls = unstable_cache(
  fetchAllVesselCalls,
  ["vessel-calls-all"],
  { revalidate: 3600, tags: ["vessel-calls"] }
);

const DAY_MS = 86_400_000;

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * The latest report date each port has published, and the date both have
 * reached. Windows end on the common date: PQ and KPT publish on different
 * days, and a window ending past one port's last report would read as a drop.
 */
export function getAsOf(calls: VesselCallRow[]): { byPort: Record<string, string>; common: string } {
  const byPort: Record<string, string> = {};
  for (const c of calls) {
    if (!byPort[c.port] || c.last_seen > byPort[c.port]) byPort[c.port] = c.last_seen;
  }
  const dates = Object.values(byPort).sort();
  return { byPort, common: dates[0] ?? "" };
}

// ---------------------------------------------------------------------------
// Incoming cargo: what is waiting at anchorage right now (PQ publishes the
// anchorage list; KPT's daily statement covers berths only).
// ---------------------------------------------------------------------------

export interface WaitingVessel {
  callId: string;
  shipName: string;
  commodity: string;
  category: string;
  impExp: string;
  tonnageMt: number | null;
  quantityUnit: string | null;
  terminal: string | null;
  originPort: string | null;
  agent: string | null;
  arrived: string;
  daysWaiting: number;
}

export interface WaitingByCategory {
  category: string;
  vessels: number;
  tonnageMt: number;
  avgDaysWaiting: number;
}

export interface IncomingPipeline {
  asOf: string;
  vessels: WaitingVessel[];
  byCategory: WaitingByCategory[];
  totalVessels: number;
  totalTonnageMt: number;
  importTonnageMt: number;
  exportTonnageMt: number;
}

export function getIncomingPipeline(calls: VesselCallRow[]): IncomingPipeline {
  const asOf = getAsOf(calls).byPort.PQ ?? "";
  const waiting = calls.filter((c) => c.status === "at_anchorage");

  const vessels: WaitingVessel[] = waiting
    .map((c) => {
      const arrived = c.anchorage_arrived ?? c.first_seen;
      return {
        callId: c.call_id,
        shipName: c.ship_name ?? "Unknown vessel",
        commodity: c.commodity_standard ?? c.commodity,
        category: c.commodity_category ?? "Other",
        impExp: c.imp_exp,
        tonnageMt: c.tonnage_mt,
        quantityUnit: c.quantity_unit,
        terminal: c.terminal,
        originPort: c.origin_port,
        agent: c.agent,
        arrived,
        daysWaiting: daysBetween(arrived, asOf),
      };
    })
    .sort((a, b) => (b.tonnageMt ?? 0) - (a.tonnageMt ?? 0));

  const groups = new Map<string, WaitingVessel[]>();
  for (const v of vessels) groups.set(v.category, [...(groups.get(v.category) ?? []), v]);
  const byCategory = Array.from(groups.entries())
    .map(([category, vs]) => ({
      category,
      // A call carrying two cargoes is one vessel.
      vessels: new Set(vs.map((v) => v.callId)).size,
      tonnageMt: vs.reduce((s, v) => s + (v.tonnageMt ?? 0), 0),
      avgDaysWaiting: vs.reduce((s, v) => s + v.daysWaiting, 0) / vs.length,
    }))
    .sort((a, b) => b.tonnageMt - a.tonnageMt);

  const sum = (dir?: string) =>
    vessels.filter((v) => !dir || v.impExp === dir).reduce((s, v) => s + (v.tonnageMt ?? 0), 0);

  return {
    asOf,
    vessels,
    byCategory,
    totalVessels: new Set(vessels.map((v) => v.callId)).size,
    totalTonnageMt: sum(),
    importTonnageMt: sum("Import"),
    exportTonnageMt: sum("Export"),
  };
}

// ---------------------------------------------------------------------------
// Congestion: how long vessels waited at anchorage before berthing (PQ).
// ---------------------------------------------------------------------------

export interface TerminalCongestion {
  terminal: string;
  medianWaitDays: number;
  priorMedianWaitDays: number | null;
  calls: number;
  waitingNow: number;
}

export function getCongestion(calls: VesselCallRow[], windowDays = 28): TerminalCongestion[] {
  const asOf = getAsOf(calls).byPort.PQ ?? "";
  const start = addDays(asOf, -windowDays + 1);
  const priorStart = addDays(asOf, -2 * windowDays + 1);

  const recent = new Map<string, number[]>();
  const prior = new Map<string, number[]>();
  const seen = new Set<string>();
  for (const c of calls) {
    if (c.port !== "PQ" || c.wait_days == null || !c.berthed_on || !c.terminal) continue;
    // One wait per call, not per cargo line.
    if (seen.has(c.call_id)) continue;
    seen.add(c.call_id);
    const bucket = c.berthed_on >= start ? recent : c.berthed_on >= priorStart ? prior : null;
    if (!bucket) continue;
    bucket.set(c.terminal, [...(bucket.get(c.terminal) ?? []), c.wait_days]);
  }

  const waitingNow = new Map<string, Set<string>>();
  for (const c of calls) {
    if (c.status !== "at_anchorage") continue;
    const t = c.terminal ?? "Unassigned";
    waitingNow.set(t, (waitingNow.get(t) ?? new Set()).add(c.call_id));
  }

  return Array.from(recent.entries())
    .filter(([, waits]) => waits.length >= 3)
    .map(([terminal, waits]) => ({
      terminal,
      medianWaitDays: median(waits) ?? 0,
      priorMedianWaitDays: median(prior.get(terminal) ?? []),
      calls: waits.length,
      waitingNow: waitingNow.get(terminal)?.size ?? 0,
    }))
    .sort((a, b) => b.medianWaitDays - a.medianWaitDays);
}

// ---------------------------------------------------------------------------
// Signals: trade flows mapped to the listed companies they bear on.
// ---------------------------------------------------------------------------

export interface ThemeSignal {
  theme: SignalTheme;
  windowDays: number;
  periodStart: string;
  periodEnd: string;
  tonnageMt: number;
  priorTonnageMt: number;
  changePct: number | null;
  calls: number;
  priorCalls: number;
  waitingTonnageMt: number;
  waitingVessels: number;
  medianWaitDays: number | null;
}

function inTheme(c: VesselCallRow, theme: SignalTheme): boolean {
  if (theme.direction && c.imp_exp !== theme.direction) return false;
  if (theme.terminal && c.terminal !== theme.terminal) return false;
  return theme.commodities.includes((c.commodity_standard ?? "").toUpperCase());
}

export function getThemeSignals(calls: VesselCallRow[], windowDays = 28): ThemeSignal[] {
  const periodEnd = getAsOf(calls).common;
  const periodStart = addDays(periodEnd, -windowDays + 1);
  const priorStart = addDays(periodEnd, -2 * windowDays + 1);

  return SIGNAL_THEMES.map((theme) => {
    const matched = calls.filter((c) => inTheme(c, theme));
    const recent = matched.filter(
      (c) => c.berthed_on && c.berthed_on >= periodStart && c.berthed_on <= periodEnd
    );
    const prior = matched.filter(
      (c) => c.berthed_on && c.berthed_on >= priorStart && c.berthed_on < periodStart
    );
    const waiting = matched.filter((c) => c.status === "at_anchorage");
    const tonnage = (rows: VesselCallRow[]) => rows.reduce((s, c) => s + (c.tonnage_mt ?? 0), 0);
    const callCount = (rows: VesselCallRow[]) => new Set(rows.map((c) => c.call_id)).size;

    const tonnageMt = tonnage(recent);
    const priorTonnageMt = tonnage(prior);
    return {
      theme,
      windowDays,
      periodStart,
      periodEnd,
      tonnageMt,
      priorTonnageMt,
      changePct: pctChange(tonnageMt, priorTonnageMt),
      calls: callCount(recent),
      priorCalls: callCount(prior),
      waitingTonnageMt: tonnage(waiting),
      waitingVessels: callCount(waiting),
      // One wait per call, not per cargo line.
      medianWaitDays: median(
        Array.from(
          new Map(
            recent.filter((c) => c.wait_days != null).map((c) => [c.call_id, c.wait_days as number])
          ).values()
        )
      ),
    };
  });
}
