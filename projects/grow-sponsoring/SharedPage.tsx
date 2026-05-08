/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type { ProjectModuleSharedPageProps } from "@/lib/project-modules/types";

export function GrowSponsoringSharedPage({
  backHref,
  backLabel,
  isDark,
  pathLabel,
  project,
  viewer,
}: ProjectModuleSharedPageProps) {
  const surface = isDark ? "border-paper/12 bg-white/[0.045] text-paper" : "border-ink/12 bg-white/70 text-ink";
  const muted = isDark ? "text-paper/68" : "text-ink/68";
  const pill = isDark ? "border-paper/14 text-paper/56" : "border-ink/12 text-ink/54";
  const secondaryButton = isDark
    ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6"
    : "border-ink/14 text-ink hover:border-accent/40 hover:bg-accent/5";

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-14 md:px-8 md:pt-20">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={`rounded-[2.2rem] border p-8 md:p-10 ${surface}`}>
          <p className={isDark ? "font-mono text-[11px] uppercase tracking-[0.22em] text-paper/46" : "font-mono text-[11px] uppercase tracking-[0.22em] text-ink/46"}>
            Internal project module
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(3.5rem,8vw,6.5rem)] leading-[0.92]">
            {project.title}
          </h1>
          <p className={`mt-6 max-w-3xl text-lg leading-8 ${muted}`}>{project.description}</p>

          <div className="mt-8 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${pill}`}>
              {project.visibility}
            </span>
            <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${pill}`}>
              {project.status}
            </span>
            {project.tags.map((tag) => (
              <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${pill}`} key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article className={isDark ? "rounded-[1.6rem] border border-paper/10 bg-black/18 p-5" : "rounded-[1.6rem] border border-ink/10 bg-paper/70 p-5"}>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Relationship flow
              </p>
              <p className={`mt-4 text-sm leading-7 ${muted}`}>
                This module is the project-specific surface for sponsor pipeline context, materials and next-step clarity.
              </p>
            </article>
            <article className={isDark ? "rounded-[1.6rem] border border-paper/10 bg-black/18 p-5" : "rounded-[1.6rem] border border-ink/10 bg-paper/70 p-5"}>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Shared access
              </p>
              <p className={`mt-4 text-sm leading-7 ${muted}`}>
                {viewer ? `This visit is resolved for ${viewer.email}.` : "This project is currently being viewed through the shared project route."}
              </p>
            </article>
          </div>
        </div>

        <aside className={`rounded-[2.2rem] border p-6 ${surface}`}>
          <p className={isDark ? "font-mono text-[11px] uppercase tracking-[0.2em] text-paper/46" : "font-mono text-[11px] uppercase tracking-[0.2em] text-ink/46"}>
            Module registry
          </p>
          <p className="mt-4 text-sm leading-7">{pathLabel}</p>
          <div className="mt-6 space-y-3">
            <Link
              className={`inline-flex rounded-full border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition ${secondaryButton}`}
              href={backHref}
            >
              {backLabel}
            </Link>
          </div>
          {project.previewImage ? (
            <img alt={`${project.title} preview`} className="mt-8 rounded-[1.5rem] border border-paper/10 object-cover" src={project.previewImage} />
          ) : null}
        </aside>
      </div>
    </section>
  );
}
