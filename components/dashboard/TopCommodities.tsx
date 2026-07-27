import Link from "next/link";
import { formatMt } from "@/lib/format";
import type { CategoryTotal } from "@/lib/data/commodityFlow";

const CATEGORY_ICONS: Record<string, string> = {
  Coal: "mode_heat",
  Petroleum: "oil_barrel",
  "LPG / LNG": "local_gas_station",
  Oilseeds: "grass",
  "Edible Oil": "water_drop",
  Containers: "inventory_2",
  "Cement & Clinker": "architecture",
  Chemicals: "science",
  Steel: "construction",
  "Food & Agri": "eco",
  Minerals: "diamond",
  "General Cargo": "package_2",
  "Project Cargo": "precision_manufacturing",
};

const ACCENT_CLASSES = ["border-secondary", "border-primary", "border-tertiary-fixed-dim"];

export function TopCommodities({ categories }: { categories: CategoryTotal[] }) {
  const shown = categories.filter((cat) => cat.totalMt > 0);

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-md text-headline-md">Top Commodities</h3>
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase whitespace-nowrap">
          Tap for trend
        </span>
      </div>
      {shown.map((cat, i) => (
        <Link
          key={cat.category}
          href={`/market-trends?category=${encodeURIComponent(cat.category)}`}
          className={`bg-surface-container-lowest p-md rounded-xl shadow-sm border-l-4 ${
            ACCENT_CLASSES[i % ACCENT_CLASSES.length]
          } flex items-center gap-md hover:translate-x-1 hover:shadow-md transition-all cursor-pointer`}
        >
          <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center text-on-secondary-container shrink-0">
            <span className="material-symbols-outlined">
              {CATEGORY_ICONS[cat.category] ?? "category"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center gap-sm">
              <p className="font-headline-sm text-headline-sm truncate">{cat.category}</p>
              <span className="font-data-tabular text-data-tabular text-on-surface whitespace-nowrap">
                {formatMt(cat.totalMt)} MT
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline">chevron_right</span>
        </Link>
      ))}
    </div>
  );
}
