"use client";

import { useMemo, useState } from "react";
import type { LineupRow } from "@/lib/data/vesselCalls";
import { formatDateShort, formatMt } from "@/lib/format";
import { PORT_NAMES } from "@/lib/sectors";
import { GatedSection } from "@/components/gating/GatedSection";

const FREE_ROWS = 6;

const STATUS_LABEL: Record<LineupRow["status"], string> = {
  waiting: "At anchorage",
  berthed: "At berth",
};

function Row({ r }: { r: LineupRow }) {
  return (
    <tr className="border-t border-outline-variant/50">
      <td className="py-sm pr-md whitespace-nowrap font-semibold">{r.ship}</td>
      <td className="py-sm pr-md">{r.commodity}</td>
      <td className="py-sm pr-md">{r.direction ?? "-"}</td>
      <td className="py-sm pr-md text-right font-data-tabular">
        {r.weightMt != null ? formatMt(r.weightMt) : "-"}
      </td>
      <td className="py-sm pr-md text-right font-data-tabular">
        {r.balanceMt != null ? formatMt(r.balanceMt) : "-"}
      </td>
      <td className="py-sm pr-md whitespace-nowrap">
        <span className="inline-flex items-center gap-xs">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant" aria-hidden>
            {r.status === "waiting" ? "anchor" : "directions_boat"}
          </span>
          {STATUS_LABEL[r.status]}
          {r.status === "berthed" && r.terminal ? ` · ${r.terminal}` : ""}
        </span>
      </td>
      <td className="py-sm pr-md">{PORT_NAMES[r.port] ?? r.port}</td>
      <td className="py-sm pr-md whitespace-nowrap">
        {r.arrivalDate ? formatDateShort(r.arrivalDate) : "-"}
      </td>
      <td className="py-sm pr-md text-right font-data-tabular">{r.daysInPort ?? "-"}</td>
      <td className="py-sm">{r.origin ?? "-"}</td>
    </tr>
  );
}

function Head() {
  const cols: [string, boolean][] = [
    ["Vessel", false],
    ["Cargo", false],
    ["Flow", false],
    ["Tonnes", true],
    ["Left to work", true],
    ["Status", false],
    ["Port", false],
    ["Arrived", false],
    ["Days", true],
    ["From / to", false],
  ];
  return (
    <thead>
      <tr className="font-label-caps text-label-caps text-outline uppercase">
        {cols.map(([label, right]) => (
          <th key={label} className={`py-xs pr-md font-normal ${right ? "text-right" : ""}`}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function LineupTable({ rows }: { rows: LineupRow[] }) {
  const [status, setStatus] = useState("all");
  const [port, setPort] = useState("all");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))).sort(),
    [rows]
  );

  const filtered = rows.filter(
    (r) =>
      (status === "all" || r.status === status) &&
      (port === "all" || r.port === port) &&
      (category === "all" || r.category === category)
  );
  const tonnes = filtered.reduce((s, r) => s + (r.weightMt ?? 0), 0);

  const select =
    "bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs font-body-md text-[13px] text-on-surface";

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center gap-sm">
        <select className={select} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">All statuses</option>
          <option value="waiting">At anchorage</option>
          <option value="berthed">At berth</option>
        </select>
        <select className={select} value={port} onChange={(e) => setPort(e.target.value)} aria-label="Port">
          <option value="all">Both ports</option>
          <option value="PQ">Port Qasim</option>
          <option value="KPT">Karachi Port</option>
        </select>
        <select
          className={select}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Cargo category"
        >
          <option value="all">All cargo</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="font-data-tabular text-data-tabular text-on-surface-variant ml-auto">
          {filtered.length} vessel{filtered.length === 1 ? "" : "s"} · {formatMt(tonnes)} MT
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant py-lg">
          No vessels match these filters.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-[13px] text-on-surface">
              <Head />
              <tbody>
                {filtered.slice(0, FREE_ROWS).map((r) => (
                  <Row key={r.visitKey} r={r} />
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > FREE_ROWS && (
            <GatedSection
              label={`See all ${filtered.length} vessels in port.`}
              sublabel="The full line-up, refreshed every night. Tell us what you cover."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-md text-[13px] text-on-surface">
                  <tbody>
                    {filtered.slice(FREE_ROWS).map((r) => (
                      <Row key={r.visitKey} r={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            </GatedSection>
          )}
        </>
      )}
    </div>
  );
}
