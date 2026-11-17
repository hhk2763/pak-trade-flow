import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildMarketSnapshot,
  getCounterpartyMix,
  getCoverage,
  getLineup,
  getRecentCalls,
  getVesselCalls,
} from "@/lib/data/vesselCalls";
import { SECTORS, findSector, PORT_NAMES } from "@/lib/sectors";
import {
  formatDateLong,
  formatDateShort,
  formatMeasure,
  formatMonth,
  formatMt,
} from "@/lib/format";
import { TickerChips } from "@/components/sectors/SectorCard";
import { Delta } from "@/components/sectors/Delta";
import { MonthlyChart } from "@/components/sectors/MonthlyChart";
import { GatedSection } from "@/components/gating/GatedSection";
import { DataPending } from "@/components/ui/DataPending";

export function generateStaticParams() {
  return SECTORS.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const sector = findSector(params.slug);
  return { title: sector ? `${sector.name} · PAK Trade Flow` : "PAK Trade Flow" };
}

const FREE_ROWS = 3;

export default async function SectorDetailPage({ params }: { params: { slug: string } }) {
  const sector = findSector(params.slug);
  if (!sector) notFound();

  const [calls, coverage] = await Promise.all([getVesselCalls(), getCoverage()]);
  const market = buildMarketSnapshot(calls, coverage);
  if (!market.hasData) return <DataPending />;
  const snap = market.sectors.find((s) => s.sector.slug === sector.slug)!;

  return (
    <div className="flex flex-col w-full gap-xl pb-xl">
      <section className="flex flex-col gap-sm max-w-4xl">
        <Link
          href="/"
          className="font-label-caps text-label-caps text-on-surface-variant uppercase inline-flex items-center gap-0.5 hover:text-on-surface w-fit"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden>
            chevron_left
          </span>
          Sector Monitor
        </Link>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          {sector.name}
        </h1>
        <TickerChips tickers={sector.tickers} />
        <p className="font-body-lg text-body-lg text-on-surface-variant">{sector.summary}</p>
        <span className="font-label-caps text-label-caps text-outline uppercase">
          Data to {formatDateLong(market.asOf)}
        </span>
      </section>

      {snap.series.map((s) => {
        const unit = s.series.unit;
        const mix = getCounterpartyMix(calls, s.series, market.asOf);
        const lineup = getLineup(calls, s.series);
        const recent = getRecentCalls(calls, s.series, 15);
        const isExport = s.series.direction === "Export";
        const maxShare = Math.max(...mix.map((m) => m.sharePct), 1);

        return (
          <section
            key={s.series.key}
            className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col gap-lg"
          >
            <header className="flex flex-col gap-xs">
              <h2 className="font-headline-md text-headline-md text-on-surface">{s.series.label}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                {s.series.why}
              </p>
              {s.series.coverageNote && (
                <p className="mt-xs flex gap-sm rounded-lg bg-surface-container-low p-md font-body-md text-[13px] text-on-surface max-w-3xl">
                  <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden>
                    info
                  </span>
                  <span>
                    <strong>Partial coverage.</strong> {s.series.coverageNote}
                  </span>
                </p>
              )}
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
              <Stat label={formatMonth(s.lastMonth)} value={formatMeasure(s.lastMonthValue, unit)}>
                <Delta pct={s.mom.pct} label="MoM" basis={s.mom.basis} />
                <Delta pct={s.yoy.pct} label="YoY" basis={s.yoy.basis} />
              </Stat>
              <Stat label="Last 3 months" value={formatMeasure(s.t3mValue, unit)}>
                <Delta pct={s.t3mYoy.pct} label="YoY" basis={s.t3mYoy.basis} />
              </Stat>
              <Stat
                label={`${formatMonth(s.mtdMonth)} to day ${s.mtdDays}`}
                value={formatMeasure(s.mtdValue, unit)}
              >
                <Delta pct={s.mtdPct} label="vs prior month" />
              </Stat>
              <Stat
                label="At anchorage now"
                value={
                  unit === "calls"
                    ? `${s.waitingCalls} waiting`
                    : formatMeasure(s.waitingValue, unit)
                }
              >
                <span className="font-data-tabular text-data-tabular text-on-surface-variant">
                  {s.waitingCalls} waiting · {s.berthedCalls} at berth
                </span>
              </Stat>
            </div>

            <div>
              <h3 className="font-label-caps text-label-caps text-outline uppercase mb-sm">
                Monthly arrivals{unit === "calls" ? " (cargoes)" : " (tonnes)"}
              </h3>
              <MonthlyChart points={s.history} unit={unit} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
              <div className="lg:col-span-4 flex flex-col gap-sm">
                <h3 className="font-label-caps text-label-caps text-outline uppercase">
                  {isExport ? "Destinations" : "Origins"} · last 12 months
                </h3>
                {mix.length === 0 ? (
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    No {isExport ? "destination" : "origin"} reported for this flow.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-sm">
                    {mix.map((m) => (
                      <li key={m.name} className="flex flex-col gap-0.5">
                        <span className="flex justify-between font-body-md text-[13px] text-on-surface">
                          <span>{m.name}</span>
                          <span className="font-data-tabular text-on-surface-variant">
                            {m.sharePct.toFixed(0)}%
                          </span>
                        </span>
                        <span className="h-1.5 w-full rounded-full bg-surface-container">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${(m.sharePct / maxShare) * 100}%`,
                              background: "#00897b",
                            }}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {isExport && mix.some((m) => m.name === "Not reported") && (
                  <p className="font-body-md text-[12px] text-on-surface-variant">
                    Port Qasim does not publish a vessel&apos;s next port, so destinations are known
                    for Karachi Port sailings only.
                  </p>
                )}
              </div>

              <div className="lg:col-span-8 flex flex-col gap-sm">
                <h3 className="font-label-caps text-label-caps text-outline uppercase">
                  In port now · {lineup.length} vessel{lineup.length === 1 ? "" : "s"}
                </h3>
                {lineup.length === 0 ? (
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    No vessels for this flow at anchorage or at berth today.
                  </p>
                ) : (
                  <CallTable
                    head={["Vessel", "Cargo", "Tonnes", "Status", "Days", isExport ? "To" : "From"]}
                    rows={lineup.map((r) => [
                      r.ship,
                      r.commodity,
                      r.weightMt != null ? formatMt(r.weightMt) : "-",
                      r.status === "waiting"
                        ? "At anchorage"
                        : `At berth${r.terminal ? ` · ${r.terminal}` : ""}`,
                      r.daysInPort != null ? String(r.daysInPort) : "-",
                      r.origin ?? "-",
                    ])}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <h3 className="font-label-caps text-label-caps text-outline uppercase">
                Latest vessel calls
              </h3>
              <CallTable
                head={["Arrived", "Vessel", "Port", "Cargo", "Tonnes", isExport ? "To" : "From", "Agent"]}
                rows={recent.slice(0, FREE_ROWS).map(recentRow)}
              />
              {recent.length > FREE_ROWS && (
                <GatedSection
                  label="See every vessel call, back to 2019."
                  sublabel="Vessel, tonnage, origin and agent for each cargo. Tell us what you cover."
                >
                  <CallTable head={null} rows={recent.slice(FREE_ROWS).map(recentRow)} />
                </GatedSection>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function recentRow(r: {
  arrivalDate: string;
  ship: string;
  port: string;
  commodity: string;
  weightMt: number | null;
  counterparty: string | null;
  agent: string | null;
}): string[] {
  return [
    `${formatDateShort(r.arrivalDate)} ${r.arrivalDate.slice(0, 4)}`,
    r.ship,
    PORT_NAMES[r.port] ?? r.port,
    r.commodity,
    r.weightMt != null ? formatMt(r.weightMt) : "-",
    r.counterparty ?? "-",
    r.agent ?? "-",
  ];
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-low rounded-lg p-md flex flex-col gap-0.5">
      <span className="font-label-caps text-label-caps text-outline uppercase">{label}</span>
      <span className="font-headline-md text-headline-md text-on-surface font-data-tabular">
        {value}
      </span>
      <span className="flex flex-col">{children}</span>
    </div>
  );
}

function CallTable({ head, rows }: { head: string[] | null; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-body-md text-[13px] text-on-surface">
        {head && (
          <thead>
            <tr className="font-label-caps text-label-caps text-outline uppercase">
              {head.map((h) => (
                <th
                  key={h}
                  className={`py-xs pr-md font-normal ${h === "Tonnes" || h === "Days" ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-t border-outline-variant/50">
              {cells.map((c, j) => {
                const numeric = /^[\d,]+$/.test(c);
                return (
                  <td
                    key={j}
                    className={`py-xs pr-md ${numeric ? "text-right font-data-tabular" : ""} ${
                      j === 0 || j === 1 ? "whitespace-nowrap" : ""
                    }`}
                  >
                    {c}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
