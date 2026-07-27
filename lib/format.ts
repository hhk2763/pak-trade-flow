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
