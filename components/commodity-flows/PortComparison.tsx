import { formatMt } from "@/lib/format";
import type { PortComparison as PortComparisonData } from "@/lib/data/commodityFlow";

const PORT_NAMES: Record<string, string> = {
  PQ: "Port Qasim",
  KPT: "Karachi Port Trust",
};

export function PortComparison({ data }: { data: PortComparisonData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
      {data.map((port) => {
        const total = port.importCount + port.exportCount || 1;
        const importSharePct = (port.importCount / total) * 100;
        return (
          <div
            key={port.port}
            className="bg-surface-container-lowest p-lg rounded-xl shadow-sm flex flex-col gap-md"
          >
            <div className="flex items-baseline justify-between">
              <h4 className="font-headline-sm text-headline-sm">
                {PORT_NAMES[port.port] ?? port.port}
              </h4>
              <span className="font-label-caps text-label-caps text-outline uppercase">
                {port.port}
              </span>
            </div>
            <div className="flex w-full h-3 rounded-full overflow-hidden bg-surface-container-high">
              <div className="bg-secondary h-full" style={{ width: `${importSharePct}%` }} />
              <div className="bg-primary h-full" style={{ width: `${100 - importSharePct}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-sm">
              <div>
                <p className="font-data-tabular text-data-tabular text-secondary">
                  {port.importCount.toLocaleString()} calls
                </p>
                <p className="font-label-caps text-label-caps text-outline uppercase">
                  Import · {formatMt(port.importMt)} MT
                </p>
              </div>
              <div className="text-right">
                <p className="font-data-tabular text-data-tabular text-on-surface">
                  {port.exportCount.toLocaleString()} calls
                </p>
                <p className="font-label-caps text-label-caps text-outline uppercase">
                  Export · {formatMt(port.exportMt)} MT
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
