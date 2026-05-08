import Link from "next/link";
import type { ProjectModuleSharedPageProps } from "@/lib/project-modules/types";

export function TemplateProjectSharedPage({
  backHref,
  backLabel,
  isDark,
  pathLabel,
  project,
}: ProjectModuleSharedPageProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-14 md:px-8 md:pt-20">
      <div className="rounded-[2.2rem] border border-paper/12 bg-white/[0.045] p-8 md:p-10">
        <p className={isDark ? "font-mono text-[11px] uppercase tracking-[0.22em] text-paper/48" : "font-mono text-[11px] uppercase tracking-[0.22em] text-ink/46"}>
          Template module
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none md:text-6xl">{project.title}</h1>
        <p className={isDark ? "mt-6 max-w-3xl text-lg leading-8 text-paper/72" : "mt-6 max-w-3xl text-lg leading-8 text-ink/72"}>
          Replace this shared page with your project-specific UI. The JSON project record still controls visibility,
          access, redirects, tags and runtime configuration.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className={`rounded-full border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition ${
              isDark ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6" : "border-ink/14 text-ink hover:border-accent/40 hover:bg-accent/5"
            }`}
            href={backHref}
          >
            {backLabel}
          </Link>
          <span
            className={`rounded-full border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] ${
              isDark ? "border-paper/16 text-paper/58" : "border-ink/14 text-ink/56"
            }`}
          >
            {pathLabel}
          </span>
        </div>
      </div>
    </section>
  );
}
