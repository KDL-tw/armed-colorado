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
    <footer className="mt-auto border-t border-silver/15 bg-navy-deep">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="font-display text-2xl text-cream">Armed Colorado</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-silver-muted">
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
      <div className="silver-rule mx-auto max-w-6xl" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-silver-muted">
        <span>© {new Date().getFullYear()} Armed Colorado</span>
        <Link href="/admin" className="hover:text-silver">
          Admin
        </Link>
      </div>
    </footer>
  );
}
