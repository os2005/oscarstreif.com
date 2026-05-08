/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type { ProjectRecord } from "@/lib/project-types";

type ProjectGridProps = {
  projects: ProjectRecord[];
  theme?: "light" | "dark";
  emptyTitle: string;
  emptyDescription: string;
};

function ProjectPreview({ previewImage, title }: { previewImage: string; title: string }) {
  if (!previewImage) {
    return (
      <div className="flex h-52 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-accent/18 via-transparent to-ink/10 text-center">
        <span className="max-w-[14rem] font-mono text-[11px] uppercase tracking-[0.22em] text-current/55">
          Preview pending
        </span>
      </div>
    );
  }

  return <img alt={`${title} preview`} className="h-52 w-full rounded-[1.75rem] object-cover" src={previewImage} />;
}

function Label({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: "light" | "dark";
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
        theme === "dark" ? "border-paper/14 text-paper/58" : "border-ink/12 text-ink/52"
      }`}
    >
      {children}
    </span>
  );
}

export function ProjectGrid({
  projects,
  theme = "light",
  emptyTitle,
  emptyDescription,
}: ProjectGridProps) {
  const cardTheme =
    theme === "dark"
      ? "border-paper/12 bg-white/[0.045] text-paper shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
      : "border-ink/12 bg-white/60 text-ink shadow-[0_24px_60px_rgba(8,8,8,0.08)]";
  const copyTheme = theme === "dark" ? "text-paper/68" : "text-ink/68";
  const buttonTheme =
    theme === "dark"
      ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6"
      : "border-ink/14 text-ink hover:border-accent/40 hover:bg-accent/5";

  if (!projects.length) {
    return (
      <div
        className={`rounded-[2rem] border px-6 py-10 ${
          theme === "dark" ? "border-paper/12 bg-white/[0.035] text-paper" : "border-ink/12 bg-white/55 text-ink"
        }`}
      >
        <p className="font-display text-3xl leading-none">{emptyTitle}</p>
        <p className={`mt-4 max-w-2xl leading-7 ${copyTheme}`}>{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {projects.map((project) => (
        <article className={`rounded-[2rem] border p-5 ${cardTheme}`} key={project.id}>
          <ProjectPreview previewImage={project.previewImage} title={project.title} />
          <div className="mt-5 flex flex-wrap gap-2">
            <Label theme={theme}>{project.visibility}</Label>
            <Label theme={theme}>{project.status}</Label>
            {project.tags.slice(0, 2).map((tag) => (
              <Label key={tag} theme={theme}>
                {tag}
              </Label>
            ))}
          </div>
          <h3 className="mt-5 font-display text-4xl leading-none">{project.title}</h3>
          <p className={`mt-4 leading-7 ${copyTheme}`}>{project.description}</p>
          <div className="mt-6">
            <Link
              className={`inline-flex rounded-full border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition ${buttonTheme}`}
              href={project.visitPath}
            >
              Visit
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
