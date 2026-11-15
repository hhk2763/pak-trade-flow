import { formatPct } from "@/lib/format";

// A percentage change with its direction spelled out by an icon as well as
// colour, so it still reads in greyscale and for colour-blind readers.
export function Delta({
  pct,
  label,
  basis,
}: {
  pct: number | null;
  label: string;
  basis?: string | null;
}) {
  if (pct == null) {
    return (
      <span
        className="font-data-tabular text-data-tabular text-outline whitespace-nowrap"
        title={basis ?? "No comparable prior period"}
      >
        n/a {label}
      </span>
    );
  }
  const up = pct >= 0;
  return (
    <span
      className={`font-data-tabular text-data-tabular inline-flex items-center gap-0.5 whitespace-nowrap ${
        up ? "text-secondary" : "text-error"
      }`}
      title={basis ?? undefined}
    >
      <span className="material-symbols-outlined text-[14px]" aria-hidden>
        {up ? "arrow_upward" : "arrow_downward"}
      </span>
      {formatPct(pct)} {label}
      {basis ? <sup className="text-outline ml-0.5">PQ</sup> : null}
    </span>
  );
}
