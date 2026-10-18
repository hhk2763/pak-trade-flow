import { formatMt, formatDateShort } from "@/lib/format";
import type { WaitingVessel } from "@/lib/data/vesselCalls";
import { GatedSection } from "@/components/gating/GatedSection";

// Enough rows to prove the list is real and current; the rest is the product.
const TEASER_COUNT = 3;

function quantity(v: WaitingVessel): string {
  if (v.tonnageMt == null) return "—";
  // LNG is printed in m³ at source; tonnage_mt is the converted figure.
  return `${formatMt(v.tonnageMt)} MT${v.quantityUnit === "M3" ? "*" : ""}`;
}

// The gated rows render in their own table under the blur, so both tables
// share fixed column widths to stay aligned with the header.
function Columns() {
  return (
    <colgroup>
      <col className="w-[26%]" />
      <col className="w-[20%]" />
      <col className="w-[14%]" />
      <col className="w-[14%]" />
      <col className="w-[10%]" />
      <col className="w-[16%]" />
    </colgroup>
  );
}

function VesselRow({ v }: { v: WaitingVessel }) {
  return (
    <tr className="border-b border-outline-variant/30 hover:bg-background transition-colors">
      <td className="py-sm px-md">
        <p className="font-body-md text-body-md font-bold text-on-surface">{v.shipName}</p>
        <p className="font-label-caps text-label-caps text-on-surface-variant">
          {v.agent ?? "Agent not listed"}
        </p>
      </td>
      <td className="py-sm px-md">
        <p className="font-body-md text-body-md text-on-surface">{v.commodity}</p>
        <p
          className={`font-label-caps text-label-caps ${
            v.impExp === "Import" ? "text-secondary" : "text-on-surface-variant"
          }`}
        >
          {v.impExp ? v.impExp.toUpperCase() : "DIRECTION N/A"}
        </p>
      </td>
      <td className="py-sm px-md text-right font-data-tabular text-data-tabular text-on-surface">
        {quantity(v)}
      </td>
      <td className="py-sm px-md font-body-md text-body-md text-on-surface-variant">
        {v.originPort ?? "—"}
      </td>
      <td className="py-sm px-md font-body-md text-body-md text-on-surface-variant">
        {v.terminal ?? "—"}
      </td>
      <td className="py-sm px-md text-right">
        <p className="font-data-tabular text-data-tabular text-on-surface">
          {v.daysWaiting} {v.daysWaiting === 1 ? "day" : "days"}
        </p>
        <p className="font-label-caps text-label-caps text-outline">
          since {formatDateShort(v.arrived)}
        </p>
      </td>
    </tr>
  );
}

function Table({ vessels }: { vessels: WaitingVessel[] }) {
  return (
    <table className="w-full text-left table-fixed min-w-[760px]">
      <Columns />
      <tbody>
        {vessels.map((v) => (
          <VesselRow key={`${v.callId}-${v.commodity}-${v.impExp}`} v={v} />
        ))}
      </tbody>
    </table>
  );
}

export function WaitingVessels({ vessels }: { vessels: WaitingVessel[] }) {
  const teaser = vessels.slice(0, TEASER_COUNT);
  const gated = vessels.slice(TEASER_COUNT);
  const hasLng = vessels.some((v) => v.quantityUnit === "M3");

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col">
      <div className="flex items-center justify-between mb-md gap-md flex-wrap">
        <h3 className="font-headline-md text-headline-md">Vessels Waiting at Port Qasim</h3>
        <span className="px-md py-xs bg-surface-container text-on-surface rounded-full font-label-caps text-label-caps">
          OUTER ANCHORAGE
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left table-fixed min-w-[760px]">
          <Columns />
          <thead>
            <tr className="font-label-caps text-label-caps text-outline uppercase border-b border-outline-variant">
              <th className="py-sm px-md font-normal">Vessel / Agent</th>
              <th className="py-sm px-md font-normal">Cargo</th>
              <th className="py-sm px-md font-normal text-right">Quantity</th>
              <th className="py-sm px-md font-normal">From</th>
              <th className="py-sm px-md font-normal">Terminal</th>
              <th className="py-sm px-md font-normal text-right">Waiting</th>
            </tr>
          </thead>
          <tbody>
            {teaser.map((v) => (
              <VesselRow key={`${v.callId}-${v.commodity}-${v.impExp}`} v={v} />
            ))}
          </tbody>
        </table>
        {gated.length > 0 && (
          <GatedSection
            className="mt-sm"
            label="See every vessel waiting to discharge."
            sublabel={`${gated.length} more vessels with cargo, origin, agent and days waiting.`}
          >
            <Table vessels={gated} />
          </GatedSection>
        )}
      </div>
      {vessels.length === 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant py-md">
          No vessels on the latest anchorage report.
        </p>
      )}
      {hasLng && (
        <p className="mt-md font-body-md text-[12px] text-on-surface-variant">
          * LNG is reported in cubic metres; shown converted at 0.45 t/m³.
        </p>
      )}
    </div>
  );
}
