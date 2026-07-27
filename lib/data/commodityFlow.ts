import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import type { CommodityFlowRow } from "@/lib/types/database";
import { categoryImportKey, categoryExportKey, formatDateRange } from "@/lib/format";

const PAGE_SIZE = 1000;

/**
 * PostgREST caps responses at 1,000 rows per request, and commodity_flow
 * grows daily via the user's ETL pipeline — so this paginates until a page
 * comes back short rather than assuming a fixed row count.
 */
async function fetchAllCommodityFlowRows(): Promise<CommodityFlowRow[]> {
  const rows: CommodityFlowRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseServer
      .from("commodity_flow")
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to fetch commodity_flow: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

// Revalidated hourly: the underlying ETL only refreshes once a day, but this
// keeps the site responsive to same-day corrections without querying on
// every request.
export const getAllCommodityFlow = unstable_cache(
  fetchAllCommodityFlowRows,
  ["commodity-flow-all"],
  { revalidate: 3600, tags: ["commodity-flow"] }
);

// commodity_flow.weight_24h_mt is only populated for ~33% of PQ rows (KPT is
// 100%). Every aggregate below sums weight_24h_mt treating missing values as
// 0 — the same methodology already validated in site.txt's headline numbers
// (e.g. Coal ~2.78M MT) — rather than falling back to weight_mt, which
// double-counts vessels reported across multiple berthed days.
function weight24h(row: CommodityFlowRow): number {
  return row.weight_24h_mt ?? 0;
}

export interface CategoryTotal {
  category: string;
  totalMt: number;
}

export function getCategoryTotals(
  rows: CommodityFlowRow[],
  opts: { port?: string } = {}
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (opts.port && row.port !== opts.port) continue;
    const category = row.commodity_category ?? "Unknown";
    totals.set(category, (totals.get(category) ?? 0) + weight24h(row));
  }
  return Array.from(totals.entries())
    .map(([category, totalMt]) => ({ category, totalMt }))
    .sort((a, b) => b.totalMt - a.totalMt);
}

export interface PortComparison {
  port: string;
  importCount: number;
  exportCount: number;
  importMt: number;
  exportMt: number;
}

export function getPortComparison(rows: CommodityFlowRow[]): PortComparison[] {
  const byPort = new Map<string, PortComparison>();
  for (const row of rows) {
    const entry = byPort.get(row.port) ?? {
      port: row.port,
      importCount: 0,
      exportCount: 0,
      importMt: 0,
      exportMt: 0,
    };
    if (row.imp_exp === "Import") {
      entry.importCount += 1;
      entry.importMt += weight24h(row);
    } else if (row.imp_exp === "Export") {
      entry.exportCount += 1;
      entry.exportMt += weight24h(row);
    }
    byPort.set(row.port, entry);
  }
  return Array.from(byPort.values()).sort((a, b) => a.port.localeCompare(b.port));
}

export interface TerminalBreakdown {
  terminal: string;
  count: number;
}

export function getTerminalBreakdown(
  rows: CommodityFlowRow[],
  port: string
): TerminalBreakdown[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.port !== port) continue;
    const terminal = row.terminal && row.terminal !== "nan" ? row.terminal : "Not recorded";
    counts.set(terminal, (counts.get(terminal) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([terminal, count]) => ({ terminal, count }))
    .sort((a, b) => b.count - a.count);
}

export function getRecentShipments(
  rows: CommodityFlowRow[],
  limit = 8
): CommodityFlowRow[] {
  return [...rows]
    .sort((a, b) => {
      const dateDiff = b.report_date.localeCompare(a.report_date);
      if (dateDiff !== 0) return dateDiff;
      return b.id - a.id;
    })
    .slice(0, limit);
}

export interface HeroKpis {
  // totalImportMt/totalExportMt cover the trailing 7 days ending on
  // latestReportDate (periodStartDate..latestReportDate) — NOT all-time —
  // so they read consistently with the WoW/MoM comparisons shown next to them.
  totalImportMt: number;
  totalExportMt: number;
  importWoWPct: number | null;
  exportWoWPct: number | null;
  // MoM compares this same trailing-7-day window to the equivalent 7-day
  // window 4 weeks back, so it's an apples-to-apples same-length comparison
  // rather than mixing a weekly total against a full month's total.
  importMoMPct: number | null;
  exportMoMPct: number | null;
  latestReportDate: string;
  periodStartDate: string;
}

function sumWeight(rows: CommodityFlowRow[]): { importMt: number; exportMt: number } {
  let importMt = 0;
  let exportMt = 0;
  for (const row of rows) {
    if (row.imp_exp === "Import") importMt += weight24h(row);
    else if (row.imp_exp === "Export") exportMt += weight24h(row);
  }
  return { importMt, exportMt };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function getHeroKpis(rows: CommodityFlowRow[]): HeroKpis {
  const dates = rows.map((r) => r.report_date).sort();
  const latestReportDate = dates[dates.length - 1] ?? "";

  const latest = new Date(latestReportDate);
  const periodStart = new Date(latest);
  periodStart.setDate(periodStart.getDate() - 6);
  const weekAgo = new Date(latest);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(latest);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const fourWeeksAgo = new Date(latest);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const fiveWeeksAgo = new Date(latest);
  fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 35);

  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  const thisWeek = rows.filter((r) => r.report_date > toISO(weekAgo));
  const lastWeek = rows.filter(
    (r) => r.report_date > toISO(twoWeeksAgo) && r.report_date <= toISO(weekAgo)
  );
  const monthAgoWeek = rows.filter(
    (r) => r.report_date > toISO(fiveWeeksAgo) && r.report_date <= toISO(fourWeeksAgo)
  );

  const thisWeekSum = sumWeight(thisWeek);
  const lastWeekSum = sumWeight(lastWeek);
  const monthAgoWeekSum = sumWeight(monthAgoWeek);

  return {
    totalImportMt: thisWeekSum.importMt,
    totalExportMt: thisWeekSum.exportMt,
    importWoWPct: pctChange(thisWeekSum.importMt, lastWeekSum.importMt),
    exportWoWPct: pctChange(thisWeekSum.exportMt, lastWeekSum.exportMt),
    importMoMPct: pctChange(thisWeekSum.importMt, monthAgoWeekSum.importMt),
    exportMoMPct: pctChange(thisWeekSum.exportMt, monthAgoWeekSum.exportMt),
    latestReportDate,
    periodStartDate: toISO(periodStart),
  };
}

export interface DailyTrendPoint {
  date: string;
  importMt: number;
  exportMt: number;
  // plus `${category}__Import` / `${category}__Export` per category — see
  // categoryImportKey/categoryExportKey in lib/format.ts
  [key: string]: string | number;
}

// One point per report_date with import/export totals, plus a per-category
// Import/Export split, so the client can toggle between "all categories" and
// a single category while always keeping the import/export direction visible.
export function getDailyTrendDetailed(rows: CommodityFlowRow[]): DailyTrendPoint[] {
  const byDate = new Map<string, DailyTrendPoint>();
  for (const row of rows) {
    const point = byDate.get(row.report_date) ?? {
      date: row.report_date,
      importMt: 0,
      exportMt: 0,
    };
    const w = weight24h(row);
    const category = row.commodity_category ?? "Unknown";

    if (row.imp_exp === "Import") {
      point.importMt = (point.importMt as number) + w;
      const key = categoryImportKey(category);
      point[key] = ((point[key] as number) ?? 0) + w;
    } else if (row.imp_exp === "Export") {
      point.exportMt = (point.exportMt as number) + w;
      const key = categoryExportKey(category);
      point[key] = ((point[key] as number) ?? 0) + w;
    }

    byDate.set(row.report_date, point);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// The input to the AI weekly briefing. Every figure the generated prose is
// allowed to state comes from here — the model is given this object and is
// never asked to compute anything, so the briefing can be validated back
// against it before it goes out by email (see lib/ai/briefing.ts).
export interface BriefingFacts {
  // Pre-formatted so the model copies the date range verbatim instead of
  // reformatting (and potentially mis-stating) it.
  periodLabel: string;
  periodStartDate: string;
  latestReportDate: string;
  totalImportMt: number;
  totalExportMt: number;
  importWoWPct: number | null;
  exportWoWPct: number | null;
  importMoMPct: number | null;
  exportMoMPct: number | null;
  topCategories: CategoryTotal[];
  ports: PortComparison[];
  // Non-null only when partial weight_24h_mt coverage in this window is large
  // enough to matter. The prompt tells the model to mention undercounting only
  // when this is flagged, so the judgement stays in code, not in the model.
  coverageWarning: string | null;
}

const TOP_CATEGORY_COUNT = 3;
// Below this, the caveat is noise rather than useful context.
const COVERAGE_WARNING_THRESHOLD_PCT = 15;

export function buildBriefingFacts(rows: CommodityFlowRow[]): BriefingFacts {
  const kpis = getHeroKpis(rows);

  // Same trailing-7-day window getHeroKpis used, so the narrative figures and
  // the WoW/MoM percentages describe exactly the same set of shipments.
  const weekRows = rows.filter(
    (r) =>
      r.report_date >= kpis.periodStartDate && r.report_date <= kpis.latestReportDate
  );

  const topCategories = getCategoryTotals(weekRows)
    .filter((c) => c.totalMt > 0)
    .slice(0, TOP_CATEGORY_COUNT);

  const pqRows = weekRows.filter((r) => r.port === "PQ");
  const pqMissing = pqRows.filter((r) => r.weight_24h_mt === null).length;
  const missingPct = pqRows.length > 0 ? (pqMissing / pqRows.length) * 100 : 0;

  const coverageWarning =
    missingPct >= COVERAGE_WARNING_THRESHOLD_PCT
      ? `${Math.round(missingPct)}% of Port Qasim records in this period have no 24-hour tonnage reported, so import totals are a floor, not a complete count.`
      : null;

  return {
    periodLabel: formatDateRange(kpis.periodStartDate, kpis.latestReportDate),
    periodStartDate: kpis.periodStartDate,
    latestReportDate: kpis.latestReportDate,
    totalImportMt: kpis.totalImportMt,
    totalExportMt: kpis.totalExportMt,
    importWoWPct: kpis.importWoWPct,
    exportWoWPct: kpis.exportWoWPct,
    importMoMPct: kpis.importMoMPct,
    exportMoMPct: kpis.exportMoMPct,
    topCategories,
    ports: getPortComparison(weekRows),
    coverageWarning,
  };
}
