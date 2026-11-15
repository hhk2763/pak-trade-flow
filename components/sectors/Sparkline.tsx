import type { MonthPoint } from "@/lib/data/vesselCalls";
import { formatMonth } from "@/lib/format";

// Monthly columns, drawn as plain SVG on the server: no client JS for a mark
// this small. Incomplete months (the current one, or months with missing
// reports) are drawn lighter so a short month is never mistaken for a fall.
export function Sparkline({
  points,
  width = 168,
  height = 40,
}: {
  points: MonthPoint[];
  width?: number;
  height?: number;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const gap = 2;
  const barW = Math.max(2, (width - gap * (points.length - 1)) / points.length);
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Monthly volume, ${formatMonth(first?.month ?? "")} to ${formatMonth(
        last?.month ?? ""
      )}`}
      className="block"
    >
      <line x1={0} y1={height - 0.5} x2={width} y2={height - 0.5} stroke="#c6c6cd" strokeWidth={1} />
      {points.map((p, i) => {
        const h = p.value > 0 ? Math.max(1.5, (p.value / max) * (height - 3)) : 0;
        return (
          <rect
            key={p.month}
            x={i * (barW + gap)}
            y={height - 1 - h}
            width={barW}
            height={h}
            rx={Math.min(1.5, barW / 2)}
            fill={p.complete ? "#00897b" : "#9fd3cc"}
          />
        );
      })}
    </svg>
  );
}
