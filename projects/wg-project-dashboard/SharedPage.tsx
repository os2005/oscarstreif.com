import type { ProjectModuleSharedPageProps } from "@/lib/project-modules/types";
import { WgProjectDashboardClient } from "./components/WgProjectDashboardClient";
import { readWgProjectDashboardStore } from "./data/store";

export function WgProjectDashboardSharedPage({ project, viewer }: ProjectModuleSharedPageProps) {
  const store = readWgProjectDashboardStore();

  return (
    <WgProjectDashboardClient
      initialProjects={store.projects}
      projectDescription={project.description}
      projectTitle={project.title}
      projectVisibility={project.visibility}
      viewerEmail={viewer?.email ?? null}
    />
  );
}
