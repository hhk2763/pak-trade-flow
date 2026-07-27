import Link from "next/link";
import { formatMt, formatDateShort } from "@/lib/format";
import type { CommodityFlowRow } from "@/lib/types/database";
import { GatedSection } from "@/components/gating/GatedSection";

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

// Visible without an account — proves the data is real before the wall shows up.
const TEASER_COUNT = 2;

function ShipmentRow({ row }: { row: CommodityFlowRow }) {
  const weight = row.weight_24h_mt ?? row.weight_mt;
  const weightLabel = row.weight_24h_mt != null ? "24h" : "manifest";
  return (
    <div className="grid grid-cols-12 gap-md items-center py-md border-b border-outline-variant/30 hover:bg-background transition-colors px-md rounded-lg">
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
}

export function RecentShipments({ shipments }: { shipments: CommodityFlowRow[] }) {
  const teaser = shipments.slice(0, TEASER_COUNT);
  const gated = shipments.slice(TEASER_COUNT);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col">
      <div className="flex items-center justify-between mb-xl">
        <h3 className="font-headline-md text-headline-md">Recent Shipments</h3>
        <span className="px-md py-xs bg-surface-container text-on-surface rounded-full font-label-caps text-label-caps">
          LATEST REPORTS
        </span>
      </div>
      <div className="space-y-md">
        {teaser.map((row) => (
          <ShipmentRow key={row.id} row={row} />
        ))}
      </div>
      {gated.length > 0 && (
        <GatedSection
          className="mt-md"
          sublabel={`See ${gated.length} more shipments with full vessel details.`}
        >
          <div className="space-y-md">
            {gated.map((row) => (
              <ShipmentRow key={row.id} row={row} />
            ))}
          </div>
        </GatedSection>
      )}
      <Link
        href="/commodity-flows"
        className="mt-lg pt-lg border-t border-outline-variant/30 flex items-center justify-center gap-xs font-label-caps text-label-caps text-secondary uppercase tracking-wide hover:underline"
      >
        View All Shipments
        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
      </Link>
    </div>
  );
}
