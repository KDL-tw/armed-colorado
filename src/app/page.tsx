import Link from "next/link";
import { PolygonalColoradoField } from "@/components/PolygonalColoradoField";

export default function HomePage() {
  return (
    <main className="relative flex min-h-[100svh] flex-col bg-white">
      <section className="relative flex min-h-[100svh] flex-1 flex-col justify-end overflow-hidden pb-16 pt-28 md:pb-24">
        <PolygonalColoradoField intensity="full" />

        <div className="relative z-10 w-full">
          {/* Full-bleed lateral gunmetal text bar */}
          <div className="w-full bg-[#4a5562]/85 px-4 py-8 backdrop-blur-[2px] md:py-10">
            <div className="mx-auto w-full max-w-6xl">
              <p className="animate-fade font-display text-5xl tracking-tight text-white md:text-7xl lg:text-8xl">
                Armed Colorado
              </p>
              <h1 className="sr-only">Armed Colorado</h1>
              <p className="animate-rise mt-5 max-w-2xl text-lg text-white md:text-xl">
                Know the bills, the court fights, and the civic levers that shape
                Colorado firearms law.
              </p>
            </div>
          </div>

          {/* CTAs below the gray box */}
          <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-4 px-4 pt-6">
            <Link
              href="/billwatch"
              className="animate-rise-delay bg-oxblood px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-oxblood-deep"
            >
              Open Billwatch
            </Link>
            <Link
              href="/legislators"
              className="animate-rise-delay border-2 border-navy bg-white/90 px-6 py-3 text-sm font-semibold tracking-wide text-navy transition hover:border-amber hover:text-amber-deep"
            >
              Find legislators
            </Link>
            <Link
              href="/litigation"
              className="animate-rise-delay border-2 border-navy bg-white/90 px-6 py-3 text-sm font-semibold tracking-wide text-navy transition hover:border-amber hover:text-amber-deep"
            >
              Litigation tracker
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
