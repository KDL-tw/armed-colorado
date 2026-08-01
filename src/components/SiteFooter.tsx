import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/vote", label: "Register to vote" },
  { href: "/legislators", label: "Find legislators" },
  { href: "/statutes", label: "Colorado statutes" },
  { href: "/concealed-carry", label: "Concealed carry" },
  { href: "/self-defense", label: "Self-defense" },
  { href: "/testify", label: "How to testify" },
  { href: "/gun-trusts", label: "Gun trusts" },
  { href: "/restore-rights", label: "Restore rights" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-navy/10 bg-navy text-cream">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-oxblood"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 bg-amber"
        aria-hidden
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="font-display text-2xl text-cream">Armed Colorado</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-silver">
            A reference hub for Colorado firearms law, legislation, litigation,
            and civic action. Not legal advice — verify with official sources
            and counsel.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-silver transition-colors hover:text-amber"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-5 text-xs text-silver-muted">
        <span>© {new Date().getFullYear()} Armed Colorado</span>
        <Link href="/admin" className="hover:text-silver">
          Admin
        </Link>
      </div>
    </footer>
  );
}
