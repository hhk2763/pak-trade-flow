import type { TerminalCongestion } from "@/lib/data/vesselCalls";

function days(value: number): string {
  return `${value.toFixed(1)}d`;
}

export function CongestionTable({ rows, windowDays }: { rows: TerminalCongestion[]; windowDays: number }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col">
      <h3 className="font-headline-md text-headline-md">Anchorage Wait by Terminal</h3>
      <p className="font-body-md text-body-md text-on-surface-variant mt-xs mb-md">
        Median days from arriving at anchorage to berthing, vessels berthed in the last{" "}
        {windowDays} days vs the {windowDays} before. Waiting time is demurrage cost.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-label-caps text-label-caps text-outline uppercase border-b border-outline-variant">
              <th className="py-sm px-md font-normal">Terminal</th>
              <th className="py-sm px-md font-normal text-right">Median wait</th>
              <th className="py-sm px-md font-normal text-right">Previous</th>
              <th className="py-sm px-md font-normal text-right">Calls</th>
              <th className="py-sm px-md font-normal text-right">Waiting now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const worse =
                r.priorMedianWaitDays != null && r.medianWaitDays > r.priorMedianWaitDays;
              return (
                <tr key={r.terminal} className="border-b border-outline-variant/30">
                  <td className="py-sm px-md font-body-md text-body-md font-bold text-on-surface">
                    {r.terminal}
                  </td>
                  <td
                    className={`py-sm px-md text-right font-data-tabular text-data-tabular ${
                      worse ? "text-error" : "text-on-surface"
                    }`}
                  >
                    {days(r.medianWaitDays)}
                  </td>
                  <td className="py-sm px-md text-right font-data-tabular text-data-tabular text-on-surface-variant">
                    {r.priorMedianWaitDays != null ? days(r.priorMedianWaitDays) : "—"}
                  </td>
                  <td className="py-sm px-md text-right font-data-tabular text-data-tabular text-on-surface-variant">
                    {r.calls}
                  </td>
                  <td className="py-sm px-md text-right font-data-tabular text-data-tabular text-on-surface-variant">
                    {r.waitingNow}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant py-md">
          Not enough berthings in the window to compare.
        </p>
      )}
    </div>
  );
}
