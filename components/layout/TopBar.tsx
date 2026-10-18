"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { NAV_ITEMS } from "@/components/layout/Sidebar";

const TOP_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 print:hidden bg-surface-container-lowest border-b border-outline-variant">
      <div className="h-14 flex items-center justify-end gap-lg lg:gap-xl px-md lg:px-xl">
        {/* The sidebar is hidden below lg; its logo and pages move up here. */}
        <div className="lg:hidden mr-auto">
          <Logo />
        </div>
        {TOP_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${
                link.href === "/" ? "hidden lg:inline " : ""
              }font-label-caps text-label-caps uppercase tracking-wide transition-colors ${
                active ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <nav className="lg:hidden flex gap-xs overflow-x-auto px-md pb-sm">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-xs px-md py-xs rounded-full font-label-caps text-label-caps uppercase ${
                active
                  ? "bg-surface-container text-primary font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
