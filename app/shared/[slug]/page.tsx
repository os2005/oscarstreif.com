import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { ProjectRedirectScreen } from "@/components/ProjectRedirectScreen";
import { ProjectShowcase } from "@/components/ProjectShowcase";
import { ShaderGradientBackground } from "@/components/ShaderGradientBackground";
import { getCurrentUser } from "@/lib/auth";
import { getProjectAccessDecision } from "@/lib/project-access";
import { resolveProjectModule } from "@/lib/project-modules/resolve-project-module";
import { getSafeExternalRedirectUrl } from "@/lib/project-redirect-url";
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

  if (externalRedirectUrl) {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-black text-white">
        <ShaderGradientBackground />
        <Header variant="landing" />
        <ProjectRedirectScreen externalUrl={externalRedirectUrl} projectTitle={project.title} />
      </main>
    );
  }

  const projectModule = resolveProjectModule(project);
  const isDark = project.visibility !== "open";
  const headerVariant = isDark ? "dark" : "light";
  const backHref =
    project.visibility === "private" ? "/private" : project.visibility === "shared" ? "/shared" : "/projects";
  const backLabel =
    project.visibility === "private"
      ? "Back to private workspace"
      : project.visibility === "shared"
        ? "Back to shared area"
        : "Back to overview";

  if (projectModule) {
    const SharedPage = projectModule.SharedPage;

    return (
      <main className={isDark ? "min-h-dvh bg-ink text-paper" : "min-h-dvh bg-paper text-ink"}>
        <Header variant={headerVariant} />
        <SharedPage
          backHref={backHref}
          backLabel={backLabel}
          isDark={isDark}
          pathLabel={project.sharedPath}
          project={project}
          viewer={user}
        />
      </main>
    );
  }

  return (
    <main className={isDark ? "min-h-dvh bg-ink text-paper" : "min-h-dvh bg-paper text-ink"}>
      <Header variant={headerVariant} />
      <ProjectShowcase
        backHref={backHref}
        backLabel={backLabel}
        isDark={isDark}
        pathLabel={project.sharedPath}
        project={project}
      />
    </main>
  );
}
