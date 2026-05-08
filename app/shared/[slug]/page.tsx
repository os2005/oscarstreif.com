import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied";
import { Header } from "@/components/Header";
import { ProjectRedirectScreen } from "@/components/ProjectRedirectScreen";
import { ProjectShowcase } from "@/components/ProjectShowcase";
import { ShaderGradientBackground } from "@/components/ShaderGradientBackground";
import { getCurrentUser } from "@/lib/auth";
import { findProjectBySlug } from "@/lib/projects";

type SharedProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: SharedProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = findProjectBySlug(slug);

  if (!project || project.status !== "active") {
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

  if (project.visibility === "private") {
    const user = await getCurrentUser();

    if (!user) {
      redirect(`/login?next=${encodeURIComponent(project.sharedPath)}`);
    }

    if (user.role !== "admin") {
      return <AccessDenied />;
    }
  }

  if (project.externalRedirectUrl) {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-black text-white">
        <ShaderGradientBackground />
        <Header variant="landing" />
        <ProjectRedirectScreen externalUrl={project.externalRedirectUrl} projectTitle={project.title} />
      </main>
    );
  }

  return (
    <main className={project.visibility === "open" ? "min-h-dvh bg-paper text-ink" : "min-h-dvh bg-ink text-paper"}>
      <Header variant={project.visibility === "open" ? "light" : "dark"} />
      <ProjectShowcase
        backHref={project.visibility === "private" ? "/private" : project.visibility === "open" ? "/projects" : "/"}
        backLabel={
          project.visibility === "private"
            ? "Back to control center"
            : project.visibility === "open"
              ? "Back to overview"
              : "Back to site"
        }
        isDark={project.visibility !== "open"}
        pathLabel={project.sharedPath}
        project={project}
      />
    </main>
  );
}
