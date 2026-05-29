/* eslint-disable @next/next/no-img-element */

import type { ProjectModuleSharedPageProps } from "@/lib/project-modules/types";

export function GrowSponsoringSharedPage({ project, viewer }: ProjectModuleSharedPageProps) {
  return (
    <main
      className="min-h-dvh bg-[#f6f1e5] text-[#172018]"
      style={{
        fontFamily:
          "Aptos, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <header className="border-b border-[#172018]/10 bg-[#fbf7ed]/84 px-5 py-4 backdrop-blur md:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#172018] text-sm font-black text-[#d7ff71]">
              GS
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#65705f]">Sponsor cockpit</p>
              <p className="text-base font-black tracking-tight">{project.title}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#65705f] sm:flex">
            <span>{project.visibility}</span>
            <span className="h-1 w-1 rounded-full bg-[#9aaa91]" />
            <span>{viewer?.email ?? "authorized"}</span>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-73px)] w-full max-w-7xl gap-8 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-stretch">
        <div className="flex flex-col justify-between rounded-[30px] bg-[#172018] p-6 text-white shadow-[0_28px_80px_rgba(23,32,24,0.18)] md:p-9">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#d7ff71]">Partnership operations</p>
            <h1 className="mt-5 max-w-3xl text-[clamp(3rem,7vw,6.5rem)] font-black leading-[0.88] tracking-tight">
              Sponsor work without the fog.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 md:text-lg">{project.description}</p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["24", "active leads"],
              ["7", "warm intros"],
              ["3", "decks updated"],
            ].map(([value, label]) => (
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4" key={label}>
                <p className="text-3xl font-black text-[#d7ff71]">{value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/48">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          {project.previewImage ? (
            <img
              alt={`${project.title} preview`}
              className="min-h-[260px] w-full rounded-[30px] object-cover shadow-[0_24px_70px_rgba(23,32,24,0.12)]"
              src={project.previewImage}
            />
          ) : null}

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">
            <article className="rounded-[26px] border border-[#172018]/10 bg-white/72 p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6f7b64]">Relationship flow</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight">Next move first.</h2>
              <p className="mt-3 text-sm leading-7 text-[#4e5b4a]">
                Every sponsor card should answer one question immediately: wait, follow up, ask for an intro, or send
                material.
              </p>
            </article>

            <article className="rounded-[26px] border border-[#172018]/10 bg-white/72 p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6f7b64]">Material readiness</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight">Pitch assets stay close.</h2>
              <p className="mt-3 text-sm leading-7 text-[#4e5b4a]">
                Tags, notes, deck status and context live in one sponsor surface instead of scattered message threads.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
