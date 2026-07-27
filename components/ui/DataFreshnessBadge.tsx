function formatDate(dateStr: string): string {
  if (!dateStr) return "unknown";
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function DataFreshnessBadge({ latestReportDate }: { latestReportDate: string }) {
  return (
    <div className="flex items-center gap-sm bg-surface-container-low px-md py-xs rounded-full">
      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
        Data as of {formatDate(latestReportDate)}
      </span>
    </div>
  );
}
