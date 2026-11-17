import "server-only";
import { fetchOptionalTable } from "@/lib/data/source";
import type { CoverageRow, VesselCall } from "@/lib/types/database";
import { COUNT_ONLY_STANDARDS, SECTORS, type Sector, type SeriesDef } from "@/lib/sectors";

// Everything here works on vessel_calls: one row per vessel call, tonnage
// counted once. That makes "cargo arrived in a month" a plain sum, which the
// daily-grain commodity_flow table cannot give without double counting.

const CALL_COLUMNS = [
  "visit_key", "port", "source", "ship_name", "arrival_date", "berth_date",
  "last_seen", "status", "commodity_standard", "commodity_category",
  "weight_mt", "balance_mt", "imp_exp", "agent", "loading_port", "next_port",
  "origin_country", "destination_country", "terminal", "wait_days",
  "berth_days", "is_outlier",
].join(",");

export function getVesselCalls(): Promise<VesselCall[]> {
  return fetchOptionalTable<VesselCall>({
    table: "vessel_calls",
    columns: CALL_COLUMNS,
    orderBy: "visit_key",
  });
}

export function getCoverage(): Promise<CoverageRow[]> {
  return fetchOptionalTable<CoverageRow>({ table: "data_coverage", orderBy: "month" });
}

// ---------------------------------------------------------------------------
// Month arithmetic (YYYY-MM strings)
// ---------------------------------------------------------------------------

export function addMonths(month: string, n: number): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7)) - 1 + n;
  const year = y + Math.floor(m / 12);
  const mon = ((m % 12) + 12) % 12;
  return `${year}-${String(mon + 1).padStart(2, "0")}`;
}

function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

function shiftDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Coverage: which port-months can be trusted, and compared with which
// ---------------------------------------------------------------------------

type CoverageIndex = Map<string, CoverageRow>; // key `${port}|${month}`

function indexCoverage(rows: CoverageRow[]): CoverageIndex {
  return new Map(rows.map((r) => [`${r.port}|${r.month}`, r]));
}

function isComplete(cov: CoverageIndex, port: string, month: string): boolean {
  return cov.get(`${port}|${month}`)?.is_complete === 1;
}

/**
 * Ports that can fairly be compared across two months.
 *
 * Port Qasim history goes back to 2019 and is built the same way as today's
 * data. Karachi Port's pre-2026 rows came from a different report (expected
 * arrivals, not tonnage handled), so Karachi is only compared live-to-live.
 */
function comparablePorts(cov: CoverageIndex, a: string, b: string): string[] {
  const ports: string[] = [];
  for (const port of ["PQ", "KPT"]) {
    const ca = cov.get(`${port}|${a}`);
    const cb = cov.get(`${port}|${b}`);
    if (!ca || !cb || ca.is_complete !== 1 || cb.is_complete !== 1) continue;
    if (port === "KPT" && (ca.source !== "live" || cb.source !== "live")) continue;
    ports.push(port);
  }
  return ports;
}

// ---------------------------------------------------------------------------
// Series matching and measurement
// ---------------------------------------------------------------------------

export function matchesSeries(call: VesselCall, series: SeriesDef): boolean {
  if (call.imp_exp !== series.direction) return false;
  if (series.terminals && !series.terminals.includes(call.terminal ?? "")) return false;
  if (
    series.standards.length > 0 &&
    !series.standards.includes((call.commodity_standard ?? "").toUpperCase())
  ) {
    return false;
  }
  return true;
}

/**
 * A call's tonnage, or null when the figure cannot be trusted: outliers (unit
 * errors in the source) and commodities whose volume the ports record
 * inconsistently (LNG, often in cubic metres). Use this wherever tonnes are
 * shown or summed outside a series, so a 148,000 m3 LNG cargo is never
 * presented as 148,000 tonnes.
 */
export function callTonnes(call: VesselCall): number | null {
  if (call.is_outlier) return null;
  if (COUNT_ONLY_STANDARDS.has((call.commodity_standard ?? "").toUpperCase())) return null;
  return call.weight_mt;
}

function measure(call: VesselCall, unit: SeriesDef["unit"]): number {
  if (unit === "calls") return 1;
  // Outliers are unit errors in the source (LNG in cubic metres); they count
  // as a call but contribute no tonnage.
  if (call.is_outlier) return 0;
  return call.weight_mt ?? 0;
}

/** Sums for one series, indexed so repeated lookups do not rescan the table. */
class SeriesIndex {
  private byMonthPort = new Map<string, number>();
  private callsByMonth = new Map<string, number>();
  readonly calls: VesselCall[];

  constructor(allCalls: VesselCall[], readonly series: SeriesDef) {
    this.calls = allCalls.filter((c) => c.arrival_date && matchesSeries(c, series));
    for (const c of this.calls) {
      const month = c.arrival_date!.slice(0, 7);
      const key = `${month}|${c.port}`;
      this.byMonthPort.set(key, (this.byMonthPort.get(key) ?? 0) + measure(c, series.unit));
      this.callsByMonth.set(month, (this.callsByMonth.get(month) ?? 0) + 1);
    }
  }

  value(month: string, ports: string[] = ["PQ", "KPT"]): number {
    return ports.reduce((sum, p) => sum + (this.byMonthPort.get(`${month}|${p}`) ?? 0), 0);
  }

  callCount(month: string): number {
    return this.callsByMonth.get(month) ?? 0;
  }

  /** Arrivals between two dates inclusive, optionally restricted to ports. */
  between(from: string, to: string, ports?: string[]): { value: number; calls: number } {
    let value = 0;
    let calls = 0;
    for (const c of this.calls) {
      const d = c.arrival_date!;
      if (d < from || d > to) continue;
      if (ports && !ports.includes(c.port)) continue;
      value += measure(c, this.series.unit);
      calls += 1;
    }
    return { value, calls };
  }
}

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

export interface MonthPoint {
  month: string;
  value: number;
  calls: number;
  /** False for the current month and for months with missing source reports. */
  complete: boolean;
  /** False when there were no source reports at all that month (a gap, not a zero). */
  observed: boolean;
}

export interface Comparison {
  pct: number | null;
  /** Set when the comparison covers fewer ports than the headline figure. */
  basis: string | null;
}

export interface LineupRow {
  visitKey: string;
  ship: string;
  port: string;
  status: "waiting" | "berthed";
  commodity: string;
  category: string;
  direction: string | null;
  weightMt: number | null;
  balanceMt: number | null;
  origin: string | null;
  terminal: string | null;
  arrivalDate: string | null;
  daysInPort: number | null;
  agent: string | null;
}

export interface SeriesSnapshot {
  series: SeriesDef;
  /** Last fully observed month. */
  lastMonth: string;
  lastMonthValue: number;
  lastMonthCalls: number;
  mom: Comparison;
  yoy: Comparison;
  /** Trailing three complete months against the same three a year earlier. */
  t3mValue: number;
  t3mYoy: Comparison;
  /** Current month so far, against the same number of days last month. */
  mtdMonth: string;
  mtdDays: number;
  mtdValue: number;
  mtdPct: number | null;
  /** Last 7 days of arrivals against the 7 before, and the 4-week average. */
  weekValue: number;
  weekCalls: number;
  prevWeekValue: number;
  avg4wValue: number;
  /** Cargo at anchorage now: the next one to two weeks of arrivals. */
  waitingCalls: number;
  waitingValue: number;
  berthedCalls: number;
  history: MonthPoint[];
}

export interface SectorSnapshot {
  sector: Sector;
  series: SeriesSnapshot[];
}

export interface MarketSnapshot {
  /** Latest report date in the data. */
  asOf: string;
  lastMonth: string;
  hasData: boolean;
  sectors: SectorSnapshot[];
}

function pct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

const PORT_LABEL: Record<string, string> = { PQ: "Port Qasim only", KPT: "Karachi Port only" };
const NO_BASIS = "No like-for-like history yet";
const PARTIAL: Comparison = {
  pct: null,
  basis: "Partial coverage: not compared over time",
};

function compare(
  idx: SeriesIndex,
  cov: CoverageIndex,
  current: string[],
  previous: string[]
): Comparison {
  // A port must be comparable for every month pair to be included.
  let ports = ["PQ", "KPT"];
  current.forEach((m, i) => {
    const ok = comparablePorts(cov, m, previous[i]);
    ports = ports.filter((p) => ok.includes(p));
  });
  if (ports.length === 0) return { pct: null, basis: NO_BASIS };

  const sum = (months: string[], ps: string[]) =>
    months.reduce((s, m) => s + idx.value(m, ps), 0);

  const cur = sum(current, ports);
  const prev = sum(previous, ports);

  if (ports.length === 2) return { pct: pct(cur, prev), basis: null };

  // Comparing on one port only is honest when that port carries most of the
  // cargo. When it does not (crude oil and rice move mainly through Karachi),
  // a Port Qasim-only percentage would describe a sliver and mislead.
  const all = sum(current, ["PQ", "KPT"]);
  if (all > 0 && cur / all < 0.5) return { pct: null, basis: NO_BASIS };
  return { pct: pct(cur, prev), basis: PORT_LABEL[ports[0]] };
}

function daysBetween(later: string, earlier: string): number {
  return Math.round(
    (Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / 86_400_000
  );
}

function latestReportDate(calls: VesselCall[]): string {
  let latest = "";
  for (const c of calls) {
    if (c.source === "live" && c.last_seen && c.last_seen > latest) latest = c.last_seen;
  }
  return latest;
}

/** Latest month both observed in full and not the current one. */
function lastCompleteMonth(cov: CoverageIndex, asOf: string): string {
  let m = addMonths(asOf.slice(0, 7), -1);
  for (let i = 0; i < 24; i += 1) {
    if (isComplete(cov, "PQ", m)) return m;
    m = addMonths(m, -1);
  }
  return addMonths(asOf.slice(0, 7), -1);
}

const HISTORY_START = "2019-06";

function snapshotSeries(
  calls: VesselCall[],
  series: SeriesDef,
  cov: CoverageIndex,
  asOf: string,
  lastMonth: string
): SeriesSnapshot {
  const idx = new SeriesIndex(calls, series);

  const prevMonth = addMonths(lastMonth, -1);
  const yearAgo = addMonths(lastMonth, -12);
  const t3m = [addMonths(lastMonth, -2), prevMonth, lastMonth];
  const t3mPrev = t3m.map((m) => addMonths(m, -12));

  // Month to date against the same number of days of the previous month.
  const mtdMonth = asOf.slice(0, 7);
  const mtdDays = Number(asOf.slice(8, 10));
  const prevMtdMonth = addMonths(mtdMonth, -1);
  const livePorts = ["PQ", "KPT"].filter(
    (p) => cov.get(`${p}|${prevMtdMonth}`)?.source === "live" && isComplete(cov, p, prevMtdMonth)
  );
  const mtd = idx.between(`${mtdMonth}-01`, asOf, livePorts);
  const prevMtd = idx.between(
    `${prevMtdMonth}-01`,
    `${prevMtdMonth}-${String(mtdDays).padStart(2, "0")}`,
    livePorts
  );

  const week = idx.between(shiftDays(asOf, -6), asOf);
  const prevWeek = idx.between(shiftDays(asOf, -13), shiftDays(asOf, -7));
  const fourWeeks = idx.between(shiftDays(asOf, -34), shiftDays(asOf, -7));

  let waitingCalls = 0;
  let waitingValue = 0;
  let berthedCalls = 0;
  for (const c of idx.calls) {
    if (c.source !== "live") continue;
    if (c.status === "waiting") {
      waitingCalls += 1;
      waitingValue += measure(c, series.unit);
    } else if (c.status === "berthed") {
      berthedCalls += 1;
    }
  }

  const currentMonth = asOf.slice(0, 7);
  const history = monthRange(HISTORY_START, currentMonth).map((month) => ({
    month,
    value: idx.value(month),
    calls: idx.callCount(month),
    complete: isComplete(cov, "PQ", month),
    observed: cov.has(`PQ|${month}`) || cov.has(`KPT|${month}`),
  }));

  // A partial count says nothing about direction: "-100% YoY" on diesel was
  // missing reports, not a market that stopped importing.
  const partial = Boolean(series.coverageNote);

  return {
    series,
    lastMonth,
    lastMonthValue: idx.value(lastMonth),
    lastMonthCalls: idx.callCount(lastMonth),
    mom: partial ? PARTIAL : compare(idx, cov, [lastMonth], [prevMonth]),
    yoy: partial ? PARTIAL : compare(idx, cov, [lastMonth], [yearAgo]),
    t3mValue: t3m.reduce((s, m) => s + idx.value(m), 0),
    t3mYoy: partial ? PARTIAL : compare(idx, cov, t3m, t3mPrev),
    mtdMonth,
    mtdDays,
    mtdValue: mtd.value,
    mtdPct: partial ? null : pct(mtd.value, prevMtd.value),
    weekValue: week.value,
    weekCalls: week.calls,
    prevWeekValue: prevWeek.value,
    avg4wValue: fourWeeks.value / 4,
    waitingCalls,
    waitingValue,
    berthedCalls,
    history,
  };
}

export function buildMarketSnapshot(
  calls: VesselCall[],
  coverage: CoverageRow[]
): MarketSnapshot {
  const asOf = latestReportDate(calls);
  if (!asOf) {
    return { asOf: "", lastMonth: "", hasData: false, sectors: [] };
  }
  const cov = indexCoverage(coverage);
  const lastMonth = lastCompleteMonth(cov, asOf);

  return {
    asOf,
    lastMonth,
    hasData: true,
    sectors: SECTORS.map((sector) => ({
      sector,
      series: sector.series.map((s) => snapshotSeries(calls, s, cov, asOf, lastMonth)),
    })),
  };
}

// ---------------------------------------------------------------------------
// Line-up: what is in port right now
// ---------------------------------------------------------------------------

function toLineupRow(c: VesselCall, asOf: string): LineupRow {
  return {
    visitKey: c.visit_key,
    ship: cleanShipName(c.ship_name),
    port: c.port,
    status: c.status === "waiting" ? "waiting" : "berthed",
    commodity: titleCase(c.commodity_standard ?? "Unknown"),
    category: c.commodity_category ?? "Other",
    direction: c.imp_exp,
    weightMt: callTonnes(c),
    balanceMt: callTonnes(c) == null ? null : c.balance_mt,
    origin: c.imp_exp === "Export" ? c.destination_country : c.origin_country,
    terminal: c.terminal,
    arrivalDate: c.arrival_date,
    daysInPort: c.arrival_date ? Math.max(0, daysBetween(asOf, c.arrival_date)) : null,
    agent: c.agent,
  };
}

export function getLineup(calls: VesselCall[], series?: SeriesDef): LineupRow[] {
  const asOf = latestReportDate(calls);
  return calls
    .filter(
      (c) =>
        c.source === "live" &&
        (c.status === "waiting" || c.status === "berthed") &&
        (!series || matchesSeries(c, series))
    )
    .map((c) => toLineupRow(c, asOf))
    .sort(
      (a, b) =>
        a.status.localeCompare(b.status) * -1 || // waiting first
        (b.weightMt ?? 0) - (a.weightMt ?? 0)
    );
}

// ---------------------------------------------------------------------------
// Port arrivals (sidebar): the same per-call counting as every other figure
// ---------------------------------------------------------------------------

export interface PortArrivals {
  port: string;
  calls: number;
  importMt: number;
  exportMt: number;
}

export interface ArrivalsWindow {
  from: string;
  to: string;
  ports: PortArrivals[];
}

/**
 * Cargo that arrived at each port over the last `days` days, counted once per
 * vessel call. Replaces the old sidebar figure, which summed daily tonnage
 * handled since March 2026 from commodity_flow with no period shown, and so
 * disagreed with every other number on the site.
 */
export function getPortArrivals(calls: VesselCall[], days = 30): ArrivalsWindow | null {
  const to = latestReportDate(calls);
  if (!to) return null;
  const from = shiftDays(to, -(days - 1));
  const byPort = new Map<string, PortArrivals>();
  for (const port of ["KPT", "PQ"]) {
    byPort.set(port, { port, calls: 0, importMt: 0, exportMt: 0 });
  }
  for (const c of calls) {
    if (!c.arrival_date || c.arrival_date < from || c.arrival_date > to) continue;
    const entry = byPort.get(c.port);
    if (!entry) continue;
    entry.calls += 1;
    const t = callTonnes(c) ?? 0;
    if (c.imp_exp === "Import") entry.importMt += t;
    else if (c.imp_exp === "Export") entry.exportMt += t;
  }
  return { from, to, ports: Array.from(byPort.values()) };
}

// ---------------------------------------------------------------------------
// Recent calls and origin mix (sector detail pages)
// ---------------------------------------------------------------------------

export interface RecentCall {
  visitKey: string;
  ship: string;
  port: string;
  arrivalDate: string;
  commodity: string;
  weightMt: number | null;
  counterparty: string | null;
  terminal: string | null;
  agent: string | null;
  status: string | null;
}

export function getRecentCalls(
  calls: VesselCall[],
  series: SeriesDef,
  limit = 20
): RecentCall[] {
  return calls
    .filter((c) => c.arrival_date && matchesSeries(c, series))
    .sort((a, b) => b.arrival_date!.localeCompare(a.arrival_date!))
    .slice(0, limit)
    .map((c) => ({
      visitKey: c.visit_key,
      ship: cleanShipName(c.ship_name),
      port: c.port,
      arrivalDate: c.arrival_date!,
      commodity: titleCase(c.commodity_standard ?? "Unknown"),
      weightMt: callTonnes(c),
      counterparty: series.direction === "Export" ? c.destination_country : c.origin_country,
      terminal: c.terminal,
      agent: c.agent,
      status: c.status,
    }));
}

export interface MixSlice {
  name: string;
  value: number;
  sharePct: number;
}

/** Where the cargo came from (imports) or went to (exports), trailing 12 months. */
export function getCounterpartyMix(
  calls: VesselCall[],
  series: SeriesDef,
  asOf: string,
  top = 6
): MixSlice[] {
  const from = shiftDays(asOf, -365);
  const totals = new Map<string, number>();
  for (const c of calls) {
    if (!c.arrival_date || c.arrival_date < from || !matchesSeries(c, series)) continue;
    const name =
      (series.direction === "Export" ? c.destination_country : c.origin_country) ??
      "Not reported";
    totals.set(name, (totals.get(name) ?? 0) + measure(c, series.unit));
  }
  const total = Array.from(totals.values()).reduce((s, v) => s + v, 0);
  if (total <= 0) return [];

  const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const head = sorted.slice(0, top);
  const rest = sorted.slice(top).reduce((s, [, v]) => s + v, 0);
  if (rest > 0) head.push(["Other", rest]);
  return head.map(([name, value]) => ({ name, value, sharePct: (value / total) * 100 }));
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** "M.V- TAI STAR" -> "Tai Star". The prefix is noise; the type is in the cargo. */
export function cleanShipName(raw: string | null): string {
  if (!raw) return "Unknown";
  const stripped = raw.replace(/^\s*M\.?\s?[VT]\.?\s*[-.]?\s*/i, "").replace(/\.+$/, "");
  return titleCase(stripped.trim() || raw);
}

export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^|[\s\-/(.])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/\b(Lng|Lpg|Dap|Hsfo|Lsfo|Edc|Vcm|Meg|Hsd|Pta)\b/g, (m) => m.toUpperCase());
}
