"use client";

import Link from "next/link";

export default function SharedProjectError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-dvh bg-ink text-paper">
      <section className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-6 py-16 md:px-8">
        <div className="w-full rounded-[2.2rem] border border-paper/12 bg-white/[0.045] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.22)] md:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/46">Shared project</p>
          <h1 className="mt-4 font-display text-5xl leading-none md:text-6xl">This project could not be opened.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/72">
            Try again in a moment. If the problem continues, return to the shared area and reopen the project from
            there.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-paper/16 bg-paper px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink transition hover:bg-white"
              onClick={() => reset()}
              type="button"
            >
              Try again
            </button>
            <Link
              className="rounded-full border border-paper/16 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-paper transition hover:border-paper/40 hover:bg-white/6"
              href="/shared"
            >
              Back to shared area
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
