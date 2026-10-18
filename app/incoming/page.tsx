import {
  getAllVesselCalls,
  getIncomingPipeline,
  getCongestion,
} from "@/lib/data/vesselCalls";
import { StatCard } from "@/components/ui/StatCard";
import { WaitingVessels } from "@/components/incoming/WaitingVessels";
import { CongestionTable } from "@/components/incoming/CongestionTable";
import { formatMt, formatDateShort } from "@/lib/format";

const CONGESTION_WINDOW_DAYS = 28;

export default async function IncomingCargoPage() {
  const calls = await getAllVesselCalls();
  const pipeline = getIncomingPipeline(calls);
  const congestion = getCongestion(calls, CONGESTION_WINDOW_DAYS);
  const avgWait =
    pipeline.vessels.length > 0
      ? pipeline.vessels.reduce((s, v) => s + v.daysWaiting, 0) / pipeline.vessels.length
      : 0;

  return (
    <div className="flex flex-col w-full gap-xl">
      <section className="flex flex-col gap-sm">
        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
          Forward View
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          Incoming Cargo
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-md">
          Vessels that have reached Port Qasim and are waiting to berth: cargo that will be
          discharged over the coming days, before it shows up in any monthly import figure.
          As of the {pipeline.asOf ? formatDateShort(pipeline.asOf) : "latest"} report.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <StatCard
          label="Vessels waiting"
          period="Outer anchorage, latest report"
          value={pipeline.totalVessels}
        />
        <StatCard
          label="Cargo waiting"
          period={`${formatMt(pipeline.importTonnageMt)} MT import · ${formatMt(pipeline.exportTonnageMt)} MT export`}
          value={pipeline.totalTonnageMt}
          unit="MT"
        />
        <StatCard label="Average wait so far" period="Days since arrival" value={Math.round(avgWait)} unit="days" />
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-lg">
        <h3 className="font-headline-md text-headline-md mb-md">Waiting Cargo by Commodity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {pipeline.byCategory.map((c) => (
            <div key={c.category} className="bg-surface-container-low rounded-lg p-md flex flex-col gap-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase">{c.category}</span>
              <span className="font-headline-md text-headline-md text-on-surface">
                {formatMt(c.tonnageMt)} MT
              </span>
              <span className="font-body-md text-body-md text-on-surface-variant">
                {c.vessels} {c.vessels === 1 ? "vessel" : "vessels"} · avg {c.avgDaysWaiting.toFixed(1)} days waiting
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <WaitingVessels vessels={pipeline.vessels} />
      </section>

      <section className="pb-xl">
        <CongestionTable rows={congestion} windowDays={CONGESTION_WINDOW_DAYS} />
      </section>
    </div>
  );
}
