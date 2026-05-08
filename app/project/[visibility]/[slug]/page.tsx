import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectAccessDecision } from "@/lib/project-access";
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

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { visibility, slug } = await params;

  if (!isVisibility(visibility)) {
    return {};
  }

  const project = findProjectByVisibilityAndSlug(visibility, slug);

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

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { visibility, slug } = await params;

  if (!isVisibility(visibility)) {
    notFound();
  }

  const project = findProjectByVisibilityAndSlug(visibility, slug);

  if (!project || project.status !== "active") {
    notFound();
  }

  redirect(project.sharedPath);
}
