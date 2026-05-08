"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeroScrambleText } from "./HeroScrambleText";

export function ProjectRedirectScreen({
  externalUrl,
  projectTitle,
}: {
  externalUrl: string;
  projectTitle: string;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    const durationMs = 1800;

    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        window.clearInterval(intervalId);
        window.location.replace(externalUrl);
      }
    }, 32);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [externalUrl]);

  return (
    <section className="relative z-10 flex min-h-[calc(100dvh-88px)] items-center justify-center px-6 py-20">
      <div className="w-full max-w-4xl rounded-[2.5rem] border border-paper/12 bg-white/[0.05] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/52">Shared project link</p>
        <div className="mt-8 max-w-3xl">
          <h1 className="font-display text-[clamp(3rem,6vw,5.6rem)] leading-[0.92] text-paper">
            <HeroScrambleText
              parts={[
                { text: "Redirecting you to " },
                { text: projectTitle, highlighted: true },
              ]}
            />
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/72">
            Taking you to the project. You are leaving the internal preview surface and opening the external destination.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
          <div>
            <div className="h-3 overflow-hidden rounded-full border border-paper/12 bg-black/35">
              <div className="redirect-progress-bar h-full rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-paper/54">
              <span>Preparing handoff</span>
              <span>{progress}%</span>
            </div>
          </div>

          <div className="flex items-end justify-center">
            <div className="redirect-rocket-wrap">
              <div className="redirect-rocket-trail" />
              <div className="redirect-rocket">
                <span className="redirect-rocket-window" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex rounded-full border border-paper/18 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-paper transition hover:border-paper/40 hover:bg-white/6"
            href={externalUrl}
          >
            Continue manually
          </Link>
          <p className="text-sm text-paper/52">{externalUrl}</p>
        </div>
      </div>
    </section>
  );
}
