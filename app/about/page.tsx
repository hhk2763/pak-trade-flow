import Link from "next/link";
import { addMonths, getCoverage, getVesselCalls } from "@/lib/data/vesselCalls";
import { SECTORS } from "@/lib/sectors";
import { formatDateLong, formatMonth } from "@/lib/format";

export const metadata = { title: "Methodology · PAK Trade Flow" };

export default async function MethodologyPage() {
  const [calls, coverage] = await Promise.all([getVesselCalls(), getCoverage()]);

  const asOf = calls.reduce(
    (max, c) => (c.source === "live" && c.last_seen && c.last_seen > max ? c.last_seen : max),
    ""
  );
  const firstMonth = (port: string, source?: string) =>
    coverage
      .filter((c) => c.port === port && (!source || c.source === source))
      .map((c) => c.month)
      .sort()[0];
  const pqStart = firstMonth("PQ");
  const kptLiveStart = firstMonth("KPT", "live");
  // Months since the start of the record that are not fully observed: either
  // some daily reports are missing, or none exist at all.
  const complete = new Set(
    coverage.filter((c) => c.port === "PQ" && c.is_complete === 1).map((c) => c.month)
  );
  const gaps: string[] = [];
  if (pqStart && asOf) {
    for (let m = pqStart; m < asOf.slice(0, 7); m = addMonths(m, 1)) {
      if (!complete.has(m)) gaps.push(m);
    }
  }

  const stats = [
    { label: "Vessel calls on record", value: calls.length.toLocaleString("en-US") },
    { label: "History from", value: pqStart ? pqStart.slice(0, 4) : "-" },
    { label: "Listed sectors mapped", value: String(SECTORS.length) },
  ];

  const sections: { title: string; body: React.ReactNode }[] = [
    {
      title: "What this is",
      body: (
        <>
          Port Qasim Authority and Karachi Port Trust each publish a daily statement of the
          vessels in port: what each carries, how much, where it came from, and where it is
          berthed. Almost all of Pakistan&apos;s bulk trade in coal, fuels, edible oil, oilseeds,
          fertilizer, steel and cement crosses those two ports. We read every statement, every
          night, and turn it into one consistent record of vessel calls, mapped to the listed
          sectors each cargo matters to.
        </>
      ),
    },
    {
      title: "How volumes are counted",
      body: (
        <>
          A vessel appears in the daily statements for every day it is in port, so adding up
          the statements would count the same cargo many times. We follow each vessel from
          arrival to departure and count its declared cargo once, on its arrival date. A monthly
          figure here is therefore cargo that arrived in that month. The extraction is checked
          every night against the ports&apos; own control totals before anything is published.
        </>
      ),
    },
    {
      title: "Why it is early",
      body: (
        <>
          Official trade statistics and industry association releases arrive two to six weeks
          after month end. A vessel appears here the day after it reaches port limits, and cargo
          waiting at anchorage is visible before it has been discharged at all. The{" "}
          <Link href="/vessels" className="underline">
            vessel line-up
          </Link>{" "}
          is the forward view; the{" "}
          <Link href="/report" className="underline">
            weekly note
          </Link>{" "}
          is the summary.
        </>
      ),
    },
    {
      title: "Coverage",
      body: (
        <>
          Port Qasim: vessel calls from {pqStart ? formatMonth(pqStart) : "2019"} to date. Karachi
          Port: tonnage-handled data from {kptLiveStart ? formatMonth(kptLiveStart) : "March 2026"}{" "}
          to date. Year-on-year comparisons are made only between periods measured the same way,
          which for now means Port Qasim alone; those figures carry a <sup>PQ</sup> mark. Where a
          cargo moves mainly through Karachi, no year-on-year figure is shown rather than a
          misleading one.
          {gaps.length > 0 && (
            <>
              {" "}
              {gaps.length} months in that record have missing or incomplete source reports
              (the longest gap runs from mid-2022 to early 2023). They are marked in charts and
              excluded from comparisons.
            </>
          )}
        </>
      ),
    },
    {
      title: "What it cannot tell you",
      body: (
        <>
          The statements name the shipping agent, not the importer, so a cargo cannot be
          attributed to a single company except where a terminal has one user. Containerised
          cargo is reported as boxes, not by commodity, so scrap steel, basmati rice and
          machinery are not visible. LNG is counted in cargoes because its volume is recorded
          inconsistently. Tonnage is as declared by the vessel and can differ slightly from the
          final outturn. Tickers indicate sector exposure and are not investment advice.
        </>
      ),
    },
    {
      title: "Who uses it",
      body: (
        <>
          Sell-side and buy-side analysts covering cement, energy, fertilizer, steel, chemicals
          and consumer staples who want a volume read before the official number, and a record
          they can back-test against reported results.
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full gap-xl max-w-3xl pb-xl">
      <section className="flex flex-col gap-sm">
        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
          Methodology
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface leading-none">
          Port cargo data, built for equity research
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-md">
          Every vessel call at Pakistan&apos;s two main ports, counted once and mapped to the
          listed companies it affects.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-container-lowest rounded-xl shadow-sm p-lg text-center">
            <p className="font-display-lg text-display-lg text-on-surface">{s.value}</p>
            <p className="font-label-caps text-label-caps text-outline uppercase mt-xs">{s.label}</p>
          </div>
        ))}
      </section>

      {sections.map((s) => (
        <section
          key={s.title}
          className="bg-surface-container-lowest rounded-xl shadow-sm p-lg flex flex-col gap-sm"
        >
          <h2 className="font-headline-md text-headline-md text-on-surface">{s.title}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{s.body}</p>
        </section>
      ))}

      <p className="font-label-caps text-label-caps text-outline uppercase">
        Data to {formatDateLong(asOf)}
      </p>
    </div>
  );
}
