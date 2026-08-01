import Link from "next/link";

export function GuideLayout({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[70vh] bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12 md:pt-14">
        <p className="text-sm uppercase tracking-[0.2em] text-oxblood">
          Armed Colorado
        </p>
        <h1 className="mt-3 font-display text-4xl text-navy md:text-5xl">
          {title}
        </h1>
        {lede ? <p className="mt-4 text-lg text-muted">{lede}</p> : null}
        <div className="silver-rule my-8" />
        <div className="prose-guide">{children}</div>
        <p className="mt-12 text-sm text-muted">
          <Link href="/" className="font-medium text-oxblood hover:underline">
            ← Home
          </Link>
        </p>
      </div>
    </main>
  );
}
