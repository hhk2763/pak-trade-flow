import {
  buildMarketSnapshot,
  cleanShipName,
  getCoverage,
  getLineup,
  getVesselCalls,
  titleCase,
} from "@/lib/data/vesselCalls";
import { buildTakeaways } from "@/lib/report";
import { PORT_NAMES } from "@/lib/sectors";
import {
  formatDateLong,
  formatDateShort,
  formatMeasure,
  formatMonthShort,
  formatMt,
  formatPct,
} from "@/lib/format";
import { DataPending } from "@/components/ui/DataPending";
import { PrintButton } from "@/components/report/PrintButton";

export const metadata = { title: "Weekly Note · PAK Trade Flow" };

function pct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function shiftDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Scorecard cells drop the unit: tonnes throughout, except LNG (cargoes).
function cell(value: number, unit: "mt" | "calls"): string {
  if (value === 0) return "-";
  return formatMeasure(value, unit).replace(/ (MT|cargo(es)?)$/, "");
}

function Change({ value }: { value: number | null }) {
  if (value == null) return <span className="text-outline">n/a</span>;
  return (
    <span className={value >= 0 ? "text-secondary" : "text-error"}>
      {value >= 0 ? "▲" : "▼"} {formatPct(value).replace(/[+-]/, "")}
    </span>
  );
}

export default async function WeeklyNotePage() {
  const [calls, coverage] = await Promise.all([getVesselCalls(), getCoverage()]);
  const market = buildMarketSnapshot(calls, coverage);
  if (!market.hasData) return <DataPending />;

  const lineup = getLineup(calls);
  const takeaways = buildTakeaways(market, lineup);
  const weekStart = shiftDays(market.asOf, -6);

  const waiting = lineup
    .filter((r) => r.status === "waiting" && r.weightMt != null)
    .sort((a, b) => (b.weightMt ?? 0) - (a.weightMt ?? 0))
    .slice(0, 10);

  const arrivals = calls
    .filter(
      (c) =>
        c.source === "live" &&
        c.arrival_date &&
        c.arrival_date >= weekStart &&
        c.arrival_date <= market.asOf &&
        c.weight_mt != null &&
        !c.is_outlier &&
        c.commodity_category !== "Containers"
    )
    .sort((a, b) => (b.weight_mt ?? 0) - (a.weight_mt ?? 0))
    .slice(0, 10);

  // Numbers never wrap; only the first (label) column may.
  const th = "py-1.5 pr-3 font-normal text-right whitespace-nowrap first:text-left";
  const td =
    "py-1.5 pr-3 text-right font-data-tabular whitespace-nowrap first:text-left first:font-body-md first:whitespace-normal";

  return (
    <article className="report bg-white text-on-surface rounded-xl shadow-sm print:shadow-none max-w-[820px] mx-auto p-xl print:p-0 flex flex-col gap-lg">
      <header className="flex flex-col gap-sm border-b-2 border-on-surface pb-md">
        <div className="flex items-start justify-between gap-md">
          <div>
            <p className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
              PAK Trade Flow · Port Pulse
            </p>
            <h1 className="font-headline-md text-[28px] leading-tight font-bold mt-1">
              Weekly port note for equity research
            </h1>
          </div>
          <PrintButton />
        </div>
        <p className="font-body-md text-[13px] text-on-surface-variant">
          Week of {formatDateLong(weekStart)} to {formatDateLong(market.asOf)} · Port Qasim and
          Karachi Port · vessel-level cargo data
        </p>
      </header>

      <section className="flex flex-col gap-sm">
        <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-outline">
          What moved
        </h2>
        <ol className="flex flex-col gap-sm">
          {takeaways.map((t, i) => (
            <li key={i} className="flex gap-sm">
              <span className="font-data-tabular text-secondary font-bold w-5 shrink-0">{i + 1}</span>
              <p className="font-body-md text-[14px] leading-snug">
                <strong>{t.headline}.</strong> {t.detail}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {market.sectors.map(({ sector, series }) => (
        <section key={sector.slug} className="flex flex-col gap-xs break-inside-avoid">
          <h2 className="flex flex-wrap items-baseline gap-x-sm font-headline-sm text-[16px] font-bold">
            {sector.name}
            <span className="font-data-tabular text-[11px] font-normal text-on-surface-variant">
              {sector.tickers.join(" · ")}
            </span>
          </h2>
          <table className="w-full table-fixed text-[12px] border-t border-on-surface/70">
            {/* Fixed widths so the columns line up from one sector to the next. */}
            <colgroup>
              <col style={{ width: "27%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "11%" }} />
            </colgroup>
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-outline">
                <th className={th}>Flow</th>
                <th className={th}>This week</th>
                <th className={th}>vs 4-wk</th>
                <th className={th}>MTD</th>
                <th className={th}>vs prior mo.</th>
                <th className={th}>{formatMonthShort(market.lastMonth)}</th>
                <th className={th}>YoY</th>
                <th className={th}>Waiting</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.series.key} className="border-t border-outline-variant/60">
                  <td className={td}>{s.series.label}</td>
                  <td className={td}>{cell(s.weekValue, s.series.unit)}</td>
                  <td className={td}>
                    <Change value={pct(s.weekValue, s.avg4wValue)} />
                  </td>
                  <td className={td}>{cell(s.mtdValue, s.series.unit)}</td>
                  <td className={td}>
                    <Change value={s.mtdPct} />
                  </td>
                  <td className={td}>
                    {cell(s.lastMonthValue, s.series.unit)}
                  </td>
                  <td className={td}>
                    <Change value={s.yoy.pct} />
                    {s.yoy.pct != null && s.yoy.basis ? <sup className="text-outline">PQ</sup> : null}
                  </td>
                  <td className={td}>
                    {s.waitingCalls === 0
                      ? "-"
                      : s.series.unit === "calls"
                        ? s.waitingCalls
                        : `${formatMeasure(s.waitingValue, "mt").replace(" MT", "")} (${s.waitingCalls})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <section className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-lg break-inside-avoid">
        <div className="flex flex-col gap-xs">
          <h2 className="font-headline-sm text-[16px] font-bold">Waiting at anchorage</h2>
          <table className="w-full table-fixed text-[12px] border-t border-on-surface/70">
            <colgroup>
              <col style={{ width: "31%" }} />
              <col style={{ width: "33%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "17%" }} />
            </colgroup>
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-outline">
                <th className={th}>Vessel</th>
                <th className={`${th} !text-left`}>Cargo</th>
                <th className={th}>Tonnes</th>
                <th className={th}>Days</th>
              </tr>
            </thead>
            <tbody>
              {waiting.map((r) => (
                <tr key={r.visitKey} className="border-t border-outline-variant/60">
                  <td className={td}>{r.ship}</td>
                  <td className={`${td} !text-left !font-body-md !whitespace-normal`}>{r.commodity}</td>
                  <td className={td}>{formatMt(r.weightMt ?? 0)}</td>
                  <td className={td}>{r.daysInPort ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-xs">
          <h2 className="font-headline-sm text-[16px] font-bold">Largest arrivals this week</h2>
          <table className="w-full table-fixed text-[12px] border-t border-on-surface/70">
            <colgroup>
              <col style={{ width: "31%" }} />
              <col style={{ width: "33%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "17%" }} />
            </colgroup>
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-outline">
                <th className={th}>Vessel</th>
                <th className={`${th} !text-left`}>Cargo</th>
                <th className={th}>Tonnes</th>
                <th className={th}>Arrived</th>
              </tr>
            </thead>
            <tbody>
              {arrivals.map((c) => (
                <tr key={c.visit_key} className="border-t border-outline-variant/60">
                  <td className={td}>{cleanShipName(c.ship_name)}</td>
                  <td className={`${td} !text-left !font-body-md !whitespace-normal`}>
                    {titleCase(c.commodity_standard ?? "")}
                    <span className="text-outline"> · {c.port === "PQ" ? "PQ" : "KPT"}</span>
                  </td>
                  <td className={td}>{formatMt(c.weight_mt ?? 0)}</td>
                  <td className={td}>{formatDateShort(c.arrival_date!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="border-t border-outline-variant pt-sm flex flex-col gap-1 font-body-md text-[10.5px] leading-snug text-on-surface-variant break-inside-avoid">
        <p>
          <strong>How to read this.</strong> All figures are metric tonnes of each vessel&apos;s
          declared cargo, counted once on its arrival date. &quot;This week&quot; is the seven days to{" "}
          {formatDateLong(market.asOf)}; the four-week average covers the 28 days before that.
          &quot;Waiting&quot; is cargo at Port Qasim anchorage that has not yet berthed, with the
          vessel count in brackets. LNG is shown as a cargo count because the ports record its
          volume inconsistently.
        </p>
        <p>
          <strong>Coverage.</strong> Source: the daily shipping statements published by Port Qasim
          Authority and Karachi Port Trust ({PORT_NAMES.PQ} history from 2019; {PORT_NAMES.KPT} from
          March 2026). <sup>PQ</sup> marks a year-on-year figure calculated on Port Qasim alone.
          Containerised cargo is reported by the ports as boxes, not by commodity, so scrap steel,
          basmati rice and other boxed goods are outside this note. Company tickers indicate
          sector exposure and are not investment advice.
        </p>
      </footer>
    </article>
  );
}
