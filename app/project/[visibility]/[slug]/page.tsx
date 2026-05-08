/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { findProjectByVisibilityAndSlug } from "@/lib/projects";
import type { ProjectVisibility } from "@/lib/project-types";

type ProjectPageProps = {
  params: Promise<{
    visibility: string;
    slug: string;
  }>;
};

function isVisibility(value: string): value is ProjectVisibility {
  return value === "private" || value === "shared" || value === "open";
}

function getOverviewPath(visibility: ProjectVisibility) {
  if (visibility === "open") {
    return "/projects";
  }

  return `/${visibility}`;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { visibility, slug } = await params;

  if (!isVisibility(visibility)) {
    return {};
  }

  const project = findProjectByVisibilityAndSlug(visibility, slug);

  if (!project || project.status !== "active") {
    return {};
  }

  return {
    title: project.title,
    description: project.description,
    alternates: {
      canonical: `https://oscarstreif.com${project.path}`,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { visibility, slug } = await params;

  if (!isVisibility(visibility)) {
    notFound();
  }

  const project = findProjectByVisibilityAndSlug(visibility, slug);

  if (!project || project.status !== "active") {
    notFound();
  }

  if (visibility !== "open") {
    const user = await getCurrentUser();

    if (!user) {
      redirect(`/login?next=${encodeURIComponent(project.path)}`);
    }

    if (visibility === "private" && user.role !== "admin") {
      return <AccessDenied />;
    }
  }

  const isDark = visibility !== "open";
  const overviewPath = getOverviewPath(visibility);

  return (
    <main className={isDark ? "min-h-dvh bg-ink text-paper" : "min-h-dvh bg-paper text-ink"}>
      <Header variant={isDark ? "dark" : "light"} />
      <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-14 md:px-8 md:pt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className={isDark ? "font-mono text-xs uppercase tracking-[0.28em] text-paper/48" : "font-mono text-xs uppercase tracking-[0.28em] text-ink/46"}>
              {visibility} project
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-6xl leading-[0.92] md:text-8xl">{project.title}</h1>
            <p className={isDark ? "mt-8 max-w-3xl text-lg leading-8 text-paper/72" : "mt-8 max-w-3xl text-lg leading-8 text-ink/70"}>
              {project.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                  isDark ? "border-paper/14 text-paper/56" : "border-ink/12 text-ink/52"
                }`}
              >
                {project.visibility}
              </span>
              <span
                className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                  isDark ? "border-paper/14 text-paper/56" : "border-ink/12 text-ink/52"
                }`}
              >
                {project.status}
              </span>
              {project.tags.map((tag) => (
                <span
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                    isDark ? "border-paper/14 text-paper/56" : "border-ink/12 text-ink/52"
                  }`}
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <aside
            className={`rounded-[2rem] border p-6 ${
              isDark ? "border-paper/12 bg-white/[0.045]" : "border-ink/12 bg-white/65"
            }`}
          >
            <p className={isDark ? "font-mono text-[11px] uppercase tracking-[0.2em] text-paper/48" : "font-mono text-[11px] uppercase tracking-[0.2em] text-ink/46"}>
              Registry
            </p>
            <p className="mt-4 text-sm leading-7">{project.path}</p>
            <Link
              className={`mt-8 inline-flex rounded-full border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition ${
                isDark
                  ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6"
                  : "border-ink/14 text-ink hover:border-accent/40 hover:bg-accent/5"
              }`}
              href={overviewPath}
            >
              Back to overview
            </Link>
          </aside>
        </div>

        <div
          className={`mt-12 overflow-hidden rounded-[2.25rem] border ${
            isDark ? "border-paper/12 bg-white/[0.045]" : "border-ink/12 bg-white/70"
          }`}
        >
          {project.previewImage ? (
            <img alt={`${project.title} preview`} className="h-auto w-full object-cover" src={project.previewImage} />
          ) : (
            <div className="flex min-h-[24rem] items-center justify-center bg-gradient-to-br from-accent/20 via-transparent to-ink/10">
              <span className={isDark ? "font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50" : "font-mono text-[11px] uppercase tracking-[0.2em] text-ink/46"}>
                Preview pending
              </span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
