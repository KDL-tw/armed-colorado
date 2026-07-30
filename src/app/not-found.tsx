import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-4 pt-20">
      <p className="text-sm uppercase tracking-[0.2em] text-amber">404</p>
      <h1 className="mt-3 font-display text-4xl text-cream">Not found</h1>
      <p className="mt-4 text-silver">
        That page isn&apos;t here. Billwatch details appear only after Umbrella
        returns real bills.
      </p>
      <Link href="/" className="mt-8 text-amber underline">
        ← Home
      </Link>
    </main>
  );
}
