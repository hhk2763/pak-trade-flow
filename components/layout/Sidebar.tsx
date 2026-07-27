"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { formatMt } from "@/lib/format";
import type { PortComparison } from "@/lib/data/commodityFlow";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/commodity-flows", label: "Commodity Flows", icon: "oil_barrel" },
  { href: "/market-trends", label: "Market Trends", icon: "trending_up" },
];

const PORT_NAMES: Record<string, string> = {
  PQ: "Port Qasim",
  KPT: "Karachi Port Trust",
};

export function Sidebar({
  portComparison,
  latestReportDate,
}: {
  portComparison: PortComparison[];
  latestReportDate: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex flex-col border-r border-outline-variant">
      <div className="px-lg py-xl flex items-center gap-sm">
        <Logo />
      </div>
      <nav className="px-md space-y-xs">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-md px-md py-sm rounded-lg transition-all ${
                active
                  ? "bg-surface-container text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-body-md text-body-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 min-h-0 px-md pt-xl pb-md flex flex-col gap-sm overflow-y-auto">
        <span className="font-label-caps text-label-caps text-outline uppercase px-sm">
          Port Status
        </span>
        {portComparison.map((port) => (
          <div
            key={port.port}
            className="bg-surface-container-low rounded-lg p-md flex flex-col gap-sm"
          >
            <div className="flex items-center gap-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                {PORT_NAMES[port.port] ?? port.port}
              </span>
            </div>
            <div className="flex items-center justify-between font-data-tabular text-data-tabular text-on-surface-variant">
              <span>{formatMt(port.importMt)} MT in</span>
              <span>{formatMt(port.exportMt)} MT out</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-lg py-lg border-t border-outline-variant flex flex-col gap-sm">
        <DataFreshnessBadge latestReportDate={latestReportDate} />
        <span className="font-label-caps text-label-caps text-outline">
          PAK Trade Flow &copy; {new Date(latestReportDate || Date.now()).getUTCFullYear()}
        </span>
      </div>
    </aside>
  );
}
