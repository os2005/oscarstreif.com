import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProjectExitButton } from "@/components/ProjectExitButton";
import { ProjectRedirectScreen } from "@/components/ProjectRedirectScreen";
import { getCurrentUser } from "@/lib/auth";
import { getProjectAccessDecision } from "@/lib/project-access";
import { resolveProjectModule } from "@/lib/project-modules/resolve-project-module";
import { getSafeExternalRedirectUrl } from "@/lib/project-redirect-url";
import { findProjectBySlug } from "@/lib/projects";
import type { ProjectRecord } from "@/lib/project-types";

type SharedProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getProjectExitHref(project: Pick<ProjectRecord, "visibility">) {
  if (project.visibility === "private") {
    return "/private";
  }

  if (project.visibility === "shared") {
    return "/shared";
  }

  return "/projects";
}

function MissingProjectModulePage({ project }: { project: ProjectRecord }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f5f5f7] px-6 py-20 text-neutral-950">
      <section className="w-full max-w-xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Project runtime</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">Project module missing</h1>
        <p className="mt-4 text-sm leading-7 text-neutral-600">
          The active project record for <span className="font-medium text-neutral-950">{project.title}</span> exists, but no
          registered project module was found for the slug{" "}
          <span className="font-medium text-neutral-950">{project.slug}</span>.
        </p>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: SharedProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = findProjectBySlug(slug);

  if (!project || project.status !== "active") {
    return {};
  }

  const user = await getCurrentUser();
  const accessDecision = getProjectAccessDecision(project, user);

  if (accessDecision.kind !== "allowed") {
    return {};
  }

  return {
    title: project.title,
    description: project.description,
    alternates: {
      canonical: `https://oscarstreif.com${project.sharedPath}`,
    },
  };
}

export default async function SharedProjectPage({ params }: SharedProjectPageProps) {
  const { slug } = await params;
  const project = findProjectBySlug(slug);

  if (!project || project.status !== "active") {
    notFound();
  }

  const user = await getCurrentUser();
  const accessDecision = getProjectAccessDecision(project, user);

  if (accessDecision.kind === "login-required") {
    redirect(`/login?next=${encodeURIComponent(accessDecision.next)}`);
  }

  if (accessDecision.kind === "denied") {
    notFound();
  }

  const externalRedirectUrl = getSafeExternalRedirectUrl(project.externalRedirectUrl);
  const exitHref = getProjectExitHref(project);

  if (externalRedirectUrl) {
    return (
      <div className="min-h-dvh bg-black text-white" data-project-site-root="true">
        <ProjectRedirectScreen externalUrl={externalRedirectUrl} projectTitle={project.title} />
        <ProjectExitButton href={exitHref} />
      </div>
    );
  }

  const projectModule = resolveProjectModule(project);

  if (projectModule) {
    const SharedPage = projectModule.SharedPage;

    return (
      <div data-project-site-root="true">
        <SharedPage project={project} viewer={user} />
        <ProjectExitButton href={exitHref} />
      </div>
    );
  }

  if (user?.role !== "admin") {
    notFound();
  }

  return (
    <div data-project-site-root="true">
      <MissingProjectModulePage project={project} />
      <ProjectExitButton href={exitHref} />
    </div>
  );
}
