"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/billwatch", label: "Billwatch" },
  { href: "/litigation", label: "Litigation" },
  { href: "/sb25-003", label: "SB25-003" },
  { href: "/resources", label: "Resources" },
  { href: "/alerts", label: "Alerts" },
  { href: "/events", label: "Events" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <header className="border-b border-white/10 bg-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-display text-lg text-white">
            Armed Colorado Admin
          </Link>
          <Link href="/" className="text-sm text-silver hover:text-amber">
            ← Public site
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-white md:text-2xl"
        >
          Armed Colorado
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "text-amber"
                  : "text-cream hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="text-sm text-white md:hidden"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </div>
      {open && (
        <div className="border-t border-white/15 bg-navy px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-cream"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
