"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TOP_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 h-14 flex items-center justify-end gap-xl px-xl bg-surface-container-lowest border-b border-outline-variant">
      {TOP_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`font-label-caps text-label-caps uppercase tracking-wide transition-colors ${
              active ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </header>
  );
}
