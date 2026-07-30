import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-[100svh] flex-col">
      <section className="hero-atmosphere relative flex min-h-[100svh] flex-1 flex-col justify-end overflow-hidden px-4 pb-16 pt-28 md:pb-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c5cad3' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <p className="animate-fade font-display text-5xl tracking-tight text-cream md:text-7xl lg:text-8xl">
            Armed Colorado
          </p>
          <h1 className="sr-only">Armed Colorado</h1>
          <p className="animate-rise mt-5 max-w-xl text-lg text-silver md:text-xl">
            Know the bills, the court fights, and the civic levers that shape
            Colorado firearms law.
          </p>
          <div className="animate-rise-delay mt-10 flex flex-wrap gap-4">
            <Link
              href="/billwatch"
              className="bg-oxblood px-6 py-3 text-sm font-semibold tracking-wide text-cream transition hover:bg-oxblood-deep"
            >
              Open Billwatch
            </Link>
            <Link
              href="/legislators"
              className="border border-silver/40 px-6 py-3 text-sm font-semibold tracking-wide text-cream transition hover:border-amber hover:text-amber"
            >
              Find legislators
            </Link>
            <Link
              href="/litigation"
              className="border border-silver/40 px-6 py-3 text-sm font-semibold tracking-wide text-cream transition hover:border-amber hover:text-amber"
            >
              Litigation tracker
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
