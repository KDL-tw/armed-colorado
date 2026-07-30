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
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-28">
      <p className="animate-fade text-sm uppercase tracking-[0.2em] text-amber">
        Armed Colorado
      </p>
      <h1 className="animate-rise mt-3 font-display text-4xl text-cream md:text-5xl">
        {title}
      </h1>
      {lede ? (
        <p className="animate-rise-delay mt-4 text-lg text-silver">{lede}</p>
      ) : null}
      <div className="silver-rule my-8" />
      <div className="prose-guide animate-fade">{children}</div>
      <p className="mt-12 text-sm text-silver-muted">
        <Link href="/" className="text-amber hover:underline">
          ← Home
        </Link>
      </p>
    </main>
  );
}
