import { formatMt, formatDateShort } from "@/lib/format";
import type { CommodityFlowRow } from "@/lib/types/database";

const CATEGORY_ICONS: Record<string, string> = {
  Coal: "mode_heat",
  Petroleum: "oil_barrel",
  "LPG / LNG": "local_gas_station",
  Oilseeds: "grass",
  "Edible Oil": "water_drop",
  Containers: "inventory_2",
  "Cement & Clinker": "architecture",
  Chemicals: "science",
  Steel: "construction",
};

export function RecentShipments({ shipments }: { shipments: CommodityFlowRow[] }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-lg">
      <div className="flex items-center justify-between mb-xl">
        <h3 className="font-headline-md text-headline-md">Recent Shipments</h3>
        <span className="px-md py-xs bg-surface-container text-on-surface rounded-full font-label-caps text-label-caps">
          LATEST REPORTS
        </span>
      </div>
      <div className="space-y-md">
        {shipments.map((row) => {
          const weight = row.weight_24h_mt ?? row.weight_mt;
          const weightLabel = row.weight_24h_mt != null ? "24h" : "manifest";
          return (
            <div
              key={row.id}
              className="grid grid-cols-12 gap-md items-center py-md border-b border-outline-variant/30 hover:bg-background transition-colors px-md rounded-lg"
            >
              <div className="col-span-1">
                <span className="material-symbols-outlined text-secondary">
                  {CATEGORY_ICONS[row.commodity_category ?? ""] ?? "sailing"}
                </span>
              </div>
              <div className="col-span-4 min-w-0">
                <p className="font-body-md text-body-md font-bold text-on-surface truncate">
                  {row.ship_name}
                </p>
                <p className="font-label-caps text-label-caps text-on-surface-variant">
                  {row.commodity_standard ?? row.commodity} / {row.port}
                  {row.terminal && row.terminal !== "nan" ? ` · ${row.terminal}` : ""}
                </p>
              </div>
              <div className="col-span-3 text-right">
                <p className="font-data-tabular text-data-tabular text-on-surface">
                  {weight != null ? `${formatMt(weight)} MT` : "—"}
                </p>
                <p className="font-label-caps text-label-caps text-outline">{weightLabel}</p>
              </div>
              <div className="col-span-4 text-right">
                <p className="font-body-md text-body-md text-on-surface">
                  {formatDateShort(row.report_date)}
                </p>
                <p
                  className={`font-label-caps text-label-caps ${
                    row.imp_exp === "Import" ? "text-secondary" : "text-on-surface-variant"
                  }`}
                >
                  {row.imp_exp?.toUpperCase()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
