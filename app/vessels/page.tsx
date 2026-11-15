import { getLineup, getVesselCalls } from "@/lib/data/vesselCalls";
import { formatDateLong, formatMt } from "@/lib/format";
import { LineupTable } from "@/components/vessels/LineupTable";
import { DataPending } from "@/components/ui/DataPending";

export const metadata = { title: "Vessel Line-up · PAK Trade Flow" };

export default async function VesselsPage() {
  const calls = await getVesselCalls();
  const rows = getLineup(calls);
  if (rows.length === 0) return <DataPending />;

  const asOf = calls.reduce(
    (max, c) => (c.source === "live" && c.last_seen && c.last_seen > max ? c.last_seen : max),
    ""
  );
  const waiting = rows.filter((r) => r.status === "waiting");
  const berthed = rows.filter((r) => r.status === "berthed");
  const waitingImportMt = waiting
    .filter((r) => r.direction === "Import")
    .reduce((s, r) => s + (r.weightMt ?? 0), 0);
  const leftToWork = berthed.reduce((s, r) => s + (r.balanceMt ?? 0), 0);
  const longest = waiting.reduce((max, r) => Math.max(max, r.daysInPort ?? 0), 0);

  const tiles = [
    { label: "At anchorage", value: String(waiting.length), note: "vessels waiting for a berth" },
    {
      label: "Import cargo waiting",
      value: `${formatMt(waitingImportMt)} MT`,
      note: "arrives over the next one to two weeks",
    },
    { label: "At berth", value: String(berthed.length), note: `${formatMt(leftToWork)} MT left to work` },
    { label: "Longest wait", value: `${longest} days`, note: "oldest vessel still at anchorage" },
  ];

  return (
    <div className="flex flex-col w-full gap-xl pb-xl">
      <section className="flex flex-col gap-sm max-w-4xl">
        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
          Vessel Line-up · {formatDateLong(asOf)}
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          What is in port today
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Cargo at anchorage has arrived but not yet been discharged. It is the nearest thing to a
          forward order book for import volumes: what is waiting today lands in inventories over
          the coming fortnight.
        </p>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-md">
        {tiles.map((t) => (
          <div key={t.label} className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col gap-xs">
            <span className="font-label-caps text-label-caps text-outline uppercase">{t.label}</span>
            <span className="font-display-lg text-display-lg text-on-surface font-data-tabular">
              {t.value}
            </span>
            <span className="font-body-md text-[12px] text-on-surface-variant">{t.note}</span>
          </div>
        ))}
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-lg">
        <LineupTable rows={rows} />
      </section>

      <p className="font-body-md text-[12px] text-on-surface-variant max-w-4xl">
        Port Qasim publishes its anchorage queue; Karachi Port publishes vessels at berth only, so
        Karachi vessels appear here once alongside. &quot;Left to work&quot; is the tonnage still to
        be discharged or loaded at the last report.
      </p>
    </div>
  );
}
