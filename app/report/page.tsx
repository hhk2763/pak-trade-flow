import { timingSafeEqual } from "node:crypto";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllVesselCalls,
  getThemeSignals,
  getCongestion,
  getIncomingPipeline,
} from "@/lib/data/vesselCalls";
import { buildTakeaways } from "@/lib/data/report";
import { formatMt, formatDateShort, formatDateRange } from "@/lib/format";

// The weekly client report: open /report?key=..., print to PDF, send. It is
// the paid deliverable, so it is not linked from the site and needs
// REPORT_ACCESS_KEY. Like the lead gate, this is a speed bump rather than
// access control -- anyone holding the link can share it.

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Pakistan Port Cargo Monitor",
  robots: { index: false, follow: false },
};

const WINDOW_DAYS = 28;

function authorized(key: string | undefined): boolean {
  const expected = process.env.REPORT_ACCESS_KEY;
  if (!expected || !key) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function pct(value: number | null, calls: number, priorCalls: number): string {
  // Too few vessels for a percentage to mean anything; the counts are shown.
  if (value == null || calls < 3 || priorCalls < 3) return "n/m";
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
}

const th = "py-xs px-sm font-normal text-left";
const td = "py-xs px-sm border-t border-outline-variant/40 align-top";

export default async function WeeklyReportPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  if (!authorized(searchParams.key)) notFound();

  const calls = await getAllVesselCalls();
  const signals = getThemeSignals(calls, WINDOW_DAYS);
  const congestion = getCongestion(calls, WINDOW_DAYS);
  const pipeline = getIncomingPipeline(calls);
  const takeaways = buildTakeaways(signals, congestion, pipeline);
  const periodEnd = signals[0]?.periodEnd ?? pipeline.asOf;

  return (
    <article className="max-w-4xl mx-auto bg-surface-container-lowest text-on-surface p-xl print:p-0 print:max-w-none rounded-xl print:rounded-none shadow-sm print:shadow-none font-body-md text-body-md">
      <header className="flex items-end justify-between border-b-2 border-on-surface pb-md">
        <div>
          <p className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
            PAK Trade Flow · Weekly
          </p>
          <h1 className="font-headline-md text-headline-md">Pakistan Port Cargo Monitor</h1>
        </div>
        <p className="text-right text-[13px] text-on-surface-variant">
          Data to {formatDateShort(periodEnd)}, {periodEnd.slice(0, 4)}
          <br />
          Port Qasim · Karachi Port Trust
        </p>
      </header>

      <section className="mt-lg">
        <h2 className="font-headline-sm text-headline-sm mb-sm">What changed</h2>
        <ol className="flex flex-col gap-md">
          {takeaways.map((t, i) => (
            <li key={t.headline} className="flex gap-md break-inside-avoid">
              <span className="font-data-tabular text-data-tabular text-secondary">{i + 1}</span>
              <div>
                <p className="font-bold">
                  {t.headline}
                  {t.tickers.length > 0 && (
                    <span className="font-data-tabular text-data-tabular text-secondary font-normal">
                      {"  "}
                      {t.tickers.join(" · ")}
                    </span>
                  )}
                </p>
                <p className="text-on-surface-variant">{t.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-xl">
        <h2 className="font-headline-sm text-headline-sm">PSX signals</h2>
        <p className="text-[13px] text-on-surface-variant mb-sm">
          Tonnage berthed {signals[0] && formatDateRange(signals[0].periodStart, periodEnd)} vs the
          prior {WINDOW_DAYS} days, by vessel-call manifest.
        </p>
        <table className="w-full text-[13px]">
          <thead className="font-label-caps text-label-caps text-outline uppercase">
            <tr>
              <th className={th}>Flow · tickers</th>
              <th className={`${th} text-right`}>Last {WINDOW_DAYS}d (MT)</th>
              <th className={`${th} text-right`}>Vessels</th>
              <th className={`${th} text-right`}>Change</th>
              <th className={`${th} text-right`}>Waiting now (MT)</th>
              <th className={`${th} text-right`}>Median wait</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s) => (
              <tr key={s.theme.id} className="break-inside-avoid">
                <td className={td}>
                  {s.theme.name}
                  <span className="block font-data-tabular text-[11px] text-secondary">
                    {s.theme.exposures.map((e) => e.ticker).join(" · ")}
                  </span>
                </td>
                <td className={`${td} text-right font-data-tabular`}>{formatMt(s.tonnageMt)}</td>
                <td className={`${td} text-right font-data-tabular`}>
                  {s.calls}
                  <span className="text-outline"> ({s.priorCalls})</span>
                </td>
                <td className={`${td} text-right font-data-tabular`}>
                  {pct(s.changePct, s.calls, s.priorCalls)}
                </td>
                <td className={`${td} text-right font-data-tabular`}>
                  {s.waitingTonnageMt > 0 ? formatMt(s.waitingTonnageMt) : "—"}
                </td>
                <td className={`${td} text-right font-data-tabular`}>
                  {s.medianWaitDays != null ? `${s.medianWaitDays.toFixed(1)}d` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-xl">
        <h2 className="font-headline-sm text-headline-sm">Waiting at Port Qasim anchorage</h2>
        <p className="text-[13px] text-on-surface-variant mb-sm">
          {pipeline.totalVessels} vessels, {formatMt(pipeline.totalTonnageMt)} MT, on the{" "}
          {formatDateShort(pipeline.asOf)} report.
        </p>
        <table className="w-full text-[13px]">
          <thead className="font-label-caps text-label-caps text-outline uppercase">
            <tr>
              <th className={th}>Vessel</th>
              <th className={th}>Cargo</th>
              <th className={`${th} text-right`}>MT</th>
              <th className={th}>From</th>
              <th className={th}>Terminal</th>
              <th className={th}>Agent</th>
              <th className={`${th} text-right`}>Waiting</th>
            </tr>
          </thead>
          <tbody>
            {pipeline.vessels.map((v) => (
              <tr key={`${v.callId}-${v.commodity}-${v.impExp}`} className="break-inside-avoid">
                <td className={td}>{v.shipName}</td>
                <td className={td}>
                  {v.commodity}
                  {v.impExp === "Export" && <span className="text-outline"> (exp)</span>}
                </td>
                <td className={`${td} text-right font-data-tabular`}>
                  {v.tonnageMt != null ? formatMt(v.tonnageMt) : "—"}
                  {v.quantityUnit === "M3" ? "*" : ""}
                </td>
                <td className={td}>{v.originPort ?? "—"}</td>
                <td className={td}>{v.terminal ?? "—"}</td>
                <td className={td}>{v.agent ?? "—"}</td>
                <td className={`${td} text-right font-data-tabular`}>{v.daysWaiting}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-xl break-inside-avoid">
        <h2 className="font-headline-sm text-headline-sm">Anchorage wait by terminal</h2>
        <p className="text-[13px] text-on-surface-variant mb-sm">
          Median days from arrival to berthing, vessels berthed in the last {WINDOW_DAYS} days vs
          the {WINDOW_DAYS} before.
        </p>
        <table className="w-full text-[13px]">
          <thead className="font-label-caps text-label-caps text-outline uppercase">
            <tr>
              <th className={th}>Terminal</th>
              <th className={th}>Main cargo</th>
              <th className={`${th} text-right`}>Median wait</th>
              <th className={`${th} text-right`}>Previous</th>
              <th className={`${th} text-right`}>Vessels</th>
              <th className={`${th} text-right`}>Waiting now</th>
            </tr>
          </thead>
          <tbody>
            {congestion.map((c) => (
              <tr key={c.terminal}>
                <td className={td}>{c.terminal}</td>
                <td className={td}>{c.mainCargo ?? "—"}</td>
                <td className={`${td} text-right font-data-tabular`}>{c.medianWaitDays.toFixed(1)}d</td>
                <td className={`${td} text-right font-data-tabular`}>
                  {c.priorMedianWaitDays != null ? `${c.priorMedianWaitDays.toFixed(1)}d` : "—"}
                </td>
                <td className={`${td} text-right font-data-tabular`}>{c.calls}</td>
                <td className={`${td} text-right font-data-tabular`}>{c.waitingNow}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-xl pt-md border-t border-outline-variant text-[11px] text-on-surface-variant flex flex-col gap-xs">
        <p>
          <strong>Method.</strong> Built from the daily statements Port Qasim and Karachi Port Trust
          publish. Each vessel visit is counted once, at its berthing date, at its manifest quantity,
          so a ship that works cargo for a week is not counted seven times. Anchorage lists and
          waiting times are Port Qasim only; KPT does not publish one. LNG is reported in m³ and
          shown converted at 0.45 t/m³ (*). Coverage starts March 2026 (KPT) and late April 2026
          (PQ).
        </p>
        <p>
          Vessels column: this window (previous window). &ldquo;n/m&rdquo;: fewer than 3 vessels in
          a window, too few for a percentage to mean anything.
        </p>
        <p>
          Ticker mappings indicate which companies a flow bears on. They are research inputs, not
          investment advice.
        </p>
      </footer>
    </article>
  );
}
