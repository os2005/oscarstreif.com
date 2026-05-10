import type { ProjectModuleSharedPageProps } from "@/lib/project-modules/types";
import { readWgProjectDashboardStore } from "./data/store";
import { WgProjectDashboardClient } from "./components/WgProjectDashboardClient";

export function WgProjectDashboardSharedPage({
  backHref,
  backLabel,
  isDark,
  pathLabel,
  project,
  viewer,
}: ProjectModuleSharedPageProps) {
  const store = readWgProjectDashboardStore();

  return (
    <WgProjectDashboardClient
      backHref={backHref}
      backLabel={backLabel}
      initialProjects={store.projects}
      isDark={isDark}
      pathLabel={pathLabel}
      projectDescription={project.description}
      projectTitle={project.title}
      viewerEmail={viewer?.email ?? null}
      viewerRole={viewer?.role ?? null}
    />
  );
}
