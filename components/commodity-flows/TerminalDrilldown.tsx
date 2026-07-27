import type { TerminalBreakdown } from "@/lib/data/commodityFlow";

export function TerminalDrilldown({ data }: { data: TerminalBreakdown[] }) {
  const total = data.reduce((sum, t) => sum + t.count, 0) || 1;
  const notRecorded = data.find((t) => t.terminal === "Not recorded");
  const known = data.filter((t) => t.terminal !== "Not recorded");
  const max = Math.max(...data.map((t) => t.count), 1);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-lg">
      <div className="flex items-center justify-between mb-md">
        <h3 className="font-headline-md text-headline-md">PQ Terminal Breakdown</h3>
        <span className="font-label-caps text-label-caps text-outline uppercase">
          {total.toLocaleString()} rows
        </span>
      </div>
      {notRecorded && (
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
          {notRecorded.count.toLocaleString()} of {total.toLocaleString()} PQ rows (
          {Math.round((notRecorded.count / total) * 100)}%) have no terminal recorded —
          figures below cover only rows with a known terminal.
        </p>
      )}
      <div className="space-y-sm">
        {known.map((t) => (
          <div key={t.terminal} className="flex items-center gap-md">
            <span className="font-body-md text-body-md w-20 shrink-0">{t.terminal}</span>
            <div className="flex-1 h-2.5 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full"
                style={{ width: `${(t.count / max) * 100}%` }}
              />
            </div>
            <span className="font-data-tabular text-data-tabular w-14 text-right shrink-0">
              {t.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
