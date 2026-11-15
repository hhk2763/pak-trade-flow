export function formatMt(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateRange(startDateStr: string, endDateStr: string): string {
  const end = new Date(`${endDateStr}T00:00:00Z`);
  const year = end.toLocaleDateString("en-US", { year: "numeric", timeZone: "UTC" });
  return `${formatDateShort(startDateStr)}–${formatDateShort(endDateStr)}, ${year}`;
}

// Shared with lib/data/commodityFlow.ts's getDailyTrendDetailed — kept in
// this client-safe module (not the server-only data layer) since the trend
// chart is a Client Component and needs these key names too.
export function categoryImportKey(category: string): string {
  return `${category}__Import`;
}

export function categoryExportKey(category: string): string {
  return `${category}__Export`;
}

// 1,118,951 -> "1.12M", 765,300 -> "765K". Tonnage tiles and axis labels.
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${Math.round(value / 1_000)}K`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.round(value).toLocaleString("en-US");
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2026-10" -> "Oct 2026"
export function formatMonth(month: string): string {
  if (!month) return "";
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

// "2026-10" -> "Oct '26"
export function formatMonthShort(month: string): string {
  if (!month) return "";
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} '${month.slice(2, 4)}`;
}

// A series is measured either in tonnes or in cargo count (see lib/sectors.ts).
export function formatMeasure(value: number, unit: "mt" | "calls"): string {
  if (unit === "calls") {
    const n = Math.round(value * 10) / 10;
    return `${n.toLocaleString("en-US")} ${n === 1 ? "cargo" : "cargoes"}`;
  }
  return `${formatCompact(value)} MT`;
}

export function formatPct(pct: number | null): string {
  if (pct == null) return "n/a";
  // Beyond 500% the comparison is against a near-empty base; the exact figure
  // carries no information and reads as a mistake.
  if (pct > 500) return ">+500%";
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
