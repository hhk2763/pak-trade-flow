"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/commodity-flows", label: "Commodity Flows", icon: "oil_barrel" },
  { href: "/market-trends", label: "Market Trends", icon: "trending_up" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex flex-col border-r border-outline-variant">
      <div className="px-lg py-xl flex items-center gap-sm">
        <Logo />
      </div>
      <nav className="flex-1 px-md space-y-xs">
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
    </aside>
  );
}
