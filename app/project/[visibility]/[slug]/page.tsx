import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied";
import { Header } from "@/components/Header";
import { ProjectShowcase } from "@/components/ProjectShowcase";
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
      canonical: `https://oscarstreif.com${visibility === "shared" ? project.sharedPath : project.path}`,
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

  if (visibility === "shared") {
    redirect(project.sharedPath);
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
      <ProjectShowcase backHref={overviewPath} backLabel="Back to overview" isDark={isDark} pathLabel={project.path} project={project} />
    </main>
  );
}
